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
  { _id: false } // no sub-id for this object
);

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // The actual design data from your editor
  elements: { type: Array, default: [] },

  // Thumbnail image stored on Cloudinary
  thumbnailUrl: { type: String, default: "" },
  publicId: { type: String, default: "" },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Canvas size object
  canvasSize: {
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
  },

  // Layer counters (to keep names consistent)
  counters: { type: countersSchema, default: () => ({}) },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Automatically update the updatedAt timestamp
templateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Template", templateSchema);
