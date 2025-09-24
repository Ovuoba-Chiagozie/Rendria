// src/services/renderShape.js

function renderSquare({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
  x,
  y,
  rotation,
}) {
  return `
      <svg width="${width}" 
      style="
        position:absolute;
        left:${x}px; top:${y}px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        background-color:transparent;
      " 
      height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <rect id="${id}" x="0" y="0" width="${width}" height="${height}" rx="0" ry="0" />
          <clipPath id="${id}Clip">
            <use href="#${id}" />
          </clipPath>
        </defs>
        <use href="#${id}" fill="${fill}" />
        <use href="#${id}" fill="none" stroke="${strokeColor}" stroke-width="${
    strokeWidth * 2
  }" clip-path="url(#${id}Clip)" />
      </svg>
    `;
}

function renderCircle({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
  x,
  y,
  rotation,
}) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;
  return `
      <svg width="${width}"
        style="
        position:absolute;
        left:${x}px; top:${y}px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        background-color:transparent;
      " 
       height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <circle id="${id}" cx="${cx}" cy="${cy}" r="${radius}" />
          <clipPath id="${id}Clip">
            <use href="#${id}" />
          </clipPath>
        </defs>
        <use href="#${id}" fill="${fill}" />
        <use href="#${id}" fill="none" stroke="${strokeColor}" stroke-width="${
    strokeWidth * 2
  }" clip-path="url(#${id}Clip)" />
      </svg>
    `;
}

function renderTriangle({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
  x,
  y,
  rotation,
}) {
  const pointA = `${width / 2},0`;
  const pointB = `${width},${height}`;
  const pointC = `0,${height}`;
  const points = `${pointA} ${pointB} ${pointC}`;
  return `
      <svg width="${width}"
       style="
        position:absolute;
        left:${x}px; top:${y}px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        background-color:transparent;
      " 
       height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <polygon id="${id}" points="${points}" />
          <clipPath id="${id}Clip">
            <use href="#${id}" />
          </clipPath>
        </defs>
        <use href="#${id}" fill="${fill}" />
        <use href="#${id}" fill="none" stroke="${strokeColor}" stroke-width="${
    strokeWidth * 2
  }" clip-path="url(#${id}Clip)" />
      </svg>
    `;
}

function renderStar({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
  x,
  y,
  rotation,
}) {
  const points = 5;
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius * 0.5;

  const starPoints = Array.from({ length: points * 2 }, (_, i) => {
    const isEven = i % 2 === 0;
    const radius = isEven ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  return `
      <svg width="${width}"
        style="
        position:absolute;
        left:${x}px; top:${y}px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        background-color:transparent;
      " 
       height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <polygon id="${id}" points="${starPoints}" />
          <clipPath id="${id}Clip">
            <use href="#${id}" />
          </clipPath>
        </defs>
        <use href="#${id}" fill="${fill}" />
        <use href="#${id}" fill="${fill}" stroke="${strokeColor}" stroke-width="${
    strokeWidth * 2
  }" clip-path="url(#${id}Clip)" stroke-linejoin="round" />
      </svg>
    `;
}

function renderHeart({
  id,
  width = 100,
  height = 100,
  strokeWidth = 10,
  strokeColor = "black",
  fill = "red",
  x,
  y,
  rotation,
}) {
  const pathData =
    "M50 80C20 50 10 35 10 25C10 15 18 8 28 8S46 15 50 25C54 15 62 8 72 8S90 15 90 25C90 35 80 50 50 80Z";
  return `
      <svg width="${width}"
       style="
        position:absolute;
        left:${x}px; top:${y}px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        background-color:transparent;
      " 
       height="${height}" viewBox="0 0 100 100">
        <defs>
          <path id="${id}" d="${pathData}" />
          <clipPath id="${id}Clip">
            <use href="#${id}" />
          </clipPath>
        </defs>
        <use href="#${id}" fill="${fill}" />
        <use href="#${id}" fill="none" stroke="${strokeColor}" stroke-width="${
    strokeWidth * 2
  }" clip-path="url(#${id}Clip)" />
      </svg>
    `;
}

function renderHexagon({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
  x,
  y,
  rotation,
}) {
  const sides = 6;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;

  const points = Array.from({ length: sides })
    .map((_, i) => {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  return `
      <svg width="${width}" 
       style="
        position:absolute;
        left:${x}px; top:${y}px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        background-color:transparent;
      " 
      height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <polygon id="${id}" points="${points}" />
          <clipPath id="${id}Clip">
            <use href="#${id}" />
          </clipPath>
        </defs>
        <use href="#${id}" fill="${fill}" />
        <use href="#${id}" fill="none" stroke="${strokeColor}" stroke-width="${
    strokeWidth * 2
  }" clip-path="url(#${id}Clip)" />
      </svg>
    `;
}

function renderHorizontalLine({
  width = 48,
  strokeWidth = 2,
  fill = "currentColor",
  x,
  y,
  rotation,
}) {
  return `<div 
        style="
        position:absolute;
        left:${x}px; top:${y}px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        width:${width}px;
        height:${strokeWidth}px;
        background-color:${fill}
      " ></div>`;
}

export function renderShape(shape) {
  switch (shape.label) {
    case "solid-square":
      return renderSquare(shape);
    case "outline-square":
      return renderSquare(shape);
    case "solid-circle":
      return renderCircle(shape);
    case "outline-circle":
      return renderCircle(shape);
    case "solid-triangle":
      return renderTriangle(shape);
    case "outline-triangle":
      return renderTriangle(shape);
    case "solid-star":
      return renderStar(shape);
    case "outline-star":
      return renderStar(shape);
    case "solid-heart":
      return renderHeart(shape);
    case "outline-heart":
      return renderHeart(shape);
    case "solid-hexagon":
      return renderHexagon(shape);
    case "outline-hexagon":
      return renderHexagon(shape);
    case "horizontal-line":
      return renderHorizontalLine(shape);
    default:
      return "";
  }
}
