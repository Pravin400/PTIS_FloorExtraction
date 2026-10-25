'use client';

import { Save } from "lucide-react";
import { Button } from "@/components/common";

import { SubUnitFooterProps } from "@/types/asset/sub-units.types";
export function SubUnitFooter({ onCancel, onSave, t }: SubUnitFooterProps) {
  return (
    <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
      <Button variant="secondary" onClick={onCancel}
        className="px-5 py-1.5 text-xs font-bold uppercase tracking-widest">
        {t("buttons.cancel")}
      </Button>
      <Button variant="primary" onClick={onSave}
        className="px-5 py-1.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
        <Save className="size-3.5" /> {t("buttons.saveUnit")}
      </Button>
    </div>
  );
}
