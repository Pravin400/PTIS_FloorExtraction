/* eslint-disable @typescript-eslint/no-explicit-any */
import { calcAreaSqM } from "@/lib/utils/asset-utils/room-utils";

export const mapSubUnitsToFloors = (subUnits: any[], floors: any[], dropdownOptions: any) => {
  return (subUnits || []).map((u: any) => {
    const floorDetailsId = u.floorDetailsId ?? u.FloorDetailsId ?? null;
    let floorDetail = floors.find((f: any) => Number(f.id) === Number(floorDetailsId));

    const resolvedFloorId = u.floorId ?? u.FloorId ?? floorDetail?.floorId ?? floorDetail?.FloorId ?? null;
    const resolvedSubFloorId = (u.subFloorId && Number(u.subFloorId) > 0)
      ? Number(u.subFloorId)
      : ((u.SubFloorId && Number(u.SubFloorId) > 0) ? Number(u.SubFloorId) : null);

    if (!floorDetail && resolvedFloorId !== null) {
      floorDetail = floors.find((f: any) =>
        Number(f.floorId) === Number(resolvedFloorId) &&
        (f.subFloorId ? Number(f.subFloorId) : null) === (resolvedSubFloorId ? Number(resolvedSubFloorId) : null)
      );
    }

    const constructionYear = u.constructionYear || u.conYear || floorDetail?.constructionYear || "";
    const assessmentYear = u.assessmentYear || u.asstYear || floorDetail?.assessmentYear || "";
    const constructionTypeId = u.constructionTypeId || Number(u.conType) || floorDetail?.constructionTypeId || null;
    const typeOfUseId = u.typeOfUseId || Number(u.useType) || floorDetail?.typeOfUseId || null;
    const rawSubUse = u.subTypeOfUseId ?? u.SubTypeOfUseId ?? u.subUseType;
    const subTypeOfUseId = rawSubUse && Number(rawSubUse) > 0 ? Number(rawSubUse) : null;

    const rawRoomDetails = Array.isArray(u.roomWiseDetails) ? u.roomWiseDetails : Array.isArray(u.roomDetails) ? u.roomDetails : Array.isArray(u.roomWiseSubmissions) ? u.roomWiseSubmissions : Array.isArray(u.rooms) ? u.rooms : [];

    const mappedRooms = rawRoomDetails.map((r: any) => {
      let areaSqM = Number(r.areaSqMtr || r.areaSqM || 0);
      if (areaSqM <= 0) areaSqM = calcAreaSqM(r.shape || "Rectangle", Number(r.lengthMtr || 0), Number(r.widthMtr || 0), Number(r.heightMtr || 0), Number(r.base1Mtr || 0), Number(r.base2Mtr || 0), Number(r.radiusMtr || r.lengthMtr || r.widthMtr || 0));
      const areaSqFt = areaSqM * 10.7639;

      const rOffsets = Array.isArray(r.offsets) ? r.offsets.map((off: any) => {
        const sh = off.shape || "Rectangle";
        const len = Number(off.length !== undefined ? off.length : (off.radius || 0));
        const wid = Number(off.width || 0);
        const h = Number(off.height || 0);
        const b1 = Number(off.base1 || 0);
        const b2 = Number(off.base2 || 0);
        const rad = Number(off.radius !== undefined ? off.radius : len);
        let oArea = Number(off.areaSqM || 0);
        if (oArea <= 0) oArea = calcAreaSqM(sh, len, wid, h, b1, b2, rad);
        return {
          id: off.id ? String(off.id) : "", shape: sh, length: len, width: wid, height: h, base1: b1, base2: b2, radius: rad, areaSqM: oArea, op: off.op || "Subtract",
        };
      }) : [];

      let netAdjustmentSqM = 0;
      rOffsets.forEach((off: any) => {
        const offArea = Number(off.areaSqM || 0);
        if (off.op === "Add") netAdjustmentSqM += offArea;
        else netAdjustmentSqM -= offArea;
      });

      const netSqM = Math.max(0, areaSqM + netAdjustmentSqM);
      const isOS = r.roomType === "Open Space" || r.submissionType === "Open Space";
      const isAmenity = r.roomType === "Amenity" || r.submissionType === "Amenity";

      return {
        id: r.id ? String(r.id) : String(Math.random()), roomNo: String(r.roomNo || "1"), roomType: String(r.roomType || ""), shape: String(r.shape || ""),
        length: (() => {
          const val = Number(r.lengthMtr || 0);
          if (val === 0 && r.shape === "Square" && areaSqM > 0) return Math.round(Math.sqrt(areaSqM) * 100) / 100;
          return val;
        })(),
        width: Number(r.widthMtr || 0), height: Number(r.heightMtr || 0), base1: Number(r.base1Mtr || 0), base2: Number(r.base2Mtr || 0),
        radius: (() => {
          const val = Number(r.radiusMtr || r.lengthMtr || r.widthMtr || 0);
          if (val === 0 && areaSqM > 0) {
            if (r.shape === "Circle") return Math.round(Math.sqrt(areaSqM / Math.PI) * 100) / 100;
            if (r.shape === "Semi Circle") return Math.round(Math.sqrt((areaSqM * 2) / Math.PI) * 100) / 100;
            if (r.shape === "Quarter") return Math.round(Math.sqrt((areaSqM * 4) / Math.PI) * 100) / 100;
          }
          return val;
        })(),
        areaSqM, areaSqFt, offsets: rOffsets, hasOffset: rOffsets.length > 0 ? "Yes" : "No", netAreaSqM: netSqM, netAreaSqFt: netSqM * 10.7639,
        count: Number(r.noOfRooms || 1), outer: r.outerYesNo || r.outer === "Yes" ? "Yes" : "No", minus: r.minus === "Yes" ? "Yes" : "No",
        submissionType: isOS ? "Open Space" : (isAmenity ? "Amenity" : (r.submissionType || "Room")),
      };
    });

    const roomsCount = mappedRooms.length > 0
      ? mappedRooms.filter((r: any) => !(r.submissionType?.includes("Open Space") || r.roomType === "Open Space" || r.submissionType?.includes("Amenity") || r.roomType === "Amenity")).reduce((acc: number, r: any) => acc + (r.count || 1), 0)
      : Number(u.noOfRooms ?? u.NoOfRooms ?? 0);

    let carpetSqFt = 0;
    if (mappedRooms && mappedRooms.length > 0) {
      const calculated = mappedRooms.reduce((acc: number, r: any) => {
        const netAreaSqFt = r.netAreaSqFt !== undefined ? Number(r.netAreaSqFt) : (r.netAreaSqM !== undefined ? Number(r.netAreaSqM) * 10.7639 : Number(r.areaSqFt || r.area || 0));
        const roomSqFt = netAreaSqFt * Number(r.count || 1);
        if (r.submissionType?.includes("Open Space") || r.roomType === "Open Space" || r.submissionType?.includes("Amenity") || r.roomType === "Amenity") return acc + roomSqFt;
        if (r.minus === "Yes" || r.offset === "Yes") return acc - roomSqFt;
        if (r.outer === "Yes") return acc + roomSqFt * 0.8;
        return acc + roomSqFt;
      }, 0);
      carpetSqFt = Math.round(calculated * 100) / 100;
    } else if (u.carpetAreaSqFeet || u.carpetAreaSqFt || u.totalAreaSqFt) {
      carpetSqFt = Number(u.carpetAreaSqFeet || u.carpetAreaSqFt || u.totalAreaSqFt || 0);
    } else if (!u.unitType && !u.subUnitType && !u.shopUnitName && !u.unitNo && (u.id === floorDetail?.id || !u.id)) {
      carpetSqFt = Number(floorDetail?.carpetAreaSqFeet || floorDetail?.carpetAreaSqFt || floorDetail?.totalAreaSqFt || 0);
    }

    const builtUpSqFt = carpetSqFt > 0
      ? (Number(u.builtUpAreaSqFeet || u.builtupAreaSqFeet) || (carpetSqFt * 1.2))
      : 0;

    const rent = Array.isArray(u.renterDetails) ? u.renterDetails[0] : (u.renterDetailsList && u.renterDetailsList[0]) || u.renterDetails;
    const isRented = u.isRented !== undefined ? !!u.isRented : (u.isRenter !== undefined ? !!u.isRenter : !!rent);
    const renterName = u.renterName || rent?.renterName || rent?.tenantName || u.renterNameEnglish || "";
    const resolvedSubUseName = subTypeOfUseId
      ? (u.subTypeOfUseName || u.SubTypeOfUseName || dropdownOptions?.subUseTypes?.find((o: any) => String(o.value) === String(subTypeOfUseId))?.label || "")
      : "";
    const deptId = u.departmentId || u.DepartmentId || null;
    const deptName = deptId ? (dropdownOptions?.departments?.find((d: any) => String(d.value) === String(deptId))?.label || u.departmentName || u.DepartmentName || "") : (u.departmentName || u.DepartmentName || "");

    let unitType = (u.unitType || u.type || "").trim();
    if (u.isDirectFloorSubmission === true || u.IsDirectFloorSubmission === true) {
      if (u.constructionTypeId === 11 || unitType.toLowerCase().includes('open')) {
        unitType = 'Open Space';
      } else {
        unitType = 'Construction';
      }
    }

    const allTokens = [
      u.unitType,
      u.type,
      u.subUnitType,
      u.subUnitTypeName,
      u.assetNo,
      u.assetCode,
      u.unitNo,
      u.shopUnitName,
      u.assetName,
      u.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();

    if (!unitType) {
      if (allTokens.includes("OPEN SPACE") || allTokens.includes("OPENSPACE")) unitType = "Open Space";
      else if (allTokens.includes("AMENITY")) unitType = "Amenity";
      else if (allTokens.includes("ROOM")) unitType = "Room";
      else if (allTokens.includes("OFFICE")) unitType = "Office";
      else if (allTokens.includes("FLAT")) unitType = "Flat";
      else if (allTokens.includes("DEPARTMENT") || allTokens.includes("DEPT")) unitType = "Department";
      else if (allTokens.includes("SHOP")) unitType = "Shop";
    }

    if (!unitType) {
      if (mappedRooms.length > 0) {
        const roomTypes = mappedRooms.map((r: any) => String(r.roomType || r.submissionType || ""));
        if (roomTypes.some((t: string) => t.includes("Open Space"))) unitType = "Open Space";
        else if (roomTypes.some((t: string) => t.includes("Amenity"))) unitType = "Amenity";
        else unitType = "Room";
      } else if (u.shopUnitName) {
        unitType = (u.shopUnitName as string).split(" ")[0] || "Flat";
      } else {
        unitType = "Flat";
      }
    }

    const isDirectFloor = u.isDirectFloorSubmission === true || u.IsDirectFloorSubmission === true;

    return {
      id: u.assetId || u.id, subUnitsDetailsId: u.subUnitsDetailsId ?? (u.isDirectFloorSubmission ? u.id : undefined), isDirectFloorSubmission: u.isDirectFloorSubmission || false, floorDetailsId, floorId: resolvedFloorId, subFloorId: resolvedSubFloorId, subFloorName: resolvedSubFloorId ? (u.subFloorName || floorDetail?.subFloorName || "") : "",
      unitNo: u.unitNo || u.UnitNo || u.details?.unitNo || u.details?.UnitNo || "", 
      propertyNo: u.propertyNo || u.PropertyNo || u.details?.propertyNo || u.details?.PropertyNo || "",
      partitionNo: u.partitionNo || u.PartitionNo || u.details?.partitionNo || u.details?.PartitionNo || "",
      mpmsNo: u.mpmsNo || u.MpmsNo || u.MPMSNo || u.details?.mpmsNo || u.details?.MpmsNo || u.details?.MPMSNo || "",
      shopUnitName: u.shopUnitName || u.assetName || u.name || "", unitType, departmentId: deptId, departmentName: deptName,
      constructionYear, assessmentYear, constructionTypeId, typeOfUseId, subTypeOfUseId, subTypeOfUseName: resolvedSubUseName, isRented, renterNameEnglish: renterName,
      renterNameLocal: rent?.renterNameLocal || rent?.tenantNameLocal || u.renterNameLocal || "", agreementDate: rent?.agreementDate || u.agreementDate || "",
      agreementFromDate: rent?.agreementFromDate || rent?.fromDate || u.agreementFromDate || "", agreementToDate: rent?.agreementToDate || rent?.toDate || u.agreementToDate || "",
      agreementId: rent?.agreementId || u.agreementId || "",
      rentMonthly: rent?.rentAmount || rent?.monthlyRent || u.rentMonthly || "", rentYearly: rent?.rentYearly || u.rentYearly || "", taxLiability: rent?.taxLiability || u.taxLiability || "",
      rentType: rent?.rentType || u.rentType || "",
      duration: rent?.duration || u.duration || "",
      rentFreq: rent?.rentFreq || u.rentFreq || "Monthly",
      securityDeposit: rent?.securityDeposit || u.securityDeposit || "",
      depositType: rent?.depositType || u.depositType || "Refundable",
      mobileNo: rent?.mobileNo || u.mobileNo || "",
      emailId: rent?.emailId || u.emailId || "",
      aadhaar: rent?.aadhaar || u.aadhaar || "",
      pan: rent?.pan || u.pan || "",
      noOfRooms: roomsCount, carpetAreaSqFeet: carpetSqFt, builtUpAreaSqFeet: builtUpSqFt, roomDetails: mappedRooms, rooms: mappedRooms,

      // NOTE: ASP.NET Core default JSON serialiser camelCases only the first char per token:
      // C# CVFloorFactor → JSON cVFloorFactor (NOT cvFloorFactor). All variants covered.
      cvBaseRate: u.cVBaseRate ?? u.cvBaseRate ?? u.CVBaseRate ?? (isDirectFloor ? (floorDetail?.cVBaseRate ?? floorDetail?.cvBaseRate ?? floorDetail?.CVBaseRate ?? null) : null),
      baseValue: u.baseValue ?? u.BaseValue ?? (isDirectFloor ? (floorDetail?.baseValue ?? floorDetail?.BaseValue ?? null) : null),
      cvFloorFactor: u.cVFloorFactor ?? u.cvFloorFactor ?? u.CVFloorFactor ?? (isDirectFloor ? (floorDetail?.cVFloorFactor ?? floorDetail?.cvFloorFactor ?? floorDetail?.CVFloorFactor ?? null) : null),
      cvAgeFactor: u.cVAgeFactor ?? u.cvAgeFactor ?? u.CVAgeFactor ?? (isDirectFloor ? (floorDetail?.cVAgeFactor ?? floorDetail?.cvAgeFactor ?? floorDetail?.CVAgeFactor ?? null) : null),
      cvNatureFactor: u.cVNatureFactor ?? u.cvNatureFactor ?? u.CVNatureFactor ?? (isDirectFloor ? (floorDetail?.cVNatureFactor ?? floorDetail?.cvNatureFactor ?? floorDetail?.CVNatureFactor ?? null) : null),
      cvUseFactor: u.cVUseFactor ?? u.cvUseFactor ?? u.CVUseFactor ?? (isDirectFloor ? (floorDetail?.cVUseFactor ?? floorDetail?.cvUseFactor ?? floorDetail?.CVUseFactor ?? null) : null),
      capitalValue: u.capitalValue ?? u.CapitalValue ?? u.floorConfiguration?.calculatedCapitalValue ?? (isDirectFloor ? (floorDetail?.capitalValue ?? floorDetail?.CapitalValue ?? null) : null),
      cvCalculated: u.cvCalculated !== undefined ? u.cvCalculated : (u.isCalculated !== undefined ? u.isCalculated : true),
      cvCalculationMessage: u.cvCalculationMessage || u.calculationMessage || "",
    };
  });
};
