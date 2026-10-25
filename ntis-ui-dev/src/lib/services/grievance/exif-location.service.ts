/**
 * Zero-Dependency Browser Photo EXIF GPS Extraction Service
 * Reads binary metadata from camera photos using DataView to extract embedded GPS coordinates.
 */

export interface PhotoGpsCoordinates {
  latitude: number;
  longitude: number;
  hasGps: boolean;
  source: 'photo_exif';
  altitude?: number;
  dateTime?: string;
}

/**
 * Extracts GPS coordinates from a File or Blob image object using native browser APIs.
 */
export async function extractExifGps(
  fileOrBlob: File | Blob
): Promise<PhotoGpsCoordinates | null> {
  if (typeof window === 'undefined' || !fileOrBlob) return null;

  try {
    const arrayBuffer = await fileOrBlob.slice(0, 131072).arrayBuffer(); // Read first 128KB (where EXIF resides)
    const view = new DataView(arrayBuffer);

    // Verify JPEG SOI marker (0xFFD8)
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
      return null;
    }

    let offset = 2;
    const length = view.byteLength;

    // Scan for APP1 marker (0xFFE1)
    while (offset < length - 4) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xffe1) {
        // Found APP1
        const segmentLength = view.getUint16(offset, false);
        return parseExifApp1(view, offset + 2, segmentLength - 2);
      }

      // Check if we hit standard markers with length
      if ((marker & 0xff00) === 0xff00) {
        if (marker === 0xffda || marker === 0xffd9) {
          // Start of scan or end of image
          break;
        }
        const segLen = view.getUint16(offset, false);
        offset += segLen;
      } else {
        offset++;
      }
    }

    return null;
  } catch (err) {
    console.warn('EXIF GPS extraction error:', err);
    return null;
  }
}

function parseExifApp1(
  view: DataView,
  startOffset: number,
  _maxLen?: number
): PhotoGpsCoordinates | null {
  // Check "Exif\0\0" header (0x45 0x78 0x69 0x66 0x00 0x00)
  if (
    view.getUint32(startOffset, false) !== 0x45786966 ||
    view.getUint16(startOffset + 4, false) !== 0x0000
  ) {
    return null;
  }

  const tiffStart = startOffset + 6;
  const byteOrder = view.getUint16(tiffStart, false);
  const littleEndian = byteOrder === 0x4949; // 'II'

  // Verify TIFF magic number 42 (0x002A)
  if (view.getUint16(tiffStart + 2, littleEndian) !== 0x002a) {
    return null;
  }

  const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
  if (firstIfdOffset < 8) return null;

  let ifdOffset = tiffStart + firstIfdOffset;
  const numEntries = view.getUint16(ifdOffset, littleEndian);
  ifdOffset += 2;

  let gpsIfdOffset: number | null = null;

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    if (tag === 0x8825) {
      // GPSInfo tag
      gpsIfdOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      break;
    }
  }

  if (!gpsIfdOffset || gpsIfdOffset + 2 > view.byteLength) {
    return null;
  }

  // Parse GPS IFD
  const gpsEntriesCount = view.getUint16(gpsIfdOffset, littleEndian);
  const curGpsOffset = gpsIfdOffset + 2;

  let latRef = 'N';
  let lngRef = 'E';
  let latValues: number[] | null = null;
  let lngValues: number[] | null = null;

  for (let i = 0; i < gpsEntriesCount; i++) {
    const entryOffset = curGpsOffset + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag === 0x0001) {
      // GPSLatitudeRef
      latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0002) {
      // GPSLatitude (3 RATIONALs)
      const dataOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      latValues = readRationals(view, dataOffset, 3, littleEndian);
    } else if (tag === 0x0003) {
      // GPSLongitudeRef
      lngRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0004) {
      // GPSLongitude (3 RATIONALs)
      const dataOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      lngValues = readRationals(view, dataOffset, 3, littleEndian);
    }
  }

  if (latValues && lngValues && latValues.length === 3 && lngValues.length === 3) {
    let lat = latValues[0] + latValues[1] / 60 + latValues[2] / 3600;
    if (latRef.toUpperCase() === 'S') lat = -lat;

    let lng = lngValues[0] + lngValues[1] / 60 + lngValues[2] / 3600;
    if (lngRef.toUpperCase() === 'W') lng = -lng;

    // Check valid coordinate ranges
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      // Reject Null Island (0, 0) or uninitialized dummy GPS
      if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
        return null;
      }
      return {
        latitude: lat,
        longitude: lng,
        hasGps: true,
        source: 'photo_exif',
      };
    }
  }

  return null;
}

function readRationals(
  view: DataView,
  offset: number,
  count: number,
  littleEndian: boolean
): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const pos = offset + i * 8;
    if (pos + 8 > view.byteLength) break;
    const numerator = view.getUint32(pos, littleEndian);
    const denominator = view.getUint32(pos + 4, littleEndian);
    values.push(denominator === 0 ? 0 : numerator / denominator);
  }
  return values;
}
