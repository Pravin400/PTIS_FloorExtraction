/**
 * i18n Request Configuration
 * Server-side locale detection and message loading
 * Force reload: 5
 */

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, Locale } from './config';

// Validate locale and fallback to default if invalid
const validateLocale = (locale: string | undefined): Locale => {
  return locale && locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
};

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = await requestLocale;
  const validatedLocale = validateLocale(resolvedLocale);

  // Load all translation files
  const [
    commonMessages,
    loginMessages,
    welcomeMessages,
    dashboardMessages,
    constructionMessages,
    taxZoningMessages,
    floorMessages,
    taxzoneMessages,
    quickDataEntryMessages,
    rateSectionMasterMessages,
    assessmentYearRangeMessages,
    ownershipTypeMessages,
    assetMessages,
    assetPaymentMessages,
    ptisMessages,
    ptisRedesignMessages,
    floorFactorMasterMessages,
    weightageMasterMessages,
    configMasterMessages,
    typeofusemasterMessages,
    depreciationMessages,
    propertyTypeMessages,
    natureFactorCVMasterMessages,
    ptisRVRateMasterMessages,
    useCategoryFactorMasterMessages,
    ageFactorMasterMessages,
    zoneMasterMessages,
    officeMessages,
    bankMasterMessages,
    screenAccessMessages,
    appartmentQCMessages,
    individualMessages,
    departmentMasterMessages,
    departmentActivationMessages,
    homeMessages,
    multilingualTranslationMessages,
    userManagementMessages,
    grievanceCategoryMessages,
    combinePropertyMessages,
    ptisMainTaxDetailsMessages,
    paymentModeMasterMessages,
    propertySearchMessages,
    moduleMasterMessages,
    ulbConfigMessages,
    waterConnectionMasterMessages,
    commonDetailsUpdateMessages,
    financialYearMessages,
    ruleEngineMessages,
    moujaMessages,
    policyConfigurationMessages,
    remarkMasterMessages,
    lockUnlockMessages,
    socialAttributeMessages,
    applicableTaxesMessages,
    reassessmentMessages,
    taxCalculationGuidelineMessages,

    addTaxesMessages,
    inventoryCategoryMessages,
    inventoryConditionMessages,
    inventoryModelMessages,
    inventoryNameMessages,
    automationDashboardMessages,
    modulesMessages,
    reportMessages,
    reportDesignerMessages,
    assetPhotoTypeMessages,
    assetRoomTypeMessages,
    designationMessages,
    gstMasterMessages,
    grievanceWorkflowStageMasterMessages,
    penaltyRuleMasterMessages,
    owningDepartmentMessages,
    assetMasterDashboardMessages,
    revenueDashboardMessages,
    municipalAssetMessages,
    moujaSubzoneMessages,
    assetTypeOfUseMessages,
    mapDashboardMessages,
    propertyMappingMessages,
    assetRegisterMessages,
    twoFactorSettingsMessages,
    dynamicTaxRegisterMessages,
    assetGrievanceCategoryMessages,
    assetGrievanceRemarkMessages,
    retrospectiveRuleLibraryMessages,
    taxZoningRangeMessages,
    aliasMasterMessages,
    tariffWorkbenchMessages,
    chargeHeadsMessages,
    assetGisMessages,
    connectionTypeMasterMessages,
    connectionCategoryMasterMessages,
    billingFrequencyMasterMessages,
    billingPeriodMasterMessages,
    tapSizeMasterMessages,
    assetWeightageMasterMessages,
    assetAssessmentYearRangeMessages,
    grievanceMessages,
    geographyTypeMasterMessages,
    geographyUnitMasterMessages,
    geographySharedMessages,
    meterTestStatusMasterMessages,
    meterTypeMasterMessages,
    readingSourceMasterMessages,
    assetDetailNewMessages,
    assetFieldDefinitionMessages,
    assetDocumentDefinitionMessages,
    newAddNewAssetMessages,
    subAssetDetailMessages,
    fireAuditMessages,
    fireAuditSurveyorMessages,
    extendedAreaAssessmentMessages,
    propertyMediaMessages,
    userDepartmentAllocationMessages,
    waterPenaltyRuleMessages,
    gisKpiMasterMessages,
    payrollDepartmentMasterMessages,
    payrollDesignationMasterMessages,
    payrollEmployeeTypeMasterMessages,
    payrollEmployeeStatusMasterMessages,
    payrollQualificationMasterMessages,
    payrollEmployeeClassMasterMessages,
    payrollZoneDivisionMasterMessages,
    payrollOrganisationMastersNavMessages,
  ] = await Promise.all([
    import(`./locales/${validatedLocale}/common.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/login.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/welcome.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/dashboard.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/construction.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/taxzoning.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/floor.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/taxzone.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/quickDataEntry.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/rateSectionMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/assessmentYearRange.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/ownership-type.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/asset.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/AssetPayment.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/ptis.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/ptisRedesign.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/floorFactorMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/weightageMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/config-master.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/typeofusemaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/depreciation.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/propertyType.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/natureFactorCVMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/ptis.RVRateMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/useCategoryFactorMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/ageFactorMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/zoneMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/office.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/bank-master.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/screenAccess.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/appartmentQC.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/individual.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/departmentMaster.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/departmentActivation.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/home.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/multilingualTranslation.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/user-management.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/grievance-category.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/combineProperty.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/ptisMainTaxDetails.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/paymentModeMaster.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/propertySearch.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/moduleMaster.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/ulb_configuration.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
        import(`./locales/${validatedLocale}/waterConnectionMaster.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/commonDetailsUpdate.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/financialYear.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/rule-engine.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/mouja.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/policyConfiguration.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/remark.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/lockUnlock.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/socialAttribute.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/applicableTaxes.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/reassessment.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/taxCalculationGuideline.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/addTaxes.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/inventoryCategory.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/inventoryCondition.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/inventoryModel.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/inventoryName.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/automation-dashboard.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/modules.json`).then((m) => m.default),
    import(`./locales/${validatedLocale}/report.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/reportDesigner.json`)
      .catch(() => ({}))
      .then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetPhotoType.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetRoomType.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/designation.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/gstMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/grievanceWorkflowStageMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/penaltyRuleMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/owningDepartment.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetmasterdashboard.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/revenueDashboard.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/municipalAsset.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/moujaSubzone.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetTypeOfUse.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/mapDashboard.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/propertyMapping.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetRegister.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/twoFactorSettings.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/dynamicTaxRegister.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetGrievanceCategory.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetGrievanceRemark.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/retrospectiveRuleLibrary.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/taxZoningRange.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/aliasMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/tariffWorkbench.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/chargeHeads.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetGis.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/connectionTypeMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/connectionCategoryMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/billingFrequencyMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/billingPeriodMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/tapSizeMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetWeightageMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetAssessmentYearRange.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/grievance.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/geographyTypeMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/geographyUnitMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/geographyShared.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/meterTestStatusMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/meterTypeMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/readingSourceMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/asset-detail.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetFieldDefinition.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/assetDocumentDefinition.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/newAddNewAsset.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/subAssetDetail.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/fireAudit.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/fireAuditSurveyor.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/extendedAreaAssessment.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/propertyMedia.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/userDepartmentAllocation.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/waterPenaltyRule.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/gisKpiMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollDepartmentMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollDesignationMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollEmployeeTypeMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollEmployeeStatusMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollQualificationMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollEmployeeClassMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollZoneDivisionMaster.json`).catch(() => ({})).then((m) => m.default || m),
    import(`./locales/${validatedLocale}/payrollOrganisationMastersNav.json`).catch(() => ({})).then((m) => m.default || m),

  ]);

  return {
    locale: validatedLocale,
    messages: {
      common: commonMessages,
      login: loginMessages,
      welcome: welcomeMessages,
      dashboard: dashboardMessages,
      construction: constructionMessages,
      taxZoning: taxZoningMessages.taxZoning,
      floor: floorMessages,
      taxZone: taxzoneMessages.taxZone,
      quickDataEntry: quickDataEntryMessages,
      rateSectionMaster: rateSectionMasterMessages,
      assessmentYearRange: assessmentYearRangeMessages,
      ownershipType: ownershipTypeMessages?.ownershipType || ownershipTypeMessages,
      "ownership-type": ownershipTypeMessages,
      asset: assetMessages,
      AssetPayment: assetPaymentMessages,
      ptis: ptisMessages,
      ptisRedesign: ptisRedesignMessages,
      floorFactorMaster: floorFactorMasterMessages.floorFactorMaster,
      weightageMaster: weightageMasterMessages.weightageMaster,
      configMaster: configMasterMessages.configMaster || configMasterMessages,
      typeofusemaster: typeofusemasterMessages,
      depreciation: depreciationMessages,
      propertyType: propertyTypeMessages,
      natureFactorCVMaster: natureFactorCVMasterMessages.natureFactorCVMaster,
      ptis_RVRateMaster: ptisRVRateMasterMessages,
      useCategoryFactorMaster: useCategoryFactorMasterMessages.useCategoryFactorMaster,
      ageFactorMaster: ageFactorMasterMessages.ageFactorMaster,
      zoneMaster: zoneMasterMessages,
      office: officeMessages,
      bankMaster: bankMasterMessages,
      screenAccess: screenAccessMessages,
      appartmentQC: appartmentQCMessages,
      individual: individualMessages,
      departmentMaster: departmentMasterMessages,
      departmentActivation: departmentActivationMessages,
      home: homeMessages,
      multilingualTranslation: multilingualTranslationMessages,
      userManagement: userManagementMessages,
      grievanceCategory: grievanceCategoryMessages,
      combineProperty: combinePropertyMessages,
      ptisMainTaxDetails: ptisMainTaxDetailsMessages,
      paymentModeMaster: paymentModeMasterMessages,
      propertySearch: propertySearchMessages,
      moduleMaster: moduleMasterMessages,
      ulb_configuration: ulbConfigMessages,
      waterConnection: waterConnectionMasterMessages?.waterConnection,
      waterConnectionMaster: waterConnectionMasterMessages.waterConnectionMaster,
      commonDetailsUpdate:
        commonDetailsUpdateMessages?.commonDetailsUpdate || commonDetailsUpdateMessages,
      financialYear: financialYearMessages,
      ruleEngine: ruleEngineMessages,
      mouja: moujaMessages,
      policyConfiguration:
        policyConfigurationMessages?.policyConfiguration || policyConfigurationMessages,
      remarkMaster: remarkMasterMessages.remarkMaster,
      lockUnlock: lockUnlockMessages?.lockUnlock || lockUnlockMessages,
      socialAttribute: socialAttributeMessages.socialAttribute || socialAttributeMessages,
      applicableTaxes: applicableTaxesMessages,
      reassessment: reassessmentMessages,
      taxCalculationGuideline:
        taxCalculationGuidelineMessages?.taxCalculationGuideline || taxCalculationGuidelineMessages,
      addTaxes: addTaxesMessages?.addTaxes || addTaxesMessages,
      inventoryCategory: inventoryCategoryMessages?.inventoryCategory || inventoryCategoryMessages,
      inventoryCondition: inventoryConditionMessages?.inventoryCondition || inventoryConditionMessages,
      inventoryModel: inventoryModelMessages?.inventoryModel || inventoryModelMessages,
      inventoryName: inventoryNameMessages?.inventoryName || inventoryNameMessages,
      automationDashboard: automationDashboardMessages,
      modules: modulesMessages,
      report: reportMessages,
      reportDesigner: reportDesignerMessages,
      assetPhotoType: assetPhotoTypeMessages,
      assetRoomType: assetRoomTypeMessages,
      designation: designationMessages,
      gstMaster: gstMasterMessages,
      grievanceWorkflowStageMaster: grievanceWorkflowStageMasterMessages,
      penaltyRuleMaster: penaltyRuleMasterMessages,
      owningDepartment: owningDepartmentMessages,
      assetmasterdashboard: assetMasterDashboardMessages,
      revenueDashboard: revenueDashboardMessages,
      municipalAsset: municipalAssetMessages,
      moujaSubzone: moujaSubzoneMessages,
      assetTypeOfUse: assetTypeOfUseMessages,
      mapDashboard: mapDashboardMessages,
      propertyMapping: propertyMappingMessages?.propertyMapping || propertyMappingMessages,
      assetRegister: assetRegisterMessages,
      twoFactorSettings: twoFactorSettingsMessages,
      dynamicTaxRegister: dynamicTaxRegisterMessages,
      assetGrievanceCategory: assetGrievanceCategoryMessages,
      assetGrievanceRemark: assetGrievanceRemarkMessages,
      retrospectiveRuleLibrary: retrospectiveRuleLibraryMessages,
      taxZoningRange: taxZoningRangeMessages?.taxZoningRange || taxZoningRangeMessages,
  
      aliasMaster: aliasMasterMessages,
      tariffWorkbench:
        tariffWorkbenchMessages?.tariffWorkbench || tariffWorkbenchMessages,
      chargeHeads:
        chargeHeadsMessages?.chargeHeads || chargeHeadsMessages,
      assetGis: assetGisMessages?.assetGis || assetGisMessages,
      gis: assetGisMessages?.assetGis || assetGisMessages,
      connectionTypeMaster: connectionTypeMasterMessages?.connectionTypeMaster || connectionTypeMasterMessages,
      connectionCategoryMaster: connectionCategoryMasterMessages?.connectionCategoryMaster || connectionCategoryMasterMessages,
      billingFrequencyMaster:
        billingFrequencyMasterMessages?.billingFrequencyMaster || billingFrequencyMasterMessages,
      billingPeriodMaster:
        billingPeriodMasterMessages?.billingPeriodMaster || billingPeriodMasterMessages,
      tapSizeMaster: tapSizeMasterMessages?.tapSizeMaster || tapSizeMasterMessages,
      assetWeightageMaster:
        assetWeightageMasterMessages?.assetWeightageMaster || assetWeightageMasterMessages,
      assetAssessmentYearRange:
        assetAssessmentYearRangeMessages?.assetAssessmentYearRange || assetAssessmentYearRangeMessages,
      grievance: grievanceMessages,
      geographyTypeMaster: geographyTypeMasterMessages,
      geographyUnitMaster: geographyUnitMasterMessages,
      geographyShared: geographySharedMessages,
      meterTestStatusMaster: meterTestStatusMasterMessages,
      meterTypeMaster: meterTypeMasterMessages,
      readingSourceMaster: readingSourceMasterMessages,
      'asset-detail': assetDetailNewMessages,
      assetFieldDefinition: assetFieldDefinitionMessages,
      assetDocumentDefinition: assetDocumentDefinitionMessages,
      newAddNewAsset: newAddNewAssetMessages,
      addAssetForm: newAddNewAssetMessages,
      subAssetDetail: subAssetDetailMessages,
      fireAudit: fireAuditMessages,
      fireAuditSurveyor: fireAuditSurveyorMessages,
      extendedAreaAssessment: extendedAreaAssessmentMessages,
      propertyMedia: propertyMediaMessages?.propertyMedia || propertyMediaMessages,
      userDepartmentAllocation: userDepartmentAllocationMessages,
      waterPenaltyRule: waterPenaltyRuleMessages?.waterPenaltyRule || waterPenaltyRuleMessages,
      gisKpiMaster: gisKpiMasterMessages?.gisKpiMaster || gisKpiMasterMessages,
      payrollDepartmentMaster: payrollDepartmentMasterMessages,
      payrollDesignationMaster: payrollDesignationMasterMessages,
      payrollEmployeeTypeMaster: payrollEmployeeTypeMasterMessages,
      payrollEmployeeStatusMaster: payrollEmployeeStatusMasterMessages,
      payrollQualificationMaster: payrollQualificationMasterMessages,
      payrollEmployeeClassMaster: payrollEmployeeClassMasterMessages,
      payrollZoneDivisionMaster: payrollZoneDivisionMasterMessages,
      payrollOrganisationMastersNav: payrollOrganisationMastersNavMessages || payrollDepartmentMasterMessages?.nav || {},

    },
  };
});

