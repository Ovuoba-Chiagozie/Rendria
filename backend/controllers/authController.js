import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiKey from "../models/ApiKey.js";
import { generateApiKey, encryptApiKey, hashApiKey, generateKeyId } from "../utils/apiKeyUtils.js";

// Helper: generate token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /auth/signup
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
    });

    // Generate JWT
    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ======= API KEY CREATION =======
    const apiKeyPlain = generateApiKey();       // plaintext key
    const keyId = generateKeyId();              // short public keyId
    const encryptedKey = encryptApiKey(apiKeyPlain); // encrypt key
    const hashedKey = hashApiKey(apiKeyPlain);

    // Store in DB
    await ApiKey.create({
      userId: user._id,
      keyId,
      encryptedKey,
      hashedKey,
    });

    // Respond with user info AND the plaintext API key
    res.status(201).json({
      message: "Signup successful",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      apiKey: apiKeyPlain, // user sees it immediately
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// POST /auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
        message: "Login successful",
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
      });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /auth/me
export const getMe = async (req, res) => {
    res.json({
        message: "Fetched user",
        user: req.user,
      });
};

// POST /auth/logout
export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Logged out successfully" });
};
