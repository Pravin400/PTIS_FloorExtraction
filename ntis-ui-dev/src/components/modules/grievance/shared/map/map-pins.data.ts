export const SCREENSHOT_PINS: Array<{
  id: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
  title: string;
  titleMr: string;
}> = [];


export const isValidCoord = (c: unknown): c is number =>
  typeof c === 'number' && !isNaN(c) && isFinite(c) && c !== 0;

export const isValidPoint = (p: unknown): p is [number, number] =>
  Array.isArray(p) && p.length >= 2 && isValidCoord(p[0]) && isValidCoord(p[1]);

