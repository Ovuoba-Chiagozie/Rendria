import { Element, n, escapeHtml, css, style } from './element.helpers';

export function renderText(el: Element) {
  const align = ['left', 'center', 'right'][n(el.textAlignIndex)] || 'left';
  const decoration =
    el.underline && el.lineThrough
      ? 'underline line-through'
      : el.underline
        ? 'underline'
        : el.lineThrough
          ? 'line-through'
          : 'none';
  return `<div style="${style(el)}font-family:'${css(el.family, 'sans-serif')}',sans-serif;font-size:${n(el.fontSize, 16)}px;font-weight:${el.bold ? 700 : 400};font-style:${el.italic ? 'italic' : 'normal'};line-height:${n(el.lineSpacing, 1.2)};letter-spacing:${n(el.letterSpacing)}px;color:${css(el.color, '#000')};text-align:${align};text-transform:${el.uppercase ? 'uppercase' : 'none'};text-decoration:${decoration};">${escapeHtml(el.content)}</div>`;
}
