import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { MasterTable, Column } from '@/components/common/MasterTable';
import { TextArea } from '@/components/common/Textarea';
import { ValidationMessage } from '@/components/common/ValidationMessage';
import { PropertyRow } from './combinePropertyColumns';
import { DESCRIPTION_SANITIZE } from '@/lib/utils/validation-rules';

export interface CombinePropertyReviewSectionProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  isReviewing: boolean;
  isPending: boolean;
  isSubmitting: boolean;
  selectedBasePropertyId?: string;
  selectedPropertyNo?: string;
  reviewDataLength: number;
  checkedCount: number;
  hasDifferentOwners: boolean;
  differentOwnerProps: string;
  columns: Column<PropertyRow>[];
  reviewData: PropertyRow[];
  remark: string;
  remarkError: boolean;
  setRemark: (val: string) => void;
}

export function CombinePropertyReviewSection({
  t,
  isReviewing,
  isPending,
  isSubmitting,
  selectedBasePropertyId,
  selectedPropertyNo,
  reviewDataLength,
  checkedCount,
  hasDifferentOwners,
  differentOwnerProps,
  columns,
  reviewData,
  remark,
  remarkError,
  setRemark,
}: CombinePropertyReviewSectionProps) {
  const emptyStateContent = (
    <div className="flex flex-col items-center justify-center min-h-[380px] text-center gap-4 select-none">
      <div className="w-[72px] h-[72px] rounded-full bg-blue-50 flex items-center justify-center">
        <FileText className="w-9 h-9 text-blue-200" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-700">{t('noPropertiesSelected')}</p>
        <p className="text-sm text-gray-400 mt-1.5 max-w-[320px] leading-relaxed">
          {t('emptyStateSubtitle')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {/* Empty state */}
      {!isReviewing && !selectedBasePropertyId && emptyStateContent}

      {/* Review header + warning */}
      {isReviewing && reviewDataLength > 0 && (
        <>
          {/* Review combination banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-800">{t('reviewCombination')}</p>
              <p className="text-[12px] text-blue-600 mt-0.5">
                {t('primaryProperty')}{' '}
                <span className="font-bold">{selectedPropertyNo}</span> {t('willBeCombinedWith')}{' '}
                <span className="font-bold text-blue-700">{checkedCount}/{reviewDataLength} {t('properties')}</span>
              </p>
            </div>
          </div>

          {/* Owner mismatch warning */}
          {hasDifferentOwners && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border-l-4 border-red-400">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-red-700">{t('warningDifferentOwners')}</p>
                {differentOwnerProps && (
                  <p className="text-[11px] text-red-600 mt-0.5">• {differentOwnerProps}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Review table */}
      {isReviewing && (
        <MasterTable<PropertyRow>
          columns={columns}
          data={reviewData}
          loading={isPending}
          paginationConfig={{ enabled: false }}
          height="md"
          getRowKey={(row, i) => `row-${row.propertyId || 0}-${i}`}
          emptyText={t('emptyTableText')}
          rowClassName={(row) =>
            String(row.propertyId) === selectedBasePropertyId
              ? 'bg-green-100 hover:bg-green-200/60 transition-colors'
              : ''
          }
        />
      )}

      {/* Remark Input */}
      {isReviewing && reviewDataLength > 0 && (
        <div className="w-full mt-2">
          <TextArea
            id="remark"
            label={t('remarkLabel')}
            value={remark}
            onChange={(e) => {
              const val = e.target.value.replace(DESCRIPTION_SANITIZE, '');
              setRemark(val);
            }}
            maxLength={500}
            placeholder={t('remarkPlaceholder')}
            disabled={isSubmitting || isPending || checkedCount <= 1}
            rows={2}
            className='text-black'
            required
            error={remarkError}
          />
          <ValidationMessage visible={remarkError} message={t('remarkRequiredError') || 'Please enter remark'} />
        </div>
      )}
    </div>
  );
}
