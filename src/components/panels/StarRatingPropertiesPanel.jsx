import { useState, useRef } from "react";
import { SketchPicker } from "react-color";
import { motion, AnimatePresence } from "motion/react";

import { useClickOutside } from "@/utils/useClickOutside";

const StarRatingPropertiesPanel = ({
  elements,
  selectedId,
  updateSelectedElement,
  updateElements
}) => {
  const selectedElement = elements.find(
    (el) => el.id === selectedId && el.type === "star-rating"
  );
  if (!selectedElement) return null;

  const [fillPickerVisible, setFillPickerVisible] = useState(false);
  const [borderPickerVisible, setBorderPickerVisible] = useState(false);
  const [emptyPickerVisible, setEmptyPickerVisible] = useState(false);

  const fillRef = useRef(null);
  const borderRef = useRef(null);
  const emptyRef = useRef(null);

  useClickOutside(fillRef, () => setFillPickerVisible(false));
  useClickOutside(borderRef, () => setBorderPickerVisible(false));
  useClickOutside(emptyRef, () => setEmptyPickerVisible(false));

  return (
    <div className="w-full px-4">
       {/* Layer Name */}
       <div className="mt-2">
        <div className="text-sm font-semibold mb-2">Layer Name</div>
        <input
          type="text"
          className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
          placeholder="Layer name"
          value={selectedElement.name || ""}
          onChange={(e) => updateSelectedElement({ name: e.target.value })}
        />
      </div>
      {/* Star Colors */}
      <div className="mt-6">
        <div className="text-sm font-semibold mb-2">Star Colors</div>

        {/* Fill Color */}
        <div className="relative mb-4 w-fit" ref={fillRef}>
          <div className="text-xs text-left capitalize mb-1">Fill</div>
          <button
            className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
            onClick={() => setFillPickerVisible((prev) => !prev)}
          >
            <div
              className="w-full h-full rounded-[4px] border border-blue-50"
              style={{ backgroundColor: selectedElement.colors.fill }}
            />
          </button>
          <AnimatePresence>
            {fillPickerVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute z-20 mt-2"
                style={{ left: 0, width: "189px", maxWidth: "100%" }}
              >
                <SketchPicker
                  color={
                    selectedElement?.colors?.fill || { r: 0, g: 0, b: 0, a: 1 }
                  }
                  onChange={(color) =>
                    updateSelectedElement({
                      colors: {
                        ...selectedElement.colors,
                        fill: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
                      },
                    })
                  }
                  width={189}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Border Color */}
        <div className="relative mb-4 w-fit" ref={borderRef}>
          <div className="text-xs text-left capitalize mb-1">Border</div>
          <button
            className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
            onClick={() => setBorderPickerVisible((prev) => !prev)}
          >
            <div
              className="w-full h-full rounded-[4px] border border-blue-50"
              style={{ backgroundColor: selectedElement.colors.border }}
            />
          </button>
          <AnimatePresence>
            {borderPickerVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute z-20 mt-2"
                style={{ left: 0, width: "189px", maxWidth: "100%" }}
              >
                <SketchPicker
                  color={
                    selectedElement?.colors?.border || {
                      r: 0,
                      g: 0,
                      b: 0,
                      a: 1,
                    }
                  }
                  onChange={(color) =>
                    updateSelectedElement({
                      colors: {
                        ...selectedElement.colors,
                        border: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
                      },
                    })
                  }
                  width={189}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Empty Color */}
        <div className="relative w-fit" ref={emptyRef}>
          <div className="text-xs text-left capitalize mb-1">Empty</div>
          <button
            className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
            onClick={() => setEmptyPickerVisible((prev) => !prev)}
          >
            <div
              className="w-full h-full rounded-[4px] border border-blue-50"
              style={{ backgroundColor: selectedElement.colors.empty }}
            />
          </button>
          <AnimatePresence>
            {emptyPickerVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute z-20 mt-2"
                style={{ left: 0, width: "189px", maxWidth: "100%" }}
              >
                <SketchPicker
                  color={
                    selectedElement?.colors?.empty || { r: 0, g: 0, b: 0, a: 1 }
                  }
                  onChange={(color) =>
                    updateSelectedElement({
                      colors: {
                        ...selectedElement.colors,
                        empty: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
                      },
                    })
                  }
                  width={189}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Layering */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Layering</div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              className="flex-1 px-2 py-2 text-xs bg-white border rounded hover:bg-gray-100"
              onClick={() => {
                const index = elements.findIndex((el) => el.id === selectedId);
                if (index < elements.length - 1) {
                  const newElements = [...elements];
                  const [moved] = newElements.splice(index, 1);
                  newElements.splice(index + 1, 0, moved);
                  updateElements(newElements);
                }
              }}
            >
              Forward
            </button>
            <button
              className="flex-1 px-2 py-2 text-xs bg-white border rounded hover:bg-gray-100"
              onClick={() => {
                const index = elements.findIndex((el) => el.id === selectedId);
                if (index > 0) {
                  const newElements = [...elements];
                  const [moved] = newElements.splice(index, 1);
                  newElements.splice(index - 1, 0, moved);
                  updateElements(newElements);
                }
              }}
            >
              Backward
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 px-2 py-2 text-xs bg-white border rounded hover:bg-gray-100"
              onClick={() => {
                const index = elements.findIndex((el) => el.id === selectedId);
                if (index !== elements.length - 1) {
                  const newElements = [...elements];
                  const [moved] = newElements.splice(index, 1);
                  newElements.push(moved);
                  updateElements(newElements);
                }
              }}
            >
              Bring to Front
            </button>
            <button
              className="flex-1 px-2 py-2 text-xs bg-white border rounded hover:bg-gray-100"
              onClick={() => {
                const index = elements.findIndex((el) => el.id === selectedId);
                if (index !== 0) {
                  const newElements = [...elements];
                  const [moved] = newElements.splice(index, 1);
                  newElements.unshift(moved);
                  updateElements(newElements);
                }
              }}
            >
              Send to Back
            </button>
          </div>
        </div>
      </div>

      {/* Dimension & Position */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold text-gray-700">
          Dimension & Position
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <div className="text-xs mb-1">Width (px)</div>
            <input
              type="number"
              className="w-full border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              placeholder="Width"
              min={0}
              value={
                selectedElement.width?.toFixed(2).replace(/\.00$/, "") || ""
              }
              onChange={(e) =>
                updateSelectedElement({
                  width: Math.max(
                    0,
                    Number(e.target.value.replace(/^0+/, "") || 0)
                  ),
                })
              }
            />
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1">Height (px)</div>
            <input
              type="number"
              className="w-full border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              placeholder="Height"
              min={0}
              value={
                selectedElement.height?.toFixed(2).replace(/\.00$/, "") || ""
              }
              onChange={(e) =>
                updateSelectedElement({
                  height: Math.max(
                    0,
                    Number(e.target.value.replace(/^0+/, "") || 0)
                  ),
                })
              }
            />
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <div className="text-xs mb-1">X Position</div>
            <input
              type="number"
              className="w-full border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              placeholder="X"
              value={selectedElement.x?.toFixed(2).replace(/\.00$/, "") || ""}
              onChange={(e) =>
                updateSelectedElement({
                  x: Number(e.target.value.replace(/^0+/, "") || 0),
                })
              }
            />
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1">Y Position</div>
            <input
              type="number"
              className="w-full border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              placeholder="Y"
              value={selectedElement.y?.toFixed(2).replace(/\.00$/, "") || ""}
              onChange={(e) =>
                updateSelectedElement({
                  y: Number(e.target.value.replace(/^0+/, "") || 0),
                })
              }
            />
          </div>
        </div>

        <div>
          <div className="text-xs mb-1">Rotation (°)</div>
          <input
            type="number"
            className="w-1/2 border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
            placeholder="Rotation"
            value={
              selectedElement.rotation?.toFixed(2).replace(/\.00$/, "") || ""
            }
            onChange={(e) =>
              updateSelectedElement({ rotation: Number(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default StarRatingPropertiesPanel;
