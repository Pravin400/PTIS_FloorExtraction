"use client";

import { ReactNode } from 'react';
import { Drawer } from '@/components/common';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Calendar } from 'lucide-react';

interface FinancialYearDrawerWrapperProps {
  title: ReactNode;
  children: ReactNode;
  onClose?: () => void;
}

export function FinancialYearDrawerWrapper({ title, children, onClose }: FinancialYearDrawerWrapperProps) {
  const router = useRouter();
  const locale = useLocale();
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push(`/${locale}/configuration-settings/financial-year-master`);
    }
  };

  return (
      <Drawer
        open={true}
        onClose={handleClose}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
            </div>
          </div>
        }
        width="md"
      >
        <div className="p-4">
          {children}
        </div>
      </Drawer>
  );
}
