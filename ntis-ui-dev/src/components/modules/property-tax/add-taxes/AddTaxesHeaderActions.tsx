'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/ActionButton';
import { FileText, BookOpen } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/** The header's right-side "Guidelines"/"User Manual" buttons — moved out of AddTaxesConsole.tsx
 *  verbatim (pure relocation, no logic change) since it shares no state with the console. */
export function AddTaxesActions() {
  const t = useTranslations('addTaxes');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openModal = (param: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, 'true');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size='sm' icon={FileText} onClick={() => openModal('showGuidelines')}>
        {t('buttons.guidelines')}
      </Button>
      <Button variant="secondary" size='sm' icon={BookOpen} onClick={() => openModal('showUserManual')}>
        {t('buttons.userManual')}
      </Button>
    </div>
  );
}

export default AddTaxesActions;
