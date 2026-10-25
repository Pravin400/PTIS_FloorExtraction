import { ModuleMaster } from '@/components/modules/configuration-settings/module-master/ModuleMaster';
import { getModuleMastersAction, getModuleMasterMetadata } from './actions';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_STATS_DATA = {
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
};

const MAX_PAGE_NUMBER = 10000;
const MAX_PAGE_SIZE = 500;
const MAX_SEARCH_TERM_LENGTH = 100;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
  }>;
}

function parsePositiveInteger(value: string | undefined, fallback: number, max: number): number {
  const parsedValue = Number(value);
  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    return Math.min(parsedValue, max);
  }
  return fallback;
}

export default async function ModuleMasterPage({ searchParams }: PageProps) {
  const sParams = await searchParams;
  const pageNumber = parsePositiveInteger(sParams.page, DEFAULT_PAGE_NUMBER, MAX_PAGE_NUMBER);
  const pageSize = parsePositiveInteger(sParams.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const searchTerm = sParams.search?.trim().slice(0, MAX_SEARCH_TERM_LENGTH) || '';
  const t = await getTranslations('moduleMaster');

  let fetchError: string | undefined;
  let statusCode: number | undefined;
  let modulesData = null;
  let statsData = DEFAULT_STATS_DATA;

  try {
    const [modulesRes, metaRes] = await Promise.all([
      getModuleMastersAction(pageNumber, pageSize, searchTerm),
      getModuleMasterMetadata(),
    ]);

    if (!modulesRes.success) {
      fetchError = modulesRes.error
        ? getCleanErrorMessage(modulesRes.error)
        : t('messages.fetchFailed');
      statusCode = modulesRes.statusCode;
    } else {
      modulesData = modulesRes.data;
    }

    if (metaRes.success && metaRes.data) {
      statsData = metaRes.data;
    } else if (!metaRes.success) {
      if (!fetchError) {
        statusCode = metaRes.statusCode;
      }
    }
  } catch (err) {
    fetchError = getCleanErrorMessage(err, t('messages.errorOccurred'));
  }

  return (
    <ModuleMaster
      data={modulesData?.items ?? []}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={modulesData?.totalCount ?? 0}
      totalPages={modulesData?.totalPages ?? 0}
      statsData={statsData}
      fetchError={fetchError}
      statusCode={statusCode}
    />
  );
}
