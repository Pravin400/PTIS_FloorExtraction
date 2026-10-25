import React from 'react';
import { SocialAttributeMaster } from '@/components/modules/property-tax/social-attribute-master';
import { fetchSocialAttributesPagedAction } from './action';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    dataType?: string;
    attributeType?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const searchTerm = params.q?.trim() || undefined;
  const dataType = params.dataType?.trim() || undefined;
  const attributeType = params.attributeType?.trim() || undefined;
  const result = await fetchSocialAttributesPagedAction(1, -1);

  return (
    <SocialAttributeMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      dataTypeFilter={dataType}
      attributeTypeFilter={attributeType}
      currentSearchTerm={searchTerm}
    />
  );
}
