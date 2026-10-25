import React from 'react';
import { DocumentsSection } from '../asset-detail-view/DocumentsSection';
import type { SubAssetDocumentsSectionProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';

export function SubAssetDocumentsSection({ data }: SubAssetDocumentsSectionProps): React.ReactElement {
  // Map the sub-asset data to match the expected interface of the shared component
  return (
    <DocumentsSection
      data={data as unknown as React.ComponentProps<typeof DocumentsSection>['data']}
    />
  );
}

