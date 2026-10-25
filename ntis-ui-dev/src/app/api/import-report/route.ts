import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { importDesignerReportServer } from '@/lib/api/property-tax/reports/report-import.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// RPT/PDF uploads can exceed the application's server-action body limit.
// Parsing, validation and source storage live in the report import service.
export async function POST(request: NextRequest) {
  if (!(await cookies()).get('auth_token')?.value) {
    return NextResponse.json({ error: 'A tenant login is required.' }, { status: 401 });
  }
  const result = await importDesignerReportServer(await request.formData());
  return NextResponse.json(result.data, { status: result.status });
}
