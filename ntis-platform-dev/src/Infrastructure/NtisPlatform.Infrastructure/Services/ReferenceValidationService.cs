using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Infrastructure.Data;
using System.Linq.Expressions;


namespace NtisPlatform.Infrastructure.Services;

/// <summary>
/// Centralized service for validating entity references.
/// Checks if an entity is referenced by other entities before allowing deactivation or deletion.
/// </summary>
public class ReferenceValidationService : IReferenceValidationService
{
    private readonly ApplicationDbContext _context;
    private readonly Dictionary<Type, Func<int, CancellationToken, Task<(bool hasReferences, string errorMessage)>>> _validators;

    private static readonly Dictionary<Type, List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)>> _referenceConfig;
    private static readonly Dictionary<Type, ReferenceDisplaySettings> _displaySettings;

    static ReferenceValidationService()
    {
        var config = new ReferenceValidationConfiguration();
        config.ForEntity<AssessmentYearRangeCVEntity>()
            .CheckReferences(
                ("Age Factor CV Master", (ctx, id) => ctx.AgeFactorCVMasters.Where(a => a.YearRangeCVId == id).Cast<object>()),
                ("Floor Factor CV Master", (ctx, id) => ctx.FloorFactorCVMasters.Where(f => f.YearRangeCVId == id).Cast<object>()),
                ("Nature Factor CV Master", (ctx, id) => ctx.NatureFactorCVMasters.Where(n => n.YearRangeCVId == id).Cast<object>()),
                ("Tax Percentage Master CV", (ctx, id) => ctx.TaxPercentageMasterCVs.Where(t => t.YearRangeCVId == id).Cast<object>()),
                ("Use Factor CV Master", (ctx, id) => ctx.UseFactorCVMaster.Where(u => u.YearRangeCVId == id).Cast<object>())
            );
        config.ForEntity<SubFloorEntity>()
            .CheckReferences(
                ("Property Details", (ctx, id) => ctx.PropertyDetails.Where(p => p.SubFloorId == id).Cast<object>()),
                ("Property Details Reassessment", (ctx, id) => ctx.PropertyDetailsReassessment.Where(r => r.SubFloorId == id).Cast<object>())
            );
        config.ForEntity<ConstructionTypeEntity>()
            .CheckReferences(
                ("Rates", (ctx, id) => ctx.RateEntity.Where(r => r.ConstructionTypeId == id).Cast<object>()),
                ("Age Factors", (ctx, id) => ctx.AgeFactorCVMasters.Where(a => a.ConstructionTypeId == id).Cast<object>()),
                ("Nature Factors", (ctx, id) => ctx.NatureFactorCVMasters.Where(n => n.ConstructionTypeId == id).Cast<object>()),
                ("Property Details", (ctx, id) => ctx.PropertyDetails.Where(p => p.ConstructionTypeId == id).Cast<object>()),
                ("Depreciation Master", (ctx, id) => ctx.DepreciationMaster.Where(p => p.ConstructionTypeId == id).Cast<object>()),
                ("Property Details Reassessment", (ctx, id) => ctx.PropertyDetailsReassessment.Where(r => r.ConstructionTypeId == id).Cast<object>())
            );
        config.ForEntity<TaxZoneEntity>()
            .CheckReferences(
                ("Rates", (ctx, id) => ctx.RateEntity.Where(r => r.TaxZoneId == id).Cast<object>()),
                ("Properties", (ctx, id) => ctx.PropertyMast.Where(p => p.TaxZoneId == id).Cast<object>())
            );
        config.ForEntity<FloorEntity>()
            .CheckReferences(
                ("Floor Factors", (ctx, id) => ctx.FloorFactorCVMasters.Where(f => f.FloorId == id).Cast<object>()),
                ("Property Details", (ctx, id) => ctx.PropertyDetails.Where(p => p.FloorId == id).Cast<object>()),
                ("Property Details Reassessment", (ctx, id) => ctx.PropertyDetailsReassessment.Where(r => r.FloorId == id).Cast<object>()),
                ("Rates", (ctx, id) => ctx.RateEntity.Where(r => r.FloorId == id).Cast<object>())
            );
        config.ForEntity<AssessmentYearRangeEntity>()
            .CheckReferences(
                ("Rate Master", (ctx, id) => ctx.RateEntity.Where(r => r.YearRangeRVId == id).Cast<object>()),
                ("Tax Percentage Master RV", (ctx, id) => ctx.TaxPercentageMasterRVs.Where(t => t.YearRangeRVId == id).Cast<object>())
            );
        config.ForEntity<RateSectionEntity>()
            .CheckReferences(
                ("Rate Section Details", (ctx, id) => ctx.RateSectionDetails.Where(d => d.RateSectionId == id).Cast<object>()),
                ("Rate Master", (ctx, id) => ctx.RateEntity.Where(r => r.RateSectionId == id).Cast<object>())              
            );
        config.ForEntity<WardEntity>()
           .CheckReferences(
               ("Block Master", (ctx, id) => ctx.BlockMasters.Where(d => d.WardId == id).Cast<object>()),
               ("Property Mast", (ctx, id) => ctx.PropertyMast.Where(r => r.WardId == id).Cast<object>()),
               ("Rate Section Details", (ctx, id) => ctx.RateSectionDetails.Where(r => r.WardId == id).Cast<object>())
           );
        config.ForEntity<ZoneEntity>()
          .CheckReferences(
              ("Ward Master", (ctx, id) => ctx.WardMaster.Where(d => d.ZoneId == id).Cast<object>())        
          );
        config.ForEntity<OldZoneMasterEntity>()
          .CheckReferences(
              ("Old Ward Master", (ctx, id) => ctx.OldWardMaster.Where(d => d.OldZoneId == id && d.IsActive).Cast<object>())
          );
        config.ForEntity<TypeOfUseGroupEntity>()
         .CheckReferences(
             ("Rate Master", (ctx, id) => ctx.RateEntity.Where(d => d.TypeOfUseGroupId == id).Cast<object>()),
             ("Type Of Use Master", (ctx, id) => ctx.TypeOfUse.Where(d => d.TypeOfUseGroupId == id).Cast<object>())
         );
        config.ForEntity<TypeOfUseCategoryEntity>()
         .CheckReferences(
             ("Type Of Use Master", (ctx, id) => ctx.TypeOfUse.Where(d => d.TypeOfUseCategoryId == id).Cast<object>()),
             ("SubType Of Use Master", (ctx, id) => ctx.SubTypeOfUse.Where(d => d.TypeOfUseCategoryId == id).Cast<object>())
         );
        config.ForEntity<TypeOfUseEntity>()
         .CheckReferences(
             ("Parking Type Master", (ctx, id) => ctx.ParkingTypeMaster.Where(d => d.TypeOfUseId == id).Cast<object>()),
             ("Property Description And TypeOfUseValidation", (ctx, id) => ctx.PropertyDescriptionAndTypeOfUseValidations.Where(d => d.TypeOfUseId == id).Cast<object>()),
             ("Property Details", (ctx, id) => ctx.PropertyDetails.Where(d => d.TypeOfUseId == id).Cast<object>()),
             ("Property Details Reassessment", (ctx, id) => ctx.PropertyDetailsReassessment.Where(d => d.TypeOfUseId == id).Cast<object>()),
             ("SubType Of Use Master", (ctx, id) => ctx.SubTypeOfUse.Where(d => d.TypeOfUseId == id).Cast<object>()),
             ("Tax PercentageMaster CV", (ctx, id) => ctx.TaxPercentageMasterCVs.Where(d => d.TypeOfUseId == id).Cast<object>()),
             ("Tax PercentageMaster RV", (ctx, id) => ctx.TaxPercentageMasterRVs.Where(d => d.TypeOfUseId == id).Cast<object>()),
             ("Use Factor CV Master", (ctx, id) => ctx.UseFactorCVMaster.Where(d => d.TypeOfUseId == id).Cast<object>())
         );
       config.ForEntity<SubTypeOfUseEntity>()
        .CheckReferences(         
           ("Property Details", (ctx, id) => ctx.PropertyDetails.Where(d => d.SubTypeOfUseId == id).Cast<object>()),
           ("Property Details Reassessment", (ctx, id) => ctx.PropertyDetailsReassessment.Where(d => d.SubTypeOfUseId == id).Cast<object>()),           
           ("Use Factor CV Master", (ctx, id) => ctx.UseFactorCVMaster.Where(d => d.SubTypeOfUseId == id).Cast<object>())
        );

        config.ForEntity<SocietyDetailsEntity>()
        .CheckReferences(
           // PropertyMast no longer carries a forward SocietyDetailId FK (SocietyDetailsMast.PropertyId
           // is the reverse link instead); the remaining child that would be orphaned is WingDetailsMast.
           ("Wing Details Master", (ctx, id) => ctx.WingDetailsMast.Where(w => w.SocietyDetailsMastId == id && w.IsActive && !w.MarkedForDeletion).Cast<object>())
        );

        // AMS masters use the readable message (DisplayAs): only the child masters added with CheckMasters are named,
        // under their plural screen name; records such as assets, inventory, photos, documents and demands
        // (CheckReferences) are never named, so a master that only they use is reported as "in use".

        // Asset Category - AssetMaster, AssetRoomTypeMaster and InventoryItemCategoryMaster all hold a
        // Restrict FK to AssetCategoryMaster but were previously missing here, so deleting/deactivating a
        // category still used by them was never blocked at the service layer. AssetConditionMaster has no
        // DB FK (CategoryId is polymorphic), so 'Asset' condition rows would otherwise be silently orphaned.
        config.ForEntity<AssetCategoryEntity>()
        .DisplayAs("Asset Category")
        .CheckMasters(
            ("Asset Types", (ctx, id) => ctx.Set<AssetTypeEntity>().Where(a => a.AssetCategoryId == id && !a.MarkedForDeletion).Cast<object>()),
            ("Asset Document Definitions", (ctx, id) => ctx.AssetDocumentDefinitions.Where(d => d.AssetCategoryId == id && !d.MarkedForDeletion).Cast<object>()),
            ("Asset Field Definitions", (ctx, id) => ctx.AssetFieldDefinitions.Where(f => f.AssetCategoryId == id && !f.MarkedForDeletion).Cast<object>()),
            ("Type Of Uses", (ctx, id) => ctx.AssetTypeOfUseMaster.Where(u => u.AssetCategoryId == id && !u.MarkedForDeletion).Cast<object>()),
            ("Asset Photo Types", (ctx, id) => ctx.Set<AssetPhotoTypeEntity>().Where(p => p.AssetCategoryId == id && !p.MarkedForDeletion).Cast<object>()),
            ("Asset Room Types", (ctx, id) => ctx.AssetRoomTypeMaster.Where(r => r.AssetCategoryId == id && !r.MarkedForDeletion).Cast<object>()),
            ("Inventory Categories", (ctx, id) => ctx.InventoryItemCategory.Where(i => i.AssetCategoryId == id && !i.MarkedForDeletion).Cast<object>()),
            ("Asset Conditions", (ctx, id) => ctx.AssetConditionMasters.Where(c => c.ConditionCategory == "Asset" && c.CategoryId == id && !c.MarkedForDeletion).Cast<object>())
        )
        .CheckReferences(
            ("Asset Master", (ctx, id) => ctx.AssetMaster.Where(a => a.AssetCategoryId == id && !a.MarkedForDeletion).Cast<object>())
        );
        // Inventory Item Category - referenced by InventoryItemName, AssetConditionMaster
        // (ConditionCategory == "Inventory"), and the InventoryBatch/InventoryAssetDetail rows
        // that carry an InventoryItemCategoryId FK. The latter two were previously missing here,
        // which meant deactivating/deleting a category still in use by recorded inventory batches
        // or unit-level asset details was never blocked at the service layer.
        // Child masters are matched on !MarkedForDeletion only (not IsActive): a deactivated item name
        // still physically holds its Restrict FK, so excluding it let the delete "succeed" and the
        // later purge fail on the FK.
        config.ForEntity<InventoryItemCategoryEntity>()
         .DisplayAs("Inventory Category")
         .CheckMasters(
            ("Inventory Names", (ctx, id) => ctx.InventoryItemName.Where(i => i.InventoryItemCategoryId == id && !i.MarkedForDeletion).Cast<object>()),
            ("Inventory Conditions", (ctx, id) => ctx.AssetConditionMasters.Where(i => i.ConditionCategory == "Inventory" && i.CategoryId == id && !i.MarkedForDeletion).Cast<object>())
         )
         .CheckReferences(
            ("Inventory Batch", (ctx, id) => ctx.InventoryBatches.Where(b => b.InventoryItemCategoryId == id && !b.MarkedForDeletion).Cast<object>()),
            ("Inventory Asset Detail", (ctx, id) => ctx.InventoryAssetDetails.Where(d => d.InventoryItemCategoryId == id && !d.MarkedForDeletion).Cast<object>())
         );
        // Inventory Item Name - referenced by InventoryItemModel and the InventoryBatch/InventoryAssetDetail
        // rows that carry an InventoryItemNameId FK. The latter two were previously missing here,
        // which meant deactivating/deleting an item name still in use by recorded inventory batches
        // or unit-level asset details was never blocked at the service layer.
        config.ForEntity<InventoryItemNameEntity>()
          .DisplayAs("Inventory Name")
          .CheckMasters(
              ("Inventory Models", (ctx, id) => ctx.InventoryItemModelMaster.Where(i => i.InventoryItemNameId == id && !i.MarkedForDeletion).Cast<object>())
          )
          .CheckReferences(
              ("Inventory Batch", (ctx, id) => ctx.InventoryBatches.Where(b => b.InventoryItemNameId == id && !b.MarkedForDeletion).Cast<object>()),
              ("Inventory Asset Detail", (ctx, id) => ctx.InventoryAssetDetails.Where(d => d.InventoryItemNameId == id && !d.MarkedForDeletion).Cast<object>())
          );
        // Inventory Item Model - referenced by the InventoryBatch/InventoryAssetDetail rows that
        // carry an InventoryItemModelId FK.
        config.ForEntity<InventoryItemModelEntity>()
          .DisplayAs("Inventory Model")
          .CheckReferences(
              ("Inventory Batch", (ctx, id) => ctx.InventoryBatches.Where(b => b.InventoryItemModelId == id && !b.MarkedForDeletion).Cast<object>()),
              ("Inventory Asset Detail", (ctx, id) => ctx.InventoryAssetDetails.Where(d => d.InventoryItemModelId == id && !d.MarkedForDeletion).Cast<object>())
          );

        config.ForEntity<ScreenEntity>()
        .CheckReferences(
            ("Screen Form Section Master", (ctx, id) => ctx.ScreenFormSectionMaster.Where(s => s.ScreenId == id && s.IsActive).Cast<object>()),
            ("Screen Form Field Master", (ctx, id) => ctx.ScreenFormFieldMaster.Where(f => f.ScreenId == id && f.IsActive).Cast<object>()),
            ("Child Screens", (ctx, id) => ctx.AssetScreen.Where(s => s.ParentScreenId == id && s.IsActive).Cast<object>())
        );

        // ScreenFormSection - referenced by ScreenFormField and child sections
        config.ForEntity<ScreenFormSectionMasterEntity>()
            .CheckReferences(
                ("Screen Form Field Master", (ctx, id) => ctx.ScreenFormFieldMaster.Where(f => f.SectionId == id && f.IsActive).Cast<object>()),
                ("Child Sections", (ctx, id) => ctx.ScreenFormSectionMaster.Where(s => s.ParentSectionId == id && s.IsActive).Cast<object>())
            );

        // ScreenFormField - referenced by child fields
        config.ForEntity<ScreenFormFieldMasterEntity>()
            .CheckReferences(
                ("Child Fields", (ctx, id) => ctx.ScreenFormFieldMaster.Where(f => f.ParentFieldId == id && f.IsActive).Cast<object>())
            );

        config.ForEntity<PropertyAssessmentStatusEntity>()
            .CheckReferences(
                ("Property Master", (ctx, id) => ctx.PropertyMast.Where(p => p.PropertyAssessmentStatusId == id).Cast<object>())
            );		
			
        // Asset Type - AssetMaster (FK_Asset_Type) and AssetRoomTypeMaster (FK_AssetRoomTypeMaster_AssetTypeMaster)
        // hold a Restrict FK to AssetTypeMaster but were previously missing here.
        config.ForEntity<AssetTypeEntity>()
        .DisplayAs("Asset Type")
        .CheckMasters(
            ("Asset Document Definitions", (ctx, id) => ctx.AssetDocumentDefinitions.Where(d => d.AssetTypeId == id && !d.MarkedForDeletion).Cast<object>()),
            ("Asset Field Definitions", (ctx, id) => ctx.AssetFieldDefinitions.Where(f => f.AssetTypeId == id && !f.MarkedForDeletion).Cast<object>()),
            ("Type Of Uses", (ctx, id) => ctx.AssetTypeOfUseMaster.Where(u => u.AssetTypeId == id && !u.MarkedForDeletion).Cast<object>()),
            ("Asset Photo Types", (ctx, id) => ctx.Set<AssetPhotoTypeEntity>().Where(p => p.AssetTypeId == id && !p.MarkedForDeletion).Cast<object>()),
            ("Asset Room Types", (ctx, id) => ctx.AssetRoomTypeMaster.Where(r => r.AssetTypeId == id && !r.MarkedForDeletion).Cast<object>())
        )
        .CheckReferences(
            ("Asset Master", (ctx, id) => ctx.AssetMaster.Where(a => a.AssetTypeId == id && !a.MarkedForDeletion).Cast<object>())
        );

        // Asset Field Definition - AMS.AssetFieldValue.FieldDefinitionId stores the definition an asset's
        // value was captured against. This was previously unregistered, so ValidateReferencesAsync was a
        // silent no-op and a definition still holding asset values could be deleted. Values of assets that
        // are themselves marked for deletion are ignored (they cascade away with the asset on purge).
        config.ForEntity<AssetFieldDefinitionEntity>()
        .DisplayAs("Asset Field Definition")
        .CheckReferences(
            ("Asset Field Value", (ctx, id) => ctx.AssetFieldValue.Where(v => v.FieldDefinitionId == id && !v.MarkedForDeletion && !v.Asset.MarkedForDeletion).Cast<object>())
        );

        // Asset Condition Master - previously unregistered (silent no-op). Referenced by AssetMaster.AssetConditionId
        // ('Asset' conditions), and by InventoryBatch.ConditionId (Restrict FK_InventoryBatch_InventoryItemCondition)
        // and InventoryAssetDetail.ConditionId ('Inventory' conditions).
        config.ForEntity<AssetConditionMasterEntity>()
        .DisplayAs("Condition")
        .CheckReferences(
            ("Asset Master", (ctx, id) => ctx.AssetMaster.Where(a => a.AssetConditionId == id && !a.MarkedForDeletion).Cast<object>()),
            ("Inventory Batch", (ctx, id) => ctx.InventoryBatches.Where(b => b.ConditionId == id && !b.MarkedForDeletion).Cast<object>()),
            ("Inventory Asset Detail", (ctx, id) => ctx.InventoryAssetDetails.Where(d => d.InventoryItemConditionId == id && !d.MarkedForDeletion).Cast<object>())
        );

        // AMS.AssetDocument.DocumentDefinitionId is a Restrict FK: without this, deleting/deactivating a
        // definition that documents still use would "succeed" and the later purge would then fail on the FK.
        // Documents marked for deletion are counted too — they still physically hold the FK until purged.
        config.ForEntity<AssetDocumentDefinitionEntity>()
        .DisplayAs("Asset Document Definition")
        .CheckReferences(
            ("Asset Document", (ctx, id) => ctx.AssetDocuments.Where(d => d.DocumentDefinitionId == id).Cast<object>())
        );

        config.ForEntity<AssetAuthorityMasterEntity>()
        .DisplayAs("Authority")
        .CheckMasters(
            ("Organizations", (ctx, id) => ctx.AssetOrganizationMasters.Where(o => o.AuthorityId == id).Cast<object>())
        );

        // BHKMaster - referenced by PropertyMastDetails.BHKId
        config.ForEntity<BHKMasterEntity>()
            .CheckReferences(
                ("Property Details", (ctx, id) => ctx.PropertyMastDetails.Where(p => p.BHKId == id && !p.MarkedForDeletion).Cast<object>())
            );

        // PropertyTypeMaster - referenced by PropertyMast and PropertyDescriptionAndTypeOfUseValidation
        config.ForEntity<PropertyTypeMasterEntity>()
            .CheckReferences(
                ("Property Master", (ctx, id) => ctx.PropertyMast.Where(p => p.PropertyTypeId == id).Cast<object>()),
                ("Property Description and Type of Use Validation", (ctx, id) => ctx.PropertyDescriptionAndTypeOfUseValidations.Where(v => v.PropertyTypeId == id).Cast<object>())
            );

        // MoujaMaster - referenced by CSNDetails, SubZoneDetailsForCV and PropertyMast
        config.ForEntity<MoujaEntity>()
            .CheckReferences(
                ("CSN Details", (ctx, id) => ctx.CSNDetails.Where(p => p.MoujaId == id).Cast<object>()),
                ("Sub Zone Details", (ctx, id) => ctx.SubZoneDetailsForCV.Where(v => v.MoujaId == id).Cast<object>()),
                ("Property Master", (ctx, id) => ctx.PropertyMast.Where(v => v.MoujaId == id).Cast<object>())   
            );
        // AMS.MoujaMaster - the only AMS column pointing here is AMS.SubZoneDetailsForCV.MoujaId (no DB FK, so sub
        // zones marked for deletion do not count). AMS.AssetDetails.MoujaId is not an AMS.MoujaMaster id: asset
        // location (AssetMasterService.Location) resolves it against a different mouja master, so it is not counted.
        config.ForEntity<AssetMoujaMasterEntity>()
            .DisplayAs("Mouja")
            .CheckMasters(
                ("Sub Zones", (ctx, id) => ctx.AssetSubZoneDetailsForCVMaster.Where(v => v.MoujaId == id && !v.MarkedForDeletion).Cast<object>())
            );

        // AMS.SubZoneDetailsForCV - previously unregistered, so ValidateReferencesAsync was a silent no-op.
        // AMS.CVRateMaster.SubZoneId points here: the AMS CV rate is keyed by SubZone + TypeOfUseGroupCV + FloorGroup +
        // AssessmentYearRange, and its other keys are AMS ids too (AMS.AssessmentYearRangeMaster, AMS.TypeOfUseGroupMaster).
        // CVRateMaster has no MarkedForDeletion and is never purged: an inactive rate is still a row holding SubZoneId
        // (and can be reactivated), so every rate row counts, active or not (same rule as SubUnitsDetails below).
        // Not counted: AMS.AssetDetails.SubZoneId (not an AMS.SubZoneDetailsForCV id — asset location resolves it
        // against a different sub zone master, like MoujaId above) and AMS.AssetCVCalculationHistory.SubZoneId (never
        // populated by SaveCalculationHistoryAsync).
        config.ForEntity<AssetSubZoneDetailsForCVEntity>()
            .DisplayAs("Sub Zone")
            .CheckMasters(
                ("CV Rates", (ctx, id) => ctx.CVRateMaster.Where(r => r.SubZoneId == id).Cast<object>())
            );

        // AMS.TypeOfUseGroupMaster - referenced by AMS.TypeOfUseMaster.TypeOfUseGroupId and by
        // AMS.CVRateMaster.TypeOfUseGroupCVId (the AMS CV rate is looked up by the floor's AMS TypeOfUseMaster
        // .TypeOfUseGroupId, so that column holds AMS group ids). The CV Rate Master entry was previously missing.
        // Every CV rate row counts, active or not (see the sub zone rule above).
        config.ForEntity<AssetTypeOfUseGroupEntity>()
            .DisplayAs("Type Of Use Group")
            .CheckMasters(
                ("Type Of Uses", (ctx, id) => ctx.AssetTypeOfUseMaster.Where(d => d.TypeOfUseGroupId == id && !d.MarkedForDeletion).Cast<object>()),
                ("CV Rates", (ctx, id) => ctx.CVRateMaster.Where(r => r.TypeOfUseGroupCVId == id).Cast<object>())
            );

        // AMS.TypeOfUseMaster - referenced by AMS.SubTypeOfUseMaster.TypeOfUseId, AMS.UseFactorCVMaster.TypeOfUseId
        // (Restrict FK_UseFactorCVMaster_TypeOfUseMaster) and AMS.SubUnitsDetails.TypeOfUseId (its DB FK points at
        // this table; the SubUnitsDetails services resolve it here). The last two were previously missing.
        // SubUnitsDetails is not purge-managed: a deleted floor is only set IsActive = 0 and keeps holding the FK
        // forever, so every floor row counts (same rule as UserOwningDepartmentAllocation).
        config.ForEntity<AssetTypeOfUseMasterEntity>()
            .DisplayAs("Type Of Use")
            .CheckMasters(
                ("Sub Type Of Uses", (ctx, id) => ctx.AssetSubTypeOfUseMaster.Where(d => d.TypeOfUseId == id && !d.MarkedForDeletion).Cast<object>()),
                ("Use Factors", (ctx, id) => ctx.AssetUseFactorCVMaster.Where(u => u.TypeOfUseId == id && !u.MarkedForDeletion).Cast<object>())
            )
            .CheckReferences(
                ("Sub Units Details", (ctx, id) => ctx.SubUnitsDetails.Where(s => s.TypeOfUseId == id).Cast<object>())
            );

        // AMS.SubTypeOfUseMaster - previously unregistered, so ValidateReferencesAsync was a silent no-op. Referenced by
        // AMS.UseFactorCVMaster.SubTypeOfUseId (Restrict FK_UseFactorCVMaster_SubTypeOfUseMaster) and
        // AMS.SubUnitsDetails.SubTypeOfUseId (DB FK to this table; every floor row counts, as above).
        // AMS.AssetCVCalculationHistory.TypeOfUseId/SubTypeOfUseId are not counted: SaveCalculationHistoryAsync never
        // populates them.
        config.ForEntity<AssetSubTypeOfUseEntity>()
            .DisplayAs("Sub Type Of Use")
            .CheckMasters(
                ("Use Factors", (ctx, id) => ctx.AssetUseFactorCVMaster.Where(u => u.SubTypeOfUseId == id && !u.MarkedForDeletion).Cast<object>())
            )
            .CheckReferences(
                ("Sub Units Details", (ctx, id) => ctx.SubUnitsDetails.Where(s => s.SubTypeOfUseId == id).Cast<object>())
            );

        config.ForEntity<AssetFloorFactorCVEntity>()
            .CheckReferences();

        // AssessmentYearRangeMaster (AMS) - referenced by AgeFactorCVMaster, NatureFactorCVMaster,
        // UseFactorCVMaster and FloorFactorCVMaster via YearRangeCVId. This was previously
        // unregistered, so deactivating/deleting a year range still in use by any CV factor master
        // was never blocked at the service layer.
        // AMS.CVRateMaster.AssessmentYearRangeId also points here (AssetCapitalValueService matches rates on
        // it). Every CV rate row counts, active or not (see the sub zone rule above).
        config.ForEntity<AssetAssessmentYearRangeMasterCVEntity>()
            .DisplayAs("Assessment Year Range")
            .CheckMasters(
                ("Age Factors", (ctx, id) => ctx.AssetAgeFactorCVMaster.Where(a => a.YearRangeCVId == id && !a.MarkedForDeletion).Cast<object>()),
                ("Nature Factors", (ctx, id) => ctx.AssetNatureFactorCVMaster.Where(n => n.YearRangeCVId == id && !n.MarkedForDeletion).Cast<object>()),
                ("Use Factors", (ctx, id) => ctx.AssetUseFactorCVMaster.Where(u => u.YearRangeCVId == id && !u.MarkedForDeletion).Cast<object>()),
                ("Floor Factors", (ctx, id) => ctx.AssetFloorFactorCVMaster.Where(f => f.YearRangeCVId == id && !f.MarkedForDeletion).Cast<object>()),
                ("CV Rates", (ctx, id) => ctx.CVRateMaster.Where(r => r.AssessmentYearRangeId == id).Cast<object>())
            );

        // AssetPhotoType - AMS.AssetPhoto.PhotoTypeId is the only AMS column that references it (a Restrict FK),
        // covering both asset photos and sub-unit photos (AssetPhoto.SubUnitsDetailsId). PhotoTypeCode/Name are
        // only read for display through that FK and are not stored on any other AMS table. Without this,
        // deleting/deactivating a photo type that asset photos still use would "succeed" and the later purge
        // would then fail on the FK. Same rule as AssetDocument -> AssetDocumentDefinition: every photo row
        // counts, including superseded (IsLatest = 0) history and photos marked for deletion, because they
        // all still physically hold the FK until purged and the cleanup job does not purge children first.
        config.ForEntity<AssetPhotoTypeEntity>()
            .DisplayAs("Asset Photo Type")
            .CheckReferences(
                ("Asset Photo", (ctx, id) => ctx.AssetPhotos.Where(p => p.PhotoTypeId == id).Cast<object>())
            );

        // AssetRoomTypeMaster - previously unregistered, so ValidateReferencesAsync was a silent no-op. No AMS table
        // holds an Id FK to it; AMS.RoomWiseSubmissionDetails.RoomType stores the selected room type as text. The
        // master is scoped per AssetTypeId (UQ_AssetRoomTypeMaster_Asset_RoomTypeName / _RoomTypeCode), and a room's
        // asset (child units inherit AssetTypeId from their parent) carries that same AssetTypeId, so a room counts
        // when its asset is of this room type's Asset Type and its RoomType equals this type's RoomTypeName.
        // RoomTypeName is the stored value: it is required (RoomTypeCode is optional), RoomType is sized for it (100,
        // the code is 20) and the values written are names ("Commercial", "Room"). Matching the code as well made one
        // room block two room types when one type's code equalled another's name. (AssetTypeId, RoomTypeName) is
        // unique, so a room matches at most one room type. There is no FK, so rooms (or their assets) marked for
        // deletion do not count. Because the match is on text, AssetRoomTypeService blocks changing the name or the
        // asset type of a room type that is in use.
        config.ForEntity<AssetRoomTypeMasterEntity>()
            .DisplayAs("Asset Room Type")
            .CheckReferences(
                ("Asset Room Wise Submission Details", (ctx, id) => ctx.AssetRoomWiseSubmissionDetails
                    .Where(r => !r.MarkedForDeletion
                             && r.Asset != null
                             && !r.Asset.MarkedForDeletion
                             && ctx.AssetRoomTypeMaster.Any(t => t.Id == id
                                    && t.AssetTypeId == r.Asset.AssetTypeId
                                    && t.RoomTypeName == r.RoomType))
                    .Cast<object>())
            );

        // OwnershipTypeMaster - nothing holds an Id FK to it, but AssetMasterEntity.OwnershipType stores the
        // selected OwnershipTypeName as a denormalized string. Matching on the name blocks deleting a type
        // that assets still display, which would otherwise leave them with a value missing from the master.
        // Because the match is on text, OwnershipTypeService blocks renaming a type that is in use.
        config.ForEntity<OwnershipTypeEntity>()
            .DisplayAs("Ownership Type")
            .CheckReferences(
                ("Asset Master", (ctx, id) => ctx.AssetMaster.Where(a => !a.MarkedForDeletion && ctx.OwnershipType.Any(o => o.Id == id && o.OwnershipTypeName == a.OwnershipType)).Cast<object>())
            );

        // OwningDepartmentMaster - previously unregistered (silent no-op). DesignationMaster,
        // UserOwningDepartmentAllocation and InventoryBatch hold a Restrict FK to it; AssetMaster.DepartmentId
        // and InventoryAssetDetail.OwningDepartmentId reference it without a DB FK. UserOwningDepartmentAllocation
        // has no MarkedForDeletion and is never purged, so every row counts (it would block the purge forever).
        // UserOwningDepartmentAllocation is a user assignment, not a master with its own screen, so it is not named.
        config.ForEntity<OwningDepartmentEntity>()
            .DisplayAs("Owning Department")
            .CheckMasters(
                ("Designations", (ctx, id) => ctx.AssetDesignations.Where(d => d.OwningDepartmentId == id && !d.MarkedForDeletion).Cast<object>())
            )
            .CheckReferences(
                ("Asset Master", (ctx, id) => ctx.AssetMaster.Where(a => a.DepartmentId == id && !a.MarkedForDeletion).Cast<object>()),
                ("User Owning Department Allocation", (ctx, id) => ctx.UserOwningDepartmentAllocation.Where(u => u.OwningDepartmentId == id).Cast<object>()),
                ("Inventory Batch", (ctx, id) => ctx.InventoryBatches.Where(b => b.OwningDepartmentId == id && !b.MarkedForDeletion).Cast<object>()),
                ("Inventory Asset Detail", (ctx, id) => ctx.InventoryAssetDetails.Where(d => d.OwningDepartmentId == id && !d.MarkedForDeletion).Cast<object>())
            );

        // AMS.DesignationMaster - previously unregistered, so ValidateReferencesAsync was a silent no-op. The only AMS
        // column pointing here is AMS.AssetDetails.InchargeDesignationId (the asset's in-charge officer; AssetMasterService
        // resolves its name from this table). There is no DB FK, so details marked for deletion do not count, and neither
        // do details of an asset marked for deletion (AssetDetails is 1:1 with AssetMaster and cascades away on purge).
        config.ForEntity<AssetDesignationEntity>()
            .DisplayAs("Designation")
            .CheckReferences(
                ("Asset Details", (ctx, id) => ctx.AssetDetails.Where(d => d.InChargeDesignationId == id && !d.MarkedForDeletion && !d.Asset.MarkedForDeletion).Cast<object>())
            );

        // PenaltyRuleMaster / GSTMaster - previously unregistered (silent no-op). AMS.MonthWiseDemand holds a
        // Restrict FK to both (FK_MonthWiseDemand_PenaltyRuleMaster / FK_MonthWiseDemand_GSTMaster). Demands are
        // financial records with no MarkedForDeletion and are never purged, so every row counts.
        config.ForEntity<PenaltyRuleMasterEntity>()
            .DisplayAs("Penalty Rule")
            .CheckReferences(
                ("Month Wise Demand", (ctx, id) => ctx.MonthWiseDemand.Where(m => m.PenaltyRuleMasterId == id).Cast<object>())
            );

        config.ForEntity<GSTMasterEntity>()
            .DisplayAs("GST")
            .CheckReferences(
                ("Month Wise Demand", (ctx, id) => ctx.MonthWiseDemand.Where(m => m.GSTMasterId == id).Cast<object>())
            );

        config.ForEntity<AssetGrievanceCategoryEntity>()
            .DisplayAs("Grievance Category")
            .CheckMasters(
                ("Grievance Remarks", (ctx, id) => ctx.AssetGrievanceRemarkMaster.Where(r => r.GrievanceCategoryId == id && !r.MarkedForDeletion).Cast<object>())
            );

        config.ForEntity<DynamicTaxRuleEntity>()
            .CheckReferences(
                ("Tax Master", (ctx, id) => ctx.TaxMaster.Where(t => t.RuleDefinitionId == id).Cast<object>())
            );

        // AssetGrievanceRemarkMasterEntity (AMS.GrievanceRemarkMaster) is a leaf entity: no AMS table holds an FK or
        // a copy of its Remark text (AMS has no grievance transaction table yet; the Remark/Remarks columns on other
        // AMS tables are free-text notes). Its own GrievanceCategoryId FK is guarded from the category side above.
        // Registered explicitly, empty, so ValidateReferencesAsync<AssetGrievanceRemarkMasterEntity> is not a silent
        // no-op — add the referencing table here when a grievance transaction table starts using these remarks.
        config.ForEntity<AssetGrievanceRemarkMasterEntity>()
            .CheckReferences();

        config.ForEntity<GrievanceWorkflowStageMasterEntity>()
            .DisplayAs("Workflow Stage")
            .CheckMasters(
                ("Stage Access Control", (ctx, id) => ctx.GrievanceStageAccessControls.Where(ac => ac.StageId == id && !ac.MarkedForDeletion).Cast<object>())
            );

        // Retrospective Tax Rule Engine
        config.ForEntity<EvidenceTypeMasterEntity>()
            .CheckReferences(
                ("Rule Evidence Condition", (ctx, id) => ctx.RetrospectiveRuleEvidenceCondition.Where(c => c.EvidenceTypeId == id).Cast<object>()),
                ("Rule Date Condition", (ctx, id) => ctx.RetrospectiveRuleDateCondition.Where(c => c.LeftEvidenceTypeId == id || c.RightEvidenceTypeId == id).Cast<object>()),
                ("Rule Action", (ctx, id) => ctx.RetrospectiveRuleAction.Where(a => a.StartEvidenceTypeId == id || a.SplitStartEvidenceTypeId == id || a.SplitEndEvidenceTypeId == id).Cast<object>()),
                ("Penalty Rule", (ctx, id) => ctx.RetrospectivePenaltyRule.Where(p => p.PenaltyDateEvidenceTypeId == id).Cast<object>()),
                ("Calculation Evidence", (ctx, id) => ctx.RetrospectiveCalculationEvidence.Where(e => e.EvidenceTypeId == id).Cast<object>())
            );

        // Evidence Condition, Date Condition, Action, Penalty Rule, Rule Summary and Audit Log are
        // this rule's own composition/child sections (created via the Rule Builder's Save
        // endpoint) -- every real rule has them, so treating them as blocking references made
        // Delete/Deactivate permanently fail for any rule that was actually built out. Only Tax
        // Calculation is a genuine "used elsewhere" reference: deleting a rule that a real
        // calculation already applied would corrupt that calculation's traceability.
        config.ForEntity<RetrospectiveRuleMasterEntity>()
            .CheckReferences(
                ("Tax Calculation", (ctx, id) => ctx.RetrospectiveTaxCalculation.Where(c => c.AppliedRuleId == id).Cast<object>())
            );

        config.ForEntity<RetrospectiveTaxPolicyEntity>()
            .CheckReferences(
                ("Tax Calculation", (ctx, id) => ctx.RetrospectiveTaxCalculation.Where(c => c.AppliedTaxPolicyId == id).Cast<object>())
            );


        config.ForEntity<YearMasterEntity>()
            .CheckReferences(
                ("Billing Period", (ctx, id) => ctx.BillingPeriod.Where(bp => bp.FinancialYearId == id).Cast<object>())
            );

        config.ForEntity<BillingFrequencyMasterEntity>()
            .CheckReferences(
                ("Billing Period", (ctx, id) => ctx.BillingPeriod.Where(bp => bp.BillingFrequencyId == id).Cast<object>()),
                ("Connection Category Master", (ctx, id) => ctx.ConnectionCategoryMaster.Where(cc => cc.BillingFrequencyId == id).Cast<object>())
            );

        // MeterTypeMaster, ReadingSourceMaster, MeterTestStatusMaster and ConnectionCategoryMaster
        // are currently leaf entities - no other entity has a FK to them yet. Registering explicitly
        // so ValidateReferencesAsync<T> is not a silent no-op once a dependent table is added.
        config.ForEntity<MeterTypeMasterEntity>()
            .CheckReferences();

        config.ForEntity<ReadingSourceMasterEntity>()
            .CheckReferences();

        config.ForEntity<MeterTestStatusMasterEntity>()
            .CheckReferences();

        config.ForEntity<TariffMasterEntity>()
            .CheckReferences();

        config.ForEntity<ChargeHeadMasterEntity>()
            .CheckReferences();

        config.ForEntity<GeographyTypeMasterEntity>()
            .CheckReferences(
                ("Geography Unit", (ctx, id) => ctx.GeographyUnit.Where(gu => gu.GeographyTypeId == id).Cast<object>())
            );

        config.ForEntity<GeographyUnitEntity>()
            .CheckReferences(
                ("Geography Unit", (ctx, id) => ctx.GeographyUnit.Where(gu => gu.ParentGeographyUnitId == id).Cast<object>())
            );
        config.ForEntity<ConnectionCategoryMasterEntity>()
            .CheckReferences();

        config.ForEntity<BillingPeriodEntity>()
            .CheckReferences();

        // ─── Payroll General & Administrative Masters (Batch 1) ─────────────────────
        config.ForEntity<PayrollDepartmentMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollDesignationMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollEmployeeClassMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollEmployeeStatusMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollEmployeeTypeMasterEntity>()
            .CheckReferences();

        // ─── Payroll Personal & Demographic Masters (Batch 2) ──────────────────────
        config.ForEntity<PayrollBloodGroupMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollGenderMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollMaritalStatusMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollQualificationMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollRelationshipMasterEntity>()
            .CheckReferences();

        // ─── Payroll Geographical Hierarchy Masters ──────────────────────────────
        config.ForEntity<PayrollStateMasterEntity>()
            .CheckReferences(
                ("District Master", (ctx, id) => ctx.PayrollDistrictMaster.Where(d => d.StateId == id).Cast<object>())
            );

        config.ForEntity<PayrollDistrictMasterEntity>()
            .CheckReferences(
                ("Taluka Master", (ctx, id) => ctx.PayrollTalukaMaster.Where(t => t.DistrictId == id).Cast<object>())
            );

        config.ForEntity<PayrollTalukaMasterEntity>()
            .CheckReferences(
                ("Village Master", (ctx, id) => ctx.PayrollVillageMaster.Where(v => v.TalukaId == id).Cast<object>())
            );

        config.ForEntity<PayrollVillageMasterEntity>()
            .CheckReferences();

        config.ForEntity<PayrollZoneDivisionMasterEntity>()
            .CheckReferences();

        config.ForEntity<FLatGenerationGroupMasterEntity>()
            .CheckReferences(
                ("Floors", (ctx, id) => ctx.FloorEntity.Where(f => f.FLatGenerationGroupId == id).Cast<object>())
            );

        _referenceConfig = config.Build();
        _displaySettings = config.BuildDisplaySettings();
    }

    public ReferenceValidationService(ApplicationDbContext context)
    {
        _context = context;
        _validators = new Dictionary<Type, Func<int, CancellationToken, Task<(bool, string)>>>();

        foreach (var kvp in _referenceConfig)
        {
            _validators[kvp.Key] = async (id, ct) =>
            {
                var referencingTables = new List<string>();
                foreach (var (tableName, queryFunc) in kvp.Value)
                {
                    var any = await queryFunc(_context, id).AnyAsync(ct);
                    if (any)
                        referencingTables.Add(tableName);
                }
                if (referencingTables.Any())
                {
                    var entityName = kvp.Key.Name.Replace("Entity", string.Empty);
                    return (true, $"Cannot deactivate/delete this {entityName} because it is referenced in: {string.Join(", ", referencingTables)}");
                }
                return (false, string.Empty);
            };
        }
    }

    public async Task<ValidationResult> ValidateReferencesAsync<TEntity>(int entityId, CancellationToken cancellationToken = default)
        where TEntity : BaseEntity
    {
        var entityType = typeof(TEntity);
        if (!_validators.TryGetValue(entityType, out var validator))
        {
            // No validation configured for this entity type - allow operation
            return ValidationResult.Success();
        }
        var (hasReferences, errorMessage) = await validator(entityId, cancellationToken);
        if (hasReferences)
        {
            return ValidationResult.Failure(errorMessage);
        }
        return ValidationResult.Success();
    }

    /// <summary>
    /// Used by the AMS master services. An entity registered with DisplayAs gets the readable message for the
    /// operation, naming only its child masters; any other entity gets the same result as the overload above.
    /// </summary>
    public async Task<ValidationResult> ValidateReferencesAsync<TEntity>(
        int entityId, ReferenceValidationOperation operation, CancellationToken cancellationToken = default)
        where TEntity : BaseEntity
    {
        // Exhaustive on purpose: a new operation must fail here until its wording is defined, not read as Delete.
        var action = operation switch
        {
            ReferenceValidationOperation.Delete => "deleted",
            ReferenceValidationOperation.Deactivate => "deactivated",
            _ => throw new ArgumentOutOfRangeException(nameof(operation), operation, "Unsupported reference validation operation.")
        };

        var entityType = typeof(TEntity);
        if (!_displaySettings.TryGetValue(entityType, out var display))
            return await ValidateReferencesAsync<TEntity>(entityId, cancellationToken);

        var errorMessage = await GetDisplayMessageAsync(_referenceConfig[entityType], display, entityId, action, cancellationToken);
        return errorMessage is null ? ValidationResult.Success() : ValidationResult.Failure(errorMessage);
    }

    // Readable message (entities registered with DisplayAs), e.g. "This Asset Type cannot be deleted because it has
    // Asset Photo Types and Asset Room Types. Please delete all Asset Photo Types and Asset Room Types for this Asset
    // Type first." It names only child masters, which the user can delete from their own screens. When none is found,
    // the other records are not named: "This Asset Type cannot be deleted because it is in use." At most two queries:
    // one for all the child-master checks and, only when none is found, one for all the other checks.
    private async Task<string?> GetDisplayMessageAsync(
        List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)> checks,
        ReferenceDisplaySettings display,
        int entityId,
        string action,
        CancellationToken cancellationToken)
    {
        var masterChecks = checks.Where(c => display.MasterTableNames.Contains(c.TableName)).ToList();
        if (masterChecks.Count > 0)
        {
            var found = await MatchingCheckIndexes(masterChecks, entityId).ToListAsync(cancellationToken);
            var masters = masterChecks.Where((_, index) => found.Contains(index)).Select(c => c.TableName).ToList();
            if (masters.Count > 0)
            {
                var names = JoinWithAnd(masters);
                return $"This {display.DisplayName} cannot be {action} because it has {names}. " +
                       $"Please delete all {names} for this {display.DisplayName} first.";
            }
        }

        var recordChecks = checks.Where(c => !display.MasterTableNames.Contains(c.TableName)).ToList();
        if (recordChecks.Count > 0 && await MatchingCheckIndexes(recordChecks, entityId).AnyAsync(cancellationToken))
            return $"This {display.DisplayName} cannot be {action} because it is in use.";

        return null;
    }

    // All the checks as one query, run in a single round trip: each check becomes "SELECT TOP(1) <its index>" over
    // its own rows and the checks are combined with UNION ALL, so the result is the indexes of the checks that match.
    // The index is a constant in the SQL; the checks' entity types differ, so each is projected to its index first.
    private IQueryable<int> MatchingCheckIndexes(
        List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)> checks, int entityId)
        => checks
            .Select((check, index) => check.Query(_context, entityId)
                .Select(Expression.Lambda<Func<object, int>>(Expression.Constant(index), Expression.Parameter(typeof(object), "row")))
                .Take(1))
            .Aggregate((all, next) => all.Concat(next));

    // "A", "A and B", "A, B and C"
    private static string JoinWithAnd(IReadOnlyList<string> items)
        => items.Count == 1 ? items[0] : $"{string.Join(", ", items.Take(items.Count - 1))} and {items[^1]}";

    /// <summary>
    /// retrieves all foreign key constraints for an entity.
    /// </summary>    
    
    public async Task<List<string>> GetReferencingTablesWithDataAsync<TEntity, TKey>(
    TKey referencedId,
    string referencedColumnName = "Id",
    CancellationToken cancellationToken = default) // Added cancellationToken parameter
    where TEntity : class
    {
        var model = _context.Model;

        var entityType = model.FindEntityType(typeof(TEntity));

        if (entityType == null)
        {
            return new List<string>
        {
            $"Entity type '{typeof(TEntity).Name}' not found."
        };
        }

        var referencingTables = new List<string>();

        // Get all FK relationships referencing this entity, ignoring cascade deletes
        var foreignKeys = entityType.GetReferencingForeignKeys()
            .Where(fk => fk.PrincipalKey.Properties.Any(p => p.Name == referencedColumnName)
                && fk.DeleteBehavior != DeleteBehavior.Cascade
                && fk.DeleteBehavior != DeleteBehavior.ClientCascade)
            .ToList();

        foreach (var fk in foreignKeys)
        {
            var dependentEntityType = fk.DeclaringEntityType;

            var tableName = dependentEntityType.GetTableName();

            if (string.IsNullOrWhiteSpace(tableName))
                continue;

            // FK property in child entity
            var foreignKeyProperty = fk.Properties.Single();

            var foreignKeyPropertyName = foreignKeyProperty.Name;

            // CLR type of dependent entity
            var clrType = dependentEntityType.ClrType;

            // DbSet<TEntity>
            var dbSet = (IQueryable)_context.GetType()
                .GetMethod(nameof(DbContext.Set), Type.EmptyTypes)!
                .MakeGenericMethod(clrType)
                .Invoke(_context, null)!;

            // x =>
            // EF.Property<TProperty>(x, foreignKeyPropertyName) == referencedId

            var parameter = Expression.Parameter(clrType, "x");

            var propertyType =
                Nullable.GetUnderlyingType(foreignKeyProperty.ClrType)
                ?? foreignKeyProperty.ClrType;

            var propertyMethod = typeof(EF)
                .GetMethod(nameof(EF.Property))!
                .MakeGenericMethod(foreignKeyProperty.ClrType);

            var propertyExpression = Expression.Call(
                propertyMethod,
                parameter,
                Expression.Constant(foreignKeyPropertyName));

            // Convert the referencedId to the appropriate property type
            var convertedId = Convert.ChangeType(
                referencedId,
                propertyType);

            // Ensure the constant matches the exact FK CLR type
            // If the FK property type is nullable, wrap the constant in Expression.Convert
            var constantExpression = Expression.Constant(
                convertedId,
                propertyType); // Use the non-nullable propertyType here

            // Wrap in Expression.Convert if the FK property type is nullable
            var equalExpression = Expression.Equal(
                propertyExpression,
                foreignKeyProperty.ClrType.IsGenericType &&
                foreignKeyProperty.ClrType.GetGenericTypeDefinition() == typeof(Nullable<>)
                    ? Expression.Convert(constantExpression, foreignKeyProperty.ClrType) // Convert to nullable type if needed
                    : constantExpression);

            var lambda = Expression.Lambda(
                equalExpression,
                parameter);

            // AnyAsync<TEntity>(source, predicate, cancellationToken)

            var anyAsyncMethod = typeof(EntityFrameworkQueryableExtensions)
                .GetMethods()
                .First(m =>
                    m.Name == nameof(EntityFrameworkQueryableExtensions.AnyAsync)
                    && m.GetParameters().Length == 3)
                .MakeGenericMethod(clrType);

            var task = (Task<bool>)anyAsyncMethod.Invoke(
                null,
                new object[]
                {
                dbSet,
                lambda,
                cancellationToken 
                })!;

            var exists = await task;

            if (exists)
            {
                referencingTables.Add(tableName);
            }
        }

        return referencingTables
            .Distinct()
            .OrderBy(x => x)
            .ToList();
    }
}