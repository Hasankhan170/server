import express from "express"
import { signup, login, resetPasswordLink, changePassword } from "../controllers/auth.js"
import signupValidator from "../Validators/signupValidator.js"
import loginValidator from "../Validators/loginValidator.js"
import validateData from "../validators/validateData.js"

const router = express.Router()

router.post('/signup', validateData(signupValidator), signup)

router.post("/login", validateData(loginValidator), login)

router.post("/resetPassword", resetPasswordLink)

router.patch("/updatePassword/:token", changePassword)

export default router;