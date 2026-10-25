import { ScreenAccessLayout } from '@/components/modules/configuration-settings/screenAccess/ScreenAccessLayout';
import {
  getScreensAction,
  getAllScreensAction,
  getScreenGroupsAction,
  getDepartmentsAction,
  getRolesAction,
  getModulesAction,
  getScreenAccessWithAllScreensAction,
} from './action';
import { mapPagination } from './page.utils';
import { executeConditionalFetches } from '@/lib/utils/fetch-helpers';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import type { ScreenAccessPermissionData } from '@/types/screen-access.types';

export const dynamic = 'force-dynamic';

interface ScreenAccessPageProps {
  searchParams: Promise<{
    spage?: string;
    ssize?: string;
    search?: string;
    status?: string;
    gpage?: string;
    gsize?: string;
    gsearch?: string;
    gstatus?: string;
    tab?: string;
    subTab?: string;
    roleId?: string;
    deptId?: string;
    sgroup?: string;
  }>;
}

export default async function ScreenAccessPage({ searchParams }: ScreenAccessPageProps) {
  const sp = await searchParams;

  // Search/Filters/Pagination Params
  const spage = Number(sp?.spage) || 1;
  const ssize = Number(sp?.ssize) || 10;
  const gpage = Number(sp?.gpage) || 1;
  const gsize = Number(sp?.gsize) || 10;

  const tab = sp?.tab || 'screen-management';
  const subTab = sp?.subTab || 'screens';

  const parsedGroup = sp?.sgroup && sp.sgroup !== 'all' ? parseInt(sp.sgroup, 10) : undefined;
  const groupFilter = !Number.isNaN(parsedGroup) ? parsedGroup : undefined;

  const parsedDeptId = sp?.deptId ? parseInt(sp.deptId, 10) : undefined;
  const deptIdFromUrl = !Number.isNaN(parsedDeptId) ? parsedDeptId : undefined;

  const parsedRoleId = sp?.roleId ? parseInt(sp.roleId, 10) : undefined;
  const roleIdFromUrl = !Number.isNaN(parsedRoleId) ? parsedRoleId : undefined;

  const isAccessControl = tab === 'access-control';
  const isScreens = tab === 'screen-management' && subTab === 'screens';
  const isGroups = tab === 'screen-management' && subTab === 'groups';

  const defaultPaginatedFallback = (size: number) => ({
    items: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: size,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  });

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
    screens: {
      condition: isScreens,
      fetcher: () =>
        getScreensAction(
          spage,
          ssize,
          sp?.search,
          sp?.status && sp?.status !== 'all' ? sp?.status === 'active' : undefined,
          groupFilter
        ),
      fallback: defaultPaginatedFallback(ssize),
      errorMessage: 'errors.apiConnection.fetchScreensFailed',
      onError: handleFetchError,
    },
    allScreens: {
      condition: true,
      fetcher: () => getAllScreensAction(),
      fallback: [],
      errorMessage: 'errors.apiConnection.fetchScreensFailed',
      onError: handleFetchError,
    },
    groups: {
      condition: true,
      fetcher: () =>
        getScreenGroupsAction(
          isGroups ? gpage : 1,
          isGroups ? gsize : 1000,
          isGroups ? sp?.gsearch : undefined,
          sp?.gstatus && sp?.gstatus !== 'all' ? sp?.gstatus === 'active' : undefined
        ),
      fallback: defaultPaginatedFallback(gsize),
      errorMessage: 'errors.apiConnection.fetchScreensFailed',
      onError: handleFetchError,
    },
    depts: {
      condition: isAccessControl,
      fetcher: () => getDepartmentsAction(),
      fallback: [],
      errorMessage: 'errors.apiConnection.fetchDepartmentsFailed',
      onError: handleFetchError,
    },
    roles: {
      condition: isAccessControl,
      fetcher: () => getRolesAction(),
      fallback: [],
      errorMessage: 'errors.apiConnection.fetchScreensFailed',
      onError: handleFetchError,
    },
    modules: {
      condition: isAccessControl,
      fetcher: () => getModulesAction(),
      fallback: [],
      errorMessage: 'errors.apiConnection.fetchModulesFailed',
      onError: handleFetchError,
    },
  });

  const roles = fetchData.roles;
  const screens = fetchData.screens.items;
  const allScreens = fetchData.allScreens;
  const groups = fetchData.groups.items;
  const departments = fetchData.depts;
  const modules = fetchData.modules;

  let initialRoleAccess: ScreenAccessPermissionData[] = [];
  let dataRoleId: number | undefined = undefined;

  if (isAccessControl && roles.length > 0) {
    const activeDepartments = departments.filter(
      (d) => (d as { isActive?: boolean }).isActive !== false
    );
    const selectedDeptId =
      deptIdFromUrl &&
      activeDepartments.some(
        (d) => (d.departmentMasterId ?? d.departmentId) === deptIdFromUrl
      )
        ? deptIdFromUrl
        : (activeDepartments[0]?.departmentMasterId ?? activeDepartments[0]?.departmentId);

    const filteredRoles = selectedDeptId
      ? roles.filter((r) => r.departmentId === selectedDeptId && r.isActive !== false)
      : roles.filter((r) => r.isActive !== false);

    const defaultRoleId =
      filteredRoles.length > 0
        ? filteredRoles[0].roleMasterId
        : (roles.find((r) => r.isActive !== false)?.roleMasterId ?? roles[0].roleMasterId);

    dataRoleId =
      roleIdFromUrl && roles.some((r) => r.roleMasterId === roleIdFromUrl)
        ? roleIdFromUrl
        : defaultRoleId;

    if (dataRoleId) {
      const screenAccessRes = await getScreenAccessWithAllScreensAction(dataRoleId, allScreens);
      if (!screenAccessRes.success) {
        errorState.fetchError = screenAccessRes.message
          ? getCleanErrorMessage(screenAccessRes.message)
          : 'messages.errorOccurred';
        errorState.statusCode = screenAccessRes.statusCode;
      } else {
        initialRoleAccess = screenAccessRes.data || [];
      }
    }
  }

  return (
    <ScreenAccessLayout
      tab={tab}
      subTab={subTab}
      screens={screens}
      allScreens={allScreens}
      groups={groups}
      departments={departments}
      modules={modules}
      roles={roles}
      initialRoleAccess={initialRoleAccess}
      dataRoleId={dataRoleId}
      screensPagination={mapPagination(fetchData.screens, ssize)}
      groupsPagination={mapPagination(fetchData.groups, gsize)}
      fetchError={errorState.fetchError}
      statusCode={errorState.statusCode}
    />
  );
}
