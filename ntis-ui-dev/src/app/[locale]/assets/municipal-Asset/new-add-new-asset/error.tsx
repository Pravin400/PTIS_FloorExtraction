'use client';

import ErrorPage from '@/components/common/ErrorPage';

import type { NewAddNewAssetErrorProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

export default function NewAddNewAssetError({ error, reset }: NewAddNewAssetErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="common.error"
    />
  );
}
