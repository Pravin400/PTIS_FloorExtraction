"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  fetchWardsByZoneAction,
  fetchSubzonesByMoujaAction,
  fetchDesignationsByDepartmentAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/[assetId]/basic-info/action";
import type { CascadeState } from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";
import type { Ward, SubZone, Designation } from "@/types/asset/municipal-Asset/new-add-new-asset/master-data.types";
import type { FormFieldChangeEvent } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";

import type { UseNACascadeDropdownsProps } from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";

export type { UseNACascadeDropdownsProps };

export function useNACascadeDropdowns({
  initialLookups,
  baseHandleChange,
  updateFormData,
}: UseNACascadeDropdownsProps) {
  const [wards, setWards] = useState<Ward[]>(initialLookups?.wards || []);
  const [subzones, setSubzones] = useState<SubZone[]>(initialLookups?.subzones || []);
  const [designations, setDesignations] = useState<Designation[]>(initialLookups?.designations || []);

  const activeZoneRef = useRef<string | number>("");
  const activeMoujaRef = useRef<string | number>("");
  const activeDepartmentRef = useRef<string | number>("");

  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isLoadingSubzones, setIsLoadingSubzones] = useState(false);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);

  const [prevWards, setPrevWards] = useState(initialLookups?.wards);
  if (initialLookups?.wards && initialLookups.wards !== prevWards) {
    setPrevWards(initialLookups.wards);
    if (initialLookups.wards.length > 0) {
      setWards(initialLookups.wards);
    }
  }

  const [prevSubzones, setPrevSubzones] = useState(initialLookups?.subzones);
  if (initialLookups?.subzones && initialLookups.subzones !== prevSubzones) {
    setPrevSubzones(initialLookups.subzones);
    if (initialLookups.subzones.length > 0) {
      setSubzones(initialLookups.subzones);
    }
  }

  const [prevDesignations, setPrevDesignations] = useState(initialLookups?.designations);
  if (initialLookups?.designations && initialLookups.designations !== prevDesignations) {
    setPrevDesignations(initialLookups.designations);
    if (initialLookups.designations.length > 0) {
      setDesignations(initialLookups.designations);
    }
  }

  const handleChange = useCallback(
    (e: FormFieldChangeEvent) => {
      const { name, value } = e.target;
      baseHandleChange(e);

      if (name === "zone") {
        activeZoneRef.current = value;
        updateFormData({ ward: "", wardId: "" });
        if (value) {
          setIsLoadingWards(true);
          fetchWardsByZoneAction(value)
            .then((res) => {
              if (activeZoneRef.current === value && res?.success && Array.isArray(res.data)) {
                setWards(res.data);
              }
            })
            .catch(() => {
              if (activeZoneRef.current === value) {
                toast.error("Failed to load wards for the selected zone. Please try again.");
              }
            })
            .finally(() => {
              if (activeZoneRef.current === value) {
                setIsLoadingWards(false);
              }
            });
        } else {
          setWards([]);
        }
      } else if (name === "mouja") {
        activeMoujaRef.current = value;
        updateFormData({ subzone: "", subZoneId: "" });
        if (value) {
          setIsLoadingSubzones(true);
          fetchSubzonesByMoujaAction(value)
            .then((res) => {
              if (activeMoujaRef.current === value && res?.success && Array.isArray(res.data)) {
                setSubzones(res.data);
              }
            })
            .catch(() => {
              if (activeMoujaRef.current === value) {
                toast.error("Failed to load sub-zones for the selected mouja. Please try again.");
              }
            })
            .finally(() => {
              if (activeMoujaRef.current === value) {
                setIsLoadingSubzones(false);
              }
            });
        } else {
          setSubzones([]);
        }
      } else if (name === "department") {
        activeDepartmentRef.current = value;
        updateFormData({ inChargeDesignation: "" });
        if (value) {
          setIsLoadingDesignations(true);
          fetchDesignationsByDepartmentAction(value)
            .then((res) => {
              if (activeDepartmentRef.current === value && res?.success && Array.isArray(res.data)) {
                setDesignations(res.data);
              }
            })
            .catch(() => {
              if (activeDepartmentRef.current === value) {
                toast.error("Failed to load designations for the selected department. Please try again.");
              }
            })
            .finally(() => {
              if (activeDepartmentRef.current === value) {
                setIsLoadingDesignations(false);
              }
            });
        } else {
          setDesignations([]);
        }
      }
    },
    [baseHandleChange, updateFormData]
  );

  const cascade: CascadeState = {
    wards,
    subzones,
    designations,
    isLoadingWards,
    isLoadingSubzones,
    isLoadingDesignations,
  };

  return { cascade, handleChange };
}
