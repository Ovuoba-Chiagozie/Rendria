import mongoose from "mongoose";

const renderSchema = new mongoose.Schema(
  {
    render_id: { type: String, required: true, unique: true },
    template_id: { type: mongoose.Schema.Types.ObjectId, ref: "Template", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    template_name: { type: String, required: true },
    url: { type: String, required: true },
    format: { type: String, enum: ["png", "jpeg", "webp"], required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
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
