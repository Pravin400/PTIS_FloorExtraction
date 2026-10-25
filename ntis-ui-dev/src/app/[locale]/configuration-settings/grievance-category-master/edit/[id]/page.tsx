/**
 * Edit Grievance Category Redirect Component (Server Component)
 * Redirects the old nested sub-route /edit/[id] to the base master page with query parameters drawer=edit&id=id.
 */
import type { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { buildMasterUrl, normalizeMasterSearchParams } from '../../search-params';

interface EditPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditGrievanceCategoryPage({
  params,
  searchParams,
}: EditPageProps): Promise<ReactElement> {
  const { locale, id } = await params;
  const sParams = await searchParams;
  const normalizedSearchParams = normalizeMasterSearchParams(sParams);

  const targetUrl = buildMasterUrl(locale, {
    ...normalizedSearchParams,
    drawer: 'edit',
    id: id,
  });

  redirect(targetUrl);
}
