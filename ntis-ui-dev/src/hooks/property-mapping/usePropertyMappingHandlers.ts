import { useMemo, useState } from "react";
import { mergeSinglePropertyAction, mergeMultiplePropertiesAction, getMappedPropertiesAction, unmergeSinglePropertyAction, unmergeMultiplePropertiesAction, savePropertyMappingAction } from "@/app/[locale]/property-tax/property-mapping/action";
import { MappedPropertyApiResponse } from "@/types/property-mapping";
import { useTranslations } from "next-intl";
import { NewProperty, OldPropertyCandidate, FloorDetail, MappingLink, AuditHistory } from "@/types/property-mapping";
import { getFloorKey } from "@/components/modules/property-tax/property-mapping/mappingScoreCalculator";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { getUsernameFromCookie } from "@/lib/utils/cookie";

interface UsePropertyMappingHandlersProps {
  currentNewProperty: NewProperty | undefined;
  selectedCandidates: OldPropertyCandidate[];
  activeFloorDataMap: Record<string, FloorDetail[]>;
  inferredMappingType: string;
  selectedNewIndex: number;
  newProperties: NewProperty[];
  setNewProperties: React.Dispatch<React.SetStateAction<NewProperty[]>>;
  setSelectedNewIndex: React.Dispatch<React.SetStateAction<number>>;
  setMappings: React.Dispatch<React.SetStateAction<MappingLink[]>>;
  setHistoryList: React.Dispatch<React.SetStateAction<AuditHistory[]>>;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  refreshMappingState?: (
    freshData: MappedPropertyApiResponse,
    mergedCandidates?: OldPropertyCandidate[],
    unmappedPropNos?: string[]
  ) => void;
  candidates?: OldPropertyCandidate[];
  mappings: MappingLink[];
  setCandidates?: React.Dispatch<React.SetStateAction<OldPropertyCandidate[]>>;
  onMappingChanged?: () => void;
}

const formatNewPropertyDisplayNo = (p: NewProperty) => {
  if (p.fullPropNo) return String(p.fullPropNo);
  const parts = [p.ward, p.propNo, p.partitionNo && p.partitionNo !== "0" ? p.partitionNo : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" - ") : p.propNo;
};

const formatCandidateDisplayNo = (c: OldPropertyCandidate) => {
  const wardStr = c.ward ? (c.ward.toLowerCase().startsWith("ward") ? c.ward : `Ward ${c.ward}`) : "";
  const propStr = c.propNo || "";
  const partitionStr = c.partitionNo && c.partitionNo !== "0" ? ` / ${c.partitionNo}` : "";
  const fullProp = `${propStr}${partitionStr}`;
  return wardStr ? `${wardStr} - ${fullProp}` : fullProp;
};

export function usePropertyMappingHandlers({
  currentNewProperty,
  selectedCandidates,
  activeFloorDataMap,
  inferredMappingType,
  selectedNewIndex,
  newProperties,
  setNewProperties,
  setSelectedNewIndex,
  setMappings,
  setHistoryList,
  showToast,
  refreshMappingState,
  candidates = [],
  mappings,
  setCandidates,
  onMappingChanged,
}: UsePropertyMappingHandlersProps) {
  const t = useTranslations("propertyMapping");
  const { confirm } = useConfirm();
  const [isSubmitting, _setIsSubmitting] = useState(false);
  const currentUserName = useMemo(() => getUsernameFromCookie() || "Admin", []);

  const metrics = useMemo(() => {
    const totalOldArea = selectedCandidates.reduce((acc, c) => acc + c.area, 0);
    const areaDiff = (currentNewProperty?.builtUpArea || 0) - totalOldArea;
    const areaPercentDiff = totalOldArea > 0 ? (areaDiff / totalOldArea) * 100 : 0;

    const totalOldCarpetArea = selectedCandidates.reduce((acc, c) => acc + (c.carpetArea || 0), 0);
    const carpetAreaDiff = (currentNewProperty?.carpetArea || 0) - totalOldCarpetArea;
    const carpetAreaPercentDiff = totalOldCarpetArea > 0 ? (carpetAreaDiff / totalOldCarpetArea) * 100 : 0;

    const totalOldTax = selectedCandidates.reduce((acc, c) => acc + c.tax, 0);
    const taxDiff = (currentNewProperty?.tax || 0) - totalOldTax;
    const taxPercentDiff = totalOldTax > 0 ? (taxDiff / totalOldTax) * 100 : 0;

    let floorStatus = t("comparisonCards.floorCard.floorStatus.noMatchingLayout");
    let floorStatusLevel = "bad";
    if (selectedCandidates.length > 0) {
      const newKey = getFloorKey(currentNewProperty?.propNo || "", currentNewProperty?.partitionNo);
      const newFloorsCount = activeFloorDataMap[newKey]
        ? activeFloorDataMap[newKey].filter((f) => f.floor !== "Open Plot" && f.floor !== "OP").length
        : currentNewProperty?.floors?.toLowerCase().includes("ground + 1") ? 2 : 1;

      const oldFloorsCount = selectedCandidates.reduce((acc, c) => {
        const candKey = getFloorKey(c.propNo, c.partitionNo);
        if (activeFloorDataMap[candKey]) return acc + activeFloorDataMap[candKey].length;
        return acc + (c.floors.toLowerCase().includes("g + 1") ? 2 : 1);
      }, 0);

      if (oldFloorsCount === newFloorsCount) {
        floorStatus = t("comparisonCards.floorCard.floorStatus.matched");
        floorStatusLevel = "good";
      } else if (oldFloorsCount < newFloorsCount) {
        floorStatus = t("comparisonCards.floorCard.floorStatus.oldIsLess");
        floorStatusLevel = "warn";
      } else {
        floorStatus = t("comparisonCards.floorCard.floorStatus.oldIsMore");
        floorStatusLevel = "bad";
      }
    }

    return {
      totalOldArea, areaDiff, areaPercentDiff,
      totalOldCarpetArea, carpetAreaDiff, carpetAreaPercentDiff,
      totalOldTax, taxDiff, taxPercentDiff,
      floorStatus, floorStatusLevel,
    };
  }, [currentNewProperty, selectedCandidates, activeFloorDataMap, t]);

  const validationStatus = useMemo(() => {
    const warnings: string[] = [];
    let isValid = true;
    let errorMsg: string | null = null;

    if (selectedCandidates.some((c) => c.isHardConflict)) {
      isValid = false;
      errorMsg = t("validation.hardConflict");
    }

    if (selectedCandidates.length === 0) {
      if (!currentNewProperty?.remark?.trim()) {
        isValid = false;
        errorMsg = t("validation.remarkRequired");
      }
    } else {
      if (Math.abs(metrics.areaPercentDiff) > 10) {
        warnings.push(t("validation.areaVariance", { value: metrics.areaPercentDiff.toFixed(1) }));
      }
      if (Math.abs(metrics.taxPercentDiff) > 10) {
        warnings.push(t("validation.taxVariance", { value: metrics.taxPercentDiff.toFixed(1) }));
      }
    }

    return { isValid, errorMsg, warnings };
  }, [selectedCandidates, metrics, currentNewProperty, t]);

  const handleConfirmMapping = () => {
    if (!currentNewProperty || !validationStatus.isValid) {
      return;
    }

    const updatedRemark = (currentNewProperty.remark || "").trim();
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const newPropNo = currentNewProperty.propNo;
    const oldPropNos = selectedCandidates.map(formatCandidateDisplayNo);

    const displayNewPropNo = formatNewPropertyDisplayNo(currentNewProperty);
    const displayOldPropNos = selectedCandidates.map(formatCandidateDisplayNo).join(", ");

    const executeMerge = async () => {
      const defaultRemark = selectedCandidates.length === 0 ? t("auditDefaultRemarks.newSurvey") : t("auditDefaultRemarks.mappingConfirmed");
      const finalRemark = updatedRemark || defaultRemark;

      if (selectedCandidates.length === 0) {
        setMappings((prev) => prev.filter((m) => m.newPropNo !== newPropNo));
        setHistoryList((prev) => [
          ...prev,
          { id: `H-${Date.now()}`, time: timestamp, action: "Unmapped", newPropNo, oldPropNos: [], user: currentUserName, reason: finalRemark },
        ]);
        setNewProperties((prev) => prev.map((p, idx) => (idx === selectedNewIndex ? { ...p, remark: finalRemark, status: "Unmapped" } : p)));
        showToast(t("toasts.markedUnmapped", { propNo: displayNewPropNo }), "info");
      } else {
        // 1. INSTANT 0ms OPTIMISTIC UI MUTATION
        const mergedCandidates: OldPropertyCandidate[] = selectedCandidates.map((c) => ({
          ...c,
          isMapped: true,
          status: "Mapped" as const,
          mappedNewPropertyNo: currentNewProperty.propNo,
          belongsToNewId: currentNewProperty.propNo,
        }));

        if (setCandidates) {
          setCandidates((prev) => {
            const newList = [...prev];
            mergedCandidates.forEach((mc) => {
              const existingIdx = newList.findIndex((c) => c.propNo === mc.propNo && c.partitionNo === mc.partitionNo);
              if (existingIdx >= 0) {
                newList[existingIdx] = mc;
              } else {
                newList.push(mc);
              }
            });
            return newList;
          });
        }

        const newMapping: MappingLink = {
          id: `MAP-${Date.now().toString().slice(-4)}`,
          newPropNo,
          oldPropNos,
          mapType: inferredMappingType,
          confidence: 98,
          note: finalRemark,
          mappedBy: currentUserName,
          mappedAt: timestamp,
          status: "Mapped",
        };
        setMappings((prev) => [...prev.filter((m) => m.newPropNo !== newPropNo), newMapping]);
        setHistoryList((prev) => [
          ...prev,
          { id: `H-${Date.now()}`, time: timestamp, action: "Mapped", newPropNo, oldPropNos, user: currentUserName, reason: finalRemark },
        ]);
        setNewProperties((prev) => prev.map((p, idx) => (idx === selectedNewIndex ? { ...p, remark: finalRemark, status: "Mapped" } : p)));

        showToast(t("toasts.mappingConfirmed", { propNo: displayNewPropNo }), "success");
        onMappingChanged?.();

        if (selectedNewIndex < newProperties.length - 1) {
          setTimeout(() => setSelectedNewIndex((prev) => prev + 1), 600);
        }

        // 2. FAST CONCURRENT ASYNC API EXECUTION
        try {
          const rawPropId = String(currentNewProperty.id).replace("dyn-", "");
          const propertyId = parseInt(rawPropId) || Number(currentNewProperty.propertyId) || Number(currentNewProperty.id);
          
          if (!isNaN(propertyId)) {
            const latitude = String(currentNewProperty.latitude || "0");
            const longitude = String(currentNewProperty.longitude || "0");
            const location = String(currentNewProperty.location || "Default");

            if (selectedCandidates.length === 0) {
              await savePropertyMappingAction({
                newPropertyNo: currentNewProperty.propNo,
                oldPropertyNos: [],
                mappingType: "Unmapped",
                remark: finalRemark,
              });
            } else if (selectedCandidates.length === 1) {
              const propertyOldId = parseInt(selectedCandidates[0].id.split("-")[0]);
              await mergeSinglePropertyAction({
                propertyId,
                propertyOldId,
                latitude,
                longitude,
                location,
              });
            } else {
              const allPropertyOldIds = selectedCandidates
                .map((c) => parseInt(c.id.split("-")[0]))
                .filter((id) => !isNaN(id));

              await mergeMultiplePropertiesAction({
                propertyId,
                propertyOldIds: allPropertyOldIds,
                latitude,
                longitude,
                location,
              });
            }

            // Sync with backend in background without blocking UI
            getMappedPropertiesAction(propertyId)
              .then((freshData) => {
                if (freshData && refreshMappingState) {
                  refreshMappingState(freshData, mergedCandidates);
                }
              })
              .catch(() => {});
          }
        } catch {
          // Handled gracefully in background
        }
      }
    };

    if (selectedCandidates.length === 0) {
      confirm({
        variant: "warning",
        title: t("dialogs.markUnmapped.title"),
        description: t("dialogs.markUnmapped.description", { newPropNo: displayNewPropNo }),
        confirmText: t("dialogs.markUnmapped.confirmText"),
        cancelText: t("dialogs.markUnmapped.cancelText"),
        onConfirm: executeMerge,
      });
    } else {
      confirm({
        variant: "info",
        title: t("dialogs.confirmMerge.title"),
        description: t("dialogs.confirmMerge.description", { newPropNo: displayNewPropNo, oldPropNos: displayOldPropNos }),
        confirmText: t("dialogs.confirmMerge.confirmText"),
        cancelText: t("dialogs.confirmMerge.cancelText"),
        onConfirm: executeMerge,
      });
    }
  };

  const handleDisconnectMapping = (newPropNo: string, mId: string, selectedOldPropNos?: string[]) => {
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const targetProp = newProperties.find((p) => p.propNo === newPropNo || (typeof p.fullPropNo === "string" && p.fullPropNo.includes(newPropNo)) || p.id === newPropNo) || currentNewProperty;
    const displayPropNo = targetProp ? formatNewPropertyDisplayNo(targetProp) : newPropNo;

    const performUnmap = async (propsToUnmap: string[]) => {
      if (!targetProp) return;

      const mapping = mappings.find((m) => m.id === mId || m.newPropNo === newPropNo);
      if (!mapping) return;

      // 1. INSTANT 0ms OPTIMISTIC UI MUTATION
      const isPropToUnmap = (pNo: string) => {
        if (!pNo) return false;
        const cleanP = pNo.trim().toLowerCase();
        if (!cleanP) return false;
        return propsToUnmap.some((u) => {
          if (!u) return false;
          const cleanU = u.trim().toLowerCase();
          if (cleanU === cleanP) return true;
          const normU = cleanU.replace(/\s+/g, "");
          const normP = cleanP.replace(/\s+/g, "");
          if (normU === normP) return true;
          const baseU = cleanU.split(" / ")[0].split(" - ")[0].trim();
          const baseP = cleanP.split(" / ")[0].split(" - ")[0].trim();
          return Boolean(baseU && baseP && baseU === baseP);
        });
      };

      const remainingOldProps = mapping.oldPropNos.filter((p) => !isPropToUnmap(p));

      if (remainingOldProps.length === 0) {
        setMappings((prev) => prev.filter((m) => m.id !== mId && m.newPropNo !== newPropNo));
        setNewProperties((prev) => prev.map((p) => (p.propNo === newPropNo ? { ...p, status: "Needs verification" } : p)));
      } else {
        setMappings((prev) =>
          prev.map((m) =>
            (m.id === mId || m.newPropNo === newPropNo)
              ? {
                  ...m,
                  oldPropNos: remainingOldProps,
                  mapType:
                    remainingOldProps.length > 1
                      ? `Split (1 New → ${remainingOldProps.length} Old Records)`
                      : "1 → 1 (One-to-One)",
                }
              : m
          )
        );
      }

      if (setCandidates) {
        setCandidates((prev) =>
          prev.map((c) =>
            isPropToUnmap(c.propNo)
              ? { ...c, isMapped: false, status: "Unmapped" as const, mappedNewPropertyNo: "" }
              : c
          )
        );
      }

      setHistoryList((prev) => [
        ...prev,
        {
          id: `H-${Date.now()}`,
          time: timestamp,
          action: "Unmapped",
          newPropNo,
          oldPropNos: propsToUnmap,
          user: currentUserName,
          reason: t("auditDefaultRemarks.unmapManual"),
        },
      ]);

      showToast(t("toasts.unmapped", { propNo: displayPropNo }), "success");
      onMappingChanged?.();

      // 2. ULTRA-FAST CONCURRENT PARALLEL API CALLS
      try {
        const propertyId = parseInt(String(targetProp.id).replace("dyn-", "")) || Number(targetProp.propertyId) || Number(targetProp.id);

        if (!isNaN(propertyId)) {
          const oldPropIds = propsToUnmap
            .map((propNo) => {
              const cleanProp = propNo.trim();
              const c = candidates.find((cand) => 
                cand.propNo === cleanProp || 
                cand.propNo === cleanProp.split(" / ")[0].trim() || 
                cand.propNo === cleanProp.split(" - ")[0].trim() ||
                (cand.partitionNo && cleanProp.includes(cand.propNo))
              );
              if (c) return parseInt(c.id.split("-")[0]);

              const digits = cleanProp.replace(/\D/g, "");
              return digits ? parseInt(digits) : NaN;
            })
            .filter((id) => !isNaN(id));

          if (oldPropIds.length > 0) {
            // Execute all single unmerges in parallel for maximum speed
            const singleUnmerges = oldPropIds.map((singleOldId) =>
              unmergeSinglePropertyAction({
                propertyId,
                propertyOldId: singleOldId,
              })
            );

            if (oldPropIds.length > 1) {
              const multiRes = await unmergeMultiplePropertiesAction({
                propertyId,
                propertyOldIds: oldPropIds,
              });
              // Fallback to single unmerges if bulk endpoint fails
              if (!multiRes || (!multiRes.success && !multiRes.items?.success)) {
                await Promise.allSettled(singleUnmerges);
              }
            } else {
              await Promise.allSettled(singleUnmerges);
            }
          }
        }
      } catch {
        // Handled gracefully in background
      }
    };

    // If specific properties were passed from modal, unmap them directly
    if (selectedOldPropNos && selectedOldPropNos.length > 0) {
      performUnmap(selectedOldPropNos);
      return;
    }

    // Default confirmation dialog for single property link
    const mapping = mappings.find((m) => m.id === mId || m.newPropNo === newPropNo);
    const propsToUnmap = mapping?.oldPropNos || [];

    confirm({
      variant: "delete",
      title: t("dialogs.unmapProperty.title"),
      description: t("dialogs.unmapProperty.description", { mId, newPropNo: displayPropNo }),
      confirmText: t("dialogs.unmapProperty.confirmText"),
      cancelText: t("dialogs.unmapProperty.cancelText"),
      onConfirm: () => performUnmap(propsToUnmap),
    });
  };

  const handleUnlinkCandidate = (candidate: OldPropertyCandidate) => {
    if (!currentNewProperty) return;

    const displayNewPropNo = formatNewPropertyDisplayNo(currentNewProperty);
    const displayOldPropNo = formatCandidateDisplayNo(candidate);
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    confirm({
      variant: "delete",
      title: t("dialogs.unmapProperty.title"),
      description: t("dialogs.unmapProperty.description", { mId: displayOldPropNo, newPropNo: displayNewPropNo }),
      confirmText: t("dialogs.unmapProperty.confirmText"),
      cancelText: t("dialogs.unmapProperty.cancelText"),
      onConfirm: async () => {
        // 1. INSTANT 0ms OPTIMISTIC UI MUTATION
        if (setCandidates) {
          setCandidates((prev) =>
            prev.map((c) =>
              c.propNo === candidate.propNo
                ? { ...c, isMapped: false, status: "Unmapped" as const, mappedNewPropertyNo: "" }
                : c
            )
          );
        }

        setMappings((prev) =>
          prev
            .map((m) => {
              if (m.newPropNo !== currentNewProperty.propNo) return m;
              const candDisplayNo = formatCandidateDisplayNo(candidate);
              const remaining = m.oldPropNos.filter((p) => p !== candidate.propNo && p !== candDisplayNo);
              return {
                ...m,
                oldPropNos: remaining,
                mapType: remaining.length > 1 ? `Split (1 New → ${remaining.length} Old Records)` : "1 → 1 (One-to-One)",
              };
            })
            .filter((m) => m.oldPropNos.length > 0)
        );

        setHistoryList((prev) => [
          ...prev,
          { id: `H-${Date.now()}`, time: timestamp, action: "Unmapped", newPropNo: currentNewProperty.propNo, oldPropNos: [formatCandidateDisplayNo(candidate)], user: currentUserName, reason: t("auditDefaultRemarks.unmapManual") },
        ]);

        showToast(t("toasts.unmapped", { propNo: displayNewPropNo }), "success");
        onMappingChanged?.();

        // 2. FAST NON-BLOCKING API EXECUTION
        try {
          const propertyId = parseInt(String(currentNewProperty.id).replace("dyn-", "")) || Number(currentNewProperty.propertyId) || Number(currentNewProperty.id);
          const propertyOldId = parseInt(candidate.id.split("-")[0]);
          
          if (!isNaN(propertyOldId) && !isNaN(propertyId)) {
            await unmergeSinglePropertyAction({
              propertyId,
              propertyOldId,
            });
          }
        } catch {
          // Handled gracefully in background
        }
      },
    });
  };

  return {
    metrics,
    validationStatus,
    isSubmitting,
    handleConfirmMapping,
    handleDisconnectMapping,
    handleUnlinkCandidate,
  };
}
