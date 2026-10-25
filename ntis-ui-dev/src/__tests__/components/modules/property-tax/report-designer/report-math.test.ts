import { describe, it, expect } from 'vitest';
import {
  mmToPx,
  pxToMm,
  calculatePageDimensions,
  snapToGrid,
  calculatePrintableGeometry,
} from '@/lib/utils/reports/designer';

describe('Report Designer Math & Dimensions', () => {
  it('converts mm to px and px to mm accurately', () => {
    expect(mmToPx(25.4)).toBe(96);
    expect(pxToMm(96)).toBe(25.4);
    expect(mmToPx(210)).toBe(794);
    expect(mmToPx(297)).toBe(1123);
  });

  it('calculates page dimensions for A4 portrait and landscape', () => {
    const portrait = calculatePageDimensions('A4', 'portrait');
    expect(portrait.widthMm).toBe(210);
    expect(portrait.heightMm).toBe(297);
    expect(portrait.pageWidthPx).toBe(794);
    expect(portrait.pageHeightPx).toBe(1123);

    const landscape = calculatePageDimensions('A4', 'landscape');
    expect(landscape.widthMm).toBe(297);
    expect(landscape.heightMm).toBe(210);
    expect(landscape.pageWidthPx).toBe(1123);
    expect(landscape.pageHeightPx).toBe(794);
  });

  it('calculates custom paper dimensions', () => {
    const custom = calculatePageDimensions('Custom', 'portrait', 150, 250);
    expect(custom.widthMm).toBe(150);
    expect(custom.heightMm).toBe(250);
  });

  it('snaps coordinates to grid accurately', () => {
    expect(snapToGrid(12, 5)).toBe(10);
    expect(snapToGrid(14, 5)).toBe(15);
    expect(snapToGrid(17, 10)).toBe(20);
    expect(snapToGrid(12, 0)).toBe(12);
  });

  it('calculates printable geometry margins', () => {
    const geom = calculatePrintableGeometry(1000, 800, { top: 10, right: 10, bottom: 10, left: 10 });
    expect(geom.pageWidth).toBe(1000);
    expect(geom.pageHeight).toBe(800);
    expect(geom.printableWidth).toBeLessThan(1000);
    expect(geom.printableHeight).toBeLessThan(800);
  });
});
