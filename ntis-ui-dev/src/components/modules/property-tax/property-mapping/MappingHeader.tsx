import { useTranslations } from "next-intl";
import { Link2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/common";
import { MappingLink, NewProperty } from "@/types/property-mapping";

interface MappingHeaderProps {
  activeTab: "workspace" | "mapped" | "history";
  setActiveTab: (tab: "workspace" | "mapped" | "history") => void;
  mappings: MappingLink[];
  newProperties: NewProperty[];
  handleBack: () => void;
}

export function MappingHeader({
  activeTab,
  setActiveTab,
  mappings,
  newProperties,
  handleBack,
}: MappingHeaderProps) {
  const t = useTranslations("propertyMapping");

  const mappedCount = mappings.filter((m) => m.status === "Mapped").reduce((sum, m) => sum + (m.oldPropNos?.length || 0), 0);
  const pendingCount = newProperties.filter((p) => p.status === "Needs verification").length;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 bg-white py-2.5 px-4 border border-slate-200 rounded-2xl shadow-xs shrink-0">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleBack}
          icon={ArrowLeft}
          className="mr-1 h-8 w-8 !p-0 rounded-xl hover:bg-slate-50 border border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm"
          aria-label="Back"
        />
        <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
          <Link2 size={16} />
        </div>
        <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">
          {t("header.title")}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold mr-2 gap-0.5">
          {(["workspace", "mapped", "history"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label =
              tab === "workspace"
                ? t("tabs.workspace")
                : tab === "mapped"
                ? `${t("tabs.confirmed")} (${mappedCount})`
                : t("tabs.history");

            return (
              <Button
                key={tab}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 border-none min-w-0 font-black text-xs md:text-sm focus:ring-0 focus:ring-transparent ${
                  isActive
                    ? "bg-[#1E3A8A] text-white shadow-xs hover:bg-[#172554] hover:text-white focus:bg-[#1E3A8A] focus:text-white"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200 focus:bg-transparent focus:text-slate-500"
                }`}
              >
                {label}
              </Button>
            );
          })}
        </nav>

        <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 px-3 py-1.5 rounded-xl">
          <AlertTriangle size={13} className="text-amber-600 animate-bounce" />
          {pendingCount} {t("pendingCount")}
        </span>
      </div>
    </header>
  );
}
