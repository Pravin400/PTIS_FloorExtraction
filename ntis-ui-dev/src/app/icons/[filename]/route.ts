import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { EMBEDDED_ICONS } from '../icon-data';

export const dynamic = 'force-static';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;

  // 1. Sanitize filename against directory traversal attacks (CWE-22)
  const safeFilename = path.basename(filename);
  const iconsDir = path.resolve(process.cwd(), 'public', 'icons');
  const diskPath = path.resolve(iconsDir, safeFilename);

  if (!diskPath.startsWith(iconsDir)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    if (fs.existsSync(diskPath)) {
      const fileBuffer = fs.readFileSync(diskPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  } catch {
    // Fallback to embedded icon
  }

  // 2. Fallback to embedded base64 icon
  const base64Data = EMBEDDED_ICONS[safeFilename];
  if (base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  }

  return new NextResponse('Icon not found', { status: 404 });
}
