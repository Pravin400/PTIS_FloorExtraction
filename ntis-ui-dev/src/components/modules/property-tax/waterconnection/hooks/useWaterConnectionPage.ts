import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import type { WaterConnection, WaterConnectionPageData } from "@/types/water-connection.types";
import {
  deleteWaterConnectionAction,
  getWaterConnectionsOnlyAction,
  getAllWaterConnectionsAction,
} from "@/app/[locale]/property-tax/waterconnection/action";

function computeStats(connections: WaterConnection[]) {
  const active = connections.filter((c) => c.isActive);
  return {
    totalConnections: connections.length,
    activeConnections: active.length,
    stoppedConnections: connections.length - active.length,
    yearlyRevenue: connections.reduce((sum, c) => sum + (c.applicableCharges ?? 0), 0),
  };
}

interface UseWaterConnectionPageProps {
  initialData: WaterConnectionPageData;
  propertyId: number;
  initialPage: number;
  initialPageSize: number;
}

export function useWaterConnectionPage({
  initialData,
  propertyId,
  initialPage,
  initialPageSize,
}: UseWaterConnectionPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pageData, setPageData] = useState<WaterConnectionPageData>(initialData);
  const [loading, setLoading] = useState(false);
  const [allConnections, setAllConnections] = useState<WaterConnection[]>(initialData.connections);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // URL sync without full reload
  const updateUrl = useCallback(
    (newPage: number, newPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      params.set("pageSize", String(newPageSize));
      router.replace(`/${locale}/property-tax/waterconnection?${params.toString()}`, {
        scroll: false,
      });
    },
    [locale, searchParams, router]
  );

  // Fetch all connections for stats
  useEffect(() => {
    const fetchAllConnections = async () => {
      try {
        const connections = await getAllWaterConnectionsAction(propertyId);
        setAllConnections(connections);
      } catch {
        // Silently fail for stats — table will still work
      }
    };
    fetchAllConnections();
  }, [propertyId]);

  const refreshAllConnections = useCallback(async () => {
    try {
      const connections = await getAllWaterConnectionsAction(propertyId);
      setAllConnections(connections);
    } catch {
      // Silently fail for stats — table will still work
    }
  }, [propertyId]);

  // Fast client-side fetch (connections only)
  const fetchConnections = useCallback(
    async (newPage: number, newPageSize: number) => {
      setLoading(true);
      try {
        const result = await getWaterConnectionsOnlyAction(propertyId, newPage, newPageSize);
        setPageData((prev) => ({
          ...prev,
          connections: result.connections,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          pageNumber: result.pageNumber,
          pageSize: result.pageSize,
        }));
      } catch {
        toast.error("Failed to fetch connections");
      } finally {
        setLoading(false);
      }
    },
    [propertyId]
  );

  // Pagination handlers
  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
      updateUrl(p, pageSize);
      fetchConnections(p, pageSize);
    },
    [pageSize, updateUrl, fetchConnections]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPage(1);
      setPageSize(size);
      updateUrl(1, size);
      fetchConnections(1, size);
    },
    [updateUrl, fetchConnections]
  );

  // Refresh after save
  const handleSaved = useCallback(() => {
    setPage(1);
    fetchConnections(1, pageSize);
    refreshAllConnections();
  }, [fetchConnections, refreshAllConnections, pageSize]);

  // Navigate back to PTIS
  const handleBackToPtis = useCallback(() => {
    const params = new URLSearchParams();
    const wardNo = searchParams.get("wardNo") || "";
    const wardId = searchParams.get("wardId") || "";
    const propertyNo = searchParams.get("propertyNo") || "";
    const partitionNo = searchParams.get("partitionNo") || "";
    const returnTab = searchParams.get("returnTab") || "";

    if (propertyId) params.set("propertyId", String(propertyId));
    if (wardNo) params.set("wardNo", wardNo);
    if (wardId) params.set("wardId", wardId);
    if (propertyNo) params.set("propertyNo", propertyNo);
    if (partitionNo) params.set("partitionNo", partitionNo);
    if (returnTab) params.set("tab", returnTab);

    router.push(`/${locale}/property-tax/ptis?${params}`);
  }, [propertyId, searchParams, router, locale]);

  // Delete handler
  const handleDelete = useCallback(
    async (connection: WaterConnection, onSuccess?: () => void) => {
      const result = await deleteWaterConnectionAction(connection.id);
      if (result.ok) {
        toast.success("Connection deleted successfully");
        const targetPage =
          pageData.connections.length === 1 && page > 1 ? page - 1 : page;
        if (targetPage !== page) {
          setPage(targetPage);
          updateUrl(targetPage, pageSize);
        }
        await fetchConnections(targetPage, pageSize);
        refreshAllConnections();
        onSuccess?.();
      } else {
        toast.error(result.error ?? "Failed to delete connection");
      }
    },
    [page, pageSize, pageData.connections.length, updateUrl, fetchConnections, refreshAllConnections]
  );

  const stats = useMemo(() => computeStats(allConnections), [allConnections]);
  const totalPages = pageData.totalPages ?? Math.max(1, Math.ceil(pageData.totalCount / pageSize));

  return {
    pageData,
    loading,
    page,
    pageSize,
    totalPages,
    stats,
    handlePageChange,
    handlePageSizeChange,
    handleSaved,
    handleBackToPtis,
    handleDelete,
  };
}
