import JsBarcode from 'jsbarcode';
import { Element, n, s, css, style } from './element.helpers';

export async function renderBarcode(el: Element) {
  const { JSDOM } = (await import('jsdom')) as unknown as {
    JSDOM: new (html: string) => { window: { document: Document } };
  };
  const dom = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const svg = dom.window.document.querySelector('svg')!;
  try {
    JsBarcode(svg, s(el.value), {
      format: s(el.format, 'CODE128'),
      displayValue: true,
    });
  } catch {
    return '';
  }
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return `<div style="${style(el)}border:${n(el.borderWidth)}px solid ${css(el.borderColor, 'transparent')};display:flex;align-items:center;justify-content:center;overflow:hidden;">${svg.outerHTML}</div>`;
}
