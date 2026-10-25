import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { WingSummary } from "@/components/modules/property-tax/zone-master/properties/wingColumns";
import { updateWingDetailsMastAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { ensureWingDetailsMast } from "./ensureWingDetailsMast";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface UseWingManagementProps {
  /** The single SocietyDetails row for this property (0 or 1 item) */
  societyDetails: SocietyDetailItem[];
  setSocietyDetails: React.Dispatch<React.SetStateAction<SocietyDetailItem[]>>;
  /** Wing master list (GET /Wing) */
  wings: WingItem[];
  /** WingDetailsMast records (the actual per-wing list) for this property's society record */
  wingDetailsMast: WingDetailsMastItem[];
  setWingDetailsMast: React.Dispatch<React.SetStateAction<WingDetailsMastItem[]>>;
  selectedPropertyId: number | null;
  /** Optional callback to refresh data after wing save (create/edit) */
  onWingSaveSuccess?: () => Promise<void> | void;
}

export function useWingManagement({
  societyDetails,
  setSocietyDetails,
  wings,
  wingDetailsMast,
  setWingDetailsMast,
  selectedPropertyId,
  onWingSaveSuccess,
}: UseWingManagementProps) {
  const t = useTranslations("zoneMaster");
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));

  const [showWingConfig, setShowWingConfig] = useState(false);
  const [showAddWingForm, setShowAddWingForm] = useState(false);
  const [newWingName, setNewWingName] = useState("");
  const [addingWing, setAddingWing] = useState(false);
  // Identifies the WingDetailsMast row being edited (not a SocietyDetails id anymore)
  const [editingWingDetailId, setEditingWingDetailId] = useState<number | null>(null);
  const [newWingId, setNewWingId] = useState<number | null>(null);
  const [newWingNo, setNewWingNo] = useState<string>("");

  const activeWingDetailsMast = useMemo(
    () => wingDetailsMast.filter(w => !w.markedForDeletion),
    [wingDetailsMast]
  );

  // Pick the next unused Wing master entry (WingItem.id === WingMasterId) for
  // this property: the first wing in the real Wing master list (GET /Wing)
  // that does not already have a WingDetailsMast record. WingMasterId must
  // reference a real row in the Wing master table.
  const nextWingId = useMemo(() => {
    const usedWingMasterIds = new Set(activeWingDetailsMast.map(w => w.wingMasterId));
    const sortedWings = [...wings].sort((a, b) => a.id - b.id);
    const unused = sortedWings.find(w => !usedWingMasterIds.has(w.id));
    return unused?.id ?? null;
  }, [activeWingDetailsMast, wings]);

  // Get wingNo from wings array based on wingId
  const getWingNoById = useCallback((wingId: number): string => {
    const wing = wings.find(w => w.id === wingId);
    return wing?.wingNo || "";
  }, [wings]);

  // Open add wing form with initialized values
  const openAddWingForm = useCallback(() => {
    if (nextWingId === null) {
      toast.error(`No available ${wingAlias.toLowerCase()} letters left to assign`);
      return;
    }
    setShowAddWingForm(true);
    setNewWingId(nextWingId);
    setNewWingNo(getWingNoById(nextWingId));
  }, [nextWingId, getWingNoById, wingAlias]);

  // Build wing summary rows directly from WingDetailsMast - one row per wing.
  const wingSummaries = useMemo<WingSummary[]>(() => {
    return activeWingDetailsMast
      .map((wingDetail) => {
        const wingMaster = wings.find(w => w.id === wingDetail.wingMasterId);
        return {
          wingName: wingDetail.wingName ?? wingMaster?.wingNo ?? "",
          count: 1,
          wingMasterId: wingDetail.wingMasterId,
          wingNo: wingMaster?.wingNo,
          wingDetailId: wingDetail.id,
        };
      })
      .sort((a, b) => a.wingDetailId - b.wingDetailId);
  }, [activeWingDetailsMast, wings]);

  // Handle save wing
  const handleSaveWing = async (errors: PartitionFormErrors, setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>) => {
    if (!selectedPropertyId || !newWingId) return;

    // Validate wing name
    if (!newWingName?.trim()) {
      setErrors({ ...errors, wingName: t("partitionForm.wing.validation.wingNameRequired", { wing: wingAlias }) });
      return;
    }

    setAddingWing(true);
    try {
      if (editingWingDetailId) {
        const existingWing = wingDetailsMast.find(
          item => item.id === editingWingDetailId
        );
        if (!existingWing) {
          throw new Error("The selected wing could not be found. Refresh and try again.");
        }

        // PUT replaces the resource, so retain all existing details when renaming.
        const result = await updateWingDetailsMastAction(editingWingDetailId, {
          isActive: existingWing.isActive,
          wingName: newWingName,
          secretaryName: existingWing.secretaryName,
          managerName: existingWing.managerName,
          secretaryNameEnglish: existingWing.secretaryNameEnglish,
          managerNameEnglish: existingWing.managerNameEnglish,
          managerMobileNo: existingWing.managerMobileNo,
          managerMobileNoRemarkId: existingWing.managerMobileNoRemarkId,
          secretaryMobileNo: existingWing.secretaryMobileNo,
          secretaryMobileNoRemarkId: existingWing.secretaryMobileNoRemarkId,
          secretaryEmailId: existingWing.secretaryEmailId,
          managerEmailId: existingWing.managerEmailId,
          markedForDeletion: existingWing.markedForDeletion,
          markedForDeletionDate: existingWing.markedForDeletionDate,
          societyWingDetails: existingWing.societyWingDetails,
        });

        if (result.success && result.data) {
          setWingDetailsMast(prev => prev.map(item =>
            item.id === editingWingDetailId ? result.data! : item
          ));
          toast.success(t("partitionForm.wing.messages.updateWingSuccess", { wing: wingAlias }));
        } else {
          throw new Error(result.error || "Failed to update wing");
        }
      } else {
        const { societyDetail, wingDetail, createdSocietyDetail, createdWingDetail } = await ensureWingDetailsMast({
          selectedPropertyId,
          wingMasterId: newWingId,
          wingName: newWingName,
          societyDetails,
          wingDetailsMast: activeWingDetailsMast,
        });

        if (createdSocietyDetail) {
          setSocietyDetails(prev => [...prev, societyDetail]);
        }
        if (createdWingDetail) {
          setWingDetailsMast(prev => [...prev, wingDetail]);
        } else {
          setWingDetailsMast(prev => (prev.some(w => w.id === wingDetail.id) ? prev : [...prev, wingDetail]));
        }

        toast.success(t("partitionForm.wing.messages.createWingSuccess", { wing: wingAlias }));
      }

      // Reset form
      setNewWingId(null);
      setNewWingNo("");
      setNewWingName("");
      setEditingWingDetailId(null);
      setShowAddWingForm(false);

      // Refresh data after successful save
      if (onWingSaveSuccess) {
        await onWingSaveSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("partitionForm.wing.messages.saveWingError", { wing: wingAlias }));
    } finally {
      setAddingWing(false);
    }
  };

  return {
    showWingConfig,
    setShowWingConfig,
    showAddWingForm,
    setShowAddWingForm,
    newWingName,
    setNewWingName,
    addingWing,
    setAddingWing,
    editingWingDetailId,
    setEditingWingDetailId,
    newWingId,
    setNewWingId,
    newWingNo,
    setNewWingNo,
    getWingNoById,
    nextWingId,
    wingSummaries,
    handleSaveWing,
    openAddWingForm,
  };
}
