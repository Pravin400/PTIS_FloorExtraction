'use client';

/**
 * Enterprise Admin Route Guard for Grievance Administration Pages
 * Restricts /department-master and /complaints strictly to authenticated municipal officers.
 * Path: src/components/modules/grievance/admin/AdminRouteGuard.tsx
 */

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ShieldAlert, LogIn, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/grievance/shared';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();
  const auth = useAuth();

  const isAdmin = Boolean(
    auth.isAuthenticated &&
    (auth.user?.role === 'ADMIN' || auth.user?.role === 'STAFF' || auth.user?.role === 'ENGINEER')
  );

  if (auth.isLoading) {
    return (
      <div className="flex-1 w-full min-h-[calc(100vh-6rem)] flex items-center justify-center p-6 bg-slate-50/60">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50/60">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />

        {/* Shield Icon Core */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
            <Lock className="w-3.5 h-3.5 text-blue-700" />
          </div>
        </div>

        {/* Header copy */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full inline-block">
            {t('adminRoleBadge')}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t('adminOnlyAccessTitle')}
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            {t('adminOnlyAccessDesc')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            href={`/${locale}/login`}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer no-underline active:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('loginAsOfficerBtn')}</span>
          </Link>

          <Link
            href={`/${locale}/grievance`}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors flex items-center justify-center gap-1.5 no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('returnToDashboardBtn')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
