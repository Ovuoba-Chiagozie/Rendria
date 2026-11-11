import ApiKey from "../models/ApiKey.js";
import { generateApiKey, encryptApiKey, decryptApiKey, hashApiKey, generateKeyId } from "../utils/apiKeyUtils.js";

// GET /app/api-keys
export const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.userId, revoked: false }).sort({ createdAt: -1 });

    const response = keys.map(k => ({
      keyId: k.keyId,
      apiKey: decryptApiKey(k.encryptedKey),
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));



    res.json(response);
  } catch (err) {
    console.error("GET /api-keys error:", err);
    res.status(500).json({ message: "Failed to fetch API keys" });
  }
};

// POST /app/api-keys/regenerate
export const regenerateApiKey = async (req, res) => {
    try {
      // Revoke existing active keys
      await ApiKey.updateMany({ userId: req.userId, revoked: false }, { revoked: true });
  
      // Generate new plaintext API key
      const apiKeyPlain = generateApiKey();
  
      // Generate keyId
      const keyId = generateKeyId();
  
      // Encrypt key for storage/recovery
      const encryptedKey = encryptApiKey(apiKeyPlain);
  
      // Compute hashed key for quick lookup / API auth
      const hashedKey = hashApiKey(apiKeyPlain);
  
      // Save to DB
      const newKey = await ApiKey.create({
        userId: req.userId,
        keyId,
        encryptedKey,
        hashedKey,
      });
  
      // Return plaintext to user
      res.json({
        message: "API key regenerated",
        apiKey: apiKeyPlain,
        keyId: newKey.keyId,
        createdAt: newKey.createdAt,
      });
    } catch (err) {
      console.error("POST /api-keys/regenerate error:", err);
      res.status(500).json({ message: "Failed to regenerate API key" });
    }
  };

// POST /app/api-keys/revoke
export const revokeApiKey = async (req, res) => {
  try {
    const { keyId } = req.body;
    if (!keyId) return res.status(400).json({ message: "keyId is required" });

    const key = await ApiKey.findOne({ userId: req.userId, keyId, revoked: false });
    if (!key) return res.status(404).json({ message: "API key not found or already revoked" });

    key.revoked = true;
    await key.save();

    res.json({ message: "API key revoked", keyId });
  } catch (err) {
    console.error("POST /api-keys/revoke error:", err);
    res.status(500).json({ message: "Failed to revoke API key" });
  }
};
