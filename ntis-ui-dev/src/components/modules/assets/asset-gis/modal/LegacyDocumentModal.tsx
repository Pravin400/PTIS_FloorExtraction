'use client';

import { GisLegacyDocumentModal } from '@/components/common';
import type { GisLegacyDocumentModalProps } from '@/components/common';

export type LegacyDocumentModalProps = GisLegacyDocumentModalProps;

export function LegacyDocumentModal(props: LegacyDocumentModalProps) {
  return <GisLegacyDocumentModal {...props} />;
}
