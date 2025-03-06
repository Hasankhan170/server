import mongoose from "mongoose"

const { Schema } = mongoose

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required!"],
            trim: true,
            lowercase: true
        },
        email: {
            type: String,
            required: [true, "Email is required!"],
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: false,
        },
        google_id: {
            type: String,
            unique: true,
            sparse: true, 
          },
          provider: {
            type: String,
            enum: ["local", "google"], 
            default: "local",
          },
        resetToken: {
            type: Number,
            default: null,
            select: false
        },
        resetTokenExpiration: {
            type: Date,
            default: null,
            select: false
        },
        chatBots: [
            {
                type: String,
                ref: "ChatBot",
            },
        ],
    },
    { timestamps: true }
)

const User = mongoose.model("User", userSchema)

export default User