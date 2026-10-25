'use client';

import { Modal } from '@/components/common/Modal';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { OkButton } from '@/components/common/ActionButtons';
import { useTranslations } from 'next-intl';

export function GuidelinesModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('addTaxes');

  const isOpen = searchParams.get('showGuidelines') === 'true';

  const onClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('showGuidelines');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('guidelines.title')}
      maxWidth="md"
    >
      <div className="flex flex-col gap-6">
        <ul className="list-disc list-inside space-y-3 text-slate-700 text-sm font-medium">
          <li>{t('guidelines.step1')}</li>
          <li>{t('guidelines.step2')}</li>
          <li>{t('guidelines.step3')}</li>
          <li>{t('guidelines.step4')}</li>
        </ul>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <OkButton onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
}
