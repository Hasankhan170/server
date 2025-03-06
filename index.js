import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import googleRoutes from "./routes/googleAuth.js";
import authRoutes from "./routes/auth.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import passport from "./functions/passport.js";
import session from "express-session";
import multer from "multer";

const app = express();

const { MONGO_USER, MONGO_PASSWORD, CLUSTER_URL, DATABASE, PORT } = process.env;

mongoose
  .connect(
    `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${CLUSTER_URL}/${DATABASE}?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch(async (error) => {
    console.log(`Get errors while connected to MongoDB, error: ${error}`);
  });

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: "Too many requests from this IP, please try again later.",
});

const allowedOrigins = ["http://localhost:3000"];
app.use(helmet());


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 6 * 60 * 60 * 1000, // 6 hours
  }
}));
app.use(passport.initialize())
app.use(passport.session())

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("trust proxy", 1);
app.use(morgan("short"));
app.use(limiter);

app.use("/api", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/auth", googleRoutes);

app.use((req, res, next) => {
  const error = new Error(
    `There is no url of ${req.originalUrl} with ${req.method} method.`
  );
  res.status(404);
  next(error);
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port = PORT || 8080;

app.listen(port, () => console.log(`Server running on port ${port}`));

export default app;
