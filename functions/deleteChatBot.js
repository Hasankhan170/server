import Chatbot from "../models/ChatBot.js";

const toggleChatbotStatus = async (req, res) => {
    try {
        const { chatBotId } = req.body;

        if (!chatBotId) {
            return res.status(400).json({ success: false, error: "ChatBot ID is required." });
        }

        const chatbot = await Chatbot.findById(chatBotId);
        if (!chatbot) {
            return res.status(404).json({ success: false, error: "ChatBot not found." });
        }

        return res.status(200).json({
            success: true,
            message: `ChatBot ${chatBotId} Deleted Succesfully.`,
            data: chatbot,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
};

export default toggleChatbotStatus;
