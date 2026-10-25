'use client';
import { useTranslations } from "next-intl";
import type { AssetsFacilitiesTableProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import React from 'react';
import { Edit2, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrencyCompact, inventoryMeta } from '@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureConstants';
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '–';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}



function ConditionBadge({ condition }: { condition: string }) {
  const condLower = String(condition).toLowerCase();
  if (condLower.includes('good') || condLower.includes('नवीन')) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 border border-green-200">
        {condition}
      </span>
    );
  }
  if (condLower.includes('repair') || condLower.includes('fair')) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-600 border border-orange-200">
        {condition}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
      {condition}
    </span>
  );
}

export function AssetsFacilitiesTable({
  // component
 data, onEdit, onDelete, onPreview }: AssetsFacilitiesTableProps) {
  const t = useTranslations("newAddNewAsset");
    
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const totalCount = data.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedData = data.slice(startIndex, endIndex);

  return (
    <div>
      <div className="overflow-x-auto rounded-t-lg border-x border-t border-slate-200">
        <table className="w-full text-[12px] text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 [&>th]:border-r [&>th]:border-slate-200 [&>th:last-child]:border-r-0">
              <th className="px-4 py-1.5 font-black text-[#1c2aab] w-12 text-center whitespace-nowrap">{t("srNo") || "Sr. No."}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("category") || "Category"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("assetName") || "Asset Name"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("makeModel") || "Make / Model"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("specifications") || "Specifications"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("purchaseDate") || "Purchase Date"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("owningDepartment") || "Owning Department"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("condition") || "Condition"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("quantity") || "Quantity"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("unitValue") || "Unit Value (?)"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("total") || "Total (?)"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">CV</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("photo") || "Photo"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("invoice") || "Invoice"}</th>
              <th className="px-4 py-1.5 font-black text-[#1c2aab] text-center">{t("actions.title") || t("actionColumn") || "Actions"}</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedData.map((item, index) => {
              const meta = inventoryMeta[item.category as keyof typeof inventoryMeta];
              const categoryLabel = meta?.label || item.category;
              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/60 transition-colors [&>td]:border-r [&>td]:border-slate-100 [&>td:last-child]:border-r-0 ${
                    index < paginatedData.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <td className="px-4 py-1.5 text-[#1c2aab] font-bold text-center">{startIndex + index + 1}</td>
                  <td className="px-4 py-1.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${meta?.badgeClassName || "bg-gray-50 text-gray-700 border border-gray-200"}`}>
                      {categoryLabel}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-blue-600 hover:text-[#2435c2] hover:underline cursor-pointer font-bold text-center">{item.itemName}</td>
                  <td className="px-4 py-1.5 text-[#2435c2] font-semibold text-center">{item.modelName || "-"}</td>
                  <td className="px-4 py-1.5 text-[#2435c2] font-semibold text-center">
                    <div className="max-w-[150px] truncate mx-auto" title={item.specifications}>{item.specifications}</div>
                  </td>
                  <td className="px-4 py-1.5 text-[#2435c2] font-semibold text-center">{formatDate(item.purchaseDate)}</td>
                  <td className="px-4 py-1.5 text-[#2435c2] font-semibold text-center">{item.owningDepartment || '-'}</td>
                  <td className="px-4 py-1.5 text-center">
                    <ConditionBadge condition={item.condition} />
                  </td>
                  <td className="px-4 py-1.5 text-[#2435c2] font-semibold text-center">{item.quantity}</td>
                  <td className="px-4 py-1.5 text-[#2435c2] font-semibold text-center">{formatCurrencyCompact(Number(item.unitValue ?? 0))}</td>
                  <td className="px-4 py-1.5 text-blue-700 font-bold text-center">{formatCurrencyCompact(Number(item.total ?? 0))}</td>
                  <td className="px-4 py-1.5 text-emerald-600 font-bold text-center">{formatCurrencyCompact(Number(item.totalCV ?? 0))}</td>
                  <td className="px-4 py-1.5 text-center">
                    <div className="flex items-center justify-center">
                      {item.photoName ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPreview?.(item, 'photo'); }} 
                          className="text-blue-500 hover:text-blue-700 transition-colors p-1" 
                          title="View Photo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <div className="flex items-center justify-center">
                      {item.invoice?.invoiceNumber || item.invoice?.invoiceFileName || (item.documents && item.documents.some((d: { documentTypeId?: number | string; documentTypeCode?: string }) => d.documentTypeId === 2 || String(d.documentTypeCode || "").toLowerCase().includes("invoice"))) ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPreview?.(item, 'invoice'); }} 
                          className="text-amber-500 hover:text-amber-700 transition-colors p-1" 
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center justify-center gap-4">
                      <button 
                        onClick={() => onEdit?.(item)}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-1" 
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete?.(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border border-t-0 border-slate-200 rounded-b-lg">
        <span className="text-[12px] font-semibold text-slate-500">
          {t("showingEntries", { start: totalCount > 0 ? startIndex + 1 : 0, end: endIndex, total: totalCount })}
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select 
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 pl-3 pr-7 text-[12px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none appearance-none cursor-pointer"
            >
              <option value="10" className="text-[#1c2aab]">10</option>
              <option value="25" className="text-[#1c2aab]">25</option>
              <option value="50" className="text-[#1c2aab]">50</option>
            </select>
            <span className="text-[12px] font-semibold text-slate-500">{t("perPage") || "per page"}</span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 transition-colors" 
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-[12px] transition-colors ${
                  currentPage === i + 1 ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:text-blue-600 transition-colors"
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
