export const dynamic = 'force-dynamic';
import { ScreenForm } from '@/components/modules/configuration-settings/screenAccess/components/ScreenForm';
import { getScreenGroupsAction, getModulesAction, getDepartmentsAction } from '../../action';
import { getMasterDataPageSize } from '@/lib/api/configuration-settings/screenAccess/screen-access.services';

export default async function AddScreenPage() {
  const [groupsRes, modulesRes, departmentsRes] = await Promise.all([
    getScreenGroupsAction(1, getMasterDataPageSize(), undefined, true),
    getModulesAction(),
    getDepartmentsAction(),
  ]);

  return (
    <ScreenForm
      groups={groupsRes.data?.items || []}
      modules={modulesRes.data || []}
      departments={departmentsRes.data || []}
    />
  );
}
