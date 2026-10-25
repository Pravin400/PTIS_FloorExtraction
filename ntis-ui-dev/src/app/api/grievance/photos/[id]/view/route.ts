import { NextRequest, NextResponse } from 'next/server';
import { grievancePhotoService } from '@/lib/api/grievance/citizen/grievance-photo.service';

/**
 * Next.js Route Handler: Image Streaming Proxy
 * Proxies binary photo streams from ASP.NET Core backend to browser <img> elements.
 * Delegates all backend API fetching logic to grievancePhotoService.
 * Route: GET /api/grievance/photos/[id]/view
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const photoId = parseInt(id, 10);

    if (isNaN(photoId) || photoId <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid photo ID provided' },
        { status: 400 }
      );
    }

    const { ok, data, contentType, contentDisposition } =
      await grievancePhotoService.getPhotoBinary(photoId);

    if (!ok || !data) {
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="200" cy="130" r="32" fill="#334155"/>
  <path d="M188 122h24v18h-24zm3-8h18l3 4h8a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4h-36a4 4 0 0 1-4-4v-22a4 4 0 0 1 4-4h7z" fill="#94a3b8"/>
  <text x="200" y="195" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="12" font-weight="600" fill="#94a3b8" text-anchor="middle">Civic Evidence Photo</text>
  <text x="200" y="215" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Municipal Corporation</text>
</svg>`;
      return new NextResponse(fallbackSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType || 'image/jpeg');
    responseHeaders.set('Content-Length', data.byteLength.toString());
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
    if (contentDisposition) {
      responseHeaders.set('Content-Disposition', contentDisposition);
    }

    return new NextResponse(data, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (_error) {
    const errorFallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="100%" height="100%" fill="#1e293b"/>
  <circle cx="200" cy="130" r="32" fill="#334155"/>
  <path d="M188 122h24v18h-24zm3-8h18l3 4h8a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4h-36a4 4 0 0 1-4-4v-22a4 4 0 0 1 4-4h7z" fill="#94a3b8"/>
  <text x="200" y="195" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="12" font-weight="600" fill="#94a3b8" text-anchor="middle">Civic Evidence Photo</text>
  <text x="200" y="215" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Municipal Corporation</text>
</svg>`;
    return new NextResponse(errorFallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
