import { useCallback } from "react";
import { toast } from "sonner";
import {
  linkWardsToRateSectionAction,
  deleteSelectedWardsAction,
  refreshSelectedWardsAction,
  getAllWardsForLinkAction,
  getAllRateSectionDetailsForRateSectionAction
} from "@/app/[locale]/property-tax/rate-section-master/actions";
import { RateItem } from "@/types/rateSectionMaster.types";
import { useConfirm } from "@/components/common";

interface UseLinkWardActionsParams {
  rates: RateItem[];
  allRateSections: RateItem[];
  selectedZoneNo: string | undefined;
  wardAssignments: Record<string, { rateSectionNo: string; description?: string }>;
  checkedAvailable: Set<string>;
  selectedWards: string[];
  setCheckedAvailable: (set: Set<string>) => void;
  checkedSelected: Set<string>;
  setCheckedSelected: (set: Set<string>) => void;
  setLoading: (loading: boolean) => void;
  setSelectedWards: (wards: string[]) => void;
  setSelectedWardsTotalCount: (count: number) => void;
  setWardAssignments: (updater: (prev: Record<string, { rateSectionNo: string; id: number; description: string }>) => Record<string, { rateSectionNo: string; id: number; description: string }>) => void;
  router: { refresh: () => void };
  t: (key: string, values?: Record<string, string | number>) => string;
  isViewAllSelectAllActive?: boolean;
  isAvailableSelectAllActive?: boolean;
  isRateSectionSelectAllActive?: boolean;
  setViewAllSelectAllLoading?: (loading: boolean) => void;
  setAvailableSelectAllLoading?: (loading: boolean) => void;
  setIsViewAllSelectAllActive?: (active: boolean) => void;
  setIsAvailableSelectAllActive?: (active: boolean) => void;
  setIsRateSectionSelectAllActive?: (active: boolean) => void;
  viewAllSearch?: string;
  availableSearch?: string;
  rateSectionAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
}

export function useLinkWardActions({
  rates: _rates,
  allRateSections,
  selectedZoneNo,
  wardAssignments,
  checkedAvailable,
  selectedWards,
  setCheckedAvailable,
  checkedSelected,
  setCheckedSelected,
  setLoading,
  setSelectedWards,
  setSelectedWardsTotalCount,
  setWardAssignments,
  router,
  t,
  isViewAllSelectAllActive = false,
  isAvailableSelectAllActive = false,
  isRateSectionSelectAllActive = false,
  setViewAllSelectAllLoading,
  setAvailableSelectAllLoading,
  setIsViewAllSelectAllActive,
  setIsAvailableSelectAllActive,
  setIsRateSectionSelectAllActive,
  viewAllSearch,
  availableSearch,
  rateSectionAlias,
  wardAlias,
  wardsAlias
}: UseLinkWardActionsParams) {
  const { confirm } = useConfirm();
  const rateSection = rateSectionAlias || t("defaults.rateSection");
  const ward = wardAlias || t("defaults.ward");
  const wards = wardsAlias || t("defaults.wards");

  const moveToSelected = useCallback(async () => {
    // Check if Select All is active for either ViewAll or Available tabs
    const isSelectAllMode = isViewAllSelectAllActive || isAvailableSelectAllActive;
    
    const getRateSectionNameOnly = (rateSectionNo: string) => {
      const rate = allRateSections.find(r => String(r.id) === rateSectionNo);
      return rate?.description || rateSectionNo;
    };

    if (isSelectAllMode) {
      // Fetch all wards server-side
      const id = Number(selectedZoneNo);
      if (!id || isNaN(id)) {
        toast.error(t("wards.rateSectionNotFound", { rateSection }));
        return;
      }

      setLoading(true);
      if (isViewAllSelectAllActive && setViewAllSelectAllLoading) {
        setViewAllSelectAllLoading(true);
      }
      if (isAvailableSelectAllActive && setAvailableSelectAllLoading) {
        setAvailableSelectAllLoading(true);
      }

      try {
        // Determine which search term to use
        const searchTerm = isViewAllSelectAllActive ? viewAllSearch : availableSearch;
        
        const result = await getAllWardsForLinkAction(searchTerm);
        
        // Turn off loading states before displaying confirmation
        setLoading(false);
        if (setViewAllSelectAllLoading) setViewAllSelectAllLoading(false);
        if (setAvailableSelectAllLoading) setAvailableSelectAllLoading(false);

        if (!result.success || !result.data) {
          toast.error(result.error || t("wards.saveError", { wards, ward }));
          return;
        }

        // Filter out wards already in selected or assigned to another rate section
        const wardsToLink = result.data
          .filter(w => !selectedWards.includes(w.wardNo))
          .filter(w => {
            const assignment = wardAssignments[w.wardNo];
            return !assignment || assignment.rateSectionNo === selectedZoneNo;
          })
          .map(w => w.wardNo);

        if (wardsToLink.length === 0) {
          toast.info(t("wards.noNewWards", { wards, ward }));
          return;
        }

        const newLabel = getRateSectionNameOnly(selectedZoneNo || "");
        const confirmDescription = isAvailableSelectAllActive
          ? t("wards.assignAllAvailableWardsConfirm", { newRateSection: newLabel, count: wardsToLink.length, rateSection, wards })
          : t("wards.assignAllViewAllWardsConfirm", { newRateSection: newLabel, count: wardsToLink.length, rateSection, wards });

        confirm({
          variant: "info",
          title: t("wards.linkTitle", { ward, rateSection, defaultValue: "Link Ward to Rate Section" }),
          description: confirmDescription,
          confirmText: t("wards.yes", { defaultValue: "Yes" }),
          cancelText: t("wards.no", { defaultValue: "No" }),
          onConfirm: async () => {
            setLoading(true);
            try {
              const linkResult = await linkWardsToRateSectionAction(id, wardsToLink);

              if (!linkResult.success) {
                toast.error(linkResult.error || t("wards.saveError", { wards, ward }));
                return;
              }

              if (linkResult.data?.hasFailures) {
                toast.warning(
                  t("wards.partialSaveSuccess", {
                    success: linkResult.data.successCount,
                    failed: linkResult.data.failedCount,
                    wards,
                    ward
                  })
                );
              } else {
                toast.success(t("wards.saveSuccess", { wards, ward }));
              }

              // Update state
              const newSelectedWards = [...new Set([...selectedWards, ...wardsToLink])];
              setSelectedWards(newSelectedWards);
              setSelectedWardsTotalCount(newSelectedWards.length);

              setWardAssignments(prev => {
                const next = { ...prev };
                wardsToLink.forEach(w => {
                  next[w] = { rateSectionNo: selectedZoneNo || "", id: 0, description: newLabel };
                });
                return next;
              });

              const refreshResult = await refreshSelectedWardsAction(id);
              if (refreshResult.success) {
                setSelectedWards(refreshResult.wardNos);
                setSelectedWardsTotalCount(refreshResult.totalCount);
              }

              // Reset Select All state
              if (isViewAllSelectAllActive && setIsViewAllSelectAllActive) {
                setIsViewAllSelectAllActive(false);
              }
              if (isAvailableSelectAllActive && setIsAvailableSelectAllActive) {
                setIsAvailableSelectAllActive(false);
              }
              setCheckedAvailable(new Set());
              router.refresh();
            } catch {
              toast.error(t("wards.saveError", { wards, ward }));
            } finally {
              setLoading(false);
            }
          }
        });
      } catch {
        toast.error(t("wards.saveError", { wards, ward }));
        setLoading(false);
        if (setViewAllSelectAllLoading) setViewAllSelectAllLoading(false);
        if (setAvailableSelectAllLoading) setAvailableSelectAllLoading(false);
      }
      return;
    }

    // Normal mode: move individually checked wards
    const toMove = Array.from(checkedAvailable);

    if (toMove.length === 0) return;

    const id = Number(selectedZoneNo);
    if (!id || isNaN(id)) {
      toast.error(t("wards.rateSectionNotFound", { rateSection }));
      return;
    }

    const newLabel = getRateSectionNameOnly(selectedZoneNo || "");

    const executeLinkWards = async (wardsToLink: string[]) => {
      setLoading(true);

      try {
        const result = await linkWardsToRateSectionAction(id, wardsToLink);

        if (!result.success) {
          toast.error(result.error || t("wards.saveError", { wards, ward }));
          setLoading(false);
          return;
        }

        if (result.data?.hasFailures) {
          toast.warning(
            t("wards.partialSaveSuccess", {
              success: result.data.successCount,
              failed: result.data.failedCount,
              wards,
              ward
            })
          );
        } else {
          toast.success(t("wards.saveSuccess", { wards, ward }));
        }

        // Optimistically update selectedWards immediately for instant UI feedback
        const newSelectedWards = [...new Set([...selectedWards, ...wardsToLink])];
        setSelectedWards(newSelectedWards);
        setSelectedWardsTotalCount(newSelectedWards.length);

        // Manually update ward assignments for immediate UI feedback
        setWardAssignments(prev => {
          const next = { ...prev };
          wardsToLink.forEach(w => {
            next[w] = { rateSectionNo: selectedZoneNo || "", id: 0, description: newLabel };
          });
          return next;
        });

        const refreshResult = await refreshSelectedWardsAction(id);
        if (refreshResult.success) {
          setSelectedWards(refreshResult.wardNos);
          setSelectedWardsTotalCount(refreshResult.totalCount);
        }

        setCheckedAvailable(new Set());
        router.refresh();

      } catch {
        toast.error(t("wards.saveError", { wards, ward }));
      } finally {
        setLoading(false);
      }
    };

    let description = "";

    if (toMove.length === 1) {
      const wardNo = toMove[0];
      const assignment = wardAssignments[wardNo];
      if (assignment) {
        const oldLabel = assignment.description || getRateSectionNameOnly(assignment.rateSectionNo);
        description = t("wards.reassignSingleWardConfirm", {
          wardNo,
          oldRateSection: oldLabel,
          newRateSection: newLabel,
          ward,
          rateSection
        });
      } else {
        description = t("wards.assignSingleWardConfirm", {
          wardNo,
          newRateSection: newLabel,
          ward,
          rateSection
        });
      }
    } else {
      const wardDetails = toMove.map(w => {
        const assignment = wardAssignments[w];
        if (assignment) {
          const oldLabel = assignment.description || getRateSectionNameOnly(assignment.rateSectionNo);
          return t("wards.wardDetailsReassign", { wardNo: w, oldRateSection: oldLabel, ward, rateSection });
        }
        return t("wards.wardDetailsAssign", { wardNo: w, ward, rateSection });
      }).join("\n");
      description = t("wards.assignMultipleWardsConfirm", {
        wardDetails,
        newRateSection: newLabel,
        ward,
        wards,
        rateSection
      });
    }

    confirm({
      variant: "info",
      title: t("wards.reassignWardsTitle", { ward, wards, rateSection, defaultValue: "Confirm Ward Reassignment" }),
      description,
      confirmText: t("wards.yes", { defaultValue: "Yes" }),
      cancelText: t("wards.no", { defaultValue: "No" }),
      onConfirm: async () => {
        await executeLinkWards(toMove);
      }
    });
  }, [
    checkedAvailable, allRateSections, selectedZoneNo, wardAssignments, selectedWards,
    setCheckedAvailable, setLoading, setSelectedWards, setSelectedWardsTotalCount,
    setWardAssignments, router, t, rateSection, ward, wards,
    isViewAllSelectAllActive, isAvailableSelectAllActive,
    setViewAllSelectAllLoading, setAvailableSelectAllLoading,
    setIsViewAllSelectAllActive, setIsAvailableSelectAllActive,
    viewAllSearch, availableSearch, confirm
  ]);

  const moveToAvailable = useCallback(async () => {
    // Check if Select All is active for RateSectionWards
    if (isRateSectionSelectAllActive) {
      const id = Number(selectedZoneNo);
      if (!id || isNaN(id)) {
        toast.error(t("wards.rateSectionNotFound", { rateSection }));
        return;
      }

      setLoading(true);

      try {
        // Fetch all wards for this rate section
        const result = await getAllRateSectionDetailsForRateSectionAction(id);
        if (!result.success || !result.wardNos || result.wardNos.length === 0) {
          toast.info(t("wards.noWardsToDelete", { wards, ward }));
          setLoading(false);
          if (setIsRateSectionSelectAllActive) setIsRateSectionSelectAllActive(false);
          return;
        }

        const allWardNos = result.wardNos;

        // Delete all wards
        const deleteResult = await deleteSelectedWardsAction(id, allWardNos);

        if (!deleteResult.success) {
          toast.error(deleteResult.error || t("wards.deleteError", { ward, wards }));
          setLoading(false);
          return;
        }

        toast.success(t("wards.deleteSuccess", { count: deleteResult.deletedCount, ward, wards }));

        // Clear all selections and refresh
        setSelectedWards([]);
        setSelectedWardsTotalCount(0);
        setCheckedSelected(new Set());

        // Update ward assignments
        setWardAssignments(prev => {
          const next = { ...prev };
          allWardNos.forEach(w => {
            delete next[w];
          });
          return next;
        });

        if (setIsRateSectionSelectAllActive) setIsRateSectionSelectAllActive(false);
        router.refresh();

      } catch {
        toast.error(t("wards.deleteError", { ward, wards }));
      }

      setLoading(false);
      return;
    }

    // Normal mode: move individually checked wards
    const toMove = Array.from(checkedSelected);

    if (toMove.length === 0) return;

    const id = Number(selectedZoneNo);
    if (!id || isNaN(id)) {
      toast.error(t("wards.rateSectionNotFound", { rateSection }));
      return;
    }

    setLoading(true);

    try {
      const result = await deleteSelectedWardsAction(id, toMove);

      if (!result.success) {
        toast.error(result.error || t("wards.deleteError", { ward, wards }));
        setLoading(false);
        return;
      }

      toast.success(t("wards.deleteSuccess", { count: result.deletedCount, ward, wards }));

      // Optimistically remove from selectedWards immediately for instant UI feedback
      const newSelectedWards = selectedWards.filter((w: string) => !toMove.includes(w));
      setSelectedWards(newSelectedWards);
      setSelectedWardsTotalCount(newSelectedWards.length);

      // Manually remove from ward assignments for immediate UI feedback
      setWardAssignments(prev => {
        const next = { ...prev };
        toMove.forEach(w => {
          delete next[w];
        });
        return next;
      });

      const refreshResult = await refreshSelectedWardsAction(id);
      if (refreshResult.success) {
        setSelectedWards(refreshResult.wardNos);
        setSelectedWardsTotalCount(refreshResult.totalCount);
      }

      setCheckedSelected(new Set());
      router.refresh();

    } catch {
      toast.error(t("wards.deleteError", { ward, wards }));
    }

    setLoading(false);
  }, [
    checkedSelected, selectedZoneNo, setLoading, setSelectedWards, selectedWards,
    setSelectedWardsTotalCount, setCheckedSelected, setWardAssignments, router, t, rateSection, ward, wards,
    isRateSectionSelectAllActive, setIsRateSectionSelectAllActive
  ]);

  return { moveToSelected, moveToAvailable };
}
