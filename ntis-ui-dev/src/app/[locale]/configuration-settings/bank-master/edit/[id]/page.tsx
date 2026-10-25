import React from 'react';
import { notFound } from 'next/navigation';
import { BankForm } from '@/components/modules/configuration-settings/bank';
import { getBankByIdAction } from '../../actions';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const result = await getBankByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <BankForm id={id} initialData={result.data} />;
}
