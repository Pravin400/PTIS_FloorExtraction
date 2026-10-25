import { getDesignationByIdAction } from '../../../actions';
import { notFound } from 'next/navigation';
import { DesignationFormWrapper } from '../../add/DesignationFormWrapper';

export const dynamic = 'force-dynamic';

interface EditDesignationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDesignationPage({ params }: EditDesignationPageProps) {
  const { id } = await params;

  const designationRes = await getDesignationByIdAction(id);

  if (!designationRes.success || !designationRes.data) {
    return notFound();
  }

  return <DesignationFormWrapper initialData={designationRes.data} isEdit={true} />;
}
