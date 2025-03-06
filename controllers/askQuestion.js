import { PromptTemplate } from "@langchain/core/prompts";
import { index, pinecone } from "../config/pinecone.js";
import {
  embedText,
  llm,
  saveToMemory,
  getHistoryFromMemory,
} from "../functions/chatbothelper.js";
import Message from "../models/messages.js";
import Chatbot from "../models/ChatBot.js";

const askQuestion = async (req, res) => {
  try {
    const { question, chatbotId } = req.query;

    if (!question || !chatbotId) {
      return res.status(400).json({ error: "Missing question or chatbotId." });
    }

    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found." });
    }

    let statusMessage = "";

    if (chatbot.status === "disabled") {
      statusMessage = "This chatbot is currently disabled.";
    } else if (chatbot.status === "pending") {
      statusMessage =
        "The chatbot is still being set up. Please try again in a moment.";
    } else if (chatbot.status === "failed") {
      statusMessage =
        "The chatbot is currently experiencing issues. Please try again later.";
    }

    if (statusMessage) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let currentIndex = 0;
      const delay = 100;

      const streamWords = async () => {
        const words = statusMessage.split(" ");

        while (currentIndex < words.length) {
          const word = words[currentIndex];
          res.write(`data: ${word}\n\n`);

          currentIndex++;

          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        res.write("data: [DONE]\n\n");
        res.end();
      };

      streamWords();

      await Message.findOneAndUpdate(
        { chatbotId },
        { $push: { messages: { text: question, sender: "user" } } },
        { upsert: true, new: true }
      );

      await Message.findOneAndUpdate(
        { chatbotId },
        { $push: { messages: { text: statusMessage, sender: "bot" } } },
        { upsert: true }
      );
      return;
    }

    console.log(
      `Received question: "${question}" for Chatbot ID: ${chatbotId}`
    );

    const indexName = chatbot.indexName;
    if (!indexName) {
      return res
        .status(404)
        .json({ error: "Index name not found for this chatbot." });
    }

    const index = pinecone.Index(indexName);

    const chatHistory = getHistoryFromMemory(chatbotId);
    const history = chatHistory
      .map((entry) => ` User: ${entry.question}\nBot: ${entry.answer}`)
      .join("\n");

    const questionEmbedding = await embedText(question);

    const queryResponse = await index.query({
      vector: questionEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    const filteredMatches = queryResponse.matches.filter(
      (match) => match.metadata.chatbotId === chatbotId
    );

    if (filteredMatches.length === 0) {
      return res
        .status(404)
        .json({ error: "No relevant data found for this chatbot." });
    }

    const context = filteredMatches
      .map((match) => match.metadata.text)
      .join("\n");

    const promptTemplate = new PromptTemplate({
      template: `
      You are highly intelligent and helpful AI assistant. Your primary role is to assist users with their queries using
      the provided knowledge base and chat history.
            
      Chat History:
      {history}

      If the question is related to a previously mentioned topic (like a mobile phone), remember that context. Otherwise, answer based 
      on the new information.

      Guidelines:
            - If the answer is available in the context or history, provide a clear and concise response.
            - If the context does not contain the answer, simply respond with: ${
              chatbot.fallbackMessage
                ? chatbot.fallbackMessage
                : "I couldn't find the answer in the provided context."
            }
            
            Answer the question: {question}
            Context: {context}`,
      inputVariables: ["question", "context", "history"],
    });

    const prompt = await promptTemplate.format({ question, context, history });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("Streaming response from AI...");

    const stream = await llm.stream(prompt);

    let cleanedAnswer = "";

    for await (const chunk of stream) {
      let text = typeof chunk === "string" ? chunk : chunk.text || "";

      cleanedAnswer += text;
      const words = text.split(" ");
      for (let word of words) {
        res.write(`data: ${word}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    const updatedUserDoc = await Message.findOneAndUpdate(
      { chatbotId },
      { $push: { messages: { text: question, sender: "user" } } },
      { upsert: true, new: true }
    );

    const userMessageId =
      updatedUserDoc.messages[updatedUserDoc.messages.length - 1]._id;

    const updatedBotDoc = await Message.findOneAndUpdate(
      { chatbotId },
      { $push: { messages: { text: cleanedAnswer, sender: "bot" } } },
      { upsert: true, new: true }
    );

    const botMessageId =
      updatedBotDoc.messages[updatedBotDoc.messages.length - 1]._id;

    res.write(
      `data: [DONE} ${JSON.stringify({ userMessageId, botMessageId })}\n\n`
    );
    res.end();

    saveToMemory(chatbotId, question, cleanedAnswer);
  } catch (error) {
    console.error("Error in askQuestion:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
export default askQuestion;
