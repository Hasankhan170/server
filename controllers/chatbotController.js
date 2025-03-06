import puppeteer from "puppeteer";
import Chatbot from "../models/ChatBot.js";
import { index, pinecone } from "../config/pinecone.js";
import { cleanData, embedText, llm } from "../functions/chatbothelper.js";
import { errorHandler, successHandler } from "../utils/responseHandlers.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PromptTemplate } from "@langchain/core/prompts";
import Message from "../models/messages.js";

const createChatBot = async (req, res) => {
  try {
    const {
      name,
      tagline,
      webURL,
      userId,
      botPicUrl,
      prompt,
      greetingMessage,
      fallbackMessage,
    } = req.body;

    const chatBot = new Chatbot({
      name,
      tagline,
      createdBy: userId,
      webURL,
      PagesCrawled: 0,
      status: "pending",
      botPicUrl,
      prompt,
      greetingMessage,
      fallbackMessage,
    });

    await chatBot.save();

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    const allContent = [];
    const scrapedUrls = new Set();
    let pageCount = 0;

    async function scrapePage(url, depth = 0) {
      if (depth > 4 || scrapedUrls.has(url)) return;
      scrapedUrls.add(url);
      pageCount++;

      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });

        const content = await page.evaluate(() => {
          const targets = [
            "main",
            "article",
            ".content",
            "#main-content",
            "body",
          ];
          let extracted = "";
          for (const target of targets) {
            const elements = document.querySelectorAll(target);
            elements.forEach((el) => (extracted += el.innerText + "\n"));
            if (extracted) return extracted;
          }
          return "";
        });

        if (content) {
          const cleanedContent = cleanData(content);
          allContent.push(cleanedContent);
        }

        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll("a"))
            .map((a) => a.href)
            .filter((href) => href)
        );
        const baseUrl = new URL(url).origin;

        for (const link of links) {
          const absoluteLink = new URL(link, url).href;
          if (absoluteLink.startsWith(baseUrl)) {
            await scrapePage(absoluteLink, depth + 1);
          }
        }
      } catch (pageError) {
        console.error(`Error scraping ${url}:`, pageError);
      }
    }

    await scrapePage(webURL);
    await browser.close();

    const combinedContent = allContent.join("\n");

    if (combinedContent.trim()) {
      chatBot.PagesCrawled = pageCount;
      chatBot.status = "active";

      const indexName = `index-${Date.now()}`;
      console.log(`Creating new index: ${indexName}`);

      chatBot.indexName = indexName;
      await chatBot.save();

      await pinecone.createIndex({
        name: indexName,
        dimension: 384,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });

      console.log(`New index created: ${indexName}`);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const newIndex = pinecone.Index(indexName);

      console.log(`Initialized new index: ${indexName}`);

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.splitDocuments([
        { pageContent: combinedContent, metadata: {} },
      ]);

      for (const doc of splitDocs) {
        const embedding = await embedText(doc.pageContent);
        await newIndex.upsert([
          {
            id: `scraped-chunk-${chatBot._id}-${Date.now()}`,
            values: embedding,
            metadata: {
              text: doc.pageContent,
              source: "scraped",
              chatbotId: chatBot._id,
              index_name: indexName,
            },
          },
        ]);
      }

      console.log(`Data upserted into index: ${indexName}`);

      const promptTemplate = new PromptTemplate({
        template:
          "Generate 15 suggested questions based on the following context: {context}",
        inputVariables: ["context"],
      });

      const prompt = await promptTemplate.format({ context: combinedContent });
      const suggestedQuestionsResponse = await llm.invoke(prompt);
      const suggestedQuestions = suggestedQuestionsResponse.text
        .split("\n")
        .filter((q) => q.trim() !== "");

      return res.status(200).json({
        message: "Chat Bot created successfully.",
        pageCount,
        suggestedQuestions,
        status: "active",
        indexName,
      });
    }

    chatBot.status = "failed";
    await chatBot.save();
    return res.status(500).json({
      error:
        "No content was scraped. Check the website and your scraping logic.",
      status: "failed",
    });
  } catch (error) {
    console.error(error);
    await Chatbot.findOneAndUpdate(
      { webURL: req.body.webURL },
      { status: "failed" }
    );
    if (!res.headersSent) {
      return errorHandler(error.message, 500, res);
    }
  }
};

const deleteChatbot = async (req, res) => {
  try {
    const { chatbotId } = req.body;

    if (!chatbotId) {
      return errorHandler("ChatbotId is required.", 400, res);
    }

    const existingChatbot = await Chatbot.findById(chatbotId);

    if (!existingChatbot) {
      return errorHandler("Chatbot not found.", 404, res);
    }

    if (existingChatbot.indexName) {
      const indexName = existingChatbot.indexName;
      await pinecone.deleteIndex(indexName);
    }

    await Chatbot.findByIdAndDelete(chatbotId);
    await Message.deleteMany({ chatbotId });

    return res.status(200).json({
      message: "Chatbot deleted successfully.",
    });
  } catch (error) {
    return errorHandler(error.message, 500, res);
  }
};

const editChatBot = async (req, res) => {
  const { id } = req.params;
  const { name, tagline } = req.body;

  try {

    const chatbot = await Chatbot.findById(id);
    if (!chatbot) return res.status(404).json({ message: "Chatbot not found" });

    const updatedData = {
      name: name || chatbot.name,
      tagline: tagline || chatbot.tagline,
    };

    const updatedChatbot = await Chatbot.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({
      message: "Chatbot updated successfully",
      data: updatedChatbot,
    });

  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



const getSingleChatbot = async (req, res) => {
  try {
    const { id } = req.params;

    const chatbot = await Chatbot.findById(id);

    if (!chatbot) {
      return errorHandler("Chatbot not found", 404, res);
    }

    return res.status(200).json({
      message: "Chatbot fetched successfully.",
      chatbot,
    });
  } catch (error) {
    return errorHandler(error.message, 500, res);
  }
};

export { createChatBot, deleteChatbot, getSingleChatbot, editChatBot };