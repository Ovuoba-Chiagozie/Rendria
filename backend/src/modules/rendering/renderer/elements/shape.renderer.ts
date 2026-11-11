import { Element, n, s, css, style } from './element.helpers';

export function shapeSvg(el: Element, body: string, viewBox?: string) {
  return `<svg width="${n(el.width)}" height="${n(el.height)}" viewBox="${viewBox || `0 0 ${n(el.width)} ${n(el.height)}`}" style="${style(el)}">${body}</svg>`;
}

export function clipped(el: Element, tag: string, attrs: string) {
  const id = css(el.id || `shape-${Math.random().toString(36).slice(2)}`);
  const stroke = n(el.strokeWidth, 2) * 2;
  return `<defs><${tag} id="${id}" ${attrs}/><clipPath id="${id}Clip"><use href="#${id}"/></clipPath></defs><use href="#${id}" fill="${css(el.fill, 'none')}"/><use href="#${id}" fill="none" stroke="${css(el.strokeColor, 'currentColor')}" stroke-width="${stroke}" clip-path="url(#${id}Clip)" stroke-linejoin="round"/>`;
}

export function renderShape(el: Element) {
  const width = n(el.width, 24),
    height = n(el.height, 24),
    label = s(el.label);
  if (label === 'horizontal-line')
    return `<div style="position:absolute;left:${n(el.x)}px;top:${n(el.y)}px;width:${width}px;height:${n(el.strokeWidth, 2)}px;background-color:${css(el.fill, 'currentColor')};transform:rotate(${n(el.rotation)}deg);transform-origin:center"></div>`;
  if (label.includes('square'))
    return shapeSvg(
      el,
      clipped(
        el,
        'rect',
        `x="0" y="0" width="${width}" height="${height}" rx="0" ry="0"`,
      ),
    );
  if (label.includes('circle'))
    return shapeSvg(
      el,
      clipped(
        el,
        'circle',
        `cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2}"`,
      ),
    );
  if (label.includes('triangle'))
    return shapeSvg(
      el,
      clipped(
        el,
        'polygon',
        `points="${width / 2},0 ${width},${height} 0,${height}"`,
      ),
    );
  if (label.includes('star')) {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const radius =
        i % 2 ? Math.min(width, height) / 4 : Math.min(width, height) / 2;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      return `${width / 2 + radius * Math.cos(angle)},${height / 2 + radius * Math.sin(angle)}`;
    }).join(' ');
    return shapeSvg(el, clipped(el, 'polygon', `points="${pts}"`));
  }
  if (label.includes('heart'))
    return shapeSvg(
      el,
      clipped(
        el,
        'path',
        'd="M50 80C20 50 10 35 10 25C10 15 18 8 28 8S46 15 50 25C54 15 62 8 72 8S90 15 90 25C90 35 80 50 50 80Z"',
      ),
      '0 0 100 100',
    );
  if (label.includes('hexagon')) {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
      return `${width / 2 + (Math.min(width, height) / 2) * Math.cos(angle)},${height / 2 + (Math.min(width, height) / 2) * Math.sin(angle)}`;
    }).join(' ');
    return shapeSvg(el, clipped(el, 'polygon', `points="${pts}"`));
  }
  return '';
}
