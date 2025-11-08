// controllers/renderController.js
import Template from "../models/Template.js";
import Render from "../models/Render.js";
import UsageLog from "../models/UsageLog.js";
import { renderSchema } from "../validators/renderValidator.js";
import { renderShape } from "./renderHelpers/renderShapes.js";
import { renderQRCode } from "./renderHelpers/renderQRCode.js";
import { renderBarcode } from "./renderHelpers/renderBarcode.js";
import { renderStarRating } from "./renderHelpers/renderStarRating.js";
import cloudinary from "../config/cloudinary.js";
import { customAlphabet } from "nanoid";
import { deductCredits } from "../utils/credits.js";
import { invokeLambda } from "../config/lamdaClient.js";

const placeholder = process.env.VERCEL
  ? "https://template-saas-bu2m.vercel.app/assets/placeholder.svg"
  : process.env.NODE_ENV === "production"
    ? "https://api.rendria.com/assets/placeholder.svg"
    : "http://localhost:5000/assets/placeholder.svg";
    
const nanoid = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 20);

const allowedFields = {
  text: [
    "content",
    "color",
    "fontSize",
    "family",
    "textAlignIndex",
    "rotation",
    "x",
    "y",
    "width",
    "height",
  ],
  image: [
    "src",
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "borderWidth",
    "borderColor",
    "borderRadius",
    "objectFit",
  ],
  shape: [
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "fill",
    "strokeColor",
    "strokeWidth",
  ],
  "qr-code": ["x", "y", "width", "height", "rotation", "value"],
  barcode: ["x", "y", "width", "height", "rotation", "value", "format"],
  "star-rating": ["x", "y", "width", "height", "rotation", "rating"],
};

export const renderTemplate = async (req, res) => {
  try {
    // Validate request
    const { error, value } = renderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { templateId, modifications, format, width, height } = value;

    // 🔒 Only fetch templates that belong to the current API key’s user
    const template = await Template.findOne({
      _id: templateId,
      $or: [
        { userId: req.userId },
        { premade: true }, // allow premade templates
      ],
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const { canvasSize, name: templateName } = template;
    console.log({ canvasSize });

    // Collect all element names in template for quick lookup
    const elementMap = Object.fromEntries(
      template.elements.map((el) => [el.name, el])
    );

    // Validate modifications
    for (const [name, mod] of Object.entries(modifications)) {
      const element = elementMap[name];
      if (!element) {
        return res
          .status(400)
          .json({ error: `Element '${name}' not found in template` });
      }

      const allowed = allowedFields[element.type] || [];
      for (const field of Object.keys(mod)) {
        if (!allowed.includes(field)) {
          return res.status(400).json({
            error: `Field '${field}' is not valid for element type '${element.type}'`,
          });
        }
      }
    }

    // Apply modifications
    const modifiedElements = template.elements.map((el) => {
      const mod = modifications[el.name] || null;
      return mod ? { ...el, ...mod } : el;
    });

    // Build HTML
    const elementHTML = modifiedElements
      .map((el) => {
        if (el.type === "text") {
          const {
            x,
            y,
            width,
            height,
            family,
            fontSize,
            bold,
            italic,
            color,
            content,
            underline,
            lineThrough,
            uppercase,
            textAlignIndex,
            letterSpacing,
            lineSpacing,
            rotation,
          } = el;

          const alignMap = ["left", "center", "right"];
          const textAlign = alignMap[textAlignIndex] || "left";

          let textDecoration = "none";
          if (underline && lineThrough)
            textDecoration = "underline line-through";
          else if (underline) textDecoration = "underline";
          else if (lineThrough) textDecoration = "line-through";

          return `
        <div style="
          position:absolute;
          left:${x}px; top:${y}px;
          width:${width}px; height:${height}px;
          font-family:'${family}', sans-serif;
          font-size:${fontSize}px;
          font-weight:${bold ? 700 : 400};
          font-style:${italic ? "italic" : "normal"};
          line-height:${lineSpacing};
          letter-spacing:${letterSpacing}px;
          color:${color};
          text-align:${textAlign};
          text-transform:${uppercase ? "uppercase" : "none"};
          text-decoration:${textDecoration};
          transform: rotate(${rotation}deg);
          transform-origin: center;
          background-color: transparent;
          box-sizing: border-box;
        ">
          ${content}
        </div>`;
        }

        if (el.type === "image") {
          const {
            src,
            x,
            y,
            width,
            height,
            rotation,
            borderWidth,
            borderColor,
            borderRadius,
            flipX,
            flipY,
            objectFit,
          } = el;

          let transform = `rotate(${rotation}deg)`;
          if (flipX) transform += " scaleX(-1)";
          if (flipY) transform += " scaleY(-1)";

          return `
        <img src="${src || placeholder}" style="
          position:absolute;
          left:${x}px; top:${y}px;
          width:${width}px; height:${height}px;
          object-fit:${objectFit || "fill"};
          border:${borderWidth || 0}px solid ${borderColor || "transparent"};
          border-radius:${borderRadius?.value || 0}${
            borderRadius?.unit || "px"
          };
          transform:${transform};
          transform-origin: center;
          background-color: transparent;
          box-sizing: border-box;
        "/>`;
        }

        if (el.type === "shape") return renderShape(el);
        if (el.type === "qr-code") return renderQRCode(el);
        if (el.type === "barcode") return renderBarcode(el);
        if (el.type === "star-rating") return renderStarRating(el);

        return "";
      })
      .join("\n");

    // Fonts
    const fontsUsed = [
      ...new Set(
        modifiedElements
          .filter((el) => el.type === "text" && el.family)
          .map((el) => el.family.replace(/\s+/g, "+"))
      ),
    ];
    const fontsUrl =
      fontsUsed.length > 0
        ? `<link href="https://fonts.googleapis.com/css2?${fontsUsed
            .map((f) => `family=${f}:ital,wght@0,400;0,700;1,400;1,700`)
            .join("&")}&display=swap" rel="stylesheet">`
        : "";

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          ${fontsUrl}
          <style>
            body {
              margin:0;
              padding:0;
              width:${canvasSize.width}px;
              height:${canvasSize.height}px;
              background:white;
              position:relative;
              overflow:hidden;
            }
          </style>
        </head>
        <body>
          ${elementHTML}
        </body>
      </html>
    `;

    const outputWidth = width || canvasSize.width;
    const outputHeight = height || canvasSize.height;
    // 3. Call Lambda
    console.log({
      width: outputWidth,
      height: outputHeight,
      format,
      templateId,
    });

    const lambdaResult = await invokeLambda({
      html,
      width: outputWidth,
      height: outputHeight,
      format,
      templateId,
    });

    console.log({lambdaResult})

    if (lambdaResult.statusCode !== 200) {
      throw new Error(lambdaResult.body || "Lambda failed");
    }

    const { url, renderId } = JSON.parse(lambdaResult.body)

    // ✅ deduct credits (e.g. 1 credit per render)
    await deductCredits(req.userId, 1);

    // Save to DB (🔒 attach user + key for auditing)
    const renderDoc = await Render.create({
      render_id: renderId,
      template_id: templateId,
      template_name: templateName,
      url,
      format,
      width: outputWidth,
      height: outputHeight,
      userId: req.userId, // ✅ from middleware
      apiKeyId: req.apiKeyId, // ✅ track which key did the render (optional, good for analytics/rate limiting)
    });

    // ✅ log usage
    await UsageLog.create({
      user: req.userId,
      action: "render",
      creditsUsed: 1,
      meta: {
        renderId,
        templateId,
        format,
        width: outputWidth,
        height: outputHeight,
      },
    });

    res.json(renderDoc);
  } catch (err) {
    console.error("⚠️ Render error:", err);
    res.status(500).json({ error: "Failed to render template" });
  }
};

// GET /renders → list user renders
export const getRenders = async (req, res) => {
  try {
    const renders = await Render.find({ userId: req.userId })
      .sort({ created_at: -1 })
      .lean();
    res.json(renders);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching renders", error: err.message });
  }
};

// DELETE /renders/:id
export const deleteRender = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the render (but don't delete yet)
    const render = await Render.findOne({ _id: id, userId: req.userId });
    if (!render) {
      return res
        .status(404)
        .json({ message: "Render not found or unauthorized" });
    }

    // 2. Extract public_id and folder path from render doc
    const publicId = render.render_id; // since you saved it
    const folder = `${process.env.NODE_ENV || "test"}/renders/${
      render.template_id
    }/${render.created_at.getUTCFullYear()}/${String(
      render.created_at.getUTCMonth() + 1
    ).padStart(2, "0")}`;

    try {
      // 3. Delete the Cloudinary resource
      await cloudinary.api.delete_resources([`${folder}/${publicId}`], {
        resource_type: "image",
      });
      console.log("🗑️ Deleted from Cloudinary:", `${folder}/${publicId}`);
    } catch (err) {
      console.error("⚠️ Failed to delete Cloudinary resource:", err);
    }

    try {
      // 4. Try deleting the folder
      await cloudinary.api.delete_folder(folder);
      console.log(`🗑️ Deleted folder ${folder}`);
    } catch (folderErr) {
      console.error("⚠️ Failed to delete folder:", folderErr);
    }

    // 5. Finally delete from DB
    await Render.findOneAndDelete({ _id: id, userId: req.userId });

    res.json({
      message:
        "Render and related Cloudinary assets/folder deleted successfully",
      render,
    });
  } catch (err) {
    console.error("⚠️ Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
