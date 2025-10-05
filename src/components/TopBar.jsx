import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import axios from "axios";
import { Canvg } from "canvg";
import { useClickOutside } from "@/utils/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { FaArrowsAlt, FaDownload, FaSave, FaMagic } from "react-icons/fa";

export default function Topbar({
  canvasSize,
  setCanvasSize,
  templateName,
  setTemplateName,
  onSaveTemplate,
  saveStatus,
  templateId,
}) {
  const [resizeModalOpen, setResizeModalOpen] = useState(false);
  const modalRef = useRef(null);
  const { apiKey } = useAuth();
  const [exporting, setExporting] = useState(false);

  useClickOutside(modalRef, () => setResizeModalOpen(false));

  const sizeGroups = [
    {
      label: "Paper Sizes",
      items: [
        { name: "A4", width: 2480, height: 3508, dpi: 300 },
        { name: "US Letter", width: 2550, height: 3300, dpi: 300 },
        { name: "US Legal", width: 2550, height: 4200, dpi: 300 },
      ],
    },
    {
      label: "Facebook / Instagram",
      items: [
        { name: "Story", width: 1080, height: 1920 },
        { name: "Square Post", width: 1080, height: 1080 },
        { name: "Landscape Post", width: 1200, height: 630 },
        { name: "Portrait Post", width: 1080, height: 1350 },
      ],
    },
    {
      label: "Twitter",
      items: [
        { name: "Banner", width: 1500, height: 500 },
        { name: "Post Image", width: 1600, height: 900 },
      ],
    },
    {
      label: "LinkedIn",
      items: [
        { name: "Post", width: 1200, height: 628 },
        { name: "Banner", width: 1584, height: 396 },
      ],
    },
    {
      label: "YouTube",
      items: [{ name: "Thumbnail", width: 1280, height: 720 }],
    },
    {
      label: "Open Graph",
      items: [
        { name: "Default", width: 1200, height: 630 },
        { name: "Square", width: 1200, height: 1200 },
      ],
    },
    {
      label: "Banners",
      items: [
        { name: "Rectangle", width: 900, height: 750 },
        { name: "Billboard", width: 970, height: 250 },
      ],
    },
  ];

  const handleCustomSizeChange = (width, height) => {
    setCanvasSize({
      width: Math.max(1, Math.min(width, 5000)),
      height: Math.max(1, Math.min(height, 5000)),
    });
  };

  async function captureCanvasThumbnail() {
    const canvasEl = document.getElementById("editor-canvas");
    if (!canvasEl) return null;

    // Clone for clean export
    const clone = canvasEl.cloneNode(true);
    clone.style.transform = "none";
    clone.style.position = "absolute";
    clone.style.left = "-99999px";
    clone.style.top = "0";
    document.body.appendChild(clone);

    // Remove unwanted UI
    clone
      .querySelectorAll(
        ".moveable, .moveable-control, .moveable-line,.moveable-area, .moveable-origin,  .element-action, [style*='dashed']"
      )
      .forEach((el) => el.remove());

    // Convert inline SVGs to canvases
    const svgNodes = clone.querySelectorAll("svg");
    for (const svg of svgNodes) {
      try {
        const svgText = new XMLSerializer().serializeToString(svg);
        const { width, height } = svg.getBoundingClientRect();
        const canvas = document.createElement("canvas");
        canvas.width = width || 100;
        canvas.height = height || 100;

        const ctx = canvas.getContext("2d");
        const v = await Canvg.from(ctx, svgText);
        await v.render();

        svg.replaceWith(canvas);
      } catch (err) {
        console.error("SVG → Canvas conversion failed:", err);
      }
    }

    await document.fonts.ready;

    // Render at natural size (no width override)
    const fullCanvas = await html2canvas(clone, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
    });

    clone.remove();

    // Resize manually to 400px wide, preserving aspect ratio
    const targetWidth = 400;
    const aspectRatio = fullCanvas.width / fullCanvas.height;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;

    const ctx = resizedCanvas.getContext("2d");
    ctx.drawImage(fullCanvas, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve) => {
      resizedCanvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  const exportCanvasAsImage = async () => {
    try {
      setExporting(true);

      // 1. Save template first
      const blob = await captureCanvasThumbnail();
      await onSaveTemplate(blob);

      const body = { templateId };
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/v1/render`, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const { url, template_name } = res.data;

      // 2. Fetch file as blob to force download
      const fileRes = await axios.get(url, { responseType: "blob" });
      const fileBlob = fileRes.data;
      const downloadUrl = URL.createObjectURL(fileBlob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${template_name || "template"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("❌ Export failed:", err);
      alert("Export failed, please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full h-[60px] bg-white border-b border-[#EBEBEAFF] flex items-center px-4 justify-between">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-11 h-11 object-contain"
          />
        </a>

        {/* Filename input */}
        <input
          type="text"
          placeholder="Untitled File"
          className="bg-white h-8 text-gray-800 ml-5 text-center border border-[#EBEBEA] rounded focus:outline focus:outline-blue-400 focus:outline-[0.2px] [&::-webkit-inner-spin-button]:appearance-none"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </div>

      {/* Center */}
      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => setResizeModalOpen((p) => !p)}
          className="flex items-center gap-2 bg-white text-[#FF6E61FF] hover:bg-[#FF6E61FF] hover:text-white px-3 py-1 rounded border border-[#FF6E61FF]"
        >
          <FaArrowsAlt /> Resize
        </button>
        <span className="text-sm opacity-80">
          {canvasSize.width} x {canvasSize.height}
        </span>

        {/* Resize Modal */}
        <AnimatePresence>
          {resizeModalOpen && (
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute top-[110%] z-[4000] bg-white text-black p-4 rounded shadow-lg  w-[320px] max-h-[400px] overflow-auto"
            >
              {/* Custom Size */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Custom Size (px)</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={canvasSize.width}
                    onChange={(e) =>
                      handleCustomSizeChange(
                        parseInt(e.target.value) || 1,
                        canvasSize.height
                      )
                    }
                    className="w-20 border p-1 rounded focus:outline focus:outline-blue-400 focus:outline-[0.2px]"
                  />
                  <span className="self-center">x</span>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={canvasSize.height}
                    onChange={(e) =>
                      handleCustomSizeChange(
                        canvasSize.width,
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-20 border p-1 rounded focus:outline focus:outline-blue-400 focus:outline-[0.2px]"
                  />
                </div>
              </div>

              {/* Predefined Sizes */}
              {sizeGroups.map((group) => (
                <div key={group.label} className="mb-3">
                  <h4 className="font-semibold text-sm mb-1">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((size) => (
                      <button
                        key={size.name}
                        onClick={() =>
                          setCanvasSize({
                            width: size.width,
                            height: size.height,
                          })
                        }
                        className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        {size.name} ({size.width}x{size.height})
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Primary - Brand Color */}
        {/* <button className="flex items-center gap-2 bg-[#FF6E61] hover:bg-[#e65f53] text-white px-3 py-2 rounded text-sm">
          <FaMagic /> Automate Template
        </button> */}

        {/* Secondary - White with Brand Border/Text */}
        <button
          onClick={exportCanvasAsImage}
          disabled={exporting}
          className="flex items-center gap-2 bg-white border border-[#FF6E61] text-[#FF6E61] hover:bg-[#fff3f2] px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          <FaDownload />
          {exporting ? "Exporting..." : "Export"}
        </button>

        {/* Save Button */}
        <button
          onClick={async () => {
            const blob = await captureCanvasThumbnail();
            onSaveTemplate(blob); // pass Blob to parent
          }}
          disabled={saveStatus === "saving"}
          className="flex items-center gap-2 bg-[#EBEBEA] text-gray-800 hover:bg-[#d9d9d8] px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          <FaSave />
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
            ? "Saved"
            : "Save"}
        </button>
      </div>
    </div>
  );
}
