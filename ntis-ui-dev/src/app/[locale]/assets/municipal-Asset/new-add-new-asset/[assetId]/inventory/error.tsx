'use client';

import ErrorPage from '@/components/common/ErrorPage';

import type { AssetStepErrorProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

export default function InventoryStepError({ error, reset }: AssetStepErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="common.error"
    />
  );
}
