import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const { JWTKEY } = process.env;

export const signup = async (req, res, next) => {
    try {
        const { email, name, password } = req.body;
        const checkUser = await User.findOne({ email });
        if (checkUser) {
            return res.status(401).json({
                message: `${email} exists already, Please pick a different one`,
                success: false,
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });
        await user.save();
        return res.status(200).json({
            message: `Signup successfully`,
            result: true,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, Please try again",
            success: false,
            error,
        });
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(422).json({
                message: "Email is required!",
                success: false,
            });
        }
        if (!password) {
            return res.status(422).json({
                message: "Password is required!",
                success: false,
            });
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({
                message: `${email} not found!`,
                success: false,
            });
        }
        const matchPass = await bcrypt.compare(password, user.password);
        if (!matchPass) {
            return res.status(422).json({
                message: "Wrong password!",
                success: false,
            });
        }

        if (matchPass) {
            const userObj = user.toObject();
            delete userObj.password;
            const token = await jwt.sign({ _id: user._id }, JWTKEY, {
                expiresIn: "3d",
            });

            return res.status(200).json({
                message: "Login successfully",
                success: true,
                result: { token, ...userObj },
            });
        }
    } catch (error) {

        return res.status(500).json({
            message: "Login failed",
            success: false,
            error,
        });
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const token = req.params.token;
        const newPassword = req.body.password;
        const user = await User.findOne({ resetToken: token });
        if (!user) {
            return res.status(422).json({
                message: "Invalid otp!",
                success: false,
            });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await User.updateOne(
            { _id: user._id },
            { password: hashedPassword, resetToken: null }
        );
        return res.status(201).json({
            message: "Password has been changed successfully!",
            success: true,
            result: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong!",
            success: false,
            error,
        });
    }
};

export const resetPasswordLink = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "There is no account with that email address!",
            });
        }
        let otp = Math.floor(Math.random() * 10000 + 1);
        user.resetToken = otp;
        await user.save();
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            success: false,
            error,
        });
    }
};