import { useRef, useEffect, useState, createElement } from "react";
import Moveable from "react-moveable";
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { Rating } from "react-simple-star-rating";
import { motion } from "motion/react";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoCopyOutline } from "react-icons/io5";

import {
  CustomSquareIcon,
  CustomCircleIcon,
  CustomTriangleIcon,
  CustomStarIcon,
  CustomHeartIcon,
  CustomHexagonIcon,
  CustomHorizontalLineIcon,
} from "@/components/sidebar/panels/shapes/Shapes";

import placeholder from "@/assets/placeholder.svg";
import { v4 as uuid } from "uuid";


export default function EditorCanvas({
  elements,
  setElements,
  selectedId,
  setSelectedId,
  canvasSize,
  zoom,
  setIsPropertiesPanelOpen,
}) {
  const targetRef = useRef(null);
  const moveableRef = useRef(null);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const prevZoomRef = useRef(zoom);
  const [originalSize, setOriginalSize] = useState({ width: 1, height: 1 });
  const [snapGuides, setSnapGuides] = useState([]);
  console.log({ elements });

  const snapThreshold = 5;

  const selectedElement = elements.find((el) => el.id === selectedId);
  const textRef = useRef(null);

  const shapeIcons = {
    "solid-square": CustomSquareIcon,
    "solid-circle": CustomCircleIcon,
    "solid-triangle": CustomTriangleIcon,
    "outline-square": CustomSquareIcon,
    "outline-circle": CustomCircleIcon,
    "outline-triangle": CustomTriangleIcon,
    "solid-star": CustomStarIcon,
    "solid-heart": CustomHeartIcon,
    "solid-hexagon": CustomHexagonIcon,
    "outline-star": CustomStarIcon,
    "outline-heart": CustomHeartIcon,
    "outline-hexagon": CustomHexagonIcon,
    "horizontal-line": CustomHorizontalLineIcon,
  };

  useEffect(() => {
    if (moveableRef.current) {
      moveableRef.current.updateRect();
    }
  }, [selectedElement]);

  useEffect(() => {
    if (selectedId) {
      setIsPropertiesPanelOpen(true);
    }
  }, [selectedId]);

  useEffect(() => {
    const hasBarcode = elements.some((el) => el.type === "barcode");
    if (!hasBarcode) return;

    const timeout = setTimeout(() => {
      const barcodeSvgs = document.querySelectorAll(".barcode-svg");
      barcodeSvgs.forEach((svg) => {
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [elements]);

  const updateElement = (updatedFields) => {
    if (!selectedElement) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedElement.id ? { ...el, ...updatedFields } : el
      )
    );
  };

  const isClose = (a, b, threshold = snapThreshold) =>
    Math.abs(a - b) <= threshold;

  const getElementEdges = (el) => ({
    left: el.x,
    center: el.x + el.width / 2,
    right: el.x + el.width,
    top: el.y,
    middle: el.y + el.height / 2,
    bottom: el.y + el.height,
  });

  const getSnapGuides = (movingEl, others) => {
    const A = getElementEdges(movingEl);
    const guides = [];

    for (const el of others) {
      if (el.id === movingEl.id) continue;
      const B = getElementEdges(el);

      if (isClose(A.left, B.left))
        guides.push({
          type: "vertical",
          x: B.left,
          fromY: Math.min(A.top, B.top),
          toY: Math.max(A.bottom, B.bottom),
        });
      if (isClose(A.center, B.center))
        guides.push({
          type: "vertical",
          x: B.center,
          fromY: Math.min(A.top, B.top),
          toY: Math.max(A.bottom, B.bottom),
        });
      if (isClose(A.right, B.right))
        guides.push({
          type: "vertical",
          x: B.right,
          fromY: Math.min(A.top, B.top),
          toY: Math.max(A.bottom, B.bottom),
        });

      if (isClose(A.top, B.top))
        guides.push({
          type: "horizontal",
          y: B.top,
          fromX: Math.min(A.left, B.left),
          toX: Math.max(A.right, B.right),
        });
      if (isClose(A.middle, B.middle))
        guides.push({
          type: "horizontal",
          y: B.middle,
          fromX: Math.min(A.left, B.left),
          toX: Math.max(A.right, B.right),
        });
      if (isClose(A.bottom, B.bottom))
        guides.push({
          type: "horizontal",
          y: B.bottom,
          fromX: Math.min(A.left, B.left),
          toX: Math.max(A.right, B.right),
        });
    }

    // Center canvas guides remain full length (use bounding rect of visual container)
    if (containerRef.current) {
      const canvasCenterX = canvasSize.width / 2;
      const canvasCenterY = canvasSize.height / 2;

      if (isClose(A.center, canvasCenterX))
        guides.push({
          type: "vertical",
          x: canvasCenterX,
          fromY: 0,
          toY: canvasSize.height,
        });

      if (isClose(A.middle, canvasCenterY))
        guides.push({
          type: "horizontal",
          y: canvasCenterY,
          fromX: 0,
          toX: canvasSize.width,
        });
    }

    return guides;
  };

  function getStarSize(containerWidth, containerHeight, spacing, maxRating) {
    const totalSpacing = spacing * (maxRating - 1);
    const availableWidth = containerWidth - totalSpacing;
    const widthBasedSize = availableWidth / maxRating;
    const heightBasedSize = containerHeight;

    return Math.max(1, Math.min(widthBasedSize, heightBasedSize));
  }

  // Center the canvas on initial mount (or when canvas size changes)
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    requestAnimationFrame(() => {
      const scaledW = canvasSize.width * zoom;
      const scaledH = canvasSize.height * zoom;

      // If scaled canvas is larger than viewport, center scroll to middle.
      // If it's smaller, leave scroll at 0 — visual centering will be handled by flex centering below.
      scrollEl.scrollLeft = Math.max(0, (scaledW - scrollEl.clientWidth) / 2);
      scrollEl.scrollTop = Math.max(0, (scaledH - scrollEl.clientHeight) / 2);

      prevZoomRef.current = zoom;
    });
  }, [canvasSize.width, canvasSize.height]);

  // Keep center point stable on zoom changes
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const prevZoom = prevZoomRef.current || zoom;
    if (zoom === prevZoom) return;

    const centerX = scrollEl.scrollLeft + scrollEl.clientWidth / 2;
    const centerY = scrollEl.scrollTop + scrollEl.clientHeight / 2;

    const scale = zoom / prevZoom;

    scrollEl.scrollLeft = Math.max(
      0,
      centerX * scale - scrollEl.clientWidth / 2
    );
    scrollEl.scrollTop = Math.max(
      0,
      centerY * scale - scrollEl.clientHeight / 2
    );

    prevZoomRef.current = zoom;
  }, [zoom]);

  function measureLetterSpacing(textElement, cssValue) {
    if (!textElement || !textElement.innerText) return 0;

    const tempEl = document.createElement("span");
    tempEl.style.visibility = "hidden";
    tempEl.style.position = "absolute";
    tempEl.style.whiteSpace = "pre";

    const computedStyle = window.getComputedStyle(textElement);
    tempEl.style.fontFamily = computedStyle.fontFamily;
    tempEl.style.fontSize = computedStyle.fontSize;
    tempEl.style.fontWeight = computedStyle.fontWeight;
    tempEl.style.fontStyle = computedStyle.fontStyle;

    tempEl.innerText = textElement.innerText;
    document.body.appendChild(tempEl);

    // Apply the CSS letter spacing from the editor for the first measurement.
    tempEl.style.letterSpacing = `${cssValue}px`;
    const textWidthWithSpacing = tempEl.offsetWidth;

    // Reset letter-spacing for the second measurement.
    tempEl.style.letterSpacing = "0px";
    const textWidthNoSpacing = tempEl.offsetWidth;

    document.body.removeChild(tempEl);

    const numSpaces =
      textElement.innerText.length > 1 ? textElement.innerText.length - 1 : 0;

    if (numSpaces > 0) {
      const totalSpacing = textWidthWithSpacing - textWidthNoSpacing;
      const spacingPerCharacter = totalSpacing / numSpaces;
      return spacingPerCharacter;
    }
    return 0;
  }
  // useEffect to compute letter spacing for Konva
  useEffect(() => {
    // Only run if the selected element is a text element
    if (selectedElement && selectedElement.type === "text" && textRef.current) {
      // Find the specific text element within the DOM
      const editorTextElement = textRef.current;
      const computedSpacing = measureLetterSpacing(
        editorTextElement,
        selectedElement.letterSpacing
      );

      // Update the elements state with the computed konvaLetterSpacing
      setElements((prevElements) => {
        return prevElements.map((el) => {
          if (el.id === selectedId) {
            return { ...el, konvaLetterSpacing: computedSpacing };
          }
          return el;
        });
      });
    }
  }, [
    selectedElement?.letterSpacing,
    selectedElement?.fontSize,
    selectedElement?.fontFamily,
    selectedId,
  ]); // Dependencies list

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-w-0 min-h-0 p-4 overflow-auto relative"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* centering container ensures the scaled layout is centered when smaller than viewport */}
      <div
        style={{
          minWidth: "100%",
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Layout wrapper sets scaled layout size for scrollbars */}
        <div
          style={{
            width: canvasSize.width * zoom,
            height: canvasSize.height * zoom,
            position: "relative",
          }}
        >
          {/* Visual canvas (un-scaled layout inside wrapper) */}
          <motion.div
            id="editor-canvas"
            ref={containerRef}
            className="relative bg-white border overflow-hidden mx-auto"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: canvasSize.width,
              height: canvasSize.height,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
            onMouseDown={(e) => {
              // Only deselect if the click wasn't on an element
              if (!e.target.closest("[data-element-id]")) {
                setSelectedId(null);
              }
            }}
          >
            {elements.map((el) => {
              const isSelected = el.id === selectedId;

              return (
                <div
                  key={el.id}
                  ref={isSelected ? targetRef : null}
                  data-element-id={el.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (selectedId !== el.id) {
                      setSelectedId(el.id);
                      requestAnimationFrame(() => {
                        const node = document.querySelector(
                          `[data-element-id="${el.id}"]`
                        );
                        if (node) {
                          const simulatedEvent = new MouseEvent("mousedown", e);
                          node.dispatchEvent(simulatedEvent);
                        }
                      });
                    }
                  }}
                  className="group"
                  style={{
                    transform: `translate(${el.x}px, ${el.y}px) rotate(${
                      el.rotation || 0
                    }deg)`,
                    width: el.width,
                    height: el.height,
                    position: "absolute",
                    backgroundColor: "transparent",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                >
                  {isSelected && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newElement = {
                            ...el,
                            id: uuid(), // new unique ID
                            x: el.x + 10, // offset X
                            y: el.y + 10, // offset Y
                          };
                          setElements((prev) => [...prev, newElement]);
                          setSelectedId(newElement.id); // automatically select the copied element
                          setIsPropertiesPanelOpen(true); // open properties panel for it
                        }}
                        className="element-action absolute -top-[30px] right-6 z-[10000] bg-white/80 border-none rounded-md p-1 cursor-pointer transition-colors hover:bg-black hover:text-white"
                      >
                        <IoCopyOutline />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setElements((prev) =>
                            prev.filter((item) => item.id !== el.id)
                          );
                          if (el.id === selectedId) {
                            setSelectedId(null);
                            setIsPropertiesPanelOpen(false);
                          }
                        }}
                        className="element-action absolute -top-[30px] -right-2 z-[10000] bg-white/80 border-none rounded-md p-1 cursor-pointer transition-colors hover:bg-black hover:text-white"
                      >
                        <FaRegTrashAlt />
                      </button>
                    </>
                  )}
                  <div
                    className={`w-full h-full rounded-sm ${
                      !isSelected
                        ? "group-hover:border-2 group-hover:border-blue-400"
                        : ""
                    }`}
                    style={{
                      pointerEvents: "none",
                      backgroundColor: "transparent",
                    }}
                  >
                    {el.type === "text" ? (
                      <div
                        ref={isSelected ? textRef : null} // Attach ref only to the selected element
                        style={{
                          fontFamily: el.family,
                          fontWeight: el.bold ? "700" : "400",
                          fontStyle: el.italic ? "italic" : "normal",
                          fontSize: `${el.fontSize}px`,
                          color: el.color,
                          textDecoration: el.underline
                            ? el.lineThrough
                              ? "underline line-through"
                              : "underline"
                            : el.lineThrough
                            ? "line-through"
                            : "none",
                          textTransform: el.uppercase ? "uppercase" : "none",
                          textAlign:
                            el.textAlignIndex === 0
                              ? "left"
                              : el.textAlignIndex === 1
                              ? "center"
                              : "right",
                          letterSpacing: `${el.letterSpacing}px`,
                          lineHeight: el.lineSpacing,
                          width: "100%",
                          height: "100%",
                          backgroundColor: "transparent",
                        }}
                      >
                        {el.content}
                      </div>
                    ) : el.type === "image" ? (
                      <img
                        src={el.src || placeholder}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          borderWidth: el.borderWidth,
                          borderStyle: "solid",
                          borderColor: el.borderColor,
                          borderRadius: `${el.borderRadius.value}${el.borderRadius.unit}`,
                          transform: `
                        scaleX(${el.flipX ? -1 : 1}) 
                        scaleY(${el.flipY ? -1 : 1})
                      `,
                          transformOrigin: "center",
                          display: "block",
                          objectFit: el.objectFit,
                          backgroundColor: "transparent",
                        }}
                      />
                    ) : el.type === "shape" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {createElement(shapeIcons[el.label], {
                          style: {
                            width: "100%",
                            height: "100%",
                            backgroundColor: "transparent",
                          },
                          id: el.id,
                          fill: el.fill,
                          className: "my-custom-shape",
                          width: el.width,
                          height: el.height,
                          strokeColor: el.strokeColor,
                          strokeWidth: el.strokeWidth || 0,
                        })}
                      </div>
                    ) : el.type === "qr-code" ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "transparent",
                          borderWidth: el.borderWidth,
                          borderStyle: "solid",
                          borderColor: el.borderColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <QRCode
                          value={el.value}
                          size={Math.min(el.width, el.height)}
                        />
                      </div>
                    ) : el.type === "barcode" ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "transparent",
                          borderWidth: el.borderWidth,
                          borderStyle: "solid",
                          borderColor: el.borderColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Barcode
                          value={el.value}
                          format={el.format || "CODE128"}
                          className="barcode-svg"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : el.type === "star-rating" ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "transparent",
                        }}
                      >
                        <Rating
                          readonly
                          initialValue={el.rating}
                          allowFraction={false}
                          iconsCount={el.maxRating}
                          fillColor={el.colors.fill}
                          emptyColor={el.colors.empty}
                          SVGstrokeColor={el.colors.border}
                          SVGstorkeWidth={1}
                          size={getStarSize(
                            el.width,
                            el.height,
                            el.spacing,
                            el.maxRating
                          )}
                          style={{ display: "flex", gap: `${el.spacing}px` }}
                          SVGstyle={{ margin: el.spacing / 2 }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {selectedElement && (
              <Moveable
                ref={moveableRef}
                target={targetRef}
                draggable
                resizable
                rotatable
                keepRatio={false}
                origin={false}
                renderDirections={["nw", "ne", "sw", "se", "n", "s", "e", "w"]}
                onResizeStart={({ target }) => {
                  const rect = target.getBoundingClientRect();
                  setOriginalSize({
                    width: rect.width,
                    height: rect.height,
                  });
                }}
                onDrag={({ beforeTranslate }) => {
                  let [x, y] = beforeTranslate;
                  const preview = { ...selectedElement, x, y };
                  const guides = getSnapGuides(preview, elements);

                  // Snap logic: override x or y if a guide is within threshold
                  for (const guide of guides) {
                    if (guide.type === "vertical") {
                      const edges = {
                        left: x,
                        center: x + selectedElement.width / 2,
                        right: x + selectedElement.width,
                      };

                      for (const [edge, val] of Object.entries(edges)) {
                        if (isClose(val, guide.x)) {
                          const delta = guide.x - val;
                          x += delta;
                          break;
                        }
                      }
                    } else if (guide.type === "horizontal") {
                      const edges = {
                        top: y,
                        middle: y + selectedElement.height / 2,
                        bottom: y + selectedElement.height,
                      };

                      for (const [edge, val] of Object.entries(edges)) {
                        if (isClose(val, guide.y)) {
                          const delta = guide.y - val;
                          y += delta;
                          break;
                        }
                      }
                    }
                  }

                  setSnapGuides(guides);
                  targetRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${
                    selectedElement.rotation || 0
                  }deg)`;
                }}
                onDragEnd={({ lastEvent }) => {
                  if (!lastEvent) return;
                  let [x, y] = lastEvent.beforeTranslate;

                  // Snap again on release
                  const preview = { ...selectedElement, x, y };
                  const guides = getSnapGuides(preview, elements);

                  for (const guide of guides) {
                    if (guide.type === "vertical") {
                      const edges = {
                        left: x,
                        center: x + selectedElement.width / 2,
                        right: x + selectedElement.width,
                      };

                      for (const [edge, val] of Object.entries(edges)) {
                        if (isClose(val, guide.x)) {
                          const delta = guide.x - val;
                          x += delta;
                          break;
                        }
                      }
                    } else if (guide.type === "horizontal") {
                      const edges = {
                        top: y,
                        middle: y + selectedElement.height / 2,
                        bottom: y + selectedElement.height,
                      };

                      for (const [edge, val] of Object.entries(edges)) {
                        if (isClose(val, guide.y)) {
                          const delta = guide.y - val;
                          y += delta;
                          break;
                        }
                      }
                    }
                  }

                  updateElement({ x, y });
                  setSnapGuides([]);
                }}
                onResize={({ width, height, drag, direction }) => {
                  const [x, y] = drag.beforeTranslate;
                  const [dx, dy] = direction;
                  let newWidth = width;
                  let newHeight = height;

                  const aspectRatio =
                    originalSize.width / originalSize.height || 1;
                  const isCorner = Math.abs(dx) === 1 && Math.abs(dy) === 1;

                  if (isCorner) {
                    if (width / height > aspectRatio) {
                      newWidth = height * aspectRatio;
                    } else {
                      newHeight = width / aspectRatio;
                    }
                  }

                  targetRef.current.style.width = `${newWidth}px`;
                  targetRef.current.style.height = `${newHeight}px`;
                  targetRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${
                    selectedElement.rotation || 0
                  }deg)`;
                  updateElement({ x, y, width, height });
                }}
                onRotate={({ beforeRotate }) => {
                  const x = selectedElement.x;
                  const y = selectedElement.y;
                  targetRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${beforeRotate}deg)`;
                }}
                onRotateEnd={({ lastEvent }) => {
                  if (!lastEvent) return;
                  const rotate = lastEvent.beforeRotate;
                  const normalizedRotation = ((rotate % 360) + 360) % 360;
                  updateElement({ rotation: normalizedRotation });
                }}
              />
            )}

            {snapGuides.map((guide, i) =>
              guide.type === "vertical" ? (
                <div
                  key={`v-${i}`}
                  style={{
                    position: "absolute",
                    left: `${guide.x}px`,
                    top: `${guide.fromY}px`,
                    height: `${guide.toY - guide.fromY}px`,
                    width: "1px",
                    borderLeft: "1px dashed #3498db",
                    zIndex: 9999,
                    pointerEvents: "none",
                  }}
                />
              ) : (
                <div
                  key={`h-${i}`}
                  style={{
                    position: "absolute",
                    top: `${guide.y}px`,
                    left: `${guide.fromX}px`,
                    width: `${guide.toX - guide.fromX}px`,
                    height: "1px",
                    borderTop: "1px dashed #3498db",
                    zIndex: 9999,
                    pointerEvents: "none",
                  }}
                />
              )
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
