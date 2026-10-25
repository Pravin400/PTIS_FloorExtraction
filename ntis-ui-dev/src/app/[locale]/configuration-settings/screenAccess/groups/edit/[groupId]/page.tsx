export const dynamic = 'force-dynamic';

import { ScreenGroupForm } from '@/components/modules/configuration-settings/screenAccess/components/ScreenGroupForm';
import { notFound } from 'next/navigation';
import { getScreenGroupByIdAction } from '../../../action';

export default async function EditGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const id = parseInt(groupId, 10);

  if (isNaN(id)) return notFound();

  const groupRes = await getScreenGroupByIdAction(id);

  if (!groupRes.success || !groupRes.data) return notFound();

  return <ScreenGroupForm initialData={groupRes.data} isEdit />;
}
