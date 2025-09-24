import JsBarcode from "jsbarcode";
import { JSDOM } from "jsdom";

export function renderBarcode(el) {
  const { id, value, format, x, y, width, height, borderWidth, borderColor, rotation } = el;

  // Create an SVG element in a virtual DOM
  const dom = new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg"></svg>`);
  global.window = dom.window;
  global.document = dom.window.document;

  // Create empty SVG
  const svg = dom.window.document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // Generate barcode
  JsBarcode(svg, value || "", {
    format: format || "CODE128",
    displayValue: true,
  });

  // Remove JsBarcode's hardcoded width/height
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  // Force responsive scaling (like react-barcode)
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // If JsBarcode already added a viewBox, keep it. If not, add one.
  if (!svg.getAttribute("viewBox")) {
    const bbox = svg.getBBox();
    svg.setAttribute("viewBox", `0 0 ${bbox.width} ${bbox.height}`);
  }

  // Inline styles for container
  const style = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${width}px;
    height: ${height}px;
    border: ${borderWidth || 0}px solid ${borderColor || "transparent"};
    transform: rotate(${rotation || 0}deg);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `;

  return `
    <div id="${id}" style="${style}">
      ${svg.outerHTML}
    </div>
  `;
}
