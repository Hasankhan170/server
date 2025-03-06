import { chatbotValidationSchema } from "../Validators/chatbotValidation.js";

export const validateChatbot = (req, res, next) => {
    try {
        chatbotValidationSchema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ success: false, message: error.errors });
    }
};
