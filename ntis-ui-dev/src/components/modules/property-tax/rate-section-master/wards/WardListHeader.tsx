import { Map as MapIcon } from "lucide-react";
import { AddButton, SearchInput, Tooltip } from "@/components/common";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WardListHeaderProps } from "@/types/rateSectionMaster.types";

export default function WardListHeader({
  title,
  effectiveSelectedRateSection,
  rateSectionLabel,
  selectRateSectionText,
  totalCount,
  totalWardsLabel,
  search,
  searchPlaceholder,
  linkWardLabel,
  onSearch,
  onAddWard
}: WardListHeaderProps) {
  return (
    <div className="p-4 pb-0">
      <div className="flex items-center gap-2 mb-3">
        <MapIcon className="w-5 h-5 text-[#1A86E8]" />
        <h3 className="text-lg font-semibold text-[#1A86E8]">{title}</h3>

        <Tooltip
          content={effectiveSelectedRateSection && rateSectionLabel ? rateSectionLabel : selectRateSectionText}
          placement="top"
        >
          <div className="flex-shrink-0 cursor-default">
            <StatusBadge
              label={effectiveSelectedRateSection && rateSectionLabel ? 
                (rateSectionLabel.length > 30 ? `${rateSectionLabel.substring(0, 30)}...` : rateSectionLabel) : 
                selectRateSectionText}
              variant="info"
            />
          </div>
        </Tooltip>

        {effectiveSelectedRateSection && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center px-1.5 py-0.5 xl:px-2 xl:py-1 rounded-md text-[10px] lg:text-xs font-medium bg-green-50 text-green-700 border border-green-300">
              <MapIcon className="w-3 h-3 xl:w-3.5 xl:h-3.5 mr-0.5 xl:mr-1" />
              <span className="hidden sm:inline">{totalWardsLabel}</span>
              <span className="sm:hidden">#</span>
              {" "}{totalCount}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 xl:gap-3">
          {effectiveSelectedRateSection && (
            <SearchInput
              className="w-32 sm:w-48 lg:w-64 mb-0"
              placeholder={searchPlaceholder}
              value={search}
              onChange={onSearch}
            />
          )}
          <AddButton
            size="sm"
            label={linkWardLabel}
            onClick={onAddWard}
            disabled={!effectiveSelectedRateSection}
          />
        </div>
      </div>
    </div>
  );
}
