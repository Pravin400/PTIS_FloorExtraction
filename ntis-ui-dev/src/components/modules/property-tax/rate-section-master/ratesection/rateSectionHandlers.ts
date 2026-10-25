import { toast } from "sonner";
import { deleteRateSectionAction } from "@/app/[locale]/property-tax/rate-section-master/actions";
import { HandleRateSectionDeleteParams } from "@/types/rateSectionMaster.types";

export async function handleRateSectionDelete({
  rateId,
  rateName,
  wardCounts,
  searchParams,
  pathname,
  rates,
  router,
  onDeleteSuccess,
  t,
  setDeletingId,
  rateSectionAlias,
  wardsAlias
}: HandleRateSectionDeleteParams) {
  setDeletingId(rateId);
  const formattedName = rateName;
  const hasWards = rateId ? (wardCounts[rateId] || 0) > 0 : false;
  const rateSection = rateSectionAlias || t('defaults.rateSection');
  const wards = wardsAlias || t('defaults.wards');

  try {
    const result = await deleteRateSectionAction(Number(rateId));
    if (result.success) {
      toast.success(t('messages.deleteSuccess', { name: formattedName, rateSection }));

      const params = new URLSearchParams(searchParams.toString());
      const deletedZone = rateId;
      const currentZone = searchParams.get("zone");

      if (deletedZone && currentZone === deletedZone) {
        const remaining = rates.filter(r => String(r.id) !== deletedZone);

        if (remaining.length > 0 && remaining[0].id) {
          params.set("zone", String(remaining[0].id));
          params.set("wardpage", "1");
          params.delete("wardq");
        } else {
          params.delete("zone");
          params.delete("wardpage");
          params.delete("wardq");
        }
      }

      router.push(`${pathname}?${params.toString()}`);
      router.refresh();

      if (onDeleteSuccess) onDeleteSuccess();
    } else {
      const errorMsg = result.error?.toLowerCase() || result.message?.toLowerCase() || "";
      const rawError = result.error || result.message || t('messages.deleteError', { rateSection });
      
      // Check for specifically referenced by RateSectionDetails (Wards)
      if (errorMsg.includes("ratesectiondetails")) {
        // Show custom localized error message
        toast.error(t('messages.inUseError', { name: formattedName, rateSection, wards }));
      } else if (hasWards) {
        toast.warning(t('dialogs.deleteErrorWards', { name: formattedName, rateSection, wards }));
      } else {
        // Fall back to showing the actual API error message for other reference errors
        toast.error(rawError);
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    const errorLower = msg.toLowerCase();
    
    if (errorLower.includes("ratesectiondetails")) {
      // Show custom localized error message
      toast.error(t('messages.inUseError', { name: formattedName, rateSection, wards }));
    } else if (hasWards) {
      toast.warning(t('dialogs.deleteErrorWards', { name: formattedName, rateSection, wards }));
    } else {
      toast.error(msg || t('messages.deleteError', { rateSection }));
    }
  } finally {
    setDeletingId(null);
  }
}
