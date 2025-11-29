import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import clsx from "clsx";
import axios from "axios";
import {
  LuCircleAlert,
  LuArrowLeft,
  LuArrowRight,
  LuCircleCheck,
  LuDownload,
  LuFileSpreadsheet,
  LuLoaderCircle,
  LuPlay,
  LuUpload,
  LuSettings,
} from "react-icons/lu";


import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import { APP_BASE_URL } from "@/utils/env";

const STEP_FLOW = [
  { id: 1, label: "Upload CSV", description: "Drop or pick a CSV file" },
  { id: 2, label: "Map Fields", description: "Match CSV columns to template" },
  { id: 3, label: "Generate", description: "Preview and render documents" },
];

const OUTPUT_FORMATS = [
  { label: "WEBP", value: "webp" },
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
];

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const numberFormatter = new Intl.NumberFormat();

// Get available properties based on element type
const getElementProperties = (elementType) => {
  switch (elementType) {
    case "text":
      return [
        { value: "content", label: "Text Content", default: true },
        { value: "color", label: "Text Color" },
        { value: "fontSize", label: "Font Size" },
      ];
    case "image":
      return [{ value: "src", label: "Image URL", default: true }];
    case "qr-code":
      return [{ value: "value", label: "QR Code Value", default: true }];
    case "barcode":
      return [{ value: "value", label: "Barcode Value", default: true }];
    case "shape":
      return [{ value: "fill", label: "Fill Color", default: true }];
    default:
      return [];
  }
};

function SummaryItem({ label, value, muted }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={clsx("mt-1 text-lg font-semibold", muted && "text-gray-400")}
      >
        {value}
      </p>
    </div>
  );
}

export default function CsvBatch() {
  const { showAlert } = useAlert();
  const { apiKey } = useAuth();
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [csvRows, setCsvRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvError, setCsvError] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateId, setTemplateId] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [advancedMode, setAdvancedMode] = useState(false);
  const [formatSettings, setFormatSettings] = useState({
    outputFormat: "png",
    width: 900,
    height: 750,
  });
  const [rowSelectionMode, setRowSelectionMode] = useState("all");
  const [customRowSelection, setCustomRowSelection] = useState([]);
  const [previewRowIndex, setPreviewRowIndex] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    total: 0,
    completed: 0,
  });
  const [generationDone, setGenerationDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`${APP_BASE_URL}/app/templates`, {
          withCredentials: true,
        });
        setTemplates(res.data);
        if (res.data.length > 0) {
          setTemplateId(res.data[0]._id);
        }
      } catch (error) {
        showAlert("Failed to load templates", { type: "error" });
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const currentTemplate = useMemo(
    () => templates.find((tpl) => tpl._id === templateId) || null,
    [templateId, templates]
  );

  const templateFields = useMemo(() => {
    if (!currentTemplate) return [];

    return currentTemplate.elements
      .filter(
        (el) =>
          el.type === "text" ||
          el.type === "qr-code" ||
          el.type === "barcode" ||
          el.type === "image" ||
          el.type === "shape"
      )
      .map((el) => ({
        key: el.name,
        label: el.name,
        type: el.type,
        description:
          el.type === "text"
            ? "Text field"
            : el.type === "qr-code"
            ? "QR Code"
            : el.type === "barcode"
            ? "Barcode"
            : el.type === "image"
            ? "Image"
            : "Shape",
        properties: getElementProperties(el.type),
        defaultProperty:
          getElementProperties(el.type).find((p) => p.default)?.value ||
          getElementProperties(el.type)[0]?.value,
      }));
  }, [currentTemplate]);

  const canContinueToMapping = csvRows.length > 0 && !csvError;
  const canContinueToGenerate =
    templateFields.length > 0 && csvRows.length > 0;

  const rowsReady =
    rowSelectionMode === "all" ? csvRows.length : customRowSelection.length;

  // Update canvas size and reset mappings when template changes
  useEffect(() => {
    if (currentTemplate) {
      setFormatSettings((prev) => ({
        ...prev,
        width: currentTemplate.canvasSize.width,
        height: currentTemplate.canvasSize.height,
      }));
      setFieldMappings({});
    }
  }, [currentTemplate]);

  const handleFile = (file) => {
    if (!file) return;

    if (file.size > MAX_CSV_SIZE_BYTES) {
      setCsvError("File too large. Max 5MB supported right now.");
      return;
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (file.type !== "text/csv" && fileExt !== "csv") {
      setCsvError("Unsupported file type. Please upload a .csv file.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        const headers = results.meta.fields?.filter(Boolean) || [];
        const cleanedRows = (results.data || []).filter((row) =>
          Object.values(row).some(
            (value) => value !== null && `${value}`.trim() !== ""
          )
        );

        if (!headers.length) {
          setCsvError(
            "We couldn't find a header row. Please include column names in row 1."
          );
          return;
        }

        const duplicateHeaders = headers.filter(
          (header, index) => headers.indexOf(header) !== index
        );
        if (duplicateHeaders.length) {
          setCsvError(
            `Duplicate column names detected: ${Array.from(
              new Set(duplicateHeaders)
            ).join(", ")}`
          );
          return;
        }

        setCsvError(null);
        setCsvFile({ name: file.name, size: file.size });
        setCsvHeaders(headers);
        setCsvRows(cleanedRows);
        setRowCount(cleanedRows.length);
        setStep(1);
        setFieldMappings({});
        setGenerationDone(false);
        setCustomRowSelection([]);
        setPreviewRowIndex(null);
        setDownloadUrl(null);
        showAlert("CSV parsed successfully", { type: "success" });
      },
      error: () => {
        setCsvError(
          "Failed to read the CSV. Try again or use a different file."
        );
      },
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleContinueFromUpload = () => setStep(2);
  const handleBackToUpload = () => setStep(1);
  const handleContinueToGenerate = () => {
    setStep(3);
    setRowSelectionMode("all");
    setCustomRowSelection([]);
    setPreviewRowIndex(0);
  };

  const handleToggleRowSelection = (index) => {
    if (rowSelectionMode === "all") return;
    setCustomRowSelection((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index);
      }
      return [...prev, index];
    });
  };

  // Prepare modifications for a single row
  // In CsvBatch.jsx, replace prepareRowModifications function:
const prepareRowModifications = (row) => {
  const modifications = {};

  Object.entries(fieldMappings).forEach(([fieldKey, mapping]) => {
    if (!mapping || !mapping.column || !row[mapping.column]) return;

    const field = templateFields.find((f) => f.key === fieldKey);
    if (!field) return;

    const value = row[mapping.column];
    const property = advancedMode && mapping.property 
      ? mapping.property 
      : field.defaultProperty;

    // ✅ Use the actual element name from the template, not a modified version
    if (!modifications[fieldKey]) {
      modifications[fieldKey] = {};
    }
    modifications[fieldKey][property] = value;
  });

  return modifications;
};

const handleGenerate = async () => {
  if (!rowsReady) {
    showAlert("Select at least one row", { type: "error" });
    return;
  }

  if (!apiKey) {
    showAlert("API key not found. Please check your authentication.", {
      type: "error",
    });
    return;
  }

  // Get selected rows
  const selectedRows =
    rowSelectionMode === "all"
      ? csvRows
      : csvRows.filter((_, index) => customRowSelection.includes(index));

  setIsGenerating(true);
  setGenerationDone(false);
  setGenerationProgress({ total: selectedRows.length, completed: 0 });
  setDownloadUrl(null);

  try {
    // Prepare batch request data
    const batchRequests = selectedRows.map((row) => {
      const modifications = {};

      Object.entries(fieldMappings).forEach(([fieldKey, mapping]) => {
        if (!mapping || !mapping.column || !row[mapping.column]) return;

        const field = templateFields.find((f) => f.key === fieldKey);
        if (!field) return;

        const value = row[mapping.column];
        const property = advancedMode && mapping.property 
          ? mapping.property 
          : field.defaultProperty;

        // ✅ Build nested object: { "elementName": { "property": "value" } }
        if (!modifications[fieldKey]) {
          modifications[fieldKey] = {};
        }
        modifications[fieldKey][property] = value;
      });

      return {
        template_id: templateId,
        modifications,
        format: formatSettings.outputFormat,
      };
    });

    console.log("Sending batch request:", JSON.stringify(batchRequests[0], null, 2));

    // Send batch request to backend
    const res = await axios.post(
      `${APP_BASE_URL}/v1/render/batch`,
      {
        requests: batchRequests,
        zip_name: `${currentTemplate?.name || "batch"}_${Date.now()}.zip`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
  
      if (res.data.zip_url) {
        setDownloadUrl(res.data.zip_url);
        setGenerationDone(true);
        setGenerationProgress({ 
          total: res.data.total_processed, 
          completed: res.data.total_processed 
        });
        
        const message = res.data.insufficient_credits
          ? `Generated ${res.data.total_processed} of ${res.data.total_requested} documents. ${res.data.total_requested - res.data.total_processed} rows skipped due to insufficient credits.`
          : `Batch generation complete! Generated ${res.data.total_processed} documents.`;
        
        showAlert(message, {
          type: res.data.insufficient_credits ? "warning" : "success",
        });
  
        if (res.data.total_failed > 0) {
          showAlert(`${res.data.total_failed} renders failed`, { type: "warning" });
        }
      } else {
        throw new Error("No ZIP URL returned from server");
      }
    } catch (err) {
      showAlert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to generate batch",
        { type: "error" }
      );
      setGenerationProgress({ total: 0, completed: 0 });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!downloadUrl) return;
  
    const res = await axios.get(downloadUrl, {
      responseType: "blob",
    });
  
    const blob = new Blob([res.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = `batch_${Date.now()}.zip`;
    link.click();
  
    URL.revokeObjectURL(url);
  };
  
  

  const previewRows = csvRows.slice(0, 20);
  const selectionRows = csvRows.slice(0, 50);
  const previewRowData =
    previewRowIndex !== null && previewRowIndex < csvRows.length
      ? csvRows[previewRowIndex]
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bulk CSV Generation
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload a CSV, map your template fields, preview, and generate hundreds
          of on-brand designs in minutes.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-3">
        {STEP_FLOW.map((item) => {
          const status =
            step === item.id ? "current" : step > item.id ? "done" : "upcoming";
          return (
            <div
              key={item.id}
              className={clsx(
                "rounded-xl border p-4",
                status === "current" && "border-[#FF6E61] bg-[#FFF5F3]",
                status === "done" && "border-emerald-200 bg-emerald-50",
                status === "upcoming" && "border-gray-100"
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step {item.id}
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {item.label}
              </p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <section className="space-y-6">
          <div
            className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center shadow-sm"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0ED] text-[#FF6E61]">
              <LuUpload className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">
              Drag & drop your CSV
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Must include a header row. We'll preview the first 20 rows
              automatically.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-[#FF6E61] px-6 py-3 text-sm font-semibold text-white shadow hover:bg-[#e75d51]"
              >
                <LuFileSpreadsheet className="h-4 w-4" /> Choose CSV
              </button>
              {csvFile && (
                <div className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
                  {csvFile.name} ·{" "}
                  {numberFormatter.format(Math.round(csvFile.size / 1024))} KB
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            {csvError && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <LuCircleAlert className="h-4 w-4" /> {csvError}
              </div>
            )}
          </div>

          {csvRows.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-0 shadow-sm">
              <div className="max-h-[32rem] overflow-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white p-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Preview
                    </p>
                    <p className="text-xs text-gray-500">
                      Showing first 20 rows · {rowCount} rows detected
                    </p>
                  </div>
                  <button
                    onClick={handleContinueFromUpload}
                    disabled={!canContinueToMapping}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white",
                      canContinueToMapping
                        ? "bg-[#FF6E61] hover:bg-[#e75d51]"
                        : "cursor-not-allowed bg-gray-300"
                    )}
                  >
                    Continue to Field Mapping{" "}
                    <LuArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="w-[1040px] p-6">
                  <div className="w-full rounded overflow-x-auto border border-gray-100">
                    <table className="w-full table-auto divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          {csvHeaders.map((header) => (
                            <th
                              key={header}
                              className="px-3 py-2 align-top break-words"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {previewRows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-gray-50 align-top"
                          >
                            {csvHeaders.map((header) => (
                              <td
                                key={header}
                                className="px-3 py-2 text-gray-700 align-top break-words"
                              >
                                {row[header] ? (
                                  String(row[header])
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Select Template & Map Fields
              </p>
              <p className="text-xs text-gray-500">
                Choose a template and match CSV columns to template fields
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBackToUpload}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                <LuArrowLeft className="h-4 w-4" /> Back to upload
              </button>
              <button
                onClick={handleContinueToGenerate}
                disabled={!canContinueToGenerate}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold",
                  canContinueToGenerate
                    ? "bg-[#FF6E61] text-white hover:bg-[#e75d51]"
                    : "cursor-not-allowed bg-gray-300 text-white"
                )}
              >
                Continue to Generate <LuArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <LuLoaderCircle className="h-8 w-8 animate-spin text-[#FF6E61]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Select Template
                </p>
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No templates available. Create a template first.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {templates.map((tpl) => (
                      <button
                        key={tpl._id}
                        onClick={() => setTemplateId(tpl._id)}
                        className={clsx(
                          "rounded-lg border-2 p-3 text-left transition",
                          templateId === tpl._id
                            ? "border-[#FF6E61] bg-[#FFF5F3]"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <img
                          src={tpl.thumbnailUrl}
                          alt={tpl.name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <p className="font-medium text-sm truncate">
                          {tpl.name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field Mapping */}
              {currentTemplate && templateFields.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Field Mapping
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Match CSV columns to template fields. The default
                        property will be used.
                      </p>
                    </div>
                    <button
                      onClick={() => setAdvancedMode(!advancedMode)}
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                        advancedMode
                          ? "border-[#FF6E61] bg-[#FFF5F3] text-[#FF6E61]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <LuSettings className="h-3 w-3" />
                      {advancedMode ? "Simple Mode" : "Advanced Mode"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {templateFields.map((field) => (
                      <div
                        key={field.key}
                        className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {field.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {field.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-48">
                            <select
                              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#FF6E61] focus:outline-none"
                              value={fieldMappings[field.key]?.column || ""}
                              onChange={(e) => {
                                const column = e.target.value || null;
                                setFieldMappings((prev) => ({
                                  ...prev,
                                  [field.key]: column
                                    ? {
                                        column,
                                        property:
                                          prev[field.key]?.property ||
                                          field.defaultProperty,
                                      }
                                    : null,
                                }));
                              }}
                            >
                              <option value="">Select column</option>
                              {csvHeaders.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>

                          {advancedMode && fieldMappings[field.key]?.column && (
                            <div className="w-40">
                              <select
                                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#FF6E61] focus:outline-none"
                                value={
                                  fieldMappings[field.key]?.property ||
                                  field.defaultProperty
                                }
                                onChange={(e) => {
                                  setFieldMappings((prev) => ({
                                    ...prev,
                                    [field.key]: {
                                      ...prev[field.key],
                                      property: e.target.value,
                                    },
                                  }));
                                }}
                              >
                                {field.properties.map((prop) => (
                                  <option key={prop.value} value={prop.value}>
                                    {prop.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {!advancedMode && fieldMappings[field.key]?.column && (
                            <span className="text-xs text-gray-500 w-40">
                              →{" "}
                              {
                                field.properties.find(
                                  (p) => p.value === field.defaultProperty
                                )?.label
                              }
                            </span>
                          )}

                          {fieldMappings[field.key] && (
                            <button
                              onClick={() =>
                                setFieldMappings((prev) => ({
                                  ...prev,
                                  [field.key]: null,
                                }))
                              }
                              className="text-sm font-medium text-gray-500 hover:text-gray-800 whitespace-nowrap"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {advancedMode && (
                    <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700">
                      <p className="font-medium">Advanced Mode Enabled</p>
                      <p className="text-xs mt-1">
                        You can now customize which property each CSV column
                        updates.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Format & Output Settings */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Output Settings
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 block mb-2">
                      Output Format
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {OUTPUT_FORMATS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            setFormatSettings((prev) => ({
                              ...prev,
                              outputFormat: option.value,
                            }))
                          }
                          className={clsx(
                            "rounded-lg border px-3 py-2 text-sm font-semibold",
                            formatSettings.outputFormat === option.value
                              ? "border-[#FF6E61] bg-[#FFF5F3] text-[#FF6E61]"
                              : "border-gray-200 text-gray-600"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 block mb-2">
                    Canvas Size
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={formatSettings.width}
                        onChange={(event) =>
                          setFormatSettings((prev) => ({
                            ...prev,
                            width: Number(event.target.value),
                          }))
                        }
                        className="rounded border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Width"
                      />
                      <input
                        type="number"
                        value={formatSettings.height}
                        onChange={(event) =>
                          setFormatSettings((prev) => ({
                            ...prev,
                            height: Number(event.target.value),
                          }))
                        }
                        className="rounded border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Height"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Ready to generate
              </p>
              <p className="text-xs text-gray-500">
                Review your selections and start the batch generation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                <LuArrowLeft className="h-4 w-4" /> Back to mapping
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !rowsReady}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white",
                  rowsReady && !isGenerating
                    ? "bg-[#FF6E61] hover:bg-[#e75d51]"
                    : "bg-gray-300"
                )}
              >
                {isGenerating ? (
                  <>
                    <LuLoaderCircle className="h-4 w-4 animate-spin" />{" "}
                    Generating...
                  </>
                ) : (
                  <>
                    <LuPlay className="h-4 w-4" /> Generate Batch
                  </>
                )}
              </button>
              {generationDone && downloadUrl && (
                <button
                  onClick={handleDownloadZip}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <LuDownload className="h-4 w-4" /> Download ZIP
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryItem
                  label="Template"
                  value={currentTemplate?.name || "—"}
                />
                <SummaryItem
                  label="Rows selected"
                  value={`${rowsReady} rows`}
                  muted={!rowsReady}
                />
                <SummaryItem
                  label="Output"
                  value={formatSettings.outputFormat.toUpperCase()}
                />
                <SummaryItem
                  label="Canvas"
                  value={`${formatSettings.width} × ${formatSettings.height}`}
                />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">
                  Row selection
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    { label: "All rows", value: "all" },
                    { label: "Choose specific rows", value: "custom" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRowSelectionMode(option.value)}
                      disabled={isGenerating}
                      className={clsx(
                        "rounded-full border px-4 py-1.5 text-sm font-semibold",
                        rowSelectionMode === option.value
                          ? "border-[#FF6E61] bg-[#FFF5F3] text-[#FF6E61]"
                          : "border-gray-200 text-gray-600",
                        isGenerating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {rowSelectionMode === "custom" && (
                  <div className="mt-4 max-h-64 overflow-auto border border-gray-100 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2">Row #</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectionRows.map((row, index) => {
                          const absoluteIndex = index;
                          const selected =
                            customRowSelection.includes(absoluteIndex);
                          return (
                            <tr
                              key={absoluteIndex}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-3 py-2 font-mono text-gray-700">
                                Row {absoluteIndex + 1}
                              </td>
                              <td className="px-3 py-2">
                                {selected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                                    <LuCircleCheck className="h-3 w-3" />{" "}
                                    Selected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                    Not selected
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleToggleRowSelection(absoluteIndex)
                                    }
                                    disabled={isGenerating}
                                    className={clsx(
                                      "rounded border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50",
                                      isGenerating && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {selected ? "Remove" : "Select"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setPreviewRowIndex(absoluteIndex)
                                    }
                                    className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                                  >
                                    View Data
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {csvRows.length > selectionRows.length && (
                      <p className="bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        Showing first {selectionRows.length} rows out of{" "}
                        {csvRows.length} total rows.
                      </p>
                    )}
                  </div>
                )}

                {isGenerating && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Processing batch...
                      </p>
                      <p className="text-xs text-gray-500">
                        This may take a few minutes
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-[#FF6E61] transition-all duration-300 animate-pulse"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Generating {rowsReady} documents...
                    </p>
                  </div>
                )}

                {generationDone && (
                  <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <LuCircleCheck className="h-5 w-5" />
                      <p className="font-semibold">Generation Complete!</p>
                    </div>
                    <p className="text-sm text-emerald-600 mt-1">
                      Your batch of {rowsReady} documents is ready. Click
                      "Download ZIP" to get your files.
                    </p>
                  </div>
                )}
              </div>

              {/* Mapping Summary */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Mapping Summary
                </p>
                {Object.entries(fieldMappings).filter(([_, value]) => value)
                  .length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No fields mapped. Go back to mapping step.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(fieldMappings)
                      .filter(([_, value]) => value)
                      .map(([fieldKey, mapping]) => {
                        const field = templateFields.find(
                          (f) => f.key === fieldKey
                        );
                        return (
                          <div
                            key={fieldKey}
                            className="flex items-center justify-between p-2 rounded bg-gray-50 text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              {fieldKey}
                            </span>
                            <span className="text-gray-500">
                              ←{" "}
                              <span className="font-mono text-gray-800">
                                {mapping.column}
                              </span>
                              {advancedMode && mapping.property && (
                                <span className="ml-2 text-xs">
                                  (
                                  {
                                    field?.properties.find(
                                      (p) => p.value === mapping.property
                                    )?.label
                                  }
                                  )
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Row Data Preview
                  </p>
                  {previewRowData && (
                    <span className="text-xs text-gray-500">
                      Row {previewRowIndex + 1}
                    </span>
                  )}
                </div>
                {previewRowData ? (
                  <div className="max-h-[28rem] overflow-auto rounded border border-gray-100 bg-gray-50">
                    <div className="divide-y divide-gray-100">
                      {Object.entries(previewRowData).map(([key, value]) => {
                        // Check if this column is mapped to a field
                        const isMapped = Object.values(fieldMappings).some(
                          (mapping) => mapping?.column === key
                        );
                        
                        return (
                          <div
                            key={key}
                            className={clsx(
                              "flex gap-3 p-3",
                              isMapped && "bg-blue-50"
                            )}
                          >
                            <span className="w-32 shrink-0 font-mono text-xs font-medium uppercase text-gray-500">
                              {key}
                              {isMapped && (
                                <span className="ml-1 text-blue-600">✓</span>
                              )}
                            </span>
                            <span className="text-sm text-gray-800 break-words">
                              {value || (
                                <span className="text-gray-400">—</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    Click "View Data" on any row to preview its values here.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#FFF5F3] p-5 text-sm text-[#9c4339]">
                <div className="flex items-center gap-2">
                  <LuCircleAlert className="h-4 w-4" />
                  <p className="font-semibold">Important</p>
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Batch generation happens on our servers</li>
                  <li>• You can safely close this page during processing</li>
                  <li>• The ZIP file will be available for 24 hours</li>
                  <li>• Large batches may take several minutes</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}