import { Eye, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { Card, ImageViewer } from '@/components/common';
import { fmt, fmtDisplayDate } from '@/lib/utils/asset-utils/payment-utils/payment-format';

interface AssetDetailsCardSectionProps {
  record: LeaseRentPaymentDetail;
  hasSearched: boolean;
  isPhotoModalOpen: boolean;
  setIsPhotoModalOpen: (val: boolean) => void;
}

function AssetRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-2 min-w-0 items-center">
      <span className="text-[#1e3a8a] flex-shrink-0 font-medium w-[115px] sm:w-[135px] text-[12px] sm:text-[13px]">{label}</span>
      <span className={`text-[#1e3a8a] truncate text-[12.5px] sm:text-[14px] ${bold ? 'font-bold' : 'font-bold'}`}>{value}</span>
    </div>
  );
}

export function AssetDetailsCardSection({
  record,
  hasSearched,
  isPhotoModalOpen,
  setIsPhotoModalOpen,
}: AssetDetailsCardSectionProps) {
  const t = useTranslations('AssetPayment');

  return (
    <>
      <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-2 sm:p-3">
        <h2 className="text-[16px] sm:text-[16px] font-bold text-[#1E3A8A] mb-2 ml-1">{t('layout.assetInfo.title')}</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start">
          {/* Asset photo */}
          <button
            type="button"
            onClick={() => {
              if (record.assetPhotoGuid) {
                setIsPhotoModalOpen(true);
              }
            }}
            disabled={!record.assetPhotoGuid}
            className={`group relative flex-shrink-0 w-full sm:w-[280px] h-[200px] sm:h-[165px] rounded-lg overflow-hidden bg-slate-100 shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${record.assetPhotoGuid ? 'cursor-pointer' : 'cursor-default'
              }`}
          >
            {record.assetPhotoGuid ? (
              <div
                className={`absolute inset-0 bg-[length:100%_100%] transition-transform duration-300 ${hasSearched ? 'group-hover:scale-110' : ''}`}
                style={{ backgroundImage: `url('/api/documents/${record.assetPhotoGuid}')` }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-1">
                <Building2 className="w-8 h-8 text-slate-300" />
                <span className="text-[9.5px] font-medium text-slate-400">{t('v2.noPhotoAvailable')}</span>
              </div>
            )}

            {/* Hover Overlay */}
            {hasSearched && record.assetPhotoGuid && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Eye className="text-white w-8 h-8 opacity-90 drop-shadow-md" />
              </div>
            )}
            {/* Blue Active Badge on image */}
            {hasSearched && (
              <div className="absolute bottom-0 left-0 bg-[#1d4ed8] text-white text-[9px] font-bold px-2 py-1 rounded-tr-lg z-10">
                {t('v2.active')}
              </div>
            )}
          </button>

          {/* Details grid */}
          <div className="w-full flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h3 className="text-[14px] sm:text-[16px] leading-tight flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#1e3a8a] font-medium">{t('v2.assetName')}:</span>
                  <span className="text-[#1e3a8a] font-bold">
                    {hasSearched ? (record.shopName || record.assetName || '-') : '-'}
                  </span>
                </h3>
                {hasSearched && (
                  <span className="bg-green-100/80 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-md">
                    {t('v2.active')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 justify-start gap-x-4 sm:gap-x-8 lg:gap-x-12 gap-y-1.5 sm:gap-y-2 text-[11.5px] sm:text-[12px]">
                <AssetRow label={`${t('v2.assetId')}:`} value={hasSearched ? (record.assetNo || '-') : '-'} />
                <AssetRow label={t('v2.agreementPeriod')} value={hasSearched && record.leaseStartDate && record.leaseEndDate ? `${fmtDisplayDate(record.leaseStartDate)} to ${fmtDisplayDate(record.leaseEndDate)}` : '-'} />
                <AssetRow label={t('v2.buildingName')} value={hasSearched ? (record.assetName || record.shopName || '-') : '-'} />
                <AssetRow label={t('v2.agreementNo')} value={hasSearched ? ((record as LeaseRentPaymentDetail & { agreementId?: string }).agreementId || '-') : '-'} />
                <AssetRow label={t('v2.tenantName')} value={hasSearched ? (record.tenantName || '-') : '-'} />
                <AssetRow label={`${record.paymentFrequency ? `${record.paymentFrequency} Rent` : t('v2.monthlyRent')} (₹)`} value={hasSearched && record.monthlyRent ? fmt(record.monthlyRent) : '-'} />
                <AssetRow label={t('v2.mobileNumber')} value={hasSearched ? (record.tenantMobile || '-') : '-'} />
                <AssetRow label={t('v2.paymentFrequency')} value={hasSearched ? (record.paymentFrequency || '-') : '-'} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Asset Photo Full Size Modal */}
      {record.assetPhotoGuid && (
        <ImageViewer
          open={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          images={[
            {
              src: `/api/documents/${record.assetPhotoGuid}`,
              alt: record.shopName || record.assetName || 'Asset Photo',
              title: record.shopName || record.assetName || 'Asset Photo',
            },
          ]}
          showZoom
          showRotate
          showDownload
        />
      )}
    </>
  );
}
