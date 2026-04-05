export function normalizeDimension(value, fallback) {
  if (value === null || value === undefined) return fallback;

  let num;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const cleaned = trimmed.toLowerCase().endsWith("px")
      ? trimmed.slice(0, -2)
      : trimmed;
    num = Number(cleaned);
  } else {
    num = Number(value);
  }

  if (!Number.isFinite(num)) return fallback;

  const intVal = Math.round(num);
  if (!Number.isFinite(intVal) || intVal <= 0) return fallback;

  return intVal;
}

export function normalizeCanvasSize(canvasSize, fallback = { width: 800, height: 600 }) {
  return {
    width: normalizeDimension(canvasSize?.width, fallback.width),
    height: normalizeDimension(canvasSize?.height, fallback.height),
  };
}
