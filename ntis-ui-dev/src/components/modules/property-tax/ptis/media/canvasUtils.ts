/**
 * Utility functions for HTML5 Canvas image manipulations.
 * Used by the client-side ImageEditor component.
 */

import { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';

export interface FlipState {
  horizontal: boolean;
  vertical: boolean;
}

/**
 * Loads an image from a URL as an HTMLImageElement with anonymous crossOrigin setup.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Generates a default centered crop box based on image dimensions and optional aspect ratio.
 */
export function getInitialCrop(width: number, height: number, aspect?: number): Crop {
  if (aspect) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        aspect,
        width,
        height
      ),
      width,
      height
    );
  }
  return {
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  };
}

/**
 * Performs rotation and flipping on the image source, outputting a new Blob.
 */
export async function getTransformedImg(
  imageSrc: string,
  rotation = 0,
  flip: FlipState = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = (rotation * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rotRad));
  const absSin = Math.abs(Math.sin(rotRad));
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const finalWidth = width * absCos + height * absSin;
  const finalHeight = width * absSin + height * absCos;

  canvas.width = finalWidth;
  canvas.height = finalHeight;

  ctx.translate(finalWidth / 2, finalHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-width / 2, -height / 2);
  ctx.drawImage(image, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * Crops an axis-aligned area of the image (which is already rotated and flipped) and exports as a Blob.
 */
export async function getCroppedImg(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Convert percentages to pixels on the natural image size
  const pixelX = (crop.x / 100) * image.naturalWidth;
  const pixelY = (crop.y / 100) * image.naturalHeight;
  const pixelWidth = (crop.width / 100) * image.naturalWidth;
  const pixelHeight = (crop.height / 100) * image.naturalHeight;

  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  ctx.drawImage(
    image,
    pixelX,
    pixelY,
    pixelWidth,
    pixelHeight,
    0,
    0,
    pixelWidth,
    pixelHeight
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}
