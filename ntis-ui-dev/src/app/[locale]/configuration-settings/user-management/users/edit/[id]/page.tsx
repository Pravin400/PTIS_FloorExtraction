import {
  getUserByIdAction,
  getUserRolesAction,
  getDepartmentsAction,
  getModulesAction,
} from '../../../actions';
import { notFound } from 'next/navigation';
import { UserFormWrapper } from '../../add/UserFormWrapper';

export const dynamic = 'force-dynamic';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;

  const [userRes, rolesRes, deptsRes, modulesRes] = await Promise.all([
    getUserByIdAction(id),
    getUserRolesAction(),
    getDepartmentsAction(),
    getModulesAction(),
  ]);

  if (!userRes.success || !userRes.data) {
    return notFound();
  }

  return (
    <UserFormWrapper
      initialData={userRes.data}
      isEdit={true}
      roles={rolesRes.data || []}
      departments={deptsRes.data || []}
      modules={modulesRes.data || []}
    />
  );
}
