"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Layers, ArrowRight, CheckCircle2, Database } from "lucide-react";
import { PageContainer } from "@/components/common/PageContainer";
import { MasterTable } from "@/components/common/MasterTable";
import { SearchInput } from "@/components/common/SearchInput";
import { DeleteButton, EditButton, AddButton, OkButton } from "@/components/common/ActionButtons";
import { Button } from "@/components/common/ActionButton";
import TableHeader from "@/components/common/TableHeader";
import { Modal } from "@/components/common/Modal";
import { ChargeHeadForm } from "./ChargeHeadForm";
import { useChargeHeads } from "@/hooks/water-bill/charge-heads/useChargeHeads";
import type { ChargeHead, ChargeHeadsProps } from "@/types/water-bill/chargeHeads.types";

export type { ChargeHeadsProps };

export const CHARGE_HEAD_PAGE_SIZE_OPTIONS: number[] = [5, 10, 20, 50];

export function ChargeHeads(props: ChargeHeadsProps) {
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const t = useTranslations("chargeHeads");
  const tCommon = useTranslations("common");
  const { drawer = null, initialEditingData = null } = props;

  const {
    search,
    records,
    columns,
    isPending,
    isSubmitting,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    activeDrawer,
    editingData,
    handleSearchChange,
    handleSearchSubmit,
    handlePageChange,
    handlePageSizeChange,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSubmit,
  } = useChargeHeads(props);


  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Page Header */}
        <TableHeader
          title={t("list.title")}
          subtitle={t("list.subtitle")}
          icon={Database}
        />

        {/* Master Table Section */}
        <MasterTable<ChargeHead>
          columns={columns}
          data={records}
          loading={isPending}
          height="lg"
          getRowKey={(row, idx) =>
            row?.id && Number(row.id) > 0
              ? String(row.id)
              : row?.chargeHeadCode || row?.code
              ? `${row.chargeHeadCode || row.code}-${idx}`
              : `charge-head-${idx}`
          }
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          pageSizeOptions={CHARGE_HEAD_PAGE_SIZE_OPTIONS}
          headerExtra={
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                onEnter={handleSearchSubmit}
                placeholder={t("list.filters.search")}
                className="mb-0 min-w-48 text-gray-900"
              />
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={BookOpen} onClick={() => setIsUserManualOpen(true)}>
                  {tCommon("buttons.userManual")}
                </Button>
                <AddButton label={t("list.buttons.add")} onClick={handleAdd} />
              </div>
            </div>
          }
          renderActions={(row) => (
            <>
              <EditButton
                aria-label={tCommon("table.actions.edit")}
                onClick={() => handleEdit(row)}
              />
              <DeleteButton
                aria-label={tCommon("table.actions.delete")}
                onClick={() => handleDelete(row)}
              />
            </>
          )}
          actionLabel={tCommon("table.columns.actions")}
        />
      </div>

      {/* Add / Edit Form Drawer */}
      <ChargeHeadForm
        open={activeDrawer !== null || drawer !== null}
        initialData={editingData || initialEditingData}
        isSubmitting={isSubmitting}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      {/* User Manual Modal */}
      <Modal
        open={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>{t("userManualModal.title")}</span>
          </div>
        }
        maxWidth="lg"
        footer={<OkButton onClick={() => setIsUserManualOpen(false)} />}
      >
        <div className="space-y-5 text-slate-700 text-sm">
          <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-medium">
            {t("userManualModal.intro")}
          </p>

          <div className="bg-blue-50/50 border border-blue-100/80 rounded-xl p-4">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-1 bg-white border border-blue-200/80 rounded-lg p-3 flex items-start gap-2.5 shadow-2xs">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900">{t("userManualModal.card1.title")}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{t("userManualModal.card1.subtitle")}</div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />

              <div className="flex-1 bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-3 flex items-start gap-2.5 shadow-2xs">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-emerald-950">{t("userManualModal.card2.title")}</div>
                  <div className="text-[11px] text-emerald-700 font-medium">{t("userManualModal.card2.subtitle")}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                1
              </span>
              <p className="leading-normal">
                <strong className="font-semibold text-slate-900">{t("userManualModal.point1.title")}</strong> – {t("userManualModal.point1.text")}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                2
              </span>
              <p className="leading-normal">
                <strong className="font-semibold text-slate-900">{t("userManualModal.point2.title")}</strong> – {t("userManualModal.point2.text")}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                3
              </span>
              <p className="leading-normal">
                <strong className="font-semibold text-slate-900">{t("userManualModal.point3.title")}</strong> – {t("userManualModal.point3.text")}
              </p>
            </div>
          </div>

          <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-3 text-xs text-amber-900 leading-relaxed font-medium">
            {t("userManualModal.note")}
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
