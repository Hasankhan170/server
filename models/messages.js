import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        chatbotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chatbot",
            required: true,
        },
        messages: [
            {
                text: { type: String, required: true },
                sender: { type: String, enum: ["user", "bot"], required: true, time: { type: Date, default: Date.now } },
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;