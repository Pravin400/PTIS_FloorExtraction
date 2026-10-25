import { BankMaster } from '@/components/modules/configuration-settings/bank/BankMaster';
import { getBanksAction, getBankMasterMetadata } from './actions';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_STATS_DATA: { activeCount: number; uniqueStates: string[] } = {
  activeCount: 0,
  uniqueStates: [],
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

export default async function BankMasterPage({ searchParams }: PageProps) {
  const sParams = await searchParams;
  const pageNumber = parsePositiveInteger(sParams.page, DEFAULT_PAGE_NUMBER, MAX_PAGE_NUMBER);
  const pageSize = parsePositiveInteger(sParams.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const searchTerm = sParams.search?.trim().slice(0, MAX_SEARCH_TERM_LENGTH) || '';

  let errorMessage: string | undefined;
  let statusCode: number | undefined;
  let banksData;
  let statsData = DEFAULT_STATS_DATA;

  try {
    const [banksRes, metaRes] = await Promise.all([
      getBanksAction(pageNumber, pageSize, searchTerm, 'all'),
      getBankMasterMetadata(),
    ]);

    if (!banksRes.success) {
      errorMessage = banksRes.error
        ? getCleanErrorMessage(banksRes.error)
        : 'Failed to fetch bank data.';
      statusCode = banksRes.statusCode;
    } else {
      banksData = banksRes.data;
    }

    if (metaRes.success && metaRes.data) {
      statsData = metaRes.data;
    } else if (!metaRes.success) {
      if (!errorMessage) {
        statusCode = metaRes.statusCode;
      }
    }
  } catch (err) {
    errorMessage = getCleanErrorMessage(
      err,
      'An unexpected error occurred while loading bank data.'
    );
  }

  return (
    <BankMaster
      data={banksData?.items ?? []}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={banksData?.totalCount ?? 0}
      totalPages={banksData?.totalPages ?? 0}
      statsData={statsData}
      errorMessage={errorMessage}
      statusCode={statusCode}
    />
  );
}
