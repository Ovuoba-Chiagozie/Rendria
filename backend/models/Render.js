// models/Render.js
import mongoose from "mongoose";

const renderSchema = new mongoose.Schema(
  {
    render_id: { type: String, required: true, unique: true },
    template_id: { type: mongoose.Schema.Types.ObjectId, ref: "Template", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    template_name: { type: String, required: true },
    url: { type: String, required: function() { return !this.isBatch; } }, // ✅ Only required if NOT a batch
    format: { type: String, enum: ["png", "jpeg", "webp"], required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    
    // Batch support
    isBatch: { type: Boolean, default: false },
    batchId: { type: String, default: null, index: true },
    batchStatus: { 
      type: String, 
      enum: ["pending", "processing", "completed", "failed", "partial"],
      default: null 
    },
    batchZipUrl: { type: String, default: null },
    batchTotalRows: { type: Number, default: null },
    batchCompletedRows: { type: Number, default: null },
    batchFailedRows: { type: Number, default: null },
    batchError: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Hide _id and __v when converting to JSON
renderSchema.set("toJSON", {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

export default mongoose.model("Render", renderSchema);