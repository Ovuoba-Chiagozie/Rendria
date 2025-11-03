// controllers/templateController.js
import mongoose from "mongoose";
import Template from "../models/Template.js";
import { templateSchema } from "../validators/templateValidator.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

/**
 * Helpers
 */
const stripPremadeAndPublicIds = (body) => {
  // Remove any premade flag client may try to send
  if ("premade" in body) delete body.premade;
  // Remove top-level publicId (don't let users claim ownership of someone else's assets)
  if ("publicId" in body) delete body.publicId;
  // Remove any element.publicId fields to avoid accidental cross-account deletes
  if (Array.isArray(body.elements)) {
    body.elements = body.elements.map((el) => {
      const copy = { ...el };
      if ("publicId" in copy) delete copy.publicId;
      return copy;
    });
  }
  return body;
};

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

    // Prevent creation of premade via API and strip premade/publicId
    const safePayload = stripPremadeAndPublicIds(value);

    const template = await Template.create({ ...safePayload, userId: req.userId });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

export const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find({
      $or: [{ userId: req.userId }, { premade: true }],
    }).sort({ createdAt: -1 });

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

    // Verify template belongs to user (can't upload thumbnail for premade or other user's template)
    const template = await Template.findOne({ _id: templateId, userId: req.userId });
    if (!template) {
      return res.status(404).json({ error: "Template not found or not owned by user" });
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

    // Save thumbnail url / public id to template
    template.thumbnailUrl = uploadResult.secure_url;
    template.publicId = uploadResult.public_id;
    await template.save();

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
      return res.status(400).json({ error: "templateId and elementId are required" });
    }

    // Verify ownership (can't upload images into premade or someone else's template)
    const template = await Template.findOne({ _id: templateId, userId: req.userId });
    if (!template) {
      return res.status(404).json({ error: "Template not found or not owned by user" });
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

    // Optionally attach to element in DB - up to you. Return url/public_id to client
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

    const template = await Template.findOne({
      _id: id,
      userId: req.userId,
    });

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

    // Fetch template owned by user only (users cannot edit premade templates)
    const oldTemplate = await Template.findOne({ _id: id, userId: req.userId });
    if (!oldTemplate) {
      return res.status(404).json({ error: "Template not found or not editable" });
    }

    // Clean up any publicId fields from incoming body (safety)
    const safeBody = stripPremadeAndPublicIds(req.body);

    // Determine image publicIds to delete (only those that belong to this user's template)
    const oldElements = oldTemplate.elements || [];
    const oldPublicIds = oldElements.filter((el) => el.type === "image" && el.publicId).map((el) => el.publicId);
    const newPublicIds = (safeBody.elements || []).filter((el) => el.type === "image" && el.publicId).map((el) => el.publicId);
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
      safeBody,
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

    // Find template (must belong to user). This prevents deleting premade templates (they have different userId or premade true)
    const template = await Template.findOne({ _id: id, userId: req.userId });
    if (!template) {
      return res.status(404).json({ message: "Template not found or not deletable" });
    }

    // Extra safety: prevent deletion if somehow premade flagged
    if (template.premade) {
      return res.status(403).json({ message: "Premade templates cannot be deleted" });
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
      message: "Template and related Cloudinary assets/folder deleted successfully",
      template,
    });
  } catch (err) {
    console.error("⚠️ Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
