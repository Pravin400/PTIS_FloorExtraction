import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PropertyCombineDetails } from '@/types/combine-property.types';
import { fetchPropertyCombineDetailsAction, createCombinePropertyAction } from '@/app/[locale]/property-tax/ptis/combineproperty/action';
import { ConfirmContextType } from '@/components/common/ConfirmProvider';

interface SubmitHookParams {
  selectedWardId?: string;
  selectedPropertyNo?: string;
  submitPropertyNos?: string;
  selectedBasePropertyId?: string;
  basePartitionNo?: string;
  partitionNo: string;
  checkedProperties: PropertyCombineDetails[];
  selectedPropertyType: string;
  remark: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  propertyNoLabel?: string;
  setReviewData: (data: PropertyCombineDetails[]) => void;
  setCheckedPropertyIds: (ids: Set<number>) => void;
  setIsReviewing: (val: boolean) => void;
  setShowPropertyTypeDropdown: (val: boolean) => void;
  setRemarkError: (val: boolean) => void;
  handleClear: () => void;
  router: ReturnType<typeof useRouter>;
  confirm: ConfirmContextType['confirm'];
}

export function useCombinePropertySubmit({
  selectedWardId,
  selectedPropertyNo,
  submitPropertyNos,
  selectedBasePropertyId,
  basePartitionNo,
  partitionNo,
  checkedProperties,
  selectedPropertyType,
  remark,
  t,
  propertyNoLabel,
  setReviewData,
  setCheckedPropertyIds,
  setIsReviewing,
  setShowPropertyTypeDropdown,
  setRemarkError,
  handleClear,
  router,
  confirm
}: SubmitHookParams) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const propLabel = propertyNoLabel || t('aliasFallback.propertyNo');

  const handleProceed = () => {
    if (isPending || isSubmitting) return;
    if (!selectedWardId || !selectedPropertyNo) {
      toast.error(t('basePropertyIncomplete', { property: propLabel }));
      return;
    }
    if (!partitionNo && !submitPropertyNos) {
      toast.error(t('selectAtLeastOne', { property: propLabel }));
      return;
    }

    startTransition(async () => {
      setIsReviewing(true);
      try {
        const partitionsArr = partitionNo ? partitionNo.split(',').map(p => p.trim()) : [];
        if (basePartitionNo !== undefined && basePartitionNo !== null) {
          partitionsArr.push(basePartitionNo.trim() || '0');
        } else {
          partitionsArr.push('0');
        }
        const allPartitions = new Set(partitionsArr);
        const finalPartitionNo = Array.from(allPartitions).join(',');

        const allPropertyNos = new Set(
          [...(submitPropertyNos ? submitPropertyNos.split(',') : []), selectedPropertyNo || '']
            .map(p => p.trim())
            .filter(Boolean)
        );
        const finalPropertyNo = Array.from(allPropertyNos).join(',');

        const data = await fetchPropertyCombineDetailsAction({
          wardId: Number(selectedWardId),
          propertyNo: finalPropertyNo,
          partitionNo: finalPartitionNo,
        });

        const sortedData = [...data].sort((a, b) => {
          const isABase = String(a.propertyId) === selectedBasePropertyId;
          const isBBase = String(b.propertyId) === selectedBasePropertyId;
          if (isABase && !isBBase) return -1;
          if (!isABase && isBBase) return 1;
          return 0;
        });

        setReviewData(sortedData);
        setCheckedPropertyIds(new Set([Number(selectedBasePropertyId)]));
      } catch {
        setReviewData([]);
      }
    });
  };

  const handleCombine = async () => {
    if (isSubmitting || isPending) return;
    if (!selectedBasePropertyId) return;

    if (checkedProperties.length === 0) {
      toast.error(t('selectAtLeastOneToMerge', { property: propLabel }));
      return;
    }

    const missingOwnerProps = checkedProperties.filter(r => !r.ownerName || r.ownerName.trim() === '');
    if (missingOwnerProps.length > 0) {
      toast.warning(t('missingOwnerError', { property: propLabel }));
      return;
    }

    const uniquePropertyTypeIds = [...new Set(checkedProperties.map((r) => r.propertyTypeId).filter(id => id > 0))];
    const hasPropertyTypeMismatch = uniquePropertyTypeIds.length > 1;

    if (hasPropertyTypeMismatch && !selectedPropertyType) {
      toast.warning(t('propertyTypeMismatchAlert') || 'Selected properties have different property types. Please select a property type from the dropdown to proceed.');
      setShowPropertyTypeDropdown(true);
      return;
    }

    let finalPropertyTypeId = uniquePropertyTypeIds[0] || 0;
    if (hasPropertyTypeMismatch) {
      const parsedSelectedPropertyTypeId = Number(selectedPropertyType);
      if (!Number.isFinite(parsedSelectedPropertyTypeId) || parsedSelectedPropertyTypeId <= 0) {
        toast.warning(t('propertyTypeMismatchAlert') || 'Selected properties have different property types. Please select a property type from the dropdown to proceed.');
        setShowPropertyTypeDropdown(true);
        return;
      }
      finalPropertyTypeId = parsedSelectedPropertyTypeId;
    }

    const uniqueOwners = [...new Set(checkedProperties.map((r) => r.ownerName).filter(Boolean))];
    const hasDifferentOwnersLocal = uniqueOwners.length > 1;

    if (!remark.trim()) {
      setRemarkError(true);
      return;
    }

    const combinePropertyIds = checkedProperties
      .filter((r) => String(r.propertyId) !== selectedBasePropertyId)
      .map((r) => r.propertyId)
      .join(',');

    if (!combinePropertyIds) {
      toast.warning(t('selectAtLeastOneToMerge', { property: propLabel }) || 'Please select at least one additional property to merge.');
      return;
    }

    const confirmTitle = hasDifferentOwnersLocal
      ? (t('confirmCombineDiffOwnerTitle') || 'Owner Names are Different')
      : t('confirmCombineTitle');

    const confirmDesc = hasDifferentOwnersLocal
      ? (t('confirmCombineDiffOwnerDesc') || 'Owner names are different for the selected properties. Do you want to combine? Click Combine to proceed or Cancel to abort.')
      : t('confirmCombineDesc');

    confirm({
      variant: 'warning',
      title: confirmTitle,
      description: confirmDesc,
      confirmText: t('combine'),
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const response = await createCombinePropertyAction({
            sourcePropertyId: Number(selectedBasePropertyId),
            combinedPropertyIds: combinePropertyIds,
            combineReason: remark.trim() || t('defaultRemark'),
            overrideOwnerNameMismatch: hasDifferentOwnersLocal,
            propertyTypeId: finalPropertyTypeId,
          });

          if (response.success) {
            toast.success(response.message || t('combineSuccess'));
            setTimeout(() => {
              handleClear();
              router.refresh();
            }, 2000);
          } else {
            toast.error(response.message || t('combineFailed'));
          }
        } catch {
          toast.error(t('unexpectedError'));
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  return {
    isPending,
    isSubmitting,
    handleProceed,
    handleCombine
  };
}
