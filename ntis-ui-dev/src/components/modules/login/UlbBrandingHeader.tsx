import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

import type { UlbMaster } from '@/types/master.types';
import { LoginFormCouncilLogo } from './LoginFormCouncilLogo';

/**
 * Council logo + name block shared by every anonymous auth screen (login, forgot-password,
 * verify-otp, reset). Extracted from `LoginForm.tsx` so the branding is consistent across the
 * whole flow instead of only appearing on the credentials page.
 *
 * `compact` shrinks the block for sub-pages that also need room for a feature icon/heading below
 * it (forgot-password, verify-otp, reset) — the login page keeps the original, larger sizing.
 */
export function UlbBrandingHeader({
  ulbData,
  compact = false,
}: {
  ulbData?: UlbMaster;
  compact?: boolean;
}) {
  const ulb = ulbData as (UlbMaster & { logoUrl?: string }) | undefined;
  const logoSrc = (ulb?.logoUrl || ulb?.ulbLogo || '').trim();
  const title = (ulbData?.ulbName ?? '').trim();
  const subTitle = (ulbData?.ulbNameLocal ?? '').trim();

  return (
    <>
      <div
        className={cn(
          'relative drop-shadow-lg transition-transform duration-300 hover:scale-105',
          compact ? 'mb-3' : 'mb-4 sm:mb-6'
        )}
      >
        <div
          className={cn(
            'relative flex items-center justify-center',
            compact ? 'h-16 w-14' : 'h-24 w-20 sm:h-28 sm:w-24'
          )}
        >
          {logoSrc ? (
            <LoginFormCouncilLogo key={logoSrc} logoSrc={logoSrc} title={title} />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center rounded-xl border border-cyan-200/60 bg-cyan-50/80 text-cyan-600"
              aria-hidden
            >
              <Landmark className={compact ? 'h-9 w-9 opacity-90' : 'h-14 w-14 opacity-90'} strokeWidth={1.25} />
            </div>
          )}
        </div>
      </div>

      {title ? (
        <h1 className={cn('font-bold tracking-tight text-gray-900', compact ? 'text-lg' : 'text-2xl')}>
          {title}
        </h1>
      ) : null}
      {subTitle ? (
        <h2 className={cn('font-medium text-gray-600', compact ? 'text-sm' : 'text-lg')}>{subTitle}</h2>
      ) : null}

      <div className={cn('flex w-full items-center justify-center gap-2', compact ? 'py-2' : 'py-4')}>
        <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
        <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>
    </>
  );
}
