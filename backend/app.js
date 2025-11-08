import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { normalizeRequest, formatResponse } from "./middlewares/casing.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { apiKeyAuth } from "./middlewares/apiKeyAuth.js";
import { checkCredits } from "./middlewares/checkCredits.js";

import templatesRouter from "./routes/app/templates.js";
import renderRoutes from "./routes/v1/render.js";
import authRoutes from "./routes/app/authRoutes.js";
import apiKeysRouter from "./routes/app/apiKeys.js";
import appRenders from "./routes/app/appRenders.js";
import checkoutRouter from "./routes/app/checkout.js";
import webhooksRouter from "./routes/app/webhook.js";
import automationRoutes from "./routes/app/automation.js";

import { connectDB } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Middleware to ensure DB is connected (works for Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(500).json({ error: "Database connection error" });
  }
});

// Middlewares
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/app/webhooks/lemon")) {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cookieParser());

// Serve assets
app.use("/assets", express.static("assets"));

// CORS configuration
const allowedOrigins = isProduction
  ? [process.env.CORS_ORIGIN] // https://app.rendria.com
  : ["http://localhost:5173"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

// Routes
app.use("/app/auth", cors(corsOptions), authRoutes);
app.use("/app/api-keys", cors(corsOptions), authMiddleware, apiKeysRouter);
app.use("/app/templates", cors(corsOptions), authMiddleware, templatesRouter);
app.use("/app/renders", cors(corsOptions), authMiddleware, appRenders);
app.use("/app/checkout", cors(corsOptions), authMiddleware, checkoutRouter);
app.use("/app/webhooks", cors(corsOptions), webhooksRouter);
app.use("/app/automation", cors(corsOptions), automationRoutes);

// Public Render API - open CORS
app.use("/v1/render", cors({ origin: "*" }), normalizeRequest, apiKeyAuth, checkCredits, renderRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.json({ 
    message: "Rendria API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: isProduction ? "Internal server error" : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// Export app for Vercel
export default app;

// Only start server for local/Render
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(", ")}`);
  });
}
