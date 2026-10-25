import { Layers } from "lucide-react";
import { ShapePreview } from "./ShapePreview";
import { formulaText } from "@/lib/utils/asset-utils/room-utils";
import { AmenityForm } from "./AmenityForm";
import { AmenityTable } from "./AmenityTable";

import { AmenityConfigSectionProps } from "@/types/asset/sub-units.types";
export function AmenityConfigSection({
  drawerState,
  setMainDim,
  setShape,
  t,
}: AmenityConfigSectionProps) {
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
        <AmenityForm
          form={form} setForm={setForm} spacesLength={spacesList.length} editingId={editingId} setEditingId={setEditingId}
          setShape={setShape} setMainDim={setMainDim} handleFormOffsetToggle={handleFormOffsetToggle}
          setIsFormOffsetOpen={setIsFormOffsetOpen} handleAdd={handleAdd} t={t}
        />

        <AmenityTable
          spacesList={spacesList} toggleOffset={toggleOffset} handleEdit={handleEdit} handleDelete={handleDelete}
          totalGrossSqM={totalGrossSqM} totalGrossSqFt={totalGrossSqFt} totalNetSqM={totalNetSqM} totalNetSqFt={totalNetSqFt}
        />
      </div>

      {/* Right: Shape preview + breakdown */}
      <div className="lg:col-span-1 flex flex-col">
        <div className="bg-white rounded-xl flex flex-col h-full border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded-md"><Layers className="size-4 text-white" /></div>
              <span className="text-[11px] font-bold bg-blue-800/40 px-2 py-0.5 rounded-full border border-white/20">
                {'Area: '}{form.areaSqM.toFixed(2)}{' m²'}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-white/10 text-white rounded-full text-[9px] font-bold uppercase tracking-wider">{'Preview'}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-slate-50/50 min-h-[260px]">
            <div className="w-full h-full max-w-[280px] max-h-[280px] aspect-square bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center p-2 relative">
              <ShapePreview
                shape={form.shape}
                areaSqM={form.areaSqM}
                label={form.name}
                color="blue"
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
            <div className="p-2 rounded-lg border-2 border-double border-blue-200 bg-blue-50/20 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                {formulaText(form.shape, form.length, form.width, form.height, form.base1, form.base2, form.radius)}
              </div>
              <div className="text-[11px] text-slate-700 space-y-1 font-bold mt-2">
                <div className="flex justify-between px-1">
                  <span className="text-slate-500 uppercase text-[9px] tracking-wider">{'Base Area:'}</span>
                  <span className="font-mono">{(form.areaSqM ?? 0).toFixed(2)}{' m²'}</span>
                </div>
                {form.hasOffset === "Yes" && (
                  <>
                    <div className="flex justify-between px-1 text-amber-700">
                      <span className="uppercase text-[9px] tracking-wider">
                        {'Offset ('}{form.offsetOp === "Add" ? 'added' : 'subtracted'}{'):'}
                      </span>
                      <span className="font-mono">{form.offsetOp === "Add" ? "+" : "−"}{(form.offsetAreaSqM ?? 0).toFixed(2)}{' m²'}</span>
                    </div>
                    <div className="flex justify-between px-1 border-t border-slate-100 pt-1 text-slate-800">
                      <span className="uppercase text-[9px] tracking-wider">{'Net Area:'}</span>
                      <span className="font-mono">{(form.netAreaSqM ?? 0).toFixed(2)}{' m²'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between px-2.5 py-1 border-t-2 border-double border-blue-200 text-xs font-black text-blue-700 bg-blue-50/50 rounded-lg mt-1.5">
                  <span className="uppercase tracking-wide">{'Contribution:'}</span>
                  <span className="font-mono">{(form.netAreaSqM ?? 0).toFixed(2)}{' m²'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
