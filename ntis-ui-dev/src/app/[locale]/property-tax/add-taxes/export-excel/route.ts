import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/services/api.service';
import { createLogger } from '@/lib/utils/server-logger';

const logger = createLogger('AddTaxesExportExcelRoute');

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const financeYearId = searchParams.get('financeYearId');
    if (!financeYearId) {
      return NextResponse.json({ error: 'financeYearId is required' }, { status: 400 });
    }

    const endpoint = `/property-tax/operations/export-properties?status=${encodeURIComponent(status)}&financeYearId=${encodeURIComponent(financeYearId)}`;

    logger.info('[AddTaxesExportExcelRoute] Proxying export request to backend', { endpoint, status, financeYearId });

    const upstream = await apiClient.fetch(endpoint);

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => 'Export failed');
      logger.error('[AddTaxesExportExcelRoute] Backend API error', {
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

    const defaultFilename = `property_tax_properties_${status.toLowerCase()}.csv`;
    const contentDisposition =
      upstream.headers.get('Content-Disposition') || `attachment; filename="${defaultFilename}"`;
    responseHeaders.set('Content-Disposition', contentDisposition);

    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    logger.error('[AddTaxesExportExcelRoute] Server error during export', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error during export' }, { status: 500 });
  }
}
