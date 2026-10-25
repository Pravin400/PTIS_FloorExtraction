"use client";

import { useTranslations, useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Card } from "@/components/common/Card";
import { TaxZoningCoverage } from "@/types/taxZoningRange.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface CoverageDashboardProps {
  coverage: TaxZoningCoverage;
}

const ZONE_COLOR_CLASSES = [
  { border: "border-[#bbd7f0]", bg: "bg-[#e9f4ff]", text: "text-[#1765a7]" },
  { border: "border-[#bfe2cd]", bg: "bg-[#eaf9f0]", text: "text-[#16814f]" },
  { border: "border-[#efd596]", bg: "bg-[#fff4dc]", text: "text-[#9a6200]" },
  { border: "border-[#d4ccf4]", bg: "bg-[#f0edff]", text: "text-[#5b45a7]" },
  { border: "border-[#f1c4cb]", bg: "bg-[#ffecef]", text: "text-[#bd3d54]" },
  { border: "border-[#b9dfdf]", bg: "bg-[#e7f8f8]", text: "text-[#17777a]" },
];

export default function CoverageDashboard({ coverage }: CoverageDashboardProps) {
  const t = useTranslations("taxZoningRange.ui.coverage");
  const tRoot = useTranslations("taxZoningRange");
  const taxZoneLabel = useAliasLabel("Tax Zone", tRoot("aliasFallback.taxZone"));
  const locale = useLocale();
  const dateLocale = locale === "hi" ? "hi-IN" : locale === "mr" ? "mr-IN" : "en-IN";
  const { totalProperties, coveredProperties, pendingProperties, zoneWiseCounts } = coverage;
  const coveragePercent = totalProperties > 0 ? ((coveredProperties / totalProperties) * 100).toFixed(2) : "0.00";

  return (
    <section className="flex flex-wrap items-stretch gap-3 mb-2">
      {/* Total Card */}
      <Card padding="none" className="min-w-[200px] flex-1 min-h-[64px] p-2 border border-[#cbdced] rounded-xl bg-gradient-to-br from-[#f5faff] to-white shadow-[0_4px_13px_rgba(29,62,104,.055)] relative overflow-hidden">
        <div className="absolute w-[60px] h-[60px] rounded-full -right-[30px] -top-[30px] bg-[rgba(31,103,178,.05)]"></div>
        <div className="flex items-center gap-1.5 text-[#50657b] text-[9px] font-black uppercase tracking-wider relative z-10">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#e4f1fd] text-[#17508e] text-[7px] font-black">
            DB
          </span>
          {t("totalProperties")}
        </div>
        <strong className="block mt-1 text-[#0b315c] text-[18px] leading-none relative z-10">
          {totalProperties.toLocaleString(dateLocale)}
        </strong>
      </Card>

      {/* Covered Card */}
      <Card padding="none" className="min-w-[200px] flex-1 min-h-[64px] p-2 border border-[#bcdcc9] rounded-xl bg-gradient-to-br from-[#f0fbf5] to-white shadow-[0_4px_13px_rgba(29,62,104,.055)] relative overflow-hidden">
        <div className="absolute w-[60px] h-[60px] rounded-full -right-[30px] -top-[30px] bg-[rgba(31,103,178,.05)]"></div>
        <div className="flex items-center gap-1.5 text-[#50657b] text-[9px] font-black uppercase tracking-wider relative z-10">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#e1f5e9] text-[#16814f] text-[9px] font-black">
            <Check className="w-2.5 h-2.5" />
          </span>
          {t("coveredInZoning")}
        </div>
        <div className="flex items-end gap-2 mt-1 relative z-10">
          <strong className="block text-[#0b315c] text-[18px] leading-none">
            {coveredProperties.toLocaleString(dateLocale)}
          </strong>
          <b className="mb-0.5 px-1 py-[1px] rounded-full bg-[#dff4e8] text-[#147247] text-[8px]">
            {coveragePercent}%
          </b>
        </div>
      </Card>

      {/* Pending Card */}
      <Card padding="none" className="min-w-[200px] flex-1 min-h-[64px] p-2 border border-[#ead6ad] rounded-xl bg-gradient-to-br from-[#fff9ed] to-white shadow-[0_4px_13px_rgba(29,62,104,.055)] relative overflow-hidden">
        <div className="absolute w-[60px] h-[60px] rounded-full -right-[30px] -top-[30px] bg-[rgba(31,103,178,.05)]"></div>
        <div className="flex items-center gap-1.5 text-[#50657b] text-[9px] font-black uppercase tracking-wider relative z-10">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#fff0ce] text-[#926000] text-[9px] font-black">
            !
          </span>
          {t("pendingForZoning")}
        </div>
        <strong className="block mt-1 text-[#0b315c] text-[18px] leading-none relative z-10">
          {pendingProperties.toLocaleString(dateLocale)}
        </strong>
      </Card>

      {/* Zone Distribution Card */}
      <Card padding="none" className="min-w-[420px] flex-[2] min-h-[64px] p-2 border border-[#d1d5ef] rounded-xl bg-gradient-to-br from-[#f6f7ff] to-white shadow-[0_4px_13px_rgba(29,62,104,.055)] relative overflow-hidden">
        <div className="flex items-center gap-1.5 text-[#50657b] text-[9px] font-black uppercase tracking-wider relative z-10">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#e4f1fd] text-[#17508e] text-[8px] font-black">
            Z
          </span>
          {t("zoneWiseCount", { taxZone: taxZoneLabel })}
        </div>
        <div className="flex flex-row flex-nowrap gap-2 mt-1 relative z-10 w-full overflow-x-auto pb-0.5">
          {zoneWiseCounts.length === 0 ? (
            <span className="text-[10px] text-[#7c8aa0] col-span-full">{t("noZoneData")}</span>
          ) : (
            zoneWiseCounts.map((z, i) => {
              const c = ZONE_COLOR_CLASSES[i % ZONE_COLOR_CLASSES.length];
              return (
                <div key={z.taxZoneId} className={`py-1 px-2 border ${c.border} rounded-lg ${c.bg} text-center flex-shrink-0 min-w-[72px]`}>
                  <span className="block text-[#5f6f87] text-[9px] font-extrabold whitespace-nowrap">
                    {t("zonePrefix", { taxZone: taxZoneLabel })} {z.taxZoneNo}
                  </span>
                  <strong className={`block ${c.text} text-[13px] leading-none`}>{z.count}</strong>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </section>
  );
}
