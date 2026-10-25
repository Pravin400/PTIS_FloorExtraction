'use client';

import { Shield, Briefcase } from 'lucide-react';
import { Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import { RoleDesignationStatsProps } from '@/types/user-management';

export function RoleDesignationStats({
  rolesCount,
  totalRoleUsers,
  designationsCount,
  totalDesignationUsers,
  activeTab,
  onAddRole,
  onAddDesignation,
}: RoleDesignationStatsProps) {
  const t = useTranslations('userManagement');

  return (
    <>
      {activeTab === 'roles' ? (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-transparent border border-blue-200 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black">
                {t('stats.totalRoles')}: {rolesCount}
              </h3>
              <p className="text-xs text-slate-700">
                {t('stats.assignedTo')} {t('stats.usersCount', { count: totalRoleUsers })}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onAddRole} className="text-white shadow-lg h-10">
            <Shield className="w-4 h-4 mr-2" />
            {t('roles.addRole')}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/50 to-transparent border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black">
                {t('stats.totalDesignations')}: {designationsCount}
              </h3>
              <p className="text-xs text-slate-700">
                {t('stats.assignedTo')} {t('stats.usersCount', { count: totalDesignationUsers })}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onAddDesignation} className="text-white h-10">
            <Briefcase className="w-4 h-4 mr-2" />
            {t('roles.addDesignation')}
          </Button>
        </div>
      )}
    </>
  );
}
