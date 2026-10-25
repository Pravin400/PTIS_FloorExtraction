'use client';

import { Building2, Plus, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { SubUnitFloorClassificationFields } from './SubUnitFloorClassificationFields';
import { SubUnitAreaSummaryFields } from './SubUnitAreaSummaryFields';
import { SubUnitFloorConstructionCardProps } from '@/types/asset/sub-units.types';

export function SubUnitFloorConstructionCard(props: SubUnitFloorConstructionCardProps) {
  const {
    formData,
    setFormData,
    handleChange,
    handleFloorSelect,
    handleUseTypeSelect,
    floorSelectOptions,
    dropdownOptions,
    subFloorOptions,
    dynamicSubUseTypes,
    submissionType,
    setSubmissionType,
    roomsList,
    setRoomsList,
            setIsRoomsDrawerOpen,
    setIsOpenSpacesDrawerOpen,
    area,
    inp,
    t,
    onAddFloorClick,
    onCancelEditDuplicate,
    isEditingDuplicate,
      } = props;

  return (
    <Card
      variant="bordered"
      padding="sm"
      className="shadow-sm border-slate-200/80 bg-white rounded-2xl"
    >
      <CardHeader className="flex items-center gap-2 bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1 px-2.5 mb-2.5 shadow-sm">
        <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
          <Building2 className="size-3.5 text-white" />
        </div>
        <CardTitle className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">
          {t('subunit.sections.floorDetails')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2 items-start">
        <SubUnitFloorClassificationFields
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleFloorSelect={handleFloorSelect}
          handleUseTypeSelect={handleUseTypeSelect}
          floorSelectOptions={floorSelectOptions}
          dropdownOptions={dropdownOptions}
          subFloorOptions={subFloorOptions}
          dynamicSubUseTypes={dynamicSubUseTypes}
          submissionType={submissionType}
          setSubmissionType={setSubmissionType}
          roomsList={roomsList}
          setRoomsList={setRoomsList}
          setIsRoomsDrawerOpen={setIsRoomsDrawerOpen}
          inp={inp}
          t={t}
        />

        <SubUnitAreaSummaryFields
          submissionType={submissionType}
          area={area}
          setIsOpenSpacesDrawerOpen={setIsOpenSpacesDrawerOpen}
          t={t}
        />

        {onAddFloorClick && (
          <div className="flex flex-col justify-end pt-5">
            {isEditingDuplicate ? (
              <div className="flex items-center gap-1 w-full">
                <button
                  type="button"
                  onClick={onCancelEditDuplicate}
                  className="h-[25px] px-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer shrink-0"
                >{'Cancel'}</button>
                <button
                  type="button"
                  onClick={onAddFloorClick}
                  className="h-[25px] flex-1 px-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-md text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                ><Pencil className="size-2.5" /> {'Update'}</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAddFloorClick}
                className="h-[25px] w-full px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              ><Plus className="size-3.5" /> {'+ ADD FLOOR'}</button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
