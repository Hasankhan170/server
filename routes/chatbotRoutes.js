import express from "express";
import getChatHistory from "../controllers/getChatHistory.js";
import askQuestion from "../controllers/askQuestion.js";
import {
  createChatBot,
  deleteChatbot,
  editChatBot,
  getSingleChatbot,
} from "../controllers/chatbotController.js";

import {
  deleteMessage,
  getMessagesByChatbotId,
} from "../controllers/messageController.js";


import toggleChatbotStatus from "../functions/toggleChatbotStatus.js";
import multer from "multer";
import { createChatBotFromPDF } from "../controllers/pdfController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/pdfScrape", upload.single("file"), createChatBotFromPDF);

router.post("/create", createChatBot);

router.delete("/delete", deleteChatbot);

router.post("/getchathistory", getChatHistory);

router.put("/edit/:id", editChatBot);

router.get("/ask", askQuestion);

router.get("/single/:id", getSingleChatbot);

router.get("/getmessages/:chatId", getMessagesByChatbotId);

router.post("/toggleChatbotStatus", toggleChatbotStatus);
router.delete("/deletemessage", deleteMessage);


export default router;
