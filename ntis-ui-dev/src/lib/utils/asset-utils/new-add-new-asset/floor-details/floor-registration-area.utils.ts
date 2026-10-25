 
export function calculateArea(
  shape: string,
  length: number,
  width: number,
  radius: number,
  base1: number,
  base2: number,
  height: number
): number {
  const s = (shape || 'Rectangle').toLowerCase();
  if (s === 'rectangle' || s === 'rect') {
    return length * width;
  }
  if (s === 'square') {
    const side = length || width;
    return side * side;
  }
  if (s === 'triangle') {
    return 0.5 * (length || base1 || 0) * (width || height || 0);
  }
  if (s === 'trapezoid') {
    return 0.5 * (base1 + base2) * (height || width || length || 0);
  }
  if (s === 'circle') {
    const r = radius || length || width || 0;
    return Math.PI * r * r;
  }
  if (s === 'semi circle' || s === 'semicircle') {
    const r = radius || length || width || 0;
    return 0.5 * Math.PI * r * r;
  }
  if (s === 'quarter circle' || s === 'quartercircle' || s === 'quarter') {
    const r = radius || length || width || 0;
    return 0.25 * Math.PI * r * r;
  }
  return 0;
}
