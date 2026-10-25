import { useCallback, useState } from "react";

type EditableField = "hi_IN" | "mr_IN";
type EditState = Record<number, Partial<Record<EditableField, string>>>;

export function useLocalizationStringsEdits() {
  const [edits, setEdits] = useState<EditState>({});

  const handleCellChange = useCallback(
    (id: number, field: EditableField, value: string) => {
      setEdits((prev: EditState) => ({
        ...prev,
        [id]: { ...prev[id], [field]: value },
      }));
    },
    []
  );

  const clearEdits = useCallback(() => {
    setEdits({});
  }, []);

  return {
    edits,
    handleCellChange,
    clearEdits,
  };
}
