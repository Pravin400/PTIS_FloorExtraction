import { setRequestLocale } from 'next-intl/server';
import { NAAssetFormProvider } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext';

export const dynamic = 'force-dynamic';

import type { AssetLayoutProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

export default async function Layout({ children, params }: AssetLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <NAAssetFormProvider>
      {children}
    </NAAssetFormProvider>
  );
}
