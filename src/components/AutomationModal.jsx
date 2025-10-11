import React, { useState, useEffect } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_BASE_URL } from "@/utils/env";
import axios from "axios";

const AutomationModal = ({ templateId, onClose }) => {
  const { apiKey } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${APP_BASE_URL}/app/automation/${templateId}`,
          { withCredentials: true }
        );
        const data = response.data;

        if (!data.success) throw new Error(data.message || "Failed to load configuration");
        setConfig(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (templateId) fetchConfig();
  }, [templateId]);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">
            Loading automation setup...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full my-8">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Google Sheets Automation
              </h2>
              <p className="text-sm text-gray-500 mt-1">{config?.templateName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Step 1: Copy Sheet */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                  1
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Copy the Template Sheet
                </h3>
              </div>
              <p className="text-sm text-gray-600 ml-8">
                Click the button below to create your own copy of the Google Sheets template.
              </p>
              <div className="ml-8">
                <a
                  href={config?.sheetTemplateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ExternalLink size={18} />
                  Copy Google Sheet Template
                </a>
              </div>
            </div>

            {/* Step 2: Column Headers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                  2
                </span>
                <h3 className="text-lg font-semibold text-gray-900">Add Column Headers</h3>
              </div>
              <p className="text-sm text-gray-600 ml-8">
                Paste these headers into <strong>Row 1</strong> of the{" "}
                <strong>Images</strong> tab in your copied sheet.
              </p>
              <div className="ml-8 space-y-2">
                <div className="relative">
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 pr-12 font-mono text-sm overflow-x-auto">
                    {config?.columnHeaders.join(" | ")}
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(config?.columnHeaders.join("\t"), "headers")
                    }
                    className="absolute right-2 top-2 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Copy headers"
                  >
                    {copiedField === "headers" ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} className="text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Tip: This will paste correctly with tab separators into adjacent cells.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    ⚙️ After pasting the headers, go to{" "}
                    <strong>Rendria → Enable Automation</strong> in the top menu.
                    This will automatically add the <em>ready</em>, <em>status</em>,
                    and other required columns for you — no setup needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: API Key */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                  3
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Configure Your Sheet
                </h3>
              </div>
              <p className="text-xs text-blue-600 mb-1 ml-8">
                ⚡ You only need to do this once. After you click{" "}
                <strong>"Enable Automation"</strong>, Rendria will prepare your sheet
                and handle checkboxes automatically.
              </p>
              <p className="text-sm text-gray-600 ml-8">
                Go to the <strong>Config</strong> tab in your sheet and paste these values:
              </p>

              {/* API Key */}
              <div className="ml-8 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  API Key (paste in cell B1):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={apiKey || "Loading..."}
                    readOnly
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(apiKey, "apiKey")}
                    className="absolute right-2 top-2 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Copy API key"
                  >
                    {copiedField === "apiKey" ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Template ID */}
              <div className="ml-8 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Template ID (paste in cell B2):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={config?.templateId || ""}
                    readOnly
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(config?.templateId, "templateId")}
                    className="absolute right-2 top-2 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Copy template ID"
                  >
                    {copiedField === "templateId" ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4: Start Using */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                  4
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Start Generating Images
                </h3>
              </div>
              <div className="ml-8 space-y-3">
                <p className="text-sm text-gray-600">
                  Fill in a row with your data in the “Images” tab, then check the{" "}
                  <strong>"ready"</strong> box when you’re done.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚡ <strong>Important:</strong> The image only generates when
                    you check the "ready" checkbox. This prevents accidental
                    generation while you're still typing.
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  The first time you check “ready,” Google will ask for
                  permissions — click <strong>“Allow”</strong>. After that, your
                  images will generate automatically.
                </p>
              </div>
            </div>

            {/* Help Section */}
            <div className="ml-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• First time? The authorization prompt is normal and appears once.</li>
                <li>• Images generate in 2–5 seconds after checking “ready.”</li>
                <li>• Check the “status” column to see generation progress.</li>
                <li>
                  • Questions? Email{" "}
                  <a href="mailto:support@rendria.com" className="underline">
                    support@rendria.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 rounded-lg p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationModal;
