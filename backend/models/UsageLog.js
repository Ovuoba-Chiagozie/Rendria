import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["render", "export", "api_call","batch_render"], // extend as needed
    },
    creditsUsed: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Object, // optional extra info (e.g. templateId, export format, API endpoint)
      default: {},
    },
  },
  { timestamps: true } // logs when it happened
);

const UsageLog = mongoose.model("UsageLog", usageLogSchema);

export default UsageLog;
