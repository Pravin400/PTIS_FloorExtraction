import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBuildingPermissionsAction,
  getSocietyWingTypesWithStatusAction,
  getCertificateTypeMasterAction,
  getWingsByPropertyAction,
  getUnitsByPropertyAction,
  getFloorCertificatesAction,
  getApartmentQcCertificateGridAction,
  saveCertificateAction,
  replaceCertificateDocumentAction,
  saveBuildingPermissionsAction,
  deleteCertificateDocumentAction,
  deletePropertyCertificateAction,
  postApartmentQcCertificateRecordAction,
  deletePropertyCertificateRecordAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action';

import {
  getCertificateTypesWithStatus,
  getCertificateTypeMaster,
  getWingsByProperty,
  getUnitsByProperty,
  replaceCertificateDocument,
  deleteCertificateDocument,
  bulkSaveCertificates,
  getFloorCertificates,
  saveCertificate,
  deletePropertyCertificate,
  deletePropertyCertificateByDocumentId,
  getSocietyWingTypesWithStatus,
  postApartmentQcCertificateRecord,
  deleteApartmentQcCertificateRecord,
} from '@/lib/api/building.service';
import { getDocumentDetails } from '@/lib/api/document.service';
import {
  CertificateScope,
  PropertyCertificateWithStatusDto,
  FloorCertificatesResponseDto,
  SaveCertificateResponseDto,
  PropertyCertificateUploadResponseDto,
  PropertyCertificateBulkSaveResponseDto,
  CreateCertificateRecordResponseDto,
} from '@/types/building-permission.types';
import { fetchApartmentQcCertificateGrid } from '@/lib/api/ptis/apartment/apartment-qc-top-section.service';
import type { DocumentDto } from '@/types/document.types';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/api/building.service', () => ({
  getCertificateTypesWithStatus: vi.fn(),
  getCertificateTypeMaster: vi.fn(),
  getWingsByProperty: vi.fn(),
  getUnitsByProperty: vi.fn(),
  replaceCertificateDocument: vi.fn(),
  deleteCertificateDocument: vi.fn(),
  bulkSaveCertificates: vi.fn(),
  getFloorCertificates: vi.fn(),
  saveCertificate: vi.fn(),
  deletePropertyCertificate: vi.fn(),
  deletePropertyCertificateByDocumentId: vi.fn(),
  getSocietyWingTypesWithStatus: vi.fn(),
  postApartmentQcCertificateRecord: vi.fn(),
  deleteApartmentQcCertificateRecord: vi.fn(),
}));

vi.mock('@/lib/api/document.service', () => ({
  getDocumentDetails: vi.fn(),
}));

vi.mock('@/lib/api/ptis/apartment/apartment-qc-top-section.service', () => ({
  fetchApartmentQcCertificateGrid: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Building Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getWingsByProperty).mockResolvedValue({ success: false, data: [] });
  });

  describe('getBuildingPermissionsAction', () => {
    it('returns certificates on success', async () => {
      const mockData = [{ certificateTypeId: 1, certificateTypeName: 'CC' }];
      vi.mocked(getCertificateTypesWithStatus).mockResolvedValue({ success: true, data: mockData as unknown as PropertyCertificateWithStatusDto[] });

      const res = await getBuildingPermissionsAction('100');
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockData);
    });

    it('handles error', async () => {
      vi.mocked(getCertificateTypesWithStatus).mockRejectedValue(new Error('Network error'));
      const res = await getBuildingPermissionsAction('100');
      expect(res.success).toBe(false);
    });
  });

  describe('getSocietyWingTypesWithStatusAction', () => {
    it('returns society wing certificates on success', async () => {
      const mockData = [{ certificateTypeId: 2, certificateTypeName: 'Plinth' }];
      vi.mocked(getSocietyWingTypesWithStatus).mockResolvedValue({ success: true, data: mockData as unknown as PropertyCertificateWithStatusDto[] });

      const res = await getSocietyWingTypesWithStatusAction(10, 20);
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockData);
    });
  });

  describe('getCertificateTypeMasterAction', () => {
    it('returns master types on success', async () => {
      const mockData = [{ id: 1, name: 'CC' }];
      vi.mocked(getCertificateTypeMaster).mockResolvedValue({ success: true, data: mockData });

      const res = await getCertificateTypeMasterAction();
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockData);
    });
  });

  describe('getWingsByPropertyAction', () => {
    it('returns wings on success', async () => {
      const mockData = [{ wingDetailId: 1, wingName: 'Wing A' }];
      vi.mocked(getWingsByProperty).mockResolvedValue({ success: true, data: mockData });

      const res = await getWingsByPropertyAction('100');
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockData);
    });
  });

  describe('getUnitsByPropertyAction', () => {
    it('returns units on success', async () => {
      const mockData = [{ propertyId: 101, unitNo: '101' }];
      vi.mocked(getUnitsByProperty).mockResolvedValue({ success: true, data: mockData, totalCount: 1 });

      const res = await getUnitsByPropertyAction('100', 1, 1, 10);
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockData);
    });
  });

  describe('getFloorCertificatesAction', () => {
    it('returns floor certificates on success', async () => {
      const mockData = { floorCertificates: [] };
      vi.mocked(getFloorCertificates).mockResolvedValue({ success: true, data: mockData as unknown as FloorCertificatesResponseDto });

      const res = await getFloorCertificatesAction('100', 5);
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockData);
    });
  });

  describe('getApartmentQcCertificateGridAction', () => {
    it('returns grid on success', async () => {
      const mockData = { wingCount: 2, unitCount: 10, records: [] };
      vi.mocked(fetchApartmentQcCertificateGrid).mockResolvedValue({ success: true, data: mockData as unknown as Record<string, unknown> });

      const res = await getApartmentQcCertificateGridAction('100', 1, 10);
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockData);
    });
  });

  describe('saveCertificateAction', () => {
    it('saves certificate and revalidates path on success', async () => {
      vi.mocked(saveCertificate).mockResolvedValue({ success: true, data: { propertyCertificateId: 55 } as unknown as SaveCertificateResponseDto });

      const res = await saveCertificateAction('en', '100', {
        propertyId: 100,
        certificateScope: CertificateScope.Property,
        certificateTypeId: 1,
        certificateNo: 'CERT-1',
        certificateIssueDate: '2025-01-01',
        societyDetailId: 10,
        wingDetailId: 20,
      });

      expect(res.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/en/property-tax/ptis/QuickDataEntry/100/Building', 'page');
    });

    it('sets societyDetailId and wingDetailId to null for individual properties and does not call wing fallback', async () => {
      vi.mocked(saveCertificate).mockResolvedValue({ success: true, data: { propertyCertificateId: 55 } as unknown as SaveCertificateResponseDto });

      const res = await saveCertificateAction('en', '100', {
        propertyId: 100,
        certificateScope: CertificateScope.Property,
        certificateTypeId: 1,
        certificateNo: 'CERT-1',
        certificateIssueDate: '2025-01-01',
      });

      expect(res.success).toBe(true);
      expect(getWingsByProperty).not.toHaveBeenCalled();
      expect(saveCertificate).toHaveBeenCalledWith(
        expect.objectContaining({
          societyDetailId: null,
          wingDetailId: null,
        })
      );
    });

    it('falls back to wing query only for apartment inner properties with society and propertyDetailsId', async () => {
      vi.mocked(getWingsByProperty).mockResolvedValue({
        success: true,
        data: [{ societyDetailId: 77, wingDetailId: 88 }],
      });
      vi.mocked(saveCertificate).mockResolvedValue({ success: true, data: { propertyCertificateId: 55 } as unknown as SaveCertificateResponseDto });

      const res = await saveCertificateAction('en', '100', {
        propertyId: 100,
        propertyDetailsId: 501,
        societyDetailId: 77,
        certificateScope: CertificateScope.Floor,
        certificateTypeId: 1,
        certificateNo: 'CERT-1',
        certificateIssueDate: '2025-01-01',
      });

      expect(res.success).toBe(true);
      expect(saveCertificate).toHaveBeenCalledWith(
        expect.objectContaining({
          societyDetailId: 77,
          wingDetailId: 88,
        })
      );
    });
  });

  describe('replaceCertificateDocumentAction', () => {
    it('returns error if file is missing', async () => {
      const formData = new FormData();
      const res = await replaceCertificateDocumentAction(55, formData, 'en', '100');
      expect(res.success).toBe(false);
      expect(res.error).toBe('No file provided');
    });

    it('uploads file and revalidates on success', async () => {
      const formData = new FormData();
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('File', file);
      formData.append('CertificateTypeId', '1');

      vi.mocked(replaceCertificateDocument).mockResolvedValue({
        success: true,
        data: { documentGuid: 'new-guid', fileName: 'test.pdf' } as unknown as PropertyCertificateUploadResponseDto,
      });

      const res = await replaceCertificateDocumentAction(55, formData, 'en', '100');
      expect(res.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/en/property-tax/ptis/QuickDataEntry/100/Building', 'page');
    });
  });

  describe('saveBuildingPermissionsAction', () => {
    it('preserves existing document guid and performs bulk save', async () => {
      vi.mocked(getCertificateTypesWithStatus).mockResolvedValue({
        success: true,
        data: [
          {
            certificateTypeId: 1,
            documentGuid: 'existing-guid-1',
            propertyCertificateId: 101,
            hasCertificate: true,
            isActive: true,
          } as unknown as PropertyCertificateWithStatusDto,
        ],
      });
      vi.mocked(bulkSaveCertificates).mockResolvedValue({
        success: true,
        data: {
          updatedCertificates: [{ certificateTypeId: 1, propertyCertificateId: 101 } as unknown as PropertyCertificateWithStatusDto],
        } as unknown as PropertyCertificateBulkSaveResponseDto,
      });

      const formData = new FormData();
      formData.append(
        'certificates',
        JSON.stringify({
          certificates: [
            {
              certificateTypeId: 1,
              isEnabled: true,
              certificateNo: 'UPDATED-NO',
              issueDate: '2025-01-01',
              societyDetailId: 5,
              wingDetailId: 10,
            },
          ],
        })
      );

      const res = await saveBuildingPermissionsAction('en', '100', formData);
      expect(res.success).toBe(true);
      expect(bulkSaveCertificates).toHaveBeenCalledWith({
        certificates: [
          expect.objectContaining({
            certificateTypeId: 1,
            existingDocumentGuid: 'existing-guid-1',
          }),
        ],
      });
    });

    it('cleanses societyDetailId and wingDetailId to null for individual properties in bulk save', async () => {
      vi.mocked(getCertificateTypesWithStatus).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(bulkSaveCertificates).mockResolvedValue({
        success: true,
        data: { updatedCertificates: [] } as unknown as PropertyCertificateBulkSaveResponseDto,
      });

      const formData = new FormData();
      formData.append(
        'certificates',
        JSON.stringify({
          certificates: [
            {
              certificateTypeId: 1,
              isEnabled: true,
              certificateNo: 'INDIVIDUAL-CERT',
              issueDate: '2025-01-01',
            },
          ],
        })
      );

      const res = await saveBuildingPermissionsAction('en', '100', formData);
      expect(res.success).toBe(true);
      expect(getWingsByProperty).not.toHaveBeenCalled();
      expect(bulkSaveCertificates).toHaveBeenCalledWith({
        certificates: [
          expect.objectContaining({
            certificateTypeId: 1,
            societyDetailId: null,
            wingDetailId: null,
          }),
        ],
      });
    });

    it('deletes certificate when markedForDeletion is true', async () => {
      vi.mocked(getCertificateTypesWithStatus).mockResolvedValue({
        success: true,
        data: [
          {
            certificateTypeId: 1,
            documentGuid: 'existing-guid-1',
            propertyCertificateId: 101,
            hasCertificate: true,
            isActive: true,
          } as unknown as PropertyCertificateWithStatusDto,
        ],
      });
      vi.mocked(deletePropertyCertificate).mockResolvedValue({ success: true });
      vi.mocked(bulkSaveCertificates).mockResolvedValue({
        success: true,
        data: { updatedCertificates: [] } as unknown as PropertyCertificateBulkSaveResponseDto,
      });

      const formData = new FormData();
      formData.append(
        'certificates',
        JSON.stringify({
          certificates: [
            {
              certificateTypeId: 1,
              markedForDeletion: true,
              isEnabled: false,
            },
          ],
        })
      );

      const res = await saveBuildingPermissionsAction('en', '100', formData);
      expect(res.success).toBe(true);
      expect(deletePropertyCertificate).toHaveBeenCalledWith(100, 1, null);
    });
  });

  describe('deleteCertificateDocumentAction', () => {
    it('deletes document and revalidates', async () => {
      vi.mocked(deleteCertificateDocument).mockResolvedValue({ success: true });

      const res = await deleteCertificateDocumentAction('guid-123', 'en', '100');
      expect(res.success).toBe(true);
      expect(deleteCertificateDocument).toHaveBeenCalledWith('guid-123');
      expect(revalidatePath).toHaveBeenCalledWith('/en/property-tax/ptis/QuickDataEntry/100/Building', 'page');
    });
  });

  describe('deletePropertyCertificateAction', () => {
    it('deletes certificate and revalidates', async () => {
      vi.mocked(deletePropertyCertificate).mockResolvedValue({ success: true });

      const res = await deletePropertyCertificateAction(100, 1, null, 'en', '100');
      expect(res.success).toBe(true);
      expect(deletePropertyCertificate).toHaveBeenCalledWith(100, 1, null);
      expect(revalidatePath).toHaveBeenCalledWith('/en/property-tax/ptis/QuickDataEntry/100/Building', 'page');
    });
  });

  describe('postApartmentQcCertificateRecordAction', () => {
    it('preserves existing document reference when isFileModified is false', async () => {
      vi.mocked(postApartmentQcCertificateRecord).mockResolvedValue({
        success: true,
        data: { propertyCertificateIds: [999] } as unknown as CreateCertificateRecordResponseDto,
      });

      const formData = new FormData();
      formData.append(
        'payload',
        JSON.stringify({
          level: 'Unit',
          selectedWingDetailId: 1,
          selectedUnitIds: [201],
          certificateTypeId: 1,
          certificateDate: '2025-01-01',
          certificateNumber: 'CERT-A8',
          documentGuid: 'doc-guid-999',
          existingDocumentGuid: 'doc-guid-999',
          propertyCertificateId: 999,
          fileName: 'cert.pdf',
          isFileModified: false,
          societyDetailId: 5,
        })
      );

      const res = await postApartmentQcCertificateRecordAction('en', '100', formData);
      expect(res.success).toBe(true);
      expect(postApartmentQcCertificateRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 2,
          documentGuid: 'doc-guid-999',
          existingDocumentGuid: 'doc-guid-999',
          propertyCertificateId: 999,
          fileName: 'cert.pdf',
          isFileModified: false,
          hasDocument: true,
        })
      );
      // Ensure replaceCertificateDocument was NOT called since no new file was attached
      expect(replaceCertificateDocument).not.toHaveBeenCalled();
    });

    it('uploads replacement file when isFileModified is true', async () => {
      vi.mocked(postApartmentQcCertificateRecord).mockResolvedValue({
        success: true,
        data: { propertyCertificateIds: [999] } as unknown as CreateCertificateRecordResponseDto,
      });
      vi.mocked(replaceCertificateDocument).mockResolvedValue({
        success: true,
        data: { documentGuid: 'new-guid', fileName: 'new.pdf' } as unknown as PropertyCertificateUploadResponseDto,
      });

      const formData = new FormData();
      const newFile = new File(['content'], 'new.pdf', { type: 'application/pdf' });
      formData.append('file', newFile);
      formData.append(
        'payload',
        JSON.stringify({
          level: 'Unit',
          selectedWingDetailId: 1,
          selectedUnitIds: [201],
          certificateTypeId: 1,
          certificateDate: '2025-01-01',
          certificateNumber: 'CERT-A8',
          isFileModified: true,
          societyDetailId: 5,
        })
      );

      const res = await postApartmentQcCertificateRecordAction('en', '100', formData);
      expect(res.success).toBe(true);
      expect(postApartmentQcCertificateRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 2,
          isFileModified: true,
          hasDocument: false,
        })
      );
      expect(replaceCertificateDocument).toHaveBeenCalledWith(999, expect.any(File), 100, 1);
    });
  });

  describe('deletePropertyCertificateRecordAction', () => {
    it('deletes through deleteApartmentQcCertificateRecord when societyDetailId is present', async () => {
      vi.mocked(deleteApartmentQcCertificateRecord).mockResolvedValue({
        success: true,
        message: 'Deleted successfully',
        data: {
          effectiveScope: 'Unit',
          deletedPropertyCertificateIds: [201],
          deletedCount: 1,
          taxRecalculationTriggered: false,
        },
      });

      const res = await deletePropertyCertificateRecordAction('en', '100', {
        certificateTypeId: 1,
        societyDetailId: 5,
        level: 'Unit',
        selectedUnitIds: [201],
      });

      expect(res.success).toBe(true);
      expect(deleteApartmentQcCertificateRecord).toHaveBeenCalledWith({
        level: 2,
        societyDetailId: 5,
        wingDetailId: null,
        unitPropertyIds: [201],
        certificateTypeId: 1,
        documentGuid: null,
      });
      expect(revalidatePath).toHaveBeenCalledWith('/en/property-tax/ptis/QuickDataEntry/100/Building', 'page');
    });

    it('falls back to deletePropertyCertificateByDocumentId when documentId is provided', async () => {
      vi.mocked(deletePropertyCertificateByDocumentId).mockResolvedValue({
        success: true,
        message: 'Deleted doc',
      });

      const res = await deletePropertyCertificateRecordAction('en', '100', {
        certificateTypeId: 1,
        documentId: 42,
      });

      expect(res.success).toBe(true);
      expect(deletePropertyCertificateByDocumentId).toHaveBeenCalledWith(42);
      expect(revalidatePath).toHaveBeenCalledWith('/en/property-tax/ptis/QuickDataEntry/100/Building', 'page');
    });

    it('resolves documentId from getDocumentDetails when documentGuid is provided', async () => {
      vi.mocked(getDocumentDetails).mockResolvedValue({
        success: true,
        data: { id: 777 } as unknown as DocumentDto,
      });
      vi.mocked(deletePropertyCertificateByDocumentId).mockResolvedValue({
        success: true,
      });

      const res = await deletePropertyCertificateRecordAction('en', '100', {
        certificateTypeId: 1,
        documentGuid: 'some-guid',
      });

      expect(res.success).toBe(true);
      expect(deletePropertyCertificateByDocumentId).toHaveBeenCalledWith(777);
    });
  });
});
