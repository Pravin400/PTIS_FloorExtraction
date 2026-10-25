'use client';

import type { AssetDocumentModalProps } from '@/types/asset-gis.types';
import React, { useState } from 'react';
import { RealDocumentModal, LegacyDocumentModal } from './modal';

export type { AssetDocumentModalProps };

export const AssetDocumentModal: React.FC<AssetDocumentModalProps> = (props) => {
  const [selectedRealDocId, setSelectedRealDocId] = useState<string | number | null>(null);

  if (!props.isOpen) return null;

  const builId = String(props.assetData?.Buil_ID || props.assetData?.buil_id || props.assetData?.MPMS_ID || props.assetData?.mpmsId || props.assetData?.PropertyNo || props.assetData?.propertyNo || 'MPMS');

  const usesRealDocuments = props.documents !== undefined;
  const activeRealDocId = (selectedRealDocId && props.documents?.some((d) => d.id === selectedRealDocId))
    ? selectedRealDocId
    : (props.documents && props.documents.length > 0 ? props.documents[0].id : null);

  if (usesRealDocuments) {
    return (
      <RealDocumentModal
        onClose={props.onClose}
        builId={builId}
        documents={props.documents || []}
        isLoading={!!props.isLoadingDocuments}
        selectedId={activeRealDocId}
        onSelect={setSelectedRealDocId}
      />
    );
  }

  return <LegacyDocumentModal {...props} />;
};
