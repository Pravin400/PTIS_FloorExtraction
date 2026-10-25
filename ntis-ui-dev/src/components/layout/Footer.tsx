'use client';

import type { UlbMaster } from '@/types/master.types';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/common';
import { sanitizeInput } from '@/lib/utils/security';
import { getCookieValue } from '@/lib/utils/cookie';

interface FooterProps {
  ulbData?: UlbMaster;
}

/**
 * Footer (Client Component). Council name prefers `ulb_name` cookie, then `ulbData` prop.
 */
export function Footer({ ulbData }: FooterProps) {
  const t = useTranslations('common');
  const pathname = usePathname() || '';
  const nameFromCookie = typeof window !== 'undefined' ? getCookieValue('ulb_name') : undefined;

  const currentYear = new Date().getFullYear();
  const sanitizedCookieName = nameFromCookie ? sanitizeInput(nameFromCookie) : '';
  const sanitizedUlbName = ulbData?.ulbName ? sanitizeInput(ulbData.ulbName) : '';
  const ulbDisplayName =
    sanitizedCookieName || sanitizedUlbName || t('app.defaultUlbName');

  const isAssets = pathname.includes('/assets');
  const isDarkTheme = isAssets || pathname.includes('/property-tax/ptis');

  return (
    <footer className="relative z-30 mt-auto print:hidden transition-all duration-300">
      <div className="h-0.5 w-full bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 opacity-80" />

      <div className={`w-full text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors duration-300 ${
        isAssets
          ? 'bg-gradient-to-r from-[#000428] to-[#004e92]'
          : isDarkTheme
            ? 'bg-[#0B132B] border-t border-slate-800'
            : 'bg-[#4b70a6]'
      }`}>
        <Card
          padding="none"
          variant="default"
          className="mx-auto w-full max-w-full rounded-none border-0 !bg-transparent px-4 py-3 text-inherit shadow-none sm:px-6 lg:px-8"
        >
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 md:gap-2 sm:text-left">
              {ulbDisplayName ? (
                <span className="text-blue-50/80 font-medium">{ulbDisplayName}</span>
              ) : null}
              {ulbDisplayName ? (
                <span className="hidden text-white/30 sm:inline-block" aria-hidden>
                  |
                </span>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-1 font-medium text-blue-50/80 sm:justify-start">
                <span>{t('app.departmentName')}</span>
                <span className="mx-1 hidden sm:inline">•</span>
                <span>
                  © {currentYear} {t('footer.copyright')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </footer>
  );
}
