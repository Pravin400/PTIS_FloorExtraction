'use client';

import React from 'react';
import { useTranslations } from "next-intl";
import { FullOffSetFormProps } from "@/types/offset-details.types";
import { focusOffsetShapeSelect } from "@/lib/utils/floorSubmission/focus-helpers";
import { OffsetFormSummary } from "./components/OffsetFormSummary";
import { OffsetShapeInputs } from "./components/OffsetShapeInputs";
import { OffsetHistoryTable } from "./components/OffsetHistoryTable";
import { OffsetFormFooter } from "./components/OffsetFormFooter";
import { SHAPE_OPTIONS } from "../RoomSubmission/constants/room-submission.constants";

export function OffSetForm({
    isInline = false,
    offsetModalOpen,
    calculateAdjustedRoomTotal,
    handleSubtractClick,
    selectedOperation,
    isShakingSubtract,
    offsetData,
    setOffsetValidationError,
    setSelectedOperation,
    offsetValidationError,
    selectedShape,
    handleShapeChange,
    handleOffsetInputChange,
    offsetList,
    getDimensionsString,
    handleDeleteOffset,
    handleAddOffset,
    isOffsetDataValid,
    handleOffsetOk,
    handleOffsetClose,
    areaUnit,
    shouldShake,
    deletingOffsetIndex,
}: FullOffSetFormProps) {

    // Removed unused confirm variable
    const t = useTranslations("quickDataEntry");
    
    const shapeOptions = React.useMemo(() => 
        SHAPE_OPTIONS.map(opt => ({
            label: t(`roomSubmission.input.shapes.${opt.label}`),
            value: opt.value
        })), [t]);

    // Focus "Select Shape" when drawer opens (accessibility fix)
    React.useEffect(() => {
        if (offsetModalOpen) {
            const timer = setTimeout(() => {
                focusOffsetShapeSelect(offsetModalOpen);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [offsetModalOpen]);

    // No double-confirmation: just call handleDeleteOffset
    const confirmDelete = (idx: number) => {
        handleDeleteOffset(idx);
    };

    return (
        <div
            id="offset-sidebar-container"
            className={`${isInline ? "" : "bg-gradient-to-br from-white via-blue-50 to-purple-50"} flex flex-col w-full ${shouldShake ? "animate-shake" : ""}`}
        >


            <div className="p-2 w-full">
                <OffsetFormSummary
                    calculateAdjustedRoomTotal={calculateAdjustedRoomTotal}
                    areaUnit={areaUnit}
                    handleSubtractClick={handleSubtractClick}
                    selectedOperation={selectedOperation}
                    isShakingSubtract={isShakingSubtract}
                    offsetData={offsetData}
                    setSelectedOperation={setSelectedOperation}
                    setOffsetValidationError={setOffsetValidationError}
                    offsetValidationError={offsetValidationError}
                />

                <OffsetShapeInputs 
                    shapeOptions={shapeOptions}
                    selectedShape={selectedShape}
                    handleShapeChange={handleShapeChange}
                    offsetData={offsetData}
                    handleOffsetInputChange={handleOffsetInputChange}
                    areaUnit={areaUnit}
                    isOffsetDataValid={isOffsetDataValid}
                    handleAddOffset={handleAddOffset}
                />

                <OffsetHistoryTable 
                    offsetList={offsetList}
                    areaUnit={areaUnit}
                    getDimensionsString={getDimensionsString}
                    confirmDelete={confirmDelete}
                    deletingIndex={deletingOffsetIndex}
                />
            </div>

            {!isInline && (
                <OffsetFormFooter 
                    onOk={handleOffsetOk}
                    onClose={handleOffsetClose}
                    disableOk={!!offsetValidationError}
                />
            )}
        </div>
    );
}
