'use client';

import { Button } from '@/components/common';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ReceiptBackButton({ className, locale: _locale }: { className?: string; locale?: string }) {
  const router = useRouter();
  const t = useTranslations('AssetPayment');

  return (
    <Button
      type="button"
      variant="outline"
      icon={ArrowLeft}
      onClick={() => router.back()}
      className={
        className
          ? `!h-auto !py-[6px] !px-3 !text-xs !font-semibold !cursor-pointer !shadow-none [&_svg]:!w-4 [&_svg]:!h-4 ${className}`
          : '!inline-flex !items-center !gap-[6px] !border !border-[#c2c9d6] !bg-white !text-[#1f4e9b] !rounded-[6px] !px-3 !py-[6px] !text-xs !font-semibold !cursor-pointer !no-underline !transition-all !duration-200 hover:!bg-slate-100 hover:!border-[#1f4e9b] !shadow-none [&_svg]:!w-4 [&_svg]:!h-4'
      }
    >
      {t('v2.goBack')}
    </Button>
  );
}
