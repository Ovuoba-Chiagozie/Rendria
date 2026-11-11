import QRCode from 'qrcode-generator';
import { Element, n, s, css, style } from './element.helpers';

export function renderQr(el: Element) {
  const qr = QRCode(0, 'L');
  qr.addData(s(el.value));
  qr.make();
  const size = Math.min(n(el.width), n(el.height));
  const svg = qr
    .createSvgTag({ scalable: true, margin: 0 })
    .replace('<svg ', `<svg width="${size}" height="${size}" `);
  return `<div style="${style(el)}border:${n(el.borderWidth)}px solid ${css(el.borderColor, 'transparent')};display:flex;align-items:center;justify-content:center;">${svg}</div>`;
}
