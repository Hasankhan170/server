import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let embedder;
const initializeEmbedder = async () => {
    const { pipeline } = await import("@xenova/transformers");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
};
initializeEmbedder();

const embedText = async (text) => {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
};

let memoryStorage = {};

const cleanData = (rawText) => {
    return rawText.trim().replace(/\n+/g, "\n").replace(/\s+/g, " ");
};

const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: "gemini-2.0-flash",
    streaming: true,
});

const saveToMemory = (chatbotId, question, answer) => {
    if (!memoryStorage[chatbotId]) {
        memoryStorage[chatbotId] = [];
    }
    memoryStorage[chatbotId].push({ question, answer });
};

const getHistoryFromMemory = (chatbotId) => {
    return memoryStorage[chatbotId] || [];
};

export { llm, embedText, cleanData, saveToMemory, getHistoryFromMemory };