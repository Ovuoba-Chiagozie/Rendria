import mongoose from "mongoose";

const countersSchema = new mongoose.Schema(
  {
    text: { type: Number, default: 0 },
    image: { type: Number, default: 0 },
    shape: { type: Number, default: 0 },
    qr: { type: Number, default: 0 },
    barcode: { type: Number, default: 0 },
    star: { type: Number, default: 0 },
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  elements: { type: Array, default: [] },
  thumbnailUrl: { type: String, default: "" },
  publicId: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  canvasSize: {
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
  },

  counters: { type: countersSchema, default: () => ({}) },

  // ✅ mark as premade (hidden from normal users)
  premade: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto update
templateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Template", templateSchema);
