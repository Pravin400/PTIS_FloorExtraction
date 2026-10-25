using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Entities.Rules;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Enums.Revision;

using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;
using NtisPlatform.Core.Entities.Payroll.Master;

using NtisPlatform.Core.Entities.FireAudit;
using NtisPlatform.Core.Entities.GrievanceEntities;
namespace NtisPlatform.Infrastructure.Data;

/// <summary>
/// Application database context
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Protected ctor enabling derived contexts (e.g. <c>ReportDataDbContext</c>) to reuse this
    /// exact entity model against a different connection � used for the read-only report data
    /// replica. The derived context passes its own <c>DbContextOptions&lt;TDerived&gt;</c>.
    /// </summary>
    protected ApplicationDbContext(DbContextOptions options) : base(options)
    {
    }
    public DbSet<ConstructionTypeEntity> ConstructionTypeEntity { get; set; } = null!;
    public DbSet<BillingFrequencyMasterEntity> BillingFrequencyMaster { get; set; } = null!;
    public DbSet<BillingPeriodEntity> BillingPeriod { get; set; } = null!;
    public DbSet<ConnectionTypeMasterEntity> ConnectionTypeMaster { get; set; } = null!;
    public DbSet<ConnectionCategoryMasterEntity> ConnectionCategoryMaster { get; set; } = null!;
    public DbSet<TariffMasterEntity> TariffMaster { get; set; } = null!;
    public DbSet<TariffSlabDetailEntity> TariffSlabDetail { get; set; } = null!;
    public DbSet<TariffChargeDetailEntity> TariffChargeDetail { get; set; } = null!;
    public DbSet<ChargeHeadMasterEntity> ChargeHeadMaster { get; set; } = null!;
    public DbSet<TapSizeMasterEntity> TapSizeMaster { get; set; } = null!;
    public DbSet<MeterTypeMasterEntity> MeterTypeMaster { get; set; } = null!;
    public DbSet<ReadingSourceMasterEntity> ReadingSourceMaster { get; set; } = null!;
    public DbSet<MeterTestStatusMasterEntity> MeterTestStatusMaster { get; set; } = null!;
    public DbSet<GeographyTypeMasterEntity> GeographyTypeMaster { get; set; } = null!;
    public DbSet<GeographyUnitEntity> GeographyUnit { get; set; } = null!;
    public DbSet<CitizenServiceEntity> CitizenServices { get; set; } = null!;
    public DbSet<PortalContentEntity> PortalContent { get; set; } = null!;
    public DbSet<WaterPenaltyRuleMasterEntity> WaterPenaltyRuleMaster { get; set; } = null!;
    public DbSet<FloorEntity> FloorEntity { get; set; } = null!;
    public DbSet<FLatGenerationGroupMasterEntity> FLatGenerationGroupMaster { get; set; } = null!;
    public DbSet<SubFloorEntity> SubFloorEntity { get; set; } = null!;
    public DbSet<RateEntity> RateEntity { get; set; } = null!;
    public DbSet<MultilingualResourceEntity> MultilingualResourceEntity { get; set; } = null!;
    public DbSet<RateMasterForCVEntity> RateMasterForCVs { get; set; } = null!;
    public DbSet<CSNDetailsEntity> CSNDetails { get; set; } = null!;
    public DbSet<TaxZoneEntity> TaxZoneMaster { get; set; } = null!;
    public DbSet<AssessmentYearRangeEntity> AssessmentYearRangeEntities { get; set; } = null!;
    public DbSet<RetentionFactWiseEntity> RetentionFactWiseEntities { get; set; } = null!;
    public DbSet<UserRoleMasterEntity> UserRoleMasterEntity { get; set; } = null!;
    public DbSet<MoujaEntity> MoujaEntity { get; set; } = null!;
    public DbSet<CombinePropertyHistoryEntity> CombinePropertyHistory { get; set; } = null!;
    public DbSet<VirtualPropertyTransferHistoryEntity> VirtualPropertyTransferHistory { get; set; } = null!;
    public DbSet<PropertyScreenLockEntity> PropertyScreenLocks { get; set; } = null!;
    public DbSet<OfficeEntity> OfficeEntity { get; set; } = null!;
    public DbSet<RetentionYearWiseEntity> RetentionYearWiseEntities { get; set; } = null!;
    public DbSet<SubTypeOfUseEntity> SubTypeOfUse { get; set; } = null!;
    public DbSet<TypeOfUseEntity> TypeOfUse { get; set; } = null!;
    public DbSet<TypeOfUseCategoryEntity> TypeOfUseCategory { get; set; } = null!;
    public DbSet<PolicyConfigurationEntity> PolicyConfiguration { get; set; } = null!;
    public DbSet<AssessmentYearRangeCVEntity> AssessmentYearRangeCVEntities { get; set; } = null!;
    public DbSet<TypeOfUseGroupEntity> TypeOfUseGroup { get; set; } = null!;
    public DbSet<DepreciationMasterEntity> DepreciationMaster { get; set; } = null!;
    public DbSet<MasterDataChangeBatchEntity> MasterDataChangeBatch { get; set; } = null!;
    public DbSet<MasterDataChangeEventEntity> MasterDataChangeEvent { get; set; } = null!;
    public DbSet<PropertyTaxRecalcFlagEntity> PropertyTaxRecalcFlag { get; set; } = null!;
    public DbSet<ZoneEntity> ZoneMaster { get; set; } = null!;
    public DbSet<WardEntity> WardMaster { get; set; } = null!;
    public DbSet<WardSection129MasterEntity> WardSection129Master { get; set; } = null!;
    public DbSet<OldWardMasterEntity> OldWardMaster { get; set; } = null!;
    public DbSet<OldZoneMasterEntity> OldZoneMasters { get; set; } = null!;
    public DbSet<TaxZoningRangeEntity> TaxZoningRange { get; set; } = null!;
    public DbSet<ULBDocumentTypeEntity> ULBDocumentType { get; set; } = null!;
    public DbSet<ULBDocumentEntity> ULBDocument { get; set; } = null!;
    public DbSet<AliasMasterEntity> AliasMaster { get; set; } = null!;
    public DbSet<BankMasterEntity> BankMasters { get; set; } = null!;
    public DbSet<PropertyRuleEvaluationMasterEntity> PropertyRuleEvaluationMaster { get; set; } = null!;
    public DbSet<YearMasterEntity> YearMaster { get; set; } = null!;
    public DbSet<ScreenMasterEntity> ScreenMaster { get; set; } = null!;
    public DbSet<ScreenGroupMasterEntity> ScreenGroupMaster { get; set; } = null!;
    public DbSet<RoleWiseScreenAccessMasterEntity> RoleWiseScreenAccessMasters { get; set; } = null!;
    public DbSet<RateSectionEntity> RateSection { get; set; } = null!;
    public DbSet<ModuleMasterEntity> ModuleMasters { get; set; } = null!;
    public DbSet<ApplicationSettingEntity> ApplicationSettings { get; set; } = null!;

    // GIS Engine DbSets
    public DbSet<GisCorporationConfigEntity> GisCorporationConfigs { get; set; } = null!;
    public DbSet<GisDepartmentUserAccessEntity> GisDepartmentUserAccesses { get; set; } = null!;
    public DbSet<GisLayerMasterEntity> GisLayerMasters { get; set; } = null!;
    public DbSet<GisLayerJsonEntity> GisLayerJsons { get; set; } = null!;
    public DbSet<GisKpiMasterEntity> GisKpiMasters { get; set; } = null!;
    public DbSet<GisDepartmentKpiMappingEntity> GisDepartmentKpiMappings { get; set; } = null!;
    public DbSet<GisFilterMasterEntity> GisFilterMasters { get; set; } = null!;
    public DbSet<GisDepartmentFilterMappingEntity> GisDepartmentFilterMappings { get; set; } = null!;
    public DbSet<GisUploadHistoryEntity> GisUploadHistories { get; set; } = null!;
    public DbSet<GisAssetGeometryEntity> GisAssetGeometries { get; set; } = null!;
    public DbSet<SourceTableEntity> SourceTables { get; set; } = null!;
    public DbSet<SourceTableDetailsEntity> SourceTableDetails { get; set; } = null!;
    public DbSet<ActiveTaxesEntity> ActiveTaxesMasters { get; set; } = null!;
    public DbSet<UlbImageMasterEntity> UlbImageMasters { get; set; } = null!;
    public DbSet<DepartmentLicenceDetailsEntity> DepartmentLicenceDetails { get; set; } = null!;
    public DbSet<DepartmentPortalConfigurationEntity> DepartmentPortalConfigurations { get; set; } = null!;
    public DbSet<RateSectionDetailsEntity> RateSectionDetails { get; set; } = null!;
    public DbSet<ScreenGroupMasterEntity> ScreenGroupMasters { get; set; } = null!;
    public DbSet<YearMasterEntity> YearMasterEntity { get; set; } = null!;
    public DbSet<DesignationMasterEntity> DesignationMasters { get; set; } = null!;
    public DbSet<DepartmentMasterEntity> DepartmentMasters { get; set; } = null!;
    public DbSet<GrievanceCategoryEntity> GrievanceCategory { get; set; } = null!;
    public DbSet<PropertyEntity> PropertyMast { get; set; } = null!;
    public DbSet<ULBMasterEntity> ULBMasters { get; set; } = null!;
    public DbSet<PropertyCategoryEntity> PropertyCategoryMaster { get; set; } = null!;
    public DbSet<PropertyAssessmentEntity> PropertyMastDetails { get; set; } = null!;
    public DbSet<PropertyDetailsEntity> PropertyDetails { get; set; } = null!;
    public DbSet<ConfigCategoryMasterEntity> ConfigCategoryMasters { get; set; } = null!;
    public DbSet<ConfigKeyMasterEntity> ConfigKeyMasters { get; set; } = null!;
    public DbSet<PropertyDetailsReassessmentEntity> PropertyDetailsReassessment { get; set; } = null!;
    public DbSet<PaymentModeEntity> PaymentModeEntity { get; set; } = null!;
    public DbSet<WingEntity> WingEntity { get; set; } = null!;
    public DbSet<SocietyDetailsEntity> SocietyDetailsMast { get; set; } = null!;
    public DbSet<WingDetailsMastEntity> WingDetailsMast { get; set; } = null!;
    public DbSet<OwnerTypeMasterEntity> OwnerTypeMaster { get; set; } = null!;
    public DbSet<OwnerTitleMasterEntity> OwnerTitleMaster { get; set; } = null!;
    public DbSet<PropertyMastOldEntity> PropertyMastOld { get; set; } = null!;
    public DbSet<PropertyDetailsOldEntity> PropertyDetailsOld { get; set; } = null!;
    public DbSet<ConfigValueMasterEntity> ConfigValueMasters { get; set; } = null!;
    public DbSet<PropertyTypeCategoryEntity> PropertyTypeCategoryMaster { get; set; } = null!;
    public DbSet<PropertyTypeMasterEntity> PropertyTypeMasters { get; set; } = null!;
    public DbSet<PropertyPhotoTypeEntity> PropertyPhotoTypes { get; set; } = null!;
    public DbSet<BHKMasterEntity> BHKMasters { get; set; } = null!;
    public DbSet<JurisdictionOverlayMasterEntity> JurisdictionOverlayMasters { get; set; } = null!;
    public DbSet<PropertySocialDetailsEntity> PropertySocialDetails { get; set; } = null!;
    public DbSet<PolicyMastEntity> PolicyMast { get; set; } = null!;
    public DbSet<PolicyConditionDetailsEntity> PolicyConditionDetails { get; set; } = null!;
    public DbSet<PropertySocialDocumentEntity> PropertySocialDocuments { get; set; } = null!;
    public DbSet<PropertyWorkflowStageMasterEntity> PropertyWorkflowStageMaster { get; set; } = null!;
    public DbSet<PropertyWorkflowDetailsEntity> PropertyWorkflowDetails { get; set; } = null!;
    public DbSet<PropertySurveyVisitEntity> PropertySurveyVisit { get; set; } = null!;
    public DbSet<UserEntity> UserMasters { get; set; } = null!;
    public DbSet<RefreshTokenEntity> RefreshTokens { get; set; } = null!;
    public DbSet<TwoFactorRecoveryCodeEntity> TwoFactorRecoveryCodes { get; set; } = null!;
    public DbSet<MfaChallengeEntity> TwoFactorChallenges { get; set; } = null!;
    public DbSet<SecurityAuditLogEntity> SecurityAuditLogs { get; set; } = null!;
    public DbSet<PropertyTaxCalculationCVResultsEntity> PropertyTaxCalculationCVResults { get; set; } = null!;
    public DbSet<RVCalculationResultsEntity> RVCalculationResults { get; set; } = null!;
    public DbSet<RVCalculationTaxDetailsEntity> RVCalculationTaxDetails { get; set; } = null!;
    public DbSet<RVCalculationSignatureEntity> RVCalculationSignatures { get; set; } = null!;
    public DbSet<NatureFactorCVMasterEntity> NatureFactorCVMasters { get; set; } = null!;
    public DbSet<AgeFactorCVMasterEntity> AgeFactorCVMasters { get; set; } = null!;
    public DbSet<FloorFactorCVMasterEntity> FloorFactorCVMasters { get; set; } = null!;
    public DbSet<TaxPercentageMasterCVEntity> TaxPercentageMasterCVs { get; set; } = null!;
    public DbSet<TaxMasterEntity> TaxMaster { get; set; } = null!;
    public DbSet<DynamicTaxRuleEntity> DynamicTaxRuleMaster { get; set; } = null!;
    public DbSet<TaxCalculationModeMasterEntity> TaxCalculationModeMaster { get; set; } = null!;
    public DbSet<TaxMasterMappingEntity> TaxMasterMappings { get; set; } = null!;
    public DbSet<TaxConditionRuleEntity> TaxConditionRules { get; set; } = null!;
    public DbSet<TaxHybridConfigEntity> TaxHybridConfigs { get; set; } = null!;
    public DbSet<TaxCategoryMasterEntity> TaxCategoryMaster { get; set; } = null!;
    public DbSet<FlagMasterEntity> FlagMaster { get; set; } = null!;
    public DbSet<TransMastOldEntity> TransMastOld { get; set; } = null!;

    public DbSet<RenterDetailEntity> RenterDetails { get; set; } = null!;
    public DbSet<RoomWiseSubmissionDetailsEntity> RoomWiseSubmissionDetails { get; set; } = null!;
    public DbSet<UserDepartmentAllocationEntity> UserDepartmentAllocation { get; set; } = null!;
    public DbSet<UserModuleAllocationEntity> UserModuleAllocation { get; set; } = null!;
    public DbSet<UserRoleAllocationEntity> UserRoleAllocation { get; set; } = null!;
    public DbSet<EmployeeTypeEntity> EmployeeType { get; set; } = null!;
    public DbSet<PropertyDescriptionAndTypeOfUseValidationEntity> PropertyDescriptionAndTypeOfUseValidations { get; set; } = null!;
    public DbSet<GenderMasterEntity> GenderMasters { get; set; } = null!;
    public DbSet<PropertyCertificateTypeMasterEntity> PropertyCertificateTypeMasters { get; set; } = null!;
    public DbSet<FloorGroupMasterEntity> FloorGroupMaster { get; set; } = null!;
    public DbSet<PolicyTaxDetailsCVEntity> PolicyTaxDetailsCV { get; set; } = null!;

    public DbSet<BlockMasterEntity> BlockMasters { get; set; } = null!;
    public DbSet<PropertyCertificateEntity> PropertyCertificates { get; set; } = null!;
    public DbSet<PropertyPhotoEntity> PropertyPhotos { get; set; } = null!;
    public DbSet<PropertyPhotoOldEntity> PropertyPhotosOld { get; set; } = null!;

    public DbSet<DocumentEntity> Documents { get; set; } = null!;
    public DbSet<DocumentBindingEntity> DocumentBindings { get; set; } = null!;
    public DbSet<TaxPercentageMasterRVEntity> TaxPercentageMasterRVs { get; set; } = null!;

    public DbSet<UseFactorCVMasterEntity> UseFactorCVMaster { get; set; } = null!;
    public DbSet<ParkingTypeMasterEntity> ParkingTypeMaster { get; set; } = null!;
    public DbSet<BuildingPlanTypeEntity> BuildingPlanType { get; set; } = null!;
    public DbSet<RuleScopeEntity> RuleScope { get; set; } = null!;
    public DbSet<PolicyTaxDetailsEntity> PolicyTaxDetails { get; set; } = null!;
    public DbSet<PolicyCodeMasterEntity> PolicyCodeMaster { get; set; } = null!;
    public DbSet<CommonRemarkTypeMasterEntity> CommonRemarkTypeMasters { get; set; } = null!;
    public DbSet<RuleEffectTypeEntity> RuleEffectTypeMaster { get; set; } = null!;

    public DbSet<RenterMastEntity> RenterMast { get; set; } = null!;
    public DbSet<CommonRemarkDetailsEntity> CommonRemarkDetails { get; set; } = null!;
    public DbSet<PropertyMapMasterEntity> PropertyMapMasters { get; set; } = null!;
    public DbSet<RoomTypeMasterEntity> RoomTypeMasters { get; set; } = null!;

    public DbSet<WaterConnectionTypeEntity> WaterConnectionTypes { get; set; } = null!;
    public DbSet<WaterConnectionSizeEntity> WaterConnectionSizes { get; set; } = null!;
    public DbSet<WaterConnectionStatusEntity> WaterConnectionStatuses { get; set; } = null!;
    public DbSet<WaterRateMasterEntity> WaterRateMasters { get; set; } = null!;
    public DbSet<WaterConnectionMasterEntity> WaterConnectionMasters { get; set; } = null!;
    public DbSet<WaterConnectionDetailsEntity> WaterConnectionDetails { get; set; } = null!;
    public DbSet<BulkUpdateMasterEntity> BulkUpdateMasters { get; set; } = null!;
    public DbSet<BulkUpdateFieldConfigEntity> BulkUpdateFieldConfigs { get; set; } = null!;
    public DbSet<BulkUpdateHistoryEntity> BulkUpdateHistory { get; set; } = null!;
    public DbSet<BulkUpdateActivityEntity> BulkUpdateActivity { get; set; } = null!;
    public DbSet<PropertyTaxJobEntity> PropertyTaxJobs { get; set; } = null!;
    public DbSet<PropertyTaxJobDetailEntity> PropertyTaxJobDetails { get; set; } = null!;
    public DbSet<PropertyMediaJobEntity> PropertyMediaJobs { get; set; } = null!;
    public DbSet<PropertyMediaJobDetailEntity> PropertyMediaJobDetails { get; set; } = null!;


    //Asset Start
    public DbSet<CVRateMasterEntity> CVRateMaster { get; set; } = null!;
    public DbSet<InventoryItemCategoryEntity> InventoryItemCategory { get; set; } = null!;
    public DbSet<InventoryItemNameEntity> InventoryItemName { get; set; } = null!;
    public DbSet<InventoryItemModelEntity> InventoryItemModelMaster { get; set; } = null!;
    public DbSet<EducationTaxMasterEntity> EducationTaxMasters { get; set; } = null!;
    public DbSet<ScreenEntity> AssetScreen { get; set; } = null!;
    public DbSet<ScreenFormSectionMasterEntity> ScreenFormSectionMaster { get; set; } = null!;
    public DbSet<ScreenFormFieldMasterEntity> ScreenFormFieldMaster { get; set; } = null!;
    public DbSet<SocialAttributeEntity> SocialAttribute { get; set; } = null!;
    public DbSet<TypeOfUseGroupCVEntity> TypeOfUseGroupMasterCV { get; set; } = null!;
    public DbSet<EmploymentTaxMasterEntity> EmploymentTaxMasters { get; set; } = null!;
    public DbSet<AssetTypeEntity> AssetType { get; set; } = null!;
    public DbSet<AssetCategoryEntity> AssetCategory { get; set; } = null!;
    public DbSet<OwnershipTypeEntity> OwnershipType { get; set; } = null!;
    public DbSet<OwningDepartmentEntity> OwningDepartment { get; set; } = null!;
    public DbSet<UserOwningDepartmentAllocationEntity> UserOwningDepartmentAllocation { get; set; } = null!;
    public DbSet<UserZoneAllocationEntity> UserZoneAllocation { get; set; } = null!;
    public DbSet<AssetDesignationEntity> AssetDesignations { get; set; } = null!;
    public DbSet<SubUnitsDetailsEntity> SubUnitsDetails { get; set; } = null!;
    public DbSet<AssetCVCalculationHistoryEntity> AssetCVCalculationHistories { get; set; } = null!;
    public DbSet<AssetApplicationTypeEntity> AssetApplicationTypes { get; set; } = null!;
    public DbSet<RulesFieldEntity> RulesField { get; set; } = null!;
    public DbSet<RuleScopeFieldMappingEntity> RuleScopeFieldMapping { get; set; } = null!;
    public DbSet<FieldConfigurationEntity> FieldConfiguration { get; set; } = null!;
    public DbSet<EffectTypeConfigurationEntity> EffectTypeConfiguration { get; set; } = null!;
    public DbSet<RuleEngineEntity> RuleEngine { get; set; } = null!;
    public DbSet<RuleVersionHistoryEntity> RuleVersionHistory { get; set; } = null!;
    public DbSet<RuleCategoryEntity> RuleCategory { get; set; } = null!;
    public DbSet<AssetRentDocumentTypeEntity> AssetRentDocumentTypes { get; set; } = null!;
    public DbSet<InventoryDocumentTypeEntity> InventoryDocumentTypes { get; set; } = null!;
    public DbSet<AssetPhotoEntity> AssetPhotos { get; set; } = null!;
    public DbSet<AssetMasterEntity> AssetMaster { get; set; } = null!;
    public DbSet<AssetDetailsEntity> AssetDetails { get; set; } = null!;
    public DbSet<AssetFieldValueEntity> AssetFieldValue { get; set; } = null!;
    public DbSet<AssetLeaseRentDetailsEntity> AssetLeaseRentDetails { get; set; } = null!;
    public DbSet<AssetRoomWiseSubmissionDetailsEntity> AssetRoomWiseSubmissionDetails { get; set; } = null!;
    public DbSet<AssetRoomWiseMinusDataEntity> AssetRoomWiseMinusData { get; set; } = null!;
    public DbSet<MonthWiseDemandEntity> MonthWiseDemand { get; set; } = null!;
    public DbSet<LeaseRentBillTransactionEntity> LeaseRentBillTransactions { get; set; } = null!;
    public DbSet<LeaseRentBillTransactionDetailEntity> LeaseRentBillTransactionDetails { get; set; } = null!;
    public DbSet<ChequePaymentTransactionEntity> ChequePaymentTransactions { get; set; } = null!;
    public DbSet<InventoryAssetDetailEntity> InventoryAssetDetails { get; set; } = null!;
    // New child table entities with FK to PropertyMast
    public DbSet<ApplyTaxesMasterEntity> ApplyTaxesMaster { get; set; } = null!;
    public DbSet<PropertyAssessmentDetailsEntity> PropertyAssessmentDetails { get; set; } = null!;
    public DbSet<PropertyTaxCalculationSection129ResultsEntity> PropertyTaxCalculationSection129Results { get; set; } = null!;
    public DbSet<AssetRoomTypeMasterEntity> AssetRoomTypeMaster { get; set; } = null!;
    public DbSet<AssetAgeFactorCVMasterEntity> AssetAgeFactorCVMaster { get; set; } = null!;
    public DbSet<AssetNatureFactorCVMasterEntity> AssetNatureFactorCVMaster { get; set; } = null!;
    public DbSet<AssetUseFactorCVMasterEntity> AssetUseFactorCVMaster { get; set; } = null!;
    public DbSet<AssetAssessmentYearRangeMasterCVEntity> AssetAssessmentYearRangeMasterCV { get; set; } = null!;
    public DbSet<PropertyAssessmentStatusEntity> PropertyAssessmentStatuses { get; set; } = null!;
    public DbSet<PropertyImagesMastEntity> PropertyImagesMast { get; set; } = null!;

    public DbSet<TransMastEntity> TransMast { get; set; } = null!;
    public DbSet<TransMastArchiveEntity> TransMastArchive { get; set; } = null!;
    public DbSet<TransMastLookupEntity> TransMastLookup { get; set; } = null!;
    public DbSet<RoomWiseMinusDataEntity> RoomWiseMinusData { get; set; } = null!;
    public DbSet<AssetDocumentDefinitionEntity> AssetDocumentDefinitions { get; set; } = null!;
    public DbSet<AssetDocumentEntity> AssetDocuments { get; set; } = null!;
    public DbSet<AssetFieldDefinitionEntity> AssetFieldDefinitions { get; set; } = null!;
    public DbSet<AssetAuthorityMasterEntity> AssetAuthorityMasters { get; set; } = null!;
    public DbSet<AssetOrganizationMasterEntity> AssetOrganizationMasters { get; set; } = null!;
    public DbSet<AssetConditionMasterEntity> AssetConditionMasters { get; set; } = null!;
    public DbSet<SubZoneDetailsForCVEntity> SubZoneDetailsForCV { get; set; } = null!;
    public DbSet<PropertyRuleApplicationLogEntity> PropertyRuleApplicationLogs { get; set; } = null!;

    // Property Sign-off Module
    public DbSet<SignAuthorityMasterEntity> SignAuthorityMaster { get; set; } = null!;
    public DbSet<PropertySignatureDetailsEntity> PropertySignatureDetails { get; set; } = null!;
    public DbSet<SocietyWingDetailsEntity> SocietyWingDetails { get; set; } = null!;
    public DbSet<GlobalSurveyWardAllocationEntity> GlobalSurveyWardAllocations { get; set; } = null!;
    public DbSet<PropertyMapDetailEntity> PropertyMapDetails { get; set; } = null!;
    public DbSet<GSTMasterEntity> GSTMaster { get; set; } = null!;
    public DbSet<PenaltyRuleMasterEntity> PenaltyRuleMaster { get; set; } = null!;
    public DbSet<AssetMoujaMasterEntity> AssetMoujaMaster { get; set; } = null!;
    public DbSet<AssetSubZoneDetailsForCVEntity> AssetSubZoneDetailsForCVMaster { get; set; } = null!;
    public DbSet<AssetTypeOfUseGroupEntity> AssetTypeOfUseGroupMaster { get; set; } = null!;
    public DbSet<AssetTypeOfUseMasterEntity> AssetTypeOfUseMaster { get; set; } = null!;
    public DbSet<AssetSubTypeOfUseEntity> AssetSubTypeOfUseMaster { get; set; } = null!;
    public DbSet<AssetFloorFactorCVEntity> AssetFloorFactorCVMaster { get; set; } = null!;
    public DbSet<AssetPhotoTypeEntity> AssetPhotoTypeMaster { get; set; } = null!;
    public DbSet<InventoryBatchEntity> InventoryBatches { get; set; } = null!;
    public DbSet<InventoryDocumentEntity> InventoryDocuments { get; set; } = null!;
    public DbSet<AssetGrievanceCategoryEntity> AssetGrievanceCategoryMaster { get; set; } = null!;
    public DbSet<AssetGrievanceRemarkMasterEntity> AssetGrievanceRemarkMaster { get; set; } = null!;
    public DbSet<AssetGrievanceDetailsEntity> AssetGrievanceDetails { get; set; } = null!;
    public DbSet<AssetGrievanceCorrectionDetailEntity> AssetGrievanceCorrectionDetails { get; set; } = null!;
    public DbSet<AssetGrievanceActionHistoryEntity> AssetGrievanceActionHistories { get; set; } = null!;
    public DbSet<AssetGrievanceDocumentTypeEntity> AssetGrievanceDocumentTypes { get; set; } = null!;
    public DbSet<AssetGrievanceDocumentEntity> AssetGrievanceDocuments { get; set; } = null!;
    public DbSet<AssetGrievanceMediaCorrectionEntity> AssetGrievanceMediaCorrections { get; set; } = null!;
    public DbSet<GrievanceWorkflowStageMasterEntity> GrievanceWorkflowStageMasters { get; set; } = null!;
    public DbSet<GrievanceStageAccessControlEntity> GrievanceStageAccessControls { get; set; } = null!;

    public DbSet<CommunicationDetailsEntity> CommunicationDetails { get; set; } = null!;
    public DbSet<VillageMasterEntity> VillageMasters { get; set; } = null!;

    // Retrospective Tax Rule Engine
    public DbSet<EvidenceTypeMasterEntity> EvidenceTypeMaster { get; set; } = null!;
    public DbSet<RetrospectiveRuleMasterEntity> RetrospectiveRuleMaster { get; set; } = null!;
    public DbSet<RetrospectiveTaxPolicyEntity> RetrospectiveTaxPolicy { get; set; } = null!;
    public DbSet<RetrospectiveRuleEvidenceConditionEntity> RetrospectiveRuleEvidenceCondition { get; set; } = null!;
    public DbSet<RetrospectiveRuleDateConditionEntity> RetrospectiveRuleDateCondition { get; set; } = null!;
    public DbSet<RetrospectiveRuleActionEntity> RetrospectiveRuleAction { get; set; } = null!;
    public DbSet<RetrospectivePenaltyRuleEntity> RetrospectivePenaltyRule { get; set; } = null!;
    public DbSet<RetrospectiveRuleSummaryEntity> RetrospectiveRuleSummary { get; set; } = null!;
    public DbSet<RetrospectiveTaxCalculationEntity> RetrospectiveTaxCalculation { get; set; } = null!;
    public DbSet<RetrospectiveCalculationEvidenceEntity> RetrospectiveCalculationEvidence { get; set; } = null!;
    public DbSet<RetrospectiveTaxCalculationDetailEntity> RetrospectiveTaxCalculationDetail { get; set; } = null!;
    public DbSet<RetrospectiveRuleAuditLogEntity> RetrospectiveRuleAuditLog { get; set; } = null!;

    // Property Revision (Phase 1 - see revision_api_rules.txt)
    public DbSet<RevisionMastEntity> RevisionMast { get; set; } = null!;
    public DbSet<RevisionPeriodEntity> RevisionPeriod { get; set; } = null!;

    // Property Revision (Phase 2a - core property snapshot group)
    public DbSet<RevisionPropertyMastEntity> RevisionPropertyMast { get; set; } = null!;
    public DbSet<RevisionPropertyMastDetailsEntity> RevisionPropertyMastDetails { get; set; } = null!;
    public DbSet<RevisionPropertyDetailsEntity> RevisionPropertyDetails { get; set; } = null!;
    public DbSet<RevisionRenterMastEntity> RevisionRenterMast { get; set; } = null!;
    public DbSet<RevisionRenterDetailsEntity> RevisionRenterDetails { get; set; } = null!;
    public DbSet<RevisionRoomWiseSubmissionDetailsEntity> RevisionRoomWiseSubmissionDetails { get; set; } = null!;
    public DbSet<RevisionRoomWiseMinusDataEntity> RevisionRoomWiseMinusData { get; set; } = null!;
    public DbSet<RevisionPropertySocialDetailsEntity> RevisionPropertySocialDetails { get; set; } = null!;
    public DbSet<RevisionPropertyCertificatesEntity> RevisionPropertyCertificates { get; set; } = null!;
    public DbSet<RevisionPropertyPhotoEntity> RevisionPropertyPhoto { get; set; } = null!;
    public DbSet<RevisionDocumentDetailsEntity> RevisionDocumentDetails { get; set; } = null!;
    public DbSet<RevisionRVCalculationResultsEntity> RevisionRVCalculationResults { get; set; } = null!;
    public DbSet<RevisionRVCalculationTaxDetailsEntity> RevisionRVCalculationTaxDetails { get; set; } = null!;
    public DbSet<RevisionPropertyTaxCalculationCVResultsEntity> RevisionPropertyTaxCalculationCVResults { get; set; } = null!;
    public DbSet<RevisionPolicyTaxDetailsEntity> RevisionPolicyTaxDetails { get; set; } = null!;
    public DbSet<RevisionPolicyTaxDetailsCVEntity> RevisionPolicyTaxDetailsCV { get; set; } = null!;
    public DbSet<RevisionTransMastEntity> RevisionTransMast { get; set; } = null!;
    public DbSet<RevisionApplyTaxesMasterEntity> RevisionApplyTaxesMaster { get; set; } = null!;

    public DbSet<FieldTypeMasterEntity> FieldTypeMaster { get; set; } = null!;
    public DbSet<ScreenFieldMasterEntity> ScreenFieldMaster { get; set; } = null!;
    public DbSet<ScreenFieldValidationEntity> ScreenFieldValidation { get; set; } = null!;
    public DbSet<ButtonTypeMasterEntity> ButtonTypeMaster { get; set; } = null!;
    public DbSet<ScreenButtonMasterEntity> ScreenButtonMaster { get; set; } = null!;
    public DbSet<ScreenButtonPermissionEntity> ScreenButtonPermission { get; set; } = null!;

    // Section 129A
    public DbSet<PropertySection129ScheduleEntity> PropertySection129Schedule { get; set; } = null!;
    public DbSet<PropertySection129ApplicationEntity> PropertySection129Application { get; set; } = null!;
	    //Grievance Module
    public DbSet<CitizenMasterEntity> CitizenMasters { get; set; } = null!;
    public DbSet<CitizenOtpLogEntity> CitizenOtpLogs { get; set; } = null!;
    public DbSet<GrievanceDepartmentMasterEntity> GrievanceDepartmentMasters { get; set; } = null!;
    public DbSet<GrievanceTypeMasterEntity> GrievanceTypeMasters { get; set; } = null!;
    public DbSet<GrievanceWorkflowEntity> GrievanceWorkflows { get; set; } = null!;
    public DbSet<GrievanceWorkflowStateEntity> GrievanceWorkflowStates { get; set; } = null!;
    public DbSet<GrievanceWorkflowTransitionEntity> GrievanceWorkflowTransitions { get; set; } = null!;
    public DbSet<GrievanceApplicationEntity> GrievanceApplications { get; set; } = null!;
    public DbSet<GrievanceActivityLogEntity> GrievanceActivityLogs { get; set; } = null!;
    public DbSet<GrievanceDeptForwardingEntity> GrievanceDeptForwardings { get; set; } = null!;
    public DbSet<GrievancePhotoTypeEntity> GrievancePhotoType { get; set; } = null!;
    public DbSet<GrievancePhotoEntity> GrievancePhotos { get; set; } = null!;
    public DbSet<GrievanceEscalationEntity> GrievanceEscalations { get; set; } = null!;

    // Municipal Payroll (PRMS) -  Masters
    public DbSet<PayrollDepartmentMasterEntity> PayrollDepartmentMaster { get; set; } = null!;
    public DbSet<PayrollDesignationMasterEntity> PayrollDesignationMaster { get; set; } = null!;
    public DbSet<PayrollEmployeeClassMasterEntity> PayrollEmployeeClassMaster { get; set; } = null!;
    public DbSet<PayrollEmployeeStatusMasterEntity> PayrollEmployeeStatusMaster { get; set; } = null!;
    public DbSet<PayrollEmployeeTypeMasterEntity> PayrollEmployeeTypeMaster { get; set; } = null!;

    // Municipal Payroll (PRMS) - Batch 2 Masters
    public DbSet<PayrollBloodGroupMasterEntity> PayrollBloodGroupMaster { get; set; } = null!;
    public DbSet<PayrollGenderMasterEntity> PayrollGenderMaster { get; set; } = null!;
    public DbSet<PayrollMaritalStatusMasterEntity> PayrollMaritalStatusMaster { get; set; } = null!;
    public DbSet<PayrollQualificationMasterEntity> PayrollQualificationMaster { get; set; } = null!;
    public DbSet<PayrollRelationshipMasterEntity> PayrollRelationshipMaster { get; set; } = null!;

    // Municipal Payroll (PRMS) - Geographic Masters
    public DbSet<PayrollStateMasterEntity> PayrollStateMaster { get; set; } = null!;
    public DbSet<PayrollDistrictMasterEntity> PayrollDistrictMaster { get; set; } = null!;
    public DbSet<PayrollTalukaMasterEntity> PayrollTalukaMaster { get; set; } = null!;
    public DbSet<PayrollVillageMasterEntity> PayrollVillageMaster { get; set; } = null!;
    public DbSet<PayrollZoneDivisionMasterEntity> PayrollZoneDivisionMaster { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ===== Property Revision (Phase 1) =====
        // Header/period tables only, mapped to match the authoritative CREATE TABLE script for
        // PTIS.RevisionMast / PTIS.RevisionPeriod exactly (column-for-column). The ~20 revision
        // snapshot tables (RevisionPropertyMast, RevisionPropertyDetails, RevisionRenterMast, ...)
        // are added in later phases alongside the draft-editing APIs that use them.
        modelBuilder.Entity<RevisionMastEntity>(entity =>
        {
            entity.ToTable("RevisionMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.FinanceYearId).IsRequired();
            entity.Property(e => e.RevisionNo).IsRequired();
            entity.Property(e => e.CalculationType).HasConversion<string>().HasMaxLength(10).IsRequired();
            entity.Property(e => e.CalculationScope).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.RevisionType).HasMaxLength(30).IsRequired();
            entity.Property(e => e.RevisionReason).HasMaxLength(1000);
            entity.Property(e => e.SourceType).HasMaxLength(30);
            entity.Property(e => e.RevisionStatus).HasConversion<string>().HasMaxLength(20).IsRequired()
                .HasDefaultValue(RevisionStatus.DRAFT);
            // No HasDefaultValue here: with a default of true EF would silently turn an explicit
            // IsCurrent = false (new DRAFT revisions) into the DB default (true). The revision code
            // always sets IsCurrent explicitly.
            entity.Property(e => e.IsCurrent).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.PropertyId, e.FinanceYearId, e.RevisionNo })
                .HasDatabaseName("UX_RevisionMast_Property_Year_RevisionNo")
                .IsUnique()
                .HasFilter("[MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.PropertyId, e.FinanceYearId })
                .HasDatabaseName("UX_RevisionMast_Current")
                .IsUnique()
                .HasFilter("[IsCurrent] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.PropertyId, e.FinanceYearId })
                .HasDatabaseName("UX_RevisionMast_Open_Unique")
                .IsUnique()
                .HasFilter("[RevisionStatus] IN ('DRAFT', 'CALCULATED', 'APPROVED') AND [IsActive] = 1 AND [MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.PropertyId, e.FinanceYearId })
                .HasDatabaseName("IX_RevisionMast_PropertyYear")
                .IncludeProperties(e => new
                {
                    e.RevisionNo, e.CalculationType, e.CalculationScope, e.RevisionType,
                    e.EffectiveDate, e.RevisionStatus, e.IsCurrent
                });

            entity.HasOne(e => e.Property)
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PolicyCodeMaster)
                .WithMany()
                .HasForeignKey(e => e.PolicyCodeId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PreviousRevision)
                .WithMany()
                .HasForeignKey(e => e.PreviousRevisionMastId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPeriodEntity>(entity =>
        {
            entity.ToTable("RevisionPeriod", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.PeriodNo).IsRequired();
            entity.Property(e => e.EffectiveFrom).IsRequired().HasColumnType("date");
            entity.Property(e => e.EffectiveTo).IsRequired().HasColumnType("date");
            // PERSISTED computed column (DATEDIFF(DAY, EffectiveFrom, EffectiveTo) + 1) - store-generated, never written by EF.
            entity.Property(e => e.PeriodDays).ValueGeneratedOnAddOrUpdate();
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.RowVersion).IsRowVersion();

            // UQ_RevisionPeriod_Id_RevisionMastId - lets later snapshot tables FK on (Id, RevisionMastId).
            entity.HasAlternateKey(e => new { e.Id, e.RevisionMastId })
                .HasName("UQ_RevisionPeriod_Id_RevisionMastId");
            entity.HasIndex(e => new { e.RevisionMastId, e.PeriodNo })
                .HasDatabaseName("UX_RevisionPeriod_Revision_PeriodNo")
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.RevisionMastId, e.EffectiveFrom, e.EffectiveTo })
                .HasDatabaseName("IX_RevisionPeriod_Revision_Dates")
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");

            entity.HasOne(e => e.RevisionMast)
                .WithMany(r => r.Periods)
                .HasForeignKey(e => e.RevisionMastId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ===== Property Revision (Phase 2a - core property snapshot group) =====
        // RevisionPropertyMast / RevisionPropertyMastDetails /
        // RevisionPropertyDetails, mapped column-for-column against the
        // authoritative CREATE TABLE script. None of these tables has a ROWVERSION column
        // (unlike RevisionMast/RevisionPeriod) - do not add RowVersion properties for them.
        modelBuilder.Entity<RevisionPropertyMastEntity>(entity =>
        {
            entity.ToTable("RevisionPropertyMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.SourcePropertyId).IsRequired();
            entity.Property(e => e.TaxZoneId).IsRequired();
            entity.Property(e => e.WardId).IsRequired();
            entity.Property(e => e.PropertyNo).HasMaxLength(10);
            entity.Property(e => e.PartitionNo).HasMaxLength(10);
            entity.Property(e => e.PropertySeqNo).IsRequired();
            entity.Property(e => e.UPICId).HasMaxLength(30);
            entity.Property(e => e.CSN).HasMaxLength(30);
            entity.Property(e => e.SubZoneNo).HasMaxLength(20);
            entity.Property(e => e.PlotNo).HasMaxLength(20);
            entity.Property(e => e.OwnerTitle).HasMaxLength(20);
            entity.Property(e => e.OwnerName).HasMaxLength(1000);
            entity.Property(e => e.OccupierTitle).HasMaxLength(20);
            entity.Property(e => e.OccupierName).HasMaxLength(1000);
            entity.Property(e => e.FlatOrShopNo).HasMaxLength(100);
            entity.Property(e => e.FlatOrShopName).HasMaxLength(200);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.PinCode).HasMaxLength(6);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.MobileNo).HasMaxLength(13);
            entity.Property(e => e.AlternateMobileNo).HasMaxLength(13);
            entity.Property(e => e.OccupierMobileNo).HasMaxLength(13);
            entity.Property(e => e.EmailId).HasMaxLength(100);
            entity.Property(e => e.OwnerTitleEnglish).HasMaxLength(20);
            entity.Property(e => e.OwnerNameEnglish).HasMaxLength(1000);
            entity.Property(e => e.OccupierTitleEnglish).HasMaxLength(20);
            entity.Property(e => e.OccupierNameEnglish).HasMaxLength(1000);
            entity.Property(e => e.FlatOrShopNoEnglish).HasMaxLength(100);
            entity.Property(e => e.FlatOrShopNameEnglish).HasMaxLength(200);
            entity.Property(e => e.AddressEnglish).HasMaxLength(500);
            entity.Property(e => e.LocationEnglish).HasMaxLength(200);
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");

            entity.HasAlternateKey(e => new { e.Id, e.RevisionMastId })
                .HasName("UQ_RevisionPropertyMast_Id_Revision");
            entity.HasIndex(e => e.RevisionMastId)
                .HasDatabaseName("UX_RevisionPropertyMast_History")
                .IsUnique()
                .HasFilter("[RevisionPeriodId] IS NULL AND [IsActive] = 1 AND [MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.RevisionMastId, e.RevisionPeriodId })
                .HasDatabaseName("UX_RevisionPropertyMast_Period")
                .IsUnique()
                .HasFilter("[RevisionPeriodId] IS NOT NULL AND [IsActive] = 1 AND [MarkedForDeletion] = 0");

            entity.HasOne(e => e.RevisionMast)
                .WithMany()
                .HasForeignKey(e => e.RevisionMastId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RevisionPeriod)
                .WithMany()
                .HasForeignKey(e => e.RevisionPeriodId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.TaxZone).WithMany().HasForeignKey(e => e.TaxZoneId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Ward).WithMany().HasForeignKey(e => e.WardId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PropertyTypeMaster).WithMany().HasForeignKey(e => e.PropertyTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Mouja).WithMany().HasForeignKey(e => e.MoujaId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PropertyCategory).WithMany().HasForeignKey(e => e.CategoryId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.WingDetailsMast).WithMany().HasForeignKey(e => e.WingDetailId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PropertyAssessmentStatus).WithMany().HasForeignKey(e => e.PropertyAssessmentStatusId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PropertyFloor).WithMany().HasForeignKey(e => e.PropertyFloorId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPropertyMastDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionPropertyMastDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionPropertyMastId).IsRequired();
            entity.Property(e => e.AssessmentRemark).HasMaxLength(400);
            entity.Property(e => e.SurveyRemark).HasMaxLength(400);
            entity.Property(e => e.FlatSystemRemark).HasMaxLength(400);
            entity.Property(e => e.CombPropRemark).HasMaxLength(400);
            entity.Property(e => e.AdharCardNo).HasMaxLength(12);
            entity.Property(e => e.RenterMobileNo).HasMaxLength(13);
            entity.Property(e => e.BHK).HasMaxLength(50);
            entity.Property(e => e.BlockNo).HasMaxLength(20);
            entity.Property(e => e.AlternetivEmailId).HasMaxLength(100);
            entity.Property(e => e.Latitude).HasMaxLength(20);
            entity.Property(e => e.Longitude).HasMaxLength(20);
            entity.Property(e => e.UnitGenerationType).HasMaxLength(4);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");

            entity.HasIndex(e => e.RevisionPropertyMastId)
                .HasDatabaseName("UX_RevisionPropertyMastDetails_PropertyMast")
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");

            entity.HasOne(e => e.RevisionMast).WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RevisionPeriod)
                .WithMany()
                .HasForeignKey(e => e.RevisionPeriodId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RevisionPropertyMast)
                .WithOne(p => p.PropertyMastDetails)
                .HasForeignKey<RevisionPropertyMastDetailsEntity>(e => new { e.RevisionPropertyMastId, e.RevisionMastId })
                .HasPrincipalKey<RevisionPropertyMastEntity>(p => new { p.Id, p.RevisionMastId })
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.OwnerTypeMaster).WithMany().HasForeignKey(e => e.OwnerTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPropertyDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionPropertyDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionPropertyMastId).IsRequired();
            entity.Property(e => e.DetailSequenceNo).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.FloorId).IsRequired();
            entity.Property(e => e.ConstructionTypeId).IsRequired();
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.ConstructionYear).HasMaxLength(4);
            entity.Property(e => e.AssessmentYear).HasMaxLength(4);
            entity.Property(e => e.CarpetAreaSqMeter).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.BuiltupAreaSqMeter).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CarpetAreaSqFeet).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.BuiltupAreaSqFeet).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_RevisionPropertyDetails_DetailSequenceNo", "[DetailSequenceNo] > 0"));

            entity.HasAlternateKey(e => new { e.Id, e.RevisionMastId })
                .HasName("UQ_RevisionPropertyDetails_Id_Revision");
            entity.HasIndex(e => new { e.RevisionPropertyMastId, e.DetailSequenceNo })
                .HasDatabaseName("UX_RevisionPropertyDetails_Sequence")
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");
            entity.HasIndex(e => e.SourcePropertyDetailsId)
                .HasDatabaseName("IX_RevisionPropertyDetails_Source")
                .HasFilter("[SourcePropertyDetailsId] IS NOT NULL");

            entity.HasOne(e => e.RevisionMast).WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RevisionPeriod)
                .WithMany()
                .HasForeignKey(e => e.RevisionPeriodId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RevisionPropertyMast)
                .WithMany(p => p.PropertyDetails)
                .HasForeignKey(e => new { e.RevisionPropertyMastId, e.RevisionMastId })
                .HasPrincipalKey(p => new { p.Id, p.RevisionMastId })
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Floor).WithMany().HasForeignKey(e => e.FloorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.SubFloor).WithMany().HasForeignKey(e => e.SubFloorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ConstructionType).WithMany().HasForeignKey(e => e.ConstructionTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.TypeOfUse).WithMany().HasForeignKey(e => e.TypeOfUseId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.SubTypeOfUse).WithMany().HasForeignKey(e => e.SubTypeOfUseId).OnDelete(DeleteBehavior.Restrict);
        });

        // ===== Property Revision (Phase 2b - remaining snapshot, calculation and trace tables) =====
        modelBuilder.Entity<RevisionRenterMastEntity>(entity =>
        {
            entity.ToTable("RevisionRenterMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionPropertyDetailsId).IsRequired();
            entity.Property(e => e.FinancialYear).HasMaxLength(4);
            entity.Property(e => e.RentMonthly).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.FinalYearlyRent).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.NonCalculateRentMonthly).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.DurationFrom).HasColumnType("datetime");
            entity.Property(e => e.DurationTo).HasColumnType("datetime");
            entity.Property(e => e.TaxLiability).HasMaxLength(20);
            entity.Property(e => e.RenterNameEnglish).HasMaxLength(500);
            entity.Property(e => e.RenterName).HasMaxLength(500);
            entity.Property(e => e.AgreementDate).HasColumnType("datetime");
            entity.Property(e => e.AgreementFromDate).HasColumnType("datetime");
            entity.Property(e => e.AgreementToDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasAlternateKey(e => new { e.Id, e.RevisionMastId }).HasName("UQ_RevisionRenterMast_Id_Revision");
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyDetailsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionRenterDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionRenterDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionPropertyDetailsId).IsRequired();
            entity.Property(e => e.AgreementId).HasMaxLength(25);
            entity.Property(e => e.IncrementFrequency).HasMaxLength(35);
            entity.Property(e => e.IncrementType).HasMaxLength(35);
            entity.Property(e => e.IncrementMethod).HasMaxLength(35);
            entity.Property(e => e.DurationFrom).HasColumnType("datetime");
            entity.Property(e => e.DurationTo).HasColumnType("datetime");
            entity.Property(e => e.CustomFromDate).HasColumnType("datetime");
            entity.Property(e => e.CustomToDate).HasColumnType("datetime");
            entity.Property(e => e.CustomIncrementType).HasMaxLength(100);
            entity.Property(e => e.CustomMethod).HasMaxLength(100);
            entity.Property(e => e.IncrementValue).HasPrecision(19, 4);
            entity.Property(e => e.RentAmount).HasPrecision(19, 4);
            entity.Property(e => e.Increment).HasPrecision(19, 4);
            entity.Property(e => e.RentMonthly).HasPrecision(19, 4);
            entity.Property(e => e.CustomIncrementValue).HasPrecision(19, 4);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionRenterDetails_DurationDates", "[DurationFrom] IS NULL OR [DurationTo] IS NULL OR [DurationTo] >= [DurationFrom]"));
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionRenterDetails_CustomDates", "[CustomFromDate] IS NULL OR [CustomToDate] IS NULL OR [CustomToDate] >= [CustomFromDate]"));
            entity.HasIndex(e => e.RevisionPropertyDetailsId).HasDatabaseName("IX_RevisionRenterDetails_PropertyDetails");
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyDetailsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionRenterMastEntity>().WithMany().HasForeignKey(e => new { e.RevisionRenterMastId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionRoomWiseSubmissionDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionRoomWiseSubmissionDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionPropertyMastId).IsRequired();
            entity.Property(e => e.Shape).HasMaxLength(25);
            entity.Property(e => e.RoomNo).HasMaxLength(100);
            entity.Property(e => e.OuterYesNo).IsRequired();
            entity.Property(e => e.SubmissionType).HasMaxLength(100);
            entity.Property(e => e.MinusYesNo).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasAlternateKey(e => new { e.Id, e.RevisionMastId }).HasName("UQ_RevisionRoomWiseSubmissionDetails_Id_Revision");
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyMastEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyMastId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyDetailsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionRoomWiseMinusDataEntity>(entity =>
        {
            entity.ToTable("RevisionRoomWiseMinusData", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionRoomWiseSubmissionId).IsRequired();
            entity.Property(e => e.Shape).HasMaxLength(25);
            entity.Property(e => e.IsOffset).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionRoomWiseSubmissionDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionRoomWiseSubmissionId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPropertySocialDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionPropertySocialDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(1);
            entity.Property(e => e.SocialAttributeId).IsRequired();
            entity.Property(e => e.DecimalValue).HasPrecision(18,2);
            entity.Property(e => e.TextValue).HasMaxLength(500);
            entity.Property(e => e.DateValue).HasColumnType("date");
            entity.Property(e => e.Remark).HasMaxLength(500);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionPropertySocialDetails_EntityType", "[EntityType] IN ('S','W','P')"));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPropertyCertificatesEntity>(entity =>
        {
            entity.ToTable("RevisionPropertyCertificates", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(1);
            entity.Property(e => e.CertificateTypeId).IsRequired();
            entity.Property(e => e.CertificateNo).HasMaxLength(100);
            entity.Property(e => e.CertificateIssueDate).HasColumnType("date");
            entity.Property(e => e.TaxApplied).IsRequired();
            entity.Property(e => e.TaxAppliedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.RowVersion).IsRequired().IsRowVersion();
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionPropertyCertificates_EntityType", "[EntityType] IN ('S','W','P')"));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyDetailsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPropertyPhotoEntity>(entity =>
        {
            entity.ToTable("RevisionPropertyPhoto", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(1);
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.PhotoTypeId).IsRequired();
            entity.Property(e => e.IsLatest).IsRequired();
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionPropertyPhoto_EntityType", "[EntityType] IN ('S','W','P')"));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionDocumentDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionDocumentDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.DocumentBindingId).IsRequired();
            entity.Property(e => e.DocumentTypeCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DocumentTitle).HasMaxLength(200);
            entity.Property(e => e.DocumentStage).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionDocumentDetails_DocumentStage", "[DocumentStage] IN ('BEFORE','AFTER','SUPPORTING','APPROVAL','ORDER','REPORT')"));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyDetailsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionRVCalculationResultsEntity>(entity =>
        {
            entity.ToTable("RevisionRVCalculationResults", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.RevisionPropertyDetailsId).IsRequired();
            entity.Property(e => e.AppliedOn).HasMaxLength(20);
            entity.Property(e => e.Depreciation).HasColumnType("money");
            entity.Property(e => e.DepreciationPer).HasPrecision(18,2);
            entity.Property(e => e.Maintenance).HasColumnType("money");
            entity.Property(e => e.RateableValue).HasColumnType("money");
            entity.Property(e => e.REducationTax).HasColumnType("money");
            entity.Property(e => e.CEducationTax).HasColumnType("money");
            entity.Property(e => e.CEmploymentTax).HasColumnType("money");
            entity.Property(e => e.ProrationFactor).HasPrecision(18,10);
            entity.Property(e => e.PeriodAnnualRentalValue).HasPrecision(18,2);
            entity.Property(e => e.PeriodRateableValue).HasPrecision(18,2);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasAlternateKey(e => new { e.Id, e.RevisionMastId }).HasName("UQ_RevisionRVCalculationResults_Id_Revision");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionRVCalculationResults_ProrationFactor", "[ProrationFactor] IS NULL OR ([ProrationFactor] >= 0 AND [ProrationFactor] <= 1)"));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyDetailsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionRVCalculationTaxDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionRVCalculationTaxDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionRVCalculationResultsId).IsRequired();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.TaxPercentage).HasColumnType("money");
            entity.Property(e => e.TaxAmount).HasColumnType("money");
            entity.Property(e => e.ProrationMethod).IsRequired().HasMaxLength(30);
            entity.Property(e => e.ProrationFactor).IsRequired().HasPrecision(18,10);
            entity.Property(e => e.PeriodTaxAmount).HasPrecision(18,2);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionRVCalculationTaxDetails_ProrationMethod", "[ProrationMethod] IN ('NO_PRORATION','DAY_WISE','MONTH_WISE','FULL_YEAR', 'FROM_EFFECTIVE_MONTH','FROM_NEXT_MONTH')"));
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionRVCalculationTaxDetails_ProrationFactor", "[ProrationFactor] >= 0 AND [ProrationFactor] <= 1"));
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionRVCalculationTaxDetails_Days", " ([PeriodDays] IS NULL OR [PeriodDays] > 0) AND ([YearDays] IS NULL OR [YearDays] > 0) AND ([PeriodDays] IS NULL OR [YearDays] IS NULL OR [PeriodDays] <= [YearDays]) "));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionRVCalculationResultsEntity>().WithMany().HasForeignKey(e => new { e.RevisionRVCalculationResultsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPropertyTaxCalculationCVResultsEntity>(entity =>
        {
            entity.ToTable("RevisionPropertyTaxCalculationCVResults", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.RevisionPropertyDetailsId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.RateCVMasterId).IsRequired();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.CapitalValue).HasColumnType("money");
            entity.Property(e => e.TaxPercentage).HasColumnType("money");
            entity.Property(e => e.TaxAmount).HasColumnType("money");
            entity.Property(e => e.CVInputHash).HasMaxLength(100);
            entity.Property(e => e.ProrationMethod).IsRequired().HasMaxLength(30);
            entity.Property(e => e.ProrationFactor).IsRequired().HasPrecision(18,10);
            entity.Property(e => e.PeriodCapitalValue).HasPrecision(18,2);
            entity.Property(e => e.PeriodTaxAmount).HasPrecision(18,2);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionCVResults_ProrationMethod", "[ProrationMethod] IN ('NO_PRORATION','DAY_WISE','MONTH_WISE','FULL_YEAR', 'FROM_EFFECTIVE_MONTH','FROM_NEXT_MONTH')"));
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionCVResults_ProrationFactor", "[ProrationFactor] >= 0 AND [ProrationFactor] <= 1"));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPropertyDetailsEntity>().WithMany().HasForeignKey(e => new { e.RevisionPropertyDetailsId, e.RevisionMastId }).HasPrincipalKey(p => new { p.Id, p.RevisionMastId }).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPolicyTaxDetailsEntity>(entity =>
        {
            entity.ToTable("RevisionPolicyTaxDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.PolicyCodeId).IsRequired();
            entity.Property(e => e.AnnualCalculationValue).HasColumnType("money");
            entity.Property(e => e.CalculationValue).HasColumnType("money");
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.AnnualTaxAmount).HasColumnType("money");
            entity.Property(e => e.TaxAmount).HasColumnType("money");
            entity.Property(e => e.IsCurrent).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionPolicyTaxDetailsCVEntity>(entity =>
        {
            entity.ToTable("RevisionPolicyTaxDetailsCV", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.PolicyCodeId).IsRequired();
            entity.Property(e => e.AnnualCalculationValue).HasColumnType("money");
            entity.Property(e => e.CalculationValue).HasColumnType("money");
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.AnnualTaxAmount).HasColumnType("money");
            entity.Property(e => e.TaxAmount).HasColumnType("money");
            entity.Property(e => e.IsCurrent).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionTransMastEntity>(entity =>
        {
            entity.ToTable("RevisionTransMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.FinanceYearId).IsRequired();
            entity.Property(e => e.CalculationType).IsRequired().HasMaxLength(2).IsFixedLength();
            entity.Property(e => e.PolicyCodeId).IsRequired();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.CalculationAnnualValue).HasPrecision(18, 2);
            entity.Property(e => e.CalculationValue).IsRequired().HasPrecision(18, 2);
            entity.Property(e => e.TaxAmount).IsRequired().HasPrecision(18, 2);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.ToTable(x => x.HasCheckConstraint("CK_RevisionTransMast_CalculationType", "[CalculationType] IN ('RV','CV')"));
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionApplyTaxesMasterEntity>(entity =>
        {
            entity.ToTable("RevisionApplyTaxesMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RevisionMastId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasOne<RevisionMastEntity>().WithMany().HasForeignKey(e => e.RevisionMastId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<RevisionPeriodEntity>().WithMany().HasForeignKey(e => e.RevisionPeriodId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PortalContentEntity>(entity =>
        {
            entity.ToTable("PortalContent", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ContentType).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IconName).HasMaxLength(100);
            entity.Property(e => e.Badge).HasMaxLength(30);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.TitleLocal).HasMaxLength(200);
            entity.Property(e => e.DescriptionLocal).HasMaxLength(500);
            entity.Property(e => e.ReferenceLink).HasMaxLength(100);
            entity.Property(e => e.Category).HasMaxLength(50);

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .IsRequired(false)
                .HasConstraintName("FK_PortalContent_DepartmentMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CitizenServiceEntity>(entity =>
        {
            entity.ToTable("CitizenServices", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IconName).HasMaxLength(30);
            entity.Property(e => e.Badge).HasMaxLength(10);
            entity.Property(e => e.Description).HasMaxLength(100);
            entity.Property(e => e.TitleLocal).HasMaxLength(50);
            entity.Property(e => e.DescriptionLocal).HasMaxLength(100);
            entity.Property(e => e.ReferenceLink).HasMaxLength(100);
            entity.Property(e => e.Category).HasMaxLength(50);

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .HasConstraintName("FK_CitizenServices_DepartmentMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ConnectionTypeMasterEntity>(entity =>
        {
            entity.ToTable("ConnectionTypeMaster", "WTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ConnectionTypeCode).IsRequired().HasMaxLength(30);
            entity.HasIndex(e => e.ConnectionTypeCode).IsUnique();
            entity.Property(e => e.ConnectionType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2(0)");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2(0)");
        });

        modelBuilder.Entity<TariffMasterEntity>(entity =>
        {
            entity.ToTable("TariffMaster", "WTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                  .HasColumnType("bigint")
                  .ValueGeneratedOnAdd();
            entity.Property(e => e.TariffCode).IsRequired().HasMaxLength(60);
            entity.HasIndex(e => e.TariffCode).IsUnique();
            entity.Property(e => e.TariffName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.YearId).IsRequired();
            entity.Property(e => e.ConnectionTypeId).IsRequired();
            entity.Property(e => e.ConnectionCategoryId).IsRequired();
            entity.Property(e => e.TapSizeId).IsRequired();
            entity.Property(e => e.EffectiveFrom).HasColumnType("date");
            entity.Property(e => e.EffectiveTo).HasColumnType("date");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2(0)");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2(0)");

            entity.HasOne(e => e.Year)
                .WithMany()
                .HasForeignKey(e => e.YearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ConnectionType)
                .WithMany()
                .HasForeignKey(e => e.ConnectionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ConnectionCategory)
                .WithMany()
                .HasForeignKey(e => e.ConnectionCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TapSize)
                .WithMany()
                .HasForeignKey(e => e.TapSizeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TariffSlabDetailEntity>(entity =>
        {
            entity.ToTable("TariffSlabDetail", "WTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                  .HasColumnType("bigint")
                  .ValueGeneratedOnAdd();
            entity.Property(e => e.TariffId)
                  .HasColumnType("bigint")
                  .IsRequired();
            entity.Property(e => e.FromUnit).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.ToUnit).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.UnitRate).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.FixedCharge).HasColumnType("decimal(19, 4)").IsRequired().HasDefaultValue(0m);
            entity.Property(e => e.MinimumCharge).HasColumnType("decimal(19, 4)").IsRequired().HasDefaultValue(0m);
            entity.Property(e => e.MaximumCharge).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.PerConnectionAmount).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.FormulaCode).HasMaxLength(50);
            entity.Property(e => e.SortOrder).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2(0)");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2(0)");

            entity.HasOne(e => e.Tariff)
                .WithMany(t => t.Slabs)
                .HasForeignKey(e => e.TariffId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.GeographyUnit)
                .WithMany()
                .HasForeignKey(e => e.GeographyUnitId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.TariffId, e.SortOrder });
            entity.HasIndex(e => new { e.TariffId, e.GeographyUnitId, e.SortOrder })
                  .IsUnique()
                  .HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<TariffChargeDetailEntity>(entity =>
        {
            entity.ToTable("TariffChargeDetail", "WTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                  .HasColumnType("bigint")
                  .ValueGeneratedOnAdd();
            entity.Property(e => e.TariffId)
                  .HasColumnType("bigint")
                  .IsRequired();
            entity.Property(e => e.Amount).HasColumnType("decimal(19,4)").IsRequired();
            entity.Property(e => e.IsDynamic).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsMandatory).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.SequenceNo).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2(0)");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2(0)");

            entity.HasOne(e => e.Tariff)
                .WithMany()
                .HasForeignKey(e => e.TariffId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ChargeHead)
                .WithMany()
                .HasForeignKey(e => e.ChargeHeadId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.GeographyUnit)
                .WithMany()
                .HasForeignKey(e => e.GeographyUnitId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.TariffId, e.ChargeHeadId, e.GeographyUnitId })
                  .IsUnique()
                  .HasFilter("[IsActive] = 1");

            entity.HasIndex(e => new { e.TariffId, e.GeographyUnitId, e.SequenceNo })
                  .IsUnique()
                  .HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<ConnectionCategoryMasterEntity>(entity =>
        {
            entity.ToTable("ConnectionCategoryMaster", "WTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ConnectionCategoryCode).IsRequired().HasMaxLength(30);
            entity.HasIndex(e => e.ConnectionCategoryCode).IsUnique();
            entity.Property(e => e.ConnectionCategory).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ConnectionCategory).IsRequired().HasMaxLength(150);
            entity.Property(e => e.IsMetered).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.BillingMethod).IsRequired().HasMaxLength(30).HasDefaultValue("Metered");
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2(0)");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2(0)");

            entity.HasOne(e => e.BillingFrequency)
                .WithMany()
                .HasForeignKey(e => e.BillingFrequencyId)
                .HasConstraintName("FK_ConnectionCategoryMaster_BillingFrequencyMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChargeHeadMasterEntity>(entity =>
        {
            entity.ToTable("ChargeHeadMaster", "WTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasColumnName("ChargeHeadCode").IsRequired().HasMaxLength(40);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Name).HasColumnName("ChargeHeadName").IsRequired().HasMaxLength(150);
            entity.Property(e => e.ChargeHeadNameLocal).HasMaxLength(150);
            entity.Property(e => e.ChargeType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IsRefundable).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.SequenceNo).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsRegularPay).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
        });

        modelBuilder.Entity<TapSizeMasterEntity>(entity =>
        {
            entity.ToTable("TapSizeMaster", "WTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TapSizeCode).IsRequired().HasMaxLength(30);
            entity.HasIndex(e => e.TapSizeCode).IsUnique();
            entity.Property(e => e.TapSize).IsRequired().HasMaxLength(100);
            entity.Property(e => e.NominalSizeValue).HasColumnType("decimal(10,3)");
            entity.Property(e => e.SizeUnit).HasMaxLength(20);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2(0)");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2(0)");
        });

        modelBuilder.HasDbFunction(
            typeof(SqlDbFunctions).GetMethod(
                nameof(SqlDbFunctions.PatIndex),
                [typeof(string), typeof(string)])!)
            .HasName("PATINDEX")
            .IsBuiltIn(true);

        modelBuilder.Entity<PolicyTaxDetailsEntity>(entity =>
        {
            entity.ToTable("PolicyTaxDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.PolicyCodeId).IsRequired();
            entity.Property(e => e.CalculationValue).HasColumnType("money");
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.TaxAmount).HasColumnType("money");
            entity.Property(e => e.IsCurrent).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            // Configure foreign key relationships
            entity.HasOne(e => e.TaxMaster)
                .WithMany(p => p.PolicyTaxDetails)
                .HasForeignKey(e => e.TaxId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.PolicyTaxDetails)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PolicyCodeMaster)
                .WithMany()
                .HasForeignKey(e => e.PolicyCodeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes match the DBA/lead/business-confirmed live DDL exactly. The names
            // "...PropertyYear" and "UX_..._Property_Year_PolicyCode_TaxId" are historical leftovers
            // from an earlier design -- neither index actually includes a Year column any more.
            entity.HasIndex(e => e.PropertyId).HasDatabaseName("IX_PolicyTaxDetails_PropertyId");
            entity.HasIndex(e => e.TaxId).HasDatabaseName("IX_PolicyTaxDetails_TaxId");
            entity.HasIndex(e => e.PropertyId)
                .HasDatabaseName("IX_PolicyTaxDetails_PropertyYear")
                .IncludeProperties(e => new { e.TaxId, e.TaxAmount, e.PolicyCodeId });
            entity.HasIndex(e => new { e.PropertyId, e.PolicyCodeId, e.TaxId })
                .IsUnique()
                .HasDatabaseName("UX_PolicyTaxDetails_Property_Year_PolicyCode_TaxId")
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");
        });

        modelBuilder.Entity<PolicyCodeMasterEntity>(entity =>
        {
            entity.ToTable("PolicyCodeMaster", "PTIS");
            entity.HasKey(e => e.Id).HasName("PK_PolicyCodeMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PolicyCode).IsRequired().HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.PolicyName).IsRequired().HasMaxLength(100).HasColumnType("nvarchar(100)");
            entity.Property(e => e.Description).HasMaxLength(300).HasColumnType("nvarchar(300)");
            entity.Property(e => e.PolicyType).IsRequired().HasMaxLength(20).HasColumnType("varchar(20)");
            entity.Property(e => e.IsFinalStage).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsExclusive).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.RequiresStageTracking).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsRetroDemand).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.NextPolicyCode)
                .WithMany()
                .HasForeignKey(e => e.NextPolicyCodeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasCheckConstraint("CK_PolicyCodeMaster_PolicyType", "[PolicyType] IN ('NORMAL', 'DATE_BASED', 'STAGE_BASED', 'DECISION')");
            entity.HasIndex(e => e.PolicyCode).IsUnique().HasDatabaseName("UQ_PolicyCodeMaster_PolicyCode");
        });


        // NatureFactorCVMaster configuration
        modelBuilder.Entity<NatureFactorCVMasterEntity>(entity =>
        {
            entity.ToTable("NatureFactorCVMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd(); // Identity column
            entity.Property(e => e.ConstructionTypeId).IsRequired();
            entity.Property(e => e.Factor)
                .IsRequired()
                .HasColumnType("decimal(18,2)");
            entity.Property(e => e.YearRangeCVId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.HasIndex(e => e.ConstructionTypeId);
            entity.HasIndex(e => e.YearRangeCVId);
            entity.HasIndex(e => e.IsActive);
            // Uniqueness constraint for ConstructionTypeId + YearRangeCVId
            entity.HasIndex(e => new { e.ConstructionTypeId, e.YearRangeCVId }).IsUnique();

            entity.HasOne(e => e.ConstructionType)
             .WithMany(c => c.NatureFactorCVMaster)
             .HasForeignKey(e => e.ConstructionTypeId)
             .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YearRangeCV)
           .WithMany(c => c.NatureFactorCVMaster)
           .HasForeignKey(e => e.YearRangeCVId)
           .OnDelete(DeleteBehavior.Restrict);
        });


        // ParkingTypeMaster configuration
        modelBuilder.Entity<ParkingTypeMasterEntity>(entity =>
        {
            entity.ToTable("ParkingTypeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd(); // Identity column
            entity.Property(e => e.TypeOfUseId).IsRequired();
            // Add other property configurations as needed
            entity.HasIndex(e => e.TypeOfUseId);

            entity.HasOne(e => e.TypeOfUse)
            .WithMany(c => c.ParkingTypeMaster)
            .HasForeignKey(e => e.TypeOfUseId)
            .OnDelete(DeleteBehavior.Restrict);
        });

        // BuildingPlanType configuration
        modelBuilder.Entity<BuildingPlanTypeEntity>(entity =>
        {
            entity.ToTable("BuildingPlanType", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.WardId).IsRequired();
            entity.Property(e => e.PropertyNo).HasMaxLength(10);
            entity.Property(e => e.Type).HasMaxLength(5);
            entity.Property(e => e.DocumentBindingId);

            // PTIS.BuildingPlanType has no MarkedForDeletionDate column.
            entity.Ignore(e => e.MarkedForDeletionDate);
        });

        modelBuilder.Entity<ConstructionTypeEntity>(entity =>
        {
            entity.ToTable("ConstructionTypeMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DescriptionEnglish).HasColumnName("DescriptionEnglish");
            entity.Property(e => e.ConstructionCode);
            entity.Property(e => e.Description);
            entity.Property(e => e.SearchSequence);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Configure relationships
            entity.HasMany(e => e.Rates)
                .WithOne(r => r.ConstructionType)
                .HasForeignKey(r => r.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.NatureFactorCVMaster)
                .WithOne(n => n.ConstructionType)
                .HasForeignKey(n => n.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.AgeFactorCVMaster)
                .WithOne(a => a.ConstructionType)
                .HasForeignKey(a => a.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.PropertyDetails)
                .WithOne(p => p.ConstructionType)
                .HasForeignKey(p => p.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.DepreciationMaster)
                .WithOne(d => d.ConstructionType)
                .HasForeignKey(d => d.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FloorEntity>(entity =>
        {
            entity.ToTable("FloorMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FloorCode);
            entity.Property(e => e.Description);
            entity.Property(e => e.DescriptionEnglish).HasMaxLength(100);
            entity.Property(e => e.SequenceNo);
            entity.Property(e => e.MaxFloorNo);
            entity.Property(e => e.FloorGroupId).HasColumnName("FloorGroupId");
            entity.Property(e => e.FLatGenerationGroupId).HasColumnName("FLatGenerationGroupId").HasDefaultValue(1);
            entity.Property(e => e.FLatGenerationSeq).HasColumnName("FLatGenerationSeq").HasDefaultValue(1);
            entity.HasIndex(e => new { e.FLatGenerationGroupId, e.FLatGenerationSeq })
                .IsUnique()
                .HasDatabaseName("UQ_FloorMaster_GroupId_Seq");

            // Configure relationships
            entity.HasMany(e => e.Rates)
                .WithOne(r => r.Floor)
                .HasForeignKey(r => r.FloorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.FloorFactorCVMaster)
                .WithOne(n => n.Floor)
                .HasForeignKey(n => n.FloorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.PropertyDetails)
                .WithOne(a => a.Floor)
                .HasForeignKey(a => a.FloorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FLatGenerationGroupMaster)
                .WithMany(g => g.Floors)
                .HasForeignKey(e => e.FLatGenerationGroupId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RateEntity>(entity =>
        {
            entity.ToTable("RateMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id);
            entity.Property(e => e.FloorId);
            entity.Property(e => e.Id);
            entity.Property(e => e.ConstructionTypeId);
            entity.Property(e => e.YearRangeRVId);
            entity.Property(e => e.RateSquareMeter).HasColumnType("decimal(18,2)");
            entity.Property(e => e.RateSquareFeet).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Id);
            entity.Property(e => e.RateRemark);
            entity.Property(e => e.IsActive);

            entity.HasOne(e => e.ConstructionType)
              .WithMany(c => c.Rates)
              .HasForeignKey(e => e.ConstructionTypeId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Floor)
              .WithMany(c => c.Rates)
              .HasForeignKey(e => e.FloorId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RateSection)
              .WithMany(c => c.Rates)
              .HasForeignKey(e => e.RateSectionId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TaxZone)
              .WithMany(c => c.Rates)
              .HasForeignKey(e => e.TaxZoneId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TypeOfUseGroup)
              .WithMany(c => c.Rates)
              .HasForeignKey(e => e.TypeOfUseGroupId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AssessmentYearRange)
            .WithMany(c => c.Rates)
            .HasForeignKey(e => e.YearRangeRVId)
            .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RetentionFactWiseEntity>(entity =>
        {
            entity.ToTable("RetentionPolicyFactorWiseMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FromFactor);
            entity.Property(e => e.ToFactor);
            entity.Property(e => e.FactorValue);
            entity.Property(e => e.IsActive);
        });

        modelBuilder.Entity<PropertyScreenLockEntity>(entity =>
        {
            entity.ToTable("PropertyScreenLock", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.LockableScreenId).IsRequired();
            entity.Property(e => e.IsLocked).IsRequired();  // Removed HasDefaultValue to ensure value is always sent
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.LockedDate).HasColumnType("datetime");
            entity.Property(e => e.UnlockedDate).HasColumnType("datetime");
            entity.Property(e => e.LockedBy);  // Explicitly configure
            entity.Property(e => e.UnlockedBy);  // Explicitly configure

            entity.HasIndex(e => new { e.PropertyId, e.LockableScreenId })
                .IsUnique()
                .HasDatabaseName("UQ_PropertyScreenLock_Property_Screen");
            entity.HasIndex(e => e.PropertyId).HasDatabaseName("IX_PropertyScreenLock_PropertyId");
            entity.HasIndex(e => e.LockableScreenId).HasDatabaseName("IX_PropertyScreenLock_LockableScreenId");

            entity.HasOne(e => e.Property)
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.LockableScreen)
                .WithMany()
                .HasForeignKey(e => e.LockableScreenId)
                .HasConstraintName("FK_PropertyScreenLock_ScreenMaster")
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
        });

        modelBuilder.Entity<RetentionYearWiseEntity>(entity =>
        {
            entity.ToTable("RetentionPolicyYearWiseMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FromYear);
            entity.Property(e => e.ToYear);
            entity.Property(e => e.FactorValue);
            entity.Property(e => e.IsActive);
        });
        modelBuilder.Entity<AssessmentYearRangeEntity>(entity =>
        {
            entity.ToTable("AssessmentYearRangeMasterRV", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FromYear);
            entity.Property(e => e.ToYear);
            entity.Property(e => e.IsActive);
            // Unique constraint for FromYear-ToYear pair
            entity.HasIndex(e => new { e.FromYear, e.ToYear }).IsUnique();

            // Configure relationships
            entity.HasMany(e => e.Rates)
                .WithOne(r => r.AssessmentYearRange)
                .HasForeignKey(r => r.YearRangeRVId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.TaxPercentageMasterRV)
             .WithOne(r => r.AssessmentYearRange)
              .HasForeignKey(r => r.YearRangeRVId)
             .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<AssessmentYearRangeCVEntity>(entity =>
        {
            entity.ToTable("AssessmentYearRangeMasterCV", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FromYear);
            entity.Property(e => e.ToYear);
            entity.Property(e => e.IsActive);
            entity.HasIndex(e => new { e.FromYear, e.ToYear }).IsUnique();

            // Configure relationships
            entity.HasMany(e => e.FloorFactorCVMaster)
                .WithOne(r => r.YearRangeCV)
                .HasForeignKey(r => r.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.UseFactorCVMaster)
            .WithOne(r => r.YearRangeCV)
            .HasForeignKey(r => r.YearRangeCVId)
            .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.AgeFactorCVMaster)
             .WithOne(r => r.YearRangeCV)
               .HasForeignKey(r => r.YearRangeCVId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.NatureFactorCVMaster)
                .WithOne(r => r.YearRangeCV)
                .HasForeignKey(r => r.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.RateMasterForCV)
              .WithOne(r => r.AssessmentYearRange)
               .HasForeignKey(r => r.AssessmentYearRangeId)
               .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.TaxPercentageMasterCV)
             .WithOne(r => r.AssessmentYearRangeCV)
             .HasForeignKey(r => r.YearRangeCVId)
              .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<SubFloorEntity>(entity =>
        {
            entity.ToTable("SubFloorMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SubFloorCode);
            entity.Property(e => e.Description);
            entity.Property(e => e.DescriptionEnglish).HasMaxLength(100);
            entity.Property(e => e.SubFloorPercentage);
            entity.Ignore(e => e.SequenceNo);
            // Configure relationships
            entity.HasMany(e => e.PropertyDetails)
                .WithOne(r => r.SubFloor)
                .HasForeignKey(r => r.SubFloorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<WardEntity>(entity =>
        {
            entity.ToTable("WardMaster", "PTIS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).ValueGeneratedOnAdd();
            entity.Property(x => x.WardNo).IsRequired().HasMaxLength(10);
            entity.Property(x => x.ZoneId).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(50);
            entity.Property(x => x.SequenceNo);
            entity.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(x => x.WardNo).IsUnique();

            entity.HasOne(e => e.Zone)
              .WithMany(c => c.Ward)
              .HasForeignKey(e => e.ZoneId)
              .OnDelete(DeleteBehavior.Restrict);

            // Configure relationships
            entity.HasMany(e => e.BlockMaster)
                .WithOne(r => r.Ward)
                .HasForeignKey(r => r.WardId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.RateSectionDetails)
                .WithOne(n => n.Ward)
                .HasForeignKey(n => n.WardId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Property)
                .WithOne(a => a.Ward)
                .HasForeignKey(a => a.WardId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OldWardMasterEntity>(entity =>
        {
            entity.ToTable("OldWardMaster", "PTIS");
            entity.HasKey(x => x.Id).HasName("PK_OldWardMaster");
            entity.Property(x => x.Id).ValueGeneratedOnAdd();
            entity.Property(x => x.OldWardNo).IsRequired().HasMaxLength(20);
            entity.Property(x => x.Description).IsRequired().HasMaxLength(100);
            entity.Property(x => x.OldZoneId).IsRequired();
            entity.Property(x => x.SequenceNo);
            entity.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(x => x.CreatedDate).IsRequired().HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(x => x.OldWardNo).IsUnique().HasDatabaseName("UQ_OldWardMaster_OldWardNo");
            entity.HasIndex(x => x.Description).IsUnique().HasDatabaseName("UQ_OldWardMaster_Description");

            entity.HasOne(x => x.OldZone)
                .WithMany()
                .HasForeignKey(x => x.OldZoneId)
                .HasPrincipalKey(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OldWardWiseRateEntity>(entity =>
        {
            entity.HasOne(x => x.OldWard).WithMany().HasForeignKey(x => x.OldWardId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // OldZoneMaster configuration
        modelBuilder.Entity<OldZoneMasterEntity>(entity =>
        {
            entity.ToTable("OldZoneMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.OldZoneNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).IsRequired().HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.HasIndex(e => e.Description).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });

        // TaxZoningRange configuration
        modelBuilder.Entity<TaxZoningRangeEntity>(entity =>
        {
            entity.ToTable("TaxZoningRange", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.WardId).IsRequired();
            entity.Property(e => e.TaxZoneId).IsRequired();
            entity.Property(e => e.FromPropertyNo).HasMaxLength(10);
            entity.Property(e => e.ToPropertyNo).HasMaxLength(10);
            entity.Property(e => e.AssignEntireWard).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ZoneDescription).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.Ward)
                .WithMany()
                .HasForeignKey(e => e.WardId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TaxZone)
                .WithMany()
                .HasForeignKey(e => e.TaxZoneId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.WardId)
                .HasDatabaseName("IX_TaxZoningRange_Ward")
                .HasFilter("[MarkedForDeletion] = 0");

            entity.HasIndex(e => new { e.WardId, e.TaxZoneId })
                .HasDatabaseName("IX_TaxZoningRange_WardZone")
                .HasFilter("[MarkedForDeletion] = 0");
        });

        // ULBDocumentType configuration
        modelBuilder.Entity<ULBDocumentTypeEntity>(entity =>
        {
            entity.ToTable("ULBDocumentType", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentTypeCode).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DocumentTypeName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasIndex(e => e.DocumentTypeCode)
                .IsUnique()
                .HasDatabaseName("UQ_ULBDocumentType_DocumentTypeCode");
        });

        // ULBDocument configuration
        modelBuilder.Entity<ULBDocumentEntity>(entity =>
        {
            entity.ToTable("ULBDocument", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ULBDocumentTypeId).IsRequired();
            entity.Property(e => e.DocumentBindingId);
            entity.Property(e => e.DocumentTitle).HasMaxLength(250);
            entity.Property(e => e.Remark).HasMaxLength(500);
            entity.Property(e => e.IsLatest).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.ULBDocumentType)
                .WithMany()
                .HasForeignKey(e => e.ULBDocumentTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DocumentBinding)
                .WithMany()
                .HasForeignKey(e => e.DocumentBindingId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.ULBDocumentTypeId)
                .HasDatabaseName("IX_ULBDocument_ULBDocumentTypeId");

            entity.HasIndex(e => e.IsLatest)
                .HasDatabaseName("IX_ULBDocument_IsLatest")
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");
        });

        // AliasMaster configuration
        modelBuilder.Entity<AliasMasterEntity>(entity =>
        {
            entity.ToTable("AliasMaster", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.KeyName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.LabelName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.EnglishName).HasMaxLength(200);
            entity.Property(e => e.RegionalName).HasMaxLength(200);
            entity.Property(e => e.HindiName).HasMaxLength(200);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasIndex(e => e.KeyName)
                .IsUnique()
                .HasDatabaseName("UQ_AliasMaster_KeyName");
        });

        modelBuilder.Entity<SubTypeOfUseEntity>(entity =>
        {
            entity.ToTable("SubTypeOfUseMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Description);
            entity.Property(x => x.TypeOfUseId);
            entity.Property(x => x.SearchSequence);
            entity.Property(x => x.TypeOfUseCategoryId);
            entity.Property(x => x.IsActive);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate);
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate);

            entity.HasOne(e => e.TypeOfUse)
              .WithMany(c => c.SubTypeOfUse)
              .HasForeignKey(e => e.TypeOfUseId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TypeOfUseCategory)
              .WithMany(c => c.SubTypeOfUse)
              .HasForeignKey(e => e.TypeOfUseCategoryId)
              .OnDelete(DeleteBehavior.Restrict);

            // Configure relationships
            entity.HasMany(e => e.PropertyDetails)
                  .WithOne(r => r.SubTypeOfUse)
                  .HasForeignKey(r => r.SubTypeOfUseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.UseFactorCVMaster)
                  .WithOne(r => r.SubTypeOfUse)
                  .HasForeignKey(r => r.SubTypeOfUseId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<TypeOfUseEntity>(entity =>
        {
            entity.ToTable("TypeOfUseMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TypeOfUseCode);
            entity.Property(x => x.Description);
            entity.Property(x => x.Type);
            entity.Property(x => x.TypeOfUseGroupId);
            entity.Property(x => x.TypeOfUseGroupCVId);
            entity.Property(x => x.SearchSequence);
            entity.Property(x => x.TypeOfUseCategoryId);
            entity.Property(x => x.StateEduTaxApplicable).HasColumnName("StateEduTaxApplicable");
            entity.Property(x => x.StateEmpTaxApplicable).HasColumnName("StateEmpTaxApplicable");
            entity.Property(x => x.IsActive);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.CreatedDate);
            entity.Property(x => x.UpdatedDate);
            entity.HasOne(e => e.TypeOfUseGroup)
            .WithMany(p => p.TypeOfUse)
            .HasForeignKey(e => e.TypeOfUseGroupId)
            .HasPrincipalKey(e => e.Id);

            entity.HasOne(e => e.TypeOfUseGroupCV)
           .WithMany(p => p.TypeOfUse)
           .HasForeignKey(e => e.TypeOfUseGroupCVId)
           .HasPrincipalKey(e => e.Id);

            entity.HasOne(e => e.TypeOfUseCategory)
           .WithMany(c => c.TypeOfUse)
           .HasForeignKey(e => e.TypeOfUseCategoryId)
           .OnDelete(DeleteBehavior.Restrict);

            // Configure relationships
            entity.HasMany(e => e.PropertyDetails)
                .WithOne(r => r.TypeOfUse)
                .HasForeignKey(r => r.TypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.UseFactorCVMaster)
                .WithOne(r => r.TypeOfUse)
                .HasForeignKey(r => r.TypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.ParkingTypeMaster)
                .WithOne(r => r.TypeOfUse)
                .HasForeignKey(r => r.TypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.TaxPercentageMasterCV)
                .WithOne(r => r.TypeOfUse)
                .HasForeignKey(r => r.TypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.PropertyDescriptionAndTypeOfUseValidation)
                 .WithOne(r => r.TypeOfUse)
                 .HasForeignKey(r => r.TypeOfUseId)
                 .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.SubTypeOfUse)
                .WithOne(r => r.TypeOfUse)
                .HasForeignKey(r => r.TypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.TaxPercentageMasterRV)
             .WithOne(r => r.TypeOfUse)
             .HasForeignKey(r => r.TypeOfUseId)
             .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<TypeOfUseCategoryEntity>(entity =>
        {
            entity.ToTable("TypeOfUseCategoryMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TypeOfUseCategoryCode);
            entity.Property(x => x.TypeOfUseCategoryName);
            entity.Property(x => x.IsActive);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate);
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate);
        });
        modelBuilder.Entity<TypeOfUseGroupEntity>(entity =>
        {
            entity.ToTable("TypeOfUseGroupMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TypeOfUseGroupCode);
            entity.Property(x => x.GroupName);
            entity.Property(x => x.GroupIcon);
            entity.Property(x => x.IsOpenPlot);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate);
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate);
            entity.Property(x => x.IsActive);

            // Configure relationships
            entity.HasMany(e => e.Rates)
                .WithOne(r => r.TypeOfUseGroup)
                .HasForeignKey(r => r.TypeOfUseGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.TypeOfUse)
                .WithOne(n => n.TypeOfUseGroup)
                .HasForeignKey(n => n.TypeOfUseGroupId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ZoneEntity>(entity =>
        {
            entity.ToTable("ZoneMaster", "PTIS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).ValueGeneratedOnAdd();
            entity.Property(x => x.Description).IsRequired().HasMaxLength(100);
            entity.Property(x => x.DescriptionEnglish).HasMaxLength(100);
            entity.Property(x => x.ZoneNo);
            entity.Property(x => x.SequenceNo);
            entity.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);

            // Configure relationships
            entity.HasMany(e => e.Ward)
                .WithOne(r => r.Zone)
                .HasForeignKey(r => r.ZoneId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // MultilingualResource configuration 
        modelBuilder.Entity<MultilingualResourceEntity>(b =>
        {
            b.ToTable("MultilingualResource", "CORE");
            b.HasKey(x => x.Id);

            b.Property(x => x.Resource).HasColumnName("Resource").HasMaxLength(256).IsRequired();
            b.Property(x => x.Key).HasMaxLength(256).IsRequired();

            b.Property(x => x.en_US).IsRequired();
            b.Property(x => x.hi_IN).IsRequired();
            b.Property(x => x.mr_IN).IsRequired();

            b.Property(x => x.IsActive).IsRequired();
            // Unique constraint on Resource + Key combination
            // Prevents duplicate entries and ensures deterministic lookups
            b.HasIndex(x => new { x.Resource, x.Key })
                .IsUnique();
        });
        modelBuilder.Entity<RateMasterForCVEntity>(entity =>
        {
            entity.ToTable("RateCVMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id);
            entity.Property(e => e.SubZoneId);
            entity.Property(e => e.TypeOfUseGroupCVId);
            entity.Property(e => e.FloorGroupId);
            entity.Property(e => e.RateAmount);
            entity.Property(e => e.AssessmentYearRangeId);
            entity.Property(e => e.IsActive);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()").IsRequired();
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasOne(e => e.FloorGroup).WithMany().HasForeignKey(e => e.FloorGroupId).HasConstraintName("FK_RateCVMaster_FloorGroupMaster");
        });


        modelBuilder.Entity<DepreciationMasterEntity>(entity =>
        {
            entity.ToTable("DepreciationMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ConstructionTypeId).HasMaxLength(7);
            entity.Property(e => e.MinYear);
            entity.Property(e => e.MaxYear);
            entity.Property(e => e.Rate).HasColumnType("money");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(e => e.ConstructionType)
              .WithMany(c => c.DepreciationMaster)
              .HasForeignKey(e => e.ConstructionTypeId)
             .OnDelete(DeleteBehavior.Restrict);
        });
        // TaxZone configuration
        modelBuilder.Entity<TaxZoneEntity>(entity =>
        {
            entity.ToTable("TaxZoneMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaxZoneNo).IsRequired().HasMaxLength(10);
            entity.Property(e => e.TaxZoneType).HasMaxLength(50);
            entity.Property(e => e.Remark).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.TaxZoneNo).IsUnique().HasDatabaseName("UQ_TaxZoneMaster_TaxZoneNo");

            entity.HasMany(e => e.Rates)
              .WithOne(r => r.TaxZone)
               .HasForeignKey(r => r.TaxZoneId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Property)
                .WithOne(n => n.TaxZone)
                .HasForeignKey(n => n.TaxZoneId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TaxPercentageMasterRV configuration
        modelBuilder.Entity<TaxPercentageMasterRVEntity>(entity =>
        {
            entity.ToTable("TaxPercentageMasterRV", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.YearRangeRVId).IsRequired();
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.BaseType).IsRequired().HasMaxLength(10).HasDefaultValue("RV");
            entity.HasIndex(e => e.YearRangeRVId);
            entity.HasIndex(e => e.TypeOfUseId);
            // Matches an index that already exists on long-lived databases (verified via
            // sys.indexes) but was never declared here — TaxId as the leading column also
            // serves plain WHERE TaxId = @t reads (ValueBasedTaxService, the register's config
            // overview) via an index seek, not just the (TaxId, TypeOfUseId, YearRangeRVId)
            // uniqueness this was originally added to enforce.
            entity.HasIndex(e => new { e.TaxId, e.TypeOfUseId, e.YearRangeRVId })
                  .IsUnique()
                  .HasDatabaseName("UQ_TaxPercentageMasterRV_TaxId_TypeOfUseId_YearRangeRVId");

            entity.HasOne(e => e.TypeOfUse)
             .WithMany(c => c.TaxPercentageMasterRV)
             .HasForeignKey(e => e.TypeOfUseId)
             .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AssessmentYearRange)
             .WithMany(c => c.TaxPercentageMasterRV)
             .HasForeignKey(e => e.YearRangeRVId)
             .OnDelete(DeleteBehavior.Restrict);

        });

        // UserRoleMaster configuration
        modelBuilder.Entity<UserRoleMasterEntity>(entity =>
        {
            entity.ToTable("UserRoleMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserRoleName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.UserRoleName).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });


        modelBuilder.Entity<MoujaEntity>(entity =>
        {
            entity.ToTable("MoujaMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MoujaNo).IsRequired().HasMaxLength(20);
            entity.Property(e => e.MoujaName).IsRequired().HasMaxLength(100);
            // Configure relationships
            entity.HasMany(e => e.Property)
                .WithOne(r => r.Mouja)
                .HasForeignKey(r => r.MoujaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.CSNDetails)
               .WithOne(r => r.Mouja)
               .HasForeignKey(r => r.MoujaId)
               .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.SubZoneDetails)
                .WithOne(n => n.Mouja)
                .HasForeignKey(n => n.MoujaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.MoujaNo).IsUnique().HasDatabaseName("UQ_MoujaMaster_MoujaNo");
            entity.HasIndex(e => e.MoujaName).IsUnique().HasDatabaseName("UQ_MoujaMaster_MoujaName");
        });

        modelBuilder.Entity<SubZoneDetailsForCVEntity>(entity =>
        {
            entity.ToTable("SubZoneDetailsForCV", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MoujaId).IsRequired();
            entity.Property(e => e.SubZoneNo).IsRequired().HasMaxLength(20);
            entity.Property(e => e.SubZoneName).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).IsRequired().HasDefaultValueSql("getdate()");

            // Unique constraint on MoujaId + SubZoneNo
            entity.HasIndex(e => new { e.MoujaId, e.SubZoneNo })
                .IsUnique()
                .HasDatabaseName("UQ_SubZoneDetailsForCV_Mouja_SubZoneNo");
        });

        modelBuilder.Entity<BankMasterEntity>(entity =>
        {
            entity.ToTable("BankMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BankCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.BankName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.BranchName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IFSCCode).IsRequired().HasMaxLength(11);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.State).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Pincode).IsRequired().HasMaxLength(6);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.BankCode).IsUnique();
            entity.HasIndex(e => e.IFSCCode).IsUnique();
            entity.HasIndex(e => e.BankName);
            entity.HasIndex(e => e.IsActive);
        });

        // PropertyRuleEvaluationMaster configuration
        modelBuilder.Entity<PropertyRuleEvaluationMasterEntity>(entity =>
        {
            entity.ToTable("PropertyRuleEvaluationMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ParameterCode).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ParameterName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.ParameterCode).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<PolicyConfigurationEntity>(entity =>
        {
            entity.ToTable("PolicyConfiguration", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PolicyCode).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.PolicyCode).IsUnique();
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DataType).IsRequired().HasMaxLength(20).HasDefaultValue("bit");
            entity.Property(e => e.PolicyValue).HasMaxLength(500);
            entity.Property(e => e.DefaultValue).HasMaxLength(500);
            entity.Property(e => e.AllowedValues).HasMaxLength(500);
            entity.Property(e => e.Unit).HasMaxLength(30);
            entity.Property(e => e.EffectiveFrom);
            entity.Property(e => e.EffectiveTo);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
        });

        modelBuilder.Entity<RoleWiseScreenAccessMasterEntity>(entity =>
        {
            entity.ToTable("RoleWiseScreenAccessMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserRoleId).IsRequired();
            entity.Property(e => e.ScreenId).IsRequired();
            entity.Property(e => e.CanView).IsRequired();
            entity.Property(e => e.CanEdit).IsRequired();
            entity.Property(e => e.CanDelete).IsRequired();
            entity.Property(e => e.HaveFullAccess).IsRequired();
            entity.Property(e => e.HaveNoAccess).IsRequired();
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // Foreign key relationships
            entity.HasOne(e => e.UserRole)
                  .WithMany()
                  .HasForeignKey(e => e.UserRoleId)
                  .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            entity.HasOne(e => e.Screen)
                  .WithMany()
                  .HasForeignKey(e => e.ScreenId)
                  .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            // Unique constraint on UserRoleId + ScreenId combination (filtered for active records only)
            // This allows re-creating a role-screen access after it was soft-deleted
            entity.HasIndex(e => new { e.UserRoleId, e.ScreenId })
                  .IsUnique()
                  .HasFilter("[IsActive] = 1")
                  .HasDatabaseName("UX_RoleWiseScreenAccess_UserRole_Screen_Active");

            // Optimized filtered indexes for query performance
            entity.HasIndex(e => new { e.UserRoleId, e.IsActive })
                  .HasFilter("[IsActive] = 1")
                  .HasDatabaseName("IX_RoleWiseScreenAccess_UserRole_Active");

            entity.HasIndex(e => new { e.ScreenId, e.IsActive })
                  .HasFilter("[IsActive] = 1")
                  .HasDatabaseName("IX_RoleWiseScreenAccess_Screen_Active");
        });

        modelBuilder.Entity<YearMasterEntity>(entity =>
        {
            entity.ToTable("YearMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Year).IsRequired();
            entity.Property(e => e.YearCode).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(250);
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.StartDate);
            entity.Property(e => e.EndDate);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.YearCode).IsUnique();
        });

        modelBuilder.Entity<OfficeEntity>(entity =>
        {
            entity.ToTable("OfficeMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OfficeCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.OfficeName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Pincode).IsRequired().HasMaxLength(6);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.EmailId).HasMaxLength(200);
            entity.Property(e => e.OfficeIncharge);
            entity.Property(e => e.DesignationMasterId);
            entity.Property(e => e.EstablishedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.OfficeCode).IsUnique();
            entity.HasIndex(e => e.OfficeName);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<RateSectionEntity>(entity =>
        {
            entity.ToTable("RateSectionMaster", "PTIS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Description);

            entity.HasMany(e => e.Rates)
               .WithOne(r => r.RateSection)
               .HasForeignKey(r => r.RateSectionId)
               .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.RateSectionDetails)
                .WithOne(n => n.RateSection)
                .HasForeignKey(n => n.RateSectionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RateSectionDetailsEntity>(entity =>
        {
            entity.ToTable("RateSectionDetails", "PTIS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RateSectionId);
            entity.Property(x => x.Id);
            entity.Property(x => x.IsActive);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate);
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate);
            entity.Property(x => x.IsActive);

            entity.HasOne(e => e.Ward)
              .WithMany(c => c.RateSectionDetails)
              .HasForeignKey(e => e.WardId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RateSection)
              .WithMany(c => c.RateSectionDetails)
              .HasForeignKey(e => e.RateSectionId)
               .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<ScreenMasterEntity>(entity =>
        {
            entity.ToTable("ScreenMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.ScreenGroupId).HasColumnName("ScreenGroupId");
            entity.Property(e => e.ModuleId).HasColumnName("ModuleId");

            // Required unique properties
            entity.Property(e => e.ScreenCode)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(e => e.ScreenName)
                .IsRequired()
                .HasMaxLength(200);

            entity.HasOne(e => e.ScreenGroup)
                .WithMany()
                .HasForeignKey(e => e.ScreenGroupId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique constraints
            entity.HasIndex(e => e.ScreenCode)
                .IsUnique()
                .HasFilter("[ScreenCode] IS NOT NULL")
                .HasDatabaseName("IX_ScreenMaster_ScreenCode_Unique");
            entity.HasIndex(e => e.ScreenName)
                .IsUnique()
                .HasFilter("[ScreenName] IS NOT NULL")
                .HasDatabaseName("IX_ScreenMaster_ScreenName_Unique");
        });


        modelBuilder.Entity<ScreenGroupMasterEntity>(entity =>
        {
            entity.ToTable("ScreenGroupMaster", "Core");
            entity.HasKey(e => e.Id);

            // Required unique properties
            entity.Property(e => e.ScreenGroupCode)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(e => e.ScreenGroupName)
                .IsRequired()
                .HasMaxLength(200);

            // Unique constraints
            entity.HasIndex(e => e.ScreenGroupCode)
                .IsUnique()
                .HasDatabaseName("IX_ScreenGroupMaster_ScreenGroupCode_Unique");
            entity.HasIndex(e => e.ScreenGroupName)
                .IsUnique()
                .HasDatabaseName("IX_ScreenGroupMaster_ScreenGroupName_Unique");
        });
        modelBuilder.Entity<ModuleMasterEntity>(entity =>
        {
            entity.ToTable("ModuleMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                .IsRequired();
            entity.Property(e => e.ModuleCode)
                .HasMaxLength(50).IsRequired()
                .IsRequired();
            entity.Property(e => e.ModuleName)
                .HasMaxLength(200).IsRequired()
                .IsRequired();
            entity.Property(e => e.ModuleNameLocal).HasMaxLength(200);
            entity.Property(e => e.ModuleIcon).HasMaxLength(100);
            entity.Property(e => e.ModuleLabel).HasMaxLength(100);
            entity.Property(e => e.ModuleDescription).HasMaxLength(500);
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            // Configure relationship with DepartmentMaster
            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SourceTableEntity>(entity =>
        {
            entity.ToTable("SourceTable", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TableName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.TableAliasName).HasMaxLength(200);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => new { e.ModuleId, e.TableName })
                .IsUnique()
                .HasDatabaseName("UQ_SourceTable_ModuleId_TableName");

            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SourceTableDetailsEntity>(entity =>
        {
            entity.ToTable("SourceTableDetails", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FieldName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(200);
            entity.Property(e => e.ControlType).HasMaxLength(50);
            entity.Property(e => e.DataType).HasMaxLength(50);
            entity.Property(e => e.Placeholder).HasMaxLength(500);
            entity.Property(e => e.ValidationRegex).HasMaxLength(500);
            entity.Property(e => e.DefaultValue).HasMaxLength(500);
            entity.Property(e => e.BindApi).HasMaxLength(500);
            entity.Property(e => e.ApiResponse).HasMaxLength(500);
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.SequenceNo).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => new { e.SourceTableId, e.FieldName })
                .IsUnique()
                .HasDatabaseName("UQ_SourceTableDetails_SourceTableId_FieldName");

            entity.HasOne(e => e.SourceTable)
                .WithMany()
                .HasForeignKey(e => e.SourceTableId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DepartmentLicenceDetailsEntity>(entity =>
        {
            entity.ToTable("DepartmentLicenceDetails", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LicenceDuration).HasMaxLength(50);
            // Configure relationship with DepartmentMaster
            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DepartmentPortalConfigurationEntity>(entity =>
        {
            entity.ToTable("DepartmentPortalConfiguration", "Core", t =>
            {
                t.HasCheckConstraint("CK_DepartmentPortalConfiguration_ConfigJson", "ISJSON([ConfigJson]) = 1");
            });
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DepartmentId).IsRequired();
            entity.HasIndex(e => e.DepartmentId).IsUnique();
            entity.Property(e => e.ConfigJson).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.ConfigVersion).IsRequired().HasDefaultValue(1).IsConcurrencyToken();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .HasConstraintName("FK_DepartmentPortalConfiguration_DepartmentMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<DepartmentMasterEntity>(entity =>
        {
            entity.ToTable("DepartmentMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DepartmentCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DepartmentName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.DepartmentNameLocal).HasMaxLength(200);
            entity.Property(e => e.DepartmentIcon).HasMaxLength(100);
            entity.Property(e => e.DepartmentDescription).HasMaxLength(500);
            // Indexes
            entity.HasIndex(e => e.Id);
            entity.HasIndex(e => e.IsActive);
        });

        // DesignationMasterEntity configuration
        modelBuilder.Entity<DesignationMasterEntity>(entity =>
        {
            entity.ToTable("DesignationMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                .HasColumnName("Id");
            entity.Property(e => e.DesignationCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DesignationName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.DesignationLocal).HasMaxLength(200);
            entity.Property(e => e.DesignationDescription).HasMaxLength(500);
            // Indexes
            entity.HasIndex(e => e.Id);
            entity.HasIndex(e => e.DesignationCode).IsUnique();
        });



        // UlbImageMaster configuration
        modelBuilder.Entity<UlbImageMasterEntity>(entity =>
        {
            entity.ToTable("UlbImageMaster", "CORE");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).ValueGeneratedOnAdd();
            entity.Property(x => x.ImageType).HasMaxLength(50);
            entity.Property(x => x.ImageId);
            entity.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate);
        });

        // ActiveTaxes configuration
        modelBuilder.Entity<ActiveTaxesEntity>(entity =>
        {
            entity.ToTable("ActiveTaxesMaster", "PTIS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).ValueGeneratedOnAdd();
            entity.Property(x => x.TaxName).HasMaxLength(200);
            entity.Property(x => x.TaxNameAlias).HasMaxLength(200);
            entity.Property(x => x.DisplayOrder);
            entity.Property(x => x.TaxOnUnit).IsRequired().HasDefaultValue(false);
            entity.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate);
        });

        // GrievanceCategoryMaster configuration
        modelBuilder.Entity<GrievanceCategoryEntity>(entity =>
        {
            entity.ToTable("GrievanceCategoryMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CategoryCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CategoryName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Id);
            entity.Property(e => e.Priority).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ResolutionSla).HasMaxLength(100);
            entity.Property(e => e.EscalationLevel).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasOne(e => e.Department).WithMany().HasForeignKey(e => e.DepartmentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.CategoryCode).IsUnique();
            entity.HasIndex(e => e.CategoryName);
            entity.HasIndex(e => e.DepartmentId);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<ULBMasterEntity>(entity =>
        {
            entity.ToTable("ULBMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UlbCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.UlbName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.UlbNameLocal).HasMaxLength(200);
            entity.Property(e => e.UlbTypeId).HasConversion<int>().IsRequired();
            entity.Property(e => e.UlbLogo).HasMaxLength(500);
            entity.Property(e => e.EmailId).HasMaxLength(200);
            entity.Property(e => e.MobileNo).HasMaxLength(20);
            entity.Property(e => e.AlternateMobileNo).HasMaxLength(20);
            entity.Property(e => e.WebsiteUrl).HasMaxLength(200);
            entity.Property(e => e.ContactPersonName).HasMaxLength(200);
            entity.Property(e => e.ContactPersonDesignation).HasMaxLength(200);
            entity.Property(e => e.UlbAddress).HasMaxLength(500);
            entity.Property(e => e.State).HasMaxLength(100);
            entity.Property(e => e.District).HasMaxLength(100);
            entity.Property(e => e.PinCode).HasMaxLength(6);
            entity.Property(e => e.PartnerName).HasMaxLength(200);
            entity.Property(e => e.PMName).HasMaxLength(200);
            entity.Property(e => e.PMEmailId).HasMaxLength(200);
            entity.Property(e => e.PMMobileNo).HasMaxLength(20);
            entity.Property(e => e.LicenceType).HasMaxLength(50);
            entity.Property(e => e.LicenceDuration).HasMaxLength(50);
            entity.Property(e => e.SupportType).HasMaxLength(100);
            entity.Property(e => e.LicenceKey).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired();

            // Ignore BaseEntity properties that don't exist in database

            entity.Ignore(e => e.CreatedDate);
            entity.Ignore(e => e.UpdatedDate);
            entity.Ignore(e => e.CreatedBy);
            entity.Ignore(e => e.UpdatedBy);

            // Indexes for better query performance
            entity.HasIndex(e => e.UlbCode).IsUnique();
            entity.HasIndex(e => e.UlbTypeId);
            entity.HasIndex(e => e.IsActive);
        });

        // CombinePropertyHistory configuration
        modelBuilder.Entity<CombinePropertyHistoryEntity>(entity =>
        {
            entity.ToTable("CombinePropertyHistory", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.SourcePropertyId).IsRequired();
            entity.Property(e => e.CombinedPropertyId).IsRequired();
            entity.Property(e => e.CombineReason).IsRequired().HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.SourcePropertyId);
            entity.HasIndex(e => e.CombinedPropertyId);
        });

        // VirtualPropertyTransferHistory configuration
        modelBuilder.Entity<VirtualPropertyTransferHistoryEntity>(entity =>
        {
            entity.ToTable("VirtualPropertyTransferHistory", "GSMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.WardId).IsRequired();
            entity.Property(e => e.PropertyNo).HasMaxLength(50);
            entity.Property(e => e.PartitionNo).HasMaxLength(50);
            entity.Property(e => e.TransferredWardId).IsRequired();
            entity.Property(e => e.TransferredPropertyNo).HasColumnName("TransferredPropertyNo").HasMaxLength(50);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Foreign Key Relationships
            entity.HasOne(e => e.Property)
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Ward)
                .WithMany()
                .HasForeignKey(e => e.WardId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TransferredWard)
                .WithMany()
                .HasForeignKey(e => e.TransferredWardId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.PropertyId);
            entity.HasIndex(e => e.WardId);
            entity.HasIndex(e => e.TransferredWardId);
        });
        // TransMast configuration
        modelBuilder.Entity<TransMastEntity>(entity =>
        {
            entity.ToTable("TransMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.CalculationType).IsRequired().HasMaxLength(2).HasColumnType("char(2)");
            entity.Property(e => e.CalculationValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PolicyCodeId).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            entity.HasOne(e => e.Property)
                    .WithMany(p => p.TransMast)
                    .HasForeignKey(e => e.PropertyId)
                    .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PolicyCodeMaster)
                    .WithMany()
                    .HasForeignKey(e => e.PolicyCodeId)
                    .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);

            // Matches the database repo's UQ_TransMast_Property_Year_CalculationType_Policy_Tax: a UNIQUE
            // FILTERED index on (PropertyId, FinanceYearId, CalculationType, PolicyCodeId, TaxId) for the
            // live rows only (IsActive = 1 AND MarkedForDeletion = 0). The database enforces it; EF only
            // uses the declaration to order SaveChanges.
            //  * CalculationType is part of the key because this table holds both CV rows
            //    (CapitalValueService) and RV rows (RVPersistenceService/OccupationTaxApplicationService)
            //    for the same PropertyId/FinanceYearId/TaxId.
            //  * PolicyCodeId is part of the key because the database repo defines it that way
            //    (ntis-database-manager #125). That means the index does NOT make a year/tax demand unique:
            //    a NETTAX row and a retrospective / OLD_ARREARS row at the same year/tax differ in
            //    PolicyCodeId, so the database lets both be live. "One live demand per property/year/tax"
            //    (readers sum every live row) is kept by the writers: RVPersistenceService replaces all live
            //    RV rows of the year, and the retrospective engine deactivates the NETTAX / OLD_ARREARS row it
            //    replaces and the old family's row when the family changes.
            // Declaring the old four-column key (without PolicyCodeId) made EF think a CC row and an OC row at
            // the same year/tax collide and throw "circular dependency" when both were saved together.
            // A database that still has the older plain four-column unique constraint
            // UQ_TransMast_Property_Year_CalculationType_Tax would reject a retrospective row next to a
            // soft-deleted NETTAX row: check PTIS.TransMast's unique indexes on such a database.
            entity.HasIndex(e => new { e.PropertyId, e.FinanceYearId, e.CalculationType, e.PolicyCodeId, e.TaxId })
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("UQ_TransMast_Property_Year_CalculationType_Policy_Tax");

        });

        modelBuilder.Entity<RoomWiseSubmissionDetailsEntity>(entity =>
        {
            entity.ToTable("RoomWiseSubmissionDetails", "PTIS");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.LengthMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.WidthMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.AreaSqMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.HeightMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Base1Mtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Base2Mtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.TotalAreaSqMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Shape).HasMaxLength(100);
            entity.Property(e => e.RoomNo).HasMaxLength(50);
            entity.Property(e => e.RoomTypeId);
            entity.Property(e => e.SubmissionType).HasMaxLength(100);
            entity.Property(e => e.OuterYesNo).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MinusYesNo).IsRequired().HasDefaultValue(false);

            // Audit and soft delete configuration
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.HasOne(e => e.PropertyDetails)
                  .WithMany(p => p.RoomWiseSubmissionDetails)
                  .HasForeignKey(e => e.PropertyDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyMast)
                  .WithMany(p => p.RoomWiseSubmissionDetails)
                  .HasForeignKey(e => e.PropertyId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RoomTypeMaster)
                 .WithMany()
                 .HasForeignKey(e => e.RoomTypeId)
                 .OnDelete(DeleteBehavior.Restrict);
            // Indexes for better query performance
            entity.HasIndex(e => e.PropertyDetailsId);
            entity.HasIndex(e => e.PropertyId);
            entity.HasIndex(e => e.RoomTypeId);
        });

        // RoomWiseMinusData configuration
        modelBuilder.Entity<RoomWiseMinusDataEntity>(entity =>
        {
            entity.ToTable("RoomWiseMinusData", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RoomWiseSubmissionId).IsRequired();
            entity.Property(e => e.LengthMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.WidthMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.AreaSqMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.HeightMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Base1Mtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Base2Mtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.IsOffset).HasDefaultValue(false);
            entity.Property(e => e.Shape).HasMaxLength(25);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.RoomWiseSubmissionId);

            // Configure FK relationship with navigation property to RoomWiseSubmissionDetails
            entity.HasOne(e => e.RoomWiseSubmissionDetails)
                  .WithMany(r => r.PropertyRoomMinus)
                  .HasForeignKey(e => e.RoomWiseSubmissionId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
        // PropertyDetailsReassessmentEntity configuration
        modelBuilder.Entity<PropertyDetailsReassessmentEntity>(entity =>
        {
            entity.ToTable("PropertyDetailsReassessment", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FloorId).IsRequired();
            entity.Property(e => e.SubFloorId).IsRequired();
            entity.Property(e => e.ConstructionTypeId).IsRequired();
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.SubTypeOfUseId).IsRequired();
            // Add other property configurations as needed
            entity.HasIndex(e => e.FloorId);
            entity.HasIndex(e => e.SubFloorId);
            entity.HasIndex(e => e.ConstructionTypeId);
            entity.HasIndex(e => e.TypeOfUseId);
            entity.HasIndex(e => e.SubTypeOfUseId);
        });

        modelBuilder.Entity<PropertyCategoryEntity>(entity =>
        {
            entity.ToTable("PropertyCategoryMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyCategoryName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.PropertyCategoryName).IsUnique().HasDatabaseName("UQ_PropertyCategoryMaster_PropertyCategoryName");
        });

        // PropertyTypeCategory configuration
        modelBuilder.Entity<PropertyTypeCategoryEntity>(entity =>
        {
            entity.ToTable("PropertyTypeCategoryMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyTypeCategory).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.PropertyTypeCategory).IsUnique().HasDatabaseName("UQ_PropertyTypeCategoryMaster_PropertyTypeCategory");
        });

        // PropertyTypeMaster configuration
        modelBuilder.Entity<PropertyTypeMasterEntity>(entity =>
        {
            entity.ToTable("PropertyTypeMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyDescription).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PropertyDescriptionEnglish).HasMaxLength(100);
            entity.Property(e => e.Type).HasMaxLength(5);
            entity.Property(e => e.SearchSequence);
            entity.Property(e => e.PartType);
            entity.Property(e => e.PropertyTypeCategoryId);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.PropertyDescription).IsUnique().HasDatabaseName("UQ_PropertyTypeMaster_PropertyDescription");

            // Configure relationships
            entity.HasMany(e => e.PropertyMast)
                .WithOne(r => r.PropertyTypeMaster)
                .HasForeignKey(r => r.PropertyTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.PropertyDescriptionAndTypeOfUseValidation)
                .WithOne(n => n.PropertyTypeMaster)
                .HasForeignKey(n => n.PropertyTypeId)
                .OnDelete(DeleteBehavior.Restrict);

        });

        // PropertyPhotoType configuration
        modelBuilder.Entity<PropertyPhotoTypeEntity>(entity =>
        {
            entity.ToTable("PropertyPhotoType", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PhotoTypeCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PhotoTypeName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.PhotoScope).HasMaxLength(50);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.PhotoTypeCode).IsUnique().HasDatabaseName("UQ_PropertyPhotoType_Code");
        });

        // BHKMaster configuration
        modelBuilder.Entity<BHKMasterEntity>(entity =>
        {
            entity.ToTable("BHKMaster", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.BHKCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.BHKName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.RoomCount).HasPrecision(3, 1);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.BHKCode).IsUnique().HasDatabaseName("UX_BHKMaster_BHKCode");
        });

        modelBuilder.Entity<JurisdictionOverlayMasterEntity>(entity =>
        {
            entity.ToTable("JurisdictionOverlayMaster", "FAS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.StateCode).HasMaxLength(10);
            entity.Property(e => e.StateName).HasMaxLength(100);
            entity.Property(e => e.ActTitle).HasMaxLength(300);
            entity.Property(e => e.RulesTitle).HasMaxLength(300);
            entity.Property(e => e.MunicipalActTitle).HasMaxLength(300);
            entity.Property(e => e.ByeLawTitle).HasMaxLength(300);
            entity.Property(e => e.SectionRefs).HasMaxLength(400);
            entity.Property(e => e.IssuingAuthorityLabel).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CertificateFormCode).HasMaxLength(40);
            entity.Property(e => e.AuditReportFormCode).HasMaxLength(40);
            entity.Property(e => e.HasOwnFireBrigade).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.ValidityMonths).IsRequired();
            entity.Property(e => e.ReminderOffsetsCsv).HasMaxLength(40);
            entity.Property(e => e.EffectiveFrom).HasColumnType("date");
            entity.Property(e => e.EffectiveTo).HasColumnType("date");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.HasIndex(e => e.UlbId)
                .IsUnique()
                .HasFilter("[UlbId] IS NOT NULL AND [IsActive] = 1")
                .HasDatabaseName("UX_JurisdictionOverlayMaster_Ulb");
            entity.HasIndex(e => e.StateName)
                .IsUnique()
                .HasFilter("[UlbId] IS NULL AND [StateName] IS NOT NULL AND [IsActive] = 1")
                .HasDatabaseName("UX_JurisdictionOverlayMaster_State");
            entity.HasIndex(e => e.StateCode)
                .IsUnique()
                .HasFilter("[UlbId] IS NULL AND [StateCode] IS NOT NULL AND [IsActive] = 1")
                .HasDatabaseName("UX_JurisdictionOverlayMaster_StateCode");
        });

        // PropertyAssessment configuration (PropertyMastDetails table)
        modelBuilder.Entity<PropertyAssessmentEntity>(entity =>
        {
            entity.ToTable("PropertyMastDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.OwnerTypeId);
            entity.Property(e => e.AssessmentRemark).HasMaxLength(400);
            entity.Property(e => e.SurveyRemark).HasMaxLength(400);
            entity.Property(e => e.FlatSystemRemark).HasMaxLength(400);
            entity.Property(e => e.UnitGenerationType).HasMaxLength(10);
            entity.Property(e => e.CombPropRemark).HasMaxLength(400);
            entity.Property(e => e.AdharCardNo).HasMaxLength(12);
            entity.Property(e => e.RenterMobileNo).HasMaxLength(13);
            entity.Property(e => e.PrarupYadiPublishDate);
            entity.Property(e => e.AntimYadiPublishDate);
            entity.Property(e => e.PropertyRegDate);
            entity.Property(e => e.ApplyTaxesFrom);
            entity.Property(e => e.PartOCDate);
            entity.Property(e => e.BHKId);
            entity.HasOne(e => e.BHKMaster).WithMany().HasForeignKey(e => e.BHKId).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_PropertyMastDetails_BHKMaster");
            entity.Property(e => e.BlockNo).HasMaxLength(20);
            entity.Property(e => e.AlternativeEmailId).HasColumnName("AlternetivEmailId").HasMaxLength(100);
            entity.Property(e => e.TotalBuiltupAreaSqFeet);
            entity.Property(e => e.TotalBuiltupAreaSqMeter);
            entity.Property(e => e.Latitude).HasMaxLength(20);
            entity.Property(e => e.Longitude).HasMaxLength(20);
            entity.Property(e => e.NoOfResidentialToilets);
            entity.Property(e => e.NoOfCommercialToilets);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.HasIndex(e => e.PropertyId);

            entity.HasOne(r => r.PropertyMast)
                .WithMany(p => p.PropertyMastDetails)
                .HasForeignKey(r => r.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            // According to the actual database schema, WingNo does NOT exist in PropertyMastDetails table
            // WingNo is stored in SocietyDetailsMast table instead
            entity.Ignore(e => e.WingNo);
        });

        // PropertyDetails configuration
        modelBuilder.Entity<PropertyDetailsEntity>(entity =>
        {
            entity.ToTable("PropertyDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Id).IsRequired();
            entity.Property(e => e.CarpetAreaSqMeter).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.BuiltupAreaSqMeter).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CarpetAreaSqFeet).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.BuiltupAreaSqFeet).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ConstructionYear).HasColumnType("varchar(4)");
            entity.Property(e => e.AssessmentYear).HasColumnType("nvarchar(4)");
            entity.Property(e => e.IsOpenPlot);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true); 
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.HasIndex(e => e.Id);

            entity.HasOne(e => e.Property)
                   .WithMany(p => p.PropertyDetails)
                    .HasForeignKey(e => e.PropertyId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Floor)
                  .WithMany(p => p.PropertyDetails)
                  //.HasForeignKey(e => e.FloorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SubFloor)
                  .WithMany(p => p.PropertyDetails)
                  //.HasForeignKey(e => e.SubFloorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ConstructionType)
                  .WithMany(p => p.PropertyDetails)
                  //.HasForeignKey(e => e.ConstructionTypeId)
                  .OnDelete(DeleteBehavior.Restrict);



            entity.HasOne(e => e.TypeOfUse)
                  .WithMany(p => p.PropertyDetails)
                  .HasForeignKey(e => e.TypeOfUseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SubTypeOfUse)
                  .WithMany(p => p.PropertyDetails)
                  .HasForeignKey(e => e.SubTypeOfUseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.RoomWiseSubmissionDetails)
                  .WithOne(r => r.PropertyDetails)
                  .HasForeignKey(r => r.PropertyDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.RenterDetails)
                  .WithOne(r => r.PropertyDetails)
                  .HasForeignKey(r => r.PropertyDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Renters)
                  .WithOne(r => r.PropertyDetails)
                  .HasForeignKey(r => r.PropertyDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // SocietyDetails configuration
        modelBuilder.Entity<SocietyDetailsEntity>(entity =>
        {
            entity.ToTable("SocietyDetailsMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId);
            entity.Property(e => e.SocietyName).HasMaxLength(500);
            entity.Property(e => e.SocietyAddress).HasMaxLength(200);
            entity.Property(e => e.SecretaryName).HasMaxLength(200);
            entity.Property(e => e.ManagerName).HasMaxLength(200);
            entity.Property(e => e.LandOwnerName).HasMaxLength(200);
            entity.Property(e => e.BuilderName).HasMaxLength(200);
            entity.Property(e => e.SocietyNameEnglish).HasMaxLength(500);
            entity.Property(e => e.SocietyAddressEnglish).HasMaxLength(200);
            entity.Property(e => e.SecretaryNameEnglish).HasMaxLength(200);
            entity.Property(e => e.ManagerNameEnglish).HasMaxLength(200);
            entity.Property(e => e.LandOwnerNameEnglish).HasMaxLength(200);
            entity.Property(e => e.BuilderNameEnglish).HasMaxLength(200);
            entity.Property(e => e.ManagerMobileNo).HasMaxLength(13).IsUnicode(false);
            entity.Property(e => e.ManagerMobileNoRemarkId);
            entity.Property(e => e.SecretaryMobileNo).HasMaxLength(13).IsUnicode(false);
            entity.Property(e => e.SecretaryMobileNoRemarkId);
            entity.Property(e => e.BuilderMobileNo).HasMaxLength(13).IsUnicode(false);
            entity.Property(e => e.BuilderMobileNoRemarkId);
            entity.Property(e => e.SocietyEmailId).HasMaxLength(100);
            entity.Property(e => e.SecretaryEmailId).HasMaxLength(100);
            entity.Property(e => e.ManagerEmailId).HasMaxLength(100);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Configure foreign key relationships
            entity.HasOne(r => r.PropertyMast)
             .WithMany(p => p.SocietyDetailsMast)
             .HasForeignKey(r => r.PropertyId)
             .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ManagerMobileNoRemarkMaster)
                .WithMany()
                .HasForeignKey(e => e.ManagerMobileNoRemarkId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SecretaryMobileNoRemarkMaster)
                .WithMany()
                .HasForeignKey(e => e.SecretaryMobileNoRemarkId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.BuilderMobileNoRemarkMaster)
                .WithMany()
                .HasForeignKey(e => e.BuilderMobileNoRemarkId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // WingDetailsMast configuration
        modelBuilder.Entity<WingDetailsMastEntity>(entity =>
        {
            entity.ToTable("WingDetailsMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.SocietyDetailsMastId).IsRequired();
            entity.Property(e => e.WingMasterId).IsRequired();
            entity.Property(e => e.WingName).HasMaxLength(30);
            entity.Property(e => e.SecretaryName).HasMaxLength(200);
            entity.Property(e => e.ManagerName).HasMaxLength(200);
            entity.Property(e => e.SecretaryNameEnglish).HasMaxLength(200);
            entity.Property(e => e.ManagerNameEnglish).HasMaxLength(200);
            entity.Property(e => e.ManagerMobileNo).HasMaxLength(13).IsUnicode(false);
            entity.Property(e => e.ManagerMobileNoRemarkId);
            entity.Property(e => e.SecretaryMobileNo).HasMaxLength(13).IsUnicode(false);
            entity.Property(e => e.SecretaryMobileNoRemarkId);
            entity.Property(e => e.SecretaryEmailId).HasMaxLength(100);
            entity.Property(e => e.ManagerEmailId).HasMaxLength(100);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Configure foreign key relationships
            entity.HasOne(e => e.SocietyDetailsMast)
                .WithMany()
                .HasForeignKey(e => e.SocietyDetailsMastId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.WingMaster)
                .WithMany()
                .HasForeignKey(e => e.WingMasterId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ManagerMobileNoRemarkMaster)
                .WithMany()
                .HasForeignKey(e => e.ManagerMobileNoRemarkId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SecretaryMobileNoRemarkMaster)
                .WithMany()
                .HasForeignKey(e => e.SecretaryMobileNoRemarkId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Property configuration
        modelBuilder.Entity<PropertyEntity>(entity =>
        {
            entity.ToTable("PropertyMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyNo).HasMaxLength(10);
            entity.Property(e => e.PartitionNo).HasMaxLength(10);
            entity.Property(e => e.UPICId).HasMaxLength(30);
            entity.Ignore(e => e.OpenPlot);
            entity.Property(e => e.CSN).HasMaxLength(30);
            entity.Property(e => e.SubZoneNo).HasMaxLength(20);
            entity.Property(e => e.PlotNo).HasMaxLength(20);
            entity.Property(e => e.Id);
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.OwnerTitle).HasMaxLength(20);
            entity.Property(e => e.OwnerName).HasMaxLength(1000);
            entity.Property(e => e.OccupierTitle).HasMaxLength(20);
            entity.Property(e => e.OccupierName).HasMaxLength(1000);
            entity.Property(e => e.FlatOrShopNo).HasMaxLength(100);
            entity.Property(e => e.FlatOrShopName).HasMaxLength(200);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.MobileNo).HasMaxLength(13);
            entity.Property(e => e.EmailId).HasMaxLength(100);
            // entity.Property(e => e.Id);
            entity.Property(e => e.OwnerTitleEnglish).HasMaxLength(20);
            entity.Property(e => e.OwnerNameEnglish).HasMaxLength(1000);
            entity.Property(e => e.OccupierTitleEnglish).HasMaxLength(20);
            entity.Property(e => e.OccupierNameEnglish).HasMaxLength(1000);
            entity.Property(e => e.FlatOrShopNoEnglish).HasMaxLength(100);
            entity.Property(e => e.FlatOrShopNameEnglish).HasMaxLength(200);
            entity.Property(e => e.AddressEnglish).HasMaxLength(500);
            entity.Property(e => e.LocationEnglish).HasMaxLength(200);
            entity.Property(e => e.PinCode).HasMaxLength(6).HasColumnType("varchar(6)");
            entity.Property(e => e.MobileNoRemarkId);
            entity.Property(e => e.AlternateMobileNo).HasMaxLength(13).HasColumnType("varchar(13)");
            entity.Property(e => e.OccupierMobileNo).HasMaxLength(13).HasColumnType("varchar(13)");
            entity.Property(e => e.PropertyAssessmentStatusId);
            entity.Ignore(e => e.PropertyMastOldId);
            entity.Property(e => e.PropertySeqNo);
            entity.Property(e => e.PropertyTypeId);
            entity.Property(e => e.CategoryId);
            entity.Property(e => e.OccupierTypeId);
            entity.Property(e => e.PropertyFloorId);
            entity.Property(e => e.WingDetailId);
            entity.Property(e => e.IsVirtualProperty);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasMany(e => e.SocietyDetailsMast)
              .WithOne(d => d.PropertyMast)
              .HasForeignKey(d => d.PropertyId)
              .OnDelete(DeleteBehavior.Restrict);

            // Configure PropertyMastDetails (PropertyAssessmentEntity) relationship
            // This prevents EF Core from generating a shadow PropertyEntityId foreign key
            entity.HasMany(e => e.PropertyMastDetails)
                .WithOne(pmd => pmd.PropertyMast)
                .HasForeignKey(pmd => pmd.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.PropertyTaxCalculationCVResults)
                .WithOne(d => d.PropertyMast)
                .HasForeignKey(d => d.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.RVCalculationResults)
                .WithOne(d => d.PropertyMast)
                .HasForeignKey(d => d.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.FlagMaster)
                .WithOne(d => d.PropertyMast)
                .HasForeignKey(d => d.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure foreign key relationships for the new columns
            entity.HasOne<CommonRemarkTypeMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.MobileNoRemarkId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<CommonRemarkTypeMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.OccupierMobileNoRemarkId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyAssessmentStatus)
                .WithMany()
                .HasForeignKey(e => e.PropertyAssessmentStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // PropertyDetailsOld does NOT have PropertyId in database - it's related to PropertyMastOld only
            // Ignore this navigation to prevent shadow PropertyId/PropertyEntityId creation
            entity.Ignore(e => e.PropertyDetailsOld);

            // PropertyMastOld relationship is via PropertyMastOldId FK in PropertyEntity
            // Ignore collection navigation to prevent confusion
            entity.Ignore(e => e.PropertyMastOld);

            // Unique index on WardId, PropertyNo, PartitionNo
            entity.HasIndex(e => new { e.WardId, e.PropertyNo, e.PartitionNo })
                .IsUnique()
                .HasFilter("[PropertyNo] IS NOT NULL AND [PartitionNo] IS NOT NULL")
                .HasDatabaseName("UQ_Property_Ward_Property_Partition");

            entity.HasOne(e => e.Ward)
              .WithMany(c => c.Property)
              .HasForeignKey(e => e.WardId)
              .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Mouja)
             .WithMany(c => c.Property)
             .HasForeignKey(e => e.MoujaId)
             .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TaxZone)
             .WithMany(c => c.Property)
             .HasForeignKey(e => e.TaxZoneId)
             .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.PropertySocialDetails)
                .WithOne(psd => psd.PropertyMast)
                .HasForeignKey(psd => psd.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PropertyCertificates relationship to prevent shadow PropertyEntityId FK
            entity.HasMany(e => e.PropertyCertificates)
                .WithOne()
                .HasForeignKey(pc => pc.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        modelBuilder.Entity<ConfigCategoryMasterEntity>(entity =>
        {
            entity.ToTable("ConfigCategoryMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CategoryCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.CategoryName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.HasIndex(e => e.CategoryCode).IsUnique();

        });
        modelBuilder.Entity<ConfigKeyMasterEntity>(entity =>
        {
            entity.ToTable("ConfigKeyMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ConfigCode).IsRequired().HasMaxLength(60);
            entity.Property(e => e.ConfigName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(400);
            entity.Property(e => e.DataType).HasMaxLength(20);
            entity.Property(e => e.ControlType).HasMaxLength(30);
            entity.Property(e => e.DefaultValue).HasMaxLength(500);

            // Foreign Key Relationship
            entity.HasOne(e => e.Category)
                .WithMany(c => c.ConfigKeys)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.ConfigCode).IsUnique();
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<PaymentModeEntity>(entity =>
        {
            entity.ToTable("PaymentMode", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code);
            entity.Property(e => e.PaymentModeName);
            entity.Property(e => e.Type);
            entity.Property(e => e.Category);
            entity.Property(e => e.Description);
            entity.Property(e => e.ChargeType);
            entity.Property(e => e.TransactionCharge);
            entity.Property(x => x.IsActive);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate);
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate);

        });
        modelBuilder.Entity<ConfigValueMasterEntity>(entity =>
        {
            entity.ToTable("ConfigValueMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Value).HasMaxLength(500);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.UpdatedBy);

            // Foreign Key Relationships
            entity.HasOne(e => e.ConfigKey)
                .WithMany()
                .HasForeignKey(e => e.ConfigKeyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.ConfigKeyId);
            entity.HasIndex(e => e.DepartmentId);
            entity.HasIndex(e => e.ModuleId);
            entity.HasIndex(e => e.IsActive);
        });




        // ── UserMaster ───────────────────────────────────────────────────────
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("UserMaster", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            // Identity
            entity.Property(e => e.UserName).IsRequired().HasMaxLength(100);

            // Profile — Name split into parts
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.MiddleName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);

            entity.Property(e => e.UserCode).HasMaxLength(50);
            entity.Property(e => e.Address).HasMaxLength(400);
            entity.Property(e => e.MobileNo).HasMaxLength(30);
            entity.Property(e => e.AlternateMobileNo).HasMaxLength(30);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.MustChangePassword).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.Language).HasMaxLength(10);
            entity.Property(e => e.Remark).HasMaxLength(400);
            entity.Property(e => e.EmployeeTypeID);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);

            // Auth tracking — owned by auth flow, never exposed in DTOs
            // entity.Property(e => e.UserNameNormalized).HasMaxLength(100);
            entity.Property(e => e.FailedLoginCount).HasDefaultValue(0);
            entity.Property(e => e.LockedUntilAt);
            entity.Property(e => e.LastLoginAt);

            // Security
            entity.Property(e => e.PasswordHash).HasMaxLength(255);

            // Audit
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Indexes
            entity.HasIndex(e => e.UserName).IsUnique();
            entity.HasIndex(e => e.UserCode);
            //entity.HasIndex(e => e.UserNameNormalized).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.IsActive);
        });


        // RefreshToken configuration
        modelBuilder.Entity<RefreshTokenEntity>(entity =>
        {
            entity.ToTable("RefreshToken", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.IsRevoked).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.RevokedAt);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Foreign key relationship
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.IsRevoked, e.ExpiresAt });
        });

        // ── Two-factor authentication: new UserMaster columns ──────────────────
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.Property(e => e.TwoFactorEnabled).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.TwoFactorSecretEncrypted).HasMaxLength(500);
            entity.Property(e => e.TwoFactorEnabledAt);
            entity.Property(e => e.SecurityStamp).HasMaxLength(64);
            entity.Property(e => e.TwoFactorRequired).IsRequired().HasDefaultValue(false);
        });

        // ── Password expiry / account-level OTP lockout: new UserMaster columns ─
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.Property(e => e.PasswordChangedAt);
            entity.Property(e => e.OtpChallengeFailCount).HasDefaultValue(0);
            entity.Property(e => e.OtpChallengeLockedUntilAt);
        });

        // ── TwoFactorRecoveryCode ────────────────────────────────────────────
        modelBuilder.Entity<TwoFactorRecoveryCodeEntity>(entity =>
        {
            entity.ToTable("TwoFactorRecoveryCode", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.CodeHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.UsedAt);
            entity.Property(e => e.RevokedAt);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.UserId, e.UsedAt, e.RevokedAt });
        });

        // ── TwoFactorChallenge (MFA login challenge) ────────────────────────
        modelBuilder.Entity<MfaChallengeEntity>(entity =>
        {
            entity.ToTable("TwoFactorChallenge", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ChallengeHash).IsRequired().HasMaxLength(64);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.Purpose).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.FailedAttemptCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.ConsumedAt);
            entity.Property(e => e.RevokedAt);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.CodeHash).HasMaxLength(64);
            entity.Property(e => e.Channel).HasMaxLength(20);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ChallengeHash).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);
        });

        // ── SecurityAuditLog ─────────────────────────────────────────────────
        modelBuilder.Entity<SecurityAuditLogEntity>(entity =>
        {
            entity.ToTable("SecurityAuditLog", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UserId);
            entity.Property(e => e.Success).IsRequired();
            entity.Property(e => e.CorrelationId).HasMaxLength(100);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.Detail).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.EventType);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<WingEntity>(entity =>
        {
            entity.ToTable("WingMaster", "PTIS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.WingNo).IsRequired().HasMaxLength(10);
            entity.Property(x => x.SequenceNo);
            entity.Property(x => x.IsActive);
            entity.Property(x => x.CreatedDate);
            entity.Property(x => x.UpdatedDate);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.UpdatedBy);
        });


        // PropertyMastOld configuration
        modelBuilder.Entity<PropertyMastOldEntity>(entity =>
        {
            entity.ToTable("PropertyMastOld", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.OldWardNo).HasMaxLength(10);
            entity.Property(e => e.OldPropertyNo).HasMaxLength(10);
            entity.Property(e => e.OldPartitionNo).HasMaxLength(10);
            entity.Property(e => e.OldEgovNo).HasMaxLength(10);
            entity.Property(e => e.OldPropertyTypeId);
            entity.Property(e => e.OldALV).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldRV).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldGeneralTax).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldTotalTax).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldZoneNo).HasMaxLength(20);
            entity.Property(e => e.OldPlotNo).HasMaxLength(20);
            entity.Property(e => e.OldCSN).HasMaxLength(30);
            entity.Property(e => e.OldPlotArea).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldAssessmentYear);
            entity.Property(e => e.OldFloor).HasMaxLength(10);
            entity.Property(e => e.OldConstructionTypeOfUseId).HasMaxLength(7);
            entity.Property(e => e.OldUseType).HasMaxLength(100);
            entity.Property(e => e.OldConstructionArea).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldConstructionYear)
                .HasConversion(
                    v => v != null ? (int?)Convert.ToInt32(v) : null,
                    v => v.HasValue ? v.Value.ToString() : null);
            entity.Property(e => e.OldOwnerName).HasMaxLength(1000);
            entity.Property(e => e.OldOccupierName).HasMaxLength(1000);
            entity.Property(e => e.OldAddress).HasMaxLength(500);
            entity.Property(e => e.OldOwnerNameEnglish).HasMaxLength(1000);
            entity.Property(e => e.OldOccupierNameEnglish).HasMaxLength(1000);
            entity.Property(e => e.OldAddressEnglish).HasMaxLength(500);
            entity.Property(e => e.NoOfOldToilets);
            entity.Property(e => e.OldTotalRooms);
            entity.Property(e => e.OldSocietyName).HasMaxLength(300);
            entity.Property(e => e.OldEmailId).HasMaxLength(100);
            entity.Property(e => e.OldParkingAreaSqFt).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldParkingAreaSqMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldAssessmentDate);
            entity.Property(e => e.OldFlatOrShopNumber).HasMaxLength(50);
            entity.Property(e => e.OldWing).HasMaxLength(20);
            entity.Property(e => e.OldMobileNo).HasMaxLength(13);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        // PropertyDetailsOld configuration
        modelBuilder.Entity<PropertyDetailsOldEntity>(entity =>
        {
            entity.ToTable("PropertyDetailsOld", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyMastOldId).IsRequired();
            entity.Property(e => e.OldFloorId);
            entity.Property(e => e.OldSubFloorId);
            entity.Property(e => e.OldConstructionYear).HasMaxLength(4);
            entity.Property(e => e.OldAssessmentYear).HasMaxLength(4);
            entity.Property(e => e.OldConstructionTypeId);
            entity.Property(e => e.OldTypeOfUseId);
            entity.Property(e => e.OldSubTypeOfUseId);
            entity.Property(e => e.OldCarpetAreaSqMeter).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldCarpetAreaSqFeet).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldBuiltupAreaSqMeter).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.OldBuiltupAreaSqFeet).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.PropertyMastOldId);

            // Configure FK relationship to PropertyMastOld
            entity.HasOne<PropertyMastOldEntity>()
                .WithMany()
                .HasForeignKey(e => e.PropertyMastOldId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // RefreshToken configuration
        modelBuilder.Entity<RefreshTokenEntity>(entity =>
        {
            entity.ToTable("RefreshToken", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.IsRevoked).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.RevokedAt);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Foreign key relationship
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.IsRevoked, e.ExpiresAt });
        });


        modelBuilder.Entity<PropertyTaxCalculationCVResultsEntity>(entity =>
        {
            entity.ToTable("PropertyTaxCalculationCVResults", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaxPercentage).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Relationship to Property - Restrict delete to preserve CV history
            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.PropertyTaxCalculationCVResults)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Explicitly configure the RateCVMaster relationship
            entity.HasOne(e => e.RateCVMaster)
                .WithMany()
                .HasForeignKey(e => e.RateCVMasterId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship to PropertyDetails - Restrict delete to preserve CV history
            entity.HasOne(e => e.PropertyDetails)
                .WithMany(p => p.PropertyTaxCalculationCVResults)
                .HasForeignKey(e => e.PropertyDetailsId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship to RateCVMaster - Restrict delete to preserve CV history
            entity.HasOne(e => e.RateCVMaster)
                .WithMany()
                .HasForeignKey(e => e.RateCVMasterId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship to TaxMaster - Restrict delete
            entity.HasOne(e => e.TaxMaster)
                .WithMany()
                .HasForeignKey(e => e.TaxId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship to FloorFactorCVMaster - Restrict delete
            entity.HasOne(e => e.FloorFactorCVMaster)
                .WithMany()
                .HasForeignKey(e => e.FloorFactorCVId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship to AgeFactorCVMaster - Restrict delete
            entity.HasOne(e => e.AgeFactorCVMaster)
                .WithMany()
                .HasForeignKey(e => e.AgeFactorCVId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship to NatureFactorCVMaster - Restrict delete
            entity.HasOne(e => e.NatureFactorCVMaster)
                .WithMany()
                .HasForeignKey(e => e.NatureFactorCVId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship to UseFactorCVMaster - Restrict delete
            entity.HasOne(e => e.UseFactorCVMaster)
                .WithMany()
                .HasForeignKey(e => e.UseFactorCVId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => new { e.PropertyId, e.PropertyDetailsId, e.TaxId })
                .IsUnique()
                .HasFilter("[IsActive] = 1")
                .HasDatabaseName("UQ_PropertyTaxCalculationCVResults_Property_PropertyDetails_Tax_Active");
            entity.HasIndex(e => e.RateCVMasterId)
                .HasDatabaseName("IX_PropertyTaxCalculationCVResults_RateCVMasterId");
            entity.HasIndex(e => e.PropertyId);
            entity.HasIndex(e => e.PropertyDetailsId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.MarkedForDeletion);
        });

        // ── UserDepartmentAllocation ─────────────────────────────────────────
        modelBuilder.Entity<UserDepartmentAllocationEntity>(entity =>
        {
            entity.ToTable("UserDepartmentAllocation", "CORE");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.DepartmentId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasOne(e => e.Department)
                  .WithMany()
                  .HasForeignKey(e => e.DepartmentId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired();

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.DepartmentId }).IsUnique();
        });


        modelBuilder.Entity<RenterDetailEntity>(entity =>
        {
            entity.ToTable("RenterDetails", "PTIS");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.AgreementId).HasMaxLength(100);
            entity.Property(e => e.IncrementFrequency).HasMaxLength(50);
            entity.Property(e => e.IncrementType).HasMaxLength(50);
            entity.Property(e => e.IncrementMethod).HasMaxLength(50);
            entity.Property(e => e.IncrementValue);
            entity.Property(e => e.RentAmount);
            entity.Property(e => e.RentMonthly);
            entity.Property(e => e.Increment);

            // Custom increment fields
            entity.Property(e => e.CustomFromDate);
            entity.Property(e => e.CustomToDate);
            entity.Property(e => e.CustomIncrementType).HasMaxLength(50);
            entity.Property(e => e.CustomIncrementValue);
            entity.Property(e => e.CustomMethod).HasMaxLength(50);

            // Audit and soft delete configuration
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.HasOne(e => e.PropertyDetails)
                  .WithMany(p => p.RenterDetails)
                  .HasForeignKey(e => e.PropertyDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for better query performance
            entity.HasIndex(e => e.PropertyDetailsId);
        });




        // ── UserModuleAllocation ─────────────────────────────────────────────
        modelBuilder.Entity<UserModuleAllocationEntity>(entity =>
        {
            entity.ToTable("UserModuleAllocation", "CORE");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.DepartmentId).IsRequired();
            entity.Property(e => e.ModuleId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);


            entity.HasOne(e => e.Department)
                  .WithMany()
                  .HasForeignKey(e => e.DepartmentId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired();

            entity.HasOne(e => e.Module)
                  .WithMany()
                  .HasForeignKey(e => e.ModuleId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired();

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.DepartmentId, e.ModuleId }).IsUnique();
        });

        // ── UserRoleAllocation ───────────────────────────────────────────────
        modelBuilder.Entity<UserRoleAllocationEntity>(entity =>
        {
            entity.ToTable("UserRoleAllocation", "CORE");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.DepartmentId).IsRequired();
            entity.Property(e => e.UserRoleId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.Department)
                  .WithMany()
                  .HasForeignKey(e => e.DepartmentId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired();

            entity.HasOne(e => e.UserRole)
                  .WithMany()
                  .HasForeignKey(e => e.UserRoleId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired();

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.DepartmentId, e.UserRoleId }).IsUnique();
        });

        // EmployeeTypeMaster configuration
        modelBuilder.Entity<EmployeeTypeEntity>(entity =>
        {
            entity.ToTable("EmployeeTypeMaster", "Core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EmployeeType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<PropertyDescriptionAndTypeOfUseValidationEntity>(entity =>
        {
            entity.ToTable("PropertyDescriptionAndTypeOfUseValidation", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyTypeId).IsRequired();
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.TypeOfUse)
              .WithMany(c => c.PropertyDescriptionAndTypeOfUseValidation)
              .HasForeignKey(e => e.TypeOfUseId)
              .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint on PropertyTypeId and TypeOfUseId combination
            entity.HasIndex(e => new { e.PropertyTypeId, e.TypeOfUseId })
                .IsUnique()
                .HasDatabaseName("UQ_PropertyDescriptionAndTypeOfUseValidation_PropertyTypeId_TypeOfUseId");
        });


        modelBuilder.Entity<RVCalculationResultsEntity>(entity =>
        {
            entity.ToTable("RVCalculationResults", "PTIS");
            entity.HasKey(e => e.Id);

            // These columns are SQL `float` in the live PTIS.RVCalculationResults table
            // (confirmed against the table DDL) - mapped as CLR double, not decimal, to match.
            entity.Property(e => e.MonthlyRate).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.YearlyRate).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.YearlyRent).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.AnnualRentalValue).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.TotalAreaSqMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.RAreaSqMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CAreaSqlMtr).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");

            entity.Property(e => e.Depreciation).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Maintenance).HasColumnType("decimal(18,2)");
            entity.Property(e => e.RateableValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.REducationTax).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CEducationTax).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CEmploymentTax).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);


            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.RVCalculationResults)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyDetails)
                .WithMany(p => p.RVCalculationResults)
                .HasForeignKey(e => e.PropertyDetailsId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // RVCalculationTaxDetails configuration
        modelBuilder.Entity<RVCalculationTaxDetailsEntity>(entity =>
        {
            entity.ToTable("RVCalculationTaxDetails", "PTIS");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.TaxPercentage).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            entity.HasOne(e => e.RVCalculationResults)
                .WithMany(p => p.TaxDetails)
                .HasForeignKey(e => e.RVCalculationResultsId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TaxMaster)
                .WithMany()
                .HasForeignKey(e => e.TaxId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // RVCalculationSignature configuration -- one row per property, holds the hash of the
        // property-owned inputs (property/details/renter/exemption/certificate/social-detail data)
        // that fed the last RV calculation, so RateableValueService can skip recalculation when
        // nothing relevant has changed since the last run.
        modelBuilder.Entity<RVCalculationSignatureEntity>(entity =>
        {
            entity.ToTable("RVCalculationSignature", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.SignatureHash).IsRequired().HasColumnType("varchar(64)");
            entity.Property(e => e.CalculatedAt).IsRequired().HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.PropertyId)
                .IsUnique()
                .HasDatabaseName("UQ_RVCalculationSignature_PropertyId");
        });

        // UseFactorCVMaster configuration
        modelBuilder.Entity<UseFactorCVMasterEntity>(entity =>
        {
            entity.ToTable("UseFactorCVMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd(); // Identity column
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.SubTypeOfUseId).IsRequired();
            entity.Property(e => e.Factor).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.YearRangeCVId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.TypeOfUse)
                .WithMany(p => p.UseFactorCVMaster)
                .HasForeignKey(e => e.TypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SubTypeOfUse)
                .WithMany(p => p.UseFactorCVMaster)
                .HasForeignKey(e => e.SubTypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YearRangeCV)
                .WithMany(p => p.UseFactorCVMaster)
                .HasForeignKey(e => e.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.TypeOfUseId);
            entity.HasIndex(e => e.SubTypeOfUseId);
            entity.HasIndex(e => e.YearRangeCVId);
            entity.HasIndex(e => e.IsActive);
            // Uniqueness constraint for TypeOfUseId + SubTypeOfUseId + YearRangeCVId
            entity.HasIndex(e => new { e.TypeOfUseId, e.SubTypeOfUseId, e.YearRangeCVId }).IsUnique();
        });
        // AgeFactorCVMaster configuration
        modelBuilder.Entity<AgeFactorCVMasterEntity>(entity =>
        {
            entity.ToTable("AgeFactorCVMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ConstructionTypeId).IsRequired();
            entity.Property(e => e.AgeFrom).IsRequired();
            entity.Property(e => e.AgeTo).IsRequired();
            entity.Property(e => e.Factor).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.YearRangeCVId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.ConstructionType)
                .WithMany(p => p.AgeFactorCVMaster)
                .HasForeignKey(e => e.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YearRangeCV)
                .WithMany(p => p.AgeFactorCVMaster)
                .HasForeignKey(e => e.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ConstructionTypeId);
            entity.HasIndex(e => e.YearRangeCVId);
            entity.HasIndex(e => e.AgeFrom);
            entity.HasIndex(e => e.AgeTo);
            entity.HasIndex(e => e.IsActive);
        });

        // FloorFactorCVMaster configuration
        modelBuilder.Entity<FloorFactorCVMasterEntity>(entity =>
        {
            entity.ToTable("FloorFactorCVMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FloorId).IsRequired();
            entity.Property(e => e.FactorWithLift).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.FactorWithoutLift).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.YearRangeCVId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.Floor)
                .WithMany(p => p.FloorFactorCVMaster)
                .HasForeignKey(e => e.FloorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YearRangeCV)
                .WithMany(p => p.FloorFactorCVMaster)
                .HasForeignKey(e => e.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.FloorId);
            entity.HasIndex(e => e.YearRangeCVId);
            entity.HasIndex(e => e.IsActive);
            // Uniqueness constraint for FloorId + YearRangeCVId to match service expectations
            // CapitalValueService.CreateAsync uses ToDictionaryAsync((FloorId, YearRangeCVId))
            // which will throw if duplicates exist
            entity.HasIndex(e => new { e.FloorId, e.YearRangeCVId }).IsUnique();
        });

        // FlagMaster configuration
        modelBuilder.Entity<FlagMasterEntity>(entity =>
        {
            entity.ToTable("FlagMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);

            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.FlagMaster)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
        });

        modelBuilder.Entity<TaxPercentageMasterCVEntity>(entity =>
        {
            entity.ToTable("TaxPercentageMasterCV", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaxId);
            entity.Property(e => e.TypeOfUseId);
            entity.Property(e => e.YearRangeCVId);
            entity.Property(e => e.TaxPercentage).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Foreign key configuration
            entity.HasOne(e => e.TaxMaster)
                .WithMany(p => p.TaxPercentageMasterCV)
                .HasForeignKey(e => e.TaxId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TypeOfUse)
             .WithMany(c => c.TaxPercentageMasterCV)
             .HasForeignKey(e => e.TypeOfUseId)
             .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AssessmentYearRangeCV)
            .WithMany(c => c.TaxPercentageMasterCV)
            .HasForeignKey(e => e.YearRangeCVId)
            .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint on natural key (TaxId, TypeOfUseId, YearRangeCVId) for active records
            // Prevents duplicate tax percentage configurations that could lead to ambiguous calculations
            entity.HasIndex(e => new { e.TaxId, e.TypeOfUseId, e.YearRangeCVId })
                .IsUnique()
                .HasDatabaseName("UX_TaxPercentageMasterCV_NaturalKey_Active")
                .HasFilter("[IsActive] = 1");
        });


        modelBuilder.Entity<CSNDetailsEntity>(entity =>
        {
            entity.ToTable("CSNDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RateCVMasterId);
            entity.Property(e => e.MoujaId);
            entity.Property(e => e.CSN).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasOne<RateMasterForCVEntity>()
                .WithMany(x => x.CSNDetails)
                .HasForeignKey(x => x.RateCVMasterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.RateCVMasterId);
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<GenderMasterEntity>(entity =>
        {
            entity.ToTable("GenderMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.GenderName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.GenderName).IsUnique().HasDatabaseName("UQ_GenderMaster_GenderName");
            entity.HasIndex(e => e.IsActive);
        });


        // PropertyCertificateTypeMaster configuration
        modelBuilder.Entity<PropertyCertificateTypeMasterEntity>(entity =>
        {
            entity.ToTable("PropertyCertificateTypeMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.CertificateTypeName).IsRequired().HasMaxLength(100).HasColumnType("nvarchar(100)");
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.CertificateTypeCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.Description).HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.IsTaxable).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsProtected).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.CertificateTypeCode).IsUnique().HasDatabaseName("UQ_PropertyCertificateTypeMaster_Code");
            entity.HasIndex(e => e.CertificateTypeName).IsUnique().HasDatabaseName("UQ_PropertyCertificateTypeMaster_Name");
        });

        modelBuilder.Entity<FloorGroupMasterEntity>(entity =>
        {
            entity.ToTable("FloorGroupMaster", "PTIS");
            entity.HasKey(e => e.Id).HasName("PK_FloorGroupMaster");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.FloorGroup).HasColumnName("FloorGroup").HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.IsActive).HasColumnName("IsActive").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.CreatedDate).HasColumnName("CreatedDate").HasColumnType("datetime").HasDefaultValueSql("getdate()").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");
            entity.Property(e => e.UpdatedDate).HasColumnName("UpdatedDate").HasColumnType("datetime");
        });

        modelBuilder.Entity<FLatGenerationGroupMasterEntity>(entity =>
        {
            entity.ToTable("FLatGenerationGroupMaster", "PTIS");
            entity.HasKey(e => e.Id).HasName("PK_FLatGenerationGroupMaster");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.FLatGenerationGroup).HasColumnName("FLatGenerationGroup").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.FLatGenerationGroup).IsUnique().HasDatabaseName("UQ_FLatGenerationGroupMaster_Name");
            entity.Property(e => e.IsActive).HasColumnName("IsActive").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.CreatedDate).HasColumnName("CreatedDate").HasColumnType("datetime").HasDefaultValueSql("getdate()").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");
            entity.Property(e => e.UpdatedDate).HasColumnName("UpdatedDate").HasColumnType("datetime");
        });


        modelBuilder.Entity<PolicyTaxDetailsCVEntity>(entity =>
        {
            entity.ToTable("PolicyTaxDetailsCV", "PTIS");
            entity.HasKey(e => e.Id).HasName("PK_PolicyTaxDetailsCV");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.PolicyCodeId).IsRequired();
            entity.Property(e => e.CalculationValue).HasColumnType("money");
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.TaxAmount).HasColumnType("money");
            entity.Property(e => e.IsCurrent).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            // Configure foreign key relationships
            entity.HasOne(e => e.TaxMaster)
                .WithMany(p => p.PolicyTaxDetailsCV)
                .HasForeignKey(e => e.TaxId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.PolicyTaxDetailsCV)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PolicyCodeMaster)
                .WithMany()
                .HasForeignKey(e => e.PolicyCodeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for better query performance
            entity.HasIndex(e => e.PropertyId);
            entity.HasIndex(e => e.TaxId);
            entity.HasIndex(e => e.PolicyCodeId);
        });

        // BlockMaster configuration
        modelBuilder.Entity<BlockMasterEntity>(entity =>
        {
            entity.ToTable("BlockMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.WardId).IsRequired();
            entity.Property(e => e.BlockNo).IsRequired().HasMaxLength(20);
            // Foreign key relationship with WardMaster
            entity.HasOne(e => e.Ward)
                 .WithMany(p => p.BlockMaster)
                 .HasForeignKey(e => e.WardId)
                 .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint on WardId and BlockNo combination
            entity.HasIndex(e => new { e.WardId, e.BlockNo })
                .IsUnique()
                .HasDatabaseName("UQ_BlockMaster_Ward_BlockNo");
        });
        // TaxCategoryMaster configuration
        modelBuilder.Entity<TaxCategoryMasterEntity>(entity =>
        {
            entity.ToTable("TaxCategoryMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.CategoryCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CategoryName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.CategoryCode).IsUnique().HasDatabaseName("UQ_TaxCategoryMaster_CategoryCode");
        });

        // TaxMaster configuration
        modelBuilder.Entity<TaxMasterEntity>(entity =>
        {
            // UseSqlOutputClause(false): PTIS.TaxMaster carries database triggers (audit triggers in
            // restored environments). EF Core 7+ saves via an OUTPUT clause by default, and SQL
            // Server rejects OUTPUT-without-INTO on a trigger-bearing table — every settings save
            // would fail with "the target table has database triggers". This opts that one table
            // back onto the pre-EF7 write path.
            entity.ToTable("TaxMaster", "PTIS", tb => tb.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaxCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.TaxName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.TaxNameAlias).HasMaxLength(200);
            entity.Property(e => e.TaxCategoryId).IsRequired();
            // Category is a [NotMapped] computed property — no column or EF configuration needed.
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.TaxOnUnit).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.AssessmentStatus).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.OldTaxStatus).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CalculationModeId).IsRequired();
            entity.Property(e => e.RuleDefinitionId);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.TaxCode).IsUnique().HasDatabaseName("UQ_TaxMaster_TaxCode");
            entity.HasIndex(e => e.TaxName).IsUnique().HasDatabaseName("UQ_TaxMaster_TaxName");
            // FK → TaxCategoryMaster
            entity.HasOne(e => e.TaxCategoryMaster)
                  .WithMany(c => c.TaxMasters)
                  .HasForeignKey(e => e.TaxCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
            // FK â†’ DynamicTaxRuleMaster (selected Rule Name), optional
            entity.HasOne(e => e.RuleDefinition)
                  .WithMany(r => r.Taxes)
                  .HasForeignKey(e => e.RuleDefinitionId)
                  .OnDelete(DeleteBehavior.Restrict);
            // FK → TaxCalculationModeMaster (DB-driven calculation mode + its capability flags)
            entity.HasOne(e => e.CalculationModeMaster)
                  .WithMany(m => m.TaxMasters)
                  .HasForeignKey(e => e.CalculationModeId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.CalculationModeId).HasDatabaseName("IX_TaxMaster_CalculationModeId");
        });

        // TaxCalculationModeMaster configuration (DB-driven calculation modes — replaces the
        // hardcoded (VALUE_BASED/CONDITION_BASED/MASTER_BASED/HYBRID list). The Uses*Config flags
        // let code branch on CAPABILITIES rather than on a mode's code.
        modelBuilder.Entity<TaxCalculationModeMasterEntity>(entity =>
        {
            entity.ToTable("TaxCalculationModeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ModeCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ModeName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.UsesValueConfig).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.UsesConditionConfig).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.UsesMasterConfig).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.UsesHybridConfig).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.ModeCode).IsUnique().HasDatabaseName("UQ_TaxCalculationModeMaster_ModeCode");
        });

        // DynamicTaxRuleMaster configuration (Rule Master registry)
        modelBuilder.Entity<DynamicTaxRuleEntity>(entity =>
        {
            entity.ToTable("DynamicTaxRuleMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.RuleType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.AttachedReference).HasMaxLength(200);
            entity.Property(e => e.SortOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.Description);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.DisplayName).IsUnique().HasDatabaseName("UQ_DynamicTaxRuleMaster_DisplayName");
        });

        // TaxMasterMapping configuration (master-based lookup rows)
        modelBuilder.Entity<TaxMasterMappingEntity>(entity =>
        {
            entity.ToTable("TaxMasterMapping", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.MasterKey).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayValue).HasMaxLength(200);
            entity.Property(e => e.AssessmentYearRangeId).IsRequired();
            entity.Property(e => e.ResultMode).IsRequired().HasMaxLength(10).HasDefaultValue("FIXED");
            entity.Property(e => e.ResultBase).IsRequired().HasMaxLength(10).HasDefaultValue("NONE");
            entity.Property(e => e.ResultValue).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            // Natural key is (Tax, Year, MasterKey). RuleDefinitionId was previously part of this
            // key so a tax could hold mapping sets from several rules at once; that is no longer
            // supported — a tax's mappings belong to the tax, and switching its rule no longer
            // leaves a second, invisible set behind. One consequence to be aware of: two rules
            // whose master-key vocabularies overlap can no longer both be configured on the same
            // tax at the same year.
            entity.HasIndex(e => new { e.TaxId, e.AssessmentYearRangeId, e.MasterKey })
                  .IsUnique()
                  .HasDatabaseName("UQ_TaxMasterMapping_Tax_Year_Key");
            entity.HasOne(e => e.Tax)
                  .WithMany()
                  .HasForeignKey(e => e.TaxId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // TaxConditionRule configuration (condition-based rows — flat left-to-right AND/OR chain, priority-matched, FIXED/PERCENT result)
        modelBuilder.Entity<TaxConditionRuleEntity>(entity =>
        {
            entity.ToTable("TaxConditionRule", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.SortOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.ConditionsJson).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.AssessmentYearRangeId);
            entity.Property(e => e.ResultMode).IsRequired().HasMaxLength(10).HasDefaultValue("FIXED");
            entity.Property(e => e.ResultBase).IsRequired().HasMaxLength(10).HasDefaultValue("NONE");
            entity.Property(e => e.ResultValue).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.ReferenceTaxId);
            // Not a FK: RulesField is keyed by Id, but rules reference fields by their string
            // FieldName/DatabaseColumnName (the same key conditions use), so this stays a plain
            // column validated on save rather than a database relationship.
            entity.Property(e => e.UnitFieldId).HasMaxLength(100);
            entity.Property(e => e.AssessmentBasis).HasMaxLength(30);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            // Non-unique — unlike TaxMasterMapping there is no natural key (ConditionsJson is
            // arbitrary JSON); this index only serves the Tax+SortOrder read pattern the
            // evaluator and admin grid always use.
            entity.HasIndex(e => new { e.TaxId, e.SortOrder })
                  .HasDatabaseName("IX_TaxConditionRule_Tax_SortOrder");
            entity.HasOne(e => e.Tax)
                  .WithMany()
                  .HasForeignKey(e => e.TaxId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ReferenceTax)
                  .WithMany()
                  .HasForeignKey(e => e.ReferenceTaxId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // TaxHybridConfig configuration (HYBRID strategy, one per tax)
        modelBuilder.Entity<TaxHybridConfigEntity>(entity =>
        {
            entity.ToTable("TaxHybridConfig", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.EvaluationPriority).IsRequired().HasMaxLength(30).HasDefaultValue("MASTER_THEN_CONDITION");
            entity.Property(e => e.FallbackStrategy).IsRequired().HasMaxLength(20).HasDefaultValue("DEFAULT_ZERO");
            entity.Property(e => e.ResultBase).IsRequired().HasMaxLength(10).HasDefaultValue("NONE");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.TaxId).IsUnique().HasDatabaseName("UQ_TaxHybridConfig_TaxId");
            entity.HasOne(e => e.Tax)
                  .WithMany()
                  .HasForeignKey(e => e.TaxId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // TransMastOld configuration
        modelBuilder.Entity<TransMastOldEntity>(entity =>
        {
            entity.ToTable("TransMastOld", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyMastOldId).IsRequired();
            entity.Property(e => e.FinanceYearId).IsRequired();
            entity.Property(e => e.CalculationType).IsRequired().HasMaxLength(2).HasColumnType("char(2)");
            entity.Property(e => e.CalculationAnnualValue).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.CalculationValue).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.TaxAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Unique constraint on PropertyMastOldId, FinanceYearId, TaxId for active, non-deleted rows only
            entity.HasIndex(e => new { e.PropertyMastOldId, e.FinanceYearId, e.TaxId })
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("UQ_TransMastOld_Property_Year_Tax");

            // Performance indexes
            entity.HasIndex(e => new { e.PropertyMastOldId, e.FinanceYearId })
                .HasDatabaseName("IX_TransMastOld_PropertyYear")
                .IncludeProperties(e => new { e.TaxId, e.TaxAmount });

            entity.HasIndex(e => e.TaxId).HasDatabaseName("IX_TransMastOld_TaxId");
        });


        // Document configuration
        modelBuilder.Entity<DocumentEntity>(entity =>
        {
            entity.ToTable("Document", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            // DocumentGuid is generated application-side in DocumentEntity.Create() factory method
            // This ensures consistent behavior across all environments and improves testability
            entity.Property(e => e.DocumentGuid).IsRequired();
            entity.Property(e => e.DepartmentId);
            entity.Property(e => e.DepartmentEntityId);
            entity.Property(e => e.UploadedByUserId).IsRequired().HasColumnName("CreatedBy");

            // Ignore BaseEntity.CreatedBy since we're using UploadedByUserId mapped to CreatedBy column
            entity.Ignore(e => e.CreatedBy);

            entity.Property(e => e.FileName).IsRequired().HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.FileExtension).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(200).HasColumnType("varchar(200)");
            entity.Property(e => e.FileSizeBytes).IsRequired();
            entity.Property(e => e.StorageProvider).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)").HasDefaultValue("FOLDER");
            entity.Property(e => e.StoragePath).IsRequired().HasMaxLength(1000).HasColumnType("nvarchar(1000)");
            entity.Property(e => e.ThumbnailPath).HasMaxLength(1000).HasColumnType("nvarchar(1000)");
            entity.Property(e => e.ChecksumSha256).HasMaxLength(64).HasColumnType("varchar(64)");
            entity.Property(e => e.ScanStatusCode).HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.ScanCompletedDate).HasColumnType("datetime");
            entity.Property(e => e.ScanDetails).HasMaxLength(4000).HasColumnType("nvarchar(4000)");
            entity.Property(e => e.UploadStatusCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)").HasDefaultValue("ACTIVE");
            entity.Property(e => e.DocumentTitle).HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.Description).HasMaxLength(2000).HasColumnType("nvarchar(2000)");
            entity.Property(e => e.DocumentType).HasMaxLength(100).HasColumnType("nvarchar(100)");
            entity.Property(e => e.DocumentCategory).HasMaxLength(100).HasColumnType("nvarchar(100)");
            entity.Property(e => e.Tags).HasMaxLength(2000).HasColumnType("nvarchar(2000)");
            entity.Property(e => e.Language).HasMaxLength(10).HasColumnType("varchar(10)");
            entity.Property(e => e.Version).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.ParentDocumentId);
            entity.Property(e => e.IsLatestVersion).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsPublic).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.InheritPermissions).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.ConfidentialityLevel).HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.PageCount);
            entity.Property(e => e.SearchableText).HasMaxLength(4000).HasColumnType("nvarchar(4000)");
            entity.Property(e => e.ExtractionStatus).HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.EncryptionKeyId).HasMaxLength(100).HasColumnType("varchar(100)");
            entity.Property(e => e.IsEncrypted).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DownloadCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.SourceSystem).HasMaxLength(100).HasColumnType("varchar(100)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // RowVersion for optimistic concurrency - database-generated timestamp
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .HasColumnType("rowversion")
                .ValueGeneratedOnAddOrUpdate();

            entity.HasIndex(e => e.DocumentGuid).IsUnique().HasDatabaseName("UQ_Document_DocumentGuid");
            entity.HasIndex(e => e.ParentDocumentId).HasDatabaseName("IX_Document_ParentDocumentId");
            entity.HasIndex(e => e.DepartmentId).HasDatabaseName("IX_Document_DepartmentId").HasFilter("[DepartmentId] IS NOT NULL");
            entity.HasIndex(e => new { e.DepartmentId, e.DepartmentEntityId }).HasDatabaseName("IX_Document_Department_Entity")
                .HasFilter("[DepartmentId] IS NOT NULL AND [DepartmentEntityId] IS NOT NULL");

            // Self-referencing FK for versioning
            entity.HasOne(d => d.ParentDocument)
                .WithMany()
                .HasForeignKey(d => d.ParentDocumentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // DocumentBinding configuration
        modelBuilder.Entity<DocumentBindingEntity>(entity =>
        {
            entity.ToTable("DocumentBinding", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentId).IsRequired();
            entity.Property(e => e.DepartmentId).IsRequired();
            entity.Property(e => e.ModuleId).IsRequired();
            entity.Property(e => e.ReferenceTableName).IsRequired().HasMaxLength(100).HasColumnType("varchar(100)");
            entity.Property(e => e.ReferenceTableId);
            entity.Property(e => e.ReferenceTableIdGuid);
            entity.Property(e => e.ReferencePropertyName).IsRequired().HasMaxLength(100).HasColumnType("varchar(100)");
            entity.Property(e => e.BindingPurpose).HasMaxLength(200).HasColumnType("varchar(200)");
            entity.Property(e => e.IsPrimaryDocument).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.Notes).HasMaxLength(1000).HasColumnType("nvarchar(1000)");
            entity.Property(e => e.AccessPermission).HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.AuthDepartmentId);
            entity.Property(e => e.AuthReferenceId);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsReferenceValid).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // RowVersion for optimistic concurrency - database-generated timestamp
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .HasColumnType("rowversion")
                .ValueGeneratedOnAddOrUpdate();

            entity.HasOne(db => db.Document)
                .WithMany(d => d.DocumentBindings)
                .HasForeignKey(db => db.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.DocumentId).HasDatabaseName("IX_DocumentBinding_DocumentId");
            entity.HasIndex(e => e.DepartmentId).HasDatabaseName("IX_DocumentBinding_DepartmentId");
            entity.HasIndex(e => e.ModuleId).HasDatabaseName("IX_DocumentBinding_ModuleId");

            entity.HasIndex(e => new { e.DepartmentId, e.ModuleId, e.ReferenceTableName, e.ReferenceTableId })
                .HasDatabaseName("IX_DocumentBinding_Reference")
                .HasFilter("[ReferenceTableId] IS NOT NULL");

            entity.HasIndex(e => new { e.DepartmentId, e.ModuleId, e.ReferenceTableName, e.ReferenceTableIdGuid })
                .HasDatabaseName("IX_DocumentBinding_ReferenceGuid")
                .HasFilter("[ReferenceTableIdGuid] IS NOT NULL");

            entity.HasIndex(e => new { e.AuthDepartmentId, e.AuthReferenceId })
                .HasDatabaseName("IX_DocumentBinding_AuthDepartment")
                .HasFilter("[AuthDepartmentId] IS NOT NULL AND [AuthReferenceId] IS NOT NULL");
        });

        // PropertyCertificate configuration
        modelBuilder.Entity<PropertyCertificateEntity>(entity =>
        {
            entity.ToTable("PropertyCertificates", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired(false);
            entity.Property(e => e.CertificateTypeId).IsRequired();
            entity.Property(e => e.CertificateNo).HasMaxLength(100).HasColumnType("nvarchar(100)");
            entity.Property(e => e.IssueDate).HasColumnName("CertificateIssueDate").HasColumnType("date");
            entity.Property(e => e.DocumentBindingId);
            entity.Property(e => e.PropertyDetailsId); // NULL = property-level, set = floor-level
            entity.Property(e => e.EntityType).HasMaxLength(10).HasColumnType("nvarchar(10)").HasDefaultValue("P");
            entity.Property(e => e.SocietyDetailId);
            entity.Property(e => e.WingDetailId);
            entity.Property(e => e.TaxApplied).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.TaxAppliedDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // RowVersion for optimistic concurrency - database-generated timestamp
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .HasColumnType("rowversion")
                .ValueGeneratedOnAddOrUpdate();

            entity.HasOne(pc => pc.CertificateType)
                .WithMany()
                .HasForeignKey(pc => pc.CertificateTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(pc => pc.DocumentBinding)
                .WithMany()
                .HasForeignKey(pc => pc.DocumentBindingId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<PropertyDetailsEntity>()
                .WithMany()
                .HasForeignKey(pc => pc.PropertyDetailsId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.PropertyId).HasDatabaseName("IX_PropertyCertificates_PropertyId");
            entity.HasIndex(e => e.CertificateTypeId).HasDatabaseName("IX_PropertyCertificates_CertificateTypeId");
            entity.HasIndex(e => e.DocumentBindingId).HasDatabaseName("IX_PropertyCertificates_DocumentBindingId")
                .HasFilter("[DocumentBindingId] IS NOT NULL");
            entity.HasIndex(e => e.PropertyDetailsId).HasDatabaseName("IX_PropertyCertificates_PropertyDetailsId")
                .HasFilter("[PropertyDetailsId] IS NOT NULL");
            entity.HasIndex(e => new { e.PropertyId, e.IsActive, e.MarkedForDeletion })
                .HasDatabaseName("IX_PropertyCertificates_Property_Active")
                .IncludeProperties(e => new { e.CertificateTypeId, e.CertificateNo, e.IssueDate, e.DocumentBindingId, e.PropertyDetailsId });
        });

        // PropertyPhoto configuration
        modelBuilder.Entity<PropertyPhotoEntity>(entity =>
        {
            entity.ToTable("PropertyPhoto", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired(false);
            entity.Property(e => e.Type).HasMaxLength(50).HasColumnType("nvarchar(50)");
            entity.Property(e => e.PhotoTypeId).IsRequired();
            entity.Property(e => e.DocumentBindingId);
            entity.Property(e => e.IsLatest).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.Remarks).HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(p => p.PhotoType)
                .WithMany()
                .HasForeignKey(p => p.PhotoTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(p => p.DocumentBinding)
                .WithMany()
                .HasForeignKey(p => p.DocumentBindingId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(p => p.WingDetail)
                .WithMany()
                .HasForeignKey(p => p.WingDetailId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.PropertyId).HasDatabaseName("IX_PropertyPhoto_PropertyId");
            entity.HasIndex(e => e.PhotoTypeId).HasDatabaseName("IX_PropertyPhoto_PhotoTypeId");
            entity.HasIndex(e => e.DocumentBindingId).HasDatabaseName("IX_PropertyPhoto_DocumentBindingId")
                .HasFilter("[DocumentBindingId] IS NOT NULL");

            // Non-unique helper index for the "current photos for a property" query.
            // NOTE: a property may have multiple photos per (PropertyId, PhotoTypeId), so this
            // is intentionally NOT unique. The DDL's UNIQUE index must be dropped in the DB.
            entity.HasIndex(e => new { e.PropertyId, e.PhotoTypeId })
                .HasDatabaseName("IX_PropertyPhoto_Property_Type_Latest")
                .IncludeProperties(e => new { e.DocumentBindingId, e.DisplayOrder, e.IsLatest })
                .HasFilter("[IsLatest] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0");

            // Shared plan lookup: one PROPERTY_PLAN row per (SocietyDetailId, PhotoTypeId, Type)
            // is resolved by every apartment unit of that Type in that society.
            entity.HasIndex(e => new { e.SocietyDetailId, e.PhotoTypeId, e.Type })
                .HasDatabaseName("IX_PropertyPhoto_Society_Type_Plan")
                .HasFilter("[IsLatest] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0 AND [SocietyDetailId] IS NOT NULL");
        });

        // rule scope configuration
        modelBuilder.Entity<RuleScopeEntity>(entity =>
        {
            entity.ToTable("RuleScopeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RuleScope).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.IsActive);
        });
        // Common RemarkType configuration
        modelBuilder.Entity<CommonRemarkTypeMasterEntity>(entity =>
        {
            entity.ToTable("CommonRemarkTypeMaster", "CORE");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RemarkTypeName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.RemarkTypeName).IsUnique().HasDatabaseName("UQ_CommonRemarkTypeMaster_RemarkTypeName");
            entity.HasIndex(e => e.IsActive);
        });
        // rule effect type configuration
        modelBuilder.Entity<RuleEffectTypeEntity>(entity =>
        {
            entity.ToTable("RuleEffectTypeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EffectType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.IsActive);

            // One-to-one relationship with EffectTypeConfiguration
            entity.HasOne(e => e.EffectTypeConfiguration)
                .WithOne(c => c.EffectType)
                .HasForeignKey<EffectTypeConfigurationEntity>(c => c.EffectTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // rule operator configuration
        modelBuilder.Entity<RuleOperatorEntity>(entity =>
        {
            entity.ToTable("RuleOperatorMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Operator).IsRequired().HasMaxLength(100);
            entity.Property(e => e.OperatorDescription).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.IsActive);
        });
        // RenterMast configuration
        modelBuilder.Entity<RenterMastEntity>(entity =>
        {
            entity.ToTable("RenterMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyDetailsId).IsRequired();
            entity.Property(e => e.RentMonthly).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.FinalYearlyRent).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.FinancialYear).HasColumnType("nvarchar(4)");
            entity.Property(e => e.DurationFrom).HasColumnType("datetime");
            entity.Property(e => e.DurationTo).HasColumnType("datetime");
            entity.Property(e => e.TaxLiability).HasColumnType("nvarchar(20)");
            entity.Property(e => e.NonCalculateRentMonthly).HasConversion(v => v.HasValue ? (decimal?)v.Value : null, v => v.HasValue ? (double?)v.Value : null).HasColumnType("decimal(18,4)");
            entity.Property(e => e.RenterNameEnglish).HasColumnType("nvarchar(500)");
            entity.Property(e => e.RenterName).HasColumnType("nvarchar(500)");
            entity.Property(e => e.AgreementDate).HasColumnType("datetime");
            entity.Property(e => e.AgreementFromDate).HasColumnType("datetime");
            entity.Property(e => e.AgreementToDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.DocumentBindingId);

            // Configure foreign key relationship
            entity.HasOne(e => e.PropertyDetails)
                .WithMany(p => p.Renters)
                .HasForeignKey(e => e.PropertyDetailsId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_RenterMast_PropertyDetails");

            entity.HasOne(e => e.DocumentBinding)
                .WithMany()
                .HasForeignKey(e => e.DocumentBindingId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_RenterMast_DocumentBinding");

            entity.HasIndex(e => e.PropertyDetailsId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.DocumentBindingId).HasDatabaseName("IX_RenterMast_DocumentBindingId")
                .HasFilter("[DocumentBindingId] IS NOT NULL");
        });

        // CommonRemarkDetails configuration
        modelBuilder.Entity<CommonRemarkDetailsEntity>(entity =>
        {
            entity.ToTable("CommonRemarkDetails", "GSMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RemarkTypeId).IsRequired();
            entity.Property(e => e.Remark).IsRequired().HasMaxLength(300);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // Foreign key relationship with CommonRemarkTypeMaster
            entity.HasOne<CommonRemarkTypeMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.RemarkTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.RemarkTypeId).HasDatabaseName("IX_CommonRemarkDetails_RemarkTypeId");
            entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_CommonRemarkDetails_IsActive");
            entity.HasIndex(e => new { e.RemarkTypeId, e.Remark })
                .IsUnique()
                .HasDatabaseName("UQ_CommonRemarkDetails_RemarkTypeId_Remark");
        });

        // PropertyMapMaster configuration
        modelBuilder.Entity<PropertyMapMasterEntity>(entity =>
        {
            entity.ToTable("PropertyMapMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ModuleId);
            entity.Property(e => e.ParentPropertyMapId);
            entity.Property(e => e.VersionNo).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.MappingCategory).IsRequired().HasMaxLength(30);
            entity.Property(e => e.ChangeReason).HasMaxLength(500);
            entity.Property(e => e.Remark).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Foreign key relationship with ModuleMaster
            entity.HasOne<ModuleMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_PropertyMapMaster_ModuleMaster");

            // Self-referencing foreign key relationship for ParentPropertyMapId
            entity.HasOne<PropertyMapMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.ParentPropertyMapId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_PropertyMapMaster_ParentPropertyMapId");

            // Indexes
            entity.HasIndex(e => e.ModuleId);
            entity.HasIndex(e => e.ParentPropertyMapId);
            entity.HasIndex(e => e.MappingCategory);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.ModuleId, e.ParentPropertyMapId, e.MappingCategory })
            .IsUnique()
            .HasDatabaseName("UQ_PropertyMapMaster_ModuleId_ParentPropertyMapId_MappingCategory");
        });
        modelBuilder.Entity<RoomTypeMasterEntity>(entity =>
        {
            entity.ToTable("RoomTypeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RoomTypeName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.RoomTypeCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.RoomTypeName).IsUnique().HasDatabaseName("UQ_RoomTypeMaster_RoomTypeName");
            entity.HasIndex(e => e.RoomTypeCode).IsUnique().HasDatabaseName("UQ_RoomTypeMaster_RoomTypeCode");
            entity.HasIndex(e => e.IsActive);
        });


        // WaterConnectionTypeMaster configuration
        modelBuilder.Entity<WaterConnectionTypeEntity>(entity =>
        {
            entity.ToTable("WaterConnectionTypeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ConnectionTypeCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ConnectionTypeName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.ConnectionTypeCode).IsUnique().HasDatabaseName("UQ_WaterConnectionTypeMaster_Code");
            entity.HasIndex(e => e.IsActive);

            // Configure relationships
            entity.HasMany(e => e.WaterConnectionMaster)
                .WithOne(r => r.WaterConnectionType)
                .HasForeignKey(r => r.WaterConnectionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.WaterRateMaster)
                .WithOne(n => n.WaterConnectionType)
                .HasForeignKey(n => n.WaterConnectionTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // WaterConnectionSizeMaster configuration
        modelBuilder.Entity<WaterConnectionSizeEntity>(entity =>
        {
            entity.ToTable("WaterConnectionSizeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ConnectionSize).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.ConnectionSizeUnit).IsRequired().HasMaxLength(20);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.IsActive);

            // Configure relationships
            entity.HasMany(e => e.WaterConnectionMaster)
                .WithOne(r => r.WaterConnectionSize)
                .HasForeignKey(r => r.WaterConnectionSizeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.WaterRateMaster)
                .WithOne(n => n.WaterConnectionSize)
                .HasForeignKey(n => n.WaterConnectionSizeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // WaterConnectionStatusMaster configuration
        modelBuilder.Entity<WaterConnectionStatusEntity>(entity =>
        {
            entity.ToTable("WaterConnectionStatusMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.StatusName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.StatusName).IsUnique().HasDatabaseName("UQ_WaterConnectionStatusMaster_Name");
            entity.HasIndex(e => e.IsActive);

            // Configure relationships
            entity.HasMany(e => e.WaterConnectionMaster)
                .WithOne(r => r.WaterConnectionStatus)
                .HasForeignKey(r => r.WaterConnectionStatusId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PropertyAssessmentStatusMaster configuration
        modelBuilder.Entity<PropertyAssessmentStatusEntity>(entity =>
        {
            entity.ToTable("PropertyAssessmentStatusMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.StatusName).IsRequired().HasMaxLength(30);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.HasIndex(e => e.StatusName).IsUnique().HasDatabaseName("UQ_PropertyAssessmentStatusMaster_StatusName");
            entity.HasIndex(e => e.IsActive);
        });

        // WaterRateMaster configuration
        modelBuilder.Entity<WaterRateMasterEntity>(entity =>
        {
            entity.ToTable("WaterRateMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.WaterConnectionTypeId).IsRequired();
            entity.Property(e => e.WaterConnectionSizeId).IsRequired();
            entity.Property(e => e.FinanceYearId).IsRequired();
            entity.Property(e => e.YearlyRate).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MonthlyRate).HasColumnType("decimal(18,2)");
            entity.Property(e => e.QuarterlyRate).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.WaterConnectionType)
                .WithMany(p => p.WaterRateMaster)
                .HasForeignKey(e => e.WaterConnectionTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.WaterConnectionSize)
                .WithMany(p => p.WaterRateMaster)
                .HasForeignKey(e => e.WaterConnectionSizeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FinanceYear)
                .WithMany()
                .HasForeignKey(e => e.FinanceYearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.WaterConnectionTypeId, e.WaterConnectionSizeId, e.FinanceYearId })
                .IsUnique()
                .HasFilter("[IsActive] = 1")
                .HasDatabaseName("UQ_WaterRateMaster_Type_Size_Year");
        });

        // WaterConnectionMaster configuration
        modelBuilder.Entity<WaterConnectionMasterEntity>(entity =>
        {
            entity.ToTable("WaterConnectionMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.WaterConnectionTypeId).IsRequired(false);
            entity.Property(e => e.WaterConnectionSizeId).IsRequired(false);
            entity.Property(e => e.WaterConnectionStatusId).IsRequired(false);
            entity.Property(e => e.ConnectionNo).HasMaxLength(50).IsRequired(false);
            entity.Property(e => e.MeterNo).HasMaxLength(50);
            entity.Property(e => e.ConnectionStartDate).HasColumnType("date").IsRequired(false);
            entity.Property(e => e.ConnectionStopDate).HasColumnType("date");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(r => r.PropertyMast)
                 .WithMany(p => p.WaterConnectionMaster)
                 .HasForeignKey(r => r.PropertyId)
                 .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.WaterConnectionType)
                .WithMany(p => p.WaterConnectionMaster)
                .HasForeignKey(e => e.WaterConnectionTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            entity.HasOne(e => e.WaterConnectionSize)
                .WithMany(p => p.WaterConnectionMaster)
                .HasForeignKey(e => e.WaterConnectionSizeId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            entity.HasOne(e => e.WaterConnectionStatus)
                .WithMany(p => p.WaterConnectionMaster)
                .HasForeignKey(e => e.WaterConnectionStatusId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            entity.HasMany(e => e.Details)
                .WithOne(d => d.WaterConnection)
                .HasForeignKey(d => d.WaterConnectionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ConnectionNo)
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [ConnectionNo] IS NOT NULL")
                .HasDatabaseName("UQ_WaterConnectionMaster_ConnectionNo");
            entity.HasIndex(e => e.PropertyId).HasDatabaseName("IX_WaterConnectionMaster_PropertyId");
            entity.HasIndex(e => e.IsActive);
        });

        // WaterConnectionDetails configuration
        modelBuilder.Entity<WaterConnectionDetailsEntity>(entity =>
        {
            entity.ToTable("WaterConnectionDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.WaterConnectionId).IsRequired();
            entity.Property(e => e.FinanceYearId).IsRequired();
            entity.Property(e => e.BillDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.FromDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.ToDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.ChargeMonths).IsRequired();
            entity.Property(e => e.YearlyRate).HasColumnType("decimal(18,2)");
            entity.Property(e => e.WaterBill).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.FinanceYear)
                .WithMany()
                .HasForeignKey(e => e.FinanceYearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.WaterConnection)
                .WithMany(p => p.Details)
                .HasForeignKey(e => e.WaterConnectionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.WaterConnectionId, e.FinanceYearId })
                .IsUnique()
                .HasDatabaseName("UQ_WaterConnectionDetails_Connection_Year");
            entity.HasIndex(e => e.WaterConnectionId).HasDatabaseName("IX_WaterConnectionDetails_ConnectionId");
        });

        modelBuilder.Entity<BulkUpdateMasterEntity>(entity =>
        {
            entity.ToTable("BulkUpdateMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.UpdateCode).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.UpdateName).IsRequired().HasMaxLength(200).HasColumnName("GroupName");
            entity.Property(e => e.ReferenceTableName).HasMaxLength(200).IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()").ValueGeneratedOnAdd();
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.HasIndex(e => e.UpdateCode).IsUnique().HasDatabaseName("UQ_BulkUpdateMaster_UpdateCode");
            entity.HasMany(e => e.FieldConfigs)
                .WithOne(fc => fc.Master)
                .HasForeignKey(fc => fc.BulkUpdateMasterId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BulkUpdateFieldConfigEntity>(entity =>
        {
            entity.ToTable("BulkUpdateFieldConfig", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(200).IsUnicode(false);
            entity.Property(e => e.DisplayName).HasMaxLength(200).IsUnicode(false);
            entity.Property(e => e.ControlType).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.DataType).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.Placeholder).HasMaxLength(500);
            entity.Property(e => e.SequenceNo).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.ValidationRegex).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.DefaultValue).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.BindApi).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.ApiResponse).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()").ValueGeneratedOnAdd();
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.HasIndex(e => e.BulkUpdateMasterId).HasDatabaseName("IX_BulkUpdateFieldConfig_BulkUpdateMasterId");
        });

        modelBuilder.Entity<BulkUpdateActivityEntity>(entity =>
        {
            entity.ToTable("BulkUpdateActivity", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ActivityType).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.ActivityStatus).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.DateAndTime).IsRequired().HasColumnName("CreatedDateTime").HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.Records).HasColumnName("RecordCount");
            entity.Property(e => e.IPAddress).HasColumnName("ClientIpAddress").HasMaxLength(100);
            entity.Property(e => e.Remarks).HasMaxLength(1000);
            entity.Property(e => e.UpdateName).HasColumnName("GroupName").HasMaxLength(200);
            entity.Property(e => e.DoneBy).HasColumnName("ExecutedBy").HasMaxLength(200);
            entity.Property(e => e.StartTime).HasColumnName("StartDateTime").HasColumnType("datetime");
            entity.Property(e => e.EndTime).HasColumnName("EndDateTime").HasColumnType("datetime");
            entity.Property(e => e.Duration).HasColumnName("DurationInSeconds");
            entity.Property(e => e.ActivityRemark).HasMaxLength(1000);
        });

        modelBuilder.Entity<BulkUpdateHistoryEntity>(entity =>
        {
            entity.ToTable("BulkUpdateHistory", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ActivityId).HasColumnName("ActivityID").IsRequired();
            entity.Property(e => e.BulkUpdateMasterId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.OldValue).HasMaxLength(4000);
            entity.Property(e => e.NewValue).HasMaxLength(4000);
            entity.Property(e => e.UpdatedColumns).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.HasOne<BulkUpdateMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.BulkUpdateMasterId)
                .HasConstraintName("FK_BulkUpdateHistory_BulkUpdateMaster")
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<BulkUpdateActivityEntity>()
                .WithMany()
                .HasForeignKey(e => e.ActivityId)
                .HasConstraintName("FK_BulkUpdateHistory_BulkUpdateActivity")
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.BulkUpdateMasterId).HasDatabaseName("IX_BulkUpdateHistory_BulkUpdateMasterId");
            entity.HasIndex(e => e.PropertyId).HasDatabaseName("IX_BulkUpdateHistory_PropertyId");
            entity.HasIndex(e => e.ActivityId).HasDatabaseName("IX_BulkUpdateHistory_ActivityID");
        });

        modelBuilder.Entity<PropertyTaxJobEntity>(entity =>
        {
            entity.ToTable("PropertyTaxJob", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UpdatedDate).IsConcurrencyToken();

            entity.Property(e => e.JobCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.Operation).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.FinanceYearId).IsRequired().HasColumnName("FinanceYearId");
            entity.Property(e => e.ScopeType).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.ScopeParamsJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.ScopeDescription).HasMaxLength(500);

            entity.Property(e => e.StartedByUserId).IsRequired();
            entity.Property(e => e.StartedByUserName).HasMaxLength(200);
            entity.Property(e => e.UserRole).HasMaxLength(100);

            entity.Property(e => e.StartTime).HasColumnType("datetime").IsRequired();
            entity.Property(e => e.CompleteTime).HasColumnType("datetime");
            entity.Property(e => e.DurationMs);

            entity.Property(e => e.RecordsSelected).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.RecordsProcessed).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.SuccessCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.SkippedCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.FailedCount).IsRequired().HasDefaultValue(0);

            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.Property(e => e.Remarks).HasMaxLength(1000);

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.JobCode).HasDatabaseName("UX_PropertyTaxJob_JobCode_Active").HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.FinanceYearId, e.Operation }).HasDatabaseName("IX_PropertyTaxJob_FinanceYearId_Operation");
            entity.HasIndex(e => e.Status).HasDatabaseName("IX_PropertyTaxJob_Status");

            entity.HasOne(e => e.FinanceYear)
                .WithMany()
                .HasForeignKey(e => e.FinanceYearId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PropertyTaxJobDetailEntity>(entity =>
        {
            entity.ToTable("PropertyTaxJobDetail", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.JobId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();

            entity.Property(e => e.PropertyNo).HasMaxLength(10);
            entity.Property(e => e.TaxHead).HasMaxLength(500);
            entity.Property(e => e.Amount).HasColumnType("money");

            entity.Property(e => e.ExecutionStartTime).HasColumnType("datetime");
            entity.Property(e => e.ExecutionEndTime).HasColumnType("datetime");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.SkipReason).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.Message).HasMaxLength(2000);

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne<PropertyTaxJobEntity>()
                .WithMany()
                .HasForeignKey(e => e.JobId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<PropertyEntity>()
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.JobId).HasDatabaseName("IX_PropertyTaxJobDetail_JobId");
            entity.HasIndex(e => e.PropertyId).HasDatabaseName("IX_PropertyTaxJobDetail_PropertyId");
            entity.HasIndex(e => new { e.JobId, e.Status }).HasDatabaseName("IX_PropertyTaxJobDetail_JobId_Status");
        });

        modelBuilder.Entity<PropertyMediaJobEntity>(entity =>
        {
            entity.ToTable("PropertyMediaJob", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UpdatedDate).IsConcurrencyToken();

            entity.Property(e => e.JobCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.Operation).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.SourceBatchKey).HasMaxLength(200);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.Property(e => e.Remarks).HasMaxLength(1000);

            entity.Property(e => e.StartTime).HasColumnType("datetime");
            entity.Property(e => e.CompleteTime).HasColumnType("datetime");

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.JobCode)
                .IsUnique()
                .HasDatabaseName("UX_PropertyMediaJob_JobCode");
            entity.HasIndex(e => e.PhotoTypeId)
                .HasDatabaseName("IX_PropertyMediaJob_PhotoTypeId");
            entity.HasIndex(e => new { e.Status, e.CreatedDate, e.Id })
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("IX_PropertyMediaJob_Status_Queue");

            entity.HasOne(e => e.PhotoType)
                .WithMany()
                .HasForeignKey(e => e.PhotoTypeId)
                .HasConstraintName("FK_PropertyMediaJob_PropertyPhotoType")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PropertyMediaJobDetailEntity>(entity =>
        {
            entity.ToTable("PropertyMediaJobDetail", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.JobId).IsRequired();
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(260);
            entity.Property(e => e.WardNo).HasMaxLength(20);
            entity.Property(e => e.PropertyNo).HasMaxLength(20);
            entity.Property(e => e.PartitionNo).HasMaxLength(20);
            entity.Property(e => e.Suffix).HasMaxLength(10);

            entity.Property(e => e.ExecutionStartTime).HasColumnType("datetime");
            entity.Property(e => e.ExecutionEndTime).HasColumnType("datetime");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.SkipReason).HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.Message).HasMaxLength(2000);

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne<PropertyMediaJobEntity>()
                .WithMany()
                .HasForeignKey(e => e.JobId)
                .HasConstraintName("FK_PropertyMediaJobDetail_PropertyMediaJob")
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<PropertyEntity>()
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .HasConstraintName("FK_PropertyMediaJobDetail_PropertyMast")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<PropertyPhotoEntity>()
                .WithMany()
                .HasForeignKey(e => e.PropertyPhotoId)
                .HasConstraintName("FK_PropertyMediaJobDetail_PropertyPhoto")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.JobId, e.FileName })
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("UX_PropertyMediaJobDetail_Job_File_Active");
            entity.HasIndex(e => e.JobId).HasDatabaseName("IX_PropertyMediaJobDetail_JobId");
            entity.HasIndex(e => new { e.JobId, e.Status })
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("IX_PropertyMediaJobDetail_Job_Status");
            entity.HasIndex(e => e.PropertyId)
                .HasFilter("[PropertyId] IS NOT NULL")
                .HasDatabaseName("IX_PropertyMediaJobDetail_PropertyId");
            entity.HasIndex(e => e.PropertyPhotoId)
                .HasFilter("[PropertyPhotoId] IS NOT NULL")
                .HasDatabaseName("IX_PropertyMediaJobDetail_PropertyPhotoId");
        });


        // ApplyTaxesMaster configuration
        modelBuilder.Entity<ApplyTaxesMasterEntity>(entity =>
        {
            entity.ToTable("ApplyTaxesMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.TaxId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.ApplyTaxesMaster)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
            entity.HasIndex(e => new { e.PropertyId, e.TaxId })
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("UQ_ApplyTaxesMaster_PropertyId_TaxId");
        });

        // PropertyAssessmentDetails configuration
        modelBuilder.Entity<PropertyAssessmentDetailsEntity>(entity =>
        {
            entity.ToTable("PropertyAssessmentDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.PropertyAssessmentDetails)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
        });


        // PropertyTaxCalculationSection129Results configuration
        modelBuilder.Entity<PropertyTaxCalculationSection129ResultsEntity>(entity =>
        {
            entity.ToTable("PropertyTaxCalculationSection129Results", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.PropertyDetailsId).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.MarkedForDeletion);
            entity.Property(e => e.MarkedForDeletionDate);

            entity.HasOne(e => e.PropertyDetails)
                .WithMany(p => p.PropertyTaxCalculationSection129Results)
                .HasForeignKey(e => e.PropertyDetailsId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.PropertyTaxCalculationSection129Results)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyDetailsId);
            entity.HasIndex(e => e.PropertyId);
        });

        // PropertyImagesMast configuration
        modelBuilder.Entity<PropertyImagesMastEntity>(entity =>
        {
            entity.ToTable("PropertyImagesMast", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.PropertyImagesMast)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
        });

        // TransMastArchive configuration
        modelBuilder.Entity<TransMastArchiveEntity>(entity =>
        {
            entity.ToTable("TransMastArchive", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.TransMastArchive)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
        });

        // TransMastLookup configuration
        modelBuilder.Entity<TransMastLookupEntity>(entity =>
        {
            entity.ToTable("TransMastLookup", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.TransMastLookup)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
        });

        //Asset Inventory Item Category configuration
        modelBuilder.Entity<AssetCategoryEntity>(entity =>
        {
            entity.ToTable("AssetCategoryMaster", "AMS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).ValueGeneratedOnAdd();


            entity.Property(x => x.CategoryCode).IsRequired().HasMaxLength(100);
            entity.Property(x => x.CategoryName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate).HasColumnType("datetime");
            entity.Property(x => x.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(x => x.MarkedForDeletionDate).HasColumnType("datetime");

            // ValueGeneratedNever prevents EF from treating an explicit "false" the same as "unset" and
            // omitting the column from the INSERT -- the live AssetCategoryMaster table has no DB-level
            // default constraint on these columns (unlike IsActive/MarkedForDeletion above), so a false
            // sent by the client was being dropped from the INSERT and hitting the NOT NULL constraint.
            entity.Property(x => x.IsMovable).IsRequired().HasDefaultValue(false).ValueGeneratedNever();
            entity.Property(x => x.HasFloorDetails).IsRequired().HasDefaultValue(false).ValueGeneratedNever();
            entity.Property(x => x.HasInventory).IsRequired().HasDefaultValue(false).ValueGeneratedNever();
            entity.Property(x => x.IsInventoryMandatory).IsRequired().HasDefaultValue(false).ValueGeneratedNever();
            entity.Property(x => x.HasLegalCompliance).IsRequired().HasDefaultValue(false).ValueGeneratedNever();
            entity.Property(x => x.ValuationType).IsRequired().HasMaxLength(20).HasDefaultValue("GENERIC");

            entity.HasIndex(e => e.CategoryName).IsUnique().HasDatabaseName("UQ_AssetCategoryMaster_CategoryName");
            entity.HasIndex(e => e.CategoryCode).IsUnique().HasDatabaseName("UQ_AssetCategoryMaster_CategoryCode");
        });
        modelBuilder.Entity<AssetTypeEntity>(entity =>
        {
            entity.ToTable("AssetTypeMaster", "AMS");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).ValueGeneratedOnAdd(); // Identity column

            entity.Property(x => x.TypeCode).IsRequired().HasMaxLength(50);
            entity.Property(x => x.TypeName).IsRequired().HasMaxLength(200);
            entity.Property(x => x.TypeNameLocal).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(500);

            entity.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(x => x.CreatedBy);
            entity.Property(x => x.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedBy);
            entity.Property(x => x.UpdatedDate).HasColumnType("datetime");
            entity.Property(x => x.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(x => x.MarkedForDeletionDate).HasColumnType("datetime");

            // Unique constraints
            entity.HasIndex(e => e.TypeCode).IsUnique().HasDatabaseName("UQ_AssetTypeMaster_TypeCode");
            entity.HasIndex(e => e.TypeName).IsUnique().HasDatabaseName("UQ_AssetTypeMaster_TypeName");

            // Configure foreign key relationship to AssetCategoryEntity
            entity.HasOne<AssetCategoryEntity>()
                .WithMany()
                .HasForeignKey(x => x.AssetCategoryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AssetTypeMaster_AssetCategoryMaster");
        });

        modelBuilder.Entity<AssetDesignationEntity>(entity =>
        {
            entity.ToTable("DesignationMaster", "AMS");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.OwningDepartmentId).IsRequired();
            entity.Property(e => e.DesignationCode).HasMaxLength(50).IsRequired().IsUnicode(false);
            entity.Property(e => e.DesignationName).HasMaxLength(100).IsRequired().IsUnicode(false);
            entity.Property(e => e.DesignationLocal).HasMaxLength(150);
            entity.Property(e => e.DesignationDescription).HasMaxLength(250);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasIndex(e => e.DesignationCode)
                .IsUnique()
                .HasDatabaseName("UQ_DesignationMaster_DesignationCode");

            entity.HasIndex(e => e.DesignationName)
                .IsUnique()
                .HasDatabaseName("UQ_DesignationMaster_DesignationName");

            entity.HasOne<OwningDepartmentEntity>()
                .WithMany()
                .HasForeignKey(e => e.OwningDepartmentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_DesignationMaster_OwningDepartmentMaster");
        });

        modelBuilder.Entity<AssetApplicationTypeEntity>(entity =>
        {
            entity.ToTable("ApplicationTypeMaster", "AMS");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ApplicationTypeCode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ApplicationTypeName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasIndex(e => e.ApplicationTypeCode)
                .IsUnique()
                .HasDatabaseName("UQ_ApplicationTypeMaster_Code");

            entity.HasIndex(e => e.ApplicationTypeName)
                .IsUnique()
                .HasDatabaseName("UQ_ApplicationTypeMaster_Name");
        });

        modelBuilder.Entity<OwningDepartmentEntity>(entity =>
        {
            entity.ToTable("OwningDepartmentMaster", "AMS");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.OwningDepartmentName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(e => e.IsActive).IsRequired();

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            // Unique constraint on OwningDepartmentName
            entity.HasIndex(e => e.OwningDepartmentName)
                .IsUnique()
                .HasDatabaseName("UQ_OwningDepartmentMaster_OwningDepartmentName");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<UserOwningDepartmentAllocationEntity>(entity =>
        {
            entity.ToTable("UserOwningDepartmentAllocation", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.OwningDepartmentId).IsRequired();
            entity.Property(e => e.DesignationId);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasIndex(e => new { e.UserId, e.OwningDepartmentId })
                .IsUnique()
                .HasDatabaseName("UQ_UserOwningDepartmentAllocation_User_OwningDepartment");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UserOwningDepartmentAllocation_UserMaster");

            entity.HasOne<OwningDepartmentEntity>()
                .WithMany()
                .HasForeignKey(e => e.OwningDepartmentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UserOwningDepartmentAllocation_OwningDepartmentMaster");

            entity.HasOne<AssetDesignationEntity>()
                .WithMany()
                .HasForeignKey(e => e.DesignationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UserOwningDepartmentAllocation_DesignationMaster");
        });

        modelBuilder.Entity<UserZoneAllocationEntity>(entity =>
        {
            entity.ToTable("UserZoneAllocation", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.ZoneId).IsRequired();
            entity.Property(e => e.WardId).IsRequired();

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            // One row per allocated ward: a whole zone is stored as one row per ward of that zone.
            entity.HasIndex(e => new { e.UserId, e.ZoneId, e.WardId })
                .IsUnique()
                .HasDatabaseName("UQ_UserZoneAllocation_User_Zone_Ward");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UserZoneAllocation_UserMaster");

            entity.HasOne<ZoneEntity>()
                .WithMany()
                .HasForeignKey(e => e.ZoneId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UserZoneAllocation_ZoneMaster");

            // Single-column FK (WardId -> WardMaster.Id), as in SQL Server: that the ward belongs to the row's
            // zone is enforced by AssetUserAllocationService, not by the database.
            entity.HasOne<WardEntity>()
                .WithMany()
                .HasForeignKey(e => e.WardId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UserZoneAllocation_WardMaster");
        });

        modelBuilder.Entity<EducationTaxMasterEntity>(entity =>
        {
            entity.ToTable("EducationTaxMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.Year);
            entity.Property(e => e.MinAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18,2)");
            entity.Property(e => e.OnRVOrALV).HasMaxLength(10);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
        });
        modelBuilder.Entity<EmploymentTaxMasterEntity>(entity =>
        {
            entity.ToTable("EmploymentTaxMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.Year);
            entity.Property(e => e.MinAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18,2)");
            entity.Property(e => e.OnRVOrALV).HasMaxLength(10);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
        });

        modelBuilder.Entity<OwnershipTypeEntity>(entity =>
        {
            entity.ToTable("OwnershipTypeMaster", "AMS");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.OwnershipTypeName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(e => e.IsActive).IsRequired();

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);

            // Unique constraint on OwnershipTypeName
            entity.HasIndex(e => e.OwnershipTypeName)
                .IsUnique()
                .HasDatabaseName("UQ_OwnershipTypeMaster_OwnershipTypeName");

            entity.Property(e => e.IsActive).HasDefaultValue(true);


        });
        //Asset Inventory Item Category configuration
        modelBuilder.Entity<InventoryItemCategoryEntity>(entity =>
        {
            entity.ToTable("InventoryItemCategoryMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetCategoryId).IsRequired();
            entity.Property(e => e.TypeCode).IsRequired().HasMaxLength(20).IsUnicode(false).HasColumnType("varchar(20)");
            entity.Property(e => e.TypeName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DepreciationRate).HasPrecision(5, 4).HasDefaultValue(0.10m);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            // UQ_InventoryItemCategoryMaster_TypeCode / _TypeName in the live DB are plain UNIQUE
            // CONSTRAINTs, NOT filtered on MarkedForDeletion -- a row that's only marked-for-deletion
            // (pending the nightly HardDeleteCleanupService purge) still physically occupies its
            // TypeCode/TypeName. Same reasoning as TransMastEntity's UQ_TransMast_Property_Year_CalculationType_Tax
            // above. InventoryItemCategoryService.CheckDuplicateAsync must NOT exclude MarkedForDeletion
            // rows from the duplicate check, or app-level validation would pass while the DB rejects the insert.
            entity.HasIndex(e => e.TypeCode).IsUnique().HasDatabaseName("UQ_InventoryItemCategoryMaster_TypeCode");
            entity.HasIndex(e => e.TypeName).IsUnique().HasDatabaseName("UQ_InventoryItemCategoryMaster_TypeName");
            entity.HasIndex(e => e.IsActive);

            // Live DB has AssetCategoryId int NOT NULL with FK_InventoryItemCategoryMaster_AssetCategory --
            // this column was missing from the entity/DTOs entirely, which is why every Create request
            // failed with a raw NOT NULL violation swallowed into a generic 500.
            entity.HasOne<AssetCategoryEntity>()
                .WithMany()
                .HasForeignKey(e => e.AssetCategoryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_InventoryItemCategoryMaster_AssetCategory");
        });

        modelBuilder.Entity<InventoryItemNameEntity>(entity =>
        {
            entity.ToTable("InventoryItemNameMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.InventoryItemCategoryId).IsRequired();
            entity.Property(e => e.SubTypeCode).HasMaxLength(50);
            entity.Property(e => e.SubTypeName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Indexes for performance
            entity.HasIndex(e => e.InventoryItemCategoryId);
            entity.HasIndex(e => e.SubTypeCode);
            entity.HasIndex(e => e.SubTypeName);
            entity.HasIndex(e => e.IsActive);

            // Explicit foreign key relationship
            entity.HasOne<InventoryItemCategoryEntity>()
                  .WithMany()
                  .HasForeignKey(e => e.InventoryItemCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InventoryItemModelEntity>(entity =>
        {
            entity.ToTable("InventoryItemModelMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.InventoryItemNameId).IsRequired();
            entity.Property(e => e.ModelName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Indexes for performance
            entity.HasIndex(e => e.InventoryItemNameId);
            entity.HasIndex(e => e.ModelName);
            entity.HasIndex(e => e.IsActive);

            // Explicit foreign key relationship
            entity.HasOne<InventoryItemNameEntity>()
                  .WithMany()
                  .HasForeignKey(e => e.InventoryItemNameId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<ScreenEntity>(entity =>
        {
            entity.ToTable("ScreenMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ScreenName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ScreenCode).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.ScreenCode).IsUnique();
            entity.Property(e => e.ScreenNameLocal).HasMaxLength(200);
            entity.Property(e => e.ScreenIcon).HasMaxLength(100);
            entity.Property(e => e.RoutePath).HasMaxLength(500);
            entity.Property(e => e.BaseRoutePath).HasMaxLength(500);
            entity.Property(e => e.RouteParamPattern).HasMaxLength(500);
            entity.Property(e => e.Purpose).HasMaxLength(100);
            entity.Property(e => e.ComponentName).HasMaxLength(200);
            entity.Property(e => e.AreaName).HasMaxLength(200);
            entity.Property(e => e.ControllerName).HasMaxLength(200);
            entity.Property(e => e.ActionName).HasMaxLength(200);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsAuthenticationRequired).HasDefaultValue(true);
            entity.Property(e => e.IsMenuVisible).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Foreign key: ParentScreenId (self-reference)
            entity.HasOne<ScreenEntity>()
                .WithMany()
                .HasForeignKey(e => e.ParentScreenId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ParentScreenId);
        });

        modelBuilder.Entity<ScreenFormSectionMasterEntity>(entity =>
        {
            entity.ToTable("ScreenFormSectionMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SectionType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SectionName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.SectionNameLocal).HasMaxLength(200);
            entity.Property(e => e.SectionCode).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DisplayOrder).IsRequired();
            entity.Property(e => e.ColumnCount).IsRequired().HasDefaultValue(2);
            entity.Property(e => e.IsOptional).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsCollapsible).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsCollapsedByDefault).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsRepeatable).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Foreign key: ScreenId
            entity.HasOne<ScreenEntity>()
                .WithMany()
                .HasForeignKey(e => e.ScreenId)
                .OnDelete(DeleteBehavior.Restrict);

            // Foreign key: ParentSectionId (self-reference)
            entity.HasOne<ScreenFormSectionMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.ParentSectionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.ScreenId, e.SectionCode }).IsUnique();
            entity.HasIndex(e => e.ScreenId);
            entity.HasIndex(e => e.ParentSectionId);
        });
        modelBuilder.Entity<ScreenFormFieldMasterEntity>(entity =>
        {
            entity.ToTable("ScreenFormFieldMaster", "AMS");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.FieldLabel).IsRequired().HasMaxLength(200);
            entity.Property(e => e.FieldLabelLocal).HasMaxLength(200);
            entity.Property(e => e.FieldCode).IsRequired().HasMaxLength(200);
            entity.Property(e => e.DataType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ControlType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Placeholder).HasMaxLength(300);
            entity.Property(e => e.DefaultValue).HasMaxLength(500);
            entity.Property(e => e.DisplayOrder).IsRequired();
            entity.Property(e => e.ColumnSpan).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.CssClass).HasMaxLength(200);
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsReadonly).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsVisible).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsUnique).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MinValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MaxValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.RegexPattern).HasMaxLength(500);
            entity.Property(e => e.ValidationMessage).HasMaxLength(500);
            entity.Property(e => e.StaticOptionsJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.IsCascading).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsMultiSelect).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.VisibilityConditionJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.ValidationJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.ExtraConfigJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.IsSearchable).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsFilterable).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Foreign key: ScreenId
            entity.HasOne<ScreenEntity>()
                .WithMany()
                .HasForeignKey(e => e.ScreenId)
                .OnDelete(DeleteBehavior.Restrict);

            // Foreign key: SectionId
            entity.HasOne<ScreenFormSectionMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.SectionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Foreign key: ParentFieldId (self-reference)
            entity.HasOne<ScreenFormFieldMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.ParentFieldId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.ScreenId, e.FieldCode }).IsUnique();
            entity.HasIndex(e => e.ScreenId);
            entity.HasIndex(e => e.SectionId);
            entity.HasIndex(e => e.ParentFieldId);
        });

        modelBuilder.Entity<SocialAttributeEntity>(entity =>
        {
            entity.ToTable("SocialAttributeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.SocialAttributeCode).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SocialAttributeName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.DataType).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.ParentAttributeId);
            entity.Property(e => e.IsRequiredWhenParentTrue).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsDiscountApplicable).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.PhotoTypeId);
            entity.Property(e => e.IsPhotoRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsDocumentRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
        });


        modelBuilder.Entity<PropertySocialDetailsEntity>(entity =>
        {
            entity.ToTable("PropertySocialDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.PropertyId);
            entity.Property(e => e.SocialAttributeId).IsRequired();
            entity.Property(e => e.WingDetailId);
            entity.Property(e => e.SocietyDetailId);
            entity.Property(e => e.BitValue);
            entity.Property(e => e.IntValue);
            entity.Property(e => e.DecimalValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TextValue).HasMaxLength(500);
            entity.Property(e => e.DateValue);
            entity.Property(e => e.DocumentBindingId);
            entity.Property(e => e.Remark).HasMaxLength(500);
            entity.Property(e => e.EntityType).HasMaxLength(100).IsRequired(false);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);



            // Configure relationships
            entity.HasOne(e => e.PropertyMast)
                .WithMany(p => p.PropertySocialDetails)
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SocialAttribute)
                .WithMany()
                .HasForeignKey(e => e.SocialAttributeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DocumentBinding)
                .WithMany()
                .HasForeignKey(e => e.DocumentBindingId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.WingDetailsMast)
                .WithMany()
                .HasForeignKey(e => e.WingDetailId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SocietyDetailsMast)
                .WithMany()
                .HasForeignKey(e => e.SocietyDetailId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
            entity.HasIndex(e => e.SocialAttributeId);
            entity.HasIndex(e => e.DocumentBindingId).HasDatabaseName("IX_PropertySocialDetails_DocumentBindingId");
            entity.HasIndex(e => new { e.PropertyId, e.SocialAttributeId }).IsUnique().HasDatabaseName("UX_PropertySocialDetails_Property_SocialAttribute").HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0");
        });

        modelBuilder.Entity<PolicyMastEntity>(entity =>
        {
            entity.ToTable("PolicyMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.PolicyCode).HasMaxLength(50);
            entity.Property(e => e.PolicyName).HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
        });

        modelBuilder.Entity<PolicyConditionDetailsEntity>(entity =>
        {
            entity.ToTable("PolicyConditionDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.LogicalOperator).IsRequired().HasMaxLength(10).IsUnicode(false);
            entity.Property(e => e.ParameterName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.ComparisonOperator).IsRequired().HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.Value1).HasMaxLength(250);
            entity.Property(e => e.Value2).HasMaxLength(250);
            entity.Property(e => e.CompareParameterName).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.MultiplierValue).HasColumnType("decimal(18,6)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.HasIndex(e => e.PolicyId).HasDatabaseName("IX_PolicyConditionDetails_PolicyId");

            entity.HasOne(e => e.Policy)
                .WithMany(p => p.PolicyConditionDetails)
                .HasForeignKey(e => e.PolicyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PropertySocialDocumentEntity>(entity =>
        {
            entity.ToTable("PropertySocialDocument", "PTIS");
            entity.HasKey(e => e.Id).HasName("PK_PropertySocialDocument");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertySocialDetailsId).IsRequired();
            entity.Property(e => e.DocumentBindingId);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.PropertySocialDetails)
                .WithMany(p => p.PropertySocialDocuments)
                .HasForeignKey(e => e.PropertySocialDetailsId)
                .HasConstraintName("FK_PropertySocialDocument_PropertySocialDetails")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DocumentBinding)
                .WithMany()
                .HasForeignKey(e => e.DocumentBindingId)
                .HasConstraintName("FK_PropertySocialDocument_DocumentBinding")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.PropertySocialDetailsId, e.DocumentBindingId })
                .IsUnique()
                .HasDatabaseName("UQ_PropertySocialDocument_PropertySocialDetails_DocumentBinding");
        });

        // rule operator configuration
        modelBuilder.Entity<RulesFieldEntity>(entity =>
        {
            entity.ToTable("RulesFieldMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FieldType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DatabaseColumnName).HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.IsActive);

            // One-to-one relationship with FieldConfiguration
            entity.HasOne(e => e.FieldConfiguration)
                .WithOne(c => c.RulesField)
                .HasForeignKey<FieldConfigurationEntity>(c => c.RulesFieldId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // RuleScopeFieldMapping configuration
        modelBuilder.Entity<RuleScopeFieldMappingEntity>(entity =>
        {
            entity.ToTable("RuleScopeFieldMapping", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RuleScopeId);
            entity.Property(e => e.RulesFieldId);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // Foreign key relationships
            entity.HasOne<RuleScopeEntity>()
                .WithMany()
                .HasForeignKey(e => e.RuleScopeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<RulesFieldEntity>()
                .WithMany()
                .HasForeignKey(e => e.RulesFieldId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(e => e.RuleScopeId);
            entity.HasIndex(e => e.RulesFieldId);
            entity.HasIndex(e => e.IsActive);
        });

        // FieldConfiguration configuration
        modelBuilder.Entity<FieldConfigurationEntity>(entity =>
        {
            entity.ToTable("FieldConfiguration", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            // Required fields
            entity.Property(e => e.RulesFieldId).IsRequired();
            entity.Property(e => e.DataType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.InputType).IsRequired().HasMaxLength(50);
            // API Configuration
            entity.Property(e => e.HasApiSource).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ApiEndpoint).HasMaxLength(500);
            entity.Property(e => e.ApiMethod).HasMaxLength(10);
            entity.Property(e => e.ApiParameters).HasColumnType("nvarchar(max)");
            entity.Property(e => e.ApiResponseMapping).HasColumnType("nvarchar(max)");
            // Static Value Configuration
            entity.Property(e => e.HasStaticValues).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.StaticValuesJson).HasColumnType("nvarchar(max)");
            // Validation & Default Configuration
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DefaultValue).HasMaxLength(255);
            entity.Property(e => e.ValidationRegex).HasMaxLength(500);
            entity.Property(e => e.MinValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.MaxValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.MinLength);
            entity.Property(e => e.MaxLength);
            // Audit Fields
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
        });

        // rule operator configuration
        modelBuilder.Entity<RulesFieldEntity>(entity =>
        {
            entity.ToTable("RulesFieldMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FieldType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DatabaseColumnName).HasMaxLength(100);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => e.IsActive);
        });

        // RuleScopeFieldMapping configuration
        modelBuilder.Entity<RuleScopeFieldMappingEntity>(entity =>
        {
            entity.ToTable("RuleScopeFieldMapping", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RuleScopeId);
            entity.Property(e => e.RulesFieldId);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // Foreign key relationships
            entity.HasOne<RuleScopeEntity>()
                .WithMany()
                .HasForeignKey(e => e.RuleScopeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<RulesFieldEntity>()
                .WithMany()
                .HasForeignKey(e => e.RulesFieldId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(e => e.RuleScopeId);
            entity.HasIndex(e => e.RulesFieldId);
            entity.HasIndex(e => e.IsActive);
        });

        // FieldConfiguration configuration
        modelBuilder.Entity<FieldConfigurationEntity>(entity =>
        {
            entity.ToTable("FieldConfiguration", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            // Required fields
            entity.Property(e => e.RulesFieldId).IsRequired();
            entity.Property(e => e.DataType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.InputType).IsRequired().HasMaxLength(50);
            // API Configuration
            entity.Property(e => e.HasApiSource).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ApiEndpoint).HasMaxLength(500);
            entity.Property(e => e.ApiMethod).HasMaxLength(10);
            entity.Property(e => e.ApiParameters).HasColumnType("nvarchar(max)");
            entity.Property(e => e.ApiResponseMapping).HasColumnType("nvarchar(max)");
            // Static Value Configuration
            entity.Property(e => e.HasStaticValues).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.StaticValuesJson).HasColumnType("nvarchar(max)");
            // Validation & Default Configuration
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DefaultValue).HasMaxLength(255);
            entity.Property(e => e.ValidationRegex).HasMaxLength(500);
            entity.Property(e => e.MinValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.MaxValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.MinLength);
            entity.Property(e => e.MaxLength);
            // Audit Fields
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // Foreign key relationship — one-to-one: one RulesField has one FieldConfiguration
            entity.HasOne(e => e.RulesField)
                .WithOne(r => r.FieldConfiguration)
                .HasForeignKey<FieldConfigurationEntity>(e => e.RulesFieldId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(e => e.IsActive);
        });

        // EffectTypeConfiguration configuration
        modelBuilder.Entity<EffectTypeConfigurationEntity>(entity =>
        {
            entity.ToTable("EffectTypeConfiguration", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            // Required fields
            entity.Property(e => e.EffectTypeId).IsRequired();
            entity.Property(e => e.DataType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.InputType).IsRequired().HasMaxLength(50);
            // API Configuration
            entity.Property(e => e.HasApiSource).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ApiEndpoint).HasMaxLength(500);
            entity.Property(e => e.ApiMethod).HasMaxLength(10);
            entity.Property(e => e.ApiParameters).HasColumnType("nvarchar(max)");

            // Static API Configuration
            entity.Property(e => e.StaticApiEndpoint).HasMaxLength(500);
            entity.Property(e => e.StaticApiInputType).HasMaxLength(500);
            entity.Property(e => e.StaticApiMethod).HasMaxLength(500);
            entity.Property(e => e.StaticApiParamter).HasMaxLength(500);
            entity.Property(e => e.StaticApiResponseMapping).HasMaxLength(500);
            // Static Value Configuration
            entity.Property(e => e.HasStaticValues).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.StaticValuesJson).HasColumnType("nvarchar(max)");
            // Validation & Default Configuration
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DefaultValue).HasMaxLength(255);
            entity.Property(e => e.ValidationRegex).HasMaxLength(500);
            entity.Property(e => e.MinValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.MaxValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.MinLength);
            entity.Property(e => e.MaxLength);
            entity.Property(e => e.ExpressionTemplate).HasMaxLength(500);
            // Audit Fields
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // Unique constraint on EffectTypeId
            entity.HasIndex(e => e.EffectTypeId).IsUnique().HasDatabaseName("UQ_EffectTypeConfiguration_EffectTypeId");
            // Indexes for performance
            entity.HasIndex(e => e.IsActive);
        });

        // RuleEngineMaster configuration
        modelBuilder.Entity<RuleEngineEntity>(entity =>
        {
            entity.ToTable("RuleEngineMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            // Required fields
            entity.Property(e => e.RuleCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.RuleName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.RuleCategory).HasMaxLength(100);
            entity.Property(e => e.RuleJson).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.ConditionsJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.EffectJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.TargetFiltersJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Priority).IsRequired().HasDefaultValue(100);

            entity.Property(e => e.IsEnabled).IsRequired().HasDefaultValue(true);

            // Audit fields
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // New property for stop processing
            entity.Property(e => e.StopProcessing).IsRequired().HasDefaultValue(false);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);

            entity.Property(e => e.RuleScopeId);
            entity.Property(e => e.PropertyRuleEvaluationMasterId);

            // Foreign key relationship
            entity.HasOne(e => e.PropertyRuleEvaluationMaster)
                .WithMany()
                .HasForeignKey(e => e.PropertyRuleEvaluationMasterId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint on RuleCode
            entity.HasIndex(e => e.RuleCode).IsUnique().HasDatabaseName("UQ_RuleEngineMaster_RuleCode");

            // Indexes for performance
            entity.HasIndex(e => e.IsEnabled);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.PropertyRuleEvaluationMasterId);
        });

        // RuleCategoryMaster configuration
        modelBuilder.Entity<RuleCategoryEntity>(entity =>
        {
            entity.ToTable("RuleCategoryMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.CategoryCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CategoryName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.SortOrder).IsRequired().HasDefaultValue(0);

            // Audit fields
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Unique constraint on CategoryCode
            entity.HasIndex(e => e.CategoryCode).IsUnique().HasDatabaseName("UQ_RuleCategoryMaster_CategoryCode");

            // Indexes for performance
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.SortOrder);
        });

        // RuleVersionHistory configuration
        modelBuilder.Entity<RuleVersionHistoryEntity>(entity =>
        {
            entity.ToTable("RuleVersionHistory", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            // Required fields
            entity.Property(e => e.RuleId).IsRequired();
            entity.Property(e => e.RuleCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Version).IsRequired();
            entity.Property(e => e.RuleName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.RuleJson).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.Priority).IsRequired();
            entity.Property(e => e.IsEnabled).IsRequired();

            // Change metadata
            entity.Property(e => e.ChangeType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ChangeReason).HasMaxLength(500);
            entity.Property(e => e.ChangedBy).IsRequired();
            entity.Property(e => e.ChangedDate).IsRequired().HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.ChangeSummary).HasColumnType("nvarchar(max)");

            // Foreign key relationship
            entity.HasOne(e => e.RuleEngine)
                .WithMany()
                .HasForeignKey(e => e.RuleId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.RuleId);
            entity.HasIndex(e => e.RuleCode);
            entity.HasIndex(e => e.Version);
            entity.HasIndex(e => e.ChangeType);
            entity.HasIndex(e => e.ChangedDate);
        });

        // TypeOfUseGroupMasterCV configuration
        modelBuilder.Entity<TypeOfUseGroupCVEntity>(entity =>
        {
            entity.ToTable("TypeOfUseGroupMasterCV", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd(); // Identity column
            entity.Property(e => e.TypeOfUseGroupCVCode).IsRequired().HasMaxLength(10).HasColumnType("varchar(10)");
            entity.Property(e => e.GroupName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.GroupIcon).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IsFloorWiseRateApplicable);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            // Unique constraints
            entity.HasIndex(e => e.TypeOfUseGroupCVCode).IsUnique().HasDatabaseName("UQ_TypeOfUseGroupMasterCV_TypeOfUseGroupCVCode");
            entity.HasIndex(e => e.GroupName).IsUnique().HasDatabaseName("UQ_TypeOfUseGroupMasterCV_GroupName");
            entity.HasIndex(e => e.IsActive);


            entity.HasMany(e => e.TypeOfUse)
           .WithOne(n => n.TypeOfUseGroupCV)
           .HasForeignKey(n => n.TypeOfUseGroupCVId)
           .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetDocumentDefinition configuration
        modelBuilder.Entity<AssetDocumentDefinitionEntity>(entity =>
        {
            entity.ToTable("AssetDocumentDefinition", "AMS");
            entity.HasKey(e => e.Id).HasName("PK_AssetDocumentDefinition");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.AssetCategoryId).IsRequired(false);
            entity.Property(e => e.AssetTypeId).IsRequired(false);

            entity.Property(e => e.DocumentCode)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnType("varchar(50)");

            entity.Property(e => e.DocumentName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("nvarchar(200)");

            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnType("nvarchar(500)");

            entity.Property(e => e.DisplayOrder).IsRequired(false);

            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate)
                .IsRequired()
                .HasColumnType("datetime")
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasOne(e => e.AssetCategory)
                .WithMany()
                .HasForeignKey(e => e.AssetCategoryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AssetDocumentDefinition_AssetCategoryMaster");

            entity.HasOne(e => e.AssetType)
                .WithMany()
                .HasForeignKey(e => e.AssetTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AssetDocumentDefinition_AssetTypeMaster");

            // Enforce global uniqueness of DocumentCode
            entity.HasIndex(e => e.DocumentCode)
                .IsUnique()
                .HasDatabaseName("UQ_AssetDocumentDefinition_Code");
        });
        // AssetFieldDefinition configuration
        modelBuilder.Entity<AssetFieldDefinitionEntity>(entity =>
        {
            entity.ToTable("AssetFieldDefinition", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetCategoryId).IsRequired();
            entity.Property(e => e.AssetTypeId).IsRequired();
            entity.Property(e => e.FieldCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FieldLabel).IsRequired().HasMaxLength(200);
            entity.Property(e => e.FieldType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.FieldGroup).HasMaxLength(100);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.OptionsJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasOne<AssetCategoryEntity>()
                .WithMany()
                .HasForeignKey(e => e.AssetCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<AssetTypeEntity>()
                .WithMany()
                .HasForeignKey(e => e.AssetTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.AssetCategoryId, e.AssetTypeId, e.FieldCode })
                .IsUnique()
                .HasDatabaseName("UQ_FieldDef_CategoryTypeField");
        });

        // AssetAuthorityMaster configuration
        modelBuilder.Entity<AssetAuthorityMasterEntity>(entity =>
        {
            entity.ToTable("AuthorityMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AuthorityCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.AuthorityName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.State).HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasIndex(e => e.AuthorityCode)
                .IsUnique()
                .HasDatabaseName("UQ_AuthorityMaster_AuthorityCode");
        });

        // AssetConditionMaster configuration
        modelBuilder.Entity<AssetConditionMasterEntity>(entity =>
        {
            entity.ToTable("AssetConditionMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ConditionCategory).IsRequired().HasMaxLength(20);
            entity.Property(e => e.CategoryId).IsRequired();
            entity.Property(e => e.ConditionName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.ConditionFactor).HasColumnType("decimal(18,4)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasIndex(e => new { e.ConditionCategory, e.CategoryId, e.ConditionName })
                .IsUnique()
                .HasDatabaseName("UQ_AssetConditionMaster_CategoryCondition");
        });

        // AssetOrganizationMaster configuration
        modelBuilder.Entity<AssetOrganizationMasterEntity>(entity =>
        {
            entity.ToTable("OrganizationMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AuthorityId).IsRequired();
            entity.Property(e => e.OrganizationCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.OrganizationName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasOne<AssetAuthorityMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.AuthorityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.OrganizationCode)
                .IsUnique()
                .HasDatabaseName("UQ_OrganizationMaster_OrgCode");
        });


        modelBuilder.Entity<PropertyRuleApplicationLogEntity>(entity =>
        {
            entity.ToTable("PropertyRuleApplicationLog", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.PropertyDetailsId).IsRequired();
            entity.Property(e => e.FinanceYear).IsRequired();
            entity.Property(e => e.RuleCategory).IsRequired().HasMaxLength(50);
            entity.Property(e => e.RuleCode).IsRequired().HasMaxLength(100);
            entity.Property(e => e.RuleName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.EffectType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.EffectValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ApplyRate).HasColumnType("decimal(18,4)");
            entity.Property(e => e.BaseValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ComputedValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CumulativeValue).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ApplyOrder).IsRequired();
            entity.Property(e => e.StopProcessing).IsRequired();
            entity.Property(e => e.AppliedAt).IsRequired().HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            entity.Property(e => e.RuleScopeId).IsRequired(false);
            entity.Property(e => e.RuleScopeName).HasMaxLength(200).IsRequired(false);

            entity.HasOne(e => e.PropertyMast)
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyDetails)
                .WithMany()
                .HasForeignKey(e => e.PropertyDetailsId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId);
            entity.HasIndex(e => e.PropertyDetailsId);
        });

        // PropertyWorkflowStageMaster configuration
        modelBuilder.Entity<PropertyWorkflowStageMasterEntity>(entity =>
        {
            entity.ToTable("PropertyWorkflowStageMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            // Required string properties
            entity.Property(e => e.StageName)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnType("varchar(100)");

            // Optional string property
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnType("varchar(500)")
                .IsRequired(false);

            // Required integer property
            entity.Property(e => e.DisplayOrder)
                .IsRequired();


            // Boolean property with default
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            // Audit properties
            entity.Property(e => e.CreatedBy)
                .IsRequired(false);

            entity.Property(e => e.CreatedDate)
                .IsRequired()
                .HasColumnType("datetime")
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy)
                .IsRequired(false);

            entity.Property(e => e.UpdatedDate)
                .HasColumnType("datetime")
                .IsRequired(false);

            // Indexes for query performance
            entity.HasIndex(e => e.StageName).HasDatabaseName("IX_PropertyWorkflowStageMaster_StageName");
            entity.HasIndex(e => e.DisplayOrder).HasDatabaseName("IX_PropertyWorkflowStageMaster_DisplayOrder");

            entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_PropertyWorkflowStageMaster_IsActive");

            // Unique constraint on StageName
            entity.HasIndex(e => e.StageName)
                .IsUnique()
                .HasDatabaseName("UQ_PropertyWorkflowStageMaster_StageName");
        });

        // PropertyWorkflowDetails configuration
        modelBuilder.Entity<PropertyWorkflowDetailsEntity>(entity =>
        {
            entity.ToTable("PropertyWorkflowDetails", "PTIS");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .UseIdentityColumn()
                .ValueGeneratedOnAdd();

            entity.Property(e => e.PropertyId)
                .IsRequired();

            entity.Property(e => e.WorkflowStageId)
                .IsRequired();

            entity.Property(e => e.ModuleId)
                .IsRequired(false);

            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(e => e.CurrentStatus)
                .IsRequired(false)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedDate)
                .IsRequired()
                .HasColumnType("datetime")
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.CreatedBy)
                .IsRequired(false);

            entity.Property(e => e.UpdatedBy)
                .IsRequired(false);

            entity.Property(e => e.UpdatedDate)
                .HasColumnType("datetime")
                .IsRequired(false);

            // FK → PropertyMast
            entity.HasOne(e => e.Property)
                .WithMany(p => p.WorkflowHistory)
                .HasForeignKey(e => e.PropertyId)
                .HasConstraintName("FK_PropertyWorkflowDetails_PropertyMast")
                .OnDelete(DeleteBehavior.Restrict);

            // FK → PropertyWorkflowStageMaster
            entity.HasOne(e => e.WorkflowStage)
                .WithMany(s => s.WorkflowDetails)
                .HasForeignKey(e => e.WorkflowStageId)
                .HasConstraintName("FK_PropertyWorkflowDetails_WorkflowStage")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId)
                .HasDatabaseName("IX_PropertyWorkflowDetails_PropertyId");

            entity.HasIndex(e => e.WorkflowStageId)
                .HasDatabaseName("IX_PropertyWorkflowDetails_WorkflowStageId");

            entity.HasIndex(e => e.CurrentStatus)
                .HasDatabaseName("IX_PropertyWorkflowDetails_CurrentStatus");

            entity.HasIndex(e => e.IsActive)
                .HasDatabaseName("IX_PropertyWorkflowDetails_IsActive");
        });

        modelBuilder.Entity<PropertySurveyVisitEntity>(entity =>
        {
            entity.ToTable("PropertySurveyVisit", "GSMS");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .UseIdentityColumn()
                .ValueGeneratedOnAdd();

            entity.Property(e => e.PropertyWorkflowDetailsId)
                .IsRequired();

            entity.Property(e => e.InternalSurveyVerified)
                .IsRequired(false);

            entity.Property(e => e.RemarkId)
                .IsRequired(false);

            entity.Property(e => e.RemarkText)
                .HasMaxLength(1000)
                .HasColumnType("nvarchar(1000)")
                .IsRequired(false);

            entity.Property(e => e.Latitude)
                .HasPrecision(18, 9)
                .IsRequired(false);

            entity.Property(e => e.Longitude)
                .HasPrecision(18, 9)
                .IsRequired(false);

            entity.Property(e => e.Location)
                .HasMaxLength(500)
                .HasColumnType("nvarchar(500)")
                .IsRequired(false);

            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedDate)
                .IsRequired()
                .HasColumnType("datetime")
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.CreatedBy)
                .IsRequired(false);

            entity.Property(e => e.UpdatedBy)
                .IsRequired(false);

            entity.Property(e => e.UpdatedDate)
                .HasColumnType("datetime")
                .IsRequired(false);

            entity.HasOne(e => e.PropertyWorkflowDetails)
                .WithMany(w => w.PropertySurveyVisits)
                .HasForeignKey(e => e.PropertyWorkflowDetailsId)
                .HasConstraintName("FK_PropertySurveyVisit_PropertyWorkflowDetails")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Remark)
                .WithMany()
                .HasForeignKey(e => e.RemarkId)
                .HasConstraintName("FK_PropertySurveyVisit_CommonRemarkDetails")
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Fluent mappings for Sign-off Module
        modelBuilder.Entity<SignAuthorityMasterEntity>(entity =>
        {
            entity.ToTable("SignAuthorityMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AuthorityName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AuthorityCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.SequenceOrder).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.AuthorityCode).IsUnique();
            entity.HasIndex(e => e.SequenceOrder).IsUnique();
        });

        modelBuilder.Entity<PropertySignatureDetailsEntity>(entity =>
        {
            entity.ToTable("PropertySignatureDetails", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.PropertyId).IsRequired();
            entity.Property(e => e.SignAuthorityId).IsRequired();
            entity.Property(e => e.NoticeNo).HasMaxLength(30);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => new { e.PropertyId, e.SignAuthorityId }).IsUnique();

            // FK to UserEntity
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // FK to PropertyEntity
            entity.HasOne(e => e.Property)
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            // FK to SignAuthorityMasterEntity
            entity.HasOne(e => e.SignAuthority)
                .WithMany(s => s.SignatureDetails)
                .HasForeignKey(e => e.SignAuthorityId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssetRoomTypeMasterEntity>(entity =>
        {
            entity.ToTable("AssetRoomTypeMaster", "AMS");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.AssetCategoryId);

            entity.Property(e => e.AssetTypeId)
                .IsRequired();

            entity.Property(e => e.RoomTypeName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.RoomTypeCode)
                .HasMaxLength(20);

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.Property(e => e.CreatedBy);

            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy);

            entity.Property(e => e.UpdatedDate);

            entity.HasIndex(e => new { e.AssetTypeId, e.RoomTypeName })
                .IsUnique()
                .HasDatabaseName("UQ_AssetRoomTypeMaster_Asset_RoomTypeName");

            entity.HasIndex(e => new { e.AssetTypeId, e.RoomTypeCode })
                .IsUnique()
                .HasDatabaseName("UQ_AssetRoomTypeMaster_Asset_RoomTypeCode");

            entity.HasIndex(e => e.AssetTypeId);

            entity.HasIndex(e => e.IsActive);

            entity.HasOne<AssetTypeEntity>()
                .WithMany()
                .HasForeignKey(e => e.AssetTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AssetRoomTypeMaster_AssetTypeMaster");

            entity.HasOne<AssetCategoryEntity>()
                .WithMany()
                .HasForeignKey(e => e.AssetCategoryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AssetRoomTypeMaster_AssetCategoryMaster");
        });
        modelBuilder.Entity<AssetAgeFactorCVMasterEntity>(entity =>
        {
            entity.ToTable("AgeFactorCVMaster", "AMS");
            entity.HasKey(e => e.Id).HasName("PK_AgeFactorCVMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ConstructionTypeId).IsRequired();
            entity.Property(e => e.AgeFrom).IsRequired();
            entity.Property(e => e.AgeTo).IsRequired();
            entity.Property(e => e.Factor).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.YearRangeCVId).HasColumnName("AssessmentYearRangeId").IsRequired();
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);

            entity.HasIndex(e => new { e.ConstructionTypeId, e.AgeFrom, e.AgeTo, e.YearRangeCVId })
                .IsUnique().HasDatabaseName("UQ_AgeFactorCVMaster");

            entity.HasOne<ConstructionTypeEntity>()
                .WithMany()
                .HasForeignKey(e => e.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AgeFactorCVMaster_ConstructionTypeMaster");

            entity.HasOne<AssetAssessmentYearRangeMasterCVEntity>()
                .WithMany()
                .HasForeignKey(e => e.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AgeFactorCVMaster_AssessmentYearRangeMaster");
        });

        modelBuilder.Entity<AssetNatureFactorCVMasterEntity>(entity =>
        {
            entity.ToTable("NatureFactorCVMaster", "AMS");
            entity.HasKey(e => e.Id).HasName("PK_NatureFactorCVMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ConstructionTypeId).IsRequired();
            entity.Property(e => e.Factor).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.YearRangeCVId).HasColumnName("AssessmentYearRangeId").IsRequired();
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);

            entity.HasIndex(e => new { e.ConstructionTypeId, e.YearRangeCVId })
                .IsUnique().HasDatabaseName("UQ_NatureFactorCVMaster");

            entity.HasOne<ConstructionTypeEntity>()
                .WithMany()
                .HasForeignKey(e => e.ConstructionTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_NatureFactorCVMaster_ConstructionTypeMaster");

            entity.HasOne<AssetAssessmentYearRangeMasterCVEntity>()
                .WithMany()
                .HasForeignKey(e => e.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_NatureFactorCVMaster_AssessmentYearRangeMaster");
        });

        modelBuilder.Entity<AssetUseFactorCVMasterEntity>(entity =>
        {
            entity.ToTable("UseFactorCVMaster", "AMS");
            entity.HasKey(e => e.Id).HasName("PK_UseFactorCVMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.SubTypeOfUseId).IsRequired();
            entity.Property(e => e.Factor).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.YearRangeCVId).HasColumnName("AssessmentYearRangeId").IsRequired();
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);

            entity.HasIndex(e => new { e.TypeOfUseId, e.SubTypeOfUseId, e.YearRangeCVId })
                .IsUnique().HasDatabaseName("UQ_UseFactorCVMaster_Type_SubType");

            entity.HasOne<AssetTypeOfUseMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.TypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UseFactorCVMaster_TypeOfUseMaster");

            entity.HasOne<AssetSubTypeOfUseEntity>()
                .WithMany()
                .HasForeignKey(e => e.SubTypeOfUseId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UseFactorCVMaster_SubTypeOfUseMaster");

            entity.HasOne<AssetAssessmentYearRangeMasterCVEntity>()
                .WithMany()
                .HasForeignKey(e => e.YearRangeCVId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_UseFactorCVMaster_AssessmentYearRangeCVMaster");
        });

        modelBuilder.Entity<AssetAssessmentYearRangeMasterCVEntity>(entity =>
        {
            entity.ToTable("AssessmentYearRangeMaster", "AMS");
            entity.HasKey(e => e.Id).HasName("PK_AssessmentYearRangeMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FromYear).IsRequired();
            entity.Property(e => e.ToYear).IsRequired();
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
        });
        // SocietyWingDetails configuration
        modelBuilder.Entity<SocietyWingDetailsEntity>(entity =>
        {
            entity.ToTable("SocietyWingDetails", "GSMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.WingId).IsRequired(false);
            entity.Property(e => e.PropertyId).IsRequired(false);
            entity.Property(e => e.SocietyDetailId).IsRequired(false);

            entity.Property(e => e.FromFloor)
                .HasMaxLength(50)
                .IsRequired(false);

            entity.Property(e => e.ToFloor)
                .HasMaxLength(50)
                .IsRequired(false);

            entity.Property(e => e.OldWingName)
                .IsRequired(false);

            entity.Property(e => e.NewWingName)
                .HasMaxLength(500)
                .IsRequired(false);

            entity.Property(e => e.NoOfFlat).IsRequired(false);
            entity.Property(e => e.NoOfShop).IsRequired(false);
            entity.Property(e => e.NoOfRowHouse).IsRequired(false);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate)
                .HasColumnType("datetime")
                .HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate)
                .HasColumnType("datetime")
                .IsRequired(false);

            // FK → WingMaster
            entity.HasOne(e => e.WingMaster)
                .WithMany()
                .HasForeignKey(e => e.WingId)
                .HasConstraintName("FK_SocietyWingDetails_WingMaster")
                .OnDelete(DeleteBehavior.Restrict);

            // FK → SocietyDetailsMast
            entity.HasOne(e => e.SocietyDetailsMast)
                .WithMany()
                .HasForeignKey(e => e.SocietyDetailId)
                .HasConstraintName("FK_SocietyWingDetails_SocietyDetailsMast")
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.PropertyId)
                .HasDatabaseName("IX_SocietyWingDetails_PropertyId");

            entity.HasIndex(e => e.WingId)
                .HasDatabaseName("IX_SocietyWingDetails_WingId");

            entity.HasIndex(e => e.SocietyDetailId)
                .HasDatabaseName("IX_SocietyWingDetails_SocietyDetailId");

            entity.HasIndex(e => e.IsActive)
                .HasDatabaseName("IX_SocietyWingDetails_IsActive");
        });

        // ApplicationSetting Entity
        modelBuilder.Entity<ApplicationSettingEntity>(entity =>
        {
            entity.ToTable("ApplicationSetting", "GSMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.FlagName)
                .HasMaxLength(100)
                .IsUnicode(false)
                .IsRequired();

            entity.Property(e => e.DataType)
                .HasMaxLength(50)
                .IsUnicode(false)
                .IsRequired();

            entity.Property(e => e.DefaultValue_Bit).IsRequired(false);
            entity.Property(e => e.DefaultValue_INT).IsRequired(false);
            entity.Property(e => e.DefaultValue_FLOAT).IsRequired(false);
            entity.Property(e => e.DefaultValue_DateTime).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.DefaultValue_NVARCHAR).HasMaxLength(500).IsUnicode(true).IsRequired(false);
            entity.Property(e => e.ModuleId).IsRequired(false);
            entity.Property(e => e.Description).HasMaxLength(200).IsUnicode(true).IsRequired(false);

            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedBy).IsRequired(false);

            entity.Property(e => e.CreatedDate)
                .HasColumnType("datetime")
                .IsRequired()
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            // Unique non-clustered index on (FlagName, ModuleId) where IsActive = 1
            entity.HasIndex(e => new { e.FlagName, e.ModuleId })
                .HasDatabaseName("UX_ApplicationSetting_FlagName_ModuleId")
                .IsUnique()
                .HasFilter("[IsActive] = 1");

            entity.HasIndex(e => e.IsActive)
                .HasDatabaseName("IX_ApplicationSetting_IsActive");

            // Check constraint for DataType
            entity.HasCheckConstraint(
                "CK_ApplicationSetting_DataType",
                "[DataType] IN ('BIT', 'INT', 'FLOAT', 'DATETIME', 'NVARCHAR', 'VARCHAR')");

            // Foreign Key to Core.ModuleMaster
            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .HasConstraintName("FK_ApplicationSetting_ModuleMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GlobalSurveyWardAllocation Entity
        modelBuilder.Entity<GlobalSurveyWardAllocationEntity>(entity =>
        {
            entity.ToTable("WardAllocation", "GSMS");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id)
                .ValueGeneratedOnAdd();

            entity.Property(x => x.UserId).IsRequired();
            entity.Property(x => x.DepartmentId).IsRequired();
            entity.Property(x => x.ModuleId).IsRequired();
            entity.Property(x => x.ZoneId).IsRequired();
            entity.Property(x => x.WardId).IsRequired();

            entity.Property(x => x.FromPropertyNo)
                .HasMaxLength(50);

            entity.Property(x => x.ToPropertyNo)
                .HasMaxLength(50);

            entity.Property(x => x.IsActive)
                .IsRequired();

            entity.Property(x => x.MarkedForDeletion)
                .IsRequired()
                .HasDefaultValue(false);

            entity.Property(x => x.MarkedForDeletionDate)
                .HasColumnType("datetime");

            entity.Property(x => x.CreatedDate)
                .IsRequired();

            entity.HasIndex(x => new { x.UserId, x.DepartmentId, x.ModuleId, x.ZoneId, x.WardId, x.OldWardId })
                .IsUnique()
                .HasFilter("[FromPropertyNo] IS NULL AND [IsActive] = 1")
                .HasDatabaseName("UQ_WardAllocation_User_Department_Module_Zone_Ward_OldWard");

            entity.HasIndex(x => new { x.UserId, x.DepartmentId, x.ModuleId, x.ZoneId, x.WardId, x.OldWardId, x.FromPropertyNo, x.ToPropertyNo })
                .IsUnique()
                .HasFilter("[FromPropertyNo] IS NOT NULL AND [IsActive] = 1")
                .HasDatabaseName("UQ_WardAllocation_PropertyWise_Range");

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .HasPrincipalKey(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Department)
                .WithMany()
                .HasForeignKey(x => x.DepartmentId)
                .HasPrincipalKey(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Module)
                .WithMany()
                .HasForeignKey(x => x.ModuleId)
                .HasPrincipalKey(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Zone)
                .WithMany()
                .HasForeignKey(x => x.ZoneId)
                .HasPrincipalKey(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Ward)
                .WithMany()
                .HasForeignKey(x => x.WardId)
                .HasPrincipalKey(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.OldWard)
                .WithMany()
                .HasForeignKey(x => x.OldWardId)
                .HasPrincipalKey(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PropertyMapDetail configuration
        modelBuilder.Entity<PropertyMapDetailEntity>(entity =>
        {
            entity.ToTable("PropertyMapDetail", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd().UseIdentityColumn(1, 1);
            entity.Property(e => e.PropertyMapId).IsRequired();
            entity.Ignore(e => e.PropertySide);
            entity.Ignore(e => e.PropertyNo);
            entity.Property(e => e.PropertyNoOld).HasMaxLength(50).HasDefaultValue(string.Empty);
            entity.Property(e => e.PropertyNoNew).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TaxSharePercent).HasColumnType("decimal(9,4)");
            entity.Property(e => e.AreaSharePercent).HasColumnType("decimal(9,4)");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).IsUnicode(false).HasDefaultValue("ACTIVE");
            entity.Property(e => e.IsCurrent).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.ChangeReason).HasMaxLength(300);
            entity.Property(e => e.Remark).HasMaxLength(500);
            entity.Property(e => e.Latitude).HasColumnType("decimal(12,8)");
            entity.Property(e => e.Longitude).HasColumnType("decimal(12,8)");
            entity.Property(e => e.Location).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).IsRequired().HasDefaultValueSql("GETDATE()");

            // Unique Constraint
            entity.HasIndex(e => new { e.PropertyMapId, e.PropertyIdNew, e.PropertyIdOld, e.Status })
                .IsUnique()
                .HasDatabaseName("UQ_PropertyMapDetail_PropertyMapId_PropertySide_PropertyId_Status");
        });

        // GSTMaster configuration
        modelBuilder.Entity<GSTMasterEntity>(entity =>
        {
            entity.ToTable("GSTMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TaxCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TaxName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TaxPercentage).HasColumnType("decimal(5,2)").IsRequired();
            entity.Property(e => e.EffectiveFromDate).HasColumnType("date").IsRequired();
            entity.Property(e => e.EffectiveToDate).HasColumnType("date").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasIndex(e => e.TaxCode).IsUnique();
        });

        // PenaltyRuleMaster configuration
        modelBuilder.Entity<PenaltyRuleMasterEntity>(entity =>
        {
            entity.ToTable("PenaltyRuleMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PenaltyCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PenaltyName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CalculationType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PenaltyValue).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.GracePeriodDays).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasIndex(e => e.PenaltyCode).IsUnique().HasDatabaseName("UQ_PenaltyRuleMaster_PenaltyCode");

            entity.ToTable(t => t.HasCheckConstraint("CK_PenaltyRuleMaster_CalculationType", "([CalculationType]='Percentage' OR [CalculationType]='FlatAmount' OR [CalculationType]='PerDay')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_PenaltyRuleMaster_PenaltyValue", "([PenaltyValue]>=(0))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_PenaltyRuleMaster_GracePeriodDays", "([GracePeriodDays]>=(0))"));
        });

        // AssetMoujaMaster configuration
        modelBuilder.Entity<AssetMoujaMasterEntity>(entity =>
        {
            entity.ToTable("MoujaMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MoujaNo).IsRequired().HasMaxLength(20);
            entity.Property(e => e.MoujaName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);
        });

        // AssetSubZoneDetailsForCV configuration
        modelBuilder.Entity<AssetSubZoneDetailsForCVEntity>(entity =>
        {
            entity.ToTable("SubZoneDetailsForCV", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MoujaId).IsRequired();
            entity.Property(e => e.SubZoneNo).IsRequired().HasMaxLength(20);
            entity.Property(e => e.SubZoneName).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);
        });

        // AssetTypeOfUseGroup configuration
        modelBuilder.Entity<AssetTypeOfUseGroupEntity>(entity =>
        {
            entity.ToTable("TypeOfUseGroupMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TypeOfUseGroupCode).IsRequired().HasMaxLength(10);
            entity.Property(e => e.GroupName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.GroupIcon).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IsFloorWiseRateApplicable).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);
        });

        // AssetTypeOfUseMaster configuration
        modelBuilder.Entity<AssetTypeOfUseMasterEntity>(entity =>
        {
            entity.ToTable("TypeOfUseMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetCategoryId).IsRequired();
            entity.Property(e => e.AssetTypeId).IsRequired();
            entity.Property(e => e.TypeOfUseCode).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Description).HasMaxLength(100).IsRequired(false);
            entity.Property(e => e.Type).HasMaxLength(5).IsRequired(false);
            entity.Property(e => e.TypeOfUseGroupId).IsRequired(false);
            entity.Property(e => e.SearchSequence).IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);
        });

        // AssetSubTypeOfUse configuration
        modelBuilder.Entity<AssetSubTypeOfUseEntity>(entity =>
        {
            entity.ToTable("SubTypeOfUseMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.Description).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SearchSequence).IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);
        });

        // AssetFloorFactorCV configuration
        modelBuilder.Entity<AssetFloorFactorCVEntity>(entity =>
        {
            entity.ToTable("FloorFactorCVMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FloorId).IsRequired();
            entity.Property(e => e.FactorWithLift).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.FactorWithoutLift).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.YearRangeCVId).HasColumnName("AssessmentYearRangeId").IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasIndex(e => new { e.FloorId, e.YearRangeCVId })
                .IsUnique().HasDatabaseName("UQ_AMS_FloorFactorCVMaster");
        });

        // AssetPhotoType configuration
        modelBuilder.Entity<AssetPhotoTypeEntity>(entity =>
        {
            entity.ToTable("AssetPhotoType", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.PhotoTypeCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PhotoTypeName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(250).IsRequired(false);
            entity.Property(e => e.DisplayOrder).IsRequired(false);
            entity.Property(e => e.AssetCategoryId).IsRequired(false);
            entity.Property(e => e.AssetTypeId).IsRequired(false);
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsSubUnit).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasIndex(e => e.PhotoTypeCode)
                .IsUnique().HasDatabaseName("UQ_AMS_AssetPhotoType_Code");
        });

        // AssetRentDocumentType configuration (AMS schema)
        modelBuilder.Entity<AssetRentDocumentTypeEntity>(entity =>
        {
            entity.ToTable("AssetRentDocumentType", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentTypeCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.DocumentTypeName).IsRequired().HasMaxLength(200).HasColumnType("nvarchar(200)");
            entity.Property(e => e.Description).HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);
            entity.HasIndex(e => e.DocumentTypeCode).IsUnique().HasDatabaseName("UQ_AssetRentDocumentType_Code").HasFilter("[MarkedForDeletion] = 0");
        });

        // InventoryDocumentType configuration (AMS schema)
        modelBuilder.Entity<InventoryDocumentTypeEntity>(entity =>
        {
            entity.ToTable("InventoryDocumentType", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentTypeCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.DocumentTypeName).IsRequired().HasMaxLength(200).HasColumnType("nvarchar(200)");
            entity.Property(e => e.Description).HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.IsRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // IHardDeletable
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);

            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);
            entity.HasIndex(e => e.DocumentTypeCode).IsUnique().HasDatabaseName("UQ_InventoryDocumentType_Code").HasFilter("[MarkedForDeletion] = 0");
        });

        // AssetPhoto configuration (AMS schema)
        modelBuilder.Entity<AssetPhotoEntity>(entity =>
        {
            entity.ToTable("AssetPhoto", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.SubUnitsDetailsId).IsRequired(false);
            entity.Property(e => e.PhotoTypeId).IsRequired();
            entity.Property(e => e.DocumentBindingId).IsRequired(false);
            entity.Property(e => e.IsLatest).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.DisplayOrder).IsRequired(false);
            entity.Property(e => e.Remarks).HasMaxLength(500).HasColumnType("nvarchar(500)").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasOne(e => e.PhotoType)
                .WithMany()
                .HasForeignKey(e => e.PhotoTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DocumentBinding)
                .WithMany()
                .HasForeignKey(e => e.DocumentBindingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetDocument configuration (AMS schema)
        modelBuilder.Entity<AssetDocumentEntity>(entity =>
        {
            entity.ToTable("AssetDocument", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.DocumentDefinitionId).IsRequired();
            entity.Property(e => e.DocumentBindingId).IsRequired(false);
            entity.Property(e => e.IsLatest).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.DisplayOrder).IsRequired(false);
            entity.Property(e => e.Remarks).HasMaxLength(500).HasColumnType("nvarchar(500)").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasOne(e => e.DocumentDefinition)
                .WithMany()
                .HasForeignKey(e => e.DocumentDefinitionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DocumentBinding)
                .WithMany()
                .HasForeignKey(e => e.DocumentBindingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssetMasterEntity>(entity =>
        {
            entity.ToTable("AssetMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.AssetName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AssetCategoryId).IsRequired();
            entity.Property(e => e.AssetTypeId).IsRequired();
            entity.Property(e => e.ParentAssetId);
            entity.Property(e => e.HierarchyLevel).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.HierarchyPath).HasMaxLength(500);
            entity.Property(e => e.DepartmentId);
            entity.Property(e => e.OwnershipType).HasMaxLength(50);
            entity.Property(e => e.OccupancyStatus).HasMaxLength(50);
            entity.Property(e => e.EncroachmentStatus).HasMaxLength(25);
            entity.Property(e => e.AssetConditionId);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Ignore(e => e.AssetLocationDetailsId);
            entity.Ignore(e => e.PropertyNo);
            entity.Ignore(e => e.PartitionNo);
            entity.Ignore(e => e.UpicId);
            entity.Ignore(e => e.PTaxId);
            entity.Ignore(e => e.PlotNo);
            entity.Ignore(e => e.PurchaseValue);
            entity.Ignore(e => e.PurchaseDate);
            entity.Ignore(e => e.DepreciationId);
            entity.Ignore(e => e.InventoryBatchId);
            entity.Ignore(e => e.InventoryBatch);
            entity.Ignore(e => e.SubUnitsDetails);
            entity.HasOne(e => e.ParentAsset).WithMany().HasForeignKey(e => e.ParentAssetId).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_Asset_Parent");
            entity.HasOne(e => e.AssetType).WithMany().HasForeignKey(e => e.AssetTypeId).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_Asset_Type");
            entity.HasOne(e => e.AssetCategory).WithMany().HasForeignKey(e => e.AssetCategoryId).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_Asset_Category");
            entity.HasIndex(e => e.AssetNo).IsUnique().HasDatabaseName("UQ_AssetMaster_AssetNo");
            entity.HasIndex(e => e.AssetCategoryId);
            entity.HasIndex(e => e.AssetTypeId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.ParentAssetId);
        });

        modelBuilder.Entity<AssetDetailsEntity>(entity =>
        {
            entity.ToTable("AssetDetails", "AMS");
            entity.HasKey(e => e.AssetId);
            entity.Property(e => e.AssetId).ValueGeneratedNever();
            entity.Property(e => e.Id).ValueGeneratedOnAdd()
                .Metadata.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Ignore);

            entity.Ignore(e => e.CapitalValue);
            entity.Ignore(e => e.HasLift);
            entity.Ignore(e => e.Length);
            entity.Ignore(e => e.Width);
            entity.Ignore(e => e.BuiltupAreaSqMeter);
            entity.Ignore(e => e.CarpetAreaSqMeter);
            entity.Ignore(e => e.GstNo);
            entity.Ignore(e => e.ShopActNo);
            entity.Property(e => e.OrganizationId).IsRequired();
            entity.Property(e => e.ZoneId);
            entity.Property(e => e.WardId);
            entity.Property(e => e.MoujaId);
            entity.Property(e => e.SubZoneId);
            entity.Property(e => e.PropertyNo).HasMaxLength(100);
            entity.Property(e => e.UnitNo).HasMaxLength(100);
            entity.Property(e => e.PartitionNo).HasMaxLength(100);
            entity.Property(e => e.UpicId).HasMaxLength(100);
            entity.Property(e => e.PTaxId).HasMaxLength(100);
            entity.Property(e => e.PlotNo).HasMaxLength(50);
            entity.Property(e => e.CSN).HasMaxLength(30);
            entity.Property(e => e.MpmsNo).HasColumnName("MpmsNo").HasMaxLength(50);

            entity.Property(e => e.LengthFt).HasColumnType("decimal(18,2)");
            entity.Property(e => e.LengthMtr).HasColumnType("decimal(18,2)");
            entity.Property(e => e.WidthFt).HasColumnType("decimal(18,2)");
            entity.Property(e => e.WidthMtr).HasColumnType("decimal(18,2)");
            entity.Property(e => e.LandAreaSqFeet).HasColumnType("decimal(18,4)");
            entity.Property(e => e.LandAreaSqMeter).HasColumnType("decimal(18,4)");

            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.PinCode).HasMaxLength(10);
            entity.Property(e => e.Latitude).HasColumnType("decimal(10,8)");
            entity.Property(e => e.Longitude).HasColumnType("decimal(11,8)");
            entity.Property(e => e.InChargeName).HasColumnName("InchargeName").HasMaxLength(150);
            entity.Property(e => e.InChargeDesignationId).HasColumnName("InchargeDesignationId");
            entity.Property(e => e.InChargeMobile).HasColumnName("InchargeContact").HasMaxLength(30);
            entity.Property(e => e.InChargeEmail).HasColumnName("InchargeEmail").HasMaxLength(150);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasOne(e => e.Asset)
                .WithOne(a => a.Details)
                .HasForeignKey<AssetDetailsEntity>(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_AssetDetails_AssetMaster");
        });

        modelBuilder.Entity<AssetFieldValueEntity>(entity =>
        {
            entity.ToTable("AssetFieldValue", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FieldValue).HasMaxLength(2000);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            // Concurrency token: AssetMasterService backfills a null CreatedBy on a row it updates and
            // must never overwrite one that is set. The UPDATE carries the CreatedBy it read (IS NULL
            // for a legacy row), so a request that lost the race to backfill the same row fails with
            // DbUpdateConcurrencyException instead of replacing the creator the first one recorded.
            entity.Property(e => e.CreatedBy).IsConcurrencyToken();
            entity.Property(e => e.CreatedDate).IsRequired().HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.Asset)
                .WithMany(a => a.FieldValues)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.AssetId);
            entity.HasIndex(e => e.FieldDefinitionId);
        });

        modelBuilder.Entity<AssetLeaseRentDetailsEntity>(entity =>
        {
            entity.ToTable("AssetLeaseRentDetails", "AMS");
            entity.Property(e => e.AssetId).IsRequired();
            // Real schema column is SubUnitDetailsId (FK to AMS.SubUnitsDetails).
            entity.Property(e => e.FloorDetailsId).HasColumnName("SubUnitDetailsId");
            entity.Property(e => e.ShopNo).HasMaxLength(50);
            entity.Property(e => e.ShopName).HasMaxLength(200);
            entity.Property(e => e.ShopRegionalName).HasMaxLength(200);

            entity.Property(e => e.TenantName).IsRequired().HasMaxLength(500);
            entity.Property(e => e.TenantRegionalName).HasMaxLength(200);
            entity.Property(e => e.TenantMobile).IsRequired().IsUnicode(false).HasMaxLength(20);
            entity.Property(e => e.TenantEmail).HasMaxLength(200);
            entity.Property(e => e.TenantType).IsRequired().HasMaxLength(50).HasDefaultValue("Individual");
            entity.Property(e => e.TenantAadhaarNo).IsUnicode(false).HasMaxLength(20);
            entity.Property(e => e.TenantPanCardNo).IsUnicode(false).HasMaxLength(20);
            entity.Property(e => e.TenantAddress).HasMaxLength(500);
            entity.Property(e => e.GSTNo).HasMaxLength(50);

            entity.Property(e => e.TotalAreaSqFt).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ApplicationTypeId);
            entity.Property(e => e.LeaseType).IsRequired().HasMaxLength(20).HasDefaultValue("Rent");
            entity.Property(e => e.LeaseStartDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.LeaseEndDate).HasColumnType("date");
            entity.Property(e => e.Duration);
            entity.Property(e => e.RentAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SecurityDeposit).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            // Concurrency token: lease-rent payments debit (wallet use) and credit (overpayment) this
            // balance. Two concurrent payments must not both spend the same advance, so the UPDATE
            // carries the balance it read and fails with DbUpdateConcurrencyException if it moved.
            entity.Property(e => e.AdvanceBalance).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m).IsConcurrencyToken();
            entity.Property(e => e.DepositType).HasMaxLength(50);
            entity.Property(e => e.PaymentFrequency).IsRequired().HasMaxLength(20).HasDefaultValue("Monthly");
            entity.Property(e => e.AgreementId).HasMaxLength(25);
            entity.Property(e => e.IsIncrement).HasDefaultValue(false);
            entity.Property(e => e.IncrementFrequency).HasMaxLength(35);
            entity.Property(e => e.IncrementType).HasMaxLength(35);
            entity.Property(e => e.IncrementValue);
            entity.Property(e => e.IncrementMethod).HasMaxLength(35);
            entity.Property(e => e.Reason).HasMaxLength(1000);

            // Concurrency token: workflow transitions (Verify/Approve/Reject/Revert*) load, check,
            // and re-save this column. Marking it a concurrency token makes SaveChangesAsync throw
            // DbUpdateConcurrencyException if another request already changed the status between
            // this request's read and write, instead of silently overwriting that other change.
            entity.Property(e => e.WorkflowStatus).IsRequired().HasMaxLength(30).HasDefaultValue("Pending").IsConcurrencyToken();
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.IsRejection).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.RejectionBy);
            entity.Property(e => e.RejectionDate).HasColumnType("datetime");
            entity.Property(e => e.IsVerified).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.VerifiedBy);
            entity.Property(e => e.VerifiedDate).HasColumnType("datetime");
            entity.Property(e => e.IsApproved).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ApprovedBy);
            entity.Property(e => e.ApprovedDate).HasColumnType("datetime");

            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.HasOne(e => e.Asset)
                .WithMany()
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AssetLeaseRentDetails_Asset");

            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_AadhaarFormat", "([TenantAadhaarNo] IS NULL OR [TenantAadhaarNo] like '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' AND len([TenantAadhaarNo])=(12))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_ApprovedDetails", "([IsApproved]=(0) OR [IsApproved]=(1) AND [ApprovedBy] IS NOT NULL AND [ApprovedDate] IS NOT NULL)"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_EmailFormat", "([TenantEmail] IS NULL OR [TenantEmail] like '%_@__%.__%')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_GSTFormat", "([GSTNo] IS NULL OR len([GSTNo])=(15) AND [GSTNo] like '[0-9][0-9][A-Z][A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][A-Z][0-9][A-Z][0-9]')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_LeaseType", "([LeaseType]='Rent' OR [LeaseType]='Lease')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_PanFormat", "([TenantPanCardNo] IS NULL OR [TenantPanCardNo] like '[A-Z][A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][A-Z]')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_PaymentFrequency", "([PaymentFrequency]='One-time' OR [PaymentFrequency]='Yearly' OR [PaymentFrequency]='Quarterly' OR [PaymentFrequency]='Monthly')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_PositiveDuration", "([Duration] IS NULL OR [Duration]>=(0))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_PositiveIncrementValue", "([IncrementValue] IS NULL OR [IncrementValue]>=(0))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_PositiveRentAmount", "([RentAmount] IS NULL OR [RentAmount]>=(0))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_PositiveSecurityDeposit", "([SecurityDeposit]>=(0))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_PositiveTotalArea", "([TotalAreaSqFt] IS NULL OR [TotalAreaSqFt]>(0))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_RejectionDetails", "([IsRejection]=(0) OR [IsRejection]=(1) AND [RejectionBy] IS NOT NULL AND [RejectionDate] IS NOT NULL AND [RejectionReason] IS NOT NULL)"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_TenantMobileFormat", "([TenantMobile] like '+91-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' OR [TenantMobile] like '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' OR len([TenantMobile])<=(15))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_TenantType", "([TenantType]='Organization' OR [TenantType]='Business' OR [TenantType]='Individual')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_ValidLeaseRange", "([LeaseEndDate] IS NULL OR [LeaseEndDate]>=[LeaseStartDate])"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_VerifiedDetails", "([IsVerified]=(0) OR [IsVerified]=(1) AND [VerifiedBy] IS NOT NULL AND [VerifiedDate] IS NOT NULL)"));
            entity.ToTable(t => t.HasCheckConstraint("CK_AssetLeaseRentDetails_WorkflowStatus", "([WorkflowStatus]='Rejected' OR [WorkflowStatus]='Approved' OR [WorkflowStatus]='Verified' OR [WorkflowStatus]='Pending' OR [WorkflowStatus]='Reverted')"));

            entity.HasOne(e => e.ApplicationType)
                .WithMany()
                .HasForeignKey(e => e.ApplicationTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_AssetLeaseRentDetails_ApplicationType");
        });

        // AssetRoomWiseSubmissionDetails configuration
        modelBuilder.Entity<AssetRoomWiseSubmissionDetailsEntity>(entity =>
        {
            entity.ToTable("RoomWiseSubmissionDetails", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetId);
            entity.Property(e => e.SubUnitsDetailsId).HasColumnName("SubUnitsDetailsId");
            entity.Property(e => e.LengthMtr);
            entity.Property(e => e.WidthMtr);
            entity.Property(e => e.LengthFt);
            entity.Property(e => e.WidthFt);
            entity.Property(e => e.AreaSqMtr);
            entity.Property(e => e.AreaSqFeet);
            entity.Property(e => e.HeightMtr);
            entity.Property(e => e.HeightFt);
            entity.Property(e => e.TotalAreaSqMtr);
            entity.Property(e => e.TotalAreaSqFeet);
            entity.Property(e => e.Shape).HasMaxLength(25);
            entity.Property(e => e.RoomNo).HasMaxLength(100);
            entity.Property(e => e.OuterYesNo).HasColumnName("IsOuter").IsRequired().HasDefaultValue(false);
            entity.Property(e => e.RoomType).HasMaxLength(100);
            entity.Property(e => e.MinusYesNo).HasColumnName("IsMinus").IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            // Foreign key relationships
            entity.HasOne(e => e.Asset)
                .WithMany()
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SubUnitsDetails)
                .WithMany()
                .HasForeignKey(e => e.SubUnitsDetailsId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.AssetId).HasDatabaseName("IX_RoomWiseSubmissionDetails_AssetId");
            entity.HasIndex(e => e.SubUnitsDetailsId).HasDatabaseName("IX_RoomWiseSubmissionDetails_SubUnitsDetailsId");
            entity.HasIndex(e => e.IsActive);

            // CHECK constraints for positive values
            entity.ToTable(t => t.HasCheckConstraint("CK_RoomWiseSubmissionDetails_PositiveArea", "[AreaSqMtr] IS NULL OR [AreaSqMtr] > 0"));
            entity.ToTable(t => t.HasCheckConstraint("CK_RoomWiseSubmissionDetails_PositiveTotalArea", "[TotalAreaSqMtr] IS NULL OR [TotalAreaSqMtr] > 0"));
            entity.ToTable(t => t.HasCheckConstraint("CK_RoomWiseSubmissionDetails_PositiveDimensions",
                "([LengthMtr] IS NULL OR [LengthMtr] > 0) AND ([WidthMtr] IS NULL OR [WidthMtr] > 0) AND ([HeightMtr] IS NULL OR [HeightMtr] > 0)"));

            entity.HasMany(e => e.RoomMinusData)
                .WithOne(m => m.RoomWiseSubmissionDetails)
                .HasForeignKey(m => m.RoomWiseSubmissionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssetRoomWiseMinusDataEntity>(entity =>
        {
            entity.ToTable("RoomWiseMinusData", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.RoomWiseSubmissionId);
            entity.Property(e => e.LengthMtr);
            entity.Property(e => e.LengthFt);
            entity.Property(e => e.WidthMtr);
            entity.Property(e => e.WidthFt);
            entity.Property(e => e.AreaSqMtr);
            entity.Property(e => e.AreaSqFeet);
            entity.Property(e => e.HeightMtr);
            entity.Property(e => e.HeightFt);
            entity.Property(e => e.Shape).HasMaxLength(25);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.RoomWiseSubmissionId)
                .HasDatabaseName("IX_RoomWiseMinusData_RoomWiseSubmissionId");
        });

        modelBuilder.Entity<SubUnitsDetailsEntity>(entity =>
        {
            entity.ToTable("SubUnitsDetails", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AssetId).HasColumnName("AssetId").IsRequired();
            entity.Property(e => e.FloorId).IsRequired();
            entity.Property(e => e.SubFloorId);
            entity.Property(e => e.ConstructionYear).HasMaxLength(4).HasColumnType("varchar(4)");
            entity.Property(e => e.AssessmentYear).HasMaxLength(4);
            entity.Property(e => e.ConstructionTypeId).IsRequired();
            entity.Property(e => e.TypeOfUseId).IsRequired();
            entity.Property(e => e.SubTypeOfUseId);
            entity.Property(e => e.CarpetAreaSqMeter).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CarpetAreaSqFeet).HasColumnType("decimal(18,4)");
            entity.Property(e => e.BuiltUpAreaSqMeter).HasColumnName("BuiltupAreaSqMeter").HasColumnType("decimal(18,4)");
            entity.Property(e => e.BuiltUpAreaSqFeet).HasColumnName("BuiltupAreaSqFeet").HasColumnType("decimal(18,4)");
            entity.Property(e => e.NoOfRooms);

            entity.Property(e => e.CVAgeFactor).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CVFloorFactor).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CVNatureFactor).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CVUseFactor).HasColumnType("decimal(18,4)");
            entity.Property(e => e.CVBaseRate).HasColumnType("decimal(18,2)");
            entity.Property(e => e.BaseValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CapitalValue).HasColumnType("decimal(18,2)");

            entity.Property(e => e.IsRented).HasColumnName("IsRented");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_SubUnitsDetails_Asset");
            entity.HasOne(e => e.Floor).WithMany().HasForeignKey(e => e.FloorId).IsRequired(false).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_SubUnitsDetails_Floor");
            entity.HasOne(e => e.SubFloor).WithMany().HasForeignKey(e => e.SubFloorId).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_SubUnitsDetails_SubFloor");
            entity.HasOne(e => e.ConstructionType).WithMany().HasForeignKey(e => e.ConstructionTypeId).IsRequired(false).OnDelete(DeleteBehavior.Restrict).HasConstraintName("FK_SubUnitsDetails_ConstructionType");
            entity.HasOne(e => e.TypeOfUse).WithMany().HasForeignKey(e => e.TypeOfUseId).IsRequired(false).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.SubTypeOfUse).WithMany().HasForeignKey(e => e.SubTypeOfUseId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.AssetId).HasDatabaseName("IX_SubUnitsDetails_AssetId");
            entity.HasIndex(e => e.FloorId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.AssetId, e.FloorId, e.SubFloorId })
                .HasDatabaseName("IX_SubUnitsDetails_AssetFloor");
        });

        // AssetCVCalculationHistory configuration — audit trail of every CV calculation run,
        // written by AssetCapitalValueService.SaveCalculationHistoryAsync.
        modelBuilder.Entity<AssetCVCalculationHistoryEntity>(entity =>
        {
            entity.ToTable("AssetCVCalculationHistory", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.CalculationDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.FinancialYear).IsRequired().HasMaxLength(9);
            entity.Property(e => e.SubZoneId);
            entity.Property(e => e.FloorId);
            entity.Property(e => e.ConstructionTypeId);
            entity.Property(e => e.TypeOfUseId);
            entity.Property(e => e.SubTypeOfUseId);
            entity.Property(e => e.ConstructionYear);
            entity.Property(e => e.BuildingAge);
            entity.Property(e => e.BuiltUpAreaSqMeter).HasColumnType("decimal(18,4)");
            entity.Property(e => e.BaseRate).HasColumnType("decimal(18,2)");
            // Source master tables (AgeFactorCVMaster, NatureFactorCVMaster, etc.) declare Factor as
            // decimal(5,2) -- max 999.99. decimal(5,4) here (max 9.9999) caused a numeric-overflow
            // SaveChangesAsync failure whenever a master row's factor was >= 10, which rolled back
            // the entire (correctly computed) CV calculation for that floor. Widened to match.
            entity.Property(e => e.AgeFactor).HasColumnType("decimal(9,4)");
            entity.Property(e => e.FloorFactor).HasColumnType("decimal(9,4)");
            entity.Property(e => e.NatureFactor).HasColumnType("decimal(9,4)");
            entity.Property(e => e.UseFactor).HasColumnType("decimal(9,4)");
            entity.Property(e => e.CapitalValue).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.CalculatedBy);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.AssetMaster).WithMany()
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_CVHistory_Asset");

            entity.HasIndex(e => e.AssetId).HasDatabaseName("IX_AssetCVCalculationHistory_AssetId");
        });

        modelBuilder.Entity<MonthWiseDemandEntity>(entity =>
        {
            entity.ToTable("MonthWiseDemand", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.LeaseRegistrationId).IsRequired();
            entity.Property(e => e.FinanceYear).IsRequired();
            entity.Property(e => e.DemandYear).IsRequired();
            entity.Property(e => e.QuarterNo).IsRequired();
            entity.Property(e => e.DemandMonth).IsRequired();
            entity.Property(e => e.MonthlyRentAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.PenaltyRuleMasterId);
            entity.Property(e => e.PenaltyAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.GSTMasterId);
            entity.Property(e => e.GSTAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.TotalDemandAmount)
                .HasComputedColumnSql("([MonthlyRentAmount]+[PenaltyAmount]+[GSTAmount])", stored: true);
            // Concurrency token: two payments settling the same month must not both succeed. The
            // UPDATE carries the PaidAmount it read, so the second one matches no row and fails with
            // DbUpdateConcurrencyException instead of double-settling the demand.
            entity.Property(e => e.PaidAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m).IsConcurrencyToken();
            entity.Property(e => e.PendingAmount)
                .HasComputedColumnSql("(([MonthlyRentAmount]+[PenaltyAmount]+[GSTAmount])-[PaidAmount])", stored: true);
            entity.Property(e => e.DemandStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Pending");
            entity.Property(e => e.LastPaymentDate).HasColumnType("date");
            entity.Property(e => e.DueDate).HasColumnType("date");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => new { e.AssetId, e.LeaseRegistrationId, e.FinanceYear, e.DemandYear, e.DemandMonth })
                .IsUnique().HasDatabaseName("UQ_MonthWiseDemand_UniqueMonth");
            entity.HasIndex(e => e.LeaseRegistrationId).HasDatabaseName("IX_MonthWiseDemand_LeaseRegistrationId");
            entity.HasIndex(e => e.DemandStatus).HasDatabaseName("IX_MonthWiseDemand_DemandStatus");

            entity.ToTable(t => t.HasCheckConstraint("CK_MonthWiseDemand_Month", "([DemandMonth]>=(1) AND [DemandMonth]<=(12))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_MonthWiseDemand_Quarter", "([QuarterNo]>=(1) AND [QuarterNo]<=(4))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_MonthWiseDemand_Status", "([DemandStatus]='Pending' OR [DemandStatus]='Partial' OR [DemandStatus]='Paid' OR [DemandStatus]='Cancelled')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_MonthWiseDemand_Amounts", "([MonthlyRentAmount]>=(0) AND [PenaltyAmount]>=(0) AND [GSTAmount]>=(0) AND [PaidAmount]>=(0))"));

            entity.HasOne(e => e.GSTMaster)
                .WithMany()
                .HasForeignKey(e => e.GSTMasterId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MonthWiseDemand_GSTMaster");

            entity.HasOne(e => e.PenaltyRuleMaster)
                .WithMany()
                .HasForeignKey(e => e.PenaltyRuleMasterId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MonthWiseDemand_PenaltyRuleMaster");
        });

        modelBuilder.Entity<LeaseRentBillTransactionEntity>(entity =>
        {
            entity.ToTable("LeaseRentBillTransactions", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Uuid).IsRequired().HasDefaultValueSql("NEWID()");
            entity.Property(e => e.TransactionNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ReceiptNo).HasMaxLength(50);
            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.LeaseRegistrationId).IsRequired();
            entity.Property(e => e.FinanceYear).IsRequired();
            entity.Property(e => e.TotalMonthlyRentAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.TotalPenaltyAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.TotalGSTAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.TotalDemandAmount)
                .HasComputedColumnSql("([TotalMonthlyRentAmount]+[TotalPenaltyAmount]+[TotalGSTAmount])", stored: true);
            entity.Property(e => e.DiscountAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.AdjustmentAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            // The discount is informational (settlement never lets it reduce what must be paid), so it
            // isn't subtracted; AdjustmentAmount is zero or the (negative) wallet money spent.
            entity.Property(e => e.NetPayableAmount)
                .HasComputedColumnSql("(([TotalMonthlyRentAmount]+[TotalPenaltyAmount]+[TotalGSTAmount])+[AdjustmentAmount])", stored: true);
            entity.Property(e => e.PaidAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.PaymentMode).IsRequired().HasMaxLength(30);
            entity.Property(e => e.PaymentDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.BankName).HasMaxLength(100);
            entity.Property(e => e.BranchName).HasMaxLength(100);
            entity.Property(e => e.ChequeOrTransactionNo).HasMaxLength(100);
            entity.Property(e => e.ChequeDate).HasColumnType("date");
            entity.Property(e => e.OnlineTransactionId).HasMaxLength(100);
            entity.Property(e => e.PaymentGatewayName).HasMaxLength(100);
            entity.Property(e => e.AccountHolderName).HasMaxLength(250);
            entity.Property(e => e.PayerMobile).IsUnicode(false).HasMaxLength(20);
            entity.Property(e => e.PayerEmail).HasMaxLength(200);
            entity.Property(e => e.PaymentStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Success");
            entity.Property(e => e.CancelledBy);
            entity.Property(e => e.CancelledDate).HasColumnType("datetime");
            entity.Property(e => e.CancellationReason).HasMaxLength(500);
            entity.Property(e => e.Remark).HasMaxLength(500);
            // Receipt snapshot of the lease and tenant at payment time; same types as AssetLeaseRentDetails.
            entity.Property(e => e.Snap_TenantName).HasMaxLength(500);
            entity.Property(e => e.Snap_TenantMobile).IsUnicode(false).HasMaxLength(20);
            entity.Property(e => e.Snap_AgreementId).HasMaxLength(25);
            entity.Property(e => e.Snap_LeaseStartDate).HasColumnType("date");
            entity.Property(e => e.Snap_LeaseEndDate).HasColumnType("date");
            entity.Property(e => e.Snap_RentAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Snap_SecurityDeposit).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("UQ_LeaseRentBillTransactions_Uuid");
            entity.HasIndex(e => e.TransactionNo).IsUnique().HasDatabaseName("UQ_LeaseRentBillTransactions_TransactionNo");
            entity.HasIndex(e => e.ReceiptNo).IsUnique()
                .HasFilter("[ReceiptNo] IS NOT NULL")
                .HasDatabaseName("UQ_LeaseRentBillTransactions_ReceiptNo");
            entity.HasIndex(e => e.LeaseRegistrationId).HasDatabaseName("IX_LeaseRentBillTransactions_LeaseRegistrationId");
            entity.HasIndex(e => e.PaymentDate).HasDatabaseName("IX_LeaseRentBillTransactions_PaymentDate");

            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactions_PaymentMode", "([PaymentMode]='Cash' OR [PaymentMode]='Cheque' OR [PaymentMode]='DD' OR [PaymentMode]='UPI' OR [PaymentMode]='Online' OR [PaymentMode]='NEFT' OR [PaymentMode]='RTGS')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactions_Status", "([PaymentStatus]='Success' OR [PaymentStatus]='Pending' OR [PaymentStatus]='Failed' OR [PaymentStatus]='Cancelled')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactions_Amounts", "([TotalMonthlyRentAmount]>=(0) AND [TotalPenaltyAmount]>=(0) AND [TotalGSTAmount]>=(0) AND [DiscountAmount]>=(0) AND [PaidAmount]>=(0))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactions_BankDetails", "([PaymentMode]<>'Cheque' AND [PaymentMode]<>'DD' AND [PaymentMode]<>'NEFT' AND [PaymentMode]<>'RTGS' OR [BankName] IS NOT NULL AND [ChequeDate] IS NOT NULL)"));
        });

        modelBuilder.Entity<LeaseRentBillTransactionDetailEntity>(entity =>
        {
            entity.ToTable("LeaseRentBillTransactionDetails", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.LeaseRentBillTransactionId).IsRequired();
            entity.Property(e => e.MonthWiseDemandId).IsRequired();
            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.LeaseRegistrationId).IsRequired();
            entity.Property(e => e.FinanceYear).IsRequired();
            entity.Property(e => e.DemandYear).IsRequired();
            entity.Property(e => e.QuarterNo).IsRequired();
            entity.Property(e => e.DemandMonth).IsRequired();
            entity.Property(e => e.MonthlyRentAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.PenaltyAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.GSTAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.TotalDemandAmount)
                .HasComputedColumnSql("([MonthlyRentAmount]+[PenaltyAmount]+[GSTAmount])", stored: true);
            entity.Property(e => e.PreviousPaidAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.CurrentPaidAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.BalanceAmount).IsRequired().HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.PaymentStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Paid");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => new { e.LeaseRentBillTransactionId, e.MonthWiseDemandId })
                .IsUnique().HasDatabaseName("UQ_LeaseRentBillTransactionDetails_MonthDemand");

            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactionDetails_Month", "([DemandMonth]>=(1) AND [DemandMonth]<=(12))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactionDetails_Quarter", "([QuarterNo]>=(1) AND [QuarterNo]<=(4))"));
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactionDetails_Status", "([PaymentStatus]='Partial' OR [PaymentStatus]='Paid' OR [PaymentStatus]='Cancelled')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaseRentBillTransactionDetails_Amounts", "([MonthlyRentAmount]>=(0) AND [PenaltyAmount]>=(0) AND [GSTAmount]>=(0) AND [PreviousPaidAmount]>=(0) AND [CurrentPaidAmount]>=(0) AND [BalanceAmount]>=(0))"));

            entity.HasOne(e => e.Transaction)
                .WithMany(t => t.Details)
                .HasForeignKey(e => e.LeaseRentBillTransactionId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_LeaseRentBillTransactionDetails_Transaction");

            entity.HasOne(e => e.MonthWiseDemand)
                .WithMany()
                .HasForeignKey(e => e.MonthWiseDemandId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_LeaseRentBillTransactionDetails_MonthWiseDemand");
        });

        // ChequePaymentTransactions configuration (Cheque staging: Received/Deposited/Cleared/Bounced,
        // posted into LeaseRentBillTransactions only once Cleared — see LeaseRentBillingService)
        modelBuilder.Entity<ChequePaymentTransactionEntity>(entity =>
        {
            entity.ToTable("ChequePaymentTransactions", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Uuid).IsRequired().HasDefaultValueSql("NEWID()");
            entity.Property(e => e.AcknowledgementNo).IsUnicode(false).IsRequired().HasMaxLength(50);
            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.LeaseRegistrationId).IsRequired();
            entity.Property(e => e.FinanceYear).IsRequired();
            entity.Property(e => e.PaymentType).IsUnicode(false).IsRequired().HasMaxLength(20).HasDefaultValue("Full");
            // No HasDefaultValue on the amounts: EF omits a column from the INSERT when its value
            // equals a declared default, and a zero GST/discount must still be written explicitly.
            entity.Property(e => e.TotalMonthlyRentAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalPenaltyAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalGSTAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.AdjustmentAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.PaidAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.AllocationsJson).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.PaymentDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.BankName).IsUnicode(false).IsRequired().HasMaxLength(100);
            entity.Property(e => e.BranchName).IsUnicode(false).HasMaxLength(100);
            entity.Property(e => e.ChequeOrTransactionNo).IsUnicode(false).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ChequeDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.AccountHolderName).HasMaxLength(250);
            entity.Property(e => e.PayerMobile).IsUnicode(false).IsRequired().HasMaxLength(20);
            entity.Property(e => e.PayerEmail).IsUnicode(false).HasMaxLength(200);
            // Concurrency token: two clerks clearing the same cheque at once must not post it twice —
            // the second status UPDATE matches no row and rolls its whole clearance back.
            entity.Property(e => e.Status).IsUnicode(false).IsRequired().HasMaxLength(20).HasDefaultValue("Received").IsConcurrencyToken();
            entity.Property(e => e.BounceReason).HasMaxLength(500);
            entity.Property(e => e.Remark).HasMaxLength(500);
            // Receipt snapshot of the lease and tenant at intake; same types as AssetLeaseRentDetails.
            entity.Property(e => e.Snap_TenantName).HasMaxLength(500);
            entity.Property(e => e.Snap_TenantMobile).IsUnicode(false).HasMaxLength(20);
            entity.Property(e => e.Snap_AgreementId).HasMaxLength(25);
            entity.Property(e => e.Snap_LeaseStartDate).HasColumnType("date");
            entity.Property(e => e.Snap_LeaseEndDate).HasColumnType("date");
            entity.Property(e => e.Snap_RentAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Snap_SecurityDeposit).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("UQ_ChequePaymentTransactions_Uuid");
            entity.HasIndex(e => e.AcknowledgementNo).IsUnique().HasDatabaseName("UQ_ChequePaymentTransactions_AcknowledgementNo");
            entity.HasIndex(e => e.LeaseRegistrationId).HasDatabaseName("IX_ChequePaymentTransactions_LeaseRegistrationId");
            entity.HasIndex(e => e.Status).HasDatabaseName("IX_ChequePaymentTransactions_Status");

            entity.ToTable(t => t.HasCheckConstraint("CK_ChequePaymentTransactions_Status", "([Status]='Received' OR [Status]='Deposited' OR [Status]='Cleared' OR [Status]='Bounced')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_ChequePaymentTransactions_PaymentType", "([PaymentType]='Full' OR [PaymentType]='Partial' OR [PaymentType]='Monthwise')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_ChequePaymentTransactions_Amounts", "([TotalMonthlyRentAmount]>=(0) AND [TotalPenaltyAmount]>=(0) AND [TotalGSTAmount]>=(0) AND [DiscountAmount]>=(0) AND [PaidAmount]>=(0))"));
        });

        // InventoryDocument configuration (AMS schema)
        // InventoryBatch configuration (AMS schema)
        modelBuilder.Entity<InventoryBatchEntity>(entity =>
        {
            entity.ToTable("InventoryBatch", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ParentAssetId).IsRequired();
            entity.Property(e => e.OwningDepartmentId).IsRequired();
            entity.Property(e => e.InventoryItemCategoryId).IsRequired();
            entity.Property(e => e.InventoryItemNameId).IsRequired();
            entity.Property(e => e.InventoryItemModelId).IsRequired();
            entity.Property(e => e.Specifications).HasMaxLength(500).HasColumnType("varchar(500)");
            entity.Property(e => e.PurchaseDate).IsRequired().HasColumnType("date");
            entity.Property(e => e.ConditionId).IsRequired().HasColumnName("ConditionId");
            entity.Property(e => e.Quantity).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.UnitValue).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalBatchValue).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalBatchCV).HasColumnType("decimal(18,2)");
            entity.Property(e => e.InvoiceNumber).HasMaxLength(100).HasColumnType("varchar(100)");
            entity.Property(e => e.InvoiceDate).HasColumnType("date");
            entity.Property(e => e.InvoiceFileName).HasColumnName("InvoiceDocumentId").HasMaxLength(500).HasColumnType("varchar(500)");
            entity.Property(e => e.PhotoFileName).HasColumnName("PhotoDocumentId").HasMaxLength(500).HasColumnType("varchar(500)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasOne(e => e.ParentAsset)
                .WithMany()
                .HasForeignKey(e => e.ParentAssetId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_InventoryBatch_ParentAsset");

            entity.HasOne<OwningDepartmentEntity>()
                .WithMany()
                .HasForeignKey(e => e.OwningDepartmentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_InventoryBatch_OwningDepartment");

            entity.HasOne<InventoryItemCategoryEntity>()
                .WithMany()
                .HasForeignKey(e => e.InventoryItemCategoryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_InventoryBatch_InventoryItemCategory");

            entity.HasOne<InventoryItemNameEntity>()
                .WithMany()
                .HasForeignKey(e => e.InventoryItemNameId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_InventoryBatch_InventoryItemName");

            entity.HasOne<InventoryItemModelEntity>()
                .WithMany()
                .HasForeignKey(e => e.InventoryItemModelId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_InventoryBatch_InventoryItemModel");

            entity.HasOne<AssetConditionMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.ConditionId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_InventoryBatch_InventoryItemCondition");

            entity.HasIndex(e => e.ParentAssetId);
            entity.HasIndex(e => e.OwningDepartmentId);
            entity.HasIndex(e => e.InventoryItemCategoryId);
            entity.HasIndex(e => e.InventoryItemNameId);
            entity.HasIndex(e => e.InventoryItemModelId);
            entity.HasIndex(e => e.ConditionId);
        });

        modelBuilder.Entity<InventoryDocumentEntity>(entity =>
        {
            entity.ToTable("InventoryDocument", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.InventoryBatchId).IsRequired();
            entity.Property(e => e.DocumentTypeId).IsRequired();
            entity.Property(e => e.DocumentBindingId);
            entity.Property(e => e.IsLatest).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.Remarks).HasMaxLength(500).HasColumnType("nvarchar(500)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(p => p.DocumentType)
                .WithMany()
                .HasForeignKey(p => p.DocumentTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(p => p.DocumentBinding)
                .WithMany()
                .HasForeignKey(p => p.DocumentBindingId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.InventoryBatchId).HasDatabaseName("IX_InventoryDocument_InventoryBatchId");
            entity.HasIndex(e => e.DocumentTypeId).HasDatabaseName("IX_InventoryDocument_DocumentTypeId");
            entity.HasIndex(e => e.DocumentBindingId).HasDatabaseName("IX_InventoryDocument_DocumentBindingId")
                .HasFilter("[DocumentBindingId] IS NOT NULL");

            entity.HasIndex(e => new { e.InventoryBatchId, e.DocumentTypeId })
                .IsUnique()
                .HasDatabaseName("IX_InventoryDocument_Item_Type_Latest")
                .IncludeProperties(e => new { e.DocumentBindingId, e.DisplayOrder, e.IsLatest })
                .HasFilter("[IsLatest] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0");
        });

        modelBuilder.Entity<InventoryAssetDetailEntity>(entity =>
        {
            entity.ToTable("InventoryAssetDetail", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.AssetId).IsRequired();
            entity.Property(e => e.BatchId).IsRequired();
            entity.Property(e => e.UnitNumber).IsRequired();
            entity.Property(e => e.InventoryItemCategoryId);
            entity.Property(e => e.InventoryItemNameId);
            entity.Property(e => e.InventoryItemModelId);
            entity.Property(e => e.InventoryItemConditionId).HasColumnName("ConditionId");
            entity.Property(e => e.OwningDepartmentId);
            entity.Property(e => e.Specifications).HasMaxLength(500);
            entity.Property(e => e.PhotoFileId).HasMaxLength(300);
            entity.Property(e => e.UnitPurchaseValue).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.UnitCapitalValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            // Foreign keys
            entity.HasOne(e => e.AssetMaster)
                .WithMany()
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Batch)
                .WithMany(b => b.Units)
                .HasForeignKey(e => e.BatchId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.AssetId);
            entity.HasIndex(e => e.BatchId);
            entity.HasIndex(e => e.IsActive);
        });

        // AssetGrievanceCategory configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceCategoryEntity>(entity =>
        {
            entity.ToTable("GrievanceCategoryMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.GrievanceTypeCode).HasMaxLength(50).HasColumnType("varchar(50)").IsUnicode(false).IsRequired();
            entity.Property(e => e.GrievanceTypeName).HasMaxLength(200).HasColumnType("nvarchar(200)").IsRequired();
            entity.Property(e => e.GrievanceTypeNameLocal).HasMaxLength(200).HasColumnType("nvarchar(200)").IsRequired(false);
            entity.Property(e => e.Description).HasMaxLength(500).HasColumnType("nvarchar(500)").IsRequired(false);
            entity.Property(e => e.TargetTableName).HasMaxLength(200).HasColumnType("varchar(200)").IsUnicode(false).IsRequired(false);
            entity.Property(e => e.SLADays).IsRequired(false);
            entity.Property(e => e.CodeFormat).HasMaxLength(100).HasColumnType("varchar(100)").IsUnicode(false).IsRequired();
            entity.Property(e => e.DisplaySequence).IsRequired();
            entity.HasIndex(e => e.GrievanceTypeCode).IsUnique().HasDatabaseName("UQ_GrievanceCategoryMaster_GrievanceTypeCode");
            entity.HasIndex(e => e.GrievanceTypeName).IsUnique().HasDatabaseName("UQ_GrievanceCategoryMaster_GrievanceTypeName");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnName("CreatedDate").HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnName("UpdatedDate").HasColumnType("datetime").IsRequired(false);
        });

        // AssetGrievanceRemarkMaster configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceRemarkMasterEntity>(entity =>
        {
            entity.ToTable("GrievanceRemarkMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.GrievanceCategoryId).IsRequired();
            entity.Property(e => e.Remark).HasMaxLength(150).HasColumnType("nvarchar(150)").IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500).HasColumnType("nvarchar(500)").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnName("CreatedDate").HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnName("UpdatedDate").HasColumnType("datetime").IsRequired(false);

            entity.HasOne(e => e.GrievanceCategory)
                .WithMany()
                .HasForeignKey(e => e.GrievanceCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CVRateMasterEntity>(entity =>
        {
            entity.ToTable("CVRateMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.SubZoneId);
            entity.Property(e => e.TypeOfUseGroupCVId);
            entity.Property(e => e.FloorGroupId);
            entity.Property(e => e.AssessmentYearRangeId);
            entity.Property(e => e.RateAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        // MergeDetails configuration
        modelBuilder.Entity<MergeDetailEntity>(entity =>
        {
            entity.ToTable("MergeDetails", "GSMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd().UseIdentityColumn(1, 1);
            entity.Property(e => e.PropertyMapDetailId).IsRequired();
            entity.Property(e => e.OwnerName).HasMaxLength(1000).IsUnicode(true);
            entity.Property(e => e.OwnerNameEnglish).HasMaxLength(1000).IsUnicode(false);
            entity.Property(e => e.OccupierName).HasMaxLength(1000).IsUnicode(true);
            entity.Property(e => e.OccupierNameEnglish).HasMaxLength(1000).IsUnicode(false);
            entity.Property(e => e.MobileNo).HasMaxLength(13).IsUnicode(false);
            entity.Property(e => e.Address).HasMaxLength(500).IsUnicode(true);
            entity.Property(e => e.AddressEnglish).HasMaxLength(500).IsUnicode(false);
            entity.Property(e => e.BuilderName).HasMaxLength(200).IsUnicode(true);
            entity.Property(e => e.BuilderNameEnglish).HasMaxLength(200).IsUnicode(false);
            entity.Property(e => e.FlatOrShopNo).HasMaxLength(100).IsUnicode(true);
            entity.Property(e => e.FlatOrShopNoEnglish).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.FlatOrShopName).HasMaxLength(200).IsUnicode(true);
            entity.Property(e => e.FlatOrShopNameEnglish).HasMaxLength(200).IsUnicode(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy).IsRequired();
            entity.Property(e => e.CreatedDate).IsRequired().HasColumnType("datetime2(0)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).IsRequired(false).HasColumnType("datetime2(0)");

            // Foreign key
            entity.HasOne(e => e.PropertyMapDetail)
                .WithOne(e => e.MergeDetail)
                .HasForeignKey<MergeDetailEntity>(e => e.PropertyMapDetailId).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MergeDetails_PropertyMapDetail");

        });

        // ===================== Retrospective Tax Rule Engine =====================
        modelBuilder.Entity<EvidenceTypeMasterEntity>(entity =>
        {
            entity.ToTable("EvidenceTypeMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EvidenceCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.EvidenceName).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.EvidenceCode).IsUnique();
        });

        modelBuilder.Entity<RetrospectiveRuleMasterEntity>(entity =>
        {
            entity.ToTable("RetrospectiveRuleMaster", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RuleCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.RuleName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.RuleDescription).HasMaxLength(1000);
            entity.Property(e => e.MatchType).IsRequired().HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.RuleStatus).IsRequired().HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.AuthorizationStatus).HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.VersionNo).HasMaxLength(20).HasColumnType("varchar(20)");
            entity.Property(e => e.ResolutionRef).HasMaxLength(200).HasColumnType("varchar(200)");
            entity.Property(e => e.Remarks).HasMaxLength(1000);
            entity.HasIndex(e => e.RuleCode).IsUnique();
        });

        modelBuilder.Entity<RetrospectiveTaxPolicyEntity>(entity =>
        {
            entity.ToTable("RetrospectiveTaxPolicy", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaxPolicyCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.TaxPolicyName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.RateMode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.PercentageMode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.FixedPercentage).HasColumnType("decimal(10,2)");
            entity.HasIndex(e => e.TaxPolicyCode).IsUnique();
            entity.HasIndex(e => e.IsActive).IsUnique().HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<RetrospectiveRuleEvidenceConditionEntity>(entity =>
        {
            entity.ToTable("RetrospectiveRuleEvidenceCondition", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EvidenceState).IsRequired().HasMaxLength(20).HasColumnType("varchar(20)");

            entity.HasOne(e => e.Rule)
                .WithMany()
                .HasForeignKey(e => e.RuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.EvidenceType)
                .WithMany()
                .HasForeignKey(e => e.EvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.RuleId, e.EvidenceTypeId }).IsUnique().HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<RetrospectiveRuleDateConditionEntity>(entity =>
        {
            entity.ToTable("RetrospectiveRuleDateCondition", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ComparatorCode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.CompareOperator).HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.CompareGapUnit).HasMaxLength(10).HasColumnType("varchar(10)");

            entity.HasOne(e => e.Rule)
                .WithMany()
                .HasForeignKey(e => e.RuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.LeftEvidenceType)
                .WithMany()
                .HasForeignKey(e => e.LeftEvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RightEvidenceType)
                .WithMany()
                .HasForeignKey(e => e.RightEvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.RuleId).IsUnique().HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<RetrospectiveRuleActionEntity>(entity =>
        {
            entity.ToTable("RetrospectiveRuleAction", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaxStartMode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.RetrospectiveLimitType).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.TaxCalculationMode).IsRequired().HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.RateMode).IsRequired().HasMaxLength(20).HasColumnType("varchar(20)");
            entity.Property(e => e.TaxMultiplier).HasColumnType("decimal(10,2)");
            entity.Property(e => e.SplitMultiplier).HasColumnType("decimal(10,2)");
            entity.Property(e => e.AfterSplitMultiplier).HasColumnType("decimal(10,2)");

            entity.HasOne(e => e.Rule)
                .WithMany()
                .HasForeignKey(e => e.RuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.StartEvidenceType)
                .WithMany()
                .HasForeignKey(e => e.StartEvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SplitStartEvidenceType)
                .WithMany()
                .HasForeignKey(e => e.SplitStartEvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SplitEndEvidenceType)
                .WithMany()
                .HasForeignKey(e => e.SplitEndEvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.RuleId).IsUnique().HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<RetrospectivePenaltyRuleEntity>(entity =>
        {
            entity.ToTable("RetrospectivePenaltyRule", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PenaltyMode).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.PenaltyPercent).HasColumnType("decimal(10,2)");
            entity.Property(e => e.PenaltyDateSourceType).HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.PenaltyDateCondition).HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.ElseAction).HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.Rule)
                .WithMany()
                .HasForeignKey(e => e.RuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PenaltyDateEvidenceType)
                .WithMany()
                .HasForeignKey(e => e.PenaltyDateEvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.RuleId).IsUnique().HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<RetrospectiveRuleSummaryEntity>(entity =>
        {
            entity.ToTable("RetrospectiveRuleSummary", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.WhenSummary).HasMaxLength(1000);
            entity.Property(e => e.TaxSummary).HasMaxLength(1000);
            entity.Property(e => e.PenaltySummary).HasMaxLength(1000);

            entity.HasOne(e => e.Rule)
                .WithMany()
                .HasForeignKey(e => e.RuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.RuleId).IsUnique().HasFilter("[IsActive] = 1");
        });

        modelBuilder.Entity<RetrospectiveTaxCalculationEntity>(entity =>
        {
            entity.ToTable("RetrospectiveTaxCalculation", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CalculationMode).IsRequired().HasMaxLength(20).HasColumnType("varchar(20)");
            entity.Property(e => e.AuthorizationStatus).HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.CalculationStatus).IsRequired().HasMaxLength(30).HasColumnType("varchar(30)");
            entity.Property(e => e.Remarks).HasMaxLength(1000);
            entity.Property(e => e.BaseTaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.RetrospectiveTaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PenaltyAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.AppliedRule)
                .WithMany()
                .HasForeignKey(e => e.AppliedRuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AppliedTaxPolicy)
                .WithMany()
                .HasForeignKey(e => e.AppliedTaxPolicyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.PropertyId, e.CreatedDate });
        });

        modelBuilder.Entity<RetrospectiveCalculationEvidenceEntity>(entity =>
        {
            entity.ToTable("RetrospectiveCalculationEvidence", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SourceReference).HasMaxLength(200).HasColumnType("varchar(200)");

            entity.HasOne(e => e.Calculation)
                .WithMany()
                .HasForeignKey(e => e.CalculationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.EvidenceType)
                .WithMany()
                .HasForeignKey(e => e.EvidenceTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RetrospectiveTaxCalculationDetailEntity>(entity =>
        {
            entity.ToTable("RetrospectiveTaxCalculationDetail", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FinancialYear).IsRequired().HasMaxLength(20).HasColumnType("varchar(20)");
            entity.Property(e => e.RateMode).HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.PercentageMode).HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.BaseTaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxMultiplier).HasColumnType("decimal(10,2)");
            entity.Property(e => e.RetrospectiveTaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PenaltyPercent).HasColumnType("decimal(10,2)");
            entity.Property(e => e.PenaltyAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Calculation)
                .WithMany()
                .HasForeignKey(e => e.CalculationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.CalculationId, e.PropertyId, e.FloorId });
        });

        modelBuilder.Entity<RetrospectiveRuleAuditLogEntity>(entity =>
        {
            entity.ToTable("RetrospectiveRuleAuditLog", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ActionType).IsRequired().HasMaxLength(50).HasColumnType("varchar(50)");
            entity.Property(e => e.OldValue).HasColumnType("nvarchar(max)");
            entity.Property(e => e.NewValue).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Remarks).HasMaxLength(1000);

            entity.HasOne(e => e.Rule)
                .WithMany()
                .HasForeignKey(e => e.RuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.RuleId, e.CreatedDate });
        });

        modelBuilder.Entity<PropertySection129ScheduleEntity>(entity =>
        {
            entity.ToTable("PropertySection129Schedule", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaxPercentage).HasColumnType("decimal(5,2)");
            entity.Property(e => e.OldTaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.FullBasisTaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.StageTaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.PropertyMast)
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PropertyDetails)
                .WithMany()
                .HasForeignKey(e => e.PropertyDetailsId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FinanceYear)
                .WithMany()
                .HasForeignKey(e => e.FinanceYearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PolicyCodeMaster)
                .WithMany()
                .HasForeignKey(e => e.PolicyCodeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Tax)
                .WithMany()
                .HasForeignKey(e => e.TaxId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.PropertyId, e.FinanceYearId })
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("UX_PropertySection129Schedule_Property_Year");
        });

        modelBuilder.Entity<PropertySection129ApplicationEntity>(entity =>
        {
            entity.ToTable("PropertySection129Application", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ChangeDetailsRemark).HasMaxLength(500);
            entity.Property(e => e.Remark).HasMaxLength(1000);
            entity.Property(e => e.UseOcDateBasis).IsRequired().HasDefaultValue(false);

            entity.HasOne(e => e.PropertyMast)
                .WithMany()
                .HasForeignKey(e => e.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.StartFinanceYearOverride)
                .WithMany()
                .HasForeignKey(e => e.StartFinanceYearIdOverride)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PropertyId)
                .IsUnique()
                .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0")
                .HasDatabaseName("UX_PropertySection129Application_PropertyId");
        });

        modelBuilder.Entity<WardSection129MasterEntity>(entity =>
        {
            entity.ToTable("WardSection129Master", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasOne(e => e.Ward)
                .WithMany()
                .HasForeignKey(e => e.WardId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.WardId)
                .IsUnique()
                .HasDatabaseName("UX_WardSection129Master_WardId");
        });

        modelBuilder.Entity<VillageMasterEntity>(entity =>
        {
            entity.ToTable("VillageMaster", "GSMS");
            entity.HasKey(e => e.Id).HasName("PK_VillageMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.ZoneId).IsRequired();
            entity.Property(e => e.VillageName).IsRequired().HasMaxLength(100).HasColumnType("nvarchar(100)");
            entity.Property(e => e.VillageNameEnglish).HasMaxLength(100).HasColumnType("varchar(100)");
            entity.Property(e => e.Pincode).HasMaxLength(20).HasColumnType("varchar(20)");

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasOne(e => e.Zone)
                .WithMany()
                .HasForeignKey(e => e.ZoneId)
                .HasConstraintName("FK_VillageMaster_ZoneMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ---------------------------------------------------------------------------------------
        // CDC-based Master Data Change Notification pipeline — these three tables are populated by
        // PTIS.usp_ProcessCdcChanges (built at the DB layer, outside EF migrations). The app only
        // reads MasterDataChangeBatch/Event and updates PropertyTaxRecalcFlag's resolution columns.
        // No HasKey/identity config needed beyond Id since these mirror already-existing tables.
        // ---------------------------------------------------------------------------------------
        modelBuilder.Entity<MasterDataChangeBatchEntity>(entity =>
        {
            entity.ToTable("MasterDataChangeBatch", "CORE");
            entity.Property(e => e.DepartmentCode).HasMaxLength(20).IsRequired();
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.SourceSchema).HasMaxLength(128).IsRequired();
            entity.Property(e => e.SourceTable).HasMaxLength(128).IsRequired();
            entity.Property(e => e.CalculationType).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.Property(e => e.RemarkSummary).HasMaxLength(1000);
            entity.Property(e => e.ErrorDetail);
            entity.Property(e => e.CdcStartLsn).HasColumnType("binary(10)");
        });

        modelBuilder.Entity<MasterDataChangeEventEntity>(entity =>
        {
            entity.ToTable("MasterDataChangeEvent", "CORE");
            entity.Property(e => e.DepartmentCode).HasMaxLength(20).IsRequired();
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.SourceSchema).HasMaxLength(128).IsRequired();
            entity.Property(e => e.SourceTable).HasMaxLength(128).IsRequired();
            entity.Property(e => e.ChangeType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ChangedBySqlLogin).HasMaxLength(256);
            entity.Property(e => e.DatabaseUser).HasMaxLength(256);
            entity.Property(e => e.ApplicationName).HasMaxLength(256);
            entity.Property(e => e.ClientIp).HasMaxLength(64);
            entity.Property(e => e.CdcStartLsn).HasColumnType("binary(10)");
            entity.Property(e => e.CdcSeqVal).HasColumnType("binary(10)");
            entity.Property(e => e.DetectionSource).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ChangeSource).HasMaxLength(20);
            entity.Property(e => e.AttributionStatus).HasMaxLength(20);

            entity.HasOne(e => e.Batch)
                .WithMany()
                .HasForeignKey(e => e.BatchId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PropertyTaxRecalcFlagEntity>(entity =>
        {
            entity.ToTable("PropertyTaxRecalcFlag", "PTIS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.CalculationType).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Remark).HasMaxLength(1000);
            entity.Property(e => e.FlaggedAt).HasColumnName("FlaggedAt");
            entity.Property(e => e.ResolvedAt).HasColumnName("ResolvedAt");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasIndex(e => new { e.PropertyId, e.FinanceYearId, e.CalculationType })
                .IsUnique()
                .HasFilter("[ResolvedAt] IS NULL AND [IsActive] = 1");
        });



        modelBuilder.Entity<BillingFrequencyMasterEntity>(entity =>
        {
            entity.ToTable("BillingFrequencyMaster", "WTIS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.BillingFrequencyCode).IsUnique();

            entity.Property(e => e.BillingFrequencyCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.BillingFrequency).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PeriodsPerYear).IsRequired();
            entity.Property(e => e.SequenceNo).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<BillingPeriodEntity>(entity =>
        {
            entity.ToTable("BillingPeriod", "WTIS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.BillingPeriodCode).IsUnique();
            entity.HasIndex(e => new { e.FinancialYearId, e.BillingFrequencyId, e.SequenceNo }).IsUnique();

            entity.Property(e => e.BillingPeriodCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.FinancialYearId).IsRequired();
            entity.Property(e => e.BillingFrequencyId).IsRequired();
            entity.Property(e => e.SequenceNo).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.PeriodFromDate).IsRequired();
            entity.Property(e => e.PeriodToDate).IsRequired();
            entity.Property(e => e.BillGenerationDate);
            entity.Property(e => e.DueDate);
            entity.Property(e => e.GraceDays).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.CurrentPenaltyStartDate);
            entity.Property(e => e.CurrentPenaltyEndDate);
            entity.Property(e => e.PendingPenaltyStartDate);
            entity.Property(e => e.PendingPenaltyEndDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.FinancialYear)
                .WithMany()
                .HasForeignKey(e => e.FinancialYearId)
                .HasConstraintName("FK_BillingPeriod_YearMaster")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.BillingFrequency)
                .WithMany()
                .HasForeignKey(e => e.BillingFrequencyId)
                .HasConstraintName("FK_BillingPeriod_BillingFrequencyMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MeterTypeMasterEntity>(entity =>
        {
            entity.ToTable("MeterTypeMaster", "WTIS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.MeterTypeCode).IsUnique();

            entity.Property(e => e.MeterTypeCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.MeterType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<ReadingSourceMasterEntity>(entity =>
        {
            entity.ToTable("ReadingSourceMaster", "WTIS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ReadingSourceCode).IsUnique();

            entity.Property(e => e.ReadingSourceCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.ReadingSource).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<MeterTestStatusMasterEntity>(entity =>
        {
            entity.ToTable("MeterTestStatusMaster", "WTIS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.MeterTestStatusCode).IsUnique();

            entity.Property(e => e.MeterTestStatusCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.MeterTestStatus).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<GeographyTypeMasterEntity>(entity =>
        {
            entity.ToTable("GeographyTypeMaster", "WTIS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.GeographyTypeCode).IsUnique();
            entity.HasIndex(e => e.LevelNo).IsUnique();

            entity.Property(e => e.GeographyTypeCode).IsRequired().HasMaxLength(30);
            entity.Property(e => e.GeographyType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LevelNo).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasCheckConstraint("CK_GeographyType_LevelNo", "[LevelNo] > 0");
        });

        modelBuilder.Entity<GeographyUnitEntity>(entity =>
        {
            entity.ToTable("GeographyUnit", "WTIS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.GeographyTypeId, e.GeographyUnitCode }).IsUnique();

            entity.Property(e => e.GeographyUnitCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.GeographyUnitName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.SearchSequence);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate);
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne(e => e.GeographyType)
                .WithMany()
                .HasForeignKey(e => e.GeographyTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ParentGeographyUnit)
                .WithMany()
                .HasForeignKey(e => e.ParentGeographyUnitId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasCheckConstraint("CK_GeographyUnit_NotOwnParent", "[ParentGeographyUnitId] <> [Id]");
        });

        modelBuilder.Entity<GisAssetGeometryEntity>(entity =>
        {
            entity.ToTable("GisAssetGeometry", "AMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.AssetMasterId).HasDatabaseName("IX_GisAssetGeometry_AssetMasterId");
            entity.HasIndex(e => e.BuildingId).HasDatabaseName("IX_GisAssetGeometry_BuildingId");

            if (this is ReportDataDbContext)
            {
                entity.Ignore(e => e.PolygonGeometry);
            }
            else if (Database.IsSqlServer())
            {
                entity.Property(e => e.PolygonGeometry).HasColumnType("geometry");
            }
            else if (Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) == true)
            {
                entity.Ignore(e => e.PolygonGeometry);
            }
        });

        modelBuilder.Entity<FieldTypeMasterEntity>(entity =>
        {
            entity.ToTable("FieldTypeMaster", "GSMS");
            entity.HasKey(e => e.Id).HasName("PK_FieldTypeMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FieldTypeName).IsRequired().HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
        });

        modelBuilder.Entity<ScreenFieldMasterEntity>(entity =>
        {
            entity.ToTable("ScreenFieldMaster", "GSMS");
            entity.HasKey(e => e.Id).HasName("PK_ScreenFieldMaster");
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FieldCode).IsRequired().HasMaxLength(25).IsUnicode(false);
            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.FieldTypeId).IsRequired();
            entity.Property(e => e.DefaultDisplayOrder);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.FieldType)
                .WithMany(ft => ft.ScreenFields)
                .HasForeignKey(e => e.FieldTypeId)
                .HasConstraintName("FK_ScreenFieldMaster_FieldTypeMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ScreenFieldValidationEntity>(entity =>
        {
            entity.ToTable("ScreenFieldValidation", "GSMS");
            entity.HasKey(e => e.Id).HasName("PK_ScreenFieldValidation");

            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserRoleAllocationId);
            entity.Property(e => e.ScreenId).IsRequired();
            entity.Property(e => e.ScreenFieldId).IsRequired();

            entity.Property(e => e.IsVisible).HasDefaultValue(true);
            entity.Property(e => e.IsMandatory).HasDefaultValue(false);
            entity.Property(e => e.IsReadonly).HasDefaultValue(false);

            entity.Property(e => e.MinLength);
            entity.Property(e => e.MaxLength);
            entity.Property(e => e.ValidationExpression).HasMaxLength(100).IsUnicode(true);
            entity.Property(e => e.ErrorMessage).HasMaxLength(200).IsUnicode(true);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.UserRoleAllocation)
                .WithMany()
                .HasForeignKey(e => e.UserRoleAllocationId)
                .HasConstraintName("FK_ScreenFieldValidation_UserRoleAllocation")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ScreenMaster)
                .WithMany()
                .HasForeignKey(e => e.ScreenId)
                .HasConstraintName("FK_ScreenFieldValidation_ScreenMaster")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ScreenFieldMaster)
                .WithMany(sf => sf.ScreenFieldValidations)
                .HasForeignKey(e => e.ScreenFieldId)
                .HasConstraintName("FK_ScreenFieldValidation_ScreenFieldMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        // OnModelCreating mappings
        modelBuilder.Entity<ButtonTypeMasterEntity>(entity =>
        {
            entity.ToTable("ButtonTypeMaster", "GSMS");
            entity.HasKey(e => e.Id).HasName("PK_ButtonTypeMaster");

            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ButtonTypeName).IsRequired().HasMaxLength(50).IsUnicode(true);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
        });

        modelBuilder.Entity<ScreenButtonMasterEntity>(entity =>
        {
            entity.ToTable("ScreenButtonMaster", "GSMS");
            entity.HasKey(e => e.Id).HasName("PK_ScreenButtonMaster");

            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ButtonCode).IsRequired().HasMaxLength(50).IsUnicode(true);
            entity.Property(e => e.ButtonName).IsRequired().HasMaxLength(100).IsUnicode(true);
            entity.Property(e => e.ButtonTypeId).IsRequired();
            entity.Property(e => e.DisplayOrder);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.ButtonTypeMaster)
                .WithMany(bt => bt.ScreenButtons)
                .HasForeignKey(e => e.ButtonTypeId)
                .HasConstraintName("FK_ScreenButtonMaster_ButtonTypeMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ScreenButtonPermissionEntity>(entity =>
        {
            entity.ToTable("ScreenButtonPermission", "GSMS");
            entity.HasKey(e => e.Id).HasName("PK_ScreenButtonPermission");

            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserRoleAllocationId);
            entity.Property(e => e.ScreenId).IsRequired();
            entity.Property(e => e.ScreenButtonId).IsRequired();

            entity.Property(e => e.IsVisible).HasDefaultValue(true);
            entity.Property(e => e.IsEnabled).HasDefaultValue(true);
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");

            entity.HasOne(e => e.UserRoleAllocation)
                .WithMany()
                .HasForeignKey(e => e.UserRoleAllocationId)
                .HasConstraintName("FK_ScreenButtonPermission_UserRoleAllocation")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ScreenMaster)
                .WithMany()
                .HasForeignKey(e => e.ScreenId)
                .HasConstraintName("FK_ScreenButtonPermission_ScreenMaster")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ScreenButtonMaster)
                .WithMany(sb => sb.ScreenButtonPermissions)
                .HasForeignKey(e => e.ScreenButtonId)
                .HasConstraintName("FK_ScreenButtonPermission_ScreenButtonMaster")
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetGrievanceDetails configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceDetailsEntity>(entity =>
        {
            entity.ToTable("GrievanceDetails", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.GrievanceNo).HasMaxLength(30).HasColumnType("varchar(30)").IsRequired();
            entity.Property(e => e.TargetTableName).HasMaxLength(200).HasColumnType("varchar(200)").IsRequired(false);
            entity.Property(e => e.Description).HasColumnType("nvarchar(2000)").IsRequired();
            entity.Property(e => e.RaisedByChannel).HasMaxLength(20).HasColumnType("varchar(20)").IsRequired();
            entity.Property(e => e.RaisedByUserId).IsRequired();
            entity.Property(e => e.ApplicantName).HasMaxLength(200).HasColumnType("nvarchar(200)").IsRequired(false);
            entity.Property(e => e.ApplicantMobile).HasMaxLength(13).HasColumnType("varchar(13)").IsRequired(false);
            entity.Property(e => e.ApplicantEmail).HasMaxLength(100).HasColumnType("nvarchar(100)").IsRequired(false);
            entity.Property(e => e.WorkflowStatus).HasMaxLength(50).HasColumnType("varchar(50)").IsRequired().HasDefaultValue("Raised");
            entity.Property(e => e.CurrentCycleNo).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.Priority).HasMaxLength(10).HasColumnType("varchar(10)").IsRequired().HasDefaultValue("NORMAL");

            entity.HasIndex(e => new { e.TargetTableName, e.TargetRecordId })
                  .IsUnique()
                  .HasFilter("[IsActive] = 1 AND [MarkedForDeletion] = 0 AND [WorkflowStatus] NOT IN ('Resolved','Rejected','Closed') AND [TargetRecordId] IS NOT NULL")
                  .HasDatabaseName("IX_GrievanceDetails_ActiveTarget");

            entity.HasOne(e => e.AssetGrievanceCategory)
                  .WithMany()
                  .HasForeignKey(e => e.GrievanceTypeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<AssetMasterEntity>()
                  .WithMany()
                  .HasForeignKey(e => e.AssetId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetGrievanceCorrectionDetail configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceCorrectionDetailEntity>(entity =>
        {
            entity.ToTable("GrievanceCorrectionDetail", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.TargetTableName).HasMaxLength(200).HasColumnType("varchar(200)").IsRequired();
            entity.Property(e => e.BeforeData).HasColumnType("nvarchar(max)").IsRequired(false);
            entity.Property(e => e.AfterData).HasColumnType("nvarchar(max)").IsRequired();
            entity.Property(e => e.ProposedDate).HasColumnType("datetime").IsRequired();
            entity.Property(e => e.IsApplied).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.AppliedDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasIndex(e => e.GrievanceDetailsId);
            entity.HasIndex(e => new { e.TargetTableName, e.RecordId });

            entity.HasOne(e => e.GrievanceDetails)
                  .WithMany()
                  .HasForeignKey(e => e.GrievanceDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetGrievanceActionHistory configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceActionHistoryEntity>(entity =>
        {
            entity.ToTable("GrievanceActionHistory", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.Action).HasMaxLength(50).HasColumnType("varchar(50)").IsRequired();
            entity.Property(e => e.PreviousWorkflowStatus).HasMaxLength(50).HasColumnType("varchar(50)").IsRequired();
            entity.Property(e => e.NewWorkflowStatus).HasMaxLength(50).HasColumnType("varchar(50)").IsRequired();
            entity.Property(e => e.Remarks).HasMaxLength(1000).HasColumnType("nvarchar(1000)").IsRequired(false);
            entity.Property(e => e.ActionDate).HasColumnType("datetime").IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime").IsRequired(false);

            entity.HasIndex(e => new { e.GrievanceDetailsId, e.CycleNo });
            entity.HasIndex(e => new { e.GrievanceDetailsId, e.Action, e.ActionDate });

            entity.HasOne(e => e.GrievanceDetails)
                  .WithMany()
                  .HasForeignKey(e => e.GrievanceDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetGrievanceDocumentType configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceDocumentTypeEntity>(entity =>
        {
            entity.ToTable("AssetGrievanceDocumentType", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.DocumentTypeCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.DocumentTypeName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasIndex(e => e.DocumentTypeCode).IsUnique();

            entity.HasOne(e => e.AssetGrievanceCategory)
                  .WithMany()
                  .HasForeignKey(e => e.GrievanceCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetGrievanceDocument configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceDocumentEntity>(entity =>
        {
            entity.ToTable("AssetGrievanceDocument", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");

            entity.HasOne(e => e.GrievanceDetails)
                  .WithMany()
                  .HasForeignKey(e => e.GrievanceDetailsId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DocumentType)
                  .WithMany()
                  .HasForeignKey(e => e.DocumentTypeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DocumentBinding)
                  .WithMany()
                  .HasForeignKey(e => e.DocumentBindingId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetGrievanceMediaCorrection configuration (AMS schema)
        modelBuilder.Entity<AssetGrievanceMediaCorrectionEntity>(entity =>
        {
            entity.ToTable("GrievanceMediaCorrection", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.TargetMediaType).HasMaxLength(20).HasColumnType("varchar(20)").IsRequired();
            entity.Property(e => e.ActionType).HasMaxLength(10).HasColumnType("varchar(10)").IsRequired();
            entity.Property(e => e.Remarks).HasMaxLength(500).HasColumnType("nvarchar(500)").IsRequired(false);
            entity.Property(e => e.IsApproved).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsApplied).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.AppliedDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");

            entity.HasIndex(e => e.GrievanceId);

            entity.HasOne(e => e.Grievance)
                  .WithMany()
                  .HasForeignKey(e => e.GrievanceId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<DocumentBindingEntity>()
                  .WithMany()
                  .HasForeignKey(e => e.NewDocumentBindingId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<AssetPhotoTypeEntity>()
                  .WithMany()
                  .HasForeignKey(e => e.PhotoTypeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<AssetDocumentDefinitionEntity>()
                  .WithMany()
                  .HasForeignKey(e => e.DocumentDefinitionId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasCheckConstraint("CK_GrievanceMediaCorrection_Action", "[ActionType] IN ('ADD','REPLACE','DELETE')");
            entity.HasCheckConstraint("CK_GrievanceMediaCorrection_Type", "[TargetMediaType] IN ('PHOTO','DOCUMENT')");
        });





        // GrievanceWorkflowStageMaster configuration (AMS schema)
        modelBuilder.Entity<GrievanceWorkflowStageMasterEntity>(entity =>
        {
            entity.ToTable("GrievanceWorkflowStageMaster", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.UlbTypeId).IsRequired();
            entity.Property(e => e.StageCode).HasMaxLength(50).HasColumnType("varchar(50)").IsRequired();
            entity.Property(e => e.StageName).HasMaxLength(100).HasColumnType("nvarchar(100)").IsRequired();
            entity.Property(e => e.StageNameLocal).HasMaxLength(100).HasColumnType("nvarchar(100)").IsRequired(false);
            entity.Property(e => e.StageOrder).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).HasColumnType("varchar(50)").IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500).HasColumnType("nvarchar(500)").IsRequired(false);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnName("CreatedDate").HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnName("UpdatedDate").HasColumnType("datetime").IsRequired(false);

            entity.HasIndex(e => new { e.UlbTypeId, e.StageCode })
                  .IsUnique()
                  .HasFilter("[MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.UlbTypeId, e.StageName })
                  .IsUnique()
                  .HasFilter("[MarkedForDeletion] = 0");
            entity.HasIndex(e => new { e.UlbTypeId, e.StageOrder })
                  .IsUnique()
                  .HasFilter("[MarkedForDeletion] = 0");
        });

        // GrievanceStageAccessControl configuration (AMS schema)
        modelBuilder.Entity<GrievanceStageAccessControlEntity>(entity =>
        {
            entity.ToTable("StageAccessControl", "AMS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.StageId).IsRequired();
            entity.Property(e => e.DesignationId).IsRequired(false);
            entity.Property(e => e.UserId).IsRequired(false);
            entity.Property(e => e.CanTakeAction).IsRequired().HasDefaultValue(true);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime").IsRequired(false);
            entity.Property(e => e.CreatedBy).IsRequired(false);
            entity.Property(e => e.CreatedDate).HasColumnName("CreatedDate").HasColumnType("datetime").IsRequired().HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy).IsRequired(false);
            entity.Property(e => e.UpdatedDate).HasColumnName("UpdatedDate").HasColumnType("datetime").IsRequired(false);

            entity.HasOne(e => e.Stage)
                  .WithMany()
                  .HasForeignKey(e => e.StageId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.StageId, e.UserId, e.DesignationId })
                  .HasFilter("[MarkedForDeletion] = 0");
        });
        modelBuilder.Entity<PayrollBloodGroupMasterEntity>(entity =>
        {
            entity.ToTable("BloodGroupMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.BloodGroupCode)
                .IsUnique();

            entity.HasIndex(e => e.BloodGroupName)
                .IsUnique();

            entity.Property(e => e.BloodGroupCode).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.BloodGroupName).IsRequired().HasMaxLength(50).IsUnicode(false);
            
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollGenderMasterEntity>(entity =>
        {
            entity.ToTable("GenderMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.GenderCode)
                .IsUnique();

            entity.Property(e => e.GenderCode).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.GenderName).IsRequired().HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.GenderNameRegional).HasMaxLength(100);
            
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollMaritalStatusMasterEntity>(entity =>
        {
            entity.ToTable("MaritalStatusMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.MaritalStatusCode)
                .IsUnique();

            entity.Property(e => e.MaritalStatusCode).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.MaritalStatusName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.MaritalStatusNameRegional).HasMaxLength(150);
            
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollQualificationMasterEntity>(entity =>
        {
            entity.ToTable("QualificationMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.QualificationCode)
                .IsUnique();

            entity.Property(e => e.QualificationCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.QualificationName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.QualificationNameRegional).HasMaxLength(150);
            
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollRelationshipMasterEntity>(entity =>
        {
            entity.ToTable("RelationshipMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.RelationshipCode)
                .IsUnique();

            entity.Property(e => e.RelationshipCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.RelationshipName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.RelationshipNameRegional).HasMaxLength(150);
            
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollDepartmentMasterEntity>(entity =>
        {
            entity.ToTable("DepartmentMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.DepartmentCode)
                .IsUnique();

            entity.Property(e => e.DepartmentCode).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.DepartmentName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.DepartmentNameMarathi).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollDesignationMasterEntity>(entity =>
        {
            entity.ToTable("DesignationMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.DesignationCode)
                .IsUnique();

            entity.Property(e => e.DesignationCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.DesignationName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.DesignationNameMarathi).HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollEmployeeClassMasterEntity>(entity =>
        {
            entity.ToTable("EmployeeClassMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ClassCode)
                .IsUnique();

            entity.Property(e => e.ClassCode).IsRequired().HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.ClassName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.ClassNameMarathi).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(250);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollEmployeeTypeMasterEntity>(entity =>
        {
            entity.ToTable("EmployeeTypeMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.EmployeeTypeCode)
                .IsUnique();

            entity.Property(e => e.EmployeeTypeCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.EmployeeTypeName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.EmployeeTypeNameMarathi).HasMaxLength(150);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollEmployeeStatusMasterEntity>(entity =>
        {
            entity.ToTable("EmployeeStatusMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.EmployeeStatusCode)
                .IsUnique();

            entity.Property(e => e.EmployeeStatusCode).IsRequired().HasMaxLength(50).IsUnicode(false).HasDefaultValue("");
            entity.Property(e => e.EmployeeStatus).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.EmployeeStatusMarathi).HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollStateMasterEntity>(entity =>
        {
            entity.ToTable("StateMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.StateCode)
                .HasDatabaseName("UQ_PRMS_State")
                .IsUnique();

            entity.Property(e => e.StateCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.StateName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.StateNameRegional).HasColumnName("StateNameRegional").HasMaxLength(100);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });

        modelBuilder.Entity<PayrollDistrictMasterEntity>(entity =>
        {
            entity.ToTable("DistrictMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.StateId, e.DistrictCode })
                .HasDatabaseName("UQ_PRMS_District")
                .IsUnique();

            entity.Property(e => e.StateId).IsRequired();
            entity.Property(e => e.DistrictCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.DistrictName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.DistrictNameRegional).HasColumnName("DistrictNameRegional").HasMaxLength(150);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne<PayrollStateMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.StateId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_PRMS_District_State");
        });

        modelBuilder.Entity<PayrollTalukaMasterEntity>(entity =>
        {
            entity.ToTable("TalukaMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.DistrictId, e.TalukaCode })
                .HasDatabaseName("UQ_PRMS_Taluka")
                .IsUnique();

            entity.Property(e => e.DistrictId).IsRequired();
            entity.Property(e => e.TalukaCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.TalukaName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.TalukaNameRegional).HasColumnName("TalukaNameRegional").HasMaxLength(150);
            entity.Property(e => e.IsCity).IsRequired().HasDefaultValue(false);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne<PayrollDistrictMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.DistrictId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_PRMS_Taluka_District");
        });

        modelBuilder.Entity<PayrollVillageMasterEntity>(entity =>
        {
            entity.ToTable("VillageMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.TalukaId, e.VillageCode })
                .HasDatabaseName("UQ_PRMS_Village")
                .IsUnique();

            entity.Property(e => e.TalukaId).IsRequired();
            entity.Property(e => e.VillageCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.VillageName).IsRequired().HasMaxLength(120).IsUnicode(false);
            entity.Property(e => e.VillageNameRegional).HasColumnName("VillageNameRegional").HasMaxLength(150);
            entity.Property(e => e.PINCode).HasMaxLength(10).IsUnicode(false);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);

            entity.HasOne<PayrollTalukaMasterEntity>()
                .WithMany()
                .HasForeignKey(e => e.TalukaId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_PRMS_Village_Taluka");
        });

        modelBuilder.Entity<PayrollZoneDivisionMasterEntity>(entity =>
        {
            entity.ToTable("ZoneDivisionMaster", "PRMS");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ZoneDivisionCode)
                .HasDatabaseName("UQ_ZoneDivisionMaster_Code")
                .IsUnique();

            entity.Property(e => e.ZoneDivisionCode).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.ZoneDivisionName).IsRequired().HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.ZoneDivisionNameRegional).HasColumnName("ZoneDivisionNameRegional").HasMaxLength(150);
            entity.Property(e => e.Address).HasMaxLength(500);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("getdate()");
            entity.Property(e => e.UpdatedBy);
            entity.Property(e => e.UpdatedDate);
        });
 modelBuilder.Entity<CitizenMasterEntity>(entity =>
        {
            entity.ToTable("CitizenMaster", "CORE");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.MobileNo, "UQ_CitizenMaster_MobileNo").IsUnique();
            entity.HasIndex(e => new { e.Id, e.MobileNo }, "UQ_CitizenMaster_Id_MobileNo").IsUnique();

            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.MobileNo).IsRequired().HasMaxLength(15).IsUnicode(false);
            entity.Property(e => e.IsVerified).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.FailedOtpCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.LockedUntilAt).HasColumnType("datetime");
            entity.Property(e => e.LastLoginAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);
        });

        modelBuilder.Entity<CitizenOtpLogEntity>(entity =>
        {
            entity.ToTable("CitizenOtpLog", "CORE");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.MobileNo, e.Purpose, e.IsUsed, e.ExpiresAt }, "IX_CitizenOtpLog_MobileNo_Purpose");
            entity.HasIndex(e => new { e.CitizenId, e.MobileNo }, "IX_CitizenOtpLog_CitizenId_MobileNo");

            entity.Property(e => e.MobileNo).IsRequired().HasMaxLength(15).IsUnicode(false);
            entity.Property(e => e.Purpose).IsRequired().HasMaxLength(50).IsUnicode(false).HasDefaultValue("LOGIN");
            entity.Property(e => e.ModuleCode).HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.ReferenceId).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.OtpHash).IsRequired().HasMaxLength(256).IsUnicode(false);
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime").IsRequired();
            entity.Property(e => e.IsUsed).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.AttemptCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.IpAddress).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);

            entity.HasOne(e => e.Citizen)
                .WithMany(c => c.OtpLogs)
                .HasForeignKey(e => e.CitizenId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_CitizenOtpLog_CitizenId_MobileNo");
        });

        modelBuilder.Entity<GrievanceDepartmentMasterEntity>(entity =>
        {
            entity.ToTable("GrievanceDepartmentMaster", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.DepartmentName, "UQ_GrievanceDepartmentMaster_DepartmentName").IsUnique();

            // Unique filtered index: one GRV department per CORE department (nulls allowed for standalone)
            entity.HasIndex(e => e.CoreDepartmentId, "UQ_GrievanceDepartmentMaster_CoreDepartmentId")
                .IsUnique()
                .HasFilter("[CoreDepartmentId] IS NOT NULL");

            entity.Property(e => e.DepartmentName).IsRequired().HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.DepartmentNameLocal).HasMaxLength(150);
            entity.Property(e => e.CoreDepartmentId).IsRequired(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);

            // FK: GRV.GrievanceDepartmentMaster.CoreDepartmentId → CORE.DepartmentMaster.Id
            entity.HasOne(e => e.CoreDepartment)
                .WithMany()
                .HasForeignKey(e => e.CoreDepartmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_GrievanceDepartmentMaster_CoreDepartmentId");
        });

        modelBuilder.Entity<GrievanceTypeMasterEntity>(entity =>
        {
            entity.ToTable("GrievanceTypeMaster", "GRV");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.GrievanceType).HasMaxLength(150);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);

            entity.HasOne(e => e.GrievanceDepartment)
                .WithMany(d => d.GrievanceTypes)
                .HasForeignKey(e => e.GrievanceDepartmentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceTypeMaster_DepartmentId");
        });

        modelBuilder.Entity<GrievanceWorkflowEntity>(entity =>
        {
            entity.ToTable("GrievanceWorkflow", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.WorkflowName, "UQ_GrievanceWorkflow_WorkflowName").IsUnique();

            entity.Property(e => e.WorkflowName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.WorkflowNameLocal).HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsDefault).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);
        });

        modelBuilder.Entity<GrievanceWorkflowStateEntity>(entity =>
        {
            entity.ToTable("GrievanceWorkflowState", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.WorkflowId, "IX_GrievanceWorkflowState_WorkflowId");
            entity.HasIndex(e => e.WorkflowId, "UQ_GrievanceWorkflowState_Workflow_IsInitial")
                .HasFilter("[IsInitial] = 1")
                .IsUnique();

            entity.Property(e => e.StateName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.StateNameLocal).HasMaxLength(150);
            entity.Property(e => e.DisplayOrder).IsRequired();
            entity.Property(e => e.IsInitial).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsFinal).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);

            entity.HasOne(e => e.Workflow)
                .WithMany(w => w.States)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceWorkflowState_WorkflowId");
        });

        modelBuilder.Entity<GrievanceWorkflowTransitionEntity>(entity =>
        {
            entity.ToTable("GrievanceWorkflowTransition", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.WorkflowId, e.FromStateId, e.ToStateId, e.TransitionName }, "UQ_GrievanceWorkflowTransition_FromTo_Name").IsUnique();
            entity.HasIndex(e => e.WorkflowId, "IX_GrievanceWorkflowTransition_WorkflowId");
            entity.HasIndex(e => e.FromStateId, "IX_GrievanceWorkflowTransition_FromStateId");

            entity.Property(e => e.TransitionName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CanForwardToDept).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.RemarkRequired).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);

            entity.HasOne(e => e.Workflow)
                .WithMany(w => w.Transitions)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceWorkflowTransition_WorkflowId");

            entity.HasOne(e => e.FromState)
                .WithMany(s => s.OutgoingTransitions)
                .HasForeignKey(e => e.FromStateId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceWorkflowTransition_FromStateId");

            entity.HasOne(e => e.ToState)
                .WithMany(s => s.IncomingTransitions)
                .HasForeignKey(e => e.ToStateId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceWorkflowTransition_ToStateId");
        });

        modelBuilder.Entity<GrievanceApplicationEntity>(entity =>
        {
            entity.ToTable("GrievanceApplication", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.GrievanceNo, "UQ_GrievanceApplication_GrievanceNo").IsUnique();
            entity.HasIndex(e => e.CitizenId, "IX_GrievanceApplication_CitizenId");
            entity.HasIndex(e => e.GrievanceDepartmentId, "IX_GrievanceApplication_DepartmentId");
            entity.HasIndex(e => e.CurrentStateId, "IX_GrievanceApplication_CurrentState");
            entity.HasIndex(e => e.CurrentAssignedToUserId, "IX_GrievanceApplication_AssignedTo");

            entity.Property(e => e.GrievanceNo).IsRequired().HasMaxLength(30).IsUnicode(false);
            entity.Property(e => e.RoadLandmark).HasMaxLength(500);
            entity.Property(e => e.Latitude);
            entity.Property(e => e.Longitude);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.SubmittedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.ResolvedDate).HasColumnType("datetime");
            entity.Property(e => e.ClosedDate).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);

            entity.HasOne(e => e.Citizen)
                .WithMany()
                .HasForeignKey(e => e.CitizenId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_CitizenId");

            entity.HasOne(e => e.GrievanceDepartment)
                .WithMany(d => d.GrievanceApplications)
                .HasForeignKey(e => e.GrievanceDepartmentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_DepartmentId");

            entity.HasOne(e => e.GrievanceType)
                .WithMany(t => t.GrievanceApplications)
                .HasForeignKey(e => e.GrievanceTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_TypeId");

            entity.HasOne(e => e.Workflow)
                .WithMany(w => w.GrievanceApplications)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_WorkflowId");

            entity.HasOne(e => e.CurrentState)
                .WithMany(s => s.GrievanceApplications)
                .HasForeignKey(e => e.CurrentStateId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_CurrentStateId");

            entity.HasOne(e => e.CurrentAssignedToUser)
                .WithMany()
                .HasForeignKey(e => e.CurrentAssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_AssignedTo");

            entity.HasOne(e => e.Ward)
                .WithMany()
                .HasForeignKey(e => e.WardId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_WardId");

            entity.HasOne(e => e.Zone)
                .WithMany()
                .HasForeignKey(e => e.ZoneId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceApplication_ZoneId");
        });

        modelBuilder.Entity<GrievanceActivityLogEntity>(entity =>
        {
            entity.ToTable("GrievanceActivityLog", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.GrievanceApplicationId, "IX_GrievanceActivityLog_GrievanceId");
            entity.HasIndex(e => e.ActionByUserId, "IX_GrievanceActivityLog_ActionBy");

            entity.Property(e => e.Remark).HasMaxLength(2000);
            entity.Property(e => e.ActionAt).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");

            entity.HasOne(e => e.GrievanceApplication)
                .WithMany(a => a.ActivityLogs)
                .HasForeignKey(e => e.GrievanceApplicationId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_GrievanceActivityLog_GrievanceId");

            entity.HasOne(e => e.FromState)
                .WithMany(s => s.FromActivityLogs)
                .HasForeignKey(e => e.FromStateId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceActivityLog_FromStateId");

            entity.HasOne(e => e.ToState)
                .WithMany(s => s.ToActivityLogs)
                .HasForeignKey(e => e.ToStateId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceActivityLog_ToStateId");

            entity.HasOne(e => e.Transition)
                .WithMany(t => t.ActivityLogs)
                .HasForeignKey(e => e.TransitionId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceActivityLog_TransitionId");

            entity.HasOne(e => e.ActionByUser)
                .WithMany()
                .HasForeignKey(e => e.ActionByUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceActivityLog_ActionBy");

            entity.HasOne(e => e.AssignedToUser)
                .WithMany()
                .HasForeignKey(e => e.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceActivityLog_AssignedTo");
        });

        modelBuilder.Entity<GrievanceDeptForwardingEntity>(entity =>
        {
            entity.ToTable("GrievanceDeptForwarding", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.GrievanceApplicationId, "IX_GrievanceDeptForwarding_GrievanceId");
            entity.HasIndex(e => e.ForwardedToDeptId, "IX_GrievanceDeptForwarding_DeptId");
            entity.HasIndex(e => e.AssignedToUserId, "IX_GrievanceDeptForwarding_AssignedTo");

            entity.Property(e => e.ForwardingStatus).IsRequired().HasMaxLength(20).IsUnicode(false).HasDefaultValue("PENDING");
            entity.Property(e => e.Remark).HasMaxLength(2000);
            entity.Property(e => e.ForwardedAt).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.ResolvedAt).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);


            entity.HasOne(e => e.GrievanceApplication)
                .WithMany(a => a.DeptForwardings)
                .HasForeignKey(e => e.GrievanceApplicationId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_GrievanceDeptForwarding_GrievanceId");

            entity.HasOne(e => e.ActivityLog)
                .WithMany(l => l.DeptForwardings)
                .HasForeignKey(e => e.ActivityLogId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceDeptForwarding_ActivityLogId");

            entity.HasOne(e => e.ForwardedToDept)
                .WithMany(d => d.Forwardings)
                .HasForeignKey(e => e.ForwardedToDeptId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceDeptForwarding_DeptId");

            entity.HasOne(e => e.AssignedToUser)
                .WithMany()
                .HasForeignKey(e => e.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceDeptForwarding_AssignedTo");
        });
        modelBuilder.Entity<GrievancePhotoEntity>(entity =>
        {
            entity.ToTable("GrievancePhoto", "GRV");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.IsLatest).HasDefaultValue(true);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");

            entity.HasOne(e => e.PhotoType)
                .WithMany()
                .HasForeignKey(e => e.PhotoTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.GrievanceApplication)
                .WithMany()
                .HasForeignKey(e => e.GrievanceApplicationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GrievancePhotoTypeEntity>(entity =>
        {
            entity.ToTable("GrievancePhotoType", "GRV");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PhotoTypeCode, "UQ_GrievancePhotoType_Code").IsUnique();

            entity.Property(e => e.PhotoTypeCode).IsRequired().HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.PhotoTypeName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.PhotoScope).HasMaxLength(30).IsUnicode(false);

            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);
        });

        modelBuilder.Entity<GrievanceEscalationEntity>(entity =>
        {
            entity.ToTable("GrievanceEscalation", "GRV");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.GrievanceApplicationId, "IX_GrievanceEscalation_GrievanceId");
            entity.HasIndex(e => e.EscalatedByUserId, "IX_GrievanceEscalation_EscalatedBy");
            entity.HasIndex(e => e.WardId, "IX_GrievanceEscalation_WardId");
            entity.HasIndex(e => e.ZoneId, "IX_GrievanceEscalation_ZoneId");
            entity.HasIndex(e => e.TargetAssignedToUserId, "IX_GrievanceEscalation_TargetStaff");
            entity.HasIndex(e => new { e.GrievanceApplicationId, e.EscalatedByUserId }, "UQ_GrievanceEscalation_PendingActive")
                .IsUnique()
                .HasFilter("[EscalationStatus] = 'PENDING' AND [IsActive] = 1 AND [MarkedForDeletion] = 0");

            entity.Property(e => e.Reason).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Priority).IsRequired().HasMaxLength(20).IsUnicode(false).HasDefaultValue("NORMAL");
            entity.Property(e => e.EscalationStatus).IsRequired().HasMaxLength(30).IsUnicode(false).HasDefaultValue("PENDING");
            entity.Property(e => e.StaffResponse).HasMaxLength(2000);
            entity.Property(e => e.RespondedAt).HasColumnType("datetime");
            entity.Property(e => e.MarkedForDeletion).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MarkedForDeletionDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy);
            entity.Property(e => e.UpdatedBy);

            entity.HasOne(e => e.GrievanceApplication)
                .WithMany(a => a.Escalations)
                .HasForeignKey(e => e.GrievanceApplicationId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_GrievanceEscalation_GrievanceId");

            entity.HasOne(e => e.Ward)
                .WithMany()
                .HasForeignKey(e => e.WardId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceEscalation_WardId");

            entity.HasOne(e => e.Zone)
                .WithMany()
                .HasForeignKey(e => e.ZoneId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceEscalation_ZoneId");

            entity.HasOne(e => e.EscalatedByUser)
                .WithMany()
                .HasForeignKey(e => e.EscalatedByUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceEscalation_EscalatedBy");

            entity.HasOne(e => e.TargetDepartment)
                .WithMany()
                .HasForeignKey(e => e.TargetDepartmentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceEscalation_TargetDeptId");

            entity.HasOne(e => e.TargetAssignedToUser)
                .WithMany()
                .HasForeignKey(e => e.TargetAssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceEscalation_TargetStaffId");

            entity.HasOne(e => e.RespondedByUser)
                .WithMany()
                .HasForeignKey(e => e.RespondedByUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GrievanceEscalation_RespondedBy");
        });



    }
}
