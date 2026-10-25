using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetAssessmentYearRangeMasterCV;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Services;
using Xunit;
using AppValidationException = NtisPlatform.Application.Exceptions.ValidationException;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Integration tests for the code/name duplicate checks on the AMS masters, run through the real services,
/// repositories and AutoMapper profiles against an <see cref="ApplicationDbContext"/> (EF Core InMemory provider).
/// Every test asserts the exact message the user sees: it names the duplicated field and value, is keyed by the
/// field's property name, and is also the exception's top-level message (not "Validation failed for ...").
/// Seeding and each operation run on their own DbContext, mirroring separate HTTP requests.
///
/// What this does NOT cover: the InMemory provider does not translate LINQ to SQL and compares strings
/// case-sensitively, so it cannot catch a query that fails to translate on SQL Server or exercise the
/// database's case-insensitive collation.
/// </summary>
[Trait("Category", "Integration")]
public class AmsDuplicateValidationIntegrationTests : IAsyncLifetime
{
    private readonly string _databaseName = $"AmsDuplicateValidationIntegrationTests_{Guid.NewGuid()}";
    private readonly IMapper _mapper = new MapperConfiguration(
        cfg => cfg.AddMaps(typeof(NtisPlatform.Application.Mappings.AssetTypeMappingProfile).Assembly),
        Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance).CreateMapper();

    // Bulk create/update open a transaction; the InMemory provider has none, so ignore that warning.
    private ApplicationDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(_databaseName)
            .EnableSensitiveDataLogging()
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options);

    public async Task InitializeAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureDeletedAsync();
    }

    private async Task SeedAsync(params BaseEntity[] entities)
    {
        foreach (var entity in entities)
            entity.CreatedDate ??= DateTime.Now;

        await using var context = CreateContext();
        context.AddRange(entities);
        await context.SaveChangesAsync();
    }

    /// <summary>Runs <paramref name="action"/> on a fresh context and returns the validation exception it throws.</summary>
    private async Task<AppValidationException> ExpectValidationAsync(Func<ApplicationDbContext, Task> action)
    {
        await using var context = CreateContext();
        return await Assert.ThrowsAsync<AppValidationException>(() => action(context));
    }

    private async Task RunAsync(Func<ApplicationDbContext, Task> action)
    {
        await using var context = CreateContext();
        await action(context);
    }

    private static void AssertSingleError(AppValidationException ex, string field, string message)
    {
        Assert.Equal(message, Assert.Single(ex.Errors, e => e.Key == field).Value);
        Assert.Single(ex.Errors);
        Assert.Equal(message, ex.Message);
    }

    #region Asset Category

    private AssetCategoryService AssetCategoryService(ApplicationDbContext context) =>
        new(new Repository<AssetCategoryEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task AssetCategory_UpdateOntoAnotherCategorysCodeAndName_ReportsBothFields()
    {
        // Previously only Create checked duplicates, so an update hit the DB unique constraint and the user
        // got a generic "A record with the same details already exists." with no field name.
        await SeedAsync(
            new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land" },
            new AssetCategoryEntity { Id = 2, CategoryCode = "BLDG", CategoryName = "Building" });

        var ex = await ExpectValidationAsync(c => AssetCategoryService(c).UpdateAsync(1,
            new UpdateAssetCategoryDto { CategoryCode = "BLDG", CategoryName = "Building", IsActive = true }));

        Assert.Equal("Category Code 'BLDG' already exists.", ex.Errors[nameof(AssetCategoryEntity.CategoryCode)]);
        Assert.Equal("Category Name 'Building' already exists.", ex.Errors[nameof(AssetCategoryEntity.CategoryName)]);
        Assert.Equal("Category Code 'BLDG' already exists. Category Name 'Building' already exists.", ex.Message);
    }

    [Fact]
    public async Task AssetCategory_UpdateKeepingOwnCodeAndName_Succeeds()
    {
        await SeedAsync(new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land" });

        await RunAsync(async c => Assert.NotNull(await AssetCategoryService(c).UpdateAsync(1,
            new UpdateAssetCategoryDto { CategoryCode = "LAND", CategoryName = "Land", Description = "Updated", IsActive = true })));
    }

    #endregion

    #region Asset Type

    private AssetTypeService AssetTypeService(ApplicationDbContext context) =>
        new(new Repository<AssetTypeEntity, int>(context), new UnitOfWork(context), _mapper,
            new ReferenceValidationService(context), new Repository<AssetCategoryEntity, int>(context));

    [Fact]
    public async Task AssetType_CreateWithDuplicateCodeAndName_ReportsBothFields()
    {
        // AssetTypeService had no duplicate check at all.
        await SeedAsync(new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "PLOT", TypeName = "Open Plot" });

        var ex = await ExpectValidationAsync(c => AssetTypeService(c).CreateAsync(
            new CreateAssetTypeDto { AssetCategoryId = 2, TypeCode = "PLOT", TypeName = "Open Plot", IsActive = true }));

        Assert.Equal("Asset Type Code 'PLOT' already exists.", ex.Errors[nameof(AssetTypeEntity.TypeCode)]);
        Assert.Equal("Asset Type Name 'Open Plot' already exists.", ex.Errors[nameof(AssetTypeEntity.TypeName)]);
        // A single create surfaces every field message, not the base service's "Validation failed for create operation".
        Assert.Equal("Asset Type Code 'PLOT' already exists. Asset Type Name 'Open Plot' already exists.", ex.Message);
    }

    [Fact]
    public async Task AssetType_CreateWithCodeHeldByRowMarkedForDeletion_Throws()
    {
        // UQ_AssetTypeMaster_TypeCode is unfiltered, so a row pending purge still holds its code.
        await SeedAsync(new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "PLOT", TypeName = "Old Plot", IsActive = false, MarkedForDeletion = true });

        var ex = await ExpectValidationAsync(c => AssetTypeService(c).CreateAsync(
            new CreateAssetTypeDto { AssetCategoryId = 1, TypeCode = "PLOT", TypeName = "New Plot", IsActive = true }));

        AssertSingleError(ex, nameof(AssetTypeEntity.TypeCode), "Asset Type Code 'PLOT' already exists.");
    }

    [Fact]
    public async Task AssetType_UpdateOntoAnotherTypesName_Throws()
    {
        await SeedAsync(
            new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "PLOT", TypeName = "Open Plot" },
            new AssetTypeEntity { Id = 20, AssetCategoryId = 1, TypeCode = "FARM", TypeName = "Farm Land" });

        var ex = await ExpectValidationAsync(c => AssetTypeService(c).UpdateAsync(10,
            new UpdateAssetTypeDto { AssetCategoryId = 1, TypeCode = "PLOT", TypeName = "Farm Land", IsActive = true }));

        AssertSingleError(ex, nameof(AssetTypeEntity.TypeName), "Asset Type Name 'Farm Land' already exists.");
    }

    [Fact]
    public async Task AssetType_CreateWithUniqueCodeAndName_Succeeds()
    {
        await SeedAsync(new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "PLOT", TypeName = "Open Plot" });

        await RunAsync(async c => Assert.Equal("FARM", (await AssetTypeService(c).CreateAsync(
            new CreateAssetTypeDto { AssetCategoryId = 1, TypeCode = "FARM", TypeName = "Farm Land", IsActive = true })).TypeCode));
    }

    #endregion

    #region Designation Master

    private AssetDesignationService DesignationService(ApplicationDbContext context) =>
        new(new Repository<AssetDesignationEntity, int>(context), new Repository<OwningDepartmentEntity, int>(context),
            new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task Designation_CreateWithDuplicateCodeAndName_ReportsBothFields()
    {
        // AssetDesignationService had no duplicate check at all.
        await SeedAsync(
            new OwningDepartmentEntity { Id = 5, OwningDepartmentName = "Estate" },
            new AssetDesignationEntity { Id = 1, OwningDepartmentId = 5, DesignationCode = "EE", DesignationName = "Executive Engineer" });

        var ex = await ExpectValidationAsync(c => DesignationService(c).CreateAsync(
            new CreateAssetDesignationDto { OwningDepartmentId = 5, DesignationCode = "EE", DesignationName = "Executive Engineer", IsActive = true }));

        Assert.Equal("Designation Code 'EE' already exists.", ex.Errors[nameof(AssetDesignationEntity.DesignationCode)]);
        Assert.Equal("Designation Name 'Executive Engineer' already exists.", ex.Errors[nameof(AssetDesignationEntity.DesignationName)]);
    }

    [Fact]
    public async Task Designation_UpdateOntoAnotherDesignationsCode_Throws()
    {
        await SeedAsync(
            new OwningDepartmentEntity { Id = 5, OwningDepartmentName = "Estate" },
            new AssetDesignationEntity { Id = 1, OwningDepartmentId = 5, DesignationCode = "EE", DesignationName = "Executive Engineer" },
            new AssetDesignationEntity { Id = 2, OwningDepartmentId = 5, DesignationCode = "JE", DesignationName = "Junior Engineer" });

        var ex = await ExpectValidationAsync(c => DesignationService(c).UpdateAsync(1,
            new UpdateAssetDesignationDto { OwningDepartmentId = 5, DesignationCode = "JE", DesignationName = "Executive Engineer", IsActive = true }));

        AssertSingleError(ex, nameof(AssetDesignationEntity.DesignationCode), "Designation Code 'JE' already exists.");
    }

    #endregion

    #region Owning Department

    private OwningDepartmentService OwningDepartmentService(ApplicationDbContext context) =>
        new(new Repository<OwningDepartmentEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task OwningDepartment_CreateWithDuplicateName_Throws()
    {
        // OwningDepartmentService had no duplicate check at all.
        await SeedAsync(new OwningDepartmentEntity { Id = 5, OwningDepartmentName = "Estate" });

        var ex = await ExpectValidationAsync(c => OwningDepartmentService(c).CreateAsync(
            new CreateOwningDepartmentDto { OwningDepartmentName = "Estate", IsActive = true }));

        AssertSingleError(ex, nameof(OwningDepartmentEntity.OwningDepartmentName), "Owning Department Name 'Estate' already exists.");
    }

    [Fact]
    public async Task OwningDepartment_UpdateOntoAnotherDepartmentsName_Throws()
    {
        await SeedAsync(
            new OwningDepartmentEntity { Id = 5, OwningDepartmentName = "Estate" },
            new OwningDepartmentEntity { Id = 6, OwningDepartmentName = "Water Works" });

        var ex = await ExpectValidationAsync(c => OwningDepartmentService(c).UpdateAsync(5,
            new UpdateOwningDepartmentDto { OwningDepartmentName = "Water Works", IsActive = true }));

        AssertSingleError(ex, nameof(OwningDepartmentEntity.OwningDepartmentName), "Owning Department Name 'Water Works' already exists.");
    }

    [Fact]
    public async Task OwningDepartment_UpdateKeepingOwnName_Succeeds()
    {
        await SeedAsync(new OwningDepartmentEntity { Id = 5, OwningDepartmentName = "Estate" });

        await RunAsync(async c => Assert.NotNull(await OwningDepartmentService(c).UpdateAsync(5,
            new UpdateOwningDepartmentDto { OwningDepartmentName = "Estate", Description = "Updated", IsActive = true })));
    }

    #endregion

    #region GST Master

    private GSTService GstService(ApplicationDbContext context) =>
        new(new Repository<GSTMasterEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task Gst_UpdateOntoAnotherRatesCode_Throws()
    {
        // Previously only Create checked TaxCode.
        await SeedAsync(
            new GSTMasterEntity { Id = 1, TaxCode = "GST18", TaxName = "GST 18%", TaxPercentage = 18, EffectiveFromDate = new DateTime(2024, 4, 1) },
            new GSTMasterEntity { Id = 2, TaxCode = "GST12", TaxName = "GST 12%", TaxPercentage = 12, EffectiveFromDate = new DateTime(2024, 4, 1) });

        var ex = await ExpectValidationAsync(c => GstService(c).UpdateAsync(1,
            new UpdateGSTDto { TaxCode = "GST12", TaxName = "GST 18%", TaxPercentage = 18, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true }));

        AssertSingleError(ex, nameof(GSTMasterEntity.TaxCode), "Tax Code 'GST12' already exists.");
    }

    [Fact]
    public async Task Gst_CreateWithDuplicateName_Throws()
    {
        await SeedAsync(new GSTMasterEntity { Id = 1, TaxCode = "GST18", TaxName = "GST 18%", TaxPercentage = 18, EffectiveFromDate = new DateTime(2024, 4, 1) });

        var ex = await ExpectValidationAsync(c => GstService(c).CreateAsync(
            new CreateGSTDto { TaxCode = "GST18B", TaxName = "GST 18%", TaxPercentage = 18, EffectiveFromDate = new DateTime(2025, 4, 1), IsActive = true }));

        AssertSingleError(ex, nameof(GSTMasterEntity.TaxName), "Tax Name 'GST 18%' already exists.");
    }

    #endregion

    #region Asset Field Definition

    private AssetFieldDefinitionService FieldDefinitionService(ApplicationDbContext context) =>
        new(new Repository<AssetFieldDefinitionEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    private static AssetFieldDefinitionEntity FieldDefinition(int id, int typeId, string code, string name) => new()
    {
        Id = id, AssetCategoryId = 1, AssetTypeId = typeId, FieldCode = code, FieldName = name,
        FieldLabel = name, FieldType = "Text", DisplayOrder = id
    };

    [Fact]
    public async Task FieldDefinition_UpdateOntoAnotherDefinitionsCodeInSameType_Throws()
    {
        // Previously only Create checked FieldCode, and Update checked nothing.
        await SeedAsync(FieldDefinition(1, 10, "SURVEY_NO", "Survey No"), FieldDefinition(2, 10, "PLOT_AREA", "Plot Area"));

        var ex = await ExpectValidationAsync(c => FieldDefinitionService(c).UpdateAsync(1,
            new UpdateAssetFieldDefinitionDto { AssetCategoryId = 1, AssetTypeId = 10, FieldCode = "PLOT_AREA", FieldName = "Survey No", FieldLabel = "Survey No", FieldType = "Text", DisplayOrder = 1, IsActive = true }));

        AssertSingleError(ex, nameof(AssetFieldDefinitionEntity.FieldCode), "Field Code 'PLOT_AREA' already exists for the selected Asset Category and Asset Type.");
    }

    [Fact]
    public async Task FieldDefinition_CreateWithDuplicateNameInSameType_Throws()
    {
        await SeedAsync(FieldDefinition(1, 10, "SURVEY_NO", "Survey No"));

        var ex = await ExpectValidationAsync(c => FieldDefinitionService(c).CreateAsync(
            new CreateAssetFieldDefinitionDto { AssetCategoryId = 1, AssetTypeId = 10, FieldCode = "SURVEY_NO_2", FieldName = "Survey No", FieldLabel = "Survey No", FieldType = "Text", DisplayOrder = 2, IsActive = true }));

        AssertSingleError(ex, nameof(AssetFieldDefinitionEntity.FieldName), "Field Name 'Survey No' already exists for the selected Asset Category and Asset Type.");
    }

    [Fact]
    public async Task FieldDefinition_SameCodeAndNameForAnotherAssetType_Succeeds()
    {
        await SeedAsync(FieldDefinition(1, 10, "SURVEY_NO", "Survey No"));

        await RunAsync(async c => Assert.Equal(20, (await FieldDefinitionService(c).CreateAsync(
            new CreateAssetFieldDefinitionDto { AssetCategoryId = 1, AssetTypeId = 20, FieldCode = "SURVEY_NO", FieldName = "Survey No", FieldLabel = "Survey No", FieldType = "Text", DisplayOrder = 1, IsActive = true })).AssetTypeId));
    }

    #endregion

    #region Asset Photo Type

    private AssetPhotoTypeService PhotoTypeService(ApplicationDbContext context) =>
        new(new Repository<AssetPhotoTypeEntity, int>(context), new Repository<AssetCategoryEntity, int>(context),
            new Repository<AssetTypeEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task PhotoType_CreateWithDuplicateNameForSameAssetType_Throws()
    {
        await SeedAsync(
            new AssetCategoryEntity { Id = 1, CategoryCode = "BLDG", CategoryName = "Building" },
            new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "OFFICE", TypeName = "Office" },
            new AssetPhotoTypeEntity { Id = 1, AssetCategoryId = 1, AssetTypeId = 10, PhotoTypeCode = "FRONT_OFFICE", PhotoTypeName = "Front View" });

        var ex = await ExpectValidationAsync(c => PhotoTypeService(c).CreateAsync(
            new CreateAssetPhotoTypeDto { AssetCategoryId = 1, AssetTypeId = 10, PhotoTypeCode = "FRONT_2", PhotoTypeName = "Front View", IsActive = true }));

        AssertSingleError(ex, nameof(AssetPhotoTypeEntity.PhotoTypeName), "Photo Type Name 'Front View' already exists for the selected Asset Category and Asset Type.");
    }

    [Fact]
    public async Task PhotoType_SameNameForAnotherAssetType_Succeeds()
    {
        await SeedAsync(
            new AssetCategoryEntity { Id = 1, CategoryCode = "BLDG", CategoryName = "Building" },
            new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "OFFICE", TypeName = "Office" },
            new AssetTypeEntity { Id = 20, AssetCategoryId = 1, TypeCode = "SCHOOL", TypeName = "School" },
            new AssetPhotoTypeEntity { Id = 1, AssetCategoryId = 1, AssetTypeId = 10, PhotoTypeCode = "FRONT_OFFICE", PhotoTypeName = "Front View" });

        await RunAsync(async c => Assert.Equal("FRONT_SCHOOL", (await PhotoTypeService(c).CreateAsync(
            new CreateAssetPhotoTypeDto { AssetCategoryId = 1, AssetTypeId = 20, PhotoTypeCode = "FRONT_SCHOOL", PhotoTypeName = "Front View", IsActive = true })).PhotoTypeCode));
    }

    #endregion

    #region Mouja Subzone

    private AssetSubZoneDetailsForCVService SubZoneService(ApplicationDbContext context) =>
        new(new Repository<AssetSubZoneDetailsForCVEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task SubZone_UpdateOntoAnotherSubZoneNoInSameMouja_Throws()
    {
        // Previously only Create checked SubZoneNo, and Update checked nothing.
        await SeedAsync(
            new AssetSubZoneDetailsForCVEntity { Id = 1, MoujaId = 7, SubZoneNo = "1", SubZoneName = "North" },
            new AssetSubZoneDetailsForCVEntity { Id = 2, MoujaId = 7, SubZoneNo = "2", SubZoneName = "South" });

        var ex = await ExpectValidationAsync(c => SubZoneService(c).UpdateAsync(1,
            new UpdateAssetSubZoneDetailsForCVDto { MoujaId = 7, SubZoneNo = "2", SubZoneName = "North", IsActive = true }));

        AssertSingleError(ex, nameof(AssetSubZoneDetailsForCVEntity.SubZoneNo), "Sub Zone No '2' already exists for the selected Mouja.");
    }

    [Fact]
    public async Task SubZone_CreateWithDuplicateNameInSameMouja_Throws()
    {
        await SeedAsync(new AssetSubZoneDetailsForCVEntity { Id = 1, MoujaId = 7, SubZoneNo = "1", SubZoneName = "North" });

        var ex = await ExpectValidationAsync(c => SubZoneService(c).CreateAsync(
            new CreateAssetSubZoneDetailsForCVDto { MoujaId = 7, SubZoneNo = "3", SubZoneName = "North", IsActive = true }));

        AssertSingleError(ex, nameof(AssetSubZoneDetailsForCVEntity.SubZoneName), "Sub Zone Name 'North' already exists for the selected Mouja.");
    }

    [Fact]
    public async Task SubZone_SameNoAndNameInAnotherMouja_Succeeds()
    {
        await SeedAsync(new AssetSubZoneDetailsForCVEntity { Id = 1, MoujaId = 7, SubZoneNo = "1", SubZoneName = "North" });

        await RunAsync(async c => Assert.Equal(8, (await SubZoneService(c).CreateAsync(
            new CreateAssetSubZoneDetailsForCVDto { MoujaId = 8, SubZoneNo = "1", SubZoneName = "North", IsActive = true })).MoujaId));
    }

    #endregion

    #region Type of Use

    private AssetTypeOfUseService TypeOfUseService(ApplicationDbContext context) =>
        new(new Repository<AssetTypeOfUseMasterEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task TypeOfUse_UpdateOntoAnotherCode_Throws()
    {
        // Previously only Create checked TypeOfUseCode.
        await SeedAsync(
            new AssetTypeOfUseMasterEntity { Id = 1, AssetCategoryId = 1, AssetTypeId = 10, TypeOfUseCode = "RES", Description = "Residential" },
            new AssetTypeOfUseMasterEntity { Id = 2, AssetCategoryId = 1, AssetTypeId = 10, TypeOfUseCode = "COM", Description = "Commercial" });

        var ex = await ExpectValidationAsync(c => TypeOfUseService(c).UpdateAsync(1,
            new UpdateAssetTypeOfUseDto { AssetCategoryId = 1, AssetTypeId = 10, TypeOfUseCode = "COM", Description = "Residential", IsActive = true }));

        AssertSingleError(ex, nameof(AssetTypeOfUseMasterEntity.TypeOfUseCode), "Type Of Use Code 'COM' already exists.");
    }

    [Fact]
    public async Task TypeOfUse_CreateWithDuplicateNameForSameAssetType_Throws()
    {
        await SeedAsync(new AssetTypeOfUseMasterEntity { Id = 1, AssetCategoryId = 1, AssetTypeId = 10, TypeOfUseCode = "RES", Description = "Residential" });

        var ex = await ExpectValidationAsync(c => TypeOfUseService(c).CreateAsync(
            new CreateAssetTypeOfUseDto { AssetCategoryId = 1, AssetTypeId = 10, TypeOfUseCode = "RES2", Description = "Residential", IsActive = true }));

        AssertSingleError(ex, nameof(AssetTypeOfUseMasterEntity.Description), "Type Of Use Name 'Residential' already exists for the selected Asset Category and Asset Type.");
    }

    #endregion

    #region Grievance Remark

    private AssetGrievanceRemarkService GrievanceRemarkService(ApplicationDbContext context) =>
        new(new Repository<AssetGrievanceRemarkMasterEntity, int>(context), new Repository<AssetGrievanceCategoryEntity, int>(context),
            new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task GrievanceRemark_CreateWithDuplicateRemarkInSameCategory_Throws()
    {
        await SeedAsync(
            new AssetGrievanceCategoryEntity { Id = 3, GrievanceTypeCode = "NAME_CORR", GrievanceTypeName = "Owner Name Correction", CodeFormat = "GRV-{YYYY}-{####}" },
            new AssetGrievanceRemarkMasterEntity { Id = 1, GrievanceCategoryId = 3, Remark = "Spelling mistake" });

        var ex = await ExpectValidationAsync(c => GrievanceRemarkService(c).CreateAsync(
            new CreateAssetGrievanceRemarkDto { GrievanceCategoryId = 3, Remark = "Spelling mistake", IsActive = true }));

        AssertSingleError(ex, nameof(AssetGrievanceRemarkMasterEntity.Remark), "Remark 'Spelling mistake' already exists for the selected Grievance Category.");
    }

    #endregion

    #region Bulk create / update keep item-level failures

    // The duplicate checks return their failures (they must not throw): AssetMasterCrudService's bulk create and
    // bulk update loops skip a failed item, save the valid ones and report the failure per item. A thrown exception
    // would escape the loop and roll back the whole batch, so a valid record would not be saved.
    // Each accepted item is saved before the next is validated, so items are also checked against the items
    // accepted earlier in the same batch, including codes and names those updates released.

    [Fact]
    public async Task AssetCategory_BulkCreateWithValidAndDuplicateItems_SavesValidAndReportsDuplicatePerItem()
    {
        await SeedAsync(new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land" });

        BulkResult<AssetCategoryDto> result;
        await using (var context = CreateContext())
        {
            result = await AssetCategoryService(context).BulkCreateAsync(new[]
            {
                new CreateAssetCategoryDto { CategoryCode = "BLDG", CategoryName = "Building", IsActive = true },
                new CreateAssetCategoryDto { CategoryCode = "LAND", CategoryName = "Land", IsActive = true }
            });
        }

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal("BLDG", Assert.Single(result.Results).CategoryCode);
        var error = Assert.Single(result.Errors!);
        Assert.StartsWith("Item 1:", error);
        Assert.Contains("Category Code 'LAND' already exists.", error);
        Assert.Contains("Category Name 'Land' already exists.", error);

        await using var verify = CreateContext();
        var codes = await verify.Set<AssetCategoryEntity>().AsNoTracking().Select(x => x.CategoryCode).OrderBy(x => x).ToListAsync();
        Assert.Equal(new[] { "BLDG", "LAND" }, codes);
    }

    [Fact]
    public async Task AssetCategory_BulkUpdateWithValidAndDuplicateItems_UpdatesValidAndReportsDuplicatePerItem()
    {
        await SeedAsync(
            new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land" },
            new AssetCategoryEntity { Id = 2, CategoryCode = "BLDG", CategoryName = "Building" });

        BulkResult<AssetCategoryDto> result;
        await using (var context = CreateContext())
        {
            result = await AssetCategoryService(context).BulkUpdateAsync(new[]
            {
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(1,
                    new UpdateAssetCategoryDto { CategoryCode = "LAND", CategoryName = "Land", Description = "Updated", IsActive = true }),
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(2,
                    new UpdateAssetCategoryDto { CategoryCode = "LAND", CategoryName = "Building", IsActive = true })
            });
        }

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        var error = Assert.Single(result.Errors!);
        Assert.StartsWith("Record with Id '2':", error);
        Assert.Contains("Category Code 'LAND' already exists.", error);

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetCategoryEntity>().AsNoTracking().OrderBy(x => x.Id).ToListAsync();
        Assert.Equal("Updated", saved[0].Description);   // the valid item was saved
        Assert.Equal("BLDG", saved[1].CategoryCode);     // the duplicate item was left unchanged
    }

    [Fact]
    public async Task OwningDepartment_BulkCreateWithValidAndDuplicateItems_SavesValidAndReportsDuplicatePerItem()
    {
        await SeedAsync(new OwningDepartmentEntity { Id = 5, OwningDepartmentName = "Estate" });

        BulkResult<OwningDepartmentDto> result;
        await using (var context = CreateContext())
        {
            result = await OwningDepartmentService(context).BulkCreateAsync(new[]
            {
                new CreateOwningDepartmentDto { OwningDepartmentName = "Estate", IsActive = true },
                new CreateOwningDepartmentDto { OwningDepartmentName = "Water Works", IsActive = true }
            });
        }

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal("Water Works", Assert.Single(result.Results).OwningDepartmentName);
        Assert.Equal("Item 0: OwningDepartmentName: Owning Department Name 'Estate' already exists.", Assert.Single(result.Errors!));
    }

    [Fact]
    public async Task AssessmentYearRange_BulkCreateWithValidAndDuplicateItems_SavesValidAndReportsDuplicatePerItem()
    {
        await SeedAsync(new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2020, ToYear = 2025 });

        BulkResult<AssetAssessmentYearRangeMasterCVDto> result;
        await using (var context = CreateContext())
        {
            var service = new AssetAssessmentYearRangeCVService(
                new Repository<AssetAssessmentYearRangeMasterCVEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));
            result = await service.BulkCreateAsync(new[]
            {
                new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2026, ToYear = 2030, IsActive = true },
                new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2020, ToYear = 2025, IsActive = true }
            });
        }

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal("Item 1: ToYear: Assessment Year Range '2020-2025' already exists.", Assert.Single(result.Errors!));
    }

    [Fact]
    public async Task Gst_BulkCreateTwoNewRatesWithSameName_SavesFirstAndReportsSecond()
    {
        // Previously both items were validated against the saved rows only, so both passed and two rates with the
        // same Tax Name were saved (TaxName has no unique index to stop it).
        BulkResult<GSTDto> result;
        await using (var context = CreateContext())
        {
            result = await GstService(context).BulkCreateAsync(new[]
            {
                new CreateGSTDto { TaxCode = "GST5", TaxName = "GST 5%", TaxPercentage = 5, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true },
                new CreateGSTDto { TaxCode = "GST5B", TaxName = "GST 5%", TaxPercentage = 5, EffectiveFromDate = new DateTime(2025, 4, 1), IsActive = true }
            });
        }

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal("GST5", Assert.Single(result.Results).TaxCode);
        Assert.Equal("Item 1: TaxName: Tax Name 'GST 5%' already exists.", Assert.Single(result.Errors!));

        await using var verify = CreateContext();
        Assert.Equal(new[] { "GST5" }, await verify.Set<GSTMasterEntity>().AsNoTracking().Select(x => x.TaxCode).ToListAsync());
    }

    [Fact]
    public async Task AssetCategory_BulkUpdateTwoCategoriesOntoSameFreeCode_UpdatesFirstAndReportsSecond()
    {
        // Previously both updates passed (OPEN was free in the saved rows) and the batch then failed on the unique
        // index, rolling back the valid update too. Now the second one is an item-level failure.
        await SeedAsync(
            new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land" },
            new AssetCategoryEntity { Id = 2, CategoryCode = "BLDG", CategoryName = "Building" });

        BulkResult<AssetCategoryDto> result;
        await using (var context = CreateContext())
        {
            result = await AssetCategoryService(context).BulkUpdateAsync(new[]
            {
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(1,
                    new UpdateAssetCategoryDto { CategoryCode = "OPEN", CategoryName = "Land", IsActive = true }),
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(2,
                    new UpdateAssetCategoryDto { CategoryCode = "OPEN", CategoryName = "Building", IsActive = true })
            });
        }

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal("Record with Id '2': CategoryCode: Category Code 'OPEN' already exists.", Assert.Single(result.Errors!));

        await using var verify = CreateContext();
        var codes = await verify.Set<AssetCategoryEntity>().AsNoTracking().OrderBy(x => x.Id).Select(x => x.CategoryCode).ToListAsync();
        Assert.Equal(new[] { "OPEN", "BLDG" }, codes);
    }

    [Fact]
    public async Task AssetCategory_BulkUpdateReusingCodeAndNameReleasedEarlierInBatch_UpdatesBoth()
    {
        // Previously the second update was rejected: its check still saw LAND / Land on category 1, although the
        // first update in the same batch had just moved category 1 to PLOT / Plot.
        await SeedAsync(
            new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land" },
            new AssetCategoryEntity { Id = 2, CategoryCode = "BLDG", CategoryName = "Building" });

        BulkResult<AssetCategoryDto> result;
        await using (var context = CreateContext())
        {
            result = await AssetCategoryService(context).BulkUpdateAsync(new[]
            {
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(1,
                    new UpdateAssetCategoryDto { CategoryCode = "PLOT", CategoryName = "Plot", IsActive = true }),
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(2,
                    new UpdateAssetCategoryDto { CategoryCode = "LAND", CategoryName = "Land", IsActive = true })
            });
        }

        Assert.Equal(2, result.SuccessCount);
        Assert.Equal(0, result.FailedCount);
        Assert.Null(result.Errors);

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetCategoryEntity>().AsNoTracking().OrderBy(x => x.Id).ToListAsync();
        Assert.Equal(("PLOT", "Plot"), (saved[0].CategoryCode, saved[0].CategoryName));
        Assert.Equal(("LAND", "Land"), (saved[1].CategoryCode, saved[1].CategoryName));
    }

    [Fact]
    public async Task AssetCategory_BulkUpdateWithSameIdTwice_EachResultShowsItsOwnUpdate()
    {
        // Previously the results were mapped after the loop from the tracked entity, so both entries showed the
        // second item's values.
        await SeedAsync(new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land" });

        BulkResult<AssetCategoryDto> result;
        await using (var context = CreateContext())
        {
            result = await AssetCategoryService(context).BulkUpdateAsync(new[]
            {
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(1,
                    new UpdateAssetCategoryDto { CategoryCode = "LAND", CategoryName = "Land", Description = "First", IsActive = true }),
                new BulkUpdateItem<int, UpdateAssetCategoryDto>(1,
                    new UpdateAssetCategoryDto { CategoryCode = "LAND", CategoryName = "Land", Description = "Second", IsActive = true })
            });
        }

        Assert.Equal(2, result.SuccessCount);
        Assert.Equal(new[] { "First", "Second" }, result.Results.Select(r => r.Description));

        await using var verify = CreateContext();
        Assert.Equal("Second", (await verify.Set<AssetCategoryEntity>().AsNoTracking().SingleAsync()).Description);
    }

    [Fact]
    public async Task AssessmentYearRange_BulkCreateOverlappingRangesInSameBatch_ReportsSecond()
    {
        // The overlap check reads the saved ranges too, so it had the same gap.
        BulkResult<AssetAssessmentYearRangeMasterCVDto> result;
        await using (var context = CreateContext())
        {
            var service = new AssetAssessmentYearRangeCVService(
                new Repository<AssetAssessmentYearRangeMasterCVEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));
            result = await service.BulkCreateAsync(new[]
            {
                new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2026, ToYear = 2030, IsActive = true },
                new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2028, ToYear = 2032, IsActive = true }
            });
        }

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal("Item 1: ToYear: Assessment Year Range '2028-2032' overlaps an existing year range.", Assert.Single(result.Errors!));
    }

    #endregion
}
