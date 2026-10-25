using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories.Property;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.Repositories.Property;

public class PropertyIndividualSupplementaryRepositoryTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ApplicationDbContext(options);
    }

    private static PropertyEntity CreateProperty(int id)
        => new()
        {
            Id = id,
            WardId = 1,
            TaxZoneId = 1,
            PropertyNo = "1",
            IsActive = true,
            MarkedForDeletion = false
        };

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_MultipleAssessmentRows_ReturnsOldestRowsAadhar()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        // Oldest row (lowest Id) carries the Aadhar — matches where PropertyKycService's write
        // path (GetFirstAssessmentIdAsync) always updates. A later re-assessment row exists too,
        // without an Aadhar value, reproducing the real bug: reading "newest by CreatedDate" (as
        // the shared ApartmentQC repository does) would return null instead of this value.
        context.PropertyMastDetails.AddRange(
            new PropertyAssessmentEntity { Id = 1, PropertyId = 100, AdharCardNo = "1234-5678-9012", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2024, 1, 1) },
            new PropertyAssessmentEntity { Id = 2, PropertyId = 100, AdharCardNo = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2026, 6, 1) });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(propertyId: 100);

        Assert.Equal("1234-5678-9012", result.AadharCardNo);
    }

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_OldestRowInactiveOrDeleted_FallsBackToNextActiveRow()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        context.PropertyMastDetails.AddRange(
            new PropertyAssessmentEntity { Id = 1, PropertyId = 100, AdharCardNo = "0000-0000-0000", IsActive = false, MarkedForDeletion = false, CreatedDate = new DateTime(2023, 1, 1) },
            new PropertyAssessmentEntity { Id = 2, PropertyId = 100, AdharCardNo = "9999-9999-9999", IsActive = true, MarkedForDeletion = true, CreatedDate = new DateTime(2024, 1, 1) },
            new PropertyAssessmentEntity { Id = 3, PropertyId = 100, AdharCardNo = "1111-2222-3333", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 1, 1) });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(propertyId: 100);

        Assert.Equal("1111-2222-3333", result.AadharCardNo);
    }

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_NoAssessmentRow_ReturnsNullAadhar()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(propertyId: 100);

        Assert.Null(result.AadharCardNo);
    }

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_AssessmentRowFromAnotherProperty_NotIncluded()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        context.PropertyMastDetails.Add(
            new PropertyAssessmentEntity { Id = 1, PropertyId = 999, AdharCardNo = "5555-5555-5555", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2024, 1, 1) });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(propertyId: 100);

        Assert.Null(result.AadharCardNo);
    }

    [Fact]
    public async Task GetAdditionalRevenueTaxDetailsAsync_CurrentTax_ExcludesOcCertificatePolicyRow()
    {
        // Regression test: PolicyTaxDetails can carry rows for multiple policy codes for the
        // same property -- the ordinary NETTAX components and a certificate-driven OC row
        // (reproducing the live screenshot: NETTAX=1404, OC=1229, Additional Revenue wrongly
        // showed CurrentTax=2671=NETTAX+OC). CurrentTax must only ever reflect NETTAX rows.
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));

        var generalTax = new NtisPlatform.Core.Entities.Master.TaxMasterEntity { Id = 1, TaxCode = "GENTAX", TaxName = "General Tax", IsActive = true };
        var netTaxPolicy = new NtisPlatform.Core.Entities.Master.PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", IsRetroDemand = false, IsActive = true };
        var ocPolicy = new NtisPlatform.Core.Entities.Master.PolicyCodeMasterEntity { Id = 2, PolicyCode = "OC", IsRetroDemand = true, IsActive = true };
        context.TaxMaster.Add(generalTax);
        context.PolicyCodeMaster.AddRange(netTaxPolicy, ocPolicy);

        context.PolicyTaxDetails.AddRange(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 100, PolicyCodeId = 1, TaxId = 1, TaxAmount = 1404.00m, IsActive = true, MarkedForDeletion = false, IsCurrent = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 100, PolicyCodeId = 2, TaxId = 1, TaxAmount = 1229.00m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetAdditionalRevenueTaxDetailsAsync(propertyId: 100);

        Assert.Equal(1404.00m, result.CurrentTax);
    }

    [Fact]
    public async Task GetAdditionalRevenueTaxDetailsAsync_CurrentTax_IgnoresStaleTaxTotalSentinelRow()
    {
        // Regression test reproducing a live property (Ward MM11, Property 30) where Additional
        // Revenue showed Current Tax = ₹0 even though the property's Tax Details table and its
        // own "Tax (Current)" comparison card both showed a real, nonzero current tax (₹1,306).
        // Root cause: PolicyTaxDetails' reserved "TaxTotal" sentinel row is not kept reliably in
        // sync by every write path (see PropertyRepository.cs's identical exclusion) and can sit
        // at a stale 0 while the real NETTAX components (General Tax + Water Cess here) are
        // current and sum to the true total. CurrentTax must be the sum of the real components,
        // never the sentinel row's own stored value.
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));

        var generalTax = new NtisPlatform.Core.Entities.Master.TaxMasterEntity { Id = 1, TaxCode = "GENTAX", TaxName = "General Tax", IsActive = true };
        var waterCess = new NtisPlatform.Core.Entities.Master.TaxMasterEntity { Id = 2, TaxCode = "WATERCESS", TaxName = "Water Benefit Cess", IsActive = true };
        var taxTotalSentinel = new NtisPlatform.Core.Entities.Master.TaxMasterEntity { Id = 3, TaxCode = "TAXTOTAL", TaxName = "TaxTotal", IsActive = true };
        var netTaxPolicy = new NtisPlatform.Core.Entities.Master.PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", IsRetroDemand = false, IsActive = true };
        context.TaxMaster.AddRange(generalTax, waterCess, taxTotalSentinel);
        context.PolicyCodeMaster.Add(netTaxPolicy);

        context.PolicyTaxDetails.AddRange(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 100, PolicyCodeId = 1, TaxId = 1, TaxAmount = 1000.00m, IsActive = true, MarkedForDeletion = false, IsCurrent = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 100, PolicyCodeId = 1, TaxId = 2, TaxAmount = 306.00m, IsActive = true, MarkedForDeletion = false, IsCurrent = true },
            // Stale sentinel row: never re-synced by the write path, sitting at 0.
            new PolicyTaxDetailsEntity { Id = 3, PropertyId = 100, PolicyCodeId = 1, TaxId = 3, TaxAmount = 0.00m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetAdditionalRevenueTaxDetailsAsync(propertyId: 100);

        Assert.Equal(1306.00m, result.CurrentTax);
    }

    [Fact]
    public async Task GetCarpetAndBuiltUpAreaTotalsAsync_SiblingUnitInSameBuilding_NotIncluded()
    {
        using var context = CreateContext();
        context.PropertyMast.AddRange(CreateProperty(100), CreateProperty(200));

        // Open plot master metadata
        var openFloor = new FloorEntity { Id = 77, FloorCode = "OP", IsActive = true };
        var normalFloor = new FloorEntity { Id = 67, FloorCode = "01", IsActive = true };
        var openConstruction = new ConstructionTypeEntity { Id = 11, ConstructionCode = "OP", IsActive = true };
        var normalConstruction = new ConstructionTypeEntity { Id = 1, ConstructionCode = "RCC", IsActive = true };
        var opCategory = new TypeOfUseCategoryEntity { Id = 10, TypeOfUseCategoryCode = "OP", IsActive = true };
        var normalCategory = new TypeOfUseCategoryEntity { Id = 20, TypeOfUseCategoryCode = "RES", IsActive = true };
        var openUse = new TypeOfUseEntity { Id = 15115, TypeOfUseCode = "OP", TypeOfUseCategoryId = 10, TypeOfUseCategory = opCategory, IsActive = true };
        var normalUse = new TypeOfUseEntity { Id = 15139, TypeOfUseCode = "FLAT", TypeOfUseCategoryId = 20, TypeOfUseCategory = normalCategory, IsActive = true };

        context.FloorEntity.AddRange(openFloor, normalFloor);
        context.ConstructionTypeEntity.AddRange(openConstruction, normalConstruction);
        context.TypeOfUseCategory.AddRange(opCategory, normalCategory);
        context.TypeOfUse.AddRange(openUse, normalUse);

        // Property 100: 3 regular rows + 1 open plot row (reproducing the user's DB screenshot case)
        context.PropertyDetails.AddRange(
            new PropertyDetailsEntity { Id = 1, PropertyId = 100, FloorId = 67, ConstructionTypeId = 1, TypeOfUseId = 15139, CarpetAreaSqFeet = 1217.73, CarpetAreaSqMeter = 113.13, BuiltupAreaSqFeet = 1461.28, BuiltupAreaSqMeter = 135.76, IsActive = true, MarkedForDeletion = false },
            new PropertyDetailsEntity { Id = 2, PropertyId = 100, FloorId = 67, ConstructionTypeId = 1, TypeOfUseId = 15139, CarpetAreaSqFeet = 1217.73, CarpetAreaSqMeter = 113.13, BuiltupAreaSqFeet = 1461.28, BuiltupAreaSqMeter = 135.76, IsActive = true, MarkedForDeletion = false },
            new PropertyDetailsEntity { Id = 3, PropertyId = 100, FloorId = 67, ConstructionTypeId = 1, TypeOfUseId = 15139, CarpetAreaSqFeet = 1217.73, CarpetAreaSqMeter = 113.13, BuiltupAreaSqFeet = 1461.28, BuiltupAreaSqMeter = 135.76, IsActive = true, MarkedForDeletion = false },
            new PropertyDetailsEntity { Id = 4, PropertyId = 100, FloorId = 77, ConstructionTypeId = 11, TypeOfUseId = 15115, CarpetAreaSqFeet = 3444.45, CarpetAreaSqMeter = 320.00, BuiltupAreaSqFeet = 3444.45, BuiltupAreaSqMeter = 320.00, IsActive = true, MarkedForDeletion = false },
            // Property 200: Should not be included in Property 100 sum
            new PropertyDetailsEntity { Id = 5, PropertyId = 200, FloorId = 67, ConstructionTypeId = 1, TypeOfUseId = 15139, CarpetAreaSqFeet = 5000.00, CarpetAreaSqMeter = 500.00, BuiltupAreaSqFeet = 6000.00, BuiltupAreaSqMeter = 600.00, IsActive = true, MarkedForDeletion = false });

        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var (carpetFt, carpetMtr, builtUpFt, builtUpMtr) = await repository.GetAreaTotalsAsync(propertyId: 100);

        Assert.Equal(3653.19, carpetFt);
        Assert.Equal(339.39, carpetMtr);
        Assert.Equal(4383.84, builtUpFt);
        Assert.Equal(407.28, builtUpMtr);
    }

    [Fact]
    public async Task GetAreaTotalsAsync_NoRows_ReturnsNulls()
    {
        using var context = CreateContext();
        var repository = new PropertyIndividualSupplementaryRepository(context);
        var (carpetFt, carpetMtr, builtUpFt, builtUpMtr) = await repository.GetAreaTotalsAsync(propertyId: 999);

        Assert.Null(carpetFt);
        Assert.Null(carpetMtr);
        Assert.Null(builtUpFt);
        Assert.Null(builtUpMtr);
    }

    [Fact]
    public async Task GetOldAreaTotalsAsync_MappedOldProperty_SumsOldAreaRows()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        context.PropertyMapDetails.Add(new PropertyMapDetailEntity
        {
            Id = 1,
            PropertyIdNew = 100,
            PropertyIdOld = 2240289,
            IsActive = true,
            CreatedDate = DateTime.Now,
            CreatedBy = 1
        });
        context.PropertyDetailsOld.AddRange(
            new PropertyDetailsOldEntity
            {
                Id = 1,
                PropertyMastOldId = 2240289,
                OldCarpetAreaSqFeet = 8944.17,
                OldCarpetAreaSqMeter = 830.94,
                OldBuiltupAreaSqFeet = 10733.00,
                OldBuiltupAreaSqMeter = 997.13,
                IsActive = true,
                MarkedForDeletion = false,
                CreatedDate = DateTime.Now,
                CreatedBy = 1
            });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var (oldCarpetFt, oldCarpetMtr, oldBuiltUpFt, oldBuiltUpMtr) = await repository.GetOldAreaTotalsAsync(propertyId: 100);

        Assert.Equal(8944.17, oldCarpetFt);
        Assert.Equal(830.94, oldCarpetMtr);
        Assert.Equal(10733.00, oldBuiltUpFt);
        Assert.Equal(997.13, oldBuiltUpMtr);
    }

    [Fact]
    public async Task GetOldAreaTotalsAsync_MultipleMappedOldProperties_SumsAllRowsAcrossOldProperties()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(1428575));
        context.PropertyMapDetails.AddRange(
            new PropertyMapDetailEntity { Id = 704121, PropertyIdNew = 1428575, PropertyIdOld = 2013404, IsActive = false, Status = "CANCELLED", CreatedDate = DateTime.Now, CreatedBy = 1 },
            new PropertyMapDetailEntity { Id = 704122, PropertyIdNew = 1428575, PropertyIdOld = 2013405, IsActive = false, Status = "CANCELLED", CreatedDate = DateTime.Now, CreatedBy = 1 });

        context.PropertyDetailsOld.AddRange(
            new PropertyDetailsOldEntity
            {
                Id = 1,
                PropertyMastOldId = 2013404,
                OldCarpetAreaSqFeet = 45.14166666667,
                OldCarpetAreaSqMeter = 4.19380212252684,
                OldBuiltupAreaSqFeet = 54.17,
                OldBuiltupAreaSqMeter = 5.03256254703221,
                IsActive = true,
                MarkedForDeletion = false,
                CreatedDate = DateTime.Now,
                CreatedBy = 1
            },
            new PropertyDetailsOldEntity
            {
                Id = 2,
                PropertyMastOldId = 2013405,
                OldCarpetAreaSqFeet = 216.0,
                OldCarpetAreaSqMeter = 20.0670760597925,
                OldBuiltupAreaSqFeet = 259.2,
                OldBuiltupAreaSqMeter = 24.0804912717509,
                IsActive = true,
                MarkedForDeletion = false,
                CreatedDate = DateTime.Now,
                CreatedBy = 1
            });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var (oldCarpetFt, oldCarpetMtr, oldBuiltUpFt, oldBuiltUpMtr) = await repository.GetOldAreaTotalsAsync(propertyId: 1428575);

        Assert.Equal(261.14, oldCarpetFt);
        Assert.Equal(24.26, oldCarpetMtr);
        Assert.Equal(313.37, oldBuiltUpFt);
        Assert.Equal(29.11, oldBuiltUpMtr);
    }

    [Fact]
    public async Task GetOldAreaTotalsAsync_NoMapping_ReturnsNulls()
    {
        using var context = CreateContext();
        var repository = new PropertyIndividualSupplementaryRepository(context);
        var (oldCarpetFt, oldCarpetMtr, oldBuiltUpFt, oldBuiltUpMtr) = await repository.GetOldAreaTotalsAsync(propertyId: 999);

        Assert.Null(oldCarpetFt);
        Assert.Null(oldCarpetMtr);
        Assert.Null(oldBuiltUpFt);
        Assert.Null(oldBuiltUpMtr);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_PropertyNotFound_ReturnsPropertyNotFound()
    {
        using var context = CreateContext();
        var repository = new PropertyIndividualSupplementaryRepository(context);
        var dto = new UpdatePropertyIndividualDto { OwnerName = "John" };

        var result = await repository.UpdateIndividualDetailsAsync(999, dto, updatedBy: 1);

        Assert.Equal(TopSectionUpdateOutcome.PropertyNotFound, result);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_PropertyLocked_ReturnsPropertyLocked()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        context.PropertyScreenLocks.Add(new PropertyScreenLockEntity
        {
            Id = 1,
            PropertyId = 100,
            IsLocked = true,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now,
            CreatedBy = 1
        });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var dto = new UpdatePropertyIndividualDto { OwnerName = "John" };

        var result = await repository.UpdateIndividualDetailsAsync(100, dto, updatedBy: 1);

        Assert.Equal(TopSectionUpdateOutcome.PropertyLocked, result);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_ValidFields_UpdatesPropertyMastAndAssessment()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        context.PropertyMastDetails.Add(new PropertyAssessmentEntity
        {
            Id = 1,
            PropertyId = 100,
            AdharCardNo = "1111-1111-1111",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now.AddDays(-1),
            CreatedBy = 1
        });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var dto = new UpdatePropertyIndividualDto
        {
            OwnerName = "  नवे नाव  ",
            OwnerNameEnglish = "  NEW NAME  ",
            FlatOrShopNo = "  101  ",
            FlatOrShopName = "  फ्लॅट १०१  ",
            FlatOrShopNameEnglish = "  FLAT 101  ",
            AadharNo = "  123456789012  "
        };

        var result = await repository.UpdateIndividualDetailsAsync(100, dto, updatedBy: 2);

        Assert.Equal(TopSectionUpdateOutcome.Success, result);

        var property = await context.PropertyMast.FindAsync(100);
        Assert.NotNull(property);
        Assert.Equal("नवे नाव", property!.OwnerName);
        Assert.Equal("NEW NAME", property.OwnerNameEnglish);
        Assert.Equal("101", property.FlatOrShopNo);
        Assert.Equal("फ्लॅट १०१", property.FlatOrShopName);
        Assert.Equal("FLAT 101", property.FlatOrShopNameEnglish);
        Assert.Equal(2, property.UpdatedBy);

        var assessment = await context.PropertyMastDetails.FirstOrDefaultAsync(a => a.PropertyId == 100);
        Assert.NotNull(assessment);
        Assert.Equal("123456789012", assessment!.AdharCardNo);
        Assert.Equal(2, assessment.UpdatedBy);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_MobileNoOnly_UpdatesPropertyMast()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var dto = new UpdatePropertyIndividualDto { MobileNo = "  9876543210  " };

        var result = await repository.UpdateIndividualDetailsAsync(100, dto, updatedBy: 5);

        Assert.Equal(TopSectionUpdateOutcome.Success, result);
        var property = await context.PropertyMast.FindAsync(100);
        Assert.Equal("9876543210", property!.MobileNo);
        Assert.Equal(5, property.UpdatedBy);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_AadharNoOnly_UpdatesAssessment()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        context.PropertyMastDetails.Add(new PropertyAssessmentEntity
        {
            Id = 1,
            PropertyId = 100,
            AdharCardNo = "000000000000",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now.AddDays(-1),
            CreatedBy = 1
        });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var dto = new UpdatePropertyIndividualDto { AadharNo = "  987654321098  " };

        var result = await repository.UpdateIndividualDetailsAsync(100, dto, updatedBy: 7);

        Assert.Equal(TopSectionUpdateOutcome.Success, result);
        var assessment = await context.PropertyMastDetails.FirstOrDefaultAsync(a => a.PropertyId == 100);
        Assert.NotNull(assessment);
        Assert.Equal("987654321098", assessment!.AdharCardNo);
        Assert.Equal(7, assessment.UpdatedBy);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_OwnerTypeIdOnly_UpdatesAssessment()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(CreateProperty(100));
        context.PropertyMastDetails.Add(new PropertyAssessmentEntity
        {
            Id = 1,
            PropertyId = 100,
            OwnerTypeId = 1,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now.AddDays(-1),
            CreatedBy = 1
        });
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var dto = new UpdatePropertyIndividualDto { OwnerTypeId = 3 };

        var result = await repository.UpdateIndividualDetailsAsync(100, dto, updatedBy: 9);

        Assert.Equal(TopSectionUpdateOutcome.Success, result);
        var assessment = await context.PropertyMastDetails.FirstOrDefaultAsync(a => a.PropertyId == 100);
        Assert.NotNull(assessment);
        Assert.Equal(3, assessment!.OwnerTypeId);
        Assert.Equal(9, assessment.UpdatedBy);
    }

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_ApartmentUnitWithWing_ReturnsWingNameAndWingDetailId()
    {
        // Scenario 1: Apartment unit with wing
        using var context = CreateContext();
        context.PropertyCategoryMaster.Add(new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Apartment", IsActive = true });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, WingName = "6D", IsActive = true, MarkedForDeletion = false });
        
        var property = CreateProperty(1485140);
        property.CategoryId = 1;
        property.WingDetailId = 10;
        context.PropertyMast.Add(property);
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(1485140);

        Assert.NotNull(result);
        Assert.Equal(1, result.CategoryId);
        Assert.Equal(10, result.WingDetailId);
        Assert.Equal("6D", result.WingName);
    }

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_ApartmentSingleBuildingNoWing_ReturnsNullWing()
    {
        // Scenario 2: Apartment category, but single building where no wing
        using var context = CreateContext();
        context.PropertyCategoryMaster.Add(new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Apartment", IsActive = true });
        
        var property = CreateProperty(1428704);
        property.CategoryId = 1;
        property.WingDetailId = null;
        context.PropertyMast.Add(property);
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(1428704);

        Assert.NotNull(result);
        Assert.Equal(1, result.CategoryId);
        Assert.Null(result.WingDetailId);
        Assert.Null(result.WingName);
    }

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_IndividualProperty_ReturnsNullWing()
    {
        // Scenario 3: Individual property -> Wing must not be present
        using var context = CreateContext();
        context.PropertyCategoryMaster.Add(new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Individual", IsActive = true });
        
        var property = CreateProperty(1428575);
        property.CategoryId = 2;
        property.WingDetailId = null;
        context.PropertyMast.Add(property);
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(1428575);

        Assert.NotNull(result);
        Assert.Equal(2, result.CategoryId);
        Assert.Null(result.WingDetailId);
        Assert.Null(result.WingName);
    }

    [Fact]
    public async Task GetOwnerTitleAndPlotAreaAsync_IndividualPropertyWithCorruptedWingDetailId_ReturnsNullWing()
    {
        // Regression: Even if DB has a non-null WingDetailId on an Individual property, it must return null
        using var context = CreateContext();
        context.PropertyCategoryMaster.Add(new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Individual", IsActive = true });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, WingName = "Wing A", IsActive = true, MarkedForDeletion = false });

        var property = CreateProperty(1428575);
        property.CategoryId = 2;
        property.WingDetailId = 10; // Corrupt legacy data
        context.PropertyMast.Add(property);
        await context.SaveChangesAsync();

        var repository = new PropertyIndividualSupplementaryRepository(context);
        var result = await repository.GetOwnerTitleAndPlotAreaAsync(1428575);

        Assert.NotNull(result);
        Assert.Equal(2, result.CategoryId);
        Assert.Null(result.WingDetailId);
        Assert.Null(result.WingName);
    }
}
