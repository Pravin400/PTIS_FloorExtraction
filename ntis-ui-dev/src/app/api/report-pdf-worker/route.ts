import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  const source = await readFile(
    path.join(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
  );
  return new Response(source, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
