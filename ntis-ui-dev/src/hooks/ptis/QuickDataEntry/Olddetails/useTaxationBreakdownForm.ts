import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useConfirm } from "@/components/common";
import { OldTaxesDetails, OldTaxItem, OldTaxYear, YearMaster } from "@/types/OldDetails/property-old-details.types";
import { saveOldTaxesDetailsAction } from "@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/taxation-breakdown/action";

export function useTaxationBreakdownForm(
  initialData: OldTaxesDetails | null,
  yearOptions: YearMaster[] = []
) {
  const { confirm } = useConfirm();
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("quickDataEntry.oldDetails.taxationBreakdown");
  const tValidation = useTranslations("quickDataEntry");
  const tCommon = useTranslations("common");
  const propertyId = Number(params.propertyId);

  // Default Tax List Template (with 0 amounts)
  const defaultTaxList = useMemo(() => {
    const templateYear = initialData?.taxYears?.find(y => y.taxes && y.taxes.length > 0);
    if (templateYear) {
      return templateYear.taxes.map(t => ({
        taxId: t.taxId,
        taxName: t.taxName,
        taxAmount: 0
      }));
    }
    return [];
  }, [initialData]);

  const initialYearId = useMemo(() => {
    const firstYear = initialData?.taxYears?.[0];
    if (!firstYear) {
      return "";
    }
    if (firstYear.financeYearId === null || firstYear.financeYearId === undefined) {
      return "";
    }
    return String(firstYear.financeYearId);
  }, [initialData]);


  // Validation State (defined first to be accessible by setSelectedYearId)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>(() => {
    const initialErrors: Record<string, string> = {};
    const selectedYear = yearOptions.find(y => String(y.id) === initialYearId);
    const currentYear = new Date().getFullYear();
    if (selectedYear && selectedYear.year > currentYear) {
      initialErrors.yearMaster = tValidation('property.validation.futureYearNotAllowed') || 'Cannot select a year after the current year';
    }
    return initialErrors;
  });

  // Selected Year Master ID state
  const [selectedYearId, setSelectedYearIdState] = useState<string>(initialYearId);
  const [prevInitialYearId, setPrevInitialYearId] = useState<string>(initialYearId);

  // Sync selectedYearId when initialYearId changes (during render, not in effect)
  if (prevInitialYearId !== initialYearId) {
    setPrevInitialYearId(initialYearId);
    setSelectedYearIdState(initialYearId);
    setValidationErrors({});
  }

  const setSelectedYearId = (val: string) => {
    setSelectedYearIdState(val);
    const selectedYear = yearOptions.find(y => String(y.id) === val);
    const currentYear = new Date().getFullYear();
    if (selectedYear && selectedYear.year > currentYear) {
      setValidationErrors(prev => ({
        ...prev,
        yearMaster: tValidation('property.validation.futureYearNotAllowed') || 'Cannot select a year after the current year'
      }));
    } else {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.yearMaster;
        return copy;
      });
    }
    
    // Reset taxes when year changes
    const newTaxYear = initialData?.taxYears?.find(y =>
      y.financeYearId === selectedYear?.id ||
      y.year === selectedYear?.year ||
      y.yearCode === selectedYear?.yearCode
    ) || null;
    resetTaxesForYear(newTaxYear);
  };



  const activeYearMaster = useMemo(() => {
    return yearOptions.find(y => String(y.id) === selectedYearId);
  }, [yearOptions, selectedYearId]);

  const activeTaxYear = useMemo(() => {
    if (!activeYearMaster) return initialData?.taxYears?.[0] || null;
    return initialData?.taxYears?.find(y =>
      y.financeYearId === activeYearMaster.id ||
      y.year === activeYearMaster.year ||
      y.yearCode === activeYearMaster.yearCode
    ) || null;
  }, [initialData, activeYearMaster]);

  // Dynamic Taxes State
  const [taxes, setTaxes] = useState<OldTaxItem[]>(() => {
    return activeTaxYear?.taxes && activeTaxYear.taxes.length > 0
      ? activeTaxYear.taxes
      : defaultTaxList;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset taxes when active tax year changes (triggered by year selection)
  const resetTaxesForYear = (taxYear: OldTaxYear | null) => {
    setTaxes(
      taxYear?.taxes && taxYear.taxes.length > 0
        ? taxYear.taxes
        : defaultTaxList
    );
  };

  const handleTaxChange = (taxId: number, value: string) => {
    const numValue = Number(value) || 0;
    const updatedTaxes = taxes.map(t => t.taxId === taxId ? { ...t, taxAmount: numValue } : t);

    setTaxes(updatedTaxes);

    if (numValue < 0) {
      setValidationErrors(prev => ({
        ...prev,
        [`tax_${taxId}`]: tValidation('property.validation.negativeNotAllowed')
      }));
    } else {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[`tax_${taxId}`];
        return copy;
      });
    }
  };

  const validate = () => {
    // Check validationErrors object
    if (Object.keys(validationErrors).length > 0) {
      toast.error(tValidation('property.validation.fixErrors'));
      return false;
    }

    // Check if taxes data is available
    if (!taxes || taxes.length === 0) {
      toast.error(t('noTaxDataAvailable') || 'No tax data available');
      return false;
    }

    // Ensure a Year is selected
    if (!selectedYearId) {
       toast.error(tValidation('property.validation.financeYearRequired'));
      return false;
    }

    return true;
  };

  const saveTaxes = (taxesList: OldTaxItem[], onSuccess?: () => void) => {
    if (Object.keys(validationErrors).length > 0) {
      toast.error(tValidation('property.validation.fixErrors'));
      return;
    }

    if (!taxesList || taxesList.length === 0) {
      toast.error(t('noTaxDataAvailable') || 'No tax data available');
      return;
    }

    const hasNegative = taxesList.some(t => t.taxAmount < 0);
    if (hasNegative) {
      toast.error(tValidation('property.validation.negativeNotAllowed') || 'Negative values are not allowed');
      return;
    }

    if (!selectedYearId) {
       toast.error(tValidation('property.validation.financeYearRequired'));
      return;
    }

    confirm({
      title: t("saveAssessment"),
      description: t("saveConfirmDescription"),
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const currentYearData: OldTaxYear = {
            financeYearId: activeYearMaster?.id || activeTaxYear?.financeYearId || 0,
            year: activeYearMaster?.year || activeTaxYear?.year || 0,
            yearCode: activeYearMaster?.yearCode || activeTaxYear?.yearCode || null,
            taxes: taxesList.map(t => ({
              taxId: t.taxId,
              taxName: t.taxName,
              taxAmount: Number(t.taxAmount) || 0
            }))
          };

          const payload: OldTaxesDetails = {
            propertyId: propertyId,
            taxYears: [currentYearData]
          };
        
          // Always use PUT endpoint - it handles both create and update operations
          const result = await saveOldTaxesDetailsAction(propertyId, payload, locale);
          if (result.success) {
            toast.success(t("saveSuccess"));
            onSuccess?.();
            router.refresh();
          } else {
            toast.error(result.error || t("saveError"));
          }
        } catch (_error) {
          toast.error(t("unexpectedError"));
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleSave = () => {
    if (!validate()) return;
    saveTaxes(taxes);
  };

  const isTaxesChanged = taxes.some(t => {
    const originalTaxes = activeTaxYear?.taxes && activeTaxYear.taxes.length > 0
      ? activeTaxYear.taxes
      : defaultTaxList;
    const orig = originalTaxes.find(ot => ot.taxId === t.taxId);
    return (orig?.taxAmount || 0) !== (t.taxAmount || 0);
  });

  const isYearChanged = selectedYearId !== initialYearId;
  const isChanged = isTaxesChanged || isYearChanged;

  const hasTaxData = taxes && taxes.length > 0;

  // Let React Compiler optimize this instead of manual memoization
  const hasAppliedTaxes = !!(activeTaxYear?.taxes && activeTaxYear.taxes.length > 0);

  return {
    taxes,
    selectedYearId,
    setSelectedYearId,
    isSubmitting,
    handleTaxChange,
    handleSave,
    saveTaxes,
    isChanged,
    hasTaxData,
    hasAppliedTaxes,
    activeTaxYear,
    validationErrors,
    t,
    tValidation,
    tCommon
  };
}