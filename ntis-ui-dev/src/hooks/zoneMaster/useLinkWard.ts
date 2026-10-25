import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { WardItem } from "@/types/wardMaster.types";
import { ZoneItem } from "@/types/zoneMaster.types";
import { getAllWardsForLinkAction, linkWardsToZoneAction } from "@/app/[locale]/property-tax/zone-master/actions";

interface UseLinkWardProps {
  open: boolean;
  selectedZoneId: number | null;
  ssrSelectedWards: WardItem[];
  zones: ZoneItem[];
  ssrAllZones: ZoneItem[];
  onWardsChanged?: () => void;
  onClose: () => void;
  zoneAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}

export function useLinkWard({
  open,
  selectedZoneId,
  ssrSelectedWards,
  zones,
  ssrAllZones,
  onWardsChanged,
  onClose,
  zoneAlias,
  wardAlias,
  wardsAlias,
  t,
}: UseLinkWardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [checkedAvailable, setCheckedAvailable] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [isSelectAllActive, setIsSelectAllActive] = useState(false);
  const hasInitialized = useRef(false);
  const prevOpen = useRef(open);

  const [isPending, startTransition] = useTransition();

  const [zoneSearchTerm, setZoneSearchTerm] = useState("");
  const [viewAllSearchTerm, setViewAllSearchTerm] = useState("");

  const zonePage = Number(searchParams.get("zonewardpage")) || 1;
  const zonePageSize = Number(searchParams.get("zonewardpagesize")) || 10;

  const viewWardPage = Number(searchParams.get("viewwardpage")) || 1;
  const viewWardPageSize = Number(searchParams.get("viewwardpagesize")) || 10;
  
  const initialViewWardSearch = searchParams.get("viewwardq") || "";

  // Zone options for SearchSelect
  const zoneOptions = useMemo(() => {
    const allZones = [...zones, ...ssrAllZones];
    const uniqueZones = Array.from(
      new Map<number, ZoneItem>(allZones.map(z => [z.id, z])).values()
    );
    return uniqueZones.map(zone => ({
      label: zone.description && zone.description !== zone.zoneNo
        ? `${zone.zoneNo} - ${zone.description}`
        : zone.zoneNo,
      value: String(zone.id),
    }));
  }, [zones, ssrAllZones]);

  // Helper to get zone display label
  const getZoneDisplayLabel = useCallback((zoneId: number | undefined | null): string | null => {
    if (zoneId === undefined || zoneId === null || zoneId === 0) return null;
    const allZones = [...zones, ...ssrAllZones];
    const zone = allZones.find(z => z.id === zoneId);
    if (!zone) return null;
    const description = zone.description || zone.zoneNo || "";
    const zoneNo = zone.zoneNo || "";
    if (description && zoneNo && description !== zoneNo) {
      return `${description} (${zoneNo})`;
    }
    return zoneNo || description;
  }, [zones, ssrAllZones]);

  // Check if ward is assigned to a zone
  const isWardAssigned = useCallback((ward: WardItem): boolean => {
    return ward.zoneId !== undefined && ward.zoneId !== null && ward.zoneId > 0;
  }, []);

  // Filter zone wards (client-side)
  const zoneWardsRaw = useMemo(() => {
    let wards = ssrSelectedWards;
    if (zoneSearchTerm) {
      const term = zoneSearchTerm.toLowerCase();
      wards = wards.filter(w =>
        w.wardNo.toLowerCase().includes(term) ||
        (w.description && w.description.toLowerCase().includes(term))
      );
    }
    return wards;
  }, [ssrSelectedWards, zoneSearchTerm]);

  // Paginate Zone Wards
  const zoneWards = useMemo(() => zoneWardsRaw, [zoneWardsRaw]);
  const totalZonePages = Math.ceil(zoneWards.length / zonePageSize) || 1;
  const paginatedZoneWards = useMemo(() => {
    const start = (zonePage - 1) * zonePageSize;
    const end = start + zonePageSize;
    return zoneWards.slice(start, end);
  }, [zoneWards, zonePage, zonePageSize]);

  // Handle zone selection change
  const handleZoneChange = (_name: string | undefined, value: string) => {
    const zoneId = Number(value);
    if (!zoneId || isNaN(zoneId)) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("zoneId", String(zoneId));
    params.set("zonewardpage", "1");
    if (!params.has("zonewardpagesize")) {
      params.set("zonewardpagesize", String(zonePageSize));
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  // Initialize states when drawer opens (only once per open)
  useEffect(() => {
    if (open && !prevOpen.current) {
      hasInitialized.current = false;
    }
    prevOpen.current = open;

    if (open && !hasInitialized.current) {
      hasInitialized.current = true;
      setCheckedAvailable(new Set());
      setViewAllSearchTerm(initialViewWardSearch);
      setZoneSearchTerm("");
      setIsSelectAllActive(false);
    }
  }, [open, initialViewWardSearch]);

  // Toggle checkbox in view wards list
  const toggleAvailableCheck = useCallback((wardNo: string) => {
    const isAlreadyInZone = ssrSelectedWards.some(w => w.wardNo === wardNo);
    
    if (isAlreadyInZone) {
      const zoneLabel = getZoneDisplayLabel(selectedZoneId);
      toast.warning(
        t("wardMessages.wardAlreadyInCurrentZone", {
          wardNo,
          ward: wardAlias,
          zoneLabel: zoneLabel || ""
        })
      );
      return;
    }

    setCheckedAvailable(prev => {
      const newChecked = new Set(prev);
      if (newChecked.has(wardNo)) {
        newChecked.delete(wardNo);
      } else {
        newChecked.add(wardNo);
      }
      return newChecked;
    });
  }, [ssrSelectedWards, selectedZoneId, getZoneDisplayLabel, wardAlias, t]);

  const handleSelectAllViewWards = useCallback((isChecked: boolean) => {
    setIsSelectAllActive(isChecked);
    if (!isChecked) {
      setCheckedAvailable(new Set());
    }
  }, []);

  const moveToSelected = async () => {
    if (!selectedZoneId) return;

    if (isSelectAllActive) {
      setLoading(true);
      setSelectAllLoading(true);
      try {
        const result = await getAllWardsForLinkAction(viewAllSearchTerm || undefined);
        if (!result.success || !result.data) {
          toast.error(result.error || t("wardMessages.fetchError", { wards: wardsAlias }));
          return;
        }
        
        const wardsToLink = result.data.filter(
          w => !ssrSelectedWards.some(zw => zw.wardNo === w.wardNo)
        );
        
        if (wardsToLink.length === 0) {
          const zoneLabel = getZoneDisplayLabel(selectedZoneId);
          toast.info(
            t("wardMessages.allWardsAlreadyInZone", {
              wards: wardsAlias,
              zone: zoneAlias,
              zoneLabel: zoneLabel || ""
            })
          );
          return;
        }

        const linkResult = await linkWardsToZoneAction(selectedZoneId, wardsToLink.map(w => w.wardNo));

        if (linkResult.success) {
          if (linkResult.data?.failedCount && linkResult.data.failedCount > 0) {
            toast.warning(
              t("wardMessages.partialSuccess", {
                ward: wardAlias,
                success: linkResult.data.successCount,
                failed: linkResult.data.failedCount,
              })
            );
          } else {
            toast.success(t("wardMessages.updateSuccess", { wards: wardsAlias }));
          }
          if (onWardsChanged) onWardsChanged();
          startTransition(() => {
            router.refresh();
          });
          setIsSelectAllActive(false);
          setCheckedAvailable(new Set());
        } else {
          toast.error(linkResult.error || t("wardMessages.updateError", { wards: wardsAlias }));
        }
      } catch {
        toast.error(t("wardMessages.updateError", { wards: wardsAlias }));
      } finally {
        setLoading(false);
        setSelectAllLoading(false);
      }
      return;
    }

    const toMove = Array.from(checkedAvailable);
    if (toMove.length === 0) return;

    setLoading(true);
    try {
      const result = await linkWardsToZoneAction(selectedZoneId, toMove);

      if (result.success) {
        if (result.data?.failedCount && result.data.failedCount > 0) {
          toast.warning(
            t("wardMessages.partialSuccess", {
              ward: wardAlias,
              success: result.data.successCount,
              failed: result.data.failedCount,
            })
          );
        } else {
          toast.success(t("wardMessages.updateSuccess", { wards: wardsAlias }));
        }
        if (onWardsChanged) onWardsChanged();
        startTransition(() => {
          router.refresh();
        });
        setCheckedAvailable(new Set());
      } else {
        toast.error(result.error || t("wardMessages.updateError", { wards: wardsAlias }));
      }
    } catch {
      toast.error(t("wardMessages.updateError", { wards: wardsAlias }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setCheckedAvailable(new Set());
    setZoneSearchTerm("");
    setViewAllSearchTerm("");
    setIsSelectAllActive(false);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("zonewardpage");
    params.delete("zonewardpagesize");
    router.replace(`${pathname}?${params.toString()}`);
    onClose();
  }, [onClose, searchParams, router, pathname]);

  const handleZoneSearch = useCallback((value: string) => {
    setZoneSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("zonewardpage", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleZonePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("zonewardpage", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleZonePageSizeChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("zonewardpagesize", newSize.toString());
    params.set("zonewardpage", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleViewAllSearch = useCallback((value: string) => {
    setViewAllSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("viewwardq", value);
    else params.delete("viewwardq");
    params.set("viewwardpage", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleViewPageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewwardpage", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleViewPageSizeChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewwardpagesize", newSize.toString());
    params.set("viewwardpage", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  return {
    checkedAvailable,
    loading,
    selectAllLoading,
    isSelectAllActive,
    zoneSearchTerm,
    viewAllSearchTerm,
    zonePage,
    zonePageSize,
    viewWardPage,
    viewWardPageSize,
    zoneOptions,
    getZoneDisplayLabel,
    isWardAssigned,
    paginatedZoneWards,
    handleZoneChange,
    toggleAvailableCheck,
    handleSelectAllViewWards,
    moveToSelected,
    handleClose,
    handleZoneSearch,
    handleZonePageChange,
    handleZonePageSizeChange,
    handleViewAllSearch,
    handleViewPageChange,
    handleViewPageSizeChange,
    totalZonePages,
    isPending,
  };
}
