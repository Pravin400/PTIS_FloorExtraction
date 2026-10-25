import { useState, useCallback, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Floor } from '@/types/floor.types';
import type { ConstructionType } from '@/types/construction.types';
import type { UseType, UseSubType } from '@/types/typeOfUse.types';
import type { FloorSubmissionRow } from '@/types/apartmentQC.types';
import { updateFloorQCDetailAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';

export function useFloorSubmissionForm(
  initialRow: FloorSubmissionRow | null,
  onSaveSuccess?: () => void,
  t?: (key: string) => string,
  floorOptions: Floor[] = [],
  constructionTypeOptions: ConstructionType[] = [],
  useOptions: UseType[] = [],
  subUseTypeOptions: UseSubType[] = [],
  subFloorOptions: Array<{ id?: string | number; subFloorId?: string | number; subFloorCode?: string; description?: string }> = []
) {
  const [formData, setFormData] = useState<Partial<FloorSubmissionRow>>(initialRow || {});

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();


  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isPending, startTransition] = useTransition();

  const handleOpenDropdown = useCallback(
    (key: 'loadFloor' | 'loadConstruction' | 'loadUsage' | 'loadSubType' | 'loadSubFloor', useTypeId?: string) => {
      if (searchParams.get(key) === 'true') {
        // If we're loading subtypes, we also need to check if the typeOfUseId matches
        if (key === 'loadSubType' && useTypeId && searchParams.get('typeOfUseId') === useTypeId) {
          return;
        } else if (key !== 'loadSubType') {
          return;
        }
      }

      startTransition(() => {
        const urlParams = new URLSearchParams(searchParams.toString());
        urlParams.set(key, 'true');
        if (key === 'loadSubType' && useTypeId) {
          urlParams.set('typeOfUseId', useTypeId);
        }
        const queryString = urlParams.toString();
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  const isLoadingFloors = isPending && searchParams.get('loadFloor') !== 'true';
  const isLoadingConTypes = isPending && searchParams.get('loadConstruction') !== 'true';
  const isLoadingUseTypes = isPending && searchParams.get('loadUsage') !== 'true';
  const isLoadingSubTypes = isPending && searchParams.get('loadSubType') !== 'true';
  const isLoadingSubFloors = isPending && searchParams.get('loadSubFloor') !== 'true';

  const transformedFloorOptions = useMemo(() => {
    const opts = floorOptions.map(f => ({ value: String(f.id), label: String(f.description || f.floorCode || f.id) }));
    if (initialRow?.floorId && !opts.find(o => String(o.value) === String(initialRow.floorId))) {
      opts.push({ value: String(initialRow.floorId), label: String(initialRow.floorId) });
    }
    return opts;
  }, [floorOptions, initialRow]);

  const transformedConTypeOptions = useMemo(() => {
    const opts = constructionTypeOptions.map(c => ({
      value: String(c.id),
      label: c.constructionCode && c.description ? `${c.constructionCode} - ${c.description}` : String(c.description || c.constructionCode || c.id)
    }));
    if (initialRow?.constructionTypeId && !opts.find(o => String(o.value) === String(initialRow.constructionTypeId))) {
      opts.push({ value: String(initialRow.constructionTypeId), label: String(initialRow.constructionTypeId) });
    }
    return opts;
  }, [constructionTypeOptions, initialRow]);

  const transformedUseTypeOptions = useMemo(() => {
    const opts = useOptions.map(u => ({
      value: String(u.typeOfUseId),
      label: u.typeOfUseCode && u.description ? `${u.typeOfUseCode} - ${u.description}` : String(u.description || u.typeOfUseCode || u.typeOfUseId)
    }));
    if (initialRow?.typeOfUseId && !opts.find(o => String(o.value) === String(initialRow.typeOfUseId))) {
      opts.push({ value: String(initialRow.typeOfUseId), label: String(initialRow.typeOfUseId) });
    }
    return opts;
  }, [useOptions, initialRow]);

  const transformedSubTypeOptions = useMemo(() => {
    const opts = subUseTypeOptions.map(s => ({ value: String(s.subTypeOfUseId), label: String(s.description || s.subTypeOfUseId) }));
    if (initialRow?.subTypeOfUseId && !opts.find(o => String(o.value) === String(initialRow.subTypeOfUseId))) {
      opts.push({ value: String(initialRow.subTypeOfUseId), label: String(initialRow.subTypeOfUseId) });
    }
    return opts;
  }, [subUseTypeOptions, initialRow]);

  const transformedSubFloorOptions = useMemo(() => {
    const opts = subFloorOptions.map(s => {
      const id = s.subFloorCode || s.subFloorId || s.id;
      const desc = s.description || '';
      return { value: String(id), label: id && desc ? `${id} - ${desc}` : (desc || String(id)) };
    });
    if (initialRow?.subFloorId && !opts.find(o => String(o.value) === String(initialRow.subFloorId))) {
      opts.push({ value: String(initialRow.subFloorId), label: String(initialRow.subFloorId) });
    }
    return opts;
  }, [subFloorOptions, initialRow]);

  const handleFieldChange = (field: keyof FloorSubmissionRow, value: FloorSubmissionRow[keyof FloorSubmissionRow]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.conYear && !/^\d{4}$/.test(String(formData.conYear))) {
      newErrors.conYear = "floorQC.validation.invalidYear";
    }
    if (formData.asstYear && !/^\d{4}$/.test(String(formData.asstYear))) {
      newErrors.asstYear = "floorQC.validation.invalidYear";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    
    try {
      const propertyIdCandidate = formData.propertyId ?? searchParams.get('editPropertyId');
      const detailIdCandidate = formData.pdnId;

      const propertyId =
        typeof propertyIdCandidate === 'number' || typeof propertyIdCandidate === 'string'
          ? propertyIdCandidate
          : undefined;
      const detailId =
        typeof detailIdCandidate === 'number' || typeof detailIdCandidate === 'string'
          ? detailIdCandidate
          : undefined;

      if (!propertyId || !detailId) {
         toast.error(t ? t('messages.propertyIdMissing') : 'Missing property or floor IDs');
         return;
      }

      const payload = {
        floorId: formData.floorId ? Number(formData.floorId) : undefined,
        constructionTypeId: formData.constructionTypeId ? Number(formData.constructionTypeId) : undefined,
        typeOfUseId: formData.typeOfUseId ? Number(formData.typeOfUseId) : undefined,
        subTypeOfUseId: formData.subTypeOfUseId ? Number(formData.subTypeOfUseId) : undefined,
        constructionYear: formData.conYear ? String(formData.conYear) : undefined,
        assessmentYear: formData.asstYear ? String(formData.asstYear) : undefined,
      };

      const result = await updateFloorQCDetailAction(propertyId, detailId, payload);

      if (result.success) {
        toast.success(t ? t('messages.allChangesSaved') : 'Saved successfully');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const isSubTypeDisabled = !formData.typeOfUseId || (
    searchParams.get('loadSubType') === 'true' &&
    searchParams.get('typeOfUseId') === String(formData.typeOfUseId) &&
    !isLoadingSubTypes &&
    transformedSubTypeOptions.length === 0
  );

  return {
    formData,
    errors,
    isSaving,
    handleFieldChange,
    handleSave,
    handleOpenDropdown,
    floors: transformedFloorOptions,
    isLoadingFloors,
    conTypes: transformedConTypeOptions,
    isLoadingConTypes,
    useTypes: transformedUseTypeOptions,
    isLoadingUseTypes,
    subTypes: transformedSubTypeOptions,
    isLoadingSubTypes,
    isSubTypeDisabled,
    subFloors: transformedSubFloorOptions,
    isLoadingSubFloors
  };
}
