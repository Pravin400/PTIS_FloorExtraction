'use client';

import type { PDFPageProxy, PageViewport } from 'pdfjs-dist';
import type { PdfLayoutGraphic } from '../build-imported-report';

type PdfLibrary = typeof import('pdfjs-dist');
type PaintState = { transform: number[]; fill: string; stroke: string; lineWidth: number };

function boundsFor(bounds: number[], transform: number[], pdf: PdfLibrary) {
  const [minX, minY, maxX, maxY] = bounds;
  const points = [
    [minX, minY],
    [maxX, minY],
    [minX, maxY],
    [maxX, maxY],
  ].map((point) => pdf.Util.applyTransform(point, transform));
  const x = Math.min(...points.map((p) => p[0])),
    y = Math.min(...points.map((p) => p[1]));
  return {
    x,
    y,
    width: Math.max(...points.map((p) => p[0])) - x,
    height: Math.max(...points.map((p) => p[1])) - y,
  };
}
function color(args: unknown[]): string {
  return `rgb(${args
    .slice(0, 3)
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, Number(v) <= 1 ? Number(v) * 255 : Number(v))))
    )
    .join(',')})`;
}

async function imageUrl(page: PDFPageProxy, name: string) {
  const image = await new Promise<{
    width: number;
    height: number;
    bitmap?: ImageBitmap;
    data?: Uint8Array;
  }>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PDF image extraction timed out.')), 5000);
    try {
      page.objs.get(name, (value: unknown) => {
        clearTimeout(timer);
        if (!value || typeof value !== 'object') reject(new Error('Invalid PDF image.'));
        else
          resolve(
            value as { width: number; height: number; bitmap?: ImageBitmap; data?: Uint8Array }
          );
      });
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
  if (!image.width || !image.height || image.width * image.height > 16_000_000) return '';
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  if (image.bitmap) ctx.drawImage(image.bitmap, 0, 0);
  else if (image.data) {
    const rgba = new Uint8ClampedArray(image.width * image.height * 4);
    if (image.data.length === rgba.length) rgba.set(image.data);
    else if (image.data.length === image.width * image.height * 3)
      for (let a = 0, b = 0; a < image.data.length; a += 3, b += 4) {
        rgba[b] = image.data[a];
        rgba[b + 1] = image.data[a + 1];
        rgba[b + 2] = image.data[a + 2];
        rgba[b + 3] = 255;
      }
    else return '';
    ctx.putImageData(new ImageData(rgba, image.width, image.height), 0, 0);
  } else return '';
  return canvas.toDataURL('image/png');
}

/** Preserve imported PDF rules, frames and embedded images as editable report objects. */
export async function extractPdfGraphics(
  page: PDFPageProxy,
  viewport: PageViewport,
  pdf: PdfLibrary
): Promise<PdfLayoutGraphic[]> {
  const list = await page.getOperatorList(),
    ops = pdf.OPS;
  const state: PaintState = {
    transform: [...viewport.transform],
    fill: '#111827',
    stroke: '#111827',
    lineWidth: 1,
  };
  const stack: PaintState[] = [],
    graphics: PdfLayoutGraphic[] = [],
    images: Promise<void>[] = [];
  let path: { bounds: number[]; simple: boolean } | null = null;
  const paint = (fill: boolean, stroke: boolean) => {
    if (!path) return;
    const current = path;
    path = null;
    const bounds = boundsFor(current.bounds, state.transform, pdf);
    if (bounds.width <= 0 && bounds.height <= 0) return;
    const scale = Math.max(
      Math.hypot(state.transform[0], state.transform[1]),
      Math.hypot(state.transform[2], state.transform[3])
    );
    const strokeWidth = Math.max(0.5, state.lineWidth * scale);
    const line =
      bounds.width <= Math.max(2, strokeWidth * 2) || bounds.height <= Math.max(2, strokeWidth * 2);
    if (fill && !current.simple && !line) return;
    if (
      bounds.width >= viewport.width * 0.98 &&
      bounds.height >= viewport.height * 0.98 &&
      state.fill === 'rgb(255,255,255)'
    )
      return;
    graphics.push(
      line && stroke
        ? { type: 'line', ...bounds, stroke: state.stroke, strokeWidth }
        : {
            type: 'rectangle',
            ...bounds,
            fill: fill ? state.fill : 'none',
            stroke: stroke ? state.stroke : 'none',
            strokeWidth: stroke ? strokeWidth : 0,
          }
    );
  };
  list.fnArray.forEach((operation: number, index: number) => {
    const args = (list.argsArray[index] || []) as unknown[];
    if (operation === ops.save) stack.push({ ...state, transform: [...state.transform] });
    else if (operation === ops.restore) {
      const value = stack.pop();
      if (value) Object.assign(state, value);
      path = null;
    } else if (operation === ops.transform)
      state.transform = pdf.Util.transform(state.transform, args.map(Number));
    else if (operation === ops.setFillRGBColor) state.fill = color(args);
    else if (operation === ops.setStrokeRGBColor) state.stroke = color(args);
    else if (operation === ops.setLineWidth) state.lineWidth = Math.max(0, Number(args[0]) || 0);
    else if (operation === ops.constructPath) {
      const commands = Array.from((args[0] as ArrayLike<number>) || []);
      path = args[2]
        ? {
            bounds: Array.from(args[2] as ArrayLike<number>),
            simple: commands.length <= 6 && commands.filter((v) => v === ops.moveTo).length <= 1,
          }
        : null;
    } else if ([ops.stroke, ops.closeStroke].includes(operation)) paint(false, true);
    else if ([ops.fill, ops.eoFill].includes(operation)) paint(true, false);
    else if (
      [ops.fillStroke, ops.eoFillStroke, ops.closeFillStroke, ops.closeEOFillStroke].includes(
        operation
      )
    )
      paint(true, true);
    else if ([ops.endPath, ops.clip, ops.eoClip].includes(operation)) path = null;
    else if (operation === ops.paintImageXObject && typeof args[0] === 'string') {
      const bounds = boundsFor([0, 0, 1, 1], state.transform, pdf);
      images.push(
        imageUrl(page, args[0])
          .then((dataUrl) => {
            if (dataUrl) graphics.push({ type: 'image', ...bounds, dataUrl });
          })
          .catch(() => {
            /* Unsupported image encodings leave the source PDF available as a reference. */
          })
      );
    }
  });
  await Promise.all(images);
  return graphics.filter(
    (g) =>
      g.x + g.width >= 0 && g.y + g.height >= 0 && g.x <= viewport.width && g.y <= viewport.height
  );
}
