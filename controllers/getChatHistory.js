import Chatbot from "../models/ChatBot.js";

const getChatHistory = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, error: "User ID is required." });
        }

        const chatbots = await Chatbot.find({ createdBy: id });

        return res.status(200).json({
            success: true,
            message: "Chat history retrieved successfully.",
            data: chatbots,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
};

export default getChatHistory;