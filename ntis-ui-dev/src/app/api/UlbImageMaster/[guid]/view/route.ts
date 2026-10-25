import { NextResponse } from 'next/server';
import { getUlbImageView } from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.services';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;
    const res = await getUlbImageView(guid);
    const buffer = Buffer.from(res.base64, 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (_error) {
    return new NextResponse('Image not found', {
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
