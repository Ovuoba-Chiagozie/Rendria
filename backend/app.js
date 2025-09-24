import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { normalizeRequest, formatResponse } from "./middlewares/casing.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { apiKeyAuth } from "./middlewares/apiKeyAuth.js";
import { checkCredits } from "./middlewares/checkCredits.js";
import templatesRouter from "./routes/app/templates.js";
import renderRoutes from "./routes/v1/render.js"; // public API routes
import authRoutes from "./routes/app/authRoutes.js";
import apiKeysRouter from "./routes/app/apiKeys.js";
import appRenders from "./routes/app/appRenders.js";
import checkoutRouter from "./routes/app/checkout.js";
import webhooksRouter from "./routes/app/webhook.js";

dotenv.config();

const app = express();

// Middlewares
// Conditionally apply JSON middleware
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/app/webhooks/lemon")) {
    // Skip JSON parsing for Lemon webhooks
    next();
  } else {
    // Apply normal JSON everywhere else
    express.json()(req, res, next);
  }
});
app.use(cookieParser());

// Serve assets
app.use("/assets", express.static("assets"));

// Decide allowed origins
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.APP_BASE_URL] // e.g. https://your-saas.com
    : ["http://localhost:5173"];

// Auth routes — restricted CORS (needed for cookies/sessions)
app.use(
  "/app/auth",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
  authRoutes
);

// Protected API key routes
app.use(
  "/app/api-keys",
  cors({ origin: allowedOrigins, credentials: true }),
  authMiddleware,
  apiKeysRouter
);

// Templates routes (protected, internal app use) — same restriction
app.use(
  "/app/templates",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
  authMiddleware, // 👈 protect all template routes
  templatesRouter
);

app.use(
  "/app/renders",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
  authMiddleware, // 👈 protect all app render routes
  appRenders
);

app.use(
  "/app/checkout",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
  authMiddleware, // 👈 protect all app render routes
  checkoutRouter
);

app.use(
  "/app/webhooks",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
  webhooksRouter
);

// Public Render API — open CORS (no credentials needed)
app.use(
  "/v1/render",
  cors({ origin: "*" }),
  normalizeRequest,
  apiKeyAuth, // 🔒 protect all render routes
  checkCredits,
  renderRoutes
);

// Example test route
app.get("/", (req, res) => {
  res.send({ message: "Backend is running and DB connected!" });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    app.listen(5000, () => {
      console.log(`🚀 Backend running on port 5000`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

startServer();
