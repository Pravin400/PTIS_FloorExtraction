'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common';

export function AssetRegisterBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleBack = () => {
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] || 'en';
    router.push(`/${locale}/assets/municipal-Asset`);
  };

  return (
    <Button
      type="button"
      aria-label="Go back"
      onClick={handleBack}
      variant="secondary"
      size="sm"
      className="!h-8 !w-8 !px-0 !py-0 !rounded-2xl !bg-slate-100 hover:!bg-slate-200 !border-slate-200 text-slate-700"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
