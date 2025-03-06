
import express from "express";
import passport from "passport";
import { loginSuccess,googleAuthCallback  } from "../controllers/google.js";  

const router = express.Router();


//open google oauth login page
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  
  //after complete autentication 
  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: process.env.CLIENT_URL + "/login" }),
    googleAuthCallback
  );
  
  router.get("/login/success", loginSuccess);


export default router;

