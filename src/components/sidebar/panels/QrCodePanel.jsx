import { useState } from "react";
import QRCode from "react-qr-code";
import { v4 as uuid } from "uuid";

export default function QRCodePanel({ setSelectedId, setElements, counters, setCounters }) {
  const [inputValue, setInputValue] = useState("");

  const generateQRCode = async (text) => {
    const nextCount = counters.qr + 1;
  
    const newElement = {
      id: uuid(),
      name: `qr-${nextCount}`,
      type: "qr-code",
      value: text,
      x: 100,
      y: 100,
      width: 120,
      height: 120,
      borderWidth: 0,
      borderColor: "#ffffff",
      rotation:0
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);

    setCounters((prev) => ({ ...prev, qr: nextCount }));
  };

  return (
    <div className="mt-4 p-4">
      {/* Description */}
      <div className="text-sm mb-2 font-semibold text-gray-700">
        Generate a QR code for a text or URL.
      </div>

      {/* Input Field */}
      <input
        type="text"
        placeholder="Enter text or URL"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Add QR Code Button */}
      <button
        className={`mt-3 w-full text-sm py-2 px-4 rounded transition ${
          inputValue
            ? "bg-[#FF6E61FF] hover:bg-[#e75b50] text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        onClick={() => generateQRCode(inputValue)}
        disabled={!inputValue}
      >
        Add QR Code
      </button>

      {/* Preview Section */}
      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">Preview</div>
        <div className="flex justify-center items-center w-full h-32 border border-dashed border-gray-400 rounded bg-gray-50">
          {inputValue ? (
            <QRCode value={inputValue} size={96} />
          ) : (
            <span className="text-xs text-gray-400">
              QR code preview will appear here
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
