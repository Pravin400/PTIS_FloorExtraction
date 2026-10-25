'use client';

import { GisRealDocumentModal } from '@/components/common';
import type { GisRealDocumentModalProps } from '@/components/common';

export type RealDocumentModalProps = GisRealDocumentModalProps;

export function RealDocumentModal(props: RealDocumentModalProps) {
  return <GisRealDocumentModal {...props} />;
}

