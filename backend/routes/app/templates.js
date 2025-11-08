import express from "express";
// import Template from "../../models/Template.js";
// import puppeteer from "puppeteer";
// import { renderShape } from "../../controllers/renderHelpers/renderShapes.js";
// import { renderQRCode } from "../../controllers/renderHelpers/renderQRCode.js";
// import { renderBarcode } from "../../controllers/renderHelpers/renderBarcode.js";
// import { renderStarRating } from "../../controllers/renderHelpers/renderStarRating.js";
const placeholder =
  process.env.NODE_ENV === "production"
    ? "https://api.rendria.com/assets/placeholder.svg"
    : "http://localhost:5000/assets/placeholder.svg";


import upload from "../../config/multer.js";
import {
  createTemplate,
  getAllTemplates,
  uploadThumbnail,
  uploadImageElement,
  getTemplateById,
  updateTemplateById,
  deleteTemplateById,
} from "../../controllers/templateController.js";

const router = express.Router();

// Create new template
// POST /templates
router.post("/", createTemplate);

// Get all templates
router.get("/", getAllTemplates);

// Upload thumbnail route
// POST /templates/upload-thumbnail
router.post("/upload-thumbnail", upload.single("thumbnail"), uploadThumbnail);

// Upload image element
router.post("/upload-image", upload.single("image"), uploadImageElement);

// Get template by ID
router.get("/:id", getTemplateById);

// Update template by ID
router.put("/:id", updateTemplateById);

// Delete template by ID
router.delete("/:id", deleteTemplateById);


// Test rendering engine route
// router.get("/test-rendering-engine/:id", async (req, res) => {
//   try {
//     const template = await Template.findById(req.params.id);
//     if (!template) {
//       return res.status(404).json({ error: "Template not found" });
//     }

//     const { canvasSize, elements } = template;

//     // Build HTML for both text + image elements
//     const elementHTML = elements
//       .map((el) => {
//         if (el.type === "text") {
//           const {
//             x,
//             y,
//             width,
//             height,
//             family,
//             fontSize,
//             bold,
//             italic,
//             color,
//             content,
//             underline,
//             lineThrough,
//             uppercase,
//             textAlignIndex,
//             letterSpacing,
//             lineSpacing,
//             rotation,
//           } = el;

//           const alignMap = ["left", "center", "right"];
//           const textAlign = alignMap[textAlignIndex] || "left";

//           let textDecoration = "none";
//           if (underline && lineThrough)
//             textDecoration = "underline line-through";
//           else if (underline) textDecoration = "underline";
//           else if (lineThrough) textDecoration = "line-through";

//           return `
//           <div style="
//             position:absolute;
//             left:${x}px; top:${y}px;
//             width:${width}px; height:${height}px;
//             font-family:'${family}', sans-serif;
//             font-size:${fontSize}px;
//             font-weight:${bold ? 700 : 400};
//             font-style:${italic ? "italic" : "normal"};
//             line-height:${lineSpacing};
//             letter-spacing:${letterSpacing}px;
//             color:${color};
//             text-align:${textAlign};
//             text-transform:${uppercase ? "uppercase" : "none"};
//             text-decoration:${textDecoration};
//             transform: rotate(${rotation}deg);
//             transform-origin: center;
//             background-color: transparent;
//             box-sizing: border-box;
//           ">
//             ${content}
//           </div>`;
//         }

//         if (el.type === "image") {
//           const {
//             src,
//             x,
//             y,
//             width,
//             height,
//             rotation,
//             borderWidth,
//             borderColor,
//             borderRadius,
//             flipX,
//             flipY,
//             objectFit,
//           } = el;

//           // Build transform: handle flip + rotation
//           let transform = `rotate(${rotation}deg)`;
//           if (flipX) transform += " scaleX(-1)";
//           if (flipY) transform += " scaleY(-1)";

//           return `
//           <img src="${src || placeholder}" style="
//             position:absolute;
//             left:${x}px; top:${y}px;
//             width:${width}px; height:${height}px;
//             object-fit:${objectFit || "fill"};
//             border:${borderWidth || 0}px solid ${borderColor || "transparent"};
//             border-radius:${borderRadius?.value || 0}${
//             borderRadius?.unit || "px"
//           };
//             transform:${transform};
//             transform-origin: center;
//             background-color: transparent;
//             box-sizing: border-box;
//           "/>`;
//         }

//         if (el.type === "shape") {
//           return renderShape(el);
//         }

//         if (el.type === "qr-code") {
//           return renderQRCode(el);
//         }

//         if (el.type === "barcode") {
//           return renderBarcode(el);
//         }

//         if (el.type === "star-rating") {
//           return renderStarRating(el);
//         }

//         return "";
//       })
//       .join("\n");
//     // Collect unique fonts used by text elements
//     const fontsUsed = [
//       ...new Set(
//         elements
//           .filter((el) => el.type === "text" && el.family)
//           .map((el) => el.family.replace(/\s+/g, "+"))
//       ),
//     ];
//     const fontsUrl =
//       fontsUsed.length > 0
//         ? `<link href="https://fonts.googleapis.com/css2?${fontsUsed
//             .map((f) => `family=${f}:ital,wght@0,400;0,700;1,400;1,700`)
//             .join("&")}&display=swap" rel="stylesheet">`
//         : "";

//     const html = `
//       <html>
//         <head>
//           <meta charset="UTF-8" />
//           ${fontsUrl}
//           <style>
//             body {
//               margin:0;
//               padding:0;
//               width:${canvasSize.width}px;
//               height:${canvasSize.height}px;
//               background:white;
//               position:relative;
//               overflow:hidden;
//             }
//           </style>
//         </head>
//         <body>
//           ${elementHTML}
//         </body>
//       </html>
//     `;

//     // Puppeteer rendering
//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();

//     await page.setViewport({
//       width: canvasSize.width,
//       height: canvasSize.height,
//     });

//     await page.setContent(html, { waitUntil: "networkidle0" });

//     await page.evaluateHandle("document.fonts.ready");

//     const buffer = await page.screenshot({ type: "png" });

//     await browser.close();

//     // res.set("Content-Type", "image/png");
//     // res.send(buffer);
//     res.set("Content-Type", "text/html");
//     res.send(html);
//   } catch (err) {
//     console.error("⚠️ Rendering error:", err);
//     res.status(500).json({ error: "Failed to render template" });
//   }
// });

export default router;
