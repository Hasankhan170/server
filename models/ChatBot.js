import mongoose from "mongoose";

const chatBotSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Chatbot name is required"] },
    tagline: { type: String, required: [true, "Chatbot tagline is required"] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserID is required"],
    },
    prompt: String,
    PagesCrawled: { type: String },
    status: {
      type: String,
      enum: ["active", "pending", "disabled", "failed"],
      default: "pending",
    },
    greetingMessage: String,
    fallbackMessage: String,
    webURL: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.dataSourceType === "URL") {
            return /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-./?%&=]*)?$/.test(v);
          }
          return true;
        },
        message: "Invalid URL format",
      },
    },
    pdfFile: { type: String, default: "False" },
    indexName: { type: String },
    botPicUrl: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Chatbot = mongoose.model("ChatBot", chatBotSchema);
export default Chatbot;