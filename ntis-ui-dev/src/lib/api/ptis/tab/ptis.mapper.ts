import type {
  PropertyDetailsData,
  KYCDetailsData,
  SocietyDetailsData,
  OldDetailsData,
  OldFloorDetailsData,
  KycDetailsApiResponse,
  PropertyBasicDetailsApiResponse,
  SocietyDetailsApiResponse,
  OldDetailsApiResponse,
  OldFloorDetailApiResponse,
} from '@/types/ptis.types';
import {
  defaultPropertyDetails,
  defaultKycDetails,
  defaultSocietyDetails,
  defaultOldDetails,
} from '@/lib/constants/ptis.constants';
import { ptisSocialMapper } from './ptis-social.mapper';

export const ptisMapper = {
  mapBasicDetails: (data: PropertyBasicDetailsApiResponse): PropertyDetailsData => {
    return {
      ...defaultPropertyDetails,
      division: data.division || '',
      wardNo: data.wardNo || '',
      propertyNo: data.propertyNo || '',
      partitionNo: data.partitionNo || '',
      flatOrShopNo: data.flatOrShopNo || '',
      upicId: data.upicId || '',
      taxZoneNo: data.taxZoneNo || '',
      subZoneNo: data.subZoneNo || '',
      surveyNo: data.surveyNo || '',
      plotNo: data.plotNo || '',
      propertyDescription: data.propertyDescription || '',
      plotArea:
        data.plotAreaSqFeet != null || data.plotAreaSqMeter != null
          ? `${data.plotAreaSqFeet != null ? Number(data.plotAreaSqFeet).toFixed(2) : '0.00'} / ${data.plotAreaSqMeter != null ? Number(data.plotAreaSqMeter).toFixed(2) : '0.00'}`
          : data.plotArea?.toString() || '',
      totalCarpetArea:
        data.totalCarpetAreaSqFeet != null || data.totalCarpetAreaSqMeter != null
          ? `${data.totalCarpetAreaSqFeet != null ? Number(data.totalCarpetAreaSqFeet).toFixed(2) : '0.00'} / ${data.totalCarpetAreaSqMeter != null ? Number(data.totalCarpetAreaSqMeter).toFixed(2) : '0.00'}`
          : '',
      builtupArea:
        data.totalBuiltupAreaSqFeet != null || data.totalBuiltupAreaSqMeter != null
          ? `${data.totalBuiltupAreaSqFeet != null ? Number(data.totalBuiltupAreaSqFeet).toFixed(2) : '0.00'} / ${data.totalBuiltupAreaSqMeter != null ? Number(data.totalBuiltupAreaSqMeter).toFixed(2) : '0.00'}`
          : '',
      category: data.categoryName || '',
      wingNo: data.wingNo || '',
      wingName: data.wingName || '',
      moujaNo: data.moujaId?.toString() || '',
      moujaDescription: data.moujaName || '',
      noOfResidentialToilets: data.noOfResidentialToilets?.toString() || '',
      noOfCommercialToilets: data.noOfCommercialToilets?.toString() || '',
      ownerName: data.ownerName || data.ownerNameEnglish || '',
      categoryId: data.categoryId,
      wingId: data.wingId,
      wingDetailId: data.wingDetailId,
      rateSectionDescription: data.rateSectionDescription || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      constructionYear: data.constructionYear || null,
      oldCarpetArea:
        data.oldCarpetAreaSqFeet != null || data.oldCarpetAreaSqMeter != null
          ? `${data.oldCarpetAreaSqFeet != null ? Number(data.oldCarpetAreaSqFeet).toFixed(2) : '0.00'} / ${data.oldCarpetAreaSqMeter != null ? Number(data.oldCarpetAreaSqMeter).toFixed(2) : '0.00'}`
          : '',
      oldBuiltupArea:
        data.oldBuiltupAreaSqFeet != null || data.oldBuiltupAreaSqMeter != null
          ? `${data.oldBuiltupAreaSqFeet != null ? Number(data.oldBuiltupAreaSqFeet).toFixed(2) : '0.00'} / ${data.oldBuiltupAreaSqMeter != null ? Number(data.oldBuiltupAreaSqMeter).toFixed(2) : '0.00'}`
          : '',
    };
  },

  mapKycDetails: (data: KycDetailsApiResponse): KYCDetailsData => {
    return {
      ...defaultKycDetails,
      ownerType: data.ownerType || '',
      title: data.ownerTitle || '',
      propertyHolderName: data.ownerName || '',
      propertyHolderNameMarathi: data.ownerName || '',
      propertyHolderNameEnglish: data.ownerNameEnglish || '',
      occupierName: data.occupierName || '',
      occupierNameMarathi: data.occupierName || '',
      occupierNameEnglish: data.occupierNameEnglish || '',
      aadharCardNo: data.adharCardNo || '',
      mobileNumber: data.mobileNo || '',
      email: data.emailId || '',
      shopName: data.flatOrShopName || '',
      shopNameEnglish: data.flatOrShopNameEnglish || '',
      shopNo: data.flatOrShopNo || '',
      address: data.address || '',
      addressEnglish: data.addressEnglish || '',
      buildingName: data.flatOrShopName || '',
      wingNo: data.wingNo || '',
      flatNo: data.flatOrShopNo || '',
      alternateMobileNo: data.alternateMobileNo || '',
      pinCode: data.pinCode || '',
    };
  },

  mapSocietyDetails: (data: SocietyDetailsApiResponse): SocietyDetailsData => {
    return {
      ...defaultSocietyDetails,
      buildingSocietyName: data.societyName || '',
      buildingSocietyNameMarathi: data.societyName || '',
      builderName: data.builderName || '',
      builderNameMarathi: data.builderName || '',
      landOwner: data.landOwnerName || '',
      secretaryName: data.secretaryName || '',
      secretaryNameMarathi: data.secretaryName || '',
      secretaryMobileNo: data.secretaryMobileNo || '',
      secretaryEmail: data.secretaryEmailId || '',
      societyEmail: data.societyEmailId || '',
      societyEmailMain: data.societyEmailId || '',
      ocDate: data.ocDate || '',
      ocNumber: data.ocNumber || '',
      societyAddress: data.societyAddress || '',
      societyAddressMarathi: data.societyAddress || '',
      managerName: data.managerName || '',
      managerEmail: data.managerEmailId || '',
      managerMobileNo: data.managerMobileNo || '',
      societyDetailId: data.societyDetailId,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };
  },

  mapOldDetails: (data: OldDetailsApiResponse): OldDetailsData => {
    return {
      ...defaultOldDetails,
      oldZoneName: data.oldZoneNo?.toString() || '',
      oldWardNo: (data.oldWardNo as string) || '',
      oldPropertyNo: (data.oldPropertyNo as string) || '',
      oldPartitionNo: (data.oldPartitionNo as string) || '',
      oldEGovernanceNo: (data.oldEgovNo as string) || '',
      oldPlotArea: data.oldPlotArea?.toString() || '',
      oldPlotNo: (data.oldPlotNo as string) || '',
      oldRV: data.oldRV?.toString() || '',
      oldALV: data.oldALV?.toString() || '',
      oldPropertyTax:
        data.oldGeneralTax?.toString() ||
        (data.oldPropertyTax as number | string)?.toString() ||
        '',
      oldTotalTax: data.oldTotalTax?.toString() || '',
      oldConstructionYear: data.oldConstructionYear?.toString() || '',
      oldCarpetAreaSqMeter: data.oldCarpetAreaSqMeter?.toString() || '',
      oldCarpetAreaSqFeet: data.oldCarpetAreaSqFeet?.toString() || '',
      oldBuiltupAreaSqMeter: data.oldBuiltupAreaSqMeter?.toString() || '',
      oldBuiltupAreaSqFeet: data.oldBuiltupAreaSqFeet?.toString() || '',
      oldConstructionArea: data.oldConstructionArea?.toString() || '',
      oldGeneralTax: data.oldGeneralTax?.toString() || '',
    };
  },

  mapOldFloorDetails: (items: OldFloorDetailApiResponse[]): OldFloorDetailsData[] => {
    return items.map((item) => {
      const wardPropPartNo = [item.oldWardNo, item.oldPropertyNo, item.oldPartitionNo]
        .filter(Boolean)
        .join(' - ');
      return {
        wardPropPartNo,
        floor: (item.floorDescription as string) || '',
        subFloor: (item.subFloorDescription as string) || '',
        assessmentYear: (item.oldAssessmentYear as string) || '',
        year: item.constructionYear?.toString() || item.oldConstructionYear?.toString() || '',
        constructionType: (item.constructionTypeDescription as string) || '',
        typeOfUse: (item.typeOfUseDescription as string) || '',
        subType: (item.subTypeOfUseDescription as string) || '',
        carpetArea: `${item.oldCarpetAreaSqFeet ?? item.carpetAreaSqFeet ?? 0} / ${item.oldCarpetAreaSqMeter ?? item.carpetAreaSqMeter ?? 0}`,
        builtupArea: `${item.oldBuiltupAreaSqFeet ?? item.builtupAreaSqFeet ?? 0} / ${item.oldBuiltupAreaSqMeter ?? item.builtupAreaSqMeter ?? 0}`,
      };
    });
  },

  mapDiscountDetails: ptisSocialMapper.mapDiscountDetails,
  mapSocialDetails: ptisSocialMapper.mapSocialDetails,
  mapBuildingPermissionDetails: ptisSocialMapper.mapBuildingPermissionDetails,
};
