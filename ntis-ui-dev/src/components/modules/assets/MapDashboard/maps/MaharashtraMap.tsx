import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  districtsData,
  divisionColors,
} from "@/components/modules/assets/MapDashboard/data/districts";
import { cityToDistrict, districtULBData } from "@/components/modules/assets/MapDashboard/data/ulbData";
import { districtBoundaries } from "../data/geo-boundaries/maharashtra/data/boundaries-data";
import PuneZoneMap from "./PuneZoneMap";
import AkolaZonesMap from "./AkolaZonesMap";
import { akolaZonesData } from "../data/geo-boundaries/akola/data/zones-data";
import { getLabelPosition } from '@/lib/utils/map-dashboard/maharashtraMapUtils';
import type { MaharashtraMapProps } from '@/types/assets/map-dashboard.types';

const normalizeDistrictName = (name: string): string => {
  const lower = name.toLowerCase().trim();
  return lower === "mumbai city" ? "mumbai" : lower;
};

export default async function MaharashtraMap({
  selectedCity = null,
  locale = 'en',
}: MaharashtraMapProps = {}) {
  const t = await getTranslations('mapDashboard');

  const showPuneZoneMap = selectedCity?.name === 'Pune';
  const showAkolaZoneMap = selectedCity?.name === 'Akola';

  const isDistrictSelected = (districtName: string) => {
    if (!selectedCity) return false;
    const selectedDistrictName = cityToDistrict[selectedCity.name] || selectedCity.name;
    return normalizeDistrictName(districtName) === normalizeDistrictName(selectedDistrictName);
  };

  const getDistrictColor = (districtId: string, isSelected = false) => {
    const idMap: Record<string, string> = {
      mumbaicity: "mumbai",
      "mumbaisub.": "mumbaisuburban",
    };

    const dataId = idMap[districtId] || districtId;
    const district = districtsData[dataId];

    if (!district) return "#e2e8f0";

    const division = district.division.toLowerCase();
    const colorTheme =
      divisionColors[division as keyof typeof divisionColors] ||
      divisionColors.konkan;

    return isSelected ? colorTheme.selected : colorTheme.default;
  };

  return (
    <main className="relative w-full h-full flex flex-col">
      <style>{`
        .district-path {
          transition: fill 0.15s ease, filter 0.15s ease;
        }
        .district-path:hover {
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15)) !important;
          opacity: 0.85;
        }
      `}</style>

      {showPuneZoneMap ? (
        <>
          <div className="absolute top-4 left-4 z-10">
            <Link
              href={`/${locale}/assets/map-dashboard`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg shadow border border-slate-200 transition-colors text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('map.backToStateMap')}
            </Link>
          </div>
          <div className="flex-1 w-full h-full min-h-[500px]">
            <PuneZoneMap />
          </div>
        </>
      ) : showAkolaZoneMap ? (
        <>
          <div className="absolute top-4 left-4 z-10">
            <Link
              href={`/${locale}/assets/map-dashboard`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg shadow border border-slate-200 transition-colors text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('map.backToStateMap')}
            </Link>
          </div>
          <div className="flex-1 w-full h-full min-h-[500px]">
            <AkolaZonesMap
              zones={akolaZonesData}
              selectedZone={null}
              onZoneClick={() => { }}
            />
          </div>
        </>
      ) : (
        <svg
          viewBox="15 25 770 700"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full bg-white"
          style={{ minHeight: "400px", maxHeight: "80vh" }}
        >
          {Object.entries(districtBoundaries).map(
            ([districtId, path]) => {
              const idMap: Record<string, string> = {
                mumbaicity: "mumbai",
                "mumbaisub.": "mumbaisuburban",
              };
              const dataId = idMap[districtId] || districtId;
              const district = districtsData[dataId];

              if (!district) return null;

              const isSelectedFromTable = isDistrictSelected(district.name);

              const pathElement = (
                <path
                  d={path}
                  fill={getDistrictColor(districtId, !!isSelectedFromTable)}
                  stroke="#000000"
                  strokeWidth={isSelectedFromTable ? 3 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="district-path cursor-pointer origin-center"
                  style={{
                    filter: isSelectedFromTable
                      ? "drop-shadow(0 6px 12px rgba(0,0,0,0.3))"
                      : "none",
                  }}
                >
                  <title>{district.name}</title>
                </path>
              );

              const dData = Object.entries(districtULBData).find(
                ([key]) => normalizeDistrictName(key) === normalizeDistrictName(district.name)
              )?.[1];
              const hasULBs = dData && (
                dData['Municipal Corporations'].length > 0 ||
                dData['Municipal Councils'].length > 0 ||
                dData['Nagar Panchayats'].length > 0
              );

              if (hasULBs) {
                const targetDistrictName = district.name === "Mumbai City" ? "Mumbai" : district.name;
                return (
                  <Link
                    key={districtId}
                    href={{
                      pathname: `/${locale}/assets/map-dashboard`,
                      query: { district: targetDistrictName },
                    }}
                  >
                    {pathElement}
                  </Link>
                );
              }

              return (
                <g key={districtId}>
                  {pathElement}
                </g>
              );
            },
          )}

          {Object.entries(districtBoundaries).map(
            ([districtId]) => {
              const idMap: Record<string, string> = {
                mumbaicity: "mumbai",
                "mumbaisub.": "mumbaisuburban",
              };

              const dataId = idMap[districtId] || districtId;
              const district = districtsData[dataId];
              if (!district) return null;

              const labelPosition = getLabelPosition(districtId);

              const isSelectedFromTable = isDistrictSelected(district.name);

              return (
                <text
                  key={`label-${districtId}`}
                  x={labelPosition.x}
                  y={labelPosition.y}
                  fontSize={labelPosition.size || 11}
                  fontWeight="600"
                  fill="#000000"
                  textAnchor="middle"
                  pointerEvents="none"
                  style={{
                    opacity: isSelectedFromTable ? 1 : 0.9,
                    transition: "all 0.2s ease",
                  }}
                >
                  {district.name}
                </text>
              );
            },
          )}

          {/* Visit Municipal Portal overlay popup on selected district */}
          {selectedCity && (() => {
            const match = Object.entries(districtsData).find(
              ([_, dist]) => isDistrictSelected(dist.name)
            );
            if (!match) return null;

            const [dataId] = match;
            const reverseMap: Record<string, string> = {
              mumbai: "mumbaicity",
              mumbaisuburban: "mumbaisub.",
            };
            const districtId = reverseMap[dataId] || dataId;
            const labelPos = getLabelPosition(districtId);

            return (
              <foreignObject
                x={labelPos.x - 130}
                y={labelPos.y - 50}
                width="260"
                height="55"
                style={{ overflow: 'visible' }}
              >
                <div className="bg-white rounded-[12px] shadow-lg border border-blue-200 p-1.5 flex items-center justify-center pointer-events-auto">
                  <Link
                    href={selectedCity.isLive ? `/${locale}/assets/dashboard/master-dashboard` : `#`}
                    className="w-full flex items-center justify-between gap-2.5 px-3 py-2 text-white rounded-[8px] bg-[#1a56db] hover:bg-[#1a56db]/90 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="whitespace-nowrap text-white font-medium text-xs">
                        {t('map.visitMunicipalPortal')}
                      </span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-white shrink-0" />
                  </Link>
                </div>
              </foreignObject>
            );
          })()}
        </svg>
      )}
    </main>
  );
}