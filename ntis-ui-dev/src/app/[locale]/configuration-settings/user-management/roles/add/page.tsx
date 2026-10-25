import { getDepartmentsAction } from '../../actions';
import { RoleFormWrapper } from './RoleFormWrapper';
export const dynamic = 'force-dynamic';

export default async function AddRolePage() {
  const deptsRes = await getDepartmentsAction();
  const departments = deptsRes.success && deptsRes.data ? deptsRes.data : [];
  return <RoleFormWrapper departments={departments} />;
}
