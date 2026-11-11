export type Element = Record<string, unknown>;
export const n = (value: unknown, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
export const s = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;
export const escapeHtml = (value: unknown) =>
  s(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
export const css = (value: unknown, fallback = '') =>
  escapeHtml(value ?? fallback).replace(/[;{}]/g, '');
export const style = (value: Element) =>
  `position:absolute;left:${n(value.x)}px;top:${n(value.y)}px;width:${n(value.width)}px;height:${n(value.height)}px;transform:rotate(${n(value.rotation)}deg);transform-origin:center;background-color:transparent;box-sizing:border-box;`;
