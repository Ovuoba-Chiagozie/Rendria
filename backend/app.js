import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { normalizeRequest } from "./middlewares/casing.js";
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

// Ensure DB connection (important for Vercel’s cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(500).json({ error: "Database connection error" });
  }
});

// JSON middleware (except for Lemon webhooks)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/app/webhooks/lemon")) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(cookieParser());
app.use("/assets", express.static("assets"));

// ✅ CORS configuration
const allowedOrigins = isProduction
  ? ["https://app.rendria.com", "https://rendria.com"] // both main & app subdomain
  : ["http://localhost:5173"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // allow cookies
};

// Protected app routes
app.use("/app/auth", cors(corsOptions), authRoutes);
app.use("/app/api-keys", cors(corsOptions), authMiddleware, apiKeysRouter);
app.use("/app/templates", cors(corsOptions), authMiddleware, templatesRouter);
app.use("/app/renders", cors(corsOptions), authMiddleware, appRenders);
app.use("/app/checkout", cors(corsOptions), authMiddleware, checkoutRouter);
app.use("/app/webhooks", cors(corsOptions), webhooksRouter);
app.use("/app/automation", cors(corsOptions), automationRoutes);

// Public render API (no credentials)
app.use(
  "/v1/render",
  cors({ origin: "*" }),
  apiKeyAuth,
  checkCredits,
  renderRoutes
);


// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Rendria API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: isProduction ? "Internal server error" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ✅ Export for Vercel
export default app;

// ✅ Start server only when running locally
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
  });
}
