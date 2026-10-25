"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, EditButton, DeleteButton } from "@/components/common";
import { Tooltip } from "@/components/common";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RateSectionCardProps } from "@/types/rateSectionMaster.types";

export default function RateSectionCard({
  rate,
  index,
  serialNo,
  isSelected,
  isNewlyCreated,
  onDelete,
  deletingId,
  searchParams,
  pathname,
  t,
  rateSectionAlias
}: RateSectionCardProps) {
  const router = useRouter();

  const rateId = rate.id;
  const description = rate.description;
  const isActive = rate.isActive;

  const handleClick = () => {
    if (!rateId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("zone", String(rateId));
    params.set("wardpage", "1");
    params.delete("wardq");

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rateGuid = rate.id;
    if (rateGuid) {
      const currentPath = window.location.pathname;
      const locale = currentPath.split("/")[1] || "";
      router.push(
        `/${locale}/property-tax/rate-section-master/edit/${rateGuid}`
      );
    }
  };

  const resolvedRateSectionAlias = rateSectionAlias || t('defaults.rateSection');

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rateGuid = rate.id;
    if (rateGuid) {
      onDelete(
        String(rateGuid),
        description || t('messages.thisRateSection', { rateSection: resolvedRateSectionAlias })
      );
    }
  };

  const fallbackName = t('list.fallbackName', { rateSection: resolvedRateSectionAlias });

  return (
    <div
      key={rate.id || index}
      className="w-full  px-2 mb-2"
    >
      <Card
        onClick={handleClick}
        role="button"
        aria-pressed={isSelected}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        padding="sm"
        className={`relative p-1 rounded-xl cursor-pointer transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#1A86E8] focus:ring-offset-2 ${isNewlyCreated
          ? "bg-gradient-to-br from-emerald-100 via-green-50 to-emerald-100 border-2 border-emerald-400 shadow-lg animate-pulse"
          : isSelected
            ? "bg-gradient-to-br from-[#E8EFF8] via-[#F4F9FE] to-[#F0F5FC] border-2 border-[#B3D6F6] shadow-lg"
            : "bg-white border-2 border-gray-200 hover:border-[#1A86E8]/40 hover:shadow-md"
          }`}
      >
        <div className="flex items-center gap-1">
          <div
            className={`px-3 py-1 rounded-lg flex-shrink-0 ${isSelected
              ? "bg-gradient-to-br from-[#1A86E8] via-[#6A88BC] to-[#1A86E8]"
              : "bg-gradient-to-br from-[#E8EDF5] to-[#D5DFF0]"
              }`}
          >
            <span
              className={`text-sm font-bold ${isSelected ? "text-white" : "text-[#1A86E8]"
                }`}
            >
              {serialNo}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <Tooltip content={description || fallbackName} placement="top">
                <h4
                  className={`font-bold text-sm ${isSelected ? "text-[#2C4A75]" : "text-gray-900"
                    }`}
                >
                  {(description && description.length > 30) ? `${description.substring(0, 30)}...` : (description || fallbackName)}
                </h4>
              </Tooltip>

              <div className="flex gap-1 items-center">
                <StatusBadge
                  value={isActive ? "active" : "inactive"}
                />
                <EditButton
                  size="xs"
                  onClick={handleEdit}
                />

                <DeleteButton
                  size="xs"
                  onClick={handleDelete}
                  disabled={deletingId === String(rate.id)}
                />
              </div>
            </div>
          </div>

          {isSelected && (
            <div className="flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-[#4A5F8C]" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
