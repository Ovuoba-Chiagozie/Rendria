// src/pages/ApiDocs.jsx
import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json as jsonLang } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { php } from "@codemirror/lang-php";
import { java } from "@codemirror/lang-java";
import { StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { EditorView } from "@codemirror/view"; // for lineWrapping // for curl
import { oneDark } from "@codemirror/theme-one-dark";
import { lintGutter, linter } from "@codemirror/lint";
import { jsonParseLinter } from "@codemirror/lang-json";
import { LuCopy } from "react-icons/lu";
import { SiJavascript, SiPython, SiPhp } from "react-icons/si";
import { FaTerminal, FaJava } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function SmallBadge({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 " +
        className
      }
    >
      {children}
    </span>
  );
}

export default function ApiDocs() {
  const { apiKey } = useAuth();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState("curl");
  const cmExtensions = useMemo(
    () => [lintGutter(), linter(jsonParseLinter()), jsonLang()],
    []
  );

  const shellLang = StreamLanguage.define(shell);

  // helper to return language extension per tab
  const getExtensionForTab = (tab) => {
    switch (tab) {
      case "curl":
        // curl (shell) -> use legacy shell stream mode
        return [shellLang, EditorView.lineWrapping];
      case "node":
        return [javascript(), EditorView.lineWrapping];
      case "python":
        return [python(), EditorView.lineWrapping];
      case "php":
        return [php(), EditorView.lineWrapping];
      case "java":
        return [java(), EditorView.lineWrapping];
      default:
        return [EditorView.lineWrapping];
    }
  };

  // Example request body (snake_case) — this mirrors your renderValidator
  const exampleRequestJson = {
    template_id: "TEMPLATE_ID_HERE",
    format: "png",
    width: 1200,
    height: 630,
    modifications: {
      title: {
        content: "Hello world",
        color: "#111827",
        fontSize: 48,
        family: "Inter",
        rotation: 0,
        x: 40,
        y: 56,
        width: 1000,
        height: 120,
      },
      hero_image: {
        src: "https://example.com/image.jpg",
        x: 0,
        y: 150,
        width: 1200,
        height: 400,
        objectFit: "cover",
      },
    },
  };

  // Helper to build code snippets with the current apiKey inserted
  const apiKeyOrPlaceholder = apiKey || "YOUR_API_KEY_HERE";

  const examples = useMemo(() => {
    const bodyStr = JSON.stringify(exampleRequestJson, null, 2);
    return {
      curl: `curl -X POST "https://api.rendria.com/v1/render" \\
  -H "Authorization: Bearer ${apiKeyOrPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '${bodyStr}'`,
      node: `// Node (axios)
const axios = require("axios");

(async () => {
  const res = await axios.post(
    "https://api.rendria.com/v1/render",
    ${bodyStr},
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${apiKeyOrPlaceholder}",
      },
    }
  );
  console.log(res.data);
})();`,
      python: `# Python (requests)
import requests

body = ${bodyStr}

res = requests.post(
    "https://api.rendria.com/v1/render",
    json=body,
    headers={
        "Authorization": "Bearer ${apiKeyOrPlaceholder}",
        "Content-Type": "application/json",
    },
)
print(res.json())`,
      php: `// PHP (curl)
<?php
$ch = curl_init("https://api.rendria.com/v1/render");
$payload = json_encode(${bodyStr});

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "Authorization: Bearer ${apiKeyOrPlaceholder}"
]);

$response = curl_exec($ch);
echo $response;
?>`,
      java: `// Java (OkHttp)
import okhttp3.*;

OkHttpClient client = new OkHttpClient();
MediaType JSON = MediaType.parse("application/json; charset=utf-8");

String json = """
${bodyStr}
""";

RequestBody body = RequestBody.create(json, JSON);

Request request = new Request.Builder()
  .url("https://api.rendria.com/v1/render")
  .post(body)
  .addHeader("Authorization", "Bearer ${apiKeyOrPlaceholder}")
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`,
    };
  }, [apiKeyOrPlaceholder]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // minimal feedback — replace with your AlertContext if you want
      showAlert("Copied to clipboard", { type: "success" });
    } catch (err) {
      showAlert("Failed to copy", { type: "error" });
    }
  };

  // Element modification tables data (from your allowedFields)
  const elementTables = [
    {
      name: "text",
      rows: [
        ["content", "string", "Text content"],
        ["color", "string", "HEX/RGB/any CSS color"],
        ["font_size", "number", "Font size (px)"],
        ["family", "string", "Font family name"],
        ["text_align_index", "0 | 1 | 2", "0=left, 1=center, 2=right"],
        ["rotation", "number", "Rotation degrees"],
        ["x", "number", "X position"],
        ["y", "number", "Y position"],
        ["width", "number", "Width (px)"],
        ["height", "number", "Height (px)"],
      ],
    },
    {
      name: "image",
      rows: [
        ["src", "string (url)", "Image URL"],
        ["x", "number", "X position"],
        ["y", "number", "Y position"],
        ["width", "number", "Width (px)"],
        ["height", "number", "Height (px)"],
        ["rotation", "number", "Rotation degrees"],
        ["border_width", "number", "Border width (px)"],
        ["border_color", "string", "Border color"],
        ["border_radius", "{ value, unit }", "Border radius object"],
        ["object_fit", "'fill' | 'cover' | 'contain'", "CSS object-fit style"],
      ],
    },
    {
      name: "shape",
      rows: [
        ["x", "number", "X position"],
        ["y", "number", "Y position"],
        ["width", "number", "Width (px)"],
        ["height", "number", "Height (px)"],
        ["rotation", "number", "Rotation degrees"],
        ["fill", "string", "Fill color"],
        ["stroke_color", "string", "Stroke color"],
        ["stroke_width", "number", "Stroke width"],
      ],
    },
    {
      name: "qr-code",
      rows: [
        ["x", "number"],
        ["y", "number"],
        ["width", "number"],
        ["height", "number"],
        ["rotation", "number"],
        ["value", "string", "QR content"],
      ],
    },
    {
      name: "barcode",
      rows: [
        ["x", "number"],
        ["y", "number"],
        ["width", "number"],
        ["height", "number"],
        ["rotation", "number"],
        ["value", "string", "Barcode value"],
        ["format", "string", "Barcode format (optional)"],
      ],
    },
    {
      name: "star-rating",
      rows: [
        ["x", "number"],
        ["y", "number"],
        ["width", "number"],
        ["height", "number"],
        ["rotation", "number"],
        ["rating", "number", "Rating value (e.g., 0-5)"],
      ],
    },
  ];
  

  // Response example
  const responseExample = {
    render_id: "A1B2C3D4...",
    template_id: "TEMPLATE_ID_HERE",
    userId: "USER_OBJECT_ID",
    template_name: "My Template",
    url: "https://res.cloudinary.com/.../image.png",
    format: "png",
    width: 1200,
    height: 630,
    apiKeyId: "APIKEY_OBJECT_ID",
    created_at: "2025-09-16T14:52:05.437Z"
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        API Reference — Render endpoint
      </h1>

      <SectionCard title="Overview">
        <p className="text-sm text-gray-700 mb-2">
          Render a template server-side with optional element modifications.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <SmallBadge><strong>POST&nbsp;&nbsp;</strong> https://api.rendria.com/v1/render</SmallBadge>
          <SmallBadge> <strong>Auth:&nbsp;&nbsp;</strong>Bearer API key</SmallBadge>
          <SmallBadge> <strong>Response:&nbsp;&nbsp;</strong>JSON with image URL</SmallBadge>
        </div>
      </SectionCard>

      <SectionCard title="Authentication">
        <p className="mb-2 text-sm text-gray-700">
          This is your API key. Provide it in the <code>Authorization</code> header of your request:
        </p>

        {/* Standalone API key card */}
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 p-3 rounded mb-3 font-mono text-sm">
          <span className="truncate">{apiKeyOrPlaceholder}</span>
          <button
            onClick={() => copyToClipboard(apiKeyOrPlaceholder)}
            className="flex items-center gap-2 px-2 py-1 text-xs rounded bg-yellow-100 hover:bg-yellow-200"
          >
            <LuCopy size={14} /> Copy
          </button>
        </div>

        <div className="bg-gray-50 p-3 rounded mb-3 font-mono text-sm">
          Authorization: Bearer{" "}
          <span className="font-semibold">{apiKeyOrPlaceholder}</span>
        </div>

        <p className="text-sm text-gray-600">
          Use the API key generated above. Example code snippets
          below include the header automatically.
        </p>
      </SectionCard>

      <SectionCard title="Examples">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-3 py-1 rounded ${
                activeTab === "curl"
                  ? "bg-[#FF6E61] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaTerminal className="inline mr-2" /> cURL
            </button>
            <button
              onClick={() => setActiveTab("node")}
              className={`px-3 py-1 rounded ${
                activeTab === "node"
                  ? "bg-[#FF6E61] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <SiJavascript className="inline mr-2" /> Node
            </button>
            <button
              onClick={() => setActiveTab("python")}
              className={`px-3 py-1 rounded ${
                activeTab === "python"
                  ? "bg-[#FF6E61] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <SiPython className="inline mr-2" /> Python
            </button>
            <button
              onClick={() => setActiveTab("php")}
              className={`px-3 py-1 rounded ${
                activeTab === "php"
                  ? "bg-[#FF6E61] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <SiPhp className="inline mr-2" /> PHP
            </button>
            <button
              onClick={() => setActiveTab("java")}
              className={`px-3 py-1 rounded ${
                activeTab === "java"
                  ? "bg-[#FF6E61] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaJava className="inline mr-2" /> Java
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(examples[activeTab])}
              className="flex items-center gap-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
            >
              <LuCopy /> Copy
            </button>
          </div>
        </div>

        <div className="rounded-md p-3 border border-gray-100 overflow-hidden">
        <div className="bg-[#1e1e1e] border rounded-md p-2">
            <CodeMirror
              value={examples[activeTab]}
              height="320px"
              theme={oneDark}
              extensions={getExtensionForTab(activeTab)}
              editable={false}
              basicSetup={{ lineNumbers: true }}
              style={{ borderRadius: 8 }}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Request Body (JSON)">
        <p className="text-sm text-gray-700 mb-3">
          The request body accepts the following top-level fields:
        </p>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-2">Field</th>
              <th className="py-2">Type</th>
              <th className="py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 font-medium">template_id</td>
              <td className="py-2">string (required)</td>
              <td className="py-2">ID of the template to render</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 font-medium">format</td>
              <td className="py-2">"png" | "jpeg" | "webp" (default "png")</td>
              <td className="py-2">Output image format</td>
            </tr>
            <tr>
              <td className="py-2 font-medium">width / height</td>
              <td className="py-2">integer (100–5000) optional</td>
              <td className="py-2">Overrides template canvas size</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 font-medium">modifications</td>
              <td className="py-2">object</td>
              <td className="py-2">
                Map of elementName → partial element props (see tables below)
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Element modification fields</h4>
          {elementTables.map((t) => (
            <div key={t.name} className="mb-4">
              <h5 className="text-sm font-semibold mb-2">{t.name}</h5>
              <div className="overflow-auto rounded border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="p-2 text-left">Field</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r) => (
                      <tr key={r[0]} className="odd:bg-white even:bg-gray-50">
                        <td className="p-2 font-medium">{r[0]}</td>
                        <td className="p-2">{r[1]}</td>
                        <td className="p-2">{r[2] || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Response">
        <p className="text-sm text-gray-700 mb-3">
          On success you'll get a render document; `url` points to the uploaded
          image.
        </p>

        <div className="bg-[#1e1e1e] border rounded-md p-2">
          <CodeMirror
            value={JSON.stringify(responseExample, null, 2)}
            height="220px"
            theme={oneDark}
            extensions={cmExtensions}
            editable={false}
            basicSetup={{ lineNumbers: false }}
            style={{ borderRadius: 8 }}
          />
        </div>
      </SectionCard>

      <SectionCard title="Error codes">
        <ul className="list-disc pl-5 text-sm text-gray-700">
          <li>
            <strong>400</strong> — Bad request / validation error (invalid field
            for element, missing template_id).
          </li>
          <li>
            <strong>401</strong> — Unauthorized (missing/invalid API key).
          </li>
          <li>
            <strong>404</strong> — Template not found or not owned by your API
            key.
          </li>
          <li>
            <strong>429</strong> — Rate limit / credits exhausted 
          </li>
          <li>
            <strong>500</strong> — Server error during render.
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
