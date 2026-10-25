'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { deleteModuleMasterAction } from '@/app/[locale]/configuration-settings/module-master/actions';
import type { ModuleMaster } from '@/types/moduleMaster.types';

interface UseModuleDeleteProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  startTransition: React.TransitionStartFunction;
  moduleLabel?: string;
}

export function useModuleDelete({ t, startTransition, moduleLabel }: UseModuleDeleteProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(
    (row: ModuleMaster) => {
      confirm({
        variant: 'delete',
        title: t('confirm.deleteTitle', {
          module: moduleLabel ?? '',
          moduleName: row.moduleName ?? '',
        }),
        description: t('confirm.deleteDescription', { module: moduleLabel ?? '' }),
        onConfirm: async () => {
          setIsDeleting(true);

          try {
            const response = await deleteModuleMasterAction(row.moduleId);

            if (response.success) {
              toast.success(t('messages.deleteSuccess', { module: moduleLabel ?? '' }));

              startTransition(() => {
                router.refresh();
              });

              return;
            }

            let errorMsg = response.error;
            if (errorMsg) {
              if (errorMsg.startsWith('validation.') || errorMsg.startsWith('messages.')) {
                errorMsg = t(errorMsg, { module: moduleLabel ?? '' });
              } else {
                errorMsg = getCleanErrorMessage(errorMsg);
              }
            } else {
              errorMsg = t('messages.deleteFailed', { module: moduleLabel ?? '' });
            }
            toast.error(errorMsg);
          } catch (error) {
            toast.error(
              getCleanErrorMessage(error, t('messages.deleteFailed', { module: moduleLabel ?? '' }))
            );
          } finally {
            setIsDeleting(false);
          }
        },
      });
    },
    [confirm, router, startTransition, t, moduleLabel]
  );

  return { handleDelete, isDeleting };
}
