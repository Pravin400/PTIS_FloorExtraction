'use client';

import { Monitor, Shield, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/common/Card';
import { Tabs, TabList, Tab, TabPanel } from '@/components/common/Tabs';
import TableHeader from '@/components/common/TableHeader';
import { ScreenMasterManagement } from './ScreenMasterManagement';
import { RolePermissionManager } from './RolePermissionManager';
import { PageContainer } from '@/components/common/PageContainer';
import { useQueryTransition } from '@/hooks/useQueryTransition';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import type {
  ScreenMasterData,
  ScreenGroupMasterData,
  DepartmentMasterData,
  ModuleMasterData,
  RoleMasterData,
  PaginationData,
  ScreenAccessPermissionData,
} from '@/types/screen-access.types';

interface ScreenAccessLayoutProps {
  tab: string;
  subTab: string;
  screens: ScreenMasterData[];
  allScreens: ScreenMasterData[];
  groups: ScreenGroupMasterData[];
  departments: DepartmentMasterData[];
  modules: ModuleMasterData[];
  roles: RoleMasterData[];
  initialRoleAccess: ScreenAccessPermissionData[];
  dataRoleId?: number;
  screensPagination: PaginationData;
  groupsPagination: PaginationData;
  fetchError?: string;
  statusCode?: number;
}

export function ScreenAccessLayout({
  tab,
  subTab,
  screens,
  allScreens,
  groups,
  departments,
  modules,
  roles,
  initialRoleAccess,
  dataRoleId,
  screensPagination,
  groupsPagination,
  fetchError,
  statusCode,
}: ScreenAccessLayoutProps) {
  const t = useTranslations('screenAccess');
  const tCommon = useTranslations('common');
  const { updateQueries } = useQueryTransition();

  const screenLabel = useAliasLabel('Screen', t('aliasFallback.screen'));
  const screenGroupLabel = useAliasLabel('Screen_Group', t('aliasFallback.screenGroup'));
  const accessControlLabel = useAliasLabel('Access_Control', t('aliasFallback.accessControl'));
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));

  const headerTitle = t('title', { screen: screenLabel, accessControl: accessControlLabel });
  const headerSubtitle = t('subtitle', {
    screen: screenLabel,
    screenGroup: screenGroupLabel,
    role: roleLabel,
  });

  const isUnauthorized =
    statusCode === 401 ||
    (fetchError &&
      (fetchError.toLowerCase().includes('unauthorized') ||
        fetchError.toLowerCase().includes('token') ||
        fetchError === 'messages.unauthorizedToken'));

  const handleTabChange = (value: string | number) => {
    const val = String(value);
    const updates: Record<string, string | null> = {
      tab: val,
      subTab: val === 'screen-management' ? 'screens' : null,
      action: null,
      id: null,
      roleId: null,
    };

    updateQueries(updates);
  };

  if (isUnauthorized) {
    const messageKey = 'errors.unauthorized';

    return (
      <PageContainer className="flex flex-col min-h-screen">
        <TableHeader title={headerTitle} subtitle={headerSubtitle} icon={Monitor} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200/80 shadow-sm mt-4 animate-in fade-in duration-300">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
          <h3 className="text-lg font-semibold text-gray-900">{tCommon(messageKey)}</h3>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col min-h-screen">
      <TableHeader title={headerTitle} subtitle={headerSubtitle} icon={Monitor} />

      {fetchError && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">
              {tCommon('messages.fetchError') || 'Error fetching data'}
            </h3>
            <p className="text-xs text-red-700 mt-1 font-mono">{fetchError}</p>
          </div>
        </div>
      )}

      <Card className="flex-1 flex flex-col bg-white shadow-2xl mt-4 relative overflow-hidden">
        <Tabs
          value={tab}
          onChange={handleTabChange}
          className="flex-1 flex flex-col"
          justify="center"
          fullWidth
        >
          {/* Tab Headers */}
          <div className="border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <TabList className="w-full bg-transparent p-0 gap-2 overflow-hidden flex justify-center">
              <Tab
                value="screen-management"
                className="gap-2 data-[state=active]:bg-white flex flex-col justify-center items-center py-4"
              >
                <Monitor className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm">
                  {t('tabs.screenManagement', { screen: screenLabel })}
                </span>
              </Tab>
              <Tab
                value="access-control"
                className="gap-2 px-6 data-[state=active]:bg-white flex flex-col justify-center items-center py-4"
              >
                <Shield className="w-4 h-4 text-violet-600" />
                <span className="font-semibold text-sm">
                  {t('tabs.accessControl', { accessControl: accessControlLabel })}
                </span>
              </Tab>
            </TabList>
          </div>

          {/* Screen Management Tab */}
          <TabPanel value="screen-management" className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScreenMasterManagement
              subTab={subTab}
              initialScreens={screens}
              allScreens={allScreens}
              initialGroups={groups}
              screensPagination={screensPagination}
              groupsPagination={groupsPagination}
            />
          </TabPanel>

          {/* Access Control Tab */}
          <TabPanel value="access-control" className="flex-1 flex flex-col p-0 overflow-hidden">
            <RolePermissionManager
              key={dataRoleId}
              screens={allScreens}
              departments={departments}
              modules={modules}
              roles={roles}
              initialRoleAccess={initialRoleAccess}
              groups={groups}
            />
          </TabPanel>
        </Tabs>
      </Card>
    </PageContainer>
  );
}
