import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { v4 as uuid } from "uuid";

import EditorCanvas from "@/components/EditorCanvas";
import PropertiesPanel from "@/components/panels/PropertiesPanel";
import { loadGoogleFonts } from "@/utils/loadGoogleFonts";
import LeftSidebar from "@/components/sidebar/LeftSidebar";
import Topbar from "@/components/TopBar";
import TemplateGallery from "@/components/TemplateGallery";

const App = () => {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  const [templateName, setTemplateName] = useState("Untitled Template");
  const [templateId, setTemplateId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [counters, setCounters] = useState({
    text: 0,
    image: 0,
    shape: 0,
    qr: 0,
    barcode: 0,
    star: 0,
  });

  const fonts = [
    { family: "Inter" },
    { family: "Roboto" },
    { family: "Open Sans" },
    { family: "Montserrat" },
    { family: "Merriweather" },
    { family: "Georgia" },
    { family: "Playfair Display" },
    { family: "Bebas Neue" },
    { family: "Oswald" },
    { family: "Anton" },
    { family: "Pacifico" },
    { family: "Dancing Script" },
    { family: "Roboto Mono" },
    { family: "Source Code Pro" },
  ];

  const [saveStatus, setSaveStatus] = useState("idle");
  const [loading, setLoading] = useState(true); // ✅ new state

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) {
        setLoading(false); // new template (no id), not loading
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:5000/app/templates/${id}`,
          { withCredentials: true }
        );
        const template = res.data;

        if (!template) {
          navigate("/notfound");
          return;
        }

        setTemplateId(template._id);
        setTemplateName(template.name);
        setElements(template.elements || []);
        setCanvasSize(template.canvasSize);
        setCounters(
          template.counters || {
            text: 0,
            image: 0,
            shape: 0,
            qr: 0,
            barcode: 0,
            star: 0,
          }
        );
      } catch (err) {
        if (err.response?.status === 404) {
          navigate("/notfound");
        } else {
          console.error("Error loading template:", err);
        }
      } finally {
        setLoading(false); // ✅ always end loading
      }
    };

    fetchTemplate();
  }, [id, navigate]);

  useEffect(() => {
    loadGoogleFonts(fonts);
  }, []);

  const updateSelectedElement = (updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, ...updates } : el))
    );
  };

  // helper to reorder or replace whole elements array
  const updateElements = (updater) => {
    setElements((prev) => {
      if (typeof updater === "function") {
        return updater(prev); // supports functional updates
      }
      return updater; // supports direct array replacement
    });
  };

  // Combined create/update function (single save)
  const handleSaveTemplate = async (thumbnailBlob) => {
    setSaveStatus("saving");
    try {
      let id = templateId;

      // --- Helpers ---
      const isDataUrl = (s) => typeof s === "string" && s.startsWith("data:");
      const isPlaceholder = (s) =>
        typeof s === "string" &&
        !s.startsWith("http") &&
        !s.startsWith("data:") &&
        !s.startsWith("blob:");

      const dataURLToBlob = (dataurl) => {
        const arr = dataurl.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/png";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
      };

      // 1. If no templateId yet → create a template shell first
      if (!id) {
        const initPayload = {
          name: templateName || "Untitled Template",
          elements: [], // no images yet
          canvasSize,
          counters, // <-- add this
        };
        const res = await axios.post(
          "http://localhost:5000/app/templates",
          initPayload,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true, // 👈 ensures JWT cookie goes along
          }
        );
        id = res.data._id;
        setTemplateId(id);
        setTemplateName(res.data.name);
      }

      // 2. Upload image elements
      const uploadedElements = await Promise.all(
        elements.map(async (el) => {
          if (el.type !== "image") return el;

          if (typeof el.src === "string" && /^https?:\/\//i.test(el.src)) {
            return el; // already remote
          }

          if (!el.src || isPlaceholder(el.src)) {
            return { ...el, src: "" };
          }

          let fileBlob = null;
          if (el.src instanceof Blob || el.src instanceof File) {
            fileBlob = el.src;
          } else if (isDataUrl(el.src)) {
            fileBlob = dataURLToBlob(el.src);
          } else {
            return el;
          }

          const formData = new FormData();
          const filename = `${el.id || uuid()}.png`;
          formData.append("image", fileBlob, filename);
          formData.append("templateId", id);
          formData.append("elementId", el.id);

          try {
            const uploadRes = await axios.post(
              "http://localhost:5000/app/templates/upload-image",
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true, // 👈 send JWT cookie
              }
            );

            return {
              ...el,
              src: uploadRes.data.url || el.src,
              publicId: uploadRes.data.public_id || uploadRes.data.publicId,
            };
          } catch (uploadErr) {
            console.error("Image upload failed for element", el.id, uploadErr);
            return el;
          }
        })
      );

      // 3. Upload thumbnail (if provided)
      let thumbnailUrl = null;
      let thumbnailPublicId = null;
      if (thumbnailBlob) {
        const thumbForm = new FormData();
        thumbForm.append("thumbnail", thumbnailBlob, "thumbnail.png");
        thumbForm.append("templateId", id);

        try {
          const uploadRes = await axios.post(
            "http://localhost:5000/app/templates/upload-thumbnail",
            thumbForm,
            {
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true, // 👈 ensures JWT cookie is sent
            }
          );

          if (uploadRes.data.url) {
            thumbnailUrl = uploadRes.data.url;
            thumbnailPublicId =
              uploadRes.data.public_id || uploadRes.data.publicId;
          }
        } catch (thumbErr) {
          console.error("Thumbnail upload failed", thumbErr);
        }
      }

      // 4. Update template with uploaded elements + thumbnail
      const payload = {
        name: templateName || "Untitled Template",
        elements: uploadedElements,
        canvasSize,
        counters,
        ...(thumbnailUrl && { thumbnailUrl, publicId: thumbnailPublicId }),
      };

      await axios.put(`http://localhost:5000/app/templates/${id}`, payload, {
        withCredentials: true,
      });

      // 5. Update UI state
      setElements(uploadedElements);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Error saving template:", err);
      setSaveStatus("idle");
    }
  };

  // Create new from gallery
  const handleCreateTemplate = () => {
    // Reset all states to defaults (like a fresh canvas)
    setTemplateId(null);
    setTemplateName("Untitled Template");
    setElements([]);
    setCanvasSize({ width: 800, height: 600 }); // or whatever your default is

    // Close the template gallery
    setIsTemplateGalleryOpen(false);
  };

  // Fetch templates from backend
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/app/templates", {
        withCredentials: true, // 👈 ensures token cookie is sent
      });
      setTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  }, []);

  // Select a template from gallery and load into editor
  const handleSelectTemplate = (template) => {
    setTemplateId(template._id);
    setTemplateName(template.name);
    setElements(template.elements || []);
    setIsTemplateGalleryOpen(false);
    setCanvasSize(template.canvasSize);
    setCounters(
      template.counters || {
        text: 0,
        image: 0,
        shape: 0,
        qr: 0,
        barcode: 0,
        star: 0,
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading template...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Topbar
        canvasSize={canvasSize}
        setCanvasSize={setCanvasSize}
        templateName={templateName}
        setTemplateName={setTemplateName}
        onSaveTemplate={handleSaveTemplate}
        saveStatus={saveStatus}
        templateId={templateId}
      />

      <div className="flex relative flex-1 min-w-0 min-h-0 bg-slate-100">
        <LeftSidebar
          setElements={setElements}
          setSelectedId={setSelectedId}
          zoom={zoom}
          setZoom={setZoom}
          setIsTemplateGalleryOpen={setIsTemplateGalleryOpen}
          counters={counters}
          setCounters={setCounters}
        />

        <div className="flex-1 min-w-0 min-h-0 overflow-auto relative">
          <EditorCanvas
            elements={elements}
            setElements={setElements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            canvasSize={canvasSize}
            zoom={zoom}
            setIsPropertiesPanelOpen={setIsPropertiesPanelOpen}
          />
        </div>

        <PropertiesPanel
          fonts={fonts}
          elements={elements}
          setElements={setElements}
          selectedId={selectedId}
          updateSelectedElement={updateSelectedElement}
          updateElements={updateElements}
          isPropertiesPanelOpen={isPropertiesPanelOpen}
          setIsPropertiesPanelOpen={setIsPropertiesPanelOpen}
        />
      </div>

      {isTemplateGalleryOpen && (
        <TemplateGallery
          setIsTemplateGalleryOpen={setIsTemplateGalleryOpen}
          onCreateTemplate={handleCreateTemplate}
          templates={templates}
          fetchTemplates={fetchTemplates}
          onSelectTemplate={handleSelectTemplate}
        />
      )}
    </div>
  );
};

export default App;
