'use client';
import type { InventoryLookups } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action";
import type { AssetsFacilitiesContentProps, ApiCategory, InventoryItemCategory } from "@/types/asset/municipal-Asset/new-add-new-asset";
import React from 'react';
import { Info, Plus, Briefcase } from 'lucide-react';
import { FiltersCard } from './FiltersCard';
import { SummaryCards } from './SummaryCards';
import { ConditionChart } from './ConditionChart';
import { AssetsFacilitiesTable } from './AssetsFacilitiesTable';
import { AddFacilityDrawer } from './AddFacilityDrawer';
import { NAInvoiceDrawer } from './NAInvoiceDrawer';
import { DocumentPreviewDrawer } from "@/components/modules/assets/shared/documentHelpers";
import { useAssetsFacilitiesContentState } from '@/hooks/asset-hooks/na-furniture-fixture/useAssetsFacilitiesContentState';
import { useSearchParams } from 'next/navigation';



const DEFAULT_EMPTY_INVENTORY_LOOKUPS: InventoryLookups = {
  categories: [],
  conditions: [],
  itemNames: [],
  itemModels: [],
  departments: [],
};

export function AssetsFacilitiesContent({
  parentAssetId,
  initialLookups,
  initialBatches,
  assetCategoryId,
}: AssetsFacilitiesContentProps) {
  const safeLookups: InventoryLookups = initialLookups || DEFAULT_EMPTY_INVENTORY_LOOKUPS;

  const {
    t,
    filters,
    setFilters,
    filteredRows,
    lookups,
    isDrawerOpen,
    setIsDrawerOpen,
    isInvoiceDrawerOpen,
    setIsInvoiceDrawerOpen,
    editingRow,
    form,
    setForm,
    invoiceForm,
    setInvoiceForm,
    photoInputRef,
    invoiceInputRef,
    selectedPreviewDoc,
    setSelectedPreviewDoc,
    previewFile,
    previewLoading,
    previewError,
    handlePreview,
    handleDownload,
    openDrawerForCreate,
    openDrawerForEdit,
    handlePhotoUpload,
    handleInvoiceUpload,
    handleSaveFacility,
    handleDeleteRow,
  } = useAssetsFacilitiesContentState({ parentAssetId: parentAssetId ?? null, initialLookups: safeLookups, initialBatches: initialBatches ?? null });

  const searchParams = useSearchParams();
  const resolvedAssetCategoryId = assetCategoryId || (searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined);

  const filteredCategories = React.useMemo(() => {
    const apiCategories = lookups?.categories || [];
    if (!apiCategories.length) return [];
    const matched = resolvedAssetCategoryId && resolvedAssetCategoryId > 0
      ? apiCategories.filter((cat: InventoryItemCategory) => {
          const catRecord = cat as unknown as Record<string, unknown>;
          const cAssetCatId = cat.assetCategoryId ?? (catRecord.AssetCategoryId as number | undefined);
          return cAssetCatId !== undefined && cAssetCatId !== null
            ? Number(cAssetCatId) === Number(resolvedAssetCategoryId)
            : true;
        })
      : apiCategories;
    return matched.length > 0 ? matched : apiCategories;
  }, [lookups?.categories, resolvedAssetCategoryId]);

  const hasAssetId = !!parentAssetId && parentAssetId > 0;

  return (
    <div className="min-h-full">
      {/* Top Section: Filters, Summary, Chart */}
      <div className="flex gap-4 mb-4">


        {/* Summary - Middle */}
        <div className="flex-1 min-w-0">
          <SummaryCards data={filteredRows} categories={filteredCategories} />
        </div>

        {/* Condition Chart - Right */}
        <div className="w-[320px] shrink-0">
          <ConditionChart data={filteredRows} />
        </div>
      </div>

      {!hasAssetId && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-[13px] font-semibold text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t("parentAssetIdWarning") || "Asset ID is not available. Before adding inventory or other equipment, please go to Step 1: Basic Information and save the asset details to generate an ID."}</span>
        </div>
      )}

      {/* Section Heading + Actions */}
      <div className="flex items-center justify-between mb-4 mt-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[16px] font-black text-[#101b87]">{t("assetsFacilitiesTitle") || "Assets & Facilities"}</h2>
          </div>
          <FiltersCard
            filters={filters}
            setFilters={setFilters}
            apiCategories={(lookups?.categories || []) as unknown as ApiCategory[]}
            apiConditions={lookups?.conditions || []}
            assetCategoryId={assetCategoryId}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openDrawerForCreate}
            disabled={!hasAssetId}
            className={`flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-blue-600 rounded-lg text-[12px] font-bold hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm ${!hasAssetId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-3.5 h-3.5" /> {t("addInventory") || "Add Inventory"}
          </button>
        </div>
      </div>

      {/* Table Section */}
      <AssetsFacilitiesTable
        data={filteredRows}
        onEdit={openDrawerForEdit}
        onDelete={handleDeleteRow}
        onPreview={handlePreview}
      />

      {/* Custom drawer to add/edit assets */}
      <AddFacilityDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        form={form}
        updateForm={(k, v) => setForm(prev => ({ ...prev, [k]: v }))}
        photoInputRef={photoInputRef}
        handlePhotoUpload={handlePhotoUpload}
        onSave={handleSaveFacility}
        onOpenInvoice={() => setIsInvoiceDrawerOpen(true)}
        categories={lookups?.categories || []}
        conditions={lookups?.conditions || []}
        itemNames={lookups?.itemNames || []}
        itemModels={lookups?.itemModels || []}
        departments={lookups?.departments || []}
        editingRow={editingRow}
        assetCategoryId={assetCategoryId}
        onPreview={(doc: unknown) => { const d = doc as { fileName?: string; documentGuid?: string }; setSelectedPreviewDoc({ name: d?.fileName || "Inventory Photo", fileName: d?.fileName, documentGuid: d?.documentGuid }); }}
        onDownload={(_doc: unknown) => handleDownload(editingRow!, "photo")}
      />

      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        className="hidden"
        accept="image/*"
      />

      <NAInvoiceDrawer
        open={isInvoiceDrawerOpen}
        onClose={() => setIsInvoiceDrawerOpen(false)}
        invoiceForm={invoiceForm}
        updateInvoiceForm={(k, v) => setInvoiceForm(prev => ({ ...prev, [k]: v }))}
        invoiceInputRef={invoiceInputRef}
        handleInvoiceUpload={handleInvoiceUpload}
        saveInvoiceDetails={() => setIsInvoiceDrawerOpen(false)}
        editingRow={editingRow}
        onPreview={(doc: unknown) => { const d = doc as { fileName?: string; documentGuid?: string }; setSelectedPreviewDoc({ name: d?.fileName || "Inventory Invoice", fileName: d?.fileName, documentGuid: d?.documentGuid }); }}
        onDownload={(_doc: unknown) => handleDownload(editingRow!, "invoice")}
      />

      <DocumentPreviewDrawer
        selectedDocument={selectedPreviewDoc}
        loadedFile={previewFile}
        isLoadingFile={previewLoading}
        fileError={previewError}
        onClose={() => setSelectedPreviewDoc(null)}
        onDownload={() => {
          if (selectedPreviewDoc?.documentGuid) {
            handleDownload(editingRow!, 'invoice');
          }
        }}
      />

      {isInvoiceDrawerOpen && (
        <style>{`
          .drawer-instance:has(~ .fixed.drawer-instance) {
            filter: blur(6px) brightness(0.7) !important;
            pointer-events: none;
            transition: all 0.3s ease-in-out;
          }
        `}</style>
      )}
    </div>
  );
}
