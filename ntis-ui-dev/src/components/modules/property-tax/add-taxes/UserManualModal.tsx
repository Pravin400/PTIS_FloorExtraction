'use client';

import { Modal } from '@/components/common/Modal';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { OkButton } from '@/components/common/ActionButtons';
import { useTranslations } from 'next-intl';

export function UserManualModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('addTaxes');

  const isOpen = searchParams.get('showUserManual') === 'true';

  const onClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('showUserManual');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('userManual.title')}
      maxWidth="md"
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-3 text-slate-700 text-sm font-medium leading-relaxed">
          <p>{t('userManual.desc1')}</p>
          <p>{t('userManual.desc2')}</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <OkButton onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
}
