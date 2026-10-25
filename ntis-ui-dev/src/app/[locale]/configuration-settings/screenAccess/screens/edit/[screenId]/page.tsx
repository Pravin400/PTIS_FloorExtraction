export const dynamic = 'force-dynamic';

import { ScreenForm } from '@/components/modules/configuration-settings/screenAccess/components/ScreenForm';
import {
  getScreenByIdAction,
  getScreenGroupsAction,
  getModulesAction,
  getDepartmentsAction,
} from '../../../action';
import { getMasterDataPageSize } from '@/lib/api/configuration-settings/screenAccess/screen-access.services';

export default async function EditScreenPage({ params }: { params: { screenId: string } }) {
  const { screenId } = await params;
  const id = parseInt(screenId, 10);

  if (isNaN(id)) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <h2 className="text-lg font-semibold mb-2">Invalid Screen ID</h2>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <p>The provided screen ID is not valid.</p>
      </div>
    );
  }

  // Fetch in parallel for better performance
  const [screenRes, groupsRes, modulesRes, departmentsRes] = await Promise.all([
    getScreenByIdAction(id),
    getScreenGroupsAction(1, getMasterDataPageSize(), undefined, true),
    getModulesAction(),
    getDepartmentsAction(),
  ]);

  if (!screenRes.success || !screenRes.data) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <h2 className="text-lg font-semibold mb-2">Error Loading Screen</h2>
        <p>{screenRes.message || 'Failed to load screen details. It may have been deleted.'}</p>
      </div>
    );
  }

  const screenData = { ...screenRes.data, screenMasterId: id };

  return (
    <ScreenForm
      initialData={screenData}
      isEdit
      groups={groupsRes.data?.items || []}
      modules={modulesRes.data || []}
      departments={departmentsRes.data || []}
    />
  );
}
