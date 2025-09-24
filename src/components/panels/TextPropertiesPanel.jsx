import { useState, useRef } from "react";
import Dropdown from "@/components/Dropdown";
import FontFaceObserver from "fontfaceobserver";
import { SketchPicker } from "react-color";
import { motion, AnimatePresence } from "motion/react";
import { useClickOutside } from "@/utils/useClickOutside";
import { Slider } from "@mui/material";

import { LuBold } from "react-icons/lu";
import { GoItalic, GoStrikethrough } from "react-icons/go";
import {
  BsTypeUnderline,
  BsJustifyLeft,
  BsJustify,
  BsJustifyRight,
} from "react-icons/bs";
import { RxLetterCaseCapitalize } from "react-icons/rx";

export default function TextPropertiesPanel({
  fonts,
  elements,
  selectedId,
  updateSelectedElement,
  updateElements,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [colorPickerShow, setColorPickerShow] = useState(false);
  const sketchPickerRef = useRef(null);

  useClickOutside(sketchPickerRef, () => {
    setColorPickerShow(false);
  });

  const selectedElement = elements.find((el) => el.id === selectedId);
  if (!selectedElement) return null;

  const handleFamilyClick = async (family) => {
    const weight = selectedElement.bold ? "700" : "400";
    const style = selectedElement.italic ? "italic" : "normal";
    const fontObserver = new FontFaceObserver(family, { weight, style });
    try {
      await fontObserver.load(null, 6000);
      updateSelectedElement({ family });
      setIsOpen(false);
    } catch (err) {
      console.error(`Failed to load ${family}`, err);
    }
  };

  const ColorBar = () => (
    <div className="h-1 w-6 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
  );

  const handleFontSizeChange = (value) => {
    if (value >= 1 && value <= 500) {
      updateSelectedElement({ fontSize: value });
    }
  };

  const safe = (val) =>
    val === "" || val === undefined
      ? ""
      : parseFloat(val).toFixed(2).replace(/\.00$/, "");

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
      {/* Font Family */}
      <div className="text-sm font-semibold mb-2 mt-6">Font Family</div>
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <Dropdown.Button
          label={selectedElement.family}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          fontFamily={selectedElement.family}
        >
          <Dropdown.Menu>
            {fonts.map((font, index) => (
              <Dropdown.MenuItem
                key={index}
                onClick={() => handleFamilyClick(font.family)}
                fontFamily={font.family}
              >
                {font.family}
              </Dropdown.MenuItem>
            ))}
          </Dropdown.Menu>
        </Dropdown.Button>
      </Dropdown>

      {/* Font Size */}
      <div className="mt-6">
        <div className="text-sm font-semibold mb-2">Font Size</div>
        <div className="flex h-9 bg-white border-gray-200 border rounded-lg text-black">
          <button
            className="w-11 hover:bg-gray-100"
            type="button"
            disabled={selectedElement.fontSize <= 1}
            onClick={() => handleFontSizeChange(selectedElement.fontSize - 1)}
          >
            <span className="text-base mx-auto">-</span>
          </button>
          <input
            type="number"
            min={1}
            max={500}
            value={selectedElement.fontSize}
            className="bg-white w-full focus:outline focus:outline-blue-400 [&::-webkit-inner-spin-button]:appearance-none  text-center"
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          />
          <button
            className="w-11 hover:bg-gray-100"
            type="button"
            disabled={selectedElement.fontSize >= 500}
            onClick={() => handleFontSizeChange(selectedElement.fontSize + 1)}
          >
            <span className="text-base mx-auto">+</span>
          </button>
        </div>
      </div>

      {/* Font Color */}
      <div className="mt-6 relative">
        <div className="text-sm mb-2 font-semibold">Font Color</div>
        <div ref={sketchPickerRef} className="w-fit">
          <button
            className="hover:bg-gray-100 rounded-md cursor-pointer w-10 h-10"
            onClick={() => setColorPickerShow((prev) => !prev)}
          >
            <div className="text-black text-xl font-semibold leading-none mb-1">
              A
            </div>
            <div className="flex justify-center">
              <ColorBar />
            </div>
          </button>
          <AnimatePresence>
            {colorPickerShow && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute z-20 mt-2"
                style={{ left: 0, width: "189px" }}
              >
                <SketchPicker
                  color={selectedElement.color}
                  onChange={(color) => {
                    let colorStr = color.hex;
                    if (color.rgb.a !== 1) {
                      colorStr = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
                    }
                    updateSelectedElement({ color: colorStr });
                  }}
                  width={189}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Style Section */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Style</div>
        <div className="flex gap-1">
          {[
            { icon: <LuBold />, key: "bold" },
            { icon: <GoItalic />, key: "italic" },
            { icon: <BsTypeUnderline />, key: "underline" },
            { icon: <GoStrikethrough />, key: "lineThrough" },
            { icon: <RxLetterCaseCapitalize />, key: "uppercase" },
          ].map(({ icon, key }) => (
            <button
              key={key}
              type="button"
              className={`w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 text-lg ${
                selectedElement[key] ? "bg-gray-100" : ""
              }`}
              onClick={() =>
                updateSelectedElement({ [key]: !selectedElement[key] })
              }
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Alignment</div>
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={`w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 text-xl ${
                selectedElement.textAlignIndex === index ? "bg-gray-100" : ""
              }`}
              onClick={() => updateSelectedElement({ textAlignIndex: index })}
            >
              {[<BsJustifyLeft />, <BsJustify />, <BsJustifyRight />][index]}
            </button>
          ))}
        </div>
      </div>

      {/* Text Content */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Text Content</div>
        <textarea
          className="w-full h-28 resize-none border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-400 bg-white"
          placeholder="Enter your text here..."
          value={selectedElement.content}
          onChange={(e) => updateSelectedElement({ content: e.target.value })}
        />
      </div>

      {/* Letter Spacing */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Letter spacing</div>
        <div className="flex justify-between">
          <div className="w-[70%]">
            <Slider
              size="small"
              value={selectedElement.letterSpacing}
              valueLabelDisplay="auto"
              min={0}
              max={50}
              onChange={(e, value) =>
                updateSelectedElement({ letterSpacing: value })
              }
            />
          </div>
          <input
            type="number"
            min={0}
            max={50}
            value={selectedElement.letterSpacing}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0 && value <= 50) {
                updateSelectedElement({ letterSpacing: value });
              }
            }}
            className="bg-white w-9 focus:outline focus:outline-blue-400 [&::-webkit-inner-spin-button]:appearance-none  text-center border border-gray-200 rounded"
          />
        </div>
      </div>

      {/* Line Spacing */}
      <div className="mt-6">
        <div className="text-sm mb-2 font-semibold">Line spacing</div>
        <div className="flex justify-between">
          <div className="w-[70%]">
            <Slider
              size="small"
              step={0.1}
              min={1}
              max={3}
              value={selectedElement.lineSpacing}
              valueLabelDisplay="auto"
              onChange={(e, value) =>
                updateSelectedElement({ lineSpacing: value })
              }
            />
          </div>
          <input
            type="number"
            step={0.1}
            min={1}
            max={3}
            value={selectedElement.lineSpacing}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 1 && value <= 3) {
                updateSelectedElement({ lineSpacing: value });
              }
            }}
            className="bg-white w-9 focus:outline focus:outline-blue-400 [&::-webkit-inner-spin-button]:appearance-none  text-center border border-gray-200 rounded"
          />
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
        <div className="flex gap-3 mb-3">
          {["width", "height"].map((key) => (
            <div className="flex-1" key={key}>
              <div className="text-xs mb-1 capitalize">{key} (px)</div>
              <input
                type="number"
                className="w-full border border-gray-200 rounded p-1.5 text-sm focus:outline-none focus:border-blue-400 [&::-webkit-inner-spin-button]:appearance-none  bg-white"
                placeholder={key}
                min={0}
                value={safe(selectedElement[key])}
                onChange={(e) => {
                  let clean = e.target.value.replace(/^0+/, "") || "0";
                  updateSelectedElement({ [key]: Number(clean) });
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mb-3">
          {["x", "y"].map((key) => (
            <div className="flex-1" key={key}>
              <div className="text-xs mb-1 capitalize">{key} Position</div>
              <input
                type="number"
                className="w-full border border-gray-200 rounded p-1.5 text-sm focus:outline-none [&::-webkit-inner-spin-button]:appearance-none  focus:border-blue-400 bg-white"
                placeholder={key}
                value={safe(selectedElement[key])}
                onChange={(e) => {
                  let clean = e.target.value.replace(/^0+/, "") || "0";
                  updateSelectedElement({ [key]: Number(clean) });
                }}
              />
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs mb-1">Rotation (°)</div>
          <input
            type="number"
            className="w-1/2 border border-gray-200 rounded p-1.5 text-sm [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:border-blue-400 bg-white"
            placeholder="Rotation"
            value={safe(selectedElement.rotation)}
            onChange={(e) =>
              updateSelectedElement({ rotation: Number(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
}
