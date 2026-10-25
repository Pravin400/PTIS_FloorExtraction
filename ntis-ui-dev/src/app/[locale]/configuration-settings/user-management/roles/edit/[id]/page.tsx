import { getRoleByIdAction, getDepartmentsAction } from '../../../actions';
import { notFound } from 'next/navigation';
import { RoleFormWrapper } from '../../add/RoleFormWrapper';

export const dynamic = 'force-dynamic';

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { id } = await params;

  const [roleRes, deptsRes] = await Promise.all([
    getRoleByIdAction(id),
    getDepartmentsAction(),
  ]);

  if (!roleRes.success || !roleRes.data) {
    return notFound();
  }

  const departments = deptsRes.success && deptsRes.data ? deptsRes.data : [];

  return <RoleFormWrapper initialData={roleRes.data} isEdit={true} departments={departments} />;
}
