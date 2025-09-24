import { useState } from "react";
import Barcode from "react-barcode";
import Dropdown from "@/components/Dropdown";
import { v4 as uuid } from "uuid";

const BARCODE_FORMATS = [
  "CODE128",
  "EAN13",
  "EAN8",
  "CODE39",
  "ITF14",
  "MSI",
  "pharmacode",
  "codabar",
];

const BARCODE_RULES = {
  CODE128: {
    validate: (val) => typeof val === "string" && val.length > 0,
    message: "CODE128 accepts letters, numbers, and special characters.",
  },
  EAN13: {
    validate: (val) => /^\d{13}$/.test(val),
    message: "EAN13 must be exactly 13 digits.",
  },
  EAN8: {
    validate: (val) => /^\d{8}$/.test(val),
    message: "EAN8 must be exactly 8 digits.",
  },
  CODE39: {
    validate: (val) => /^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(val),
    message: "CODE39 accepts uppercase letters, digits, and - . $ / + % space.",
  },
  ITF14: {
    validate: (val) => /^\d{14}$/.test(val),
    message:
      "ITF-14 barcode format only accepts numeric input and must be exactly 14 digits.",
  },
  MSI: {
    validate: (val) => /^\d+$/.test(val),
    message: "MSI only accepts numeric input (any number of digits).",
  },
  pharmacode: {
    validate: (val) => /^\d+$/.test(val) && +val >= 3 && +val <= 131070,
    message: "Pharmacode must be a number between 3 and 131070.",
  },
  codabar: {
    validate: (val) => /^[0-9\-\:\.\$\/\+\A-D]+$/.test(val),
    message: "Codabar accepts digits and - : . $ / + A–D.",
  },
};

export default function BarcodePanel({ setSelectedId, setElements, counters, setCounters }) {
  const [inputValue, setInputValue] = useState("");
  const [format, setFormat] = useState("CODE128");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const generateBarcode = () => {
    const rule = BARCODE_RULES[format];
    const isValid = rule?.validate(inputValue);

    if (!isValid) {
      setError(
        `"${inputValue}" is not a valid input for ${format}.\n${rule?.message}`
      );
      return;
    }

    setError("");

    const nextCount = counters.barcode + 1;

    const newElement = {
      id: uuid(),
      name: `barcode-${nextCount}`,
      type: "barcode",
      value: inputValue,
      format: format,
      x: 100,
      y: 100,
      width: 160,
      height: 80,
      borderWidth: 0,
      borderColor: "#ffffff",
      rotation: 0,
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);

    setCounters((prev) => ({ ...prev, barcode: nextCount }));
  };

  return (
    <div className="mt-4 p-4">
      {/* Description */}
      <div className="text-sm mb-2 font-semibold text-gray-700">
        Generate a barcode for any text or number.
      </div>

      {/* Value Section */}
      <div className="text-sm mb-1 font-semibold text-gray-600">Value</div>
      <input
        type="text"
        placeholder="Enter value"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setError(""); // clear error while typing
        }}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Format Section */}
      <div className="mt-4 text-sm mb-1 font-semibold text-gray-600">
        Barcode Format
      </div>
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <Dropdown.Button
          label={format}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <Dropdown.Menu>
            {BARCODE_FORMATS.map((fmt, index) => (
              <Dropdown.MenuItem key={index} onClick={() => setFormat(fmt)}>
                {fmt}
              </Dropdown.MenuItem>
            ))}
          </Dropdown.Menu>
        </Dropdown.Button>
      </Dropdown>

      {/* Add Barcode Button */}
      <button
        className={`mt-3 w-full text-sm py-2 px-4 rounded transition ${
          inputValue
            ? "bg-[#FF6E61FF] hover:bg-[#e75b50] text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        onClick={generateBarcode}
        disabled={!inputValue}
      >
        Add Barcode
      </button>

      {/* Preview Section */}
      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">Preview</div>
        <div
          className={`flex p-2 justify-center items-center w-full h-32 border border-dashed rounded bg-gray-50 ${
            error ? "border-red-500" : "border-gray-400"
          }`}
        >
          {inputValue ? (
            !error ? (
              <Barcode
                value={inputValue}
                format={format}
                width={1.5}
                height={60}
              />
            ) : (
              <span className="text-red-500 whitespace-pre-line text-xs">
                {error}
              </span>
            )
          ) : (
            <span className="text-xs text-gray-400">
              Barcode preview will appear here
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
