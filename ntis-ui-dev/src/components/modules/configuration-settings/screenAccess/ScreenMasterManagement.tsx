'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tab, TabList, TabPanel, Tabs } from '@/components/common/Tabs';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  ScreenMasterData,
  ScreenGroupMasterData,
  PaginationData,
} from '@/types/screen-access.types';
import {
  deleteScreenAction,
  deleteScreenGroupAction,
} from '@/app/[locale]/configuration-settings/screenAccess/action.mutations';

import { toast } from 'sonner';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { ManagementStats } from './components/ManagementStats';
import { ScreenTableSection } from './components/ScreenTableSection';
import { GroupTableSection } from './components/GroupTableSection';
import { useScreenAccessSearch } from '@/hooks/configuration-settings/screenAccess/useScreenAccessSearch';
import { useScreenAccessPagination } from '@/hooks/configuration-settings/screenAccess/useScreenAccessPagination';
import { useQueryTransition } from '@/hooks/useQueryTransition';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface ScreenMasterManagementProps {
  subTab?: string;
  initialScreens: ScreenMasterData[];
  allScreens?: ScreenMasterData[];
  initialGroups: ScreenGroupMasterData[];
  screensPagination: PaginationData;
  groupsPagination: PaginationData;
}

export const ScreenMasterManagement: React.FC<ScreenMasterManagementProps> = ({
  subTab = 'screens',
  initialScreens,
  allScreens = [],
  initialGroups,
  screensPagination,
  groupsPagination,
}) => {
  const t = useTranslations('screenAccess');
  const router = useRouter();
  const pathname = usePathname();
  const { confirm } = useConfirm();
  const { searchParams, updateQueries } = useQueryTransition();
  const [isMutationPending, startTransition] = useTransition();

  const screenLabel = useAliasLabel('Screen', t('aliasFallback.screen'));
  const screenGroupLabel = useAliasLabel('Screen_Group', t('aliasFallback.screenGroup'));

  // Search & Pagination for Screens
  const { searchTerm, handleSearch } = useScreenAccessSearch({
    initialSearchTerm: searchParams.get('search') || '',
    searchParamKey: 'search',
    pageParamKey: 'spage',
  });
  const {
    handlePageChange,
    handlePageSizeChange,
    isPending: isPagePending,
  } = useScreenAccessPagination({
    pageParamKey: 'spage',
    pageSizeParamKey: 'ssize',
  });

  // Search & Pagination for Groups
  const { searchTerm: gSearchTerm, handleSearch: handleGSearch } = useScreenAccessSearch({
    initialSearchTerm: searchParams.get('gsearch') || '',
    searchParamKey: 'gsearch',
    pageParamKey: 'gpage',
  });
  const {
    handlePageChange: handleGPageChange,
    handlePageSizeChange: handleGPageSizeChange,
    isPending: isGPagePending,
  } = useScreenAccessPagination({
    pageParamKey: 'gpage',
    pageSizeParamKey: 'gsize',
  });

  const stats = React.useMemo(() => {
    if (allScreens && allScreens.length > 0) {
      const total = allScreens.length;
      const active = allScreens.filter((s) => s.isActive).length;
      return {
        total,
        active,
        inactive: Math.max(0, total - active),
      };
    }

    const total = screensPagination.totalCount || initialScreens.length;
    let active = screensPagination.activeCount || 0;

    if (active === 0 && initialScreens.length > 0) {
      const visibleActive = initialScreens.filter((s) => s.isActive).length;
      if (visibleActive > 0) active = visibleActive;
    }

    return {
      total,
      active,
      inactive: Math.max(0, total - active),
    };
  }, [screensPagination, initialScreens, allScreens]);

  const onTabChange = (value: string | number) => {
    updateQueries({ subTab: String(value) });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ManagementStats
        totalScreens={stats.total}
        totalGroups={groupsPagination.totalCount}
        activeScreens={stats.active}
        inactiveScreens={stats.inactive}
        screenLabel={screenLabel}
        screenGroupLabel={screenGroupLabel}
      />

      <Tabs value={subTab} onChange={onTabChange} className="flex-1 flex flex-col min-h-0">
        <TabList className="mb-4">
          <Tab value="screens">{t('screenManagement.tabs.screens', { screen: screenLabel })}</Tab>
          <Tab value="groups">
            {t('screenManagement.tabs.screenGroups', { screenGroup: screenGroupLabel })}
          </Tab>
        </TabList>

        <TabPanel value="screens" className="flex-1 min-h-0">
          <ScreenTableSection
            screens={initialScreens}
            pagination={screensPagination}
            groups={initialGroups}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onAdd={() => router.push(`${pathname}/screens/add`)}
            onEdit={(item) => router.push(`${pathname}/screens/edit/${item.screenMasterId}`)}
            onDelete={async (id) => {
              confirm({
                variant: 'delete',
                onConfirm: async () => {
                  try {
                    const res = await deleteScreenAction(id);
                    if (res.success) {
                      toast.success(
                        t('screenManagement.screens.messages.deleteSuccess', {
                          screen: screenLabel,
                        })
                      );
                      await new Promise<void>((resolve) => {
                        startTransition(() => {
                          router.refresh();
                          resolve();
                        });
                      });
                    } else {
                      let errorMsg =
                        res.message ||
                        t('screenManagement.screens.messages.deleteError', { screen: screenLabel });
                      if (res.message) {
                        if (
                          res.message.startsWith('messages.') ||
                          res.message.startsWith('errors.') ||
                          res.message.startsWith('screenManagement.')
                        ) {
                          errorMsg = t(res.message, { screen: screenLabel });
                        } else {
                          errorMsg = getCleanErrorMessage(res.message);
                        }
                      }
                      toast.error(errorMsg);
                    }
                  } catch (error) {
                    toast.error(
                      getCleanErrorMessage(
                        error,
                        t('screenManagement.screens.messages.deleteError', { screen: screenLabel })
                      )
                    );
                  }
                },
              });
            }}
            filterGroup={searchParams.get('sgroup') || 'all'}
            onFilterGroupChange={(v) =>
              updateQueries({ sgroup: String(v) }, { resetPage: true, pageParamKey: 'spage' })
            }
            filterStatus={searchParams.get('status') || 'all'}
            onFilterStatusChange={(v) =>
              updateQueries({ status: String(v) }, { resetPage: true, pageParamKey: 'spage' })
            }
            isPending={isPagePending || isMutationPending}
          />
        </TabPanel>

        <TabPanel value="groups" className="flex-1 min-h-0">
          <GroupTableSection
            groups={initialGroups}
            pagination={groupsPagination}
            searchTerm={gSearchTerm}
            onSearch={handleGSearch}
            onPageChange={handleGPageChange}
            onPageSizeChange={handleGPageSizeChange}
            onAdd={() => router.push(`${pathname}/groups/add`)}
            onEdit={(item) => router.push(`${pathname}/groups/edit/${item.screenGroupId}`)}
            onDelete={async (id) => {
              confirm({
                variant: 'delete',
                onConfirm: async () => {
                  try {
                    const res = await deleteScreenGroupAction(id);
                    if (res.success) {
                      toast.success(
                        t('screenManagement.groups.messages.deleteSuccess', {
                          screenGroup: screenGroupLabel,
                        })
                      );
                      await new Promise<void>((resolve) => {
                        startTransition(() => {
                          router.refresh();
                          resolve();
                        });
                      });
                    } else {
                      let errorMsg =
                        res.message ||
                        t('screenManagement.groups.messages.deleteError', {
                          screenGroup: screenGroupLabel,
                        });
                      if (res.message) {
                        if (
                          res.message.startsWith('messages.') ||
                          res.message.startsWith('errors.') ||
                          res.message.startsWith('screenManagement.')
                        ) {
                          errorMsg = t(res.message, { screenGroup: screenGroupLabel });
                        } else {
                          errorMsg = getCleanErrorMessage(res.message);
                        }
                      }
                      toast.error(errorMsg);
                    }
                  } catch (error) {
                    toast.error(
                      getCleanErrorMessage(
                        error,
                        t('screenManagement.groups.messages.deleteError', {
                          screenGroup: screenGroupLabel,
                        })
                      )
                    );
                  }
                },
              });
            }}
            filterStatus={searchParams.get('gstatus') || 'all'}
            onFilterStatusChange={(v) =>
              updateQueries({ gstatus: String(v) }, { resetPage: true, pageParamKey: 'gpage' })
            }
            isPending={isGPagePending || isMutationPending}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
