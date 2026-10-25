import { Layers } from "lucide-react";
import { AddButton, SearchInput } from "@/components/common";
import { TEXT_SANITIZE } from "@/lib/utils/validation";
import { RateSectionListHeaderProps } from "@/types/rateSectionMaster.types";

const sanitizeSearch = (value: string) => value.replace(TEXT_SANITIZE, '');

export default function RateSectionListHeader({
  title,
  searchPlaceholder,
  addButtonLabel,
  searchValue,
  onSearchChange,
  onAddClick
}: RateSectionListHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Layers className="w-5 h-5 text-[#1A86E8]" />
      <h3 className="text-lg font-semibold text-[#1A86E8]">{title}</h3>
      <div className="ml-auto flex items-center gap-3">
        <SearchInput
          className="w-64 mb-0"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(val) => onSearchChange(sanitizeSearch(val))}
        />
        <AddButton
          size="sm"
          label={addButtonLabel}
          onClick={onAddClick}
          disabled={false}
        />
      </div>
    </div>
  );
}
