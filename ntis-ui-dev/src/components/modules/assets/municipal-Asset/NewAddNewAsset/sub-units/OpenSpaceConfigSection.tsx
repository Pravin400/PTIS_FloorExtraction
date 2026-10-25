'use client';

import { Layers } from "lucide-react";
import { Button } from "@/components/common";
import { ShapePreview } from "./ShapePreview";
import { OpenSpaceForm } from "./OpenSpaceForm";
import { OpenSpaceTable } from "./OpenSpaceTable";
import { OpenSpaceConfigSectionProps } from "@/types/asset/sub-units.types";

export function OpenSpaceConfigSection({
  drawerState,
  setMainDim,
  setShape,
  t,
}: OpenSpaceConfigSectionProps) {
  const {
    spacesList,
    form,
    setForm,
    editingId,
    setEditingId,
    setIsFormOffsetOpen,
    handleFormOffsetToggle,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSaveAndClose,
    toggleOffset,
    totalNetSqM,
    totalNetSqFt,
    totalGrossSqM,
    totalGrossSqFt,
  } = drawerState;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Form + List */}
      <div className="lg:col-span-2 space-y-4">
        <OpenSpaceForm
          form={form} setForm={setForm} spacesLength={spacesList.length} editingId={editingId} setEditingId={setEditingId}
          setShape={setShape} setMainDim={setMainDim} handleFormOffsetToggle={handleFormOffsetToggle}
          setIsFormOffsetOpen={setIsFormOffsetOpen} handleAdd={handleAdd} t={t}
        />

        <OpenSpaceTable
          spacesList={spacesList} toggleOffset={toggleOffset} handleEdit={handleEdit} handleDelete={handleDelete}
          totalGrossSqM={totalGrossSqM} totalGrossSqFt={totalGrossSqFt} totalNetSqM={totalNetSqM} totalNetSqFt={totalNetSqFt}
          t={t}
        />
      </div>

      {/* Right: Shape preview + save button (Matching Construction RoomWise exactly) */}
      <div className="lg:col-span-1 flex flex-col">
        <div className="bg-white rounded-xl flex flex-col h-full border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded-md"><Layers className="size-4 text-white" /></div>
              <span className="text-[11px] font-bold bg-blue-800/40 px-2 py-0.5 rounded-full border border-white/20">
                {'Area: '}{form.areaSqM.toFixed(2)}{' m²'}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
              {form.name || form.roomNo || "1"}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-slate-50/50 min-h-[260px]">
            <div className="w-full h-full max-w-[280px] max-h-[280px] aspect-square bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center p-2 relative">
              <ShapePreview
                shape={form.shape}
                areaSqM={form.areaSqM}
                label={form.name || form.roomNo || "1"}
                color="emerald"
                length={form.length}
                width={form.width}
                height={form.height}
                base1={form.base1}
                base2={form.base2}
                radius={form.radius}
              />
            </div>
          </div>

          <div className="p-3 bg-white border-t border-slate-100 space-y-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveAndClose}
              className="w-full! h-auto! px-4! py-2.5! bg-blue-600! hover:bg-blue-700! text-white! font-black! uppercase! text-xs! tracking-wider! rounded-xl! shadow-md!"
            >{'SAVE OPEN SPACES'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
