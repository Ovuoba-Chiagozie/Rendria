import { useState, useRef, useEffect } from "react";
import { Slider } from "@mui/material";
import { SketchPicker } from "react-color";
import { AnimatePresence, motion } from "motion/react";
import { Rating } from "react-simple-star-rating";
import { useClickOutside } from "@/utils/useClickOutside";
import { v4 as uuid } from "uuid";


export default function StarRatingPanel({ setSelectedId, setElements, counters, setCounters }) {
  const [isFillPickerVisible, setIsFillPickerVisible] = useState(false);
  const [isBorderPickerVisible, setIsBorderPickerVisible] = useState(false);
  const [isEmptyPickerVisible, setIsEmptyPickerVisible] = useState(false);

  const [maxRating, setMaxRating] = useState(5);
  const [rating, setRating] = useState(3);
  const [spacing, setSpacing] = useState(2);
  const [colors, setColors] = useState({
    fill: "#FFD700",
    border: "#000000",
    empty: "#CCCCCC",
  });
  const fillRef = useRef(null);
  const borderRef = useRef(null);
  const emptyRef = useRef(null);

  const previewRef = useRef(null);
  const [starSize, setStarSize] = useState(30);
  const [isReady, setIsReady] = useState(false);


  useEffect(() => {
    if (!previewRef.current) return;
  
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
  
      const containerWidth = entry.contentRect.width;
      if (containerWidth === 0) return;
  
      const totalSpacing = spacing * (maxRating - 1);
      const calculatedSize = (containerWidth - totalSpacing) / maxRating;
      const newSize = Math.min(30, Math.floor(calculatedSize)); // ✅ cap at 30
  
      setStarSize(newSize > 0 ? newSize : 1);
      setIsReady(true);
    });
  
    observer.observe(previewRef.current);
  
    return () => {
      if (previewRef.current) observer.unobserve(previewRef.current);
    };
  }, [maxRating, spacing]);
  
  useClickOutside(fillRef, () => setIsFillPickerVisible(false));
  useClickOutside(borderRef, () => setIsBorderPickerVisible(false));
  useClickOutside(emptyRef, () => setIsEmptyPickerVisible(false));

  const addStarRating = () => {
    const nextCount = counters.star + 1;

    const newElement = {
      id: uuid(),
      name: `star-${nextCount}`,
      type: "star-rating",
      maxRating,
      rating,
      spacing,
      colors,
      x: 100,
      y: 100,
      width: 120,
      height: 40,
      rotation: 0,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);

    setCounters((prev) => ({ ...prev, star: nextCount }));
  };

  return (
    <div className="mt-4 p-4">
      {/* Description */}
      <div className="text-sm mb-4 font-semibold text-gray-700">
        Design your own star rating layout with customizable settings.
      </div>

      {/* Color Pickers */}
      <div className="mb-6">
        <div className="text-sm font-semibold mb-2">Star Colors</div>
        <div className="flex gap-6">
          {/* Fill Color */}
          <div className="relative" ref={fillRef}>
            <div className="text-xs text-center capitalize mb-1">fill</div>
            <button
              className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
              onClick={() => setIsFillPickerVisible((prev) => !prev)}
            >
              <div
                className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
                style={{ backgroundColor: colors.fill }}
              />
            </button>
            <AnimatePresence>
              {isFillPickerVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute z-20 mt-2"
                  style={{ left: 0, width: "189px", maxWidth: "100%" }}
                >
                  <SketchPicker
                    color={colors.fill || { r: 0, g: 0, b: 0, a: 1 }}
                    onChange={(color) =>
                      setColors((prev) => ({ ...prev, fill:`rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})` }))
                    }
                    width={189}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Border Color */}
          <div className="relative" ref={borderRef}>
            <div className="text-xs text-center capitalize mb-1">border</div>
            <button
              className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
              onClick={() => setIsBorderPickerVisible((prev) => !prev)}
            >
              <div
                className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
                style={{ backgroundColor: colors.border }}
              />
            </button>
            <AnimatePresence>
              {isBorderPickerVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute z-20 mt-2"
                  style={{ left: 0, width: "189px", maxWidth: "100%" }}
                >
                  <SketchPicker
                   color={colors.border || { r: 0, g: 0, b: 0, a: 1 }}
                   onChange={(color) =>
                     setColors((prev) => ({ ...prev, border:`rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})` }))
                   }
                    width={189}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Empty Color */}
          <div className="relative" ref={emptyRef}>
            <div className="text-xs text-center capitalize mb-1">empty</div>
            <button
              className="hover:border-blue-400 rounded-[4px] cursor-pointer w-8 h-8 p-[4px] border border-[#d9d9d9]"
              onClick={() => setIsEmptyPickerVisible((prev) => !prev)}
            >
              <div
                className="flex justify-center items-center w-full h-full rounded-[4px] border border-blue-50"
                style={{ backgroundColor: colors.empty }}
              />
            </button>
            <AnimatePresence>
              {isEmptyPickerVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute z-20 mt-2"
                  style={{ left: 0, width: "189px", maxWidth: "100%" }}
                >
                  <SketchPicker
                    color={colors.empty || { r: 0, g: 0, b: 0, a: 1 }}
                    onChange={(color) =>
                      setColors((prev) => ({ ...prev, empty:`rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})` }))
                    }
                    width={189}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Max Rating */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Max Rating: {maxRating}
        </div>
        <div className="w-full">
          <Slider
            size="small"
            value={maxRating}
            valueLabelDisplay="auto"
            min={1}
            max={10}
            onChange={(e, value) => setMaxRating(value)}
          />
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Rating: {rating}
        </div>
        <div className="w-full">
          <Slider
            size="small"
            value={rating}
            valueLabelDisplay="auto"
            min={0}
            max={maxRating}
            onChange={(e, value) => setRating(value)}
          />
        </div>
      </div>

      {/* Spacing */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Spacing (px): {spacing}
        </div>
        <div className="w-full">
          <Slider
            size="small"
            value={spacing}
            valueLabelDisplay="auto"
            min={0}
            max={10}
            onChange={(e, value) => setSpacing(value)}
          />
        </div>
      </div>

      {/* Add Button */}
      <button
        className="w-full text-sm py-2 px-4 rounded bg-[#FF6E61FF] hover:bg-[#e75b50] text-white transition"
        onClick={addStarRating}
      >
        Add Star Rating
      </button>

      {/* Preview */}
      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">Preview</div>
        <div
          className="flex justify-center items-center w-full h-20 border border-dashed border-gray-400 rounded bg-gray-50"
          ref={previewRef}
        >
          {isReady && (
            <Rating
              readonly
              initialValue={rating}
              allowFraction={false}
              size={starSize}
              iconsCount={maxRating}
              fillColor={colors.fill}
              emptyColor={colors.empty}
              SVGstrokeColor={colors.border}
              SVGstorkeWidth={1}
              style={{ display: "flex", gap: `${spacing}px` }}
              SVGstyle={{ margin: spacing / 2 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
