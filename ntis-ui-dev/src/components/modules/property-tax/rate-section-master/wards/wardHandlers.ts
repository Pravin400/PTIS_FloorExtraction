import { toast } from "sonner";
import { deleteRateSectionDetailAction } from "@/app/[locale]/property-tax/rate-section-master/actions";
import { HandleWardDeleteParams, HandleWardEditParams } from "@/types/rateSectionMaster.types";

export async function handleWardDelete({
  row,
  rateSectionLabel,
  effectiveSelectedRateSection,
  confirm,
  setDeletedIds,
  onWardsChanged,
  t,
  wardAlias,
  rateSectionAlias,
  wardsAlias
}: HandleWardDeleteParams) {
  const id = row.id;
  const wardNo = row.wardNo;
  const description = row.description;
  const ward = wardAlias || t('defaults.ward');
  const wards = wardsAlias || t('defaults.wards');
  const rateSection = rateSectionAlias || t('defaults.rateSection');

  if (id == null || typeof id !== 'number') {
    toast.error(t('wards.invalidRecord', { ward }));
    return;
  }

  const displayRateSection = rateSectionLabel || effectiveSelectedRateSection || "";
  const safeWardNo = wardNo ?? "";
  const formattedWardName = description ? `${safeWardNo} - ${description}` : safeWardNo;

  confirm({
    variant: "delete",
    title: t('wards.deleteTitle', { ward }),
    description: t('wards.deleteConfirm', { wardNo: safeWardNo, displayZone: displayRateSection, ward, rateSection }),
    onConfirm: async () => {
      try {
        const result = await deleteRateSectionDetailAction(id);
        if (result.success) {
          setDeletedIds(prev => new Set([...prev, id]));
          toast.success(t('wards.deleteSuccess', { count: 1, ward, wards }));
          if (onWardsChanged) onWardsChanged();
        } else {
          const errorMsg = result.message?.toLowerCase() || result.error?.toLowerCase() || "";
          
          // Check for "referenced by other entities" or "in use" error message
          if (
            errorMsg.includes("referenced by other entities") ||
            errorMsg.includes("cannot delete") ||
            errorMsg.includes("still referenced") ||
            errorMsg.includes("foreign key") ||
            errorMsg.includes("in use")
          ) {
            // Show custom localized error message
            toast.error(t('wards.inUseError', { wardName: formattedWardName, ward }));
          } else {
            toast.error(result.message || result.error || t('wards.deleteError', { ward }));
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "";
        const errorLower = msg.toLowerCase();
        
        if (
          errorLower.includes("referenced by other entities") ||
          errorLower.includes("cannot delete") ||
          errorLower.includes("still referenced") ||
          errorLower.includes("foreign key") ||
          errorLower.includes("in use")
        ) {
          // Show custom localized error message
          toast.error(t('wards.inUseError', { wardName: formattedWardName, ward }));
        } else {
          toast.error(t('wards.deleteError', { ward }));
        }
      }
    },
  });
}

export function handleWardEdit({ row, searchParams, router }: HandleWardEditParams) {
  const params = new URLSearchParams(searchParams.toString());
  // Handle case-insensitive property names from API
  const wardId = row.wardId ?? (row as Record<string, unknown>)["WardId"];
  const rateSectionDetailsId = row.id ?? (row as Record<string, unknown>)["Id"];

  if (wardId) {
    params.set("ward", String(wardId));
  }

  if (rateSectionDetailsId) {
    params.set("id", String(rateSectionDetailsId));
  }

  params.set("editWard", "");
  router.push(`?${params.toString()}`);
}
