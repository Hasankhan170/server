import pdf from "pdf-parse";
import { PromptTemplate } from "@langchain/core/prompts";
import { pinecone } from "../config/pinecone.js";
import { embedText, llm } from "../functions/chatbothelper.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import Chatbot from "../models/ChatBot.js";

const extractPdfText = async (pdfBuffer) => {
    try {
        const data = await pdf(pdfBuffer);
        const text = data.text;

        const cleanText = text
            .replace(/\n{2,}/g, " ")
            .replace(/-\s+/g, "")
            .replace(/\s{2,}/g, " ")
            .replace(/\n/g, " ")
            .trim();

        return cleanText || "No text found in PDF.";
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        return "Error extracting text from PDF.";
    }
};

const createChatBotFromPDF = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const { name, tagline, userId, botPicUrl } = req.body;

        const chatBot = new Chatbot({
            name,
            tagline,
            createdBy: userId,
            PagesCrawled: 0,
            status: "pending",
            botPicUrl,
            pdfFile: "True",
            pdfFileUrl: req.file.path,
        });

        await chatBot.save();

        const fullText = await extractPdfText(req.file.buffer);
        if (fullText.includes("Error extracting text from PDF")) {
            chatBot.status = "failed";
            await chatBot.save();
            return res
                .status(400)
                .json({
                    error:
                        "PDF text extraction failed. The file might be image-based or corrupted.",
                });
        }

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
            { pageContent: fullText, metadata: {} },
        ]);

        for (const doc of splitDocs) {
            const embedding = await embedText(doc.pageContent);
            await newIndex.upsert([
                {
                    id: `pdf-chunk-${chatBot._id}-${Date.now()}`,
                    values: embedding,
                    metadata: {
                        text: doc.pageContent,
                        source: "pdf",
                        chatbotId: chatBot._id,
                        name: chatBot.name,
                        tagline: chatBot.tagline,
                        indexName: indexName,
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

        const prompt = await promptTemplate.format({ context: fullText });
        const suggestedQuestionsResponse = await llm.invoke(prompt);
        const suggestedQuestions = suggestedQuestionsResponse.text
            .split("\n")
            .filter((q) => q.trim() !== "");

        chatBot.status = "active";
        await chatBot.save();

        res.json({
            message: "PDF processed and data stored in Pinecone successfully.",
            suggestedQuestions,
            status: "active",
            indexName,
        });
    } catch (error) {
        console.error("Error processing PDF:", error);
        await Chatbot.findOneAndUpdate(
            { _id: req.body.chatbotId },
            { status: "failed" }
        );
        res.status(500).json({ error: "Error processing PDF." });
    }
};

export { createChatBotFromPDF };
