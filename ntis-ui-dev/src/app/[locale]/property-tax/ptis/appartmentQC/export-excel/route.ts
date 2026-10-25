/**
 * API Route: /api/apartment-qc/export-excel
 * 
 * Securely proxies the Excel export request to the backend API.
 * Authentication is handled server-side using httpOnly cookies,
 * preventing auth token exposure to client-side JavaScript.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppConfig } from '@/config/app.config';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const wardId = searchParams.get('WardId');
    const propertyNo = searchParams.get('PropertyNo');

    // Validate required parameters
    if (!wardId || !propertyNo) {
      return NextResponse.json(
        { error: 'Missing required parameters: WardId and PropertyNo' },
        { status: 400 }
      );
    }

    // Get auth token from cookies (server-side only)
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized: No authentication token found' },
        { status: 401 }
      );
    }

    // Build the backend API URL
    const config = getAppConfig();
    const params = new URLSearchParams();
    params.append('WardId', wardId);
    params.append('PropertyNo', propertyNo);
    const backendUrl = `${config.api.baseUrl}/ApartmentQC/export-excel?${params.toString()}`;

    // Proxy the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      logger.error('[Excel Export] Backend API error', { 
        status: response.status, 
        statusText: response.statusText 
      });
      return NextResponse.json(
        { error: `Backend API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the file data
    const fileData = await response.arrayBuffer();
    
    // Get content-type and content-disposition from backend response
    const contentType = response.headers.get('content-type') || 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const contentDisposition = response.headers.get('content-disposition') || 
      `attachment; filename="apartment-qc-${propertyNo}.xlsx"`;

    // Return the file with appropriate headers
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('[Excel Export] Unexpected error', { error: error as Error });
    return NextResponse.json(
      { error: 'Internal server error during Excel export' },
      { status: 500 }
    );
  }
}
