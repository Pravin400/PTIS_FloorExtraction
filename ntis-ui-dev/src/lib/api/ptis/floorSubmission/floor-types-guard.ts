/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FloorAPIResponse } from '@/types/floor-details.types';
import {
    type RoomData,
    type RoomAPIResponse,
    type ShapeParameters,
} from '@/types/room-details.types';
import { type OffsetAPIResponse, type OffsetData } from '@/types/offset-details.types';
import { parseBoolean } from "@/lib/utils/type-guards";
import { resolveAgreementBaseMonthlyRent } from "@/lib/utils/renter/renterUtils";


export const mapRoomDataToUi = (room: RoomAPIResponse, index: number): RoomData => {
    const shape = room.shape || 'Rectangle';
    const lengthVal = String(room.lengthMtr || room.length || 0);
    const widthVal = String(room.widthMtr || room.width || 0);
    const heightVal = String(room.heightMtr || room.height || 0);
    const base1Val = String(room.base1Mtr || room.base1 || 0);
    const base2Val = String(room.base2Mtr || room.base2 || 0);

    const shapeParams: ShapeParameters = {
        length: lengthVal, width: widthVal, height: heightVal,
        base1: base1Val, base2: base2Val, radius: '', base: '', side: '',
    };

    if (shape === 'Square') { shapeParams.side = lengthVal; }
    else if (shape === 'Circle' || shape === 'Semi Circle' || shape === 'Quarter Circle') { shapeParams.radius = lengthVal; }
    else if (shape === 'Triangle') { shapeParams.base = base1Val || lengthVal; shapeParams.height = heightVal; }

    const offsetsData = Array.isArray(room.roomWiseMinusData) ? room.roomWiseMinusData : (Array.isArray(room.minusRooms) ? room.minusRooms : []);
    const offsets = offsetsData.map((offset: OffsetAPIResponse, offIndex: number) => {
        const offShape = offset.shape || 'Rectangle';
        const offLengthVal = String(offset.lengthMtr || offset.length || 0);
        const offWidthVal = String(offset.widthMtr || offset.width || 0);
        const offHeightVal = String(offset.heightMtr || offset.height || 0);
        const offBase1Val = String(offset.base1Mtr || offset.base1 || 0);
        const offBase2Val = String(offset.base2Mtr || offset.base2 || 0);

        const offShapeParams: ShapeParameters = {
            length: offLengthVal, width: offWidthVal, height: offHeightVal,
            base1: offBase1Val, base2: offBase2Val, radius: '', base: '', side: '',
        };

        if (offShape === 'Square') { offShapeParams.side = offLengthVal; }
        else if (offShape === 'Circle' || offShape === 'Semi Circle' || offShape === 'Quarter Circle') { offShapeParams.radius = offLengthVal; }
        else if (offShape === 'Triangle') { offShapeParams.base = offBase1Val || offLengthVal; offShapeParams.height = offHeightVal; }

        return {
            id: Number(offset.roomWiseMinusId ?? offset.id) || undefined,
            offsetNo: `O${offIndex + 1}`,
            shape: String(offShape),
            length: offLengthVal,
            width: offWidthVal,
            height: offHeightVal,
            base1: offBase1Val,
            base2: offBase2Val,
            radius: String(offShapeParams.radius || ''),
            side: String(offShapeParams.side || ''),
            base: String(offShapeParams.base || ''),
            area: Number(offset.areaSqMtr || offset.area) || 0,
            operation: offset.isOffset === true ? 'add' : (offset.isOffset === false ? 'subtract' : String(offset.operation || 'subtract')),
            remark: String(offset.remark || ''),
            shapeType: String(offShape),
            shapeParams: offShapeParams,
            parameters: offShapeParams as unknown as Record<string, unknown>,
        } as OffsetData;
    });

    const isOff = (room.minusYesNo === true || room.MinusYesNo === true || room.offsetMinus === 'Yes');
    const isOut = (room.outerYesNo === true || room.OuterYesNo === true || room.outer === 'Yes');
    const mainArea = Number(room.areaSqMtr || room.area) || 0;

    const offsetArea = offsets.reduce((sum, off) => {
        const op = off.operation;
        return op === 'subtract' ? sum + off.area : sum - off.area;
    }, 0);

    const actualOffset = isOff ? Math.min(offsetArea, mainArea) : 0;
    const calculatedBaseArea = mainArea - actualOffset;

    const computedCarpetArea = isOut ? calculatedBaseArea * 0.80 : calculatedBaseArea;
    const finalCarpetArea = Number(room.carpetArea || room.totalAreaSqMtr || room.total || computedCarpetArea) || 0;
    const finalBuiltUpArea = Number((finalCarpetArea * 1.20).toFixed(2));

    return {
        id: Number(room.roomWiseSubmissionId ?? room.id) || undefined,
        roomNo: String(room.roomNo || `R${index + 1}`),
        utilities: String(room.roomTypeDescription || room.roomType || room.utilities || 'Room'),
        roomTypeId: room.roomTypeId,
        shape: shape,
        length: lengthVal, width: widthVal, height: heightVal,
        area: Number(room.areaSqMtr || room.area) || 0,
        mainArea: Number(room.mainArea || mainArea) || 0,
        carpetArea: finalCarpetArea,
        builtUpArea: finalBuiltUpArea,
        roomCount: String(room.noOfRooms || room.roomCount || 1),
        total: Number(room.totalAreaSqMtr || room.total || finalCarpetArea) || 0,
        outer: isOut ? 'Yes' : 'No',
        offsetMinus: isOff ? 'Yes' : 'No',
        remark: room.remark || '',
        shapeParams, offsets,
    };
};

export function normalizeRenterDetailItem(item: any): any {
    if (!item) return item;
    return {
        id: item.id ?? item.Id,
        propertyDetailsId: item.propertyDetailsId ?? item.PropertyDetailsId,
        agreementId: item.agreementId ?? item.AgreementId,
        incrementFrequency: item.incrementFrequency ?? item.IncrementFrequency,
        incrementType: item.incrementType ?? item.IncrementType,
        incrementValue: item.incrementValue ?? item.IncrementValue,
        incrementMethod: item.incrementMethod ?? item.IncrementMethod,
        durationFrom: item.durationFrom ?? item.DurationFrom,
        durationTo: item.durationTo ?? item.DurationTo,
        rentAmount: item.rentAmount ?? item.RentAmount,
        rentMonthly: item.rentMonthly ?? item.RentMonthly,
        increment: item.increment ?? item.increament ?? item.Increment ?? item.Increament,
        incrementStatus: item.incrementStatus ?? item.IncrementStatus,
        isActive: item.isActive ?? item.IsActive,
        customFromDate: item.customFromDate ?? item.CustomFromDate,
        customToDate: item.customToDate ?? item.CustomToDate,
        customIncrementType: item.customIncrementType ?? item.CustomIncrementType,
        customIncrementValue: item.customIncrementValue ?? item.CustomIncrementValue,
        customMethod: item.customMethod ?? item.CustomMethod,
        createdBy: item.createdBy ?? item.CreatedBy,
        createdDate: item.createdDate ?? item.CreatedDate,
        updatedBy: item.updatedBy ?? item.UpdatedBy,
        updatedDate: item.updatedDate ?? item.UpdatedDate,
    };
}

export function normalizeRenterMastItem(item: any): any {
    if (!item) return item;
    return {
        id: item.id ?? item.Id,
        propertyDetailsId: item.propertyDetailsId ?? item.PropertyDetailsId,
        rentMonthly: item.rentMonthly ?? item.RentMonthly,
        finalRent: item.finalRent ?? item.FinalRent,
        finalYearlyRent: item.finalYearlyRent ?? item.FinalYearlyRent,
        financialYear: item.financialYear ?? item.FinancialYear,
        durationFrom: item.durationFrom ?? item.DurationFrom,
        durationTo: item.durationTo ?? item.DurationTo,
        taxLiability: item.taxLiability ?? item.TaxLiability,
        nonCalculateRentMonthly: item.nonCalculateRentMonthly ?? item.NonCalculateRentMonthly,
        renterNameEnglish: item.renterNameEnglish ?? item.RenterNameEnglish,
        renterName: item.renterName ?? item.RenterName,
        agreementDate: item.agreementDate ?? item.AgreementDate,
        agreementFromDate: item.agreementFromDate ?? item.AgreementFromDate,
        agreementToDate: item.agreementToDate ?? item.AgreementToDate,
        isActive: item.isActive ?? item.IsActive,
        createdBy: item.createdBy ?? item.CreatedBy,
        createdDate: item.createdDate ?? item.CreatedDate,
        updatedBy: item.updatedBy ?? item.UpdatedBy,
        updatedDate: item.updatedDate ?? item.UpdatedDate,
        documentBindingId: item.documentBindingId ?? item.DocumentBindingId,
        documentGuid: item.documentGuid ?? item.DocumentGuid,
    };
}

export function normalizeApiFloorData(apiData: Record<string, unknown>) {
    // Basic shape check to ensure we have an object with an ID
    if (!apiData || typeof apiData !== 'object' || !('id' in apiData || 'propertyDetailsId' in apiData || 'propertyId' in apiData)) {
        return apiData;
    }

    const data = apiData as unknown as FloorAPIResponse;
    const builtupAreaSqFtVal = Number(data.builtupAreaSqFeet ?? data.builtUpAreaSqFeet ?? 0);
    const builtupAreaSqMVal = Number(data.builtupAreaSqMeter ?? data.builtUpAreaSqMeter ?? 0);
    const carpetAreaSqFtVal = Number(data.carpetAreaSqFeet ?? data.carpetAreaSqFt ?? 0);
    const carpetAreaSqMVal = Number(data.carpetAreaSqMeter ?? data.carpetAreaSqM ?? 0);

    // Helper to get string safely
    const s = (val: unknown) => String(val ?? '').trim();
    // Helper to check for 'undefined' or 'null' strings
    const isValid = (val: unknown) => val && s(val).toLowerCase() !== 'undefined' && s(val).toLowerCase() !== 'null';

    const rawIsOpenPlot = (data as any).isOpenPlot ?? (data as any).IsOpenPlot ?? apiData.isOpenPlot ?? apiData.IsOpenPlot;
    const isActualOpenPlot = rawIsOpenPlot === true || String(rawIsOpenPlot).toLowerCase() === 'true' || rawIsOpenPlot === 1 || String(rawIsOpenPlot) === '1';

    return {
        ...apiData,
        isOpenPlot: isActualOpenPlot,
        IsOpenPlot: isActualOpenPlot,
        id: data.propertyDetailsId ?? data.id,
        ownerID: data.ownerID ?? data.ownerId ?? data.propertyId,
        floor: isValid(data.floorDescription) ? s(data.floorDescription) : s(data.floorID ?? data.floorId ?? ''),
        floorId: s(data.floorID ?? data.floorId ?? ''),
        subFloor: isValid(data.subFloorDescription) ? s(data.subFloorDescription) : s(data.subFloorID ?? data.subFloorId ?? ''),
        subFloorId: s(data.subFloorID ?? data.subFloorId ?? ''),
        conYr: s(data.constructionYear),
        asstYr: s(data.assessmentYear),
        conTyp: isValid(data.constructionTypeDescription) ? s(data.constructionTypeDescription) : s(data.constructionId ?? data.constructionTypeId ?? data.ConstructionTypeId ?? ''),
        constructionTypeId: s(data.constructionId ?? data.constructionTypeId ?? data.ConstructionTypeId ?? ''),
        use: isValid(data.typeOfUseDescription) ? s(data.typeOfUseDescription) : (isValid(data.typeOfUseId) ? s(data.typeOfUseId) : ''),
        useId: isValid(data.typeOfUseId) ? s(data.typeOfUseId) : '',
        typeOfUseId: isValid(data.typeOfUseId) ? s(data.typeOfUseId) : '',
        subTyp: isValid(data.subTypeOfUseDescription) ? s(data.subTypeOfUseDescription) : (isValid(data.subTypeOfUseId) ? s(data.subTypeOfUseId) : ''),
        subTypId: isValid(data.subTypeOfUseId) ? s(data.subTypeOfUseId) : '',
        subTypeOfUseId: Number(data.subTypeOfUseId || 0),
        subTypeOfUseDescription: isValid(data.subTypeOfUseDescription) ? s(data.subTypeOfUseDescription) : '',
        renter: parseBoolean(data.isRenter ?? data.renterYesNO ?? data.renterYesNo) ? ('Yes' as const) : ('No' as const),
        rooms: isActualOpenPlot ? '0' : String(data.noOfRooms || 0),
        areaSqFt: String(carpetAreaSqFtVal),
        areaSqM: String(carpetAreaSqMVal),
        builtupAreaSqFt: String(builtupAreaSqFtVal),
        builtupAreaSqM: String(builtupAreaSqMVal),
        length: s(data.lengthMtr ?? data.length ?? ''),
        width: s(data.widthMtr ?? data.width ?? ''),
        lengthMtr: s(data.lengthMtr ?? data.length ?? ''),
        widthMtr: s(data.widthMtr ?? data.width ?? ''),
        isTaxable: parseBoolean(data.isTaxable) ? ('Yes' as const) : ('No' as const),
        renterDetails: (data.renterDetails || []).map(normalizeRenterDetailItem),
        renterMast: (data.renterMast || data.renters || []).map(normalizeRenterMastItem),
        renterName: s(
            data.renterName ||
            data.renterNameEnglish ||
            (data.renters && (data.renters as any[])[0]?.renterName) ||
            (data.renters && (data.renters as any[])[0]?.renterNameEnglish) ||
            (data.renterMast && (data.renterMast as any[])[0]?.renterName) ||
            (data.renterMast && (data.renterMast as any[])[0]?.renterNameEnglish)
        ),
        nonCalculateRentMonthly: Number(
            data.nonCalculateRentMonthly ??
            (apiData as Record<string, unknown>).NonCalculateRentMonthly ??
            (data.renters && (data.renters as any[])[0]?.nonCalculateRentMonthly) ??
            (data.renterMast && (data.renterMast as any[])[0]?.nonCalculateRentMonthly) ??
            0
        ),
        rentMonthly: Number(resolveAgreementBaseMonthlyRent(data as unknown as Record<string, unknown>) || 0),
        rentYearly: Number(
            data.rentYearly ||
            (data.renters && (data.renters as any[])[0]?.finalYearlyRent) ||
            (data.renterMast && (data.renterMast as any[])[0]?.finalYearlyRent) ||
            0
        ) || (Number(resolveAgreementBaseMonthlyRent(data as unknown as Record<string, unknown>) || 0) * 12),
        agreementFromDate: s(
            data.agreementFromDate ||
            (data.renters && ((data.renters as any[])[0]?.agreementFromDate || (data.renters as any[])[0]?.durationFrom)) ||
            (data.renterMast && ((data.renterMast as any[])[0]?.agreementFromDate || (data.renterMast as any[])[0]?.durationFrom))
        ),
        agreementToDate: s(
            data.agreementToDate ||
            (data.renters && ((data.renters as any[])[0]?.agreementToDate || (data.renters as any[])[0]?.durationTo)) ||
            (data.renterMast && ((data.renterMast as any[])[0]?.agreementToDate || (data.renterMast as any[])[0]?.durationTo))
        ),
        agreementDate: s(
            data.agreementDate ||
            (data.renters && (data.renters as any[])[0]?.agreementDate) ||
            (data.renterMast && (data.renterMast as any[])[0]?.agreementDate)
        ),
        roomData: (data.roomWiseSubmissionDetails || data.propertyRooms || []).map((r, i) => mapRoomDataToUi(r, i)),
        propertyCertificates: data.propertyCertificates || [],
    };
}

