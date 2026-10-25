import { NextRequest, NextResponse } from 'next/server';
import { getReferencePdfAsset } from '@/lib/utils/reports/designer/template-source-assets.server';
import { apiClient } from '@/services/api.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const reportId = request.nextUrl.searchParams.get('reportId')?.trim() || '';
  if (!reportId) return NextResponse.json({ error: 'A report ID is required.' }, { status: 400 });

  try {
    const asset = await getReferencePdfAsset(reportId);
    if (!asset) return NextResponse.json({ error: 'Reference PDF was not found.' }, { status: 404 });

    const range = request.headers.get('range');
    const upstream = await apiClient.fetch(
      `/documents/${encodeURIComponent(asset.documentGuid)}/view`,
      { headers: range ? { Range: range } : undefined },
    );
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Reference PDF could not be loaded.' }, { status: upstream.status });
    }

    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      'Content-Type': upstream.headers.get('content-type') || 'application/pdf',
      'Content-Disposition': `inline; filename="${asset.fileName.replace(/"/g, '')}"`,
    });
    for (const name of ['accept-ranges', 'content-length', 'content-range']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error('Reference PDF proxy failed:', error);
    return NextResponse.json({ error: 'Reference PDF could not be loaded.' }, { status: 500 });
  }
}

