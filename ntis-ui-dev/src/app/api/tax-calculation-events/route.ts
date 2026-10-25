import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { getAppConfig } from '@/config/app.config';
import type { TaxCalculationProgressDto, TaxCalculationCompletedDto } from '@/types/tax-calculation-notification.types';

export const runtime = 'nodejs';

/**
 * Server-Sent Events proxy for SignalR tax recalculation updates.
 *
 * The browser connects here with EventSource('/api/tax-calculation-events').
 * This route connects to the platform's SignalR hub server-side.
 *
 * Events streamed to the browser:
 *   - OnTaxRecalculationProgress: { jobId, societyDetailId, wingDetailId, processedUnits, totalUnits, percentComplete, status, message }
 *   - OnTaxRecalculationCompleted: { jobId, societyDetailId, wingDetailId, totalUnits, succeededCount, failedCount, isSuccess, durationMs, completedAt, message }
 */
export async function GET(request: NextRequest): Promise<Response> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_token')?.value;
  const encoder = new TextEncoder();

  if (!sessionToken) {
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(': unauthenticated\n\n'));
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
        },
      }
    );
  }

  const config = getAppConfig();
  const apiBase = config.api.baseUrl?.trim().replace(/\/+$/, '');
  if (!apiBase) return new Response('Server misconfigured', { status: 500 });

  const platformBase = apiBase.replace(/\/api$/i, '');
  const hubUrl = `${platformBase}/hubs/tax-calculation`;

  let conn: HubConnection | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial comment so the browser EventSource knows the connection is alive
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Keepalive ping every 25 seconds
      const keepaliveTimer = setInterval(() => {
        if (request.signal.aborted) return;
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch { /* closed */ }
      }, 25_000);

      const builder = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => sessionToken,
        })
        .withAutomaticReconnect();

      conn = builder.build();

      conn.on('OnTaxRecalculationProgress', (progress: TaxCalculationProgressDto) => {
        if (request.signal.aborted) return;
        try {
          controller.enqueue(
            encoder.encode(`event: progress\ndata: ${JSON.stringify(progress)}\n\n`),
          );
        } catch { /* stream closed */ }
      });

      conn.on('OnTaxRecalculationCompleted', (completed: TaxCalculationCompletedDto) => {
        if (request.signal.aborted) return;
        try {
          controller.enqueue(
            encoder.encode(`event: completed\ndata: ${JSON.stringify(completed)}\n\n`),
          );
        } catch { /* stream closed */ }
      });

      try {
        await conn.start();
      } catch {
        // Hub currently offline — keep stream open with idle comment so browser doesn't reconnect in a loop
        try {
          controller.enqueue(encoder.encode(': hub-offline\n\n'));
        } catch { /* closed */ }
      }

      // Clean up when client disconnects
      request.signal.addEventListener('abort', async () => {
        clearInterval(keepaliveTimer);
        try { await conn?.stop(); } catch { /* ignore */ }
        try { controller.close(); } catch { /* closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
