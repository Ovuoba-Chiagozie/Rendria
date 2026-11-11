// models/ApiKey.js
import mongoose from "mongoose";

const ApiKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  keyId: { type: String, required: true, index: true }, // short public identifier
  encryptedKey: { type: String, required: true }, // JSON ciphertext
  hashedKey: { type: String, required: true, index: true }, // SHA-256 hex of plaintext
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  lastUsedAt: { type: Date },
});

export default mongoose.model("ApiKey", ApiKeySchema);
