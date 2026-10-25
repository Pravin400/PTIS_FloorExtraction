/**
 * Add Grievance Category Redirect Component (Server Component)
 * Redirects the old nested sub-route /add to the base master page with query parameters drawer=add.
 */
import type { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { buildMasterUrl, normalizeMasterSearchParams } from '../search-params';

export default async function AddGrievanceCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<ReactElement> {
  const { locale } = await params;
  const sParams = await searchParams;
  const normalizedSearchParams = normalizeMasterSearchParams(sParams);

  const targetUrl = buildMasterUrl(locale, {
    ...normalizedSearchParams,
    drawer: 'add',
  });

  redirect(targetUrl);
}
