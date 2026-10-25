"use client";

import React, { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Link2,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  Input,
  Select,
  type Option,
  Button,
  CancelButton,
  SaveButton,
  EditButton,
  DeleteButton,
} from "@/components/common";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { GisKpiMaster, GisDepartmentKpiMapping } from "@/types/gis-master/gis-kpi-master.types";
import type { DepartmentMaster } from "@/types/departmentMaster.types";
import {
  createGisDepartmentKpiMappingAction,
  deleteGisDepartmentKpiMappingAction,
  fetchAvailableDepartmentsAction,
} from "@/app/[locale]/configuration-settings/gis-master/gis-kpi-master/action";
import { logger } from "@/lib/utils/logger";
import { DynamicLucideIcon } from "./constants";

interface GisKpiMappingDrawerProps {
  open: boolean;
  onClose: () => void;
  kpi: GisKpiMaster | null;
  onMappingChange?: () => void;
}

export function GisKpiMappingDrawer({
  open,
  onClose,
  kpi,
  onMappingChange,
}: GisKpiMappingDrawerProps): React.ReactElement | null {
  const t = useTranslations("gisKpiMaster");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [, startTransition] = useTransition();

  const [departments, setDepartments] = useState<DepartmentMaster[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const [localMappings, setLocalMappings] = useState<GisDepartmentKpiMapping[]>(
    () => kpi?.mappedDepartments ?? []
  );

  const [isSaving, setIsSaving] = useState(false);

  // Load available departments once when the drawer opens
  useEffect(() => {
    let isMounted = true;
    if (!open) return;

    async function loadDepartments() {
      setIsLoadingDepts(true);
      try {
        const depts = await fetchAvailableDepartmentsAction();
        if (isMounted) {
          setDepartments(depts);
        }
      } catch (err) {
        logger.error("Failed to load departments", {
          error: err instanceof Error ? err : new Error(String(err)),
        });
      } finally {
        if (isMounted) {
          setIsLoadingDepts(false);
        }
      }
    }

    loadDepartments();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Sync state during render whenever selected KPI changes or drawer opens
  const [prevSyncKey, setPrevSyncKey] = useState<string | null>(() =>
    kpi && open ? `${kpi.id}-${open}` : null
  );

  const currentSyncKey = kpi && open ? `${kpi.id}-${open}` : null;
  if (currentSyncKey !== prevSyncKey) {
    setPrevSyncKey(currentSyncKey);
    if (kpi && open) {
      const existing = kpi.mappedDepartments ?? [];
      setLocalMappings(existing);
      setDisplayOrder("");
      setIsActive(true);
      setSelectedDeptId("");
    }
  }

  // Department Select Options
  const departmentOptions: Option[] = useMemo(() => {
    return [
      {
        value: "",
        label: isLoadingDepts ? t("mapping.loadingDepartments") : t("mapping.selectDepartment"),
      },
      ...departments.map((dept) => {
        const isMapped = localMappings.some(
          (m) => Number(m.departmentId) === dept.departmentId && m.isActive !== false
        );
        return {
          value: String(dept.departmentId),
          label: isMapped ? `${dept.departmentName} — ${t("mapping.alreadyMapped")}` : dept.departmentName,
          disabled: isMapped,
        };
      }),
    ];
  }, [departments, localMappings, isLoadingDepts, t]);

  // Navigate to SSR edit page for the department mapping
  const handleEditMapping = useCallback(
    (mapping: GisDepartmentKpiMapping) => {
      onClose();
      startTransition(() => {
        router.push(
          `/${locale}/configuration-settings/gis-master/gis-kpi-master/mapping/edit/${mapping.id}`
        );
      });
    },
    [router, locale, onClose]
  );

  // Validate and submit mapping
  const handleSave = useCallback(
    async (addAnother: boolean) => {
      if (!kpi) return;

      const deptIdNum = parseInt(selectedDeptId, 10);
      if (!selectedDeptId || !Number.isFinite(deptIdNum) || deptIdNum <= 0) {
        toast.error(t("mapping.selectDepartment"));
        return;
      }

      // Check duplicate
      const alreadyMapped = localMappings.some(
        (m) => Number(m.departmentId) === deptIdNum && m.isActive !== false
      );
      if (alreadyMapped) {
        toast.error(t("mapping.alreadyMapped"));
        return;
      }

      setIsSaving(true);
      try {
        const payload = {
          departmentId: deptIdNum,
          kpiMasterId: kpi.id,
          customTitle: null,
          customIcon: null,
          customColor: null,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        };

        const result = await createGisDepartmentKpiMappingAction(payload);
        if (result.success && result.data) {
          const selectedDept = departments.find((d) => d.departmentId === deptIdNum);
          const newMapping: GisDepartmentKpiMapping = {
            ...result.data,
            departmentId: deptIdNum,
            departmentName: selectedDept?.departmentName ?? `Department ${deptIdNum}`,
            customTitle: null,
            customIcon: null,
            customColor: null,
            displayOrder: payload.displayOrder,
            isActive: payload.isActive,
          };

          const nextList = [...localMappings, newMapping];
          setLocalMappings(nextList);

          const successMsg = `Department "${newMapping.departmentName}" mapped to ${kpi.kpiCode} successfully`;
          toast.success(successMsg);

          onMappingChange?.();

          if (addAnother) {
            setSelectedDeptId("");
            setDisplayOrder("");
            setIsActive(true);
          } else {
            onClose();
          }
        } else {
          toast.error(result.message || "Failed to save department mapping");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save department mapping";
        toast.error(msg);
      } finally {
        setIsSaving(false);
      }
    },
    [
      kpi,
      selectedDeptId,
      displayOrder,
      isActive,
      localMappings,
      departments,
      onMappingChange,
      onClose,
      t,
    ]
  );

  const handleDeleteMapping = useCallback(
    (mapping: GisDepartmentKpiMapping) => {
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
          try {
            const result = await deleteGisDepartmentKpiMappingAction(mapping.id);
            if (result.success) {
              setLocalMappings((prev) => prev.filter((m) => m.id !== mapping.id));
              toast.success(t("success.deleted", { code: deptName }));
              onMappingChange?.();
            } else {
              toast.error(result.message || tCommon("errors.deleteError"));
            }
          } catch {
            toast.error(tCommon("errors.deleteError"));
          }
        },
      });
    },
    [confirm, onMappingChange, t, tCommon]
  );

  if (!kpi) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      hideHeader
      width="lg"
      className="md:!w-[580px]"
      footer={
        <div className="w-full flex items-center justify-between">
          <CancelButton
            label={t("mapping.mapLater")}
            onClick={onClose}
            disabled={isSaving}
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              icon={Plus}
              disabled={isSaving}
              onClick={() => handleSave(true)}
            >
              {t("mapping.saveAndAddAnother")}
            </Button>
            <SaveButton
              size="md"
              label={t("mapping.saveMapping")}
              isLoading={isSaving}
              disabled={isSaving}
              onClick={() => handleSave(false)}
            />
          </div>
        </div>
      }
    >
      {/* ================= HEADER ================= */}
      <div className="px-6 py-5 border-b border-blue-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Link2 className="w-6 h-6 rotate-45" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-900 tracking-tight leading-tight">
              {t("mapping.drawerTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {kpi.defaultTitle
                ? `${kpi.defaultTitle} was saved. Choose where this card appears.`
                : "Choose where this card appears."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          icon={X}
          onClick={onClose}
          aria-label="Close"
          className="!h-auto !w-auto !p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        />
      </div>

      <div className="p-6 space-y-6">


        {/* ================= KPI INFORMATION CARD ================= */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 border"
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
            <div>
              <Select
                label={t("mapping.department")}
                required
                options={departmentOptions}
                value={selectedDeptId}
                onChange={(_, val) => setSelectedDeptId(val)}
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
        {/* ================= EXISTING MAPPINGS LIST ================= */}
        {localMappings.length > 0 && (
          <div className="bg-white border border-blue-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span>{t("mapping.mappedDepartments", { count: localMappings.length })}</span>
            </div>
            <div className="space-y-2">
              {localMappings.map((mapping) => {
                const mappingColor = mapping.customColor || kpi.defaultColor || "#2563EB";
                return (
                  <div
                    key={`${mapping.departmentId}-${mapping.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${mappingColor}15`,
                          borderColor: `${mappingColor}30`,
                          color: mappingColor,
                        }}
                      >
                        <DynamicLucideIcon
                          name={mapping.customIcon || kpi.defaultIcon}
                          className="w-3.5 h-3.5"
                        />
                      </span>
                      <span className="font-semibold text-gray-800">
                        {mapping.departmentName || `Department ${mapping.departmentId}`}
                      </span>
                      {mapping.customTitle && (
                        <span className="text-gray-500 italic">({mapping.customTitle})</span>
                      )}
                      <span className="text-gray-400 font-mono text-[11px]">
                        {t("mapping.order", { order: mapping.displayOrder ?? 1 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <EditButton
                        size="xs"
                        aria-label={tCommon("table.actions.edit") || "Edit mapping"}
                        title={tCommon("table.actions.edit") || "Edit mapping"}
                        onClick={() => handleEditMapping(mapping)}
                      />
                      <DeleteButton
                        size="xs"
                        aria-label={tCommon("table.actions.delete") || "Remove mapping"}
                        title={tCommon("table.actions.delete") || "Remove mapping"}
                        onClick={() => handleDeleteMapping(mapping)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default GisKpiMappingDrawer;
