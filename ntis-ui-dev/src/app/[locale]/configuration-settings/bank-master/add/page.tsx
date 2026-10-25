import React from 'react';
import { BankForm } from '@/components/modules/configuration-settings/bank';

export default async function AddPage(): Promise<React.ReactElement> {
  return <BankForm id={null} initialData={undefined} />;
}
