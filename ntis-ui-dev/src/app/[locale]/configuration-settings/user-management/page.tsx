import { UserConfiguration } from '@/components/modules/configuration-settings/user-management/UserConfiguration';
import {
  getUsersAction,
  getUserRolesAction,
  getDepartmentsAction,
  getDesignationsAction,
} from './actions';
import { executeConditionalFetches } from '@/lib/utils/fetch-helpers';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';

interface UserManagementPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    size?: string;
    search?: string;
    status?: string;
    role?: string;
    tab?: string;
  }>;
}

type UserManagementTab = 'users' | 'roles';

function getActiveTab(tab?: string): UserManagementTab {
  return tab === 'roles' ? 'roles' : 'users';
}

function getPageNumber(value?: string): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function getPageSize(pageSize?: string, size?: string): number {
  const resolvedSize = Number(pageSize || size);
  return Number.isFinite(resolvedSize) && resolvedSize > 0 ? resolvedSize : 10;
}

function getStatusFilter(status?: string): boolean | undefined {
  if (!status || status === 'all') return undefined;
  return status === 'active';
}

export default async function UserManagementPage({
  searchParams,
}: UserManagementPageProps) {
  const sp = await searchParams;

  const activeTab = getActiveTab(sp?.tab);
  const isUsersTab = activeTab === 'users';
  const isRolesTab = activeTab === 'roles';

  const page = getPageNumber(sp?.page);
  const pageSize = getPageSize(sp?.pageSize, sp?.size);
  const searchTerm = sp?.search?.trim() || undefined;
  const status = getStatusFilter(sp?.status);

  const errorState = {
    fetchError: undefined as string | undefined,
    statusCode: undefined as number | undefined,
  };

  const handleFetchError = (err: { message?: string; statusCode?: number }) => {
    if (!errorState.fetchError && err.message) {
      errorState.fetchError = getCleanErrorMessage(err.message);
    }
    if (!errorState.statusCode && err.statusCode) {
      errorState.statusCode = err.statusCode;
    }
  };

  const fetchData = await executeConditionalFetches({
    users: {
      condition: isUsersTab,
      fetcher: () => getUsersAction(page, pageSize, searchTerm, status),
      fallback: {
        items: [],
        totalCount: 0,
        pageNumber: page,
        pageSize,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      },
      errorMessage: 'errors.apiConnection.fetchUsersFailed',
      onError: handleFetchError,
    },

    roles: {
      condition: isRolesTab,
      fetcher: () => getUserRolesAction(),
      fallback: [],
      errorMessage: 'errors.apiConnection.fetchRolesFailed',
      onError: handleFetchError,
    },

    departments: {
      condition: isRolesTab,
      fetcher: () => getDepartmentsAction(),
      fallback: [],
      errorMessage: 'errors.apiConnection.fetchDepartmentsFailed',
      onError: handleFetchError,
    },

    designations: {
      condition: isRolesTab,
      fetcher: () => getDesignationsAction(),
      fallback: [],
      errorMessage: 'errors.apiConnection.fetchDesignationsFailed',
      onError: handleFetchError,
    },
  });

  return (
    <UserConfiguration
      initialData={{
        users: fetchData.users.items || [],
        totalCount: fetchData.users.totalCount || 0,
        roles: fetchData.roles || [],
        departments: fetchData.departments || [],
        designations: fetchData.designations || [],
      }}
      fetchError={errorState.fetchError}
      statusCode={errorState.statusCode}
    />
  );
}
