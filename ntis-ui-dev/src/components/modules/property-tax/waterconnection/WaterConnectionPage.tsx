"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/common/Drawer";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Select } from "@/components/common";
import type { WaterConnection, WaterConnectionPageData, WaterConnectionFormModel } from "@/types/water-connection.types";
import { PropertyInfoCard } from "./PropertyInfoCard";
import { ConnectionsTable } from "./ConnectionsTable";
import { AddConnectionDrawer } from "./AddConnectionDrawer";
import { WaterConnectionStats } from "./WaterConnectionStats";
import { WaterConnectionDrawerTitle } from "./WaterConnectionDrawerTitle";
import { useWaterConnectionPage } from "./hooks/useWaterConnectionPage";

interface WaterConnectionPageProps {
  initialData: WaterConnectionPageData;
  propertyId: number;
  initialPage: number;
  initialPageSize: number;
  saveWaterConnectionAction: (data: WaterConnectionFormModel) => Promise<{ ok: boolean; error?: string }>;
}

export default function WaterConnectionPage({
  initialData,
  propertyId,
  initialPage,
  initialPageSize,
  saveWaterConnectionAction,
}: WaterConnectionPageProps) {
  const t = useTranslations("waterConnection");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

  // Use custom hook for page state and logic
  const {
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
    handleDelete: deleteConnection,
  } = useWaterConnectionPage({ initialData, propertyId, initialPage, initialPageSize });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<WaterConnection | null>(null);

  /* ================= ADD / EDIT / CLOSE ================= */
  const handleAdd = useCallback(() => {
    setEditingConnection(null);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((connection: WaterConnection) => {
    setEditingConnection(connection);
    setDrawerOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDrawerOpen(false);
    setEditingConnection(null);
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = useCallback(
    (connection: WaterConnection) => {
      confirm({
        variant: "delete",
        meta: { name: connection.connectionNo },
        onConfirm: async () => {
          await deleteConnection(connection);
        },
      });
    },
    [confirm, deleteConnection]
  );

  return (
    <Drawer
      open={true}
      onClose={handleBackToPtis}
      title={
        <WaterConnectionDrawerTitle
          title={t("page.title")}
          subtitle={t("page.subtitle")}
          propertyNo={pageData.property.propertyNo}
        />
      }
      width="xl"
    >
      <div className="space-y-3 p-3">
        {/* Stats — compact row */}
        <WaterConnectionStats
          stats={stats}
          labels={{
            total: t("stats.totalConnections"),
            active: t("stats.activeConnections"),
            stopped: t("stats.stoppedConnections"),
            revenue: t("stats.yearlyRevenue"),
          }}
        />

        {/* Property Info */}
        <PropertyInfoCard
          property={pageData.property}
          labels={{
            owner: t("property.owner"),
            contact: t("property.contact"),
            email: t("property.email"),
            address: t("property.address"),
            propertyNo: t("property.propertyNo"),
            zone: t("property.zone"),
            ward: t("property.ward"),
            buildingType: t("property.buildingType"),
          }}
        />

        {/* Connections Table */}
        <ConnectionsTable
          propertyNo={pageData.property.propertyNo}
          connections={pageData.connections}
          totalCount={pageData.totalCount}
          pageNumber={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          footerLeft={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {tCommon("table.showingEntries", {
                  start: pageData.totalCount === 0 ? 0 : (page - 1) * pageSize + 1,
                  end: Math.min(page * pageSize, pageData.totalCount),
                  total: pageData.totalCount,
                })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
                <Select
                  value={String(pageSize)}
                  onChange={(_e, value) => {
                    handlePageSizeChange(Number(value));
                  }}
                  options={[10, 20, 30, 50].map((s) => ({
                    label: String(s),
                    value: String(s),
                  }))}
                  selectSize="sm"
                  className="w-20"
                  ariaLabel={tCommon("table.rowsPerPage")}
                />
              </div>
            </div>
          }
        />
      </div>

      {/* Drawer for Add / Edit */}
      <AddConnectionDrawer
        open={drawerOpen}
        propertyId={propertyId}
        editingConnection={editingConnection}
        typeOptions={pageData.typeOptions}
        sizeOptions={pageData.sizeOptions}
        statusOptions={pageData.statusOptions}
        rateMasters={pageData.rateMasters}
        onClose={handleClose}
        onSaved={handleSaved}
        saveWaterConnectionAction={saveWaterConnectionAction}
      />
    </Drawer>
  );
}
