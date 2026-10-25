/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { sanitizeRenterPayload } from '@/lib/api/ptis/floorSubmission/payload-sanitization';

describe('Payload Sanitization Tests', () => {
  describe('sanitizeRenterPayload - UI Normalized & Raw Keys', () => {
    it('should map UI-friendly keys to standard database keys successfully', () => {
      const uiPayload = {
        id: 206094,
        propertyDetailsId: 206094,
        propertyId: 1024,
        // UI normalized keys
        conYr: '2020',
        asstYr: '2021',
        rooms: 4,
        areaSqM: 120,
        areaSqFt: 1290,
        builtupAreaSqM: 130,
        builtupAreaSqFt: 1400,
        renter: 'Yes',
        isTaxable: 'Yes',
        renterName: 'Alice Renter',

        // Renter Details
        renterDetails: [
          {
            id: 405,
            agreementId: 'AGR-2026-UI',
            incrementFrequency: 'Yearly',
            incrementType: 'Percentage',
            incrementValue: 5,
            durationFrom: '2026-01-01',
            durationTo: '2026-12-31',
            rentMonthly: 1200,
          }
        ],
        // Renter Mast
        renterMast: [
          {
            id: 505,
            financialYear: '2026-27',
            finalRent: 14400,
            durationFrom: '2026-01-01',
            durationTo: '2026-12-31',
          }
        ],
        // UI rooms data
        roomData: [
          {
            id: 601,
            length: 5,
            width: 4,
            height: 3,
            area: 20,
            roomCount: 1,
            utilities: 'Bedroom',
            outer: 'Yes',
            offsetMinus: 'No',
          }
        ]
      };

      const result = sanitizeRenterPayload(uiPayload);

      // Verify Floor Base Attributes mapping
      expect(result.id).toBe(206094);
      expect(result.propertyDetailsId).toBe(206094);
      expect(result.propertyId).toBe(1024);
      expect(result.constructionYear).toBe('2020');
      expect(result.assessmentYear).toBe('2021');
      expect(result.noOfRooms).toBe(4);
      expect(result.carpetAreaSqMeter).toBe(120);
      expect(result.carpetAreaSqFeet).toBe(1290);
      expect(result.builtupAreaSqMeter).toBe(130);
      expect(result.builtupAreaSqFeet).toBe(1400);
      expect(result.renterYesNo).toBe(true);
      expect(result.isRenter).toBe(true);
      expect(result.isTaxable).toBe(true);
      expect(result.renterName).toBe('Alice Renter');

      // Verify Renter Details
      expect(result.renterDetails).toHaveLength(1);
      const rd = (result.renterDetails as any[])[0];
      expect(rd.id).toBe(405);
      expect(rd.propertyDetailsId).toBe(206094);
      expect(rd.agreementId).toBe('AGR-2026-UI');
      expect(rd.rentMonthly).toBe(1200);

      // Verify Renter Mast & Renters
      expect(result.renterMast).toHaveLength(1);
      expect(result.renters).toHaveLength(1);
      const rm = (result.renterMast as any[])[0];
      expect(rm.id).toBe(505);
      expect(rm.propertyDetailsId).toBe(206094);
      expect(rm.financialYear).toBe('2026'); // strictly 4-char truncated
      const rers = (result.renters as any[])[0];
      expect(rers.id).toBe(505);
      expect(rers.propertyDetailsId).toBe(206094);
      expect(rers.financialYear).toBe('2026');

      // Verify Room mapping and injection
      expect(result.roomWiseSubmissionDetails).toHaveLength(1);
      const room = (result.roomWiseSubmissionDetails as any[])[0];
      expect(room.id).toBe(601);
      expect(room.propertyDetailsId).toBe(206094);
      expect(room.lengthMtr).toBeUndefined();
      expect(room.widthMtr).toBeUndefined();
      expect(room.heightMtr).toBe(3);
      expect(room.areaSqMtr).toBe(20);
      expect(room.roomType).toBe('Bedroom');
      expect(room.outerYesNo).toBe(true);
      expect(room.minusYesNo).toBe(false);
    });

    it('should map subFloorId and subFloorDescription to null if not selected', () => {
      const payload = {
        propertyDetailsId: 206094,
        subFloorId: "",
        subFloorDescription: "Select sub floor"
      };

      const result = sanitizeRenterPayload(payload);
      expect(result.subFloorId).toBeNull();
      expect(result.subFloorDescription).toBeNull();
    });

    it('should map subTypeOfUseId and subTypeOfUseDescription to null if not selected', () => {
      const payload = {
        propertyDetailsId: 206094,
        subTypeOfUseId: "0",
        subTypeOfUseDescription: "-Select-"
      };

      const result = sanitizeRenterPayload(payload);
      expect(result.subTypeOfUseId).toBeNull();
      expect(result.subTypeOfUseDescription).toBeNull();
    });

    it('should map subTypeOfUseId and subTypeOfUseDescription to null for select sub type variants with casing', () => {
      const payload = {
        propertyDetailsId: 206094,
        subTypeOfUseId: "Select Sub Type",
        subTypeOfUseDescription: "select subtype"
      };

      const result = sanitizeRenterPayload(payload);
      expect(result.subTypeOfUseId).toBeNull();
      expect(result.subTypeOfUseDescription).toBeNull();
    });

    it('should fall back to raw API keys if UI keys are not present', () => {
      const rawPayload = {
        propertyDetailsId: 206094,
        propertyId: 1024,
        constructionYear: '2019',
        assessmentYear: '2020',
        noOfRooms: 3,
        carpetAreaSqMeter: 100,
        carpetAreaSqFeet: 1076,
        builtupAreaSqMeter: 110,
        builtupAreaSqFeet: 1184,
        renterYesNo: true,
        isTaxable: false,
        renterNameEnglish: 'Bob Renter',

        roomWiseSubmissionDetails: [
          {
            id: 701,
            lengthMtr: 6,
            widthMtr: 5,
            heightMtr: 3,
            areaSqMtr: 30,
            noOfRooms: 1,
            roomType: 'Hall',
            outerYesNo: false,
            minusYesNo: true,
          }
        ]
      };

      const result = sanitizeRenterPayload(rawPayload);

      expect(result.constructionYear).toBe('2019');
      expect(result.assessmentYear).toBe('2020');
      expect(result.noOfRooms).toBe(3);
      expect(result.carpetAreaSqMeter).toBe(100);
      expect(result.carpetAreaSqFeet).toBe(1076);
      expect(result.builtupAreaSqMeter).toBe(110);
      expect(result.builtupAreaSqFeet).toBe(1184);
      expect(result.renterYesNo).toBe(true);
      expect(result.isRenter).toBe(true);
      expect(result.isTaxable).toBe(false);
      expect(result.renterName).toBe('Bob Renter');

      expect(result.roomWiseSubmissionDetails).toHaveLength(1);
      const room = (result.roomWiseSubmissionDetails as any[])[0];
      expect(room.id).toBe(701);
      expect(room.lengthMtr).toBeUndefined();
      expect(room.widthMtr).toBeUndefined();
      expect(room.areaSqMtr).toBe(30);
      expect(room.roomType).toBe('Hall');
      expect(room.minusYesNo).toBe(true);
    });

    it('should deduplicate room entries by ID or roomNo', () => {
      const payload = {
        propertyDetailsId: 206094,
        roomWiseSubmissionDetails: [
          { id: 1, roomNo: 'R-1', lengthMtr: 5 }
        ],
        roomData: [
          { id: 1, roomNo: 'R-1', length: 5 }, // Duplicate ID & roomNo
          { id: 2, roomNo: 'R-2', length: 6 }  // Unique
        ]
      };

      const result = sanitizeRenterPayload(payload);
      expect(result.roomWiseSubmissionDetails).toHaveLength(2);
      const ids = (result.roomWiseSubmissionDetails as any[]).map(r => r.id);
      expect(ids).toContain(1);
      expect(ids).toContain(2);
    });

    it('should map room update identifiers and updatedBy when processing an update payload', () => {
      const updatePayload = {
        propertyDetailsId: 206094,
        roomWiseSubmissionDetails: [
          {
            id: 801,
            lengthMtr: 5,
            widthMtr: 4,
            roomWiseMinusData: [
              {
                id: 901,
                lengthMtr: 1,
                widthMtr: 1,
              }
            ]
          }
        ]
      };

      const result = sanitizeRenterPayload(updatePayload);
      expect(result.updatedBy).toBe(0);
      expect(result.createdBy).toBeUndefined();

      expect(result.roomWiseSubmissionDetails).toHaveLength(1);
      const room = (result.roomWiseSubmissionDetails as any[])[0];
      expect(room.id).toBe(801);
      expect(room.updatedBy).toBe(0);
      expect(room.createdBy).toBeUndefined();
      expect(room.roomWiseSubmissionId).toBe(801);

      expect(room.roomWiseMinusData).toHaveLength(1);
      const minus = room.roomWiseMinusData[0];
      expect(minus.id).toBe(901);
      expect(minus.updatedBy).toBe(0);
      expect(minus.createdBy).toBeUndefined();
      expect(minus.roomWiseMinusId).toBe(901);
      expect(minus.roomWiseSubmissionId).toBe(801);
    });

    it('should map isOffset to true for addition operation and false for subtraction operation', () => {
      const payload = {
        propertyDetailsId: 206094,
        roomWiseSubmissionDetails: [
          {
            id: 801,
            roomWiseMinusData: [
              {
                id: 901,
                operation: 'add',
              },
              {
                id: 902,
                operation: 'subtract',
              }
            ]
          }
        ]
      };

      const result = sanitizeRenterPayload(payload);
      expect(result.roomWiseSubmissionDetails).toHaveLength(1);
      const room = (result.roomWiseSubmissionDetails as any[])[0];
      expect(room.roomWiseMinusData).toHaveLength(2);

      const firstMinus = room.roomWiseMinusData[0];
      expect(firstMinus.isOffset).toBe(true);

      const secondMinus = room.roomWiseMinusData[1];
      expect(secondMinus.isOffset).toBe(false);
    });
  });

  describe('Open Space Mapping Requirements', () => {
    it('should map Open Space fields correctly when isOpenPlot is true or selectedFloorType is OpenPlot', () => {
      const openSpacePayload = {
        propertyDetailsId: 206094,
        propertyId: 1024,
        isOpenPlot: true,
        length: 12.5,
        width: 10,
        roomWiseSubmissionDetails: [
          { id: 1, roomNo: 'Room 1', lengthMtr: 5 }
        ]
      };

      const result = sanitizeRenterPayload(openSpacePayload);

      expect(result.isOpenPlot).toBe(true);
      expect(result.length).toBeUndefined();
      expect(result.width).toBeUndefined();
      expect(result.lengthMtr).toBeUndefined();
      expect(result.widthMtr).toBeUndefined();
      expect(result.roomWiseSubmissionDetails).toHaveLength(1);
      expect(result.roomWiseMinusData).toEqual([]);
    });

    it('should set isOpenPlot to false and length/width to null for non-Open Space submissions', () => {
      const constructionPayload = {
        propertyDetailsId: 206094,
        propertyId: 1024,
        selectedFloorType: 'Construction',
        length: 12.5,
        width: 10,
        roomWiseSubmissionDetails: [
          { id: 1, roomNo: 'Room 1', lengthMtr: 5 }
        ]
      };

      const result = sanitizeRenterPayload(constructionPayload);

      expect(result.isOpenPlot).toBe(false);
      expect(result.length).toBeUndefined();
      expect(result.width).toBeUndefined();
      expect(result.lengthMtr).toBeUndefined();
      expect(result.widthMtr).toBeUndefined();
      expect(result.roomWiseSubmissionDetails).toHaveLength(1);
    });

    it('should map selectedOpenPlotCategory.id to typeOfUseId when isOpenPlot is true', () => {
      const openPlotPayload = {
        propertyDetailsId: 206094,
        propertyId: 1024,
        isOpenPlot: true,
        selectedOpenPlotCategory: {
          id: 15111,
          typeOfUseId: 15111,
          typeOfUseCode: 'OPI',
          description: 'खुला भूखंड औद्योगिक',
          type: 'C',
          typeOfUseGroupId: 10031,
          typeOfUseCategoryId: 3,
          isActive: true
        }
      };

      const result = sanitizeRenterPayload(openPlotPayload);

      expect(result.isOpenPlot).toBe(true);
      expect(result.typeOfUseId).toBe(15111);
      expect(result.typeOfUseDescription).toBe('खुला भूखंड औद्योगिक');
    });

    it('should preserve explicit isTaxable="No" when provided for Open Plot floors', () => {
      const openPlotPayload = {
        propertyDetailsId: 206094,
        propertyId: 1024,
        isOpenPlot: true,
        isTaxable: 'No',
        selectedOpenPlotCategory: {
          id: 15111,
          typeOfUseId: 15111,
          typeOfUseCode: 'OPC',
          description: 'OPC - खुला भूखंड अनिवासी',
        }
      };

      const result = sanitizeRenterPayload(openPlotPayload);

      expect(result.isOpenPlot).toBe(true);
      expect(result.isTaxable).toBe(false);
    });
  });
});
