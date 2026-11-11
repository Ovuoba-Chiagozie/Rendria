import type { Element } from './elements/element.helpers';
import { renderText } from './elements/text.renderer';
import { renderImage } from './elements/image.renderer';
import { renderShape } from './elements/shape.renderer';
import { renderQr } from './elements/qr.renderer';
import { renderBarcode } from './elements/barcode.renderer';
import { renderStars } from './elements/star-rating.renderer';

export async function renderElement(
  el: Element,
  placeholder: string,
): Promise<string> {
  switch (el.type) {
    case 'text':
      return renderText(el);
    case 'image':
      return renderImage(el, placeholder);
    case 'shape':
      return renderShape(el);
    case 'qr-code':
      return renderQr(el);
    case 'barcode':
      return renderBarcode(el);
    case 'star-rating':
      return renderStars(el);
    default:
      return '';
  }
}
export async function renderDocument(
  elements: Element[],
  width: number,
  height: number,
  placeholder: string,
) {
  const fonts = [
    ...new Set(
      elements
        .filter((e) => e.type === 'text' && typeof e.family === 'string')
        .map((e) => encodeURIComponent(String(e.family)).replace(/%20/g, '+')),
    ),
  ];
  const fontLink = fonts.length
    ? `<link href="https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f}:ital,wght@0,400;0,700;1,400;1,700`).join('&')}&display=swap" rel="stylesheet">`
    : '';
  const rendered = await Promise.all(
    elements.map((e) => renderElement(e, placeholder)),
  );
  return `<!doctype html><html><head><meta charset="UTF-8"/>${fontLink}<style>html,body{margin:0;padding:0;background:white}#canvas{position:relative;width:${width}px;height:${height}px;overflow:hidden;background:white;contain:layout paint size}</style></head><body><div id="canvas">${rendered.join('\n')}</div></body></html>`;
}
