import { useState, useEffect, useRef, useMemo } from "react";
import Dropdown from "@/components/Dropdown";
import { SketchPicker } from "react-color";
import { AnimatePresence, motion } from "motion/react";
import { useClickOutside } from "@/utils/useClickOutside";
import CodeMirror from "@uiw/react-codemirror";
import { json as jsonLang, jsonParseLinter } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { lintGutter, linter } from "@codemirror/lint";
import { LuLoaderCircle } from "react-icons/lu";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function Playground() {
  const { apiKey } = useAuth();
  const [template, setTemplate] = useState("");
  const [modifications, setModifications] = useState({});
  const [format, setFormat] = useState("png");
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(600);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [templatesError, setTemplatesError] = useState("");

  const [openColorPickers, setOpenColorPickers] = useState({});
  const [elements, setElements] = useState([]);
  const [formatOpen, setFormatOpen] = useState(false);

  // Editor state for JSON editor (source of truth)
  const [requestEditorValue, setRequestEditorValue] = useState(
    JSON.stringify({ template_id: template, modifications, format }, null, 2)
  );

  // Track typing and debounce parsing
  const isTypingRef = useRef(false);
  const parseDebounceRef = useRef(null);
  const hasParseErrorRef = useRef(false);
  const hasManualEditsRef = useRef(false);

  // Memoize CodeMirror extensions so the editor doesn't reconfigure on each render
  const cmExtensions = useMemo(
    () => [lintGutter(), linter(jsonParseLinter()), jsonLang()],
    []
  );

  // Ref points to the currently open picker wrapper only
  const colorPickerRef = useRef(null);
  useClickOutside(colorPickerRef, () => setOpenColorPickers({}));

  useEffect(() => {
    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError("");
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/app/templates`, {
          withCredentials: true, // send cookie token
        });

        // Axios puts parsed data in res.data
        setTemplates(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        // err.response?.status can be used for better error handling
        setTemplatesError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load templates"
        );
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();

    return () => {
      if (parseDebounceRef.current) clearTimeout(parseDebounceRef.current);
    };
  }, []);

  // When template changes, sync elements local state (and optionally canvas size)
  const selectedTemplate = templates.find((t) => t._id === template);
  useEffect(() => {
    if (selectedTemplate) {
      setElements(
        Array.isArray(selectedTemplate.elements)
          ? selectedTemplate.elements
          : []
      );

      if (selectedTemplate.canvasSize?.width)
        setWidth(selectedTemplate.canvasSize.width);
      if (selectedTemplate.canvasSize?.height)
        setHeight(selectedTemplate.canvasSize.height);

      // 🔑 Reset modifications + editor whenever template changes
      setModifications({});
      setRequestEditorValue(
        JSON.stringify(
          {
            template_id: selectedTemplate._id,
            modifications: {},
            format,
          },
          null,
          2
        )
      );
      hasManualEditsRef.current = false; // clear manual edit flag
    } else {
      setElements([]);
      setModifications({});
      setRequestEditorValue("{}");
    }
  }, [selectedTemplate]);

  const handleRender = async () => {
    const body = getCurrentEditorJson();
    console.log({apiKey})
    if (!body) {
      alert("Invalid JSON request body");
      return;
    }

    setLoading(true);
    setResponse(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/v1/render`, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`, // 👈 auto-attach API key
        },
      });

      setResponse(res.data);
    } catch (err) {
      setResponse({
        error:
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message,
        status: err.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = selectedTemplate
    ? selectedTemplate.name
    : "Select Template";
  const placeholderThumb = `${import.meta.env.VITE_API_URL}/assets/placeholder.svg`;

  // Helpers
  const getElementKey = (el, index) =>
    el?.name || el?.id || el?._id || `el_${index}`;
  const getElementMod = (key) => modifications[key] || {};

  const getCurrentEditorJson = () => {
    try {
      return JSON.parse(requestEditorValue);
    } catch {
      return null;
    }
  };

  const setEditorFromParts = (next) => {
    const currentJson = getCurrentEditorJson();

    if (hasManualEditsRef.current && currentJson) {
      // Merge new updates into the existing JSON
      const merged = deepMerge(currentJson, next);
      setRequestEditorValue(JSON.stringify(merged, null, 2));
      return;
    }

    // No manual edits or invalid JSON → overwrite
    setRequestEditorValue(JSON.stringify(next, null, 2));
  };

  const updateElementMod = (key, partial) => {
    setModifications((prev) => {
      const nextMods = { ...prev, [key]: { ...prev[key], ...partial } };
      // reflect in editor
      setEditorFromParts({
        template_id: template,
        modifications: nextMods,
        format,
      });
      return nextMods;
    });
  };

  const updateElementField = (index, field, value) => {
    setElements((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const toggleColorPicker = (key) => {
    setOpenColorPickers((prev) => {
      const isOpen = !!prev[key];
      return isOpen ? {} : { [key]: true };
    });
  };

  // Deep merge utility (preserves nested manual edits)
  const deepMerge = (target, source) => {
    const output = { ...target };
    for (const key of Object.keys(source)) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  };

  return (
    <div className="h-[90vw] flex flex-col">
      {/* Header */}
      <header className="p-4 pl-0 border-b font-semibold text-2xl">
        Playground
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-1/3 border-r p-4 pl-0 overflow-y-auto space-y-4">
          {/* Template Picker */}
          <div className="mb-4 bg-white p-5 rounded-md border-gray-200 border">
            <label className="block mb-4 font-semibold">Template</label>
            <Dropdown isOpen={dropdownOpen} onOpenChange={setDropdownOpen}>
              <Dropdown.Button
                label={
                  templatesLoading ? "Loading templates..." : selectedLabel
                }
                isOpen={dropdownOpen}
                onOpenChange={setDropdownOpen}
              >
                {dropdownOpen && (
                  <Dropdown.Menu>
                    {templatesError && (
                      <Dropdown.MenuItem onClick={() => setDropdownOpen(false)}>
                        <span className="text-red-600">{templatesError}</span>
                      </Dropdown.MenuItem>
                    )}
                    {templates.length === 0 && !templatesError ? (
                      <Dropdown.MenuItem onClick={() => setDropdownOpen(false)}>
                        No templates
                      </Dropdown.MenuItem>
                    ) : (
                      templates.map((t) => (
                        <Dropdown.MenuItem
                          key={t._id}
                          onClick={() => {
                            setTemplate(t._id);
                            setEditorFromParts({
                              template_id: t._id,
                              modifications,
                              format,
                            });
                            setDropdownOpen(false);
                          }}
                        >
                          <img
                            src={t.thumbnailUrl || placeholderThumb}
                            alt={t.name}
                            className="h-20 rounded object-cover border"
                          />
                          <span className="truncate">{t.name}</span>
                        </Dropdown.MenuItem>
                      ))
                    )}
                  </Dropdown.Menu>
                )}
              </Dropdown.Button>
            </Dropdown>
          </div>

          {/* Format Selector */}
          <div className="bg-white p-5 rounded-md border border-gray-200">
            <label className="block mb-2 font-medium">Format</label>
            <Dropdown isOpen={formatOpen} onOpenChange={setFormatOpen}>
              <Dropdown.Button
                label={format.toUpperCase()}
                isOpen={formatOpen}
                onOpenChange={setFormatOpen}
              >
                {formatOpen && (
                  <Dropdown.Menu>
                    {[
                      { value: "png", label: "PNG" },
                      { value: "jpeg", label: "JPEG" },
                      { value: "webp", label: "WEBP" },
                    ].map((opt) => (
                      <Dropdown.MenuItem
                        key={opt.value}
                        onClick={() => {
                          setFormat(opt.value);
                          setEditorFromParts({
                            template_id: template,
                            modifications,
                            format: opt.value,
                          });
                          setFormatOpen(false);
                        }}
                      >
                        {opt.label}
                      </Dropdown.MenuItem>
                    ))}
                  </Dropdown.Menu>
                )}
              </Dropdown.Button>
            </Dropdown>
          </div>

          {/* Modifications Panel */}
          <div className="space-y-4 bg-white p-4 rounded-md border-gray-200 border">
            <h3 className="font-semibold">Modifications</h3>
            {elements.length === 0 ? (
              <p className="text-sm text-gray-500">
                No elements found in this template.
              </p>
            ) : (
              elements.map((el, idx) => {
                const key = getElementKey(el, idx);
                const label = el?.name || el?.id || key;
                const current = getElementMod(key);
                const type = el?.type;

                // For text color swatch
                const baseTextColor = current.color ?? el?.color;
                const textColorHex =
                  typeof baseTextColor === "string" &&
                  baseTextColor.startsWith("#")
                    ? baseTextColor
                    : "#000000";

                // For shape fill swatch
                const baseFill = current.fill ?? el?.fill;
                const shapeFillHex =
                  typeof baseFill === "string" && baseFill.startsWith("#")
                    ? baseFill
                    : "#000000";

                return (
                  <div
                    key={key}
                    className="bg-white p-4 rounded-lg border-dashed border border-gray-200 space-y-4"
                  >
                    <div className="text-sm font-medium">{label}</div>

                    {/* Text element controls */}
                    {type === "text" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Content
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border focus:outline focus:outline-blue-400 p-2"
                            placeholder="Content"
                            value={current.content ?? el?.content ?? ""}
                            onChange={(e) => {
                              updateElementField(
                                idx,
                                "content",
                                e.target.value
                              );
                              updateElementMod(key, {
                                content: e.target.value,
                              });
                            }}
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium mb-2">
                            Color
                          </label>
                          <div
                            ref={(elRef) => {
                              if (openColorPickers[key])
                                colorPickerRef.current = elRef;
                            }}
                            className="w-fit"
                          >
                            <button
                              type="button"
                              onClick={() => toggleColorPicker(key)}
                              className="w-10 h-10 rounded-md border flex items-center p-1"
                            >
                              <div
                                className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
                                style={{ backgroundColor: textColorHex }}
                              />
                            </button>
                            <AnimatePresence>
                              {openColorPickers[key] && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  transition={{ duration: 0.18 }}
                                  className="absolute z-20 mt-2"
                                  style={{
                                    left: 0,
                                    width: "189px",
                                    maxWidth: "100%",
                                  }}
                                >
                                  <SketchPicker
                                    color={textColorHex}
                                    onChange={(color) => {
                                      updateElementField(
                                        idx,
                                        "color",
                                        color.hex
                                      );
                                      updateElementMod(key, {
                                        color: color.hex,
                                      });
                                    }}
                                    width={189}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image element controls */}
                    {type === "image" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Image URL
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border focus:outline focus:outline-blue-400 p-2"
                          placeholder="https://..."
                          value={current.src ?? el?.src ?? ""}
                          onChange={(e) => {
                            updateElementField(idx, "src", e.target.value);
                            updateElementMod(key, { src: e.target.value }); // 👈 FIXED
                          }}
                        />
                      </div>
                    )}

                    {/* Shape element controls */}
                    {type === "shape" && (
                      <div className="relative">
                        <label className="block text-sm font-medium mb-2">
                          Fill
                        </label>
                        <div
                          ref={(elRef) => {
                            if (openColorPickers[`${key}_fill`])
                              colorPickerRef.current = elRef;
                          }}
                          className="w-fit"
                        >
                          <button
                            type="button"
                            onClick={() => toggleColorPicker(`${key}_fill`)}
                            className="w-10 h-10 rounded-md border flex items-center p-1"
                          >
                            <div
                              className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
                              style={{ backgroundColor: shapeFillHex }}
                            />
                          </button>
                          <AnimatePresence>
                            {openColorPickers[`${key}_fill`] && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.18 }}
                                className="absolute z-20 mt-2"
                                style={{
                                  left: 0,
                                  width: "189px",
                                  maxWidth: "100%",
                                }}
                              >
                                <SketchPicker
                                  color={shapeFillHex}
                                  onChange={(color) => {
                                    updateElementField(idx, "fill", color.hex);
                                    updateElementMod(key, { fill: color.hex });
                                  }}
                                  width={189}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* Barcode element controls */}
                    {type === "barcode" && (
                      <div>
                        <label className="block text sm font-medium mb-2">
                          Value
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border p-2"
                          placeholder="Barcode value"
                          value={current.value ?? el?.value ?? ""}
                          onChange={(e) => {
                            updateElementField(idx, "value", e.target.value);
                            updateElementMod(key, { value: e.target.value });
                          }}
                        />
                      </div>
                    )}

                    {/* QR Code element controls */}
                    {type === "qr-code" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Value
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border p-2"
                          placeholder="QR value"
                          value={current.value ?? el?.value ?? ""}
                          onChange={(e) => {
                            updateElementField(idx, "value", e.target.value);
                            updateElementMod(key, { value: e.target.value });
                          }}
                        />
                      </div>
                    )}

                    {/* Star rating element controls */}
                    {type === "star-rating" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Rating
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-md border p-2"
                          min={0}
                          step={1}
                          value={current.rating ?? el?.rating ?? 0}
                          onChange={(e) => {
                            const nextVal = Number(e.target.value);
                            updateElementField(idx, "rating", nextVal);
                            updateElementMod(key, { rating: nextVal });
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Removed Format + Size and left-side Render Button */}
        </aside>

        {/* Right Panel */}
        <main className="flex-1 flex flex-col overflow-y-auto px-4">
          {/* Live Preview */}
          <div className="w-full border-b">
            <div className="h-[300px] flex items-center justify-center rounded-md border-gray-200 border p-4 bg-white my-4">
              {loading ? (
                <p>Loading preview...</p>
              ) : response ? (
                response.error ? ( // 👈 check if error exists
                  <p className="text-red-600">
                    {response.error} (status {response.status || "N/A"})
                  </p>
                ) : response.url ? (
                  <img
                    src={response.url}
                    alt="Preview"
                    className="w-[250px] h-auto object-contain rounded shadow-xl"
                  />
                ) : (
                  <p className="text-gray-500">No preview available</p>
                )
              ) : (
                <p className="text-gray-500">No preview yet</p>
              )}
            </div>
          </div>

          {/* Request Editor */}
          <div className="w-full border-b">
            <div className="rounded-md border-gray-200 border p-4 bg-white my-4">
              <h3 className="font-semibold mb-2">Request</h3>
              <div className="bg-[#1e1e1e] border rounded-md p-2">
                <CodeMirror
                  value={requestEditorValue}
                  height="300px"
                  theme={oneDark}
                  style={{
                    maxHeight: "400px",
                    minHeight: "200px",
                    minWidth: "300px", // 👈 minimum width
                    maxWidth: "670px", // 👈 maximum width
                  }}
                  extensions={cmExtensions}
                  onChange={(val) => {
                    isTypingRef.current = true;
                    hasManualEditsRef.current = true; // Mark that user has made manual edits
                    if (val !== requestEditorValue) setRequestEditorValue(val);
                    if (parseDebounceRef.current)
                      clearTimeout(parseDebounceRef.current);
                    parseDebounceRef.current = setTimeout(() => {
                      try {
                        const parsed = JSON.parse(val);
                        hasParseErrorRef.current = false;
                        if (typeof parsed.template_id === "string") {
                          setTemplate(parsed.template_id);
                        }
                        if (
                          parsed.modifications &&
                          typeof parsed.modifications === "object"
                        ) {
                          setModifications(parsed.modifications);
                        }
                        if (typeof parsed.format === "string") {
                          setFormat(parsed.format);
                        }
                      } catch (e) {
                        hasParseErrorRef.current = true;
                      } finally {
                        isTypingRef.current = false;
                      }
                    }, 250);
                  }}
                />
              </div>
              <div className="pt-4">
                <button
                  onClick={handleRender}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  {loading ? "Rendering..." : "Render"}
                </button>
              </div>
            </div>
          </div>

          {/* Response Viewer */}
          <div className="w-full">
            <div className="rounded-md border-gray-200 border p-4 bg-white my-4">
              <h3 className="font-semibold mb-2">Response</h3>
              {loading ? (
                <div className="flex items-center text-blue-600">
                  <LuLoaderCircle className="animate-spin mr-2 h-5 w-5" />
                  <span>Waiting for response...</span>
                </div>
              ) : response ? (
                <div className="bg-[#1e1e1e] border rounded-md overflow-auto max-h-[400px] max-w-full p-2">
                  <CodeMirror
                    value={JSON.stringify(response, null, 2)}
                    height="300px"
                    theme={oneDark}
                    extensions={cmExtensions}
                    editable={false} // 👈 makes it read-only
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLine: false,
                    }}
                    style={{
                      maxHeight: "400px",
                      minHeight: "200px",
                      minWidth: "300px", // 👈 minimum width
                      maxWidth: "670px", // 👈 maximum width
                    }}
                  />
                </div>
              ) : (
                <p className="text-gray-500">No response yet</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
