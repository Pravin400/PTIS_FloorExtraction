'use client';

import { Modal } from '@/components/common/Modal';
import type { MunicipalAsset } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import { useTranslations } from 'next-intl';

export function EncroachmentModal({ assets, onClose }: { assets: MunicipalAsset[]; onClose: () => void }) {
  const t = useTranslations('assetmasterdashboard');
  
  return (
    <Modal 
      open={true} 
      onClose={onClose} 
      title={t('encroachmentAlerts')}
      subtitle={t('activeEncroachmentsCases', { count: assets.length })}
      maxWidth="lg"
    >
      <div className="overflow-y-auto max-h-[60vh] space-y-3">
        {assets.map(a => (
          <div key={a.id} className="bg-white border border-red-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">{a.name}</h4>
              <p className="text-xs text-gray-500">
                {t('location')}: {a.location} | {t('zone')}: {a.zone}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
