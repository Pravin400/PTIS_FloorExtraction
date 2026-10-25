import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppConfig } from '@/config/app.config';
import { serverFetch } from '@/lib/utils/server-fetch';
import { logger } from '@/lib/utils/logger';

async function handleExport(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('AssetCategoryId');
    const rawSearch = searchParams.get('search') || undefined;
    const search = rawSearch ? rawSearch.trim().slice(0, 200) : undefined;
    const rawSearchField = searchParams.get('searchField') || undefined;
    const searchField = rawSearchField === 'assetId' || rawSearchField === 'assetName' || rawSearchField === 'address'
      ? rawSearchField
      : 'all';
    const rawAssetNo = searchParams.get('AssetNo') || undefined;
    const assetNo = rawAssetNo ? rawAssetNo.trim().slice(0, 100) : undefined;
    const assetTypeId = searchParams.get('AssetTypeId') || undefined;
    const zoneId = searchParams.get('ZoneId');
    const wardId = searchParams.get('WardId');
    const departmentId = searchParams.get('DepartmentId');
    const ownershipType = searchParams.get('ownershipType');
    const encroachmentStatus = searchParams.get('encroachmentStatus');

    const baseUrl = getAppConfig().api.baseUrl?.replace(/\/$/, '');
    if (!baseUrl) {
      return new NextResponse('API base URL is not configured', { status: 500 });
    }

    const query = new URLSearchParams({ IsActive: 'true', PageNumber: '1', PageSize: '-1' });
    if (categoryId && Number.isFinite(Number(categoryId)) && Number(categoryId) > 0) {
      query.set('AssetCategoryId', categoryId);
    }
    if (assetTypeId && assetTypeId !== 'all') {
      assetTypeId.split(',').forEach((id) => {
        if (id.trim() && /^\d+$/.test(id.trim())) query.append('AssetTypeId', id.trim());
      });
    }
    if (zoneId && zoneId !== '-1' && zoneId !== 'all' && /^\d+$/.test(zoneId)) query.set('ZoneId', zoneId);
    if (wardId && wardId !== '-1' && wardId !== 'all' && /^\d+$/.test(wardId)) query.set('WardId', wardId);
    if (departmentId && departmentId !== '-1' && departmentId !== 'all' && /^\d+$/.test(departmentId)) {
      query.set('DepartmentId', departmentId);
    }
    if (ownershipType && ownershipType !== 'all') query.set('OwnershipType', ownershipType);
    if (encroachmentStatus && encroachmentStatus !== 'all') {
      const statuses = encroachmentStatus.split(',');
      statuses.forEach((status) => {
        if (status.trim()) query.append('EncroachmentStatus', status.trim());
      });
    }
    if (searchField === 'all' && search) query.set('SearchTerm', search);
    if (searchField === 'assetId' && search) query.set('AssetNo', search);
    else if (assetNo) query.set('AssetNo', assetNo);
    if (searchField === 'assetName' && search) query.set('AssetName', search);
    if (searchField === 'address' && search) query.set('Address', search);

    // Build headers
    const headers: Record<string, string> = {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const csrf = cookieStore.get('csrf_token')?.value;
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
    const cookieStr = cookieStore
      .getAll()
      .filter((c) =>
        /auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name)
      )
      .map((c) => `${c.name.replace(/[^\x00-\x7F]/g, '')}=${c.value.replace(/[^\x00-\x7F]/g, '')}`)
      .join('; ');
    if (cookieStr) {
      headers['Cookie'] = cookieStr;
    }

    const backendUrl = `${baseUrl}/AssetMaster/export-excel?${query.toString()}`;
    const backendResponse = await serverFetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return new NextResponse(errorText || 'Export failed', { status: backendResponse.status });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // Keep the route authoritative with a static filename contract.
    responseHeaders.set('Content-Disposition', 'attachment; filename="asset-register.xlsx"');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    const contentLength = backendResponse.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    // Direct proxying of stream
    return new Response(backendResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    logger.error('Failed to export asset register Excel', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return new NextResponse('Export failed', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleExport(request);
}

export async function HEAD(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return new NextResponse(null, { status: 401 });
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    logger.error('Failed to verify token in HEAD request', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return new NextResponse(null, { status: 500 });
  }
}
