import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CategoryModal({
  isOpen,
  onClose,
  category,
  presets = [],
  onSelectPreset,
  onCreateCustom,
}) {
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);

  // check if custom inputs are valid
  const isCustomValid =
    Number(customWidth) >= 100 &&
    Number(customWidth) <= 5000 &&
    Number(customHeight) >= 100 &&
    Number(customHeight) <= 5000;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col m-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b px-6 py-4 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">
                {category?.name || "Templates"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {category?.name === "Custom Size" ? (
                <div className="flex flex-wrap gap-3 items-center">
                  <Input
                    type="number"
                    placeholder="Width"
                    value={customWidth}
                    min={100}
                    max={5000}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={customHeight}
                    min={100}
                    max={5000}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-24"
                  />
                  {/* Helper text */}
                  <p className="text-xs text-gray-500 w-full">
                    Width and height must be between 100 and 5000 px.
                  </p>
                </div>
              ) : presets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {presets.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPreset(preset)}
                      className={`border rounded-xl p-4 cursor-pointer transition flex flex-col items-center text-center ${
                        selectedPreset?.name === preset.name
                          ? "border-blue-400 shadow-md"
                          : "hover:shadow-md"
                      }`}
                    >
                      <div className="bg-gray-100 w-full aspect-video rounded-md mb-3" />
                      <p className="font-medium">{preset.name}</p>
                      <p className="text-sm text-gray-500">
                        {preset.width} × {preset.height} px
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No presets available in this category.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 flex justify-end sticky bottom-0 bg-white z-10">
              {category?.name === "Custom Size" ? (
                <Button
                  disabled={!isCustomValid}
                  onClick={() => {
                    onCreateCustom({
                      width: Number(customWidth),
                      height: Number(customHeight),
                    });
                    onClose();
                  }}
                >
                  Create Template
                </Button>
              ) : (
                <Button
                  disabled={!selectedPreset}
                  onClick={() => {
                    if (selectedPreset) {
                      onSelectPreset(selectedPreset);
                      onClose();
                    }
                  }}
                >
                  Create Template
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
