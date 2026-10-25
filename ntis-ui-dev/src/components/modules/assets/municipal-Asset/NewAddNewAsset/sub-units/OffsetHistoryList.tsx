'use client';

import { Trash2 } from "lucide-react";
import { Button } from "@/components/common";

import { OffsetHistoryListProps } from "@/types/asset/sub-units.types";
export function OffsetHistoryList({
  drawerOffsets,
  handleRemoveOffsetFromHistory,
}: OffsetHistoryListProps) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider px-1">{'Added Entries'}</span>
      {drawerOffsets.length === 0 ? (
        <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-[10px] font-bold uppercase">{'No entries added yet'}</div>
      ) : (
        <div className="space-y-1.5">
          {drawerOffsets.map((entry) => (
            <div key={entry.id} className={`flex items-center justify-between p-2 rounded-lg border ${entry.op === "Add" ? "bg-blue-50/50 border-blue-200" : "bg-amber-50/50 border-amber-200"}`}>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase text-white ${entry.op === "Add" ? "bg-blue-500" : "bg-amber-500"}`}>
                    {entry.op === "Add" ? "+" : "−"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">{entry.shape}</span>
                </div>
                <span className={`text-[11px] font-black font-mono ${entry.op === "Add" ? "text-blue-700" : "text-amber-700"}`}>
                  {entry.areaSqM.toFixed(2)}{' m²'}
                </span>
              </div>
              <Button
                variant="ghost"
                type="button"
                onClick={() => handleRemoveOffsetFromHistory(entry.id)}
                className="p-1.5 h-auto hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                title="Remove entry"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
