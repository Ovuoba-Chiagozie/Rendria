import { Element, n, s, escapeHtml, css } from './element.helpers';

export function renderImage(el: Element, placeholder: string) {
  const transform = `rotate(${n(el.rotation)}deg)${el.flipX ? ' scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}`;
  const radius = el.borderRadius as
    { value?: unknown; unit?: unknown } | undefined;
  const objectFit = ['fill', 'cover', 'contain'].includes(s(el.objectFit))
    ? s(el.objectFit)
    : 'fill';
  return `<img src="${escapeHtml(el.src || placeholder)}" style="position:absolute;left:${n(el.x)}px;top:${n(el.y)}px;width:${n(el.width)}px;height:${n(el.height)}px;object-fit:${objectFit};border:${n(el.borderWidth)}px solid ${css(el.borderColor, 'transparent')};border-radius:${n(radius?.value)}${radius?.unit === '%' ? '%' : 'px'};transform:${transform};transform-origin:center;background-color:transparent;box-sizing:border-box;"/>`;
}
