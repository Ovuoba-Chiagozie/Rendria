// controllers/templateController.js
import mongoose from "mongoose";
import Template from "../models/Template.js";
import { templateSchema } from "../validators/templateValidator.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

export const createTemplate = async (req, res, next) => {
  try {
    const { error, value } = templateSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((err) => err.message),
      });
    }
    console.log({ userid: req.userId });
    // 👇 attach userId
    const template = await Template.create({ ...value, userId: req.userId });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

export const getAllTemplates = async (req, res) => {
  try {
    // 👇 only this user's templates
    const templates = await Template.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(templates);
  } catch (err) {
    console.error("⚠️ Error fetching templates:", err);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

export const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { templateId } = req.body;
    if (!templateId) {
      return res.status(400).json({ error: "templateId is required" });
    }

    // 👇 Verify ownership
    const template = await Template.findOne({
      _id: templateId,
      userId: req.userId,
    });
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "thumbnails", public_id: templateId, overwrite: true },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      bufferStream.pipe(stream);
    });

    res.json({
      message: "Thumbnail uploaded successfully",
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (err) {
    console.error("⚠️ Thumbnail upload failed:", err);
    res.status(500).json({ error: "Failed to upload thumbnail" });
  }
};

export const uploadImageElement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { templateId, elementId } = req.body;
    if (!templateId || !elementId) {
      return res
        .status(400)
        .json({ error: "templateId and elementId are required" });
    }

    // 👇 Verify ownership
    const template = await Template.findOne({
      _id: templateId,
      userId: req.userId,
    });
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `templates/${templateId}/images`,
          public_id: elementId,
          overwrite: true,
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      bufferStream.pipe(stream);
    });

    res.json({
      message: "Image uploaded successfully",
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (err) {
    console.error("⚠️ Image upload failed:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Template not found" });
    }

    // 👇 Restrict by user
    const template = await Template.findOne({ _id: id, userId: req.userId });
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (err) {
    console.error("⚠️ Error fetching template:", err);
    res.status(500).json({ error: "Failed to fetch template" });
  }
};

export const updateTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const newElements = req.body.elements || [];

    // 👇 Only update if belongs to user
    const oldTemplate = await Template.findOne({ _id: id, userId: req.userId });
    if (!oldTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    const oldElements = oldTemplate.elements || [];
    const oldPublicIds = oldElements
      .filter((el) => el.type === "image" && el.publicId)
      .map((el) => el.publicId);
    const newPublicIds = newElements
      .filter((el) => el.type === "image" && el.publicId)
      .map((el) => el.publicId);

    const deletedIds = oldPublicIds.filter((id) => !newPublicIds.includes(id));

    if (deletedIds.length > 0) {
      try {
        await cloudinary.api.delete_resources(deletedIds);
        console.log("🗑️ Deleted from Cloudinary:", deletedIds);
      } catch (err) {
        console.error("⚠️ Failed to delete from Cloudinary:", err);
      }
    }

    const updatedTemplate = await Template.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true }
    );

    res.json(updatedTemplate);
  } catch (err) {
    console.error("⚠️ Update error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // 👇 Only delete if belongs to user
    const template = await Template.findOne({ _id: id, userId: req.userId });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const publicIdsToDelete = [];
    if (template.publicId) publicIdsToDelete.push(template.publicId);

    const elementPublicIds = (template.elements || [])
      .filter((el) => el.type === "image" && el.publicId)
      .map((el) => el.publicId);

    publicIdsToDelete.push(...elementPublicIds);

    if (publicIdsToDelete.length > 0) {
      try {
        await cloudinary.api.delete_resources(publicIdsToDelete);
        console.log("🗑️ Deleted from Cloudinary:", publicIdsToDelete);
      } catch (err) {
        console.error("⚠️ Failed to delete Cloudinary resources:", err);
      }
    }

    try {
      await cloudinary.api.delete_folder(`templates/${id}`);
      console.log(`🗑️ Deleted folder templates/${id}`);
    } catch (folderErr) {
      console.error("⚠️ Failed to delete folder:", folderErr);
    }

    await Template.findOneAndDelete({ _id: id, userId: req.userId });

    res.json({
      message:
        "Template and related Cloudinary assets/folder deleted successfully",
      template,
    });
  } catch (err) {
    console.error("⚠️ Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
