import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatIndianCurrency,
  formatAddressWithWingAndPincode,
  mapIndividualPerformanceData,
  mapIndividualPropertyDtoToMasterData,
} from '@/lib/api/ptis/individual/individual-property.mapper';
import {
  fetchIndividualQcTopSection,
  patchIndividualProperty,
} from '@/lib/api/ptis/individual/individual-property.service';
import {
  getIndividualQcTopSectionAction,
  patchIndividualPropertyAction,
} from '@/lib/api/ptis/individual/individual-property.actions';
import {
  buildInitialIndividualMasterData,
  type PtisPageData,
} from '@/app/[locale]/property-tax/ptis/individual/individual-property.builder';
import { apiClient } from '@/services/api.service';
import * as individualService from '@/lib/api/ptis/individual/individual-property.service';
import * as apartmentService from '@/lib/api/ptis/apartment/apartment-qc-top-section.service';
import type { ApartmentQcTopSectionDto } from '@/lib/api/ptis/apartment/apartment-qc-top-section.service';
import * as propertySocietyService from '@/lib/api/property-society.service';
import { revalidatePath } from 'next/cache';
import type {
  IndividualPropertyDto,
  IndividualAdditionalRevenueDto,
  IndividualPropertyMasterData,
  IndividualPerformanceData,
} from '@/types/property-tax/individual';

vi.mock('@/lib/utils/document-utils', () => ({
  getViewDocumentUrl: (guid: string) => `https://test.docs.com/view/${guid}`,
}));

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('@/lib/api/ptis/apartment/apartment-qc-top-section.service', () => ({
  fetchApartmentQcTopSection: vi.fn(),
}));

vi.mock('@/lib/api/property-society.service', () => ({
  getPropertySocietyDetails: vi.fn(),
}));

describe('Individual Property - API, Mapper, Actions & Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. MAPPER TESTS
  // ==========================================
  describe('individual-property.mapper', () => {
    describe('formatIndianCurrency', () => {
      it('formats valid, negative, zero and edge cases correctly', () => {
        expect(formatIndianCurrency(null)).toBe('₹0');
        expect(formatIndianCurrency(undefined)).toBe('₹0');
        expect(formatIndianCurrency('')).toBe('₹0');
        expect(formatIndianCurrency('invalid')).toBe('₹0');
        expect(formatIndianCurrency(0)).toBe('₹0');
        expect(formatIndianCurrency(116318)).toBe('₹1,16,318');
        expect(formatIndianCurrency(-659221)).toBe('-₹6,59,221');
        expect(formatIndianCurrency('5000')).toBe('₹5,000');
      });
    });

    describe('formatAddressWithWingAndPincode', () => {
      it('formats address with both wingName and pinCode', () => {
        const res = formatAddressWithWingAndPincode(
          'BHIVANDI RD MAJIWADA MOJES COMP KAPURBAVA',
          'A Wing',
          '400608'
        );
        expect(res).toBe('A Wing - BHIVANDI RD MAJIWADA MOJES COMP KAPURBAVA - 400608');
      });

      it('formats address with wingName only when pinCode is null/empty/dash', () => {
        expect(
          formatAddressWithWingAndPincode('MG Road, Thane', 'Wing B', null)
        ).toBe('Wing B - MG Road, Thane');
        expect(
          formatAddressWithWingAndPincode('MG Road, Thane', 'Wing B', '')
        ).toBe('Wing B - MG Road, Thane');
        expect(
          formatAddressWithWingAndPincode('MG Road, Thane', 'Wing B', '-')
        ).toBe('Wing B - MG Road, Thane');
      });

      it('formats address with pinCode only when wingName is null/empty/dash', () => {
        expect(
          formatAddressWithWingAndPincode('MG Road, Thane', null, '400608')
        ).toBe('MG Road, Thane - 400608');
        expect(
          formatAddressWithWingAndPincode('MG Road, Thane', '', '400608')
        ).toBe('MG Road, Thane - 400608');
        expect(
          formatAddressWithWingAndPincode('MG Road, Thane', '-', '400608')
        ).toBe('MG Road, Thane - 400608');
      });

      it('returns address unchanged when both wingName and pinCode are null or empty', () => {
        expect(formatAddressWithWingAndPincode('MG Road, Thane', null, null)).toBe('MG Road, Thane');
        expect(formatAddressWithWingAndPincode('MG Road, Thane', '', '')).toBe('MG Road, Thane');
        expect(formatAddressWithWingAndPincode('MG Road, Thane', '-', '-')).toBe('MG Road, Thane');
      });

      it('returns "-" when address itself is missing, empty, or dash', () => {
        expect(formatAddressWithWingAndPincode(null, 'Wing A', '400608')).toBe('-');
        expect(formatAddressWithWingAndPincode(undefined, 'Wing A', '400608')).toBe('-');
        expect(formatAddressWithWingAndPincode('', 'Wing A', '400608')).toBe('-');
        expect(formatAddressWithWingAndPincode('-', 'Wing A', '400608')).toBe('-');
      });

      it('avoids duplicating wingName or pinCode if already present in address', () => {
        const addrWithWing = 'Wing A - MG Road, Thane';
        expect(formatAddressWithWingAndPincode(addrWithWing, 'Wing A', null)).toBe('Wing A - MG Road, Thane');

        const addrWithPin = 'MG Road, Thane - 400608';
        expect(formatAddressWithWingAndPincode(addrWithPin, null, '400608')).toBe('MG Road, Thane - 400608');

        const addrWithBoth = 'Wing A - MG Road, Thane - 400608';
        expect(formatAddressWithWingAndPincode(addrWithBoth, 'Wing A', '400608')).toBe('Wing A - MG Road, Thane - 400608');
      });
    });

    describe('mapIndividualPerformanceData', () => {
      it('returns zeroed defaults when rev is null or undefined', () => {
        const res = mapIndividualPerformanceData(null);
        expect(res.thisAssessmentRevenue).toBe('₹0');
        expect(res.isGrowthNegative).toBe(false);
        expect(res.collectionPercent).toBe('0%');
      });

      it('maps positive revenue metrics accurately', () => {
        const mockRev: IndividualAdditionalRevenueDto = {
          currentTax: 50000,
          retroTax: 10000,
          totalTax: 60000,
          totalDemand: 60000,
          pendingDemand: 10000,
          collection: 30000,
          collectionPercentage: 50,
          totalBalance: 30000,
          differenceAmount: 15000,
          oldCurrentTax: 45000,
          changePercent: 33.33,
        };
        const res = mapIndividualPerformanceData(mockRev);
        expect(res.thisAssessmentRevenue).toBe('₹15,000');
        expect(res.isGrowthNegative).toBe(false);
        expect(res.differenceAmount).toBe('₹15,000');
      });

      it('maps negative difference and growth correctly', () => {
        const mockRev: IndividualAdditionalRevenueDto = {
          currentTax: 20000,
          differenceAmount: -10000,
          changePercent: -28.5,
        };
        const res = mapIndividualPerformanceData(mockRev);
        expect(res.isGrowthNegative).toBe(true);
        expect(res.differenceAmount).toBe('-₹10,000');
        expect(res.thisAssessmentRevenue).toBe('-₹10,000');
      });

      it('handles array input for additionalRevenue correctly', () => {
        const mockRevArray: IndividualAdditionalRevenueDto[] = [
          {
            currentTax: 116340,
            retroTax: 953,
            totalTax: 117293,
            differenceAmount: -60871979,
            changePercent: -99.81,
          },
        ];
        const res = mapIndividualPerformanceData(mockRevArray);
        expect(res.thisAssessmentRevenue).toBe('-₹6,08,71,979');
        expect(res.differenceAmount).toBe('-₹6,08,71,979');
        expect(res.totalTax).toBe('₹1,17,293');
        expect(res.isGrowthNegative).toBe(true);
      });
    });

    describe('mapIndividualPropertyDtoToMasterData', () => {
      it('returns default placeholders when dto is null', () => {
        const res = mapIndividualPropertyDtoToMasterData(null);
        expect(res.propertyNo).toBe('-');
        expect(res.upic).toBe('-');
        expect(res.status).toBe('ACTIVE PROPERTY');
      });

      it('maps full DTO with Aadhar, photos, and areas accurately', () => {
        const mockDto: IndividualPropertyDto = {
          propertyId: 101,
          propertyNo: 'PROP-101',
          upicId: 'UPIC-999',
          ownerName: 'Rajesh Sharma',
          holderRegional: 'राजेश शर्मा',
          occupierName: 'Amit Verma',
          occupierRegional: 'अमित वर्मा',
          ownerCategory: 'RESIDENTIAL',
          division: 'East Division',
          moujaName: 'Central Mouja',
          surveyNo: '142/A',
          taxZone: 'Zone-1',
          plotNo: 'Plot 42',
          aadharNo: '585675914738',
          ownerTitle: 'Mr',
          mobileNo: '9876543210',
          alternateMobileNo: '9876543211',
          emailId: 'rajesh@example.com',
          fullAddress: 'Flat 101, Galaxy Heights',
          plotAreaFt: 1200,
          plotAreaMtr: 111.48,
          individualPropertyPhotoGuid: 'photo-guid-123',
        };

        const res = mapIndividualPropertyDtoToMasterData(mockDto);
        expect(res.propertyId).toBe(101);
        expect(res.aadharWithTitle).toBe('5856 7591 4738');
        expect(res.plotAreaFtMtr).toBe('1200 sqft / 111.48 sq mtr');
        expect(res.societyBuildingPhotoGuid).toBe('photo-guid-123');
        expect(res.imageUrl).toBe('https://test.docs.com/view/photo-guid-123');
      });

      it('rounds floating-point area dimensions to at most 2 decimal places', () => {
        const res = mapIndividualPropertyDtoToMasterData({
          plotAreaFt: 17222.399999999998,
          plotAreaMtr: 1600,
          carpetAreasqFt: 6286.18,
          carpetAreasqMtr: 584,
          builtUpAreasqFt: 7543.41,
          builtUpAreasqMtr: 700.8,
        });
        expect(res.plotAreaFtMtr).toBe('17222.4 sqft / 1600 sq mtr');
        expect(res.carpetAreaFtMtr).toBe('6286.18 sqft / 584 sq mtr');
        expect(res.builtUpAreaFtMtr).toBe('7543.41 sqft / 700.8 sq mtr');
      });

      it('formats aadhar across variations without title', () => {
        expect(
          mapIndividualPropertyDtoToMasterData({ aadharNo: '123456789012' }).aadharWithTitle
        ).toBe('1234 5678 9012');
        expect(mapIndividualPropertyDtoToMasterData({ ownerTitle: 'Mrs' }).aadharWithTitle).toBe(
          '-'
        );
        expect(mapIndividualPropertyDtoToMasterData({}).aadharWithTitle).toBe('-');
      });

      it('resolves photo GUID hierarchy and area variants', () => {
        const resPhoto = mapIndividualPropertyDtoToMasterData({
          individualPropertyGuid: 'photo-2',
          societyBuildingPhotoGuid: 'photo-3',
        });
        expect(resPhoto.societyBuildingPhotoGuid).toBe('photo-2');

        expect(mapIndividualPropertyDtoToMasterData({ plotAreaFt: 500 }).plotAreaFtMtr).toBe(
          '500 sqft'
        );
        expect(mapIndividualPropertyDtoToMasterData({ carpetAreaMtr: 45 }).carpetAreaFtMtr).toBe(
          '45 sq mtr'
        );
        expect(mapIndividualPropertyDtoToMasterData({ builtUpAreaMtr: 0 }).builtUpAreaFtMtr).toBe(
          '0 sq mtr'
        );
        expect(mapIndividualPropertyDtoToMasterData({}).plotAreaFtMtr).toBe('-');
      });

      it('maps new individual API payload with regional names, synthesized tax zone, and new area keys correctly', () => {
        const newApiDto: IndividualPropertyDto = {
          propertyId: 1428629,
          propertyNo: 'MM11-20',
          upicId: 'MM30001B20P',
          ownerName: 'T.M.C. FARHANA ATIK SAYYAD FARHANA ATIK SAYYAD',
          ownerNameRegional: 'T.M.C. FARHANA ATIK SAYYAD / LAND OWNER :NEETA',
          occupierName: 'Ashwin Deshmukh',
          occupierNameRegional: 'अश्विन देशमुख',
          ownerCategory: 'Self',
          aadharNo: '585675914738',
          ownerTitle: 'Mr',
          mobileNo: '9421237190',
          alternateMobileNo: '+918625085936',
          emailId: 'deshmukhashwin33@gmail.com',
          addressEnglish: 'GAIMUKH RETIBANDAR G.B. ROAD THANE.',
          addressRegional: 'BHAWANI APT., 2ND FLOOR DR. MOOSE ROAD',
          pinCode: '400607',
          division: 'माजिवडा मानपाडा',
          moujaName: 'Kopri',
          surveyNo: '24',
          taxZoneNo: '1',
          subZoneNo: null,
          rateSectionName: 'KOLSHET',
          plotNo: '1230',
          plotAreaFt: 43701.84,
          plotAreaMtr: 4060,
          carpetAreasqFt: 22873.5,
          carpetAreasqMtr: 2125,
          builtUpAreasqFt: 27448.2,
          builtUpAreasqMtr: 2550,
          oldCarpetAreaSqFeet: 99.75,
          oldCarpetAreaSqMeter: 9.27,
          oldBuiltupAreaSqFeet: 119.7,
          oldBuiltupAreaSqMeter: 11.12,
          propertyCategory: 'Individual',
          propertyDescription: 'निवासी',
        };

        const res = mapIndividualPropertyDtoToMasterData(newApiDto);
        expect(res.propertyNo).toBe('MM11-20');
        expect(res.upic).toBe('MM30001B20P');
        expect(res.ownerNameRegional).toBe('T.M.C. FARHANA ATIK SAYYAD / LAND OWNER :NEETA');
        expect(res.holderRegional).toBe('T.M.C. FARHANA ATIK SAYYAD / LAND OWNER :NEETA');
        expect(res.occupierRegional).toBe('अश्विन देशमुख');
        expect(res.occupierNameRegional).toBe('अश्विन देशमुख');
        expect(res.taxZone).toBe('Zone 1 - KOLSHET');
        expect(res.taxZoneAndName).toBe('Zone 1 - KOLSHET');
        expect(res.carpetAreaFtMtr).toBe('22873.5 sqft / 2125 sq mtr');
        expect(res.builtUpAreaFtMtr).toBe('27448.2 sqft / 2550 sq mtr');
        expect(res.oldCarpetAreaFtMtr).toBe('99.75 sqft / 9.27 sq mtr');
        expect(res.oldBuiltUpAreaFtMtr).toBe('119.7 sqft / 11.12 sq mtr');
        expect(res.category).toBe('Individual');
        expect(res.pinCode).toBe('400607');
        expect(res.wingName).toBeUndefined();
        expect(res.addressEnglish).toBe('GAIMUKH RETIBANDAR G.B. ROAD THANE. - 400607');
        expect(res.addressRegional).toBe('BHAWANI APT., 2ND FLOOR DR. MOOSE ROAD - 400607');
      });

      it('maps wingDetailId and wingName when provided in API DTO', () => {
        const dto: IndividualPropertyDto = {
          propertyId: 101,
          propertyNo: '312',
          wingDetailId: 55,
          wingName: 'Wing C',
          pinCode: '400608',
          addressEnglish: 'BHIVANDI RD MAJIWADA',
        };
        const mapped = mapIndividualPropertyDtoToMasterData(dto);
        expect(mapped.wingDetailId).toBe(55);
        expect(mapped.wingName).toBe('Wing C');
        expect(mapped.pinCode).toBe('400608');
        expect(mapped.addressEnglish).toBe('Wing C - BHIVANDI RD MAJIWADA - 400608');
        expect(mapped.address).toBe('Wing C - BHIVANDI RD MAJIWADA - 400608');
      });
    });
  });

  // ==========================================
  // 2. SERVICE TESTS
  // ==========================================
  describe('individual-property.service', () => {
    it('fetchIndividualQcTopSection succeeds with uppercase and lowercase endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: { items: { propertyId: 101 } },
      });
      const res1 = await fetchIndividualQcTopSection(101);
      expect(res1.success).toBe(true);

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, data: { items: { propertyId: 102 } } });
      const res2 = await fetchIndividualQcTopSection(102);
      expect(res2.success).toBe(true);
    });

    it('fetchIndividualQcTopSection handles errors and exceptions', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: false, error: 'Failed' });
      const res1 = await fetchIndividualQcTopSection(103);
      expect(res1.success).toBe(false);

      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));
      const res2 = await fetchIndividualQcTopSection(104);
      expect(res2.success).toBe(false);
      expect(res2.error).toBe('Network error');
    });

    it('patchIndividualProperty succeeds and falls back to root endpoint', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({ success: true });
      const res1 = await patchIndividualProperty(201, { aadharNo: '123' });
      expect(res1.success).toBe(true);

      vi.mocked(apiClient.patch)
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, data: { updated: true } });
      const res2 = await patchIndividualProperty(202, {});
      expect(res2.success).toBe(true);

      vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('Patch error'));
      const res3 = await patchIndividualProperty(203, {});
      expect(res3.success).toBe(false);
    });

    it('patchIndividualProperty sends all contract fields including regional and unit/shop fields', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        success: true,
        data: {
          items: {
            ownerName: 'Test Owner',
            ownerNameRegional: 'टेस्ट मालक',
            occupierNameRegional: 'टेस्ट भोगवटादार',
            addressRegional: 'टेस्ट पत्ता',
            flatOrShopNo: 'Shop-101',
            flatOrShopName: 'Ganpati Traders',
            flatOrShopNameEnglish: 'Ganpati Traders',
            categoryId: 1,
            propertyTypeId: 2,
          },
        },
      });

      const payload = {
        ownerName: 'Test Owner',
        ownerNameRegional: 'टेस्ट मालक',
        ownerNameEnglish: 'Test Owner',
        ownerTitle: 'Mr.',
        ownerTitleEnglish: 'Mr.',
        occupierName: 'Occupier Name',
        occupierNameRegional: 'टेस्ट भोगवटादार',
        occupierNameEnglish: 'Occupier Name',
        occupierTitle: 'Mr.',
        occupierTitleEnglish: 'Mr.',
        ownerTypeId: 1,
        aadharNo: '123456789012',
        mobileNo: '9876543210',
        alternateMobileNo: '9876543211',
        emailId: 'test@example.com',
        address: 'Main St',
        addressRegional: 'टेस्ट पत्ता',
        addressEnglish: 'Main St',
        pinCode: '411001',
        moujaId: 10,
        taxZoneId: 5,
        surveyNo: '12/3',
        plotNo: '45',
        flatOrShopNo: 'Shop-101',
        flatOrShopName: 'Ganpati Traders',
        flatOrShopNameEnglish: 'Ganpati Traders',
        categoryId: 1,
        propertyTypeId: 2,
      };

      const res = await patchIndividualProperty(205, payload);
      expect(res.success).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith('/Property/205/individual', payload);
      expect((res.data as Record<string, unknown>)?.ownerNameRegional).toBe('टेस्ट मालक');
      expect((res.data as Record<string, unknown>)?.flatOrShopName).toBe('Ganpati Traders');
    });
  });

  // ==========================================
  // 3. ACTIONS TESTS
  // ==========================================
  describe('individual-property.actions', () => {
    it('getIndividualQcTopSectionAction handles missing id, success, and fallbacks', async () => {
      const resEmpty = await getIndividualQcTopSectionAction('');
      expect(resEmpty.success).toBe(false);

      vi.spyOn(individualService, 'fetchIndividualQcTopSection').mockResolvedValueOnce({
        success: true,
        data: { propertyId: 501, ownerName: 'Sunil' } as unknown as IndividualPropertyDto,
      });
      const resSuccess = await getIndividualQcTopSectionAction(501);
      expect(resSuccess.success).toBe(true);
      expect(resSuccess.data?.ownerName).toBe('Sunil');

      // Fallback to apartment service
      vi.spyOn(individualService, 'fetchIndividualQcTopSection').mockResolvedValueOnce({
        success: false,
      });
      vi.mocked(apartmentService.fetchApartmentQcTopSection).mockResolvedValueOnce({
        success: true,
        data: { propertyOverview: { propertyId: '502' } } as unknown as ApartmentQcTopSectionDto,
      });
      vi.mocked(propertySocietyService.getPropertySocietyDetails).mockResolvedValueOnce(null);
      const resFallback = await getIndividualQcTopSectionAction(502);
      expect(resFallback.success).toBe(true);

      // Complete failure
      vi.spyOn(individualService, 'fetchIndividualQcTopSection').mockResolvedValueOnce({
        success: false,
      });
      vi.mocked(apartmentService.fetchApartmentQcTopSection).mockResolvedValueOnce({
        success: false,
      });
      vi.mocked(propertySocietyService.getPropertySocietyDetails).mockResolvedValueOnce(null);
      const resFail = await getIndividualQcTopSectionAction(503);
      expect(resFail.success).toBe(false);
    });

    it('patchIndividualPropertyAction validates id, revalidates paths, and handles errors', async () => {
      const resNoId = await patchIndividualPropertyAction('', {});
      expect(resNoId.success).toBe(false);

      vi.spyOn(individualService, 'patchIndividualProperty').mockResolvedValueOnce({
        success: true,
      });
      const resSuccess = await patchIndividualPropertyAction(601, {}, 'en');
      expect(resSuccess.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/en/property-tax/ptis/individual', 'page');

      vi.spyOn(individualService, 'patchIndividualProperty').mockRejectedValueOnce(
        new Error('Crash')
      );
      const resCrash = await patchIndividualPropertyAction(602, {});
      expect(resCrash.success).toBe(false);
    });
  });

  // ==========================================
  // 4. BUILDER TESTS
  // ==========================================
  describe('individual-property.builder', () => {
    const emptyPageData = {
      propertyDetailsResult: undefined,
      societyDetails: undefined,
      kycDetails: undefined,
      tabHeaderInfo: undefined,
      rawPropertyData: undefined,
      initialPhotos: [],
      initialPhotoSlots: [],
    } as unknown as PtisPageData;

    it('returns undefined when neither propertyId nor baseData is provided', () => {
      expect(buildInitialIndividualMasterData({ pageData: emptyPageData })).toBeUndefined();
    });

    it('builds master data prioritizing baseData and falling back to pageData', () => {
      const resBase = buildInitialIndividualMasterData({
        resolvedPropertyId: 101,
        baseData: {
          propertyNo: 'BASE-1',
          wardNo: 'W-01',
          ownerName: 'Base Owner',
          status: 'ACTIVE PROPERTY',
          performance: { thisAssessmentRevenue: '₹50,000' } as unknown as IndividualPerformanceData,
        } as unknown as IndividualPropertyMasterData,
        pageData: emptyPageData,
      });
      expect(resBase?.propertyId).toBe(101);
      expect(resBase?.propertyNo).toBe('BASE-1');
      expect(resBase?.ownerName).toBe('Base Owner');

      const pageData = {
        propertyDetailsResult: {
          propertyDetails: {
            wardNo: 'W-05',
            propertyNo: 'PROP-999',
            upicId: 'UPIC-999',
            ownerName: 'Details Owner',
            plotArea: '1500',
            taxZone: 'Zone-1',
            taxZoneName: 'Main',
          },
        },
        kycDetails: {
          propertyHolderName: 'KYC Holder',
          aadharNo: '987654321098',
          title: 'Mr',
        },
        initialPhotos: [{ photoTypeCode: 'PROPERTY_PHOTO', documentGuid: 'prop-guid' }],
        initialPhotoSlots: [],
      } as unknown as PtisPageData;

      const resFallback = buildInitialIndividualMasterData({
        resolvedPropertyId: 202,
        pageData,
      });
      expect(resFallback?.propertyId).toBe(202);
      expect(resFallback?.ownerName).toBe('KYC Holder');
      expect(resFallback?.plotAreaFtMtr).toBe('1500 sqft');
      expect(resFallback?.taxZoneAndName).toBe('Zone-1 - Main');
      expect(resFallback?.societyBuildingPhotoGuid).toBe('prop-guid');
    });

    it('accurately maps the updated API response payload with currentDemand, dual areas, and null occupier', () => {
      const sampleDto: IndividualPropertyDto = {
        propertyId: 1714469,
        propertyNo: 'NK14-316-S7',
        upicId: 'NK140001B316PS7',
        ownerName: 'M/S.  SHEJPAL COMPOUND(P.O.A.H.)',
        owner: 'M/S.  SHEJPAL COMPOUND(P.O.A.H.)',
        propertyHolder: 'M/S.  SHEJPAL COMPOUND(P.O.A.H.)',
        holderRegional: 'M/S.  SHEJPAL COMPOUND(P.O.A.H.)',
        occupierName: null,
        occupierRegional: null,
        ownerCategory: 'Self',
        aadharNo: null,
        ownerTitle: 'Mr',
        aadharWithTitle: null,
        mobileNo: null,
        alternateMobileNo: null,
        emailId: null,
        address:
          'Shop No -F1-88, PURNSHANTI HEIGHTS, NEAR KADAM COMPOUND, OPP.JAYHIND CHS,BESIDES MASHANBHUMI, KHARTAN ROAD, THANE WEST.',
        addressEnglish: null,
        pinCode: '400601',
        fullAddress:
          'Shop No -F1-88, PURNSHANTI HEIGHTS, NEAR KADAM COMPOUND, OPP.JAYHIND CHS,BESIDES MASHANBHUMI, KHARTAN ROAD, THANE WEST. (400601)',
        division: 'नौपाडा - कोपरी',
        moujaName: 'Kopri',
        surveyNo: '24',
        taxZone: '1 - A',
        plotNo: null,
        plotAreaFt: null,
        plotAreaMtr: null,
        carpetAreaFt: 90409.28,
        carpetAreaMtr: 8399.92,
        builtUpAreaFt: 108491,
        builtUpAreaMtr: 10079.52,
        propertyDescription: 'कार्यालय',
        individualPropertyGuid: null,
        individualPropertyPhotoGuid: null,
        societyBuildingPhotoGuid: null,
        additionalRevenue: {
          currentTax: 0,
          retroTax: 0,
          totalTax: 0,
          currentDemand: 0,
          totalDemand: 0,
          collection: 0,
          totalBalance: 0,
          oldCurrentTax: 1688023,
          differenceAmount: -1688023,
          changePercent: -100,
          pendingCurrent: 0,
          pendingDemand: 0,
        },
      };

      const mapped = mapIndividualPropertyDtoToMasterData(sampleDto);
      expect(mapped.propertyNo).toBe('NK14-316-S7');
      expect(mapped.taxZone).toBe('1 - A');
      expect(mapped.occupierName).toBe('-');
      expect(mapped.carpetAreaFtMtr).toBe('90409.28 sqft / 8399.92 sq mtr');
      expect(mapped.builtUpAreaFtMtr).toBe('108491 sqft / 10079.52 sq mtr');
      expect(mapped.performance?.thisAssessmentRevenue).toBe('-₹16,88,023');
      expect(mapped.performance?.revenueGrowthPct).toBe('-100%');
      expect(mapped.performance?.currentDemand).toBe('₹0');
      expect(mapped.performance?.pendingDemand).toBe('₹0');
      expect(mapped.performance?.isGrowthNegative).toBe(true);

      const built = buildInitialIndividualMasterData({
        resolvedPropertyId: 1714469,
        baseData: mapped,
        pageData: emptyPageData,
      });
      expect(built?.occupierName).toBe('-');
      expect(built?.carpetAreaFtMtr).toBe('90409.28 sqft / 8399.92 sq mtr');
      expect(built?.builtUpAreaFtMtr).toBe('108491 sqft / 10079.52 sq mtr');
    });
  });
});
