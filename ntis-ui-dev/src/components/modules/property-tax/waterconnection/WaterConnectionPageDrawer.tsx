"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/common/Drawer";
import { Select } from "@/components/common";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { PropertyInfoCard } from "./PropertyInfoCard";
import { ConnectionsTable } from "./ConnectionsTable";
import { AddConnectionDrawer } from "./AddConnectionDrawer";
import { WaterConnectionStats } from "./WaterConnectionStats";
import { WaterConnectionDrawerTitle } from "./WaterConnectionDrawerTitle";
import { useWaterConnectionData } from "./hooks/useWaterConnectionData";
import type { WaterConnection, WaterConnectionFormModel } from "@/types/water-connection.types";

interface WaterConnectionPageDrawerProps {
  open: boolean;
  propertyId: number | null;
  onClose: () => void;
  saveWaterConnectionAction: (data: WaterConnectionFormModel) => Promise<{ ok: boolean; error?: string }>;
}

export function WaterConnectionPageDrawer({
  open,
  propertyId,
  onClose,
  saveWaterConnectionAction,
}: WaterConnectionPageDrawerProps) {
  const t = useTranslations("waterConnection");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

  // Use custom hook for data management
  const {
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
    handleDelete: deleteConnection,
  } = useWaterConnectionData({ propertyId, open });

  // Add/Edit connection drawer state
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<WaterConnection | null>(null);

  /* =========== ADD / EDIT / CLOSE =========== */
  const handleAdd = useCallback(() => {
    setEditingConnection(null);
    setAddDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((connection: WaterConnection) => {
    setEditingConnection(connection);
    setAddDrawerOpen(true);
  }, []);

  const handleAddDrawerClose = useCallback(() => {
    setAddDrawerOpen(false);
    setEditingConnection(null);
  }, []);

  /* =========== DELETE =========== */
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

  /* =========== RENDER =========== */
  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <WaterConnectionDrawerTitle
            title={t("page.title")}
            subtitle={t("page.subtitle")}
            propertyNo={pageData?.property.propertyNo}
          />
        }
        width="xl"
      >
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-blue-600">
            <Loader2 size={36} className="animate-spin" />
            <span className="text-sm font-medium text-slate-500">{tCommon("actions.loading")}</span>
          </div>
        ) : pageData ? (
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

            {/* Property Info — full card with all fields */}
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
                      onChange={(_e, value) => handlePageSizeChange(Number(value))}
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
        ) : null}
      </Drawer>

      {/* Nested drawer for Add/Edit connection */}
      {pageData && (
        <AddConnectionDrawer
          open={addDrawerOpen}
          propertyId={propertyId!}
          editingConnection={editingConnection}
          typeOptions={pageData.typeOptions}
          sizeOptions={pageData.sizeOptions}
          statusOptions={pageData.statusOptions}
          rateMasters={pageData.rateMasters}
          saveWaterConnectionAction={saveWaterConnectionAction}
          onClose={handleAddDrawerClose}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
