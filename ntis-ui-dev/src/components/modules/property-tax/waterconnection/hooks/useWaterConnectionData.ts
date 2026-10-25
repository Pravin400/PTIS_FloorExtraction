import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { WaterConnection, WaterConnectionPageData } from "@/types/water-connection.types";
import {
  getWaterConnectionPageData,
  deleteWaterConnectionAction,
  getWaterConnectionsOnlyAction,
  getAllWaterConnectionsAction,
} from "@/app/[locale]/property-tax/waterconnection/action";

const INITIAL_PAGE = 1;
const INITIAL_PAGE_SIZE = 10;

function computeStats(connections: WaterConnection[]) {
  const active = connections.filter((c) => c.isActive);
  return {
    totalConnections: connections.length,
    activeConnections: active.length,
    stoppedConnections: connections.length - active.length,
    yearlyRevenue: connections.reduce((sum, c) => sum + (c.applicableCharges ?? 0), 0),
  };
}

interface UseWaterConnectionDataProps {
  propertyId: number | null;
  open: boolean;
}

export function useWaterConnectionData({ propertyId, open }: UseWaterConnectionDataProps) {
  const [pageData, setPageData] = useState<WaterConnectionPageData | null>(null);
  const [allConnections, setAllConnections] = useState<WaterConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [page, setPage] = useState(INITIAL_PAGE);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);

  // Initial data fetch
  useEffect(() => {
    if (!open || !propertyId) {
      Promise.resolve().then(() => {
        setPageData(null);
        setAllConnections([]);
        setPage(INITIAL_PAGE);
        setPageSize(INITIAL_PAGE_SIZE);
      });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      setInitialLoading(true);
    });

    getWaterConnectionPageData(propertyId, INITIAL_PAGE, INITIAL_PAGE_SIZE)
      .then((data) => {
        if (!cancelled) {
          setPageData(data);
          setAllConnections(data.connections);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load water connection data.");
        }
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, propertyId]);

  // Fetch all connections (for stats)
  const refreshAllConnections = useCallback(async () => {
    if (!propertyId) return;
    try {
      const connections = await getAllWaterConnectionsAction(propertyId);
      setAllConnections(connections);
    } catch {
      // Silently fail — table still works
    }
  }, [propertyId]);

  // Paged connections fetch
  const fetchConnections = useCallback(
    async (newPage: number, newPageSize: number) => {
      if (!propertyId) return;
      setLoading(true);
      try {
        const result = await getWaterConnectionsOnlyAction(propertyId, newPage, newPageSize);
        setPageData((prev) =>
          prev
            ? {
                ...prev,
                connections: result.connections,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
                pageNumber: result.pageNumber,
                pageSize: result.pageSize,
              }
            : prev
        );
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
      fetchConnections(p, pageSize);
    },
    [pageSize, fetchConnections]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPage(1);
      setPageSize(size);
      fetchConnections(1, size);
    },
    [fetchConnections]
  );

  // Refresh after save
  const handleSaved = useCallback(() => {
    setPage(1);
    fetchConnections(1, pageSize);
    refreshAllConnections();
  }, [fetchConnections, refreshAllConnections, pageSize]);

  // Delete handler
  const handleDelete = useCallback(
    async (connection: WaterConnection, onSuccess?: () => void) => {
      const result = await deleteWaterConnectionAction(connection.id);
      if (result.ok) {
        toast.success("Connection deleted successfully");
        const targetPage =
          pageData && pageData.connections.length === 1 && page > 1 ? page - 1 : page;
        if (targetPage !== page) setPage(targetPage);
        await fetchConnections(targetPage, pageSize);
        refreshAllConnections();
        onSuccess?.();
      } else {
        toast.error(result.error ?? "Failed to delete connection");
      }
    },
    [page, pageSize, pageData, fetchConnections, refreshAllConnections]
  );

  const stats = useMemo(() => computeStats(allConnections), [allConnections]);
  const totalPages = pageData
    ? pageData.totalPages ?? Math.max(1, Math.ceil(pageData.totalCount / pageSize))
    : 1;

  return {
    pageData,
    loading,
    initialLoading,
    page,
    pageSize,
    totalPages,
    stats,
    handlePageChange,
    handlePageSizeChange,
    handleSaved,
    handleDelete,
  };
}
