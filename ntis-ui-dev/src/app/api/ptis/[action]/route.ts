import { NextResponse } from 'next/server';
import { ptisSearchService } from '@/lib/api/ptis/tab/ptis-search';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;

    if (action === 'suggestions') {
      const { searchParams } = new URL(request.url);
      const wardId = searchParams.get('wardId');
      const propertyNo = searchParams.get('propertyNo') || undefined;
      const partitionNo = searchParams.get('partitionNo') || undefined;
      const pageNumberParam = searchParams.get('pageNumber');
      const pageSizeParam = searchParams.get('pageSize');
      const maxResults = searchParams.get('maxResults');

      if (!wardId) {
        return NextResponse.json({ success: false, error: 'Ward ID is required' }, { status: 400 });
      }

      const resolvedWardId = parseInt(wardId, 10);
      if (isNaN(resolvedWardId)) {
        return NextResponse.json({ success: false, error: 'Invalid Ward ID' }, { status: 400 });
      }

      if (pageNumberParam !== null || pageSizeParam !== null) {
        const requestedPageNumber = Number(pageNumberParam || '1');
        const requestedPageSize = Number(pageSizeParam || '100');
        const pageNumber = Number.isInteger(requestedPageNumber) && requestedPageNumber > 0
          ? requestedPageNumber
          : 1;
        const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0
          ? Math.min(requestedPageSize, 100)
          : 100;

        const enrichSocietyParam = searchParams.get('enrichSociety') === 'true';
        const result = await ptisSearchService.getPropertySuggestionsPage(
          resolvedWardId,
          propertyNo,
          partitionNo,
          pageNumber,
          pageSize,
          enrichSocietyParam
        );

        if (result.success && result.data && Array.isArray(result.data.items)) {
          const filtered = result.data.items.map((item) => ({
            propertyId: item.propertyId,
            propertyNo: item.propertyNo,
            partitionNo: item.partitionNo,
            displayLabel: item.displayLabel,
            category: item.category,
            categoryLabel: item.categoryLabel,
            societyDetailId: item.societyDetailId,
            societyName: item.societyName,
            wings: item.wings,
            wingDetailId: item.wingDetailId,
          }));
          return NextResponse.json({
            success: true,
            data: filtered,
            pagination: {
              pageNumber: result.data.pageNumber,
              pageSize: result.data.pageSize,
              totalCount: result.data.totalCount,
              totalPages: result.data.totalPages ?? 0,
              hasMore: result.data.hasNext === true,
            },
          });
        }

        return NextResponse.json(result);
      }

      const enrichSocietyParam = searchParams.get('enrichSociety') === 'true';
      const parsedMax = maxResults ? parseInt(maxResults, 10) : NaN;
      const resolvedMaxResults = !isNaN(parsedMax) && parsedMax > 0 ? parsedMax : 100;
      const result = await ptisSearchService.getPropertySuggestionsByPropwise(
        resolvedWardId,
        propertyNo,
        partitionNo,
        resolvedMaxResults,
        enrichSocietyParam
      );

      if (result.success && result.data && Array.isArray(result.data)) {
        const filtered = result.data.map((item) => ({
          propertyId: item.propertyId,
          zoneId: item.zoneId,
          zoneNo: item.zoneNo,
          wardId: item.wardId,
          wardNo: item.wardNo,
          propertyNo: item.propertyNo,
          partitionNo: item.partitionNo,
          upicId: item.upicId,
          displayLabel: item.displayLabel,
          category: item.category,
          categoryLabel: item.categoryLabel,
          societyDetailId: item.societyDetailId,
          societyName: item.societyName,
          wings: item.wings,
          wingDetailId: item.wingDetailId,
        }));
        return NextResponse.json({ success: true, data: filtered });
      }

      return NextResponse.json(result);
    }

    return new NextResponse('Not Found', { status: 404 });
  } catch (_error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
