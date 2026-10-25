import { useTranslations } from "next-intl";
import { Search, RotateCcw } from "lucide-react";
import { Button, Label, Input, Select } from "@/components/common";

interface MappingSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchingServer: boolean;
  onPerformSearch: (term: string) => void;
  onResetFilters: () => void;
  mappingStateFilter: string;
  setMappingStateFilter: (val: string) => void;
}

export function MappingSearchBar({
  searchQuery,
  setSearchQuery,
  isSearchingServer,
  onPerformSearch,
  onResetFilters,
  mappingStateFilter,
  setMappingStateFilter,
}: MappingSearchBarProps) {
  const t = useTranslations("propertyMapping");

  return (
    <section className="bg-white border border-slate-200 rounded-2xl py-2.5 px-3.5 shadow-sm flex flex-wrap items-end gap-3 w-full">
      {/* Search Input — takes remaining space */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <Label className="text-xs font-black text-slate-700 uppercase tracking-wide">
          {t("searchBar.label")}
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {isSearchingServer ? (
              <div className="absolute left-3 top-2.5 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
            )}
            <Input
              naked
              type="text"
              placeholder={t("searchBar.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onPerformSearch(searchQuery.trim());
                }
              }}
              className="h-9 w-full border border-slate-200 rounded-lg pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500 font-semibold bg-white"
            />
          </div>

          {/* Search Button */}
          <Button
            variant="primary"
            size="sm"
            icon={Search}
            disabled={isSearchingServer || !searchQuery.trim()}
            onClick={() => onPerformSearch(searchQuery.trim())}
            className="h-9 px-4 font-bold shrink-0 rounded-lg"
          >
            {isSearchingServer ? t("searchBar.searchingButton") : t("searchBar.searchButton")}
          </Button>

          {/* Reset Filters Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            icon={RotateCcw}
            className="h-9 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold px-4 hover:text-rose-800 focus:ring-0 focus:ring-transparent focus:bg-rose-50 focus:text-rose-700 shrink-0 rounded-lg"
          >
            {t("searchBar.resetButton")}
          </Button>
        </div>
      </div>

      {/* Verification Status — at the far right */}
      <div className="w-48 flex flex-col gap-1 shrink-0">
        <Label className="text-xs font-black text-slate-700 uppercase tracking-wide">
          {t("searchBar.verificationStatusLabel")}
        </Label>
        <Select
          options={[
            { label: t("searchBar.filterOptions.all"), value: "All" },
            { label: t("searchBar.filterOptions.needVerification"), value: "Need verification" },
            { label: t("searchBar.filterOptions.mapped"), value: "Mapped" },
            { label: t("searchBar.filterOptions.unmapped"), value: "Unmapped" },
          ]}
          value={mappingStateFilter}
          onChange={(_, val) => setMappingStateFilter(val)}
          selectSize="sm"
          className="w-full text-xs font-semibold h-9"
        />
      </div>
    </section>
  );
}
