'use client';

import { Edit2, Trash2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Badge, IconButton } from '@/components/common';
import type { Encumbrance } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";

interface EncumbranceTableProps {
  encumbrances: Encumbrance[];
  onAdd: () => void;
  onEdit: (enc: Encumbrance) => void;
  onDelete: (id: number) => void;
}

function StatusBadge({ status, activeLabel, pendingLabel }: { status: 'Active' | 'Pending'; activeLabel: string; pendingLabel: string }) {
  if (status === 'Active') {
    return (
      <Badge variant="success" className="text-[9.5px] px-2 py-0.5 font-bold">
        {activeLabel}
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className="text-[9.5px] px-2 py-0.5 font-bold">
      {pendingLabel}
    </Badge>
  );
}

export function EncumbranceTable({
  encumbrances,
  onAdd,
  onEdit,
  onDelete,
}: EncumbranceTableProps) {
  const rawT = useTranslations("newAddNewAsset");
  const t = (key: string) => rawT(key as never) || "";

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="overflow-x-auto rounded-lg border border-slate-200/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80">
              <th className="py-2 px-2.5 w-7 text-center">#</th>
              <th className="py-2 px-2.5 min-w-[100px]">{t("encumbrance.type") || "Encumbrance Type"}</th>
              <th className="py-2 px-2.5 min-w-[120px]">{t("encumbrance.details") || "Details"}</th>
              <th className="py-2 px-2.5 whitespace-nowrap">{t("encumbrance.fromDate") || "From Date"}</th>
              <th className="py-2 px-2.5 whitespace-nowrap">{t("encumbrance.toDate") || "To Date"}</th>
              <th className="py-2 px-2.5 w-16 text-center">{t("encumbrance.status") || "Status"}</th>
              <th className="py-2 px-2.5 w-14 text-center">{t("encumbrance.action") || "Action"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-800">
            {encumbrances.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-400 text-[11px]">
                  {t("encumbrance.noRecords") || "No encumbrance records found."}
                </td>
              </tr>
            ) : (
              encumbrances.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-2.5 text-center font-bold text-slate-500">{index + 1}</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">{row.type || '–'}</td>
                  <td className="py-2 px-2.5 text-slate-600 truncate max-w-[150px]">{row.details || '–'}</td>
                  <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">{row.fromDate || '–'}</td>
                  <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">{row.toDate || '–'}</td>
                  <td className="py-2 px-2.5 text-center">
                    <StatusBadge
                      status={row.status}
                      activeLabel={t("encumbrance.active") || "Active"}
                      pendingLabel={t("encumbrance.pending") || "Pending"}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <IconButton
                        type="button"
                        onClick={() => onEdit(row)}
                        icon={Edit2}
                        className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer p-0.5 rounded hover:bg-blue-50 h-6 w-6"
                        title={t("encumbrance.edit") || "Edit"}
                      />
                      <IconButton
                        type="button"
                        onClick={() => onDelete(row.id)}
                        icon={Trash2}
                        className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-0.5 rounded hover:bg-red-50 h-6 w-6"
                        title={t("encumbrance.delete") || "Delete"}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("encumbrance.addEncumbrance") || "Add Encumbrance"}
        </Button>
      </div>
    </div>
  );
}
