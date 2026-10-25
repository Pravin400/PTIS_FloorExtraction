'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { deleteBankAction } from '@/app/[locale]/configuration-settings/bank-master/actions';
import type { BankMasterData } from '@/types/bank-master.types';

interface UseBankDeleteProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  startTransition: React.TransitionStartFunction;
  bankLabel?: string;
}

export function useBankDelete({ t, startTransition, bankLabel }: UseBankDeleteProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(
    (row: BankMasterData) => {
      confirm({
        variant: 'delete',
        title: t('confirm.deleteTitle', { bank: bankLabel ?? '', bankName: row.bankName ?? '' }),
        description: t('confirm.deleteDescription', { bank: bankLabel ?? '' }),
        onConfirm: async () => {
          setIsDeleting(true);

          try {
            const response = await deleteBankAction(row.id);

            if (response.success) {
              toast.success(t('messages.deleteSuccess', { bank: bankLabel ?? '' }));

              startTransition(() => {
                router.refresh();
              });

              return;
            }

            let errorMsg = response.error;
            if (errorMsg) {
              if (errorMsg.startsWith('validation.') || errorMsg.startsWith('messages.')) {
                errorMsg = t(errorMsg, { bank: bankLabel ?? '' });
              } else {
                errorMsg = getCleanErrorMessage(errorMsg);
              }
            } else {
              errorMsg = t('messages.deleteFailed', { bank: bankLabel ?? '' });
            }
            toast.error(errorMsg);
          } catch (error) {
            toast.error(
              getCleanErrorMessage(error, t('messages.deleteFailed', { bank: bankLabel ?? '' }))
            );
          } finally {
            setIsDeleting(false);
          }
        },
      });
    },
    [confirm, router, startTransition, t, bankLabel]
  );

  return { handleDelete, isDeleting };
}
