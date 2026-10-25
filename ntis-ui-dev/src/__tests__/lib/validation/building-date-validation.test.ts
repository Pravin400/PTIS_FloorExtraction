import { describe, it, expect } from 'vitest';
import { parseDateString, validateDocumentDate, validateDocumentNumber } from '@/lib/validation/building/validation-rules';
import { validateBuildingForm } from '@/lib/utils/validateBuildingForm';
import { mapBuildingStateToApi, mapTypeNameToKey } from '@/lib/utils/building-helpers';
import { BuildingPermissionState } from '@/types/building-permission.types';

describe('Building Form Validation & Date Semantics', () => {
    describe('parseDateString', () => {
        it('should parse YYYY-MM-DD into a UTC date object', () => {
            const date = parseDateString('2026-01-01');
            expect(date).not.toBeNull();
            expect(date?.getUTCFullYear()).toBe(2026);
            expect(date?.getUTCMonth()).toBe(0); // January
            expect(date?.getUTCDate()).toBe(1);
        });

        it('should return null for empty or invalid date strings', () => {
            expect(parseDateString('')).toBeNull();
            expect(parseDateString('invalid-date')).toBeNull();
            expect(parseDateString('2026-02-31')).toBeNull();
        });
    });

    describe('validateDocumentDate', () => {
        it('should validate past or present dates without timezone shifts', () => {
            const result = validateDocumentDate('2025-05-15');
            expect(result).toBeNull();
        });

        it('should reject future dates', () => {
            const futureYear = new Date().getFullYear() + 5;
            const result = validateDocumentDate(`${futureYear}-01-01`);
            expect(result).toEqual({ key: 'common.validation.dateFuture' });
        });
    });

    describe('validateDocumentNumber', () => {
        it('should reject document numbers with spaces', () => {
            const result = validateDocumentNumber('OC 12345', 'Occupancy Certificate (OC)');
            expect(result).toEqual({ key: 'common.validation.numberNoSpaces' });
        });

        it('should accept valid space-free document numbers', () => {
            const result = validateDocumentNumber('OC-12345', 'Occupancy Certificate (OC)');
            expect(result).toBeNull();
        });

        it('should reject empty or whitespace document number', () => {
            expect(validateDocumentNumber('', 'Agreement')).toEqual({ key: 'common.validation.numberRequired' });
            expect(validateDocumentNumber('   ', 'Sale Deed')).toEqual({ key: 'common.validation.numberRequired' });
        });

        it('should reject all zeros and repeated characters', () => {
            expect(validateDocumentNumber('00000000', 'Agreement')).toEqual({ key: 'common.validation.numberAllZeros' });
            expect(validateDocumentNumber('AAAAAAAA', 'Agreement')).toEqual({ key: 'common.validation.numberRepeated' });
        });

        it('should reject dummy text patterns', () => {
            expect(validateDocumentNumber('TEST-12345', 'Agreement')).toEqual({ key: 'common.validation.numberDummyText' });
            expect(validateDocumentNumber('DUMMY-999', 'Agreement')).toEqual({ key: 'common.validation.numberDummyText' });
        });

        it('validates CC (Completion Certificate / Commencement Certificate)', () => {
            expect(validateDocumentNumber('TMC/CC/2024/001', 'Completion Certificate', 'CC')).toBeNull();
            expect(validateDocumentNumber('AB', 'Completion Certificate', 'CC')).toEqual({ key: 'common.validation.numberInvalidCOP' });
        });

        it('validates OC (Occupancy Certificate)', () => {
            expect(validateDocumentNumber('TMC/OC/2024/002', 'Occupancy Certificate', 'OC')).toBeNull();
            expect(validateDocumentNumber('12', 'Occupancy Certificate', 'OC')).toEqual({ key: 'common.validation.numberInvalidCOP' });
        });

        it('validates BeBillDt (Electric Bill Date / Electric Bill)', () => {
            expect(validateDocumentNumber('95248102345', 'Electric Bill Date', 'BeBillDt')).toBeNull();
            expect(validateDocumentNumber('12345', 'Electric Bill Date', 'BeBillDt')).toEqual({ key: 'common.validation.numberInvalidElectric' });
            expect(validateDocumentNumber('ELECTRIC123', 'Electric Bill Date', 'BeBillDt')).toEqual({ key: 'common.validation.numberInvalidElectric' });
        });

        it('validates POSSESSION_CERTIFICATE (Possession Certificate)', () => {
            expect(validateDocumentNumber('POSS-2024-8899', 'Possession Certificate', 'POSSESSION_CERTIFICATE')).toBeNull();
            expect(validateDocumentNumber('P1', 'Possession Certificate', 'POSSESSION_CERTIFICATE')).toEqual({ key: 'common.validation.numberInvalidCOP' });
        });

        it('validates INDEX_2 (Index 2)', () => {
            expect(validateDocumentNumber('TNN4-1234-2023', 'Index 2', 'INDEX_2')).toBeNull();
            expect(validateDocumentNumber('TNN4/1234/2023', 'Index 2', 'INDEX_2')).toBeNull();
            expect(validateDocumentNumber('INVALID', 'Index 2', 'INDEX_2')).toEqual({ key: 'common.validation.numberInvalidIndex2' });
        });

        it('validates AGREEMENT (Agreement)', () => {
            expect(validateDocumentNumber('AGR-2024-5544', 'Agreement', 'AGREEMENT')).toBeNull();
            expect(validateDocumentNumber('AG', 'Agreement', 'AGREEMENT')).toEqual({ key: 'common.validation.numberInvalidAgreement' });
            expect(validateDocumentNumber('AGR@2024', 'Agreement', 'AGREEMENT')).toEqual({ key: 'common.validation.numberInvalidAgreement' });
        });

        it('validates SALE_DEED (Sale Deed)', () => {
            expect(validateDocumentNumber('DEED-9876-2022', 'Sale Deed', 'SALE_DEED')).toBeNull();
            expect(validateDocumentNumber('SD', 'Sale Deed', 'SALE_DEED')).toEqual({ key: 'common.validation.numberInvalidSaleDeed' });
        });

        it('validates TAX_RECEIPT (Tax Receipt)', () => {
            expect(validateDocumentNumber('TR-2024-12345', 'Tax Receipt', 'TAX_RECEIPT')).toBeNull();
            expect(validateDocumentNumber('TR1', 'Tax Receipt', 'TAX_RECEIPT')).toEqual({ key: 'common.validation.numberInvalidTaxReceipt' });
        });

        it('validates AADHAR_CARD (Aadhar Card)', () => {
            expect(validateDocumentNumber('543298761234', 'Aadhar Card', 'AADHAR_CARD')).toBeNull();
            // Less than 12 digits
            expect(validateDocumentNumber('54329876123', 'Aadhar Card', 'AADHAR_CARD')).toEqual({ key: 'common.validation.numberInvalidAadhar' });
            // Starts with 0
            expect(validateDocumentNumber('012345678901', 'Aadhar Card', 'AADHAR_CARD')).toEqual({ key: 'common.validation.numberInvalidAadharStart' });
            // Starts with 1
            expect(validateDocumentNumber('123456789012', 'Aadhar Card', 'AADHAR_CARD')).toEqual({ key: 'common.validation.numberInvalidAadharStart' });
            // Contains letters
            expect(validateDocumentNumber('54329876123A', 'Aadhar Card', 'AADHAR_CARD')).toEqual({ key: 'common.validation.numberInvalidAadhar' });
        });

        it('validates OTHER (Other)', () => {
            expect(validateDocumentNumber('DOC-REF-001', 'Other', 'OTHER')).toBeNull();
            expect(validateDocumentNumber('X', 'Other', 'OTHER')).toEqual({ key: 'common.validation.numberInvalidOther' });
        });
    });

    describe('validateBuildingForm - CC vs OC Date Logic', () => {
        const mockT = (key: string) => key;

        it('should ALLOW Occupancy Certificate (OC) on the SAME DAY as Commencement Certificate (CC)', () => {
            const state: BuildingPermissionState = {
                1: {
                    certificateTypeId: 1,
                    enabled: true,
                    certificateTypeName: 'Commencement Certificate (CC)',
                    number: 'CC-10001',
                    date: '2026-01-01',
                    documentGuid: 'doc-guid-1',
                },
                2: {
                    certificateTypeId: 2,
                    enabled: true,
                    certificateTypeName: 'Occupancy Certificate (OC)',
                    number: 'OC-20002',
                    date: '2026-01-01', // Same day
                    documentGuid: 'doc-guid-2',
                },
            };

            const result = validateBuildingForm(state, mockT);
            expect(result.isValid).toBe(true);
            expect(result.incompleteCertificates).toHaveLength(0);
        });

        it('should REJECT Occupancy Certificate (OC) date strictly BEFORE Commencement Certificate (CC) date', () => {
            const state: BuildingPermissionState = {
                1: {
                    certificateTypeId: 1,
                    enabled: true,
                    certificateTypeName: 'Commencement Certificate (CC)',
                    number: 'CC-10001',
                    date: '2026-06-01',
                    documentGuid: 'doc-guid-1',
                },
                2: {
                    certificateTypeId: 2,
                    enabled: true,
                    certificateTypeName: 'Occupancy Certificate (OC)',
                    number: 'OC-20002',
                    date: '2026-01-01', // Before CC
                    documentGuid: 'doc-guid-2',
                },
            };

            const result = validateBuildingForm(state, mockT);
            expect(result.isValid).toBe(false);
            expect(result.fieldErrors?.[2]?.date).toBe('validation.occupancyDateAfterCommencement');
        });
    });

    describe('mapBuildingStateToApi - Normalization', () => {
        it('should strip spaces from certificate numbers deterministically', () => {
            const state: BuildingPermissionState = {
                1: {
                    certificateTypeId: 1,
                    enabled: true,
                    certificateTypeName: 'Occupancy Certificate (OC)',
                    number: '  OC  -  123 456  ',
                    date: '2026-01-01',
                    documentGuid: 'doc-guid-1',
                },
            };

            const payload = mapBuildingStateToApi(state, 549441);
            expect(payload.certificates[0].certificateNumber).toBe('OC-123456');
        });
    });

    describe('mapTypeNameToKey', () => {
        it('should map various certificate type names to canonical keys', () => {
            expect(mapTypeNameToKey('Commencement Certificate (CC)')).toBe('commencementCertificate');
            expect(mapTypeNameToKey('Occupancy Certificate (OC)')).toBe('occupancyCertificate');
            expect(mapTypeNameToKey('Electric Bill')).toBe('electricBill');
            expect(mapTypeNameToKey('Index 2')).toBe('index2');
        });
    });
});
