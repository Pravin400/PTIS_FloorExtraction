'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Settings, Users, Shield, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageContainer, TableHeader, Tabs, TabList, Tab, TabPanel } from '@/components/common';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { UserConfigurationClientProps } from '@/types/user-management';

export function UserConfigurationClient({
  userManagement,
  roleDesignationMaster,
  translations,
  fetchError,
}: UserConfigurationClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('userManagement');
  const tCommon = useTranslations('common');

  const userLabel = useAliasLabel('User', t('aliasFallback.user'));
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));
  const designationLabel = useAliasLabel('Designation', t('aliasFallback.designation'));

  const title = translations?.title || t('config.title', { user: userLabel });
  const subtitle =
    translations?.subtitle || t('config.subtitle', { user: userLabel, role: roleLabel });
  const usersTab = translations?.usersTab || t('config.usersTab', { user: userLabel });
  const rolesTab =
    translations?.rolesTab ||
    t('config.rolesTab', { role: roleLabel, designation: designationLabel });

  const activeTab = searchParams.get('tab') || 'users';

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', val);

    if (val === 'roles') {
      params.set('subtab', searchParams.get('subtab') || 'roles');
    } else {
      // Clean up subtab when going back to users
      params.delete('subtab');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <PageContainer>
      <div className="space-y-3 overflow-x-hidden">
        <TableHeader icon={Settings} title={title} subtitle={subtitle} />

        {fetchError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold">
                {tCommon('messages.fetchError') || 'Error fetching data'}
              </p>
              <p className="text-xs text-red-700 mt-1 font-mono">{fetchError}</p>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onChange={(val) => handleTabChange(val as string)}
          className="w-full"
        >
          <TabList className="grid w-full grid-cols-2 max-w-[1000px] overflow-hidden">
            <Tab value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {usersTab}
            </Tab>
            <Tab value="roles" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {rolesTab}
            </Tab>
          </TabList>

          <TabPanel value="users" className="mt-0">
            {userManagement}
          </TabPanel>

          <TabPanel value="roles" className="mt-0">
            {roleDesignationMaster}
          </TabPanel>
        </Tabs>
      </div>
    </PageContainer>
  );
}
