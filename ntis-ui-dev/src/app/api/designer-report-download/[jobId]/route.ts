import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/services/api.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    if (!/^[a-f0-9-]{36}$/i.test(jobId)) return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    const upstream = await apiClient.fetch(`/designer-report-jobs/${encodeURIComponent(jobId)}/download`);
    if (!upstream.ok) return NextResponse.json({ error: await upstream.text().catch(() => 'Download failed') }, { status: upstream.status });
    const parsedUrl = new URL(_request.url);
    const inline = parsedUrl.searchParams.get('inline') === 'true';
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store');
    headers.set('Content-Type', upstream.headers.get('Content-Type') ?? 'application/pdf');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set(
      'Content-Disposition',
      inline
        ? 'inline'
        : upstream.headers.get('Content-Disposition') ?? `attachment; filename="${jobId}.pdf"`,
    );
    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: 'Download failed' }, { status: 500, headers: { 'X-Frame-Options': 'SAMEORIGIN' } });
  }
}
