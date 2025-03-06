import Message from "../models/messages.js";

export const getMessagesByChatbotId = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required." });
    }

    const messages = await Message.findOne({ chatbotId: chatId });

    if (!messages || messages.messages.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No messages found.", data: [] });
    }

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully.",
      data: messages.messages,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId, chatbotId } = req.query;

    const allMessages = await Message.findOne({ chatbotId });

    if (!allMessages) {
      return res
        .status(404)
        .json({ error: "No message found for this chatbot." });
    }
    // Find and delete the message
    const deletedMessage = await Message.updateOne(
      { chatbotId },
      { $pull: { messages: { _id: messageId } } }
    );

    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.status(200).json({ success: true, message: "Message deleted." });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};