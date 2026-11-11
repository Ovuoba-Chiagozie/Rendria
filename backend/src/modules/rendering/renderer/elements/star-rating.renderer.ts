import { Element, n, css, style } from './element.helpers';

export function renderStars(el: Element) {
  const max = Math.max(1, Math.floor(n(el.maxRating, 5))),
    rating = Math.min(Math.max(0, Math.floor(n(el.rating))), max),
    width = n(el.width, 200),
    height = n(el.height, 40),
    spacing = n(el.spacing, 2),
    size = Math.max(1, Math.min((width - spacing * (max - 1)) / max, height)),
    scale = size / 24,
    colors = (el.colors || {}) as Element,
    path =
      'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
  const paths = Array.from(
    { length: max },
    (_, i) =>
      `<g transform="translate(${(i * (size + spacing)).toFixed(3)},${((height - size) / 2).toFixed(3)}) scale(${scale.toFixed(6)})"><path d="${path}" fill="${css(i < rating ? colors.fill || '#FFD700' : colors.empty || 'rgba(220,166,166,1)')}" stroke="${css(colors.border || '#000000')}"/></g>`,
  ).join('');
  return `<div style="${style(el)}overflow:visible"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet">${paths}</svg></div>`;
}
