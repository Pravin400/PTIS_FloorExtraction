"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
  Drawer,
  Input,
  SearchSelect,
  type SearchSelectOption,
  Button,
  CancelButton,
  DeleteLabelButton,
  SaveButton,
} from "@/components/common";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type {
  GisKpiMaster,
  GisDepartmentKpiMapping,
  GisDepartmentKpiMappingPayload,
} from "@/types/gis-master/gis-kpi-master.types";
import type { DepartmentMaster } from "@/types/departmentMaster.types";
import {
  updateGisDepartmentKpiMappingAction,
  deleteGisDepartmentKpiMappingAction,
} from "@/app/[locale]/configuration-settings/gis-master/gis-kpi-master/action";
import {
  DynamicLucideIcon,
} from "./constants";

export interface GisDepartmentMappingEditDrawerProps {
  open: boolean;
  onClose?: () => void;
  kpi: GisKpiMaster | null;
  mapping: GisDepartmentKpiMapping | null;
  departments: DepartmentMaster[];
  existingMappings?: GisDepartmentKpiMapping[];
  onSuccess?: (updated: GisDepartmentKpiMapping) => void;
  onDelete?: (deletedId: number) => void;
}

export function GisDepartmentMappingEditDrawer({
  open,
  onClose,
  kpi,
  mapping,
  departments,
  existingMappings = [],
  onSuccess,
  onDelete,
}: GisDepartmentMappingEditDrawerProps): React.ReactElement | null {
  const t = useTranslations("gisKpiMaster");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push(`/${locale}/configuration-settings/gis-master/gis-kpi-master`);
    }
  }, [onClose, router, locale]);

  // Adjust state during render when mapping prop changes
  const [prevMappingId, setPrevMappingId] = useState<number | null>(mapping?.id ?? null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => (mapping ? String(mapping.departmentId) : ""));
  const [displayOrder, setDisplayOrder] = useState<string>(() => (mapping?.displayOrder ? String(mapping.displayOrder).slice(0, 3) : ""));
  const [isActive, setIsActive] = useState(() => mapping?.isActive !== false);

  if (mapping && mapping.id !== prevMappingId) {
    setPrevMappingId(mapping.id);
    setSelectedDeptId(String(mapping.departmentId));
    setDisplayOrder(mapping.displayOrder ? String(mapping.displayOrder).slice(0, 3) : "");
    setIsActive(mapping.isActive !== false);
  }

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Department SearchSelect Options
  const departmentOptions: SearchSelectOption[] = useMemo(() => {
    const list: SearchSelectOption[] = [];
    const seen = new Set<string>();

    // Ensure the currently mapped department is included even if inactive
    if (mapping && mapping.departmentId) {
      const currentVal = String(mapping.departmentId);
      seen.add(currentVal);
      const currentDept = departments.find(
        (d) => d.departmentId === Number(mapping.departmentId)
      );
      list.push({
        value: currentVal,
        label:
          currentDept?.departmentName ||
          mapping.departmentName ||
          `Department ${mapping.departmentId}`,
      });
    }

    departments.forEach((dept) => {
      const val = String(dept.departmentId);
      if (seen.has(val)) return;

      // Only list active departments
      if (dept.isActive === false) return;

      // Exclude if already mapped to another active mapping
      const isMappedOther =
        mapping &&
        existingMappings.some(
          (m) =>
            Number(m.departmentId) === dept.departmentId &&
            m.id !== mapping.id &&
            m.isActive !== false
        );

      if (isMappedOther) return;

      seen.add(val);
      list.push({
        value: val,
        label: dept.departmentName,
      });
    });

    return list;
  }, [departments, existingMappings, mapping]);

  const handleUpdate = useCallback(async () => {
    if (!kpi || !mapping) return;

    const deptIdNum = parseInt(selectedDeptId, 10);
    if (!selectedDeptId || !Number.isFinite(deptIdNum) || deptIdNum <= 0) {
      toast.error(t("mapping.selectDepartment"));
      return;
    }

    // Check duplicate if department was changed to another mapped department
    const isAlreadyMappedOther = existingMappings.some(
      (m) =>
        Number(m.departmentId) === deptIdNum &&
        m.id !== mapping.id &&
        m.isActive !== false
    );
    if (isAlreadyMappedOther) {
      toast.error(t("mapping.alreadyMapped"));
      return;
    }

    setIsSaving(true);
    try {
      const payload: GisDepartmentKpiMappingPayload = {
        id: mapping.id,
        departmentId: deptIdNum,
        kpiMasterId: kpi.id,
        customTitle: null,
        customIcon: null,
        customColor: null,
        displayOrder: Number(displayOrder) || 1,
        isActive,
      };

      const result = await updateGisDepartmentKpiMappingAction(payload);
      if (result.success) {
        const selectedDept = departments.find((d) => d.departmentId === deptIdNum);
        const updatedMapping: GisDepartmentKpiMapping = {
          ...mapping,
          departmentId: deptIdNum,
          departmentName: selectedDept?.departmentName ?? mapping.departmentName,
          customTitle: null,
          customIcon: null,
          customColor: null,
          displayOrder: payload.displayOrder,
          isActive: payload.isActive,
        };

        toast.success(t("success.updated", { code: kpi.kpiCode }));
        onSuccess?.(updatedMapping);
        handleClose();
      } else {
        toast.error(result.message || "Failed to update department mapping");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update department mapping";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }, [
    kpi,
    mapping,
    selectedDeptId,
    displayOrder,
    isActive,
    existingMappings,
    departments,
    onSuccess,
    handleClose,
    t,
  ]);

  const handleDelete = useCallback(() => {
    if (!mapping) return;
    const deptName =
      mapping.departmentName || `Department ${mapping.departmentId}`;
    confirm({
      variant: "delete",
      title: t("mapping.removeTitle"),
      description: t("mapping.removeConfirm", { name: deptName }),
      meta: {
        name: deptName,
      },
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const result = await deleteGisDepartmentKpiMappingAction(mapping.id);
          if (result.success) {
            toast.success(t("success.deleted", { code: deptName }));
            onDelete?.(mapping.id);
            handleClose();
          } else {
            toast.error(result.message || tCommon("errors.deleteError"));
          }
        } catch {
          toast.error(tCommon("errors.deleteError"));
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [confirm, mapping, onDelete, handleClose, t, tCommon]);

  if (!kpi || !mapping) return null;

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      hideHeader
      width="lg"
      zIndex={130}
      className="md:!w-[580px]"
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CancelButton
              label={t("mapping.cancel")}
              onClick={handleClose}
              disabled={isSaving || isDeleting}
            />
            <DeleteLabelButton
              size="md"
              label={isDeleting ? t("mapping.deleting") : t("mapping.deleteMapping")}
              isLoading={isDeleting}
              disabled={isSaving || isDeleting}
              onClick={handleDelete}
            />
          </div>
          <SaveButton
            size="md"
            label={isSaving ? t("mapping.updating") : t("mapping.saveChanges")}
            isLoading={isSaving}
            disabled={isSaving || isDeleting}
            onClick={handleUpdate}
          />
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {t("mapping.editDrawerTitle")}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("mapping.editDrawerSubtitle")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            icon={X}
            onClick={handleClose}
            aria-label="Close"
            className="!h-auto !w-auto !p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          />
        </div>

        {/* ================= KPI INFORMATION CARD ================= */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${kpi.defaultColor || "#2563EB"}18`,
              borderColor: `${kpi.defaultColor || "#2563EB"}30`,
              color: kpi.defaultColor || "#2563EB",
            }}
          >
            <DynamicLucideIcon name={kpi.defaultIcon} className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-gray-900 tracking-wide font-mono">
              {kpi.kpiCode}
            </div>
            <div className="text-sm text-gray-500 truncate mt-0.5">
              {kpi.defaultTitle}
            </div>
          </div>
        </div>

        {/* ================= STATUS TOGGLE SECTION ================= */}
        <StatusToggleSection
          isEdit={true}
          isActive={isActive}
          handleToggleStatus={() => setIsActive((prev) => !prev)}
          t={t}
          tCommon={tCommon}
        />

        <div className="border border-blue-100 bg-[#F4F8FF]/60 rounded-2xl p-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: Department */}
            <div className="relative z-20">
              <SearchSelect
                id="edit-mapping-department"
                name="departmentId"
                label={t("mapping.department")}
                required
                options={departmentOptions}
                value={selectedDeptId}
                onChange={(_name, val) => setSelectedDeptId(val)}
                placeholder={t("mapping.selectDepartment")}
                className="w-full text-sm"
              />
            </div>

            {/* Field 2: Display Order */}
            <div>
              <Input
                label={t("mapping.displayOrder")}
                required
                type="number"
                min={1}
                max={999}
                maxLength={3}
                placeholder={t("mapping.displayOrderPlaceholder")}
                value={displayOrder}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setDisplayOrder(val);
                }}
                onInput={(e) => {
                  if (e.currentTarget.value.length > 3) {
                    e.currentTarget.value = e.currentTarget.value.slice(0, 3);
                  }
                }}
                onKeyDown={(e) => {
                  if (/^[eE+\-.,]$/.test(e.key)) e.preventDefault();
                }}
                fullWidth
              />
            </div>
          </div>
          
        </div>
      </div>
    </Drawer>
  );
}

export default GisDepartmentMappingEditDrawer;
