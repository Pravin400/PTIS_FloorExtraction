import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/services/api.service';
import { createLogger } from '@/lib/utils/server-logger';

const logger = createLogger('AddTaxesPreviewExportRoute');

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const downloadType = searchParams.get('downloadType') || 'all';

    const body = await request.json();

    const endpoint = `/property-tax/operations/preview-export?downloadType=${encodeURIComponent(downloadType)}`;

    logger.info('[AddTaxesPreviewExportRoute] Proxying preview-export request to backend', { endpoint, downloadType });

    const upstream = await apiClient.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => 'Export failed');
      logger.error('[AddTaxesPreviewExportRoute] Backend API error', {
        status: upstream.status,
        statusText: upstream.statusText,
        errText,
      });
      return NextResponse.json(
        { error: `Backend API error (${upstream.status}): ${errText || upstream.statusText}` },
        { status: upstream.status }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    const contentType = upstream.headers.get('Content-Type') || 'text/csv; charset=utf-8';
    responseHeaders.set('Content-Type', contentType);

    const defaultFilename = `preview_${downloadType}_report.csv`;
    const contentDisposition =
      upstream.headers.get('Content-Disposition') || `attachment; filename="${defaultFilename}"`;
    responseHeaders.set('Content-Disposition', contentDisposition);

    const buffer = await upstream.arrayBuffer();
    responseHeaders.set('Content-Length', String(buffer.byteLength));

    return new NextResponse(buffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    logger.error('[AddTaxesPreviewExportRoute] Server error during preview-export', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error during preview-export' }, { status: 500 });
  }
}
