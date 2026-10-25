import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDocument } from '@/lib/api/document.service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guid: string; action: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        },
      });
    }

    const { guid, action } = await params;
    if (!guid || guid === 'undefined' || guid === 'null' || !guid.trim()) {
      return new NextResponse('Invalid document identifier', { status: 400 });
    }

    const decodedGuid = decodeURIComponent(guid.trim());
    const targetAction = action === 'download' ? 'download' : 'view';
    const { buffer, contentType, contentDisposition } = await getDocument(decodedGuid, targetAction);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Content-Disposition': contentDisposition || (targetAction === 'download' ? `attachment; filename="${decodedGuid}"` : 'inline'),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (_error) {
    return new NextResponse('Document not found', {
      status: 404,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
      },
    });
  }
}
