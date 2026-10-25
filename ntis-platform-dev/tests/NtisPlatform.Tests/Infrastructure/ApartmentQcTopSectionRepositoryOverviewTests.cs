using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure;

/// <summary>
/// Covers the overview-strip fields added to <c>ApartmentQcTopSectionRepository.GetPropertyAsync</c>:
/// society name, bilingual owner/occupier names, owner category, and the society's main-building
/// photo. The pre-existing overview/info/performance fields are covered elsewhere (or not at all
/// yet, per the sibling test gap) — this file is scoped to the new additions only.
/// </summary>
public class ApartmentQcTopSectionRepositoryOverviewTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ApplicationDbContext(options);
    }

    private static PropertyEntity SeedProperty(ApplicationDbContext context, int id = 100)
    {
        var property = new PropertyEntity
        {
            Id = id,
            WardId = 1,
            TaxZoneId = 1,
            PropertyNo = "2024-000123",
            OwnerName = "मातोश्री बिल्डर्स",
            OwnerNameEnglish = "MATOSHREE BUILDERS",
            OccupierName = "मातोश्री बिल्डर्स",
            OccupierNameEnglish = "MATOSHREE BUILDERS",
            IsActive = true,
            MarkedForDeletion = false
        };
        context.PropertyMast.Add(property);
        return property;
    }

    [Fact]
    public async Task GetPropertyAsync_ReturnsSocietyNameAndBilingualOwnerOccupierFields()
    {
        using var context = CreateContext();
        SeedProperty(context);
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity
        {
            Id = 1,
            PropertyId = 100,
            SocietyName = "मातोश्री बिल्डर्स सोसायटी",
            SocietyNameEnglish = "MATOSHREE BUILDERS SOCIETY",
            IsActive = true
        });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var result = await repository.GetPropertyAsync(new ApartmentQcTopSectionQueryParameters { PropertyId = 100 });

        Assert.NotNull(result);
        Assert.Equal("MATOSHREE BUILDERS SOCIETY", result!.SocietyNameEnglish);
        Assert.Equal("मातोश्री बिल्डर्स सोसायटी", result.SocietyName);
        Assert.Equal("MATOSHREE BUILDERS", result.OwnerNameEnglish);
        Assert.Equal("मातोश्री बिल्डर्स", result.OwnerName);
        Assert.Equal("MATOSHREE BUILDERS", result.OccupierNameEnglish);
        Assert.Equal("मातोश्री बिल्डर्स", result.OccupierName);
    }

    [Fact]
    public async Task GetPropertyAsync_NoSociety_LeavesSocietyFieldsNull()
    {
        using var context = CreateContext();
        SeedProperty(context);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var result = await repository.GetPropertyAsync(new ApartmentQcTopSectionQueryParameters { PropertyId = 100 });

        Assert.NotNull(result);
        Assert.Null(result!.SocietyName);
        Assert.Null(result.SocietyNameEnglish);
        Assert.Null(result.SocietyBuildingPhotoGuid);
    }

    [Fact]
    public async Task GetPropertyAsync_ResolvesOwnerCategoryFromOwnerTypeMaster()
    {
        using var context = CreateContext();
        SeedProperty(context);
        context.OwnerTypeMaster.Add(new OwnerTypeMasterEntity { Id = 1, OwnerType = "Company / Industrial", IsActive = true });
        context.PropertyMastDetails.Add(new PropertyAssessmentEntity
        {
            Id = 1,
            PropertyId = 100,
            OwnerTypeId = 1,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now
        });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var result = await repository.GetPropertyAsync(new ApartmentQcTopSectionQueryParameters { PropertyId = 100 });

        Assert.NotNull(result);
        Assert.Equal("Company / Industrial", result!.OwnerCategory);
    }

    [Fact]
    public async Task GetPropertyAsync_ResolvesSocietyBuildingPhotoGuid_FromSocietyPlacePhotoType()
    {
        using var context = CreateContext();
        SeedProperty(context);
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 1, PropertyId = 100, IsActive = true });
        context.PropertyPhotoTypes.Add(new PropertyPhotoTypeEntity
        {
            Id = 5,
            PhotoTypeCode = "SOCIETY_PLACE",
            PhotoTypeName = "Society Place Photo",
            PhotoScope = "SOCIETY",
            IsActive = true
        });
        var document = new DocumentEntity { Id = 1, DocumentGuid = Guid.NewGuid(), IsActive = true };
        context.Documents.Add(document);
        var binding = DocumentBindingEntity.CreateWithIntReference(
            documentId: 1, departmentId: 1, moduleId: 1,
            referenceTableName: "PropertyPhoto", referenceTableId: 1, referencePropertyName: "DocumentBindingId");
        binding.Id = 1;
        context.DocumentBindings.Add(binding);
        var photo = PropertyPhotoEntity.CreateWithDetails(
            propertyId: 100, photoTypeId: 5, entityType: "S",
            societyDetailId: 1, wingDetailId: null, documentBindingId: 1);
        context.PropertyPhotos.Add(photo);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var result = await repository.GetPropertyAsync(new ApartmentQcTopSectionQueryParameters { PropertyId = 100 });

        Assert.NotNull(result);
        Assert.Equal(document.DocumentGuid, result!.SocietyBuildingPhotoGuid);
    }

    [Fact]
    public async Task GetPropertyAsync_IgnoresWingScopedPhoto_ForSocietyBuildingPhoto()
    {
        using var context = CreateContext();
        SeedProperty(context);
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 1, PropertyId = 100, IsActive = true });
        context.PropertyPhotoTypes.Add(new PropertyPhotoTypeEntity
        {
            Id = 8,
            PhotoTypeCode = "WING_BUILDING",
            PhotoTypeName = "Wing Building Photo",
            PhotoScope = "WING",
            IsActive = true
        });
        var document = new DocumentEntity { Id = 1, DocumentGuid = Guid.NewGuid(), IsActive = true };
        context.Documents.Add(document);
        var binding = DocumentBindingEntity.CreateWithIntReference(
            documentId: 1, departmentId: 1, moduleId: 1,
            referenceTableName: "PropertyPhoto", referenceTableId: 1, referencePropertyName: "DocumentBindingId");
        binding.Id = 1;
        context.DocumentBindings.Add(binding);
        var wingPhoto = PropertyPhotoEntity.CreateWithDetails(
            propertyId: 100, photoTypeId: 8, entityType: "W",
            societyDetailId: null, wingDetailId: 1, documentBindingId: 1);
        context.PropertyPhotos.Add(wingPhoto);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var result = await repository.GetPropertyAsync(new ApartmentQcTopSectionQueryParameters { PropertyId = 100 });

        Assert.NotNull(result);
        Assert.Null(result!.SocietyBuildingPhotoGuid);
    }

    [Fact]
    public async Task GetPropertyAsync_ReturnsSubZoneNoAndCsn()
    {
        using var context = CreateContext();
        var prop = SeedProperty(context, id: 200);
        prop.SubZoneNo = "SZ-05";
        prop.CSN = "CSN-987/A";
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var result = await repository.GetPropertyAsync(new ApartmentQcTopSectionQueryParameters { PropertyId = 200 });

        Assert.NotNull(result);
        Assert.Equal("SZ-05", result!.SubZoneNo);
        Assert.Equal("CSN-987/A", result.Csn);
    }

    [Fact]
    public async Task GetCarpetAndBuiltUpAreaTotals_AggregatesAcrossApartment_ExcludesOpenPlotRecords()
    {
        using var context = CreateContext();
        // Setup OP master entities
        context.FloorEntity.Add(new FloorEntity { Id = 1, FloorCode = "GF", IsActive = true });
        context.FloorEntity.Add(new FloorEntity { Id = 2, FloorCode = "OP", IsActive = true }); // Open Plot floor

        context.ConstructionTypeEntity.Add(new ConstructionTypeEntity { Id = 1, ConstructionCode = "RCC", IsActive = true });
        context.ConstructionTypeEntity.Add(new ConstructionTypeEntity { Id = 2, ConstructionCode = "OP", IsActive = true }); // Open Plot construction

        var opCat = new TypeOfUseCategoryEntity { Id = 1, TypeOfUseCategoryCode = NtisPlatform.Core.Constants.TypeOfUseConstants.Op, IsActive = true };
        context.TypeOfUseCategory.Add(opCat);
        context.TypeOfUse.Add(new TypeOfUseEntity { Id = 1, TypeOfUseCode = "RES", Description = "Residential", IsActive = true });
        context.TypeOfUse.Add(new TypeOfUseEntity { Id = 2, TypeOfUseCode = "OP", TypeOfUseCategoryId = 1, Description = "Open Plot", IsActive = true }); // Open Plot use

        // Property 1 (Flat 101) in Ward 1, Prop 2024-001
        context.PropertyMast.Add(new PropertyEntity
        {
            Id = 301,
            WardId = 1,
            PropertyNo = "2024-001",
            PartitionNo = "101",
            IsActive = true,
            MarkedForDeletion = false
        });

        // Property 2 (Flat 102) in same apartment
        context.PropertyMast.Add(new PropertyEntity
        {
            Id = 302,
            WardId = 1,
            PropertyNo = "2024-001",
            PartitionNo = "102",
            IsActive = true,
            MarkedForDeletion = false
        });

        // Details for Flat 101 (Valid constructed area)
        context.PropertyDetails.Add(new PropertyDetailsEntity
        {
            Id = 1,
            PropertyId = 301,
            FloorId = 1,
            ConstructionTypeId = 1,
            TypeOfUseId = 1,
            CarpetAreaSqFeet = 500.0,
            CarpetAreaSqMeter = 46.45,
            BuiltupAreaSqFeet = 650.0,
            BuiltupAreaSqMeter = 60.38,
            IsActive = true,
            MarkedForDeletion = false
        });

        // Details for Flat 102 (Valid constructed area)
        context.PropertyDetails.Add(new PropertyDetailsEntity
        {
            Id = 2,
            PropertyId = 302,
            FloorId = 1,
            ConstructionTypeId = 1,
            TypeOfUseId = 1,
            CarpetAreaSqFeet = 700.0,
            CarpetAreaSqMeter = 65.03,
            BuiltupAreaSqFeet = 900.0,
            BuiltupAreaSqMeter = 83.61,
            IsActive = true,
            MarkedForDeletion = false
        });

        // OP detail record for Property 301 (Must be EXCLUDED)
        context.PropertyDetails.Add(new PropertyDetailsEntity
        {
            Id = 3,
            PropertyId = 301,
            FloorId = 2, // OP floor
            ConstructionTypeId = 2, // OP construction
            TypeOfUseId = 2, // OP type of use
            CarpetAreaSqFeet = 2000.0,
            CarpetAreaSqMeter = 185.8,
            BuiltupAreaSqFeet = 2000.0,
            BuiltupAreaSqMeter = 185.8,
            IsActive = true,
            MarkedForDeletion = false
        });

        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var (carpetFt, carpetMtr) = await repository.GetCarpetAreaTotalsAsync(301);
        var (builtUpFt, builtUpMtr) = await repository.GetBuiltUpAreaTotalsAsync(301);

        // Sum = Flat 101 (500) + Flat 102 (700) = 1200 sqft (OP 2000 excluded)
        Assert.Equal(1200.0, carpetFt);
        Assert.Equal(111.48, carpetMtr);

        // Sum = Flat 101 (650) + Flat 102 (900) = 1550 sqft (OP 2000 excluded)
        Assert.Equal(1550.0, builtUpFt);
        Assert.Equal(143.99, builtUpMtr);
    }

    [Fact]
    public async Task GetOldCarpetAndBuiltUpAreaTotals_AggregatesAcrossMappedOldProperties_ExcludesOpenPlotRecords()
    {
        using var context = CreateContext();
        // Setup OP master entities
        context.FloorEntity.Add(new FloorEntity { Id = 1, FloorCode = "GF", IsActive = true });
        context.FloorEntity.Add(new FloorEntity { Id = 2, FloorCode = "OP", IsActive = true });

        context.ConstructionTypeEntity.Add(new ConstructionTypeEntity { Id = 1, ConstructionCode = "RCC", IsActive = true });
        context.ConstructionTypeEntity.Add(new ConstructionTypeEntity { Id = 2, ConstructionCode = "OP", IsActive = true });

        var opCat = new TypeOfUseCategoryEntity { Id = 1, TypeOfUseCategoryCode = NtisPlatform.Core.Constants.TypeOfUseConstants.Op, IsActive = true };
        context.TypeOfUseCategory.Add(opCat);
        context.TypeOfUse.Add(new TypeOfUseEntity { Id = 1, TypeOfUseCode = "RES", Description = "Residential", IsActive = true });
        context.TypeOfUse.Add(new TypeOfUseEntity { Id = 2, TypeOfUseCode = "OP", TypeOfUseCategoryId = 1, Description = "Open Plot", IsActive = true });

        // New properties for apartment
        context.PropertyMast.Add(new PropertyEntity
        {
            Id = 401,
            WardId = 2,
            PropertyNo = "2024-002",
            PartitionNo = "1",
            IsActive = true,
            MarkedForDeletion = false
        });
        context.PropertyMast.Add(new PropertyEntity
        {
            Id = 402,
            WardId = 2,
            PropertyNo = "2024-002",
            PartitionNo = "2",
            IsActive = true,
            MarkedForDeletion = false
        });

        // Map to Old Property IDs 1001 and 1002
        context.Set<PropertyMapDetailEntity>().Add(new PropertyMapDetailEntity
        {
            Id = 1,
            PropertyIdNew = 401,
            PropertyIdOld = 1001,
            IsActive = true,
            CreatedDate = DateTime.Now
        });
        context.Set<PropertyMapDetailEntity>().Add(new PropertyMapDetailEntity
        {
            Id = 2,
            PropertyIdNew = 402,
            PropertyIdOld = 1002,
            IsActive = true,
            CreatedDate = DateTime.Now
        });

        // Old Property Details for Old Prop 1001
        context.PropertyDetailsOld.Add(new PropertyDetailsOldEntity
        {
            Id = 1,
            PropertyMastOldId = 1001,
            OldFloorId = 1,
            OldConstructionTypeId = 1,
            OldTypeOfUseId = 1,
            OldCarpetAreaSqFeet = 400.0,
            OldCarpetAreaSqMeter = 37.16,
            OldBuiltupAreaSqFeet = 500.0,
            OldBuiltupAreaSqMeter = 46.45,
            IsActive = true,
            MarkedForDeletion = false
        });

        // Old Property Details for Old Prop 1002
        context.PropertyDetailsOld.Add(new PropertyDetailsOldEntity
        {
            Id = 2,
            PropertyMastOldId = 1002,
            OldFloorId = 1,
            OldConstructionTypeId = 1,
            OldTypeOfUseId = 1,
            OldCarpetAreaSqFeet = 600.0,
            OldCarpetAreaSqMeter = 55.74,
            OldBuiltupAreaSqFeet = 750.0,
            OldBuiltupAreaSqMeter = 69.68,
            IsActive = true,
            MarkedForDeletion = false
        });

        // OP Old detail for Old Prop 1001 (Must be EXCLUDED)
        context.PropertyDetailsOld.Add(new PropertyDetailsOldEntity
        {
            Id = 3,
            PropertyMastOldId = 1001,
            OldFloorId = 2, // OP floor
            OldConstructionTypeId = 2, // OP construction
            OldTypeOfUseId = 2, // OP use
            OldCarpetAreaSqFeet = 1500.0,
            OldCarpetAreaSqMeter = 139.35,
            OldBuiltupAreaSqFeet = 1500.0,
            OldBuiltupAreaSqMeter = 139.35,
            IsActive = true,
            MarkedForDeletion = false
        });

        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var (oldCarpetFt, oldCarpetMtr) = await repository.GetOldCarpetAreaTotalsAsync(401);
        var (oldBuiltUpFt, oldBuiltUpMtr) = await repository.GetOldBuiltUpAreaTotalsAsync(401);

        // Sum = Old Prop 1001 (400) + Old Prop 1002 (600) = 1000 sqft (OP 1500 excluded)
        Assert.Equal(1000.0, oldCarpetFt);
        Assert.Equal(92.9, oldCarpetMtr);

        // Sum = Old Prop 1001 (500) + Old Prop 1002 (750) = 1250 sqft (OP 1500 excluded)
        Assert.Equal(1250.0, oldBuiltUpFt);
        Assert.Equal(116.13, oldBuiltUpMtr);
    }

    [Fact]
    public async Task ApartmentQcTopSectionService_GetTopSectionAsync_PopulatesSubZoneCsnAndAllAreaTotals()
    {
        using var context = CreateContext();
        var prop = SeedProperty(context, id: 500);
        prop.SubZoneNo = "SZ-01";
        prop.CSN = "CSN-101";

        context.FloorEntity.Add(new FloorEntity { Id = 1, FloorCode = "GF", IsActive = true });
        context.ConstructionTypeEntity.Add(new ConstructionTypeEntity { Id = 1, ConstructionCode = "RCC", IsActive = true });
        context.TypeOfUse.Add(new TypeOfUseEntity { Id = 1, TypeOfUseCode = "RES", Description = "Residential", IsActive = true });

        context.PropertyDetails.Add(new PropertyDetailsEntity
        {
            Id = 1,
            PropertyId = 500,
            FloorId = 1,
            ConstructionTypeId = 1,
            TypeOfUseId = 1,
            CarpetAreaSqFeet = 600.0,
            CarpetAreaSqMeter = 55.74,
            BuiltupAreaSqFeet = 800.0,
            BuiltupAreaSqMeter = 74.32,
            IsActive = true,
            MarkedForDeletion = false
        });

        context.Set<PropertyMapDetailEntity>().Add(new PropertyMapDetailEntity
        {
            Id = 10,
            PropertyIdNew = 500,
            PropertyIdOld = 2001,
            IsActive = true,
            CreatedDate = DateTime.Now
        });

        context.PropertyDetailsOld.Add(new PropertyDetailsOldEntity
        {
            Id = 1,
            PropertyMastOldId = 2001,
            OldFloorId = 1,
            OldConstructionTypeId = 1,
            OldTypeOfUseId = 1,
            OldCarpetAreaSqFeet = 500.0,
            OldCarpetAreaSqMeter = 46.45,
            OldBuiltupAreaSqFeet = 700.0,
            OldBuiltupAreaSqMeter = 65.03,
            IsActive = true,
            MarkedForDeletion = false
        });

        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionRepository(context);
        var calculator = new NtisPlatform.Application.Services.ApartmentQcTopSectionPerformanceCalculator();
        var service = new NtisPlatform.Application.Services.ApartmentQcTopSectionService(repository, calculator);

        var result = await service.GetTopSectionAsync(new ApartmentQcTopSectionQueryParameters { PropertyId = 500 });

        Assert.NotNull(result);

        // Check Overview DTO
        Assert.Equal("SZ-01", result!.PropertyOverview.SubZoneNo);
        Assert.Equal("CSN-101", result.PropertyOverview.Csn);

        // Check Info DTO
        Assert.Equal("SZ-01", result.PropertyInfo.SubZoneNo);
        Assert.Equal("CSN-101", result.PropertyInfo.Csn);
        Assert.Equal("CSN-101", result.PropertyInfo.SurveyNo);

        Assert.Equal(600.0, result.PropertyInfo.CarpetAreaFt);
        Assert.Equal(55.74, result.PropertyInfo.CarpetAreaMtr);
        Assert.Equal(800.0, result.PropertyInfo.BuiltUpAreaFt);
        Assert.Equal(74.32, result.PropertyInfo.BuiltUpAreaMtr);

        Assert.Equal(500.0, result.PropertyInfo.OldCarpetAreaFt);
        Assert.Equal(46.45, result.PropertyInfo.OldCarpetAreaMtr);
        Assert.Equal(700.0, result.PropertyInfo.OldBuiltUpAreaFt);
        Assert.Equal(65.03, result.PropertyInfo.OldBuiltUpAreaMtr);
    }
}

