import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { UseSubType } from '@/types/typeOfUse.types';
import { createSubType, updateSubType } from '@/app/[locale]/property-tax/typeofusemaster/actions';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type TranslatorFunction = (key: string, values?: Record<string, string | number>) => string;

type FieldErrors = {
  typeId?: string;
  description?: string;
  searchSequence?: string;
};

interface UseSubTypeFormSubmitProps {
  formData: UseSubType;
  isEdit: boolean;
  t: TranslatorFunction;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function useSubTypeFormSubmit({
  formData,
  isEdit,
  t,
  setErrors,
  setTouched,
}: UseSubTypeFormSubmitProps) {
  const router = useRouter();

  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));

  const handleSubmit = async () => {
    if (isEdit) {
      const result = await updateSubType({
        id: Number(formData.subTypeOfUseId),
        typeId: Number(formData.typeOfUseId),
        description: formData.description,
        searchSequence: Number(formData.searchSequence ?? 0),
        status: formData.isActive ? 'Active' : 'Inactive',
        typeOfUseCategoryId: formData.typeOfUseCategoryId ?? null,
      });

      if (!result.success) {
        const errorMsg = result.message || '';

        if (
          errorMsg.includes('409') ||
          errorMsg.toLowerCase().includes('duplicate') ||
          errorMsg.includes('same details already')
        ) {
          setErrors((prev) => ({
            ...prev,
            description: t('messages.duplicateSubTypeName', { subTypeOfUse: subTypeOfUseLabel }),
          }));
          setTouched((prev) => ({ ...prev, description: true }));
        } else {
          toast.error(errorMsg || t('messages.updateSubTypeFailed', { subTypeOfUse: subTypeOfUseLabel }));
        }
        return;
      }

      toast.success(t('messages.subTypeUpdated', { subTypeOfUse: subTypeOfUseLabel }));
    } else {
      const result = await createSubType({
        typeId: Number(formData.typeOfUseId),
        description: formData.description,
        searchSequence: Number(formData.searchSequence ?? 0),
        status: formData.isActive ? 'Active' : 'Inactive',
        typeOfUseCategoryId: formData.typeOfUseCategoryId ?? null,
      });

      if (!result.success) {
        const errorMsg = result.message || '';

        if (
          errorMsg.includes('409') ||
          errorMsg.toLowerCase().includes('duplicate') ||
          errorMsg.includes('same details already')
        ) {
          setErrors((prev) => ({
            ...prev,
            description: t('messages.duplicateSubTypeName', { subTypeOfUse: subTypeOfUseLabel }),
          }));
          setTouched((prev) => ({ ...prev, description: true }));
        } else {
          toast.error(errorMsg || t('messages.createSubTypeFailed', { subTypeOfUse: subTypeOfUseLabel }));
        }
        return;
      }

      toast.success(t('messages.subTypeCreated', { subTypeOfUse: subTypeOfUseLabel }));
    }

    router.back();
  };

  return { handleSubmit };
}
