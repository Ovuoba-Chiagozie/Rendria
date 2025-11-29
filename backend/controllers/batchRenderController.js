// controllers/batchRenderController.js
import Template from "../models/Template.js";
import Render from "../models/Render.js";
import UsageLog from "../models/UsageLog.js";
import { customAlphabet } from "nanoid";
import { deductCredits, getCredits } from "../utils/credits.js";
import { invokeLambda } from "../config/lamdaClient.js";
import { renderShape } from "./renderHelpers/renderShapes.js";
import { renderQRCode } from "./renderHelpers/renderQRCode.js";
import { renderBarcode } from "./renderHelpers/renderBarcode.js";
import { renderStarRating } from "./renderHelpers/renderStarRating.js";
import cloudinary from "../config/cloudinary.js";
import archiver from "archiver";
import { Readable } from "stream";

const nanoid = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 20);

const placeholder =
  process.env.NODE_ENV === "production"
    ? "https://api.rendria.com/assets/placeholder.svg"
    : "http://localhost:5000/assets/placeholder.svg";

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

const CHUNK_SIZE = 10; // Process 10 renders at a time

// Helper: Build HTML for a single render
const buildHTML = (template, modifications) => {
  const { canvasSize, elements } = template;

  // Apply modifications
  const modifiedElements = elements.map((el) => {
    const mod = modifications[el.name] || null;
    return mod ? { ...el, ...mod } : el;
  });

  // Build element HTML
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
        if (underline && lineThrough) textDecoration = "underline line-through";
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
          border-radius:${borderRadius?.value || 0}${borderRadius?.unit || "px"};
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

  return `
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
};

// Helper: Process modifications with validation
const parseModifications = (modString) => {
  const modifications = {};
  const parts = modString.split(",");

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;

    const [fieldName, property] = key.split("_");
    if (!fieldName || !property) continue;

    if (!modifications[fieldName]) {
      modifications[fieldName] = {};
    }
    modifications[fieldName][property] = value;
  }

  return modifications;
};

// controllers/batchRenderController.js
export const batchRender = async (req, res) => {
    let batchDoc = null;
  
    try {
      const { requests, zip_name } = req.body;
  
      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({ error: "Requests array is required" });
      }
  
      // Get first request to validate template
      const firstRequest = requests[0];
      const { template_id, templateId, format } = firstRequest;
      
      const actualTemplateId = template_id || templateId;
      
      if (!actualTemplateId) {
        return res.status(400).json({ error: "template_id is required in each request" });
      }
  
      console.log(`🔍 Looking for template: ${actualTemplateId}`);
  
      // Validate template
      const template = await Template.findOne({
        _id: actualTemplateId,
        $or: [{ userId: req.userId }, { premade: true }],
      });
  
      if (!template) {
        console.log(`❌ Template not found: ${actualTemplateId}`);
        return res.status(404).json({ error: "Template not found" });
      }
  
      console.log(`✅ Template found: ${template.name}`);
  
      // Check user credits
      const userCredits = await getCredits(req.userId);
      const affordableCount = Math.min(requests.length, userCredits);
  
      if (affordableCount === 0) {
        return res.status(403).json({ 
          error: "Insufficient credits", 
          required: requests.length,
          available: userCredits 
        });
      }
  
      // Create batch tracking record
      const batchId = nanoid();
      batchDoc = await Render.create({
        render_id: batchId,
        template_id: template._id,
        userId: req.userId,
        template_name: template.name,
        url: "pending",
        format: format || "png",
        width: template.canvasSize.width,
        height: template.canvasSize.height,
        isBatch: true,
        batchId,
        batchStatus: "processing",
        batchTotalRows: affordableCount,
        batchCompletedRows: 0,
        batchFailedRows: 0,
      });
  
      console.log(`📦 Starting batch ${batchId} with ${affordableCount}/${requests.length} rows`);
  
      // Process in chunks
      const requestsToProcess = requests.slice(0, affordableCount);
      const renderedUrls = [];
      const individualRenderDocs = []; // ✅ Store individual render docs
      let completedCount = 0;
      let failedCount = 0;
  
      for (let i = 0; i < requestsToProcess.length; i += CHUNK_SIZE) {
        const chunk = requestsToProcess.slice(i, i + CHUNK_SIZE);
        
        const chunkResults = await Promise.allSettled(
          chunk.map(async (request, chunkIndex) => {
            const { modifications } = request;
            const parsedMods = modifications;
  
            // Validate modifications
            const elementMap = Object.fromEntries(
              template.elements.map((el) => [el.name, el])
            );
  
            for (const [name, mod] of Object.entries(parsedMods)) {
              const element = elementMap[name];
              if (!element) {
                throw new Error(`Element '${name}' not found in template`);
              }
  
              const allowed = allowedFields[element.type] || [];
              for (const field of Object.keys(mod)) {
                if (!allowed.includes(field)) {
                  throw new Error(
                    `Field '${field}' is not valid for element type '${element.type}'`
                  );
                }
              }
            }
  
            // Build HTML
            const html = buildHTML(template, parsedMods);
  
            // Invoke Lambda
            const lambdaResult = await invokeLambda({
              html,
              width: template.canvasSize.width,
              height: template.canvasSize.height,
              format: format || "png",
              templateId: template._id,
            });
  
            if (lambdaResult.statusCode !== 200) {
              throw new Error(lambdaResult.body || "Lambda failed");
            }
  
            let body = lambdaResult.body;
            if (typeof body === "string") {
              body = JSON.parse(body);
            }
            
            const { url, renderId } = body;
  
            // ✅ Create individual render record for this render
            const renderDoc = await Render.create({
              render_id: renderId,
              template_id: template._id,
              template_name: template.name,
              url,
              format: format || "png",
              width: template.canvasSize.width,
              height: template.canvasSize.height,
              userId: req.userId,
              apiKeyId: req.apiKeyId,
              isBatch: false, // ✅ Mark as individual render, not batch
              batchId, // ✅ Link back to batch for tracking
            });
  
            return { url, renderDoc };
          })
        );
  
        // Count successes and failures
        chunkResults.forEach((result) => {
          if (result.status === "fulfilled") {
            renderedUrls.push(result.value.url);
            individualRenderDocs.push(result.value.renderDoc);
            completedCount++;
          } else {
            failedCount++;
            console.error("❌ Render failed:", result.reason);
          }
        });
  
        // Update batch progress
        await Render.updateOne(
          { _id: batchDoc._id },
          {
            batchCompletedRows: completedCount,
            batchFailedRows: failedCount,
          }
        );
  
        console.log(`✅ Processed chunk ${i / CHUNK_SIZE + 1}: ${completedCount}/${affordableCount} completed`);
      }
  
      // Deduct credits for successful renders
      await deductCredits(req.userId, completedCount);
  
      // Log usage
      await UsageLog.create({
        user: req.userId,
        action: "batch_render",
        creditsUsed: completedCount,
        meta: {
          batchId,
          templateId: template._id,
          totalRequested: requests.length,
          totalProcessed: completedCount,
          totalFailed: failedCount,
          format,
        },
      });
  
      // Create ZIP file
      console.log("📦 Creating ZIP file...");
      
      const archive = archiver("zip", { zlib: { level: 9 } });
      const buffers = [];
  
      archive.on("data", (chunk) => buffers.push(chunk));
      
      await new Promise(async (resolve, reject) => {
        archive.on("end", resolve);
        archive.on("error", reject);
  
        // Download each image and add to ZIP
        for (let i = 0; i < renderedUrls.length; i++) {
          try {
            const response = await fetch(renderedUrls[i]);
            const buffer = await response.arrayBuffer();
            archive.append(Buffer.from(buffer), { 
              name: `render_${i + 1}.${format || "png"}` 
            });
          } catch (err) {
            console.error(`Failed to fetch ${renderedUrls[i]}:`, err);
          }
        }
  
        archive.finalize();
      });
  
      const zipBuffer = Buffer.concat(buffers);
  
      // Upload ZIP to Cloudinary
      const zipResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            folder: `${process.env.NODE_ENV || "test"}/batches`,
            public_id: batchId,
            resource_type: "raw",
            type: "upload",
            format: "zip",
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        
        const readable = Readable.from(zipBuffer);
        readable.pipe(stream);
      });
  
      // Update batch tracking record with ZIP URL and final status
      const finalStatus = failedCount === 0 ? "completed" : 
                          completedCount === 0 ? "failed" : "partial";
  
      await Render.updateOne(
        { _id: batchDoc._id },
        {
          url: zipResult.secure_url,
          batchZipUrl: zipResult.secure_url,
          batchStatus: finalStatus,
          batchCompletedRows: completedCount,
          batchFailedRows: failedCount,
        }
      );
  
      console.log(`✅ Batch ${batchId} complete: ${completedCount}/${affordableCount} successful`);
  
      res.json({
        batchId,
        status: finalStatus,
        zip_url: zipResult.secure_url,
        total_requested: requests.length,
        total_processed: completedCount,
        total_failed: failedCount,
        credits_used: completedCount,
        insufficient_credits: requests.length > affordableCount,
        individual_renders: individualRenderDocs.map(doc => ({
          render_id: doc.render_id,
          url: doc.url,
        })),
        message: affordableCount < requests.length
          ? `Only ${affordableCount} of ${requests.length} rows processed due to insufficient credits`
          : "Batch completed successfully",
      });
  
    } catch (err) {
      console.error("⚠️ Batch render error:", err);
  
      // Update batch record with error
      if (batchDoc) {
        await Render.updateOne(
          { _id: batchDoc._id },
          {
            batchStatus: "failed",
            batchError: err.message,
          }
        );
      }
  
      res.status(500).json({ 
        error: "Failed to process batch", 
        message: err.message 
      });
    }
  };

// Get all batches for a user
export const getBatches = async (req, res) => {
  try {
    const batches = await Render.find({ 
      userId: req.userId,
      isBatch: true 
    })
      .sort({ created_at: -1 })
      .lean();
    
    res.json(batches);
  } catch (err) {
    res.status(500).json({ 
      message: "Error fetching batches", 
      error: err.message 
    });
  }
};

// Get single batch by ID
export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await Render.findOne({ 
      batchId: id,
      userId: req.userId,
      isBatch: true 
    }).lean();

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json(batch);
  } catch (err) {
    res.status(500).json({ 
      message: "Error fetching batch", 
      error: err.message 
    });
  }
};