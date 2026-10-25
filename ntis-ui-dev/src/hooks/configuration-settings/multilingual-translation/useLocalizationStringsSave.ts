import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  MultilingualTranslation,
  MultilingualTranslationBulkUpdateItem,
} from "@/types/multilingual-translation.types";
import { bulkUpdateMultilingualTranslationsAction } from "@/app/[locale]/configuration-settings/multilingual-translation/action";

type EditableField = "hi_IN" | "mr_IN";
type EditState = Record<number, Partial<Record<EditableField, string>>>;

interface UseSaveArgs {
  data: MultilingualTranslation[];
  edits: EditState;
  onSuccess: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function useLocalizationStringsSave({
  data,
  edits,
  onSuccess,
  t,
  tCommon,
}: UseSaveArgs) {
  const [isSaving, setIsSaving] = useState(false);

  const buildBulkPayload = useCallback((): MultilingualTranslationBulkUpdateItem[] => {
    const payload: MultilingualTranslationBulkUpdateItem[] = [];

    for (const row of data) {
      const draft = edits[row.id];
      const hiDraft = draft?.hi_IN;
      const mrDraft = draft?.mr_IN;
      const finalHi = typeof hiDraft === "string" ? hiDraft : row.hi_IN;
      const finalMr = typeof mrDraft === "string" ? mrDraft : row.mr_IN;

      const userEdited =
        (typeof hiDraft === "string" && hiDraft !== row.hi_IN) ||
        (typeof mrDraft === "string" && mrDraft !== row.mr_IN);

      if (!userEdited) continue;

      payload.push({
        id: row.id,
        data: {
          resource: row.resource,
          key: row.key,
          en_US: row.en_US,
          hi_IN: finalHi,
          mr_IN: finalMr,
        },
      });
    }

    return payload;
  }, [data, edits]);

  const handleSaveAll = useCallback(async () => {
    if (isSaving) return;
    const payload = buildBulkPayload();
    if (payload.length === 0) {
      toast.info(t("messages.noChanges"));
      return;
    }
    setIsSaving(true);
    try {
      const result = await bulkUpdateMultilingualTranslationsAction(payload);
      if (result.success) {
        toast.success(t("messages.saveSuccess"));
        onSuccess();
      } else {
        toast.error(result.message || tCommon("errors.saveFailed"));
      }
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, buildBulkPayload, t, tCommon, onSuccess]);

  return {
    isSaving,
    handleSaveAll,
  };
}
