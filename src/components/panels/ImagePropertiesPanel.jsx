import { useState, useRef } from "react";
import { Slider } from "@mui/material";
import { SketchPicker } from "react-color";
import { motion, AnimatePresence } from "motion/react";
import { LuFlipVertical, LuFlipHorizontal } from "react-icons/lu";

import { useClickOutside } from "@/utils/useClickOutside";
import Dropdown from "@/components/Dropdown";

const ImagePropertiesPanel = ({
  elements,
  selectedId,
  updateSelectedElement,
  updateElements,
}) => {
  const [colorPickerShow, setColorPickerShow] = useState(false);
  const [isObjectFitDropdownOpen, setIsObjectFitDropdownOpen] = useState(false);

  const sketchPickerRef = useRef(null);
  const objectFitRef = useRef(null);

  useClickOutside(sketchPickerRef, () => setColorPickerShow(false));
  useClickOutside(objectFitRef, () => setIsObjectFitDropdownOpen(false));

  const selectedElement = elements.find(
    (el) => el.id === selectedId && el.type === "image"
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
      {/* Border Width */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Border Width</div>
        <div className="flex justify-between">
          <div className="w-[70%]">
            <Slider
              size="small"
              value={selectedElement.borderWidth}
              valueLabelDisplay="auto"
              min={0}
              max={50}
              onChange={(e, value) =>
                updateSelectedElement({ borderWidth: value })
              }
            />
          </div>
          <input
            type="number"
            min={0}
            max={50}
            value={selectedElement.borderWidth}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0 && value <= 50)
                updateSelectedElement({ borderWidth: value });
            }}
            className="bg-white w-9 text-center border border-gray-200 rounded focus:outline focus:outline-blue-400 focus:outline-[0.2px] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Border Color */}
      <div className="mt-6 relative">
        <div className="text-sm mb-2 font-semibold">Border Color</div>
        <div ref={sketchPickerRef} className="w-fit">
          <button
            className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
            onClick={() => setColorPickerShow((prev) => !prev)}
          >
            <div
              className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
              style={{ backgroundColor: selectedElement.borderColor }}
            />
          </button>
          <AnimatePresence>
            {colorPickerShow && (
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
                    selectedElement?.borderColor || { r: 0, g: 0, b: 0, a: 1 }
                  }
                  onChange={(color) =>
                    updateSelectedElement({
                      borderColor: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
                    })
                  }
                  width={189}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Border Radius */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Border Radius</div>
        <div className="flex items-center gap-3">
          <div className="w-[70%]">
            <Slider
              size="small"
              value={selectedElement.borderRadius.value}
              min={0}
              max={selectedElement.borderRadius.unit === "px" ? 100 : 50}
              onChange={(_, value) =>
                updateSelectedElement({
                  borderRadius: {
                    ...selectedElement.borderRadius,
                    value: typeof value === "number" ? value : value[0],
                  },
                })
              }
              valueLabelDisplay="auto"
            />
          </div>
          <span className="text-xs font-semibold w-10 text-right">
            {selectedElement.borderRadius.value}
            {selectedElement.borderRadius.unit}
          </span>
        </div>
        <div className="flex mb-2 border border-[#EBEBEAFF] w-fit">
          {["px", "%"].map((unit) => (
            <button
              key={unit}
              type="button"
              className={`px-3 py-1 ${
                selectedElement.borderRadius.unit === unit
                  ? "bg-[#FF6E61FF] text-white"
                  : "bg-white text-gray-700"
              }`}
              onClick={() =>
                updateSelectedElement({
                  borderRadius: {
                    value:
                      unit === "%"
                        ? Math.min(selectedElement.borderRadius.value, 50)
                        : selectedElement.borderRadius.value,
                    unit,
                  },
                })
              }
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      {/* Flip */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Flip</div>
        <div className="flex gap-2">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-md bg-white hover:bg-gray-100 text-lg"
            onClick={() =>
              updateSelectedElement({ flipX: !selectedElement.flipX })
            }
          >
            <LuFlipHorizontal />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-md bg-white hover:bg-gray-100 text-lg"
            onClick={() =>
              updateSelectedElement({ flipY: !selectedElement.flipY })
            }
          >
            <LuFlipVertical />
          </button>
        </div>
      </div>

      {/* Object Fit */}
      <div className="mt-6" ref={objectFitRef}>
        <div className="text-sm mb-2 font-semibold">Object Fit</div>
        <Dropdown
          isOpen={isObjectFitDropdownOpen}
          onOpenChange={setIsObjectFitDropdownOpen}
        >
          <Dropdown.Button
            label={selectedElement.objectFit}
            isOpen={isObjectFitDropdownOpen}
            onOpenChange={setIsObjectFitDropdownOpen}
          >
            <Dropdown.Menu>
              {["fill", "cover", "contain"].map((fit) => (
                <Dropdown.MenuItem
                  key={fit}
                  onClick={() => {
                    updateSelectedElement({ objectFit: fit });
                    setIsObjectFitDropdownOpen(false);
                  }}
                >
                  {fit}
                </Dropdown.MenuItem>
              ))}
            </Dropdown.Menu>
          </Dropdown.Button>
        </Dropdown>
      </div>

      {/* Image Preview & Replace */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold text-gray-700">
          Image Preview
        </div>
        <div className="w-24 h-24 border border-gray-300 rounded overflow-hidden flex items-center justify-center bg-gray-100">
          {selectedElement.src ? (
            <img
              src={selectedElement.src}
              alt="Current"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">No image</span>
          )}
        </div>
        <button
          className="mt-2 px-3 py-1.5 text-sm bg-[#FF6E61FF] text-white rounded hover:bg-[#e75b50] transition-colors"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                const newSrc = reader.result;
                updateSelectedElement({ src: newSrc });
              };
              reader.readAsDataURL(file);
            };
            input.click();
          }}
        >
          Replace Image
        </button>
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
              value={(() => {
                const r = elements.find((el) => el.id === selectedId)?.width;
                return r === "" || r === undefined
                  ? ""
                  : parseFloat(r).toFixed(2).replace(/\.00$/, "");
              })()}
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
              value={(() => {
                const r = elements.find((el) => el.id === selectedId)?.height;
                return r === "" || r === undefined
                  ? ""
                  : parseFloat(r).toFixed(2).replace(/\.00$/, "");
              })()}
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
              value={(() => {
                const r = elements.find((el) => el.id === selectedId)?.x;
                return r === "" || r === undefined
                  ? ""
                  : parseFloat(r).toFixed(2).replace(/\.00$/, "");
              })()}
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
              value={(() => {
                const r = elements.find((el) => el.id === selectedId)?.y;
                return r === "" || r === undefined
                  ? ""
                  : parseFloat(r).toFixed(2).replace(/\.00$/, "");
              })()}
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
            value={(() => {
              const r = elements.find((el) => el.id === selectedId)?.rotation;
              return r === "" || r === undefined
                ? ""
                : parseFloat(r).toFixed(2).replace(/\.00$/, "");
            })()}
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

export default ImagePropertiesPanel;
