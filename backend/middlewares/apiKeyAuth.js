import ApiKey from "../models/ApiKey.js";
import { hashApiKey } from "../utils/apiKeyUtils.js";

export const apiKeyAuth = async (req, res, next) => {
  try {
    // Read API key from Authorization: Bearer <key>
    const authHeader = req.headers.authorization || req.headers['x-api-key'];
    if (!authHeader) {
      return res.status(401).json({ message: "API key missing" });
    }

    const apiKeyValue = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
      
    // Compute hash
    const hashedKey = hashApiKey(apiKeyValue);

    // Find matching active key
    const keyDoc = await ApiKey.findOne({ hashedKey, revoked: false });
    if (!keyDoc) {
      return res.status(401).json({ message: "Invalid or revoked API key" });
    }

    // Attach user info to request
    req.userId = keyDoc.userId;
    req.apiKeyId = keyDoc._id;

    // Optionally update lastUsedAt
    keyDoc.lastUsedAt = new Date();
    await keyDoc.save();

    next();
  } catch (err) {
    console.error("API key auth error:", err);
    res.status(500).json({ message: "Server error during API key auth" });
  }
};
