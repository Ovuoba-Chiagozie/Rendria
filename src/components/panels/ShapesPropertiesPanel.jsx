import { useState, useRef } from "react";
import { Slider } from "@mui/material";
import { SketchPicker } from "react-color";
import { motion, AnimatePresence } from "motion/react";

import { useClickOutside } from "@/utils/useClickOutside";


const ShapesPropertiesPanel = ({
  elements,
  selectedId,
  updateSelectedElement,
  updateElements
}) => {
  const [strokeColorPickerShow, setStrokeColorPickerShow] = useState(false);
  const [fillColorPickerShow, setFillColorPickerShow] = useState(false);

  const strokePickerRef = useRef(null);
  const fillPickerRef = useRef(null);

  useClickOutside(strokePickerRef, () => setStrokeColorPickerShow(false));
  useClickOutside(fillPickerRef, () => setFillColorPickerShow(false));

  const selectedElement = elements.find(
    (el) => el.id === selectedId && el.type === "shape"
  );
  if (!selectedElement) return null;

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
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Stroke Width</div>
        <div className="flex justify-between">
          <div className="w-[70%]">
            <Slider
              size="small"
              value={selectedElement?.strokeWidth || 0}
              valueLabelDisplay="auto"
              min={0}
              max={50}
              onChange={(e, value) => {
                updateSelectedElement({ strokeWidth: value });
              }}
            />
          </div>
          <input
            min={0}
            max={50}
            type="number"
            value={selectedElement?.strokeWidth || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0 && value <= 50) {
                updateSelectedElement({ strokeWidth: value });
              }
            }}
            className="bg-white w-9 focus:outline focus:outline-blue-400 focus:outline-[0.2px] [&::-webkit-inner-spin-button]:appearance-none text-center border border-gray-200 rounded"
          />
        </div>
      </div>
      {selectedElement?.label !== "Line" && (
        <>
          {/* Stroke Color */}
          <div className="mt-6 relative">
            <div className="text-sm mb-2 font-semibold">Stroke</div>
            <div ref={strokePickerRef} className="w-fit">
              <button
                className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
                onClick={() => setStrokeColorPickerShow((prev) => !prev)}
              >
                <div
                  className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
                  style={{
                    backgroundColor: selectedElement?.strokeColor,
                  }}
                />
              </button>
              <AnimatePresence>
                {strokeColorPickerShow && (
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
                        selectedElement?.strokeColor || {
                          r: 0,
                          g: 0,
                          b: 0,
                          a: 1,
                        }
                      }
                      onChange={(color) =>
                        updateSelectedElement({
                          strokeColor: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
                        })
                      }
                      width={189}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* Fill */}
      <div className="mt-6 relative">
        <div className="text-sm mb-2 font-semibold">Fill</div>
        <div ref={fillPickerRef} className="w-fit">
          <button
            className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
            onClick={() => setFillColorPickerShow((prev) => !prev)}
          >
            <div
              className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
              style={{ backgroundColor: selectedElement?.fill }}
            />
          </button>
          <AnimatePresence>
            {fillColorPickerShow && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute z-20 mt-2"
                style={{ left: 0, width: "189px", maxWidth: "100%" }}
              >
                <SketchPicker
                  color={selectedElement?.fill || { r: 0, g: 0, b: 0, a: 1 }}
                  onChange={(color) =>
                    updateSelectedElement({
                      fill: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
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

      {/* Dimensions & Position */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold text-gray-700">
          Dimension & Position
        </div>

        {/* Width & Height */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <div className="text-xs mb-1">Width (px)</div>
            <input
              type="number"
              className="w-full border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              placeholder="Width"
              min={0}
              value={
                selectedElement?.width === "" ||
                selectedElement?.width === undefined
                  ? ""
                  : parseFloat(selectedElement.width)
                      .toFixed(2)
                      .replace(/\.00$/, "")
              }
              onChange={(e) => {
                const value = Math.max(
                  0,
                  Number(e.target.value.replace(/^0+/, "") || 0)
                );
                updateSelectedElement({ width: value });
              }}
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
                selectedElement?.height === "" ||
                selectedElement?.height === undefined
                  ? ""
                  : parseFloat(selectedElement.height)
                      .toFixed(2)
                      .replace(/\.00$/, "")
              }
              onChange={(e) => {
                const value = Math.max(
                  0,
                  Number(e.target.value.replace(/^0+/, "") || 0)
                );
                updateSelectedElement({ height: value });
              }}
            />
          </div>
        </div>

        {/* X & Y */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <div className="text-xs mb-1">X Position</div>
            <input
              type="number"
              className="w-full border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              placeholder="X"
              value={
                selectedElement?.x === "" || selectedElement?.x === undefined
                  ? ""
                  : parseFloat(selectedElement.x)
                      .toFixed(2)
                      .replace(/\.00$/, "")
              }
              onChange={(e) => {
                const value = Number(e.target.value.replace(/^0+/, "") || 0);
                updateSelectedElement({ x: value });
              }}
            />
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1">Y Position</div>
            <input
              type="number"
              className="w-full border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              placeholder="Y"
              value={
                selectedElement?.y === "" || selectedElement?.y === undefined
                  ? ""
                  : parseFloat(selectedElement.y)
                      .toFixed(2)
                      .replace(/\.00$/, "")
              }
              onChange={(e) => {
                const value = Number(e.target.value.replace(/^0+/, "") || 0);
                updateSelectedElement({ y: value });
              }}
            />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="text-xs mb-1">Rotation (°)</div>
          <input
            type="number"
            className="w-1/2 border [&::-webkit-inner-spin-button]:appearance-none border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
            placeholder="Rotation"
            value={
              selectedElement?.rotation === "" ||
              selectedElement?.rotation === undefined
                ? ""
                : parseFloat(selectedElement.rotation)
                    .toFixed(2)
                    .replace(/\.00$/, "")
            }
            onChange={(e) => {
              const value = Number(e.target.value);
              updateSelectedElement({ rotation: value });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ShapesPropertiesPanel;
