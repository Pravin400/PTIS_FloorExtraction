'use client';

import React, { memo } from 'react';
import { Shield } from 'lucide-react';

interface UnauthorizedPenaltyBannerProps {
  isAuthorized: boolean;
  t: (key: string) => string;
}

export const UnauthorizedPenaltyBanner: React.FC<UnauthorizedPenaltyBannerProps> = memo(({
  isAuthorized,
  t,
}) => {
  return (
    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-gray-700" />
        <div>
          <h3 className="text-[11px] font-bold text-gray-900">{t('unauthorizedPenaltyTitle')}</h3>
          <p className="text-[10px] text-gray-500">{t('unauthorizedPenaltySubtitle')}</p>
        </div>
      </div>

      {isAuthorized ? (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800">
          <span className="font-bold">{t('authorizedNotice')}</span> — {t('authorizedHelp')}
        </div>
      ) : (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800">
          <span className="font-bold">{t('unauthorizedNotice')}</span> — {t('unauthorizedHelp')}
        </div>
      )}
    </div>
  );
});

UnauthorizedPenaltyBanner.displayName = 'UnauthorizedPenaltyBanner';
