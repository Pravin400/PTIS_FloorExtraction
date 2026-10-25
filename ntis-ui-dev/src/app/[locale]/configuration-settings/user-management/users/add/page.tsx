import { getUserRolesAction, getDepartmentsAction, getModulesAction } from '../../actions';
import { UserFormWrapper } from './UserFormWrapper';

export const dynamic = 'force-dynamic';

export default async function AddUserPage() {
  const [rolesRes, deptsRes, modulesRes] = await Promise.all([
    getUserRolesAction(),
    getDepartmentsAction(),
    getModulesAction(),
  ]);

  return (
    <UserFormWrapper
      roles={rolesRes.data || []}
      departments={deptsRes.data || []}
      modules={modulesRes.data || []}
    />
  );
}
