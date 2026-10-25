using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure;

public class ApartmentTaxDetailsRepositoryTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_NoMatchingProperty_ReturnsNull()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "999", TaxType = ApartmentTaxType.RV });

        Assert.Null(result);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_RvTaxType_SumsPolicyTaxDetailsAcrossUnits()
    {
        using var context = CreateContext();
        context.PropertyMast.AddRange(
            new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true },
            new PropertyEntity { Id = 2, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.PolicyCodeMaster.Add(new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL" });
        context.PolicyTaxDetails.AddRange(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 100m, IsActive = true, MarkedForDeletion = false, IsCurrent = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 2, TaxId = 1, PolicyCodeId = 1, TaxAmount = 150m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.RV });

        Assert.NotNull(result);
        Assert.Equal(2, result!.PropertyCount);
        var rv = Assert.Single(result.CurrentTaxes);
        Assert.Equal("RV", rv.TaxType);
        var head = Assert.Single(rv.TaxHeads);
        Assert.Equal("General Tax", head.TaxName);
        Assert.Equal("NETTAX", head.PolicyCode);
        Assert.Equal(250m, head.TaxAmount);
        Assert.Empty(result.Arrears);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_RvTaxType_ExcludesInactiveAndDeletedRows()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.PolicyCodeMaster.Add(new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL" });
        context.PolicyTaxDetails.AddRange(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 100m, IsActive = true, MarkedForDeletion = false, IsCurrent = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 500m, IsActive = false, MarkedForDeletion = false, IsCurrent = true },
            new PolicyTaxDetailsEntity { Id = 3, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 900m, IsActive = true, MarkedForDeletion = true, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.RV });

        var head = Assert.Single(Assert.Single(result!.CurrentTaxes).TaxHeads);
        Assert.Equal("NETTAX", head.PolicyCode);
        Assert.Equal(100m, head.TaxAmount);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_RvTaxType_IncludesNonCurrentNetTaxAndCurrentDemandRows()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.PolicyCodeMaster.AddRange(
            new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL" },
            new PolicyCodeMasterEntity { Id = 2, PolicyCode = "GRS", PolicyName = "Gross Tax", PolicyType = "NORMAL" });
        context.PolicyTaxDetails.AddRange(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 100m, IsActive = true, MarkedForDeletion = false, IsCurrent = false },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 1, TaxId = 1, PolicyCodeId = 2, TaxAmount = 50m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.RV });

        Assert.NotNull(result);
        var rv = Assert.Single(result!.CurrentTaxes);
        Assert.Equal(2, rv.TaxHeads.Count);
        Assert.Contains(rv.TaxHeads, x => x.PolicyCode == "NETTAX" && x.TaxAmount == 100m);
        Assert.Contains(rv.TaxHeads, x => x.PolicyCode == "Demand" && x.TaxAmount == 50m);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_CvTaxType_IncludesNonCurrentNetTaxAndCurrentDemandRows()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.PolicyCodeMaster.AddRange(
            new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL" },
            new PolicyCodeMasterEntity { Id = 2, PolicyCode = "GRS", PolicyName = "Gross Tax", PolicyType = "NORMAL" });
        context.PolicyTaxDetailsCV.AddRange(
            new PolicyTaxDetailsCVEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 200m, IsActive = true, MarkedForDeletion = false, IsCurrent = false },
            new PolicyTaxDetailsCVEntity { Id = 2, PropertyId = 1, TaxId = 1, PolicyCodeId = 2, TaxAmount = 75m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.CV });

        Assert.NotNull(result);
        var cv = Assert.Single(result!.CurrentTaxes);
        Assert.Equal(2, cv.TaxHeads.Count);
        Assert.Contains(cv.TaxHeads, x => x.PolicyCode == "NETTAX" && x.TaxAmount == 200m);
        Assert.Contains(cv.TaxHeads, x => x.PolicyCode == "Demand" && x.TaxAmount == 75m);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_CvTaxType_ReadsPolicyTaxDetailsCvOnly()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.PolicyCodeMaster.Add(new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL" });
        context.PolicyTaxDetails.Add(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 100m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetailsCV.Add(
            new PolicyTaxDetailsCVEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 300m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.CV });

        var cv = Assert.Single(result!.CurrentTaxes);
        Assert.Equal("CV", cv.TaxType);
        var head = Assert.Single(cv.TaxHeads);
        Assert.Equal("NETTAX", head.PolicyCode);
        Assert.Equal(300m, head.TaxAmount);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_DualTaxType_ReturnsBothRvAndCv()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.PolicyCodeMaster.Add(new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL" });
        context.PolicyTaxDetails.Add(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 100m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetailsCV.Add(
            new PolicyTaxDetailsCVEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 300m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.Dual });

        Assert.Equal(2, result!.CurrentTaxes.Count);
        Assert.Equal(100m, result.CurrentTaxes.Single(c => c.TaxType == "RV").TaxHeads.Single().TaxAmount);
        Assert.Equal(300m, result.CurrentTaxes.Single(c => c.TaxType == "CV").TaxHeads.Single().TaxAmount);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_WingMasterIdFilter_NarrowsToSingleWingAndResolvesContext()
    {
        using var context = CreateContext();
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 100, SocietyName = "Test Society" });
        context.WingEntity.AddRange(
            new WingEntity { Id = 1, WingNo = "A" },
            new WingEntity { Id = 2, WingNo = "B" });
        context.WingDetailsMast.AddRange(
            new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 100, WingMasterId = 1, WingName = "A Wing" },
            new WingDetailsMastEntity { Id = 20, SocietyDetailsMastId = 100, WingMasterId = 2, WingName = "B Wing" });
        context.PropertyMast.AddRange(
            new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", WingDetailId = 10, IsActive = true },
            new PropertyEntity { Id = 2, WardId = 96, PropertyNo = "20", WingDetailId = 20, IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.PolicyCodeMaster.Add(new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL" });
        context.PolicyTaxDetails.AddRange(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 100m, IsActive = true, MarkedForDeletion = false, IsCurrent = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 2, TaxId = 1, PolicyCodeId = 1, TaxAmount = 200m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);

        var wingA = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", WingMasterId = 1, TaxType = ApartmentTaxType.RV });

        Assert.Equal(1, wingA!.PropertyCount);
        Assert.Equal(1, wingA.WingMasterId);
        Assert.Equal("A Wing", wingA.WingName);
        Assert.Equal("A", wingA.WingNo);
        Assert.Equal("Test Society", wingA.SocietyName);
        var wingHead = Assert.Single(wingA.CurrentTaxes.Single().TaxHeads);
        Assert.Equal("NETTAX", wingHead.PolicyCode);
        Assert.Equal(100m, wingHead.TaxAmount);

        var wholeComplex = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.RV });

        Assert.Equal(2, wholeComplex!.PropertyCount);
        Assert.Null(wholeComplex.WingMasterId);
        Assert.Null(wholeComplex.WingName);
        Assert.Null(wholeComplex.WingNo);
        Assert.Equal("Test Society", wholeComplex.SocietyName);
        var heads = wholeComplex.CurrentTaxes.Single().TaxHeads;
        Assert.Single(heads);
        Assert.Equal("NETTAX", heads[0].PolicyCode);
        Assert.Equal(300m, heads[0].TaxAmount);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_Arrears_ClosedYearActiveRowsAcrossAllPolicyCodes()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity { Id = 1, TaxCode = "GT", TaxName = "General Tax", TaxCategoryId = 1, CalculationModeId = 1 });
        context.YearMaster.AddRange(
            new YearMasterEntity { Id = 1, YearCode = "2026-27", IsActive = true },
            new YearMasterEntity { Id = 2, YearCode = "2025-26", IsActive = false });
        context.PolicyCodeMaster.AddRange(
            new PolicyCodeMasterEntity { Id = 1, PolicyCode = "RETRO", PolicyName = "Retro Demand", PolicyType = "NORMAL", IsRetroDemand = true },
            new PolicyCodeMasterEntity { Id = 2, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL", IsRetroDemand = false });
        context.TransMast.AddRange(
            new TransMastEntity { Id = 1, PropertyId = 1, TaxId = 1, FinanceYearId = 2, PolicyCodeId = 1, TaxAmount = 500m, CalculationType = "RV", IsActive = true, MarkedForDeletion = false },
            new TransMastEntity { Id = 2, PropertyId = 1, TaxId = 1, FinanceYearId = 1, PolicyCodeId = 1, TaxAmount = 999m, CalculationType = "RV", IsActive = true, MarkedForDeletion = false },
            new TransMastEntity { Id = 3, PropertyId = 1, TaxId = 1, FinanceYearId = 2, PolicyCodeId = 2, TaxAmount = 888m, CalculationType = "RV", IsActive = true, MarkedForDeletion = false },
            new TransMastEntity { Id = 4, PropertyId = 1, TaxId = 1, FinanceYearId = 2, PolicyCodeId = 1, TaxAmount = 777m, CalculationType = "RV", IsActive = false, MarkedForDeletion = false },
            new TransMastEntity { Id = 5, PropertyId = 1, TaxId = 1, FinanceYearId = 2, PolicyCodeId = 1, TaxAmount = 666m, CalculationType = "RV", IsActive = true, MarkedForDeletion = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.RV });

        // Closed year (FinanceYearId=2): RETRO (500) + NETTAX (888) both count now that arrears
        // isn't restricted to IsRetroDemand policy codes. The active-year row (999), the inactive
        // row (777), and the marked-for-deletion row (666) are still excluded.
        var arrears = Assert.Single(result!.Arrears);
        Assert.Equal("General Tax", arrears.TaxName);
        Assert.Equal("2025-26", arrears.PolicyCode);
        Assert.Equal(2, arrears.FinanceYearId);
        Assert.Equal(1388m, arrears.TaxAmount);
    }

    [Fact]
    public async Task GetTaxDetailsAsync_WithTaxNameAlias_MapsTaxNameAliasToTaxNameField()
    {
        using var context = CreateContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 1, WardId = 96, PropertyNo = "20", IsActive = true });
        context.TaxMaster.Add(new TaxMasterEntity
        {
            Id = 1,
            TaxCode = "GT",
            TaxName = "General Tax",
            TaxNameAlias = "General Tax Alias",
            TaxCategoryId = 1,
            CalculationModeId = 1,
            IsActive = true
        });
        context.PolicyCodeMaster.Add(new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", PolicyType = "NORMAL", IsActive = true });
        context.PolicyTaxDetails.Add(
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 1, PolicyCodeId = 1, TaxAmount = 100m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        await context.SaveChangesAsync();

        var repository = new ApartmentTaxDetailsRepository(context);
        var result = await repository.GetTaxDetailsAsync(
            new ApartmentTaxDetailsQueryParameters { WardId = 96, PropertyNo = "20", TaxType = ApartmentTaxType.RV });

        Assert.NotNull(result);
        var rv = Assert.Single(result!.CurrentTaxes);
        var head = Assert.Single(rv.TaxHeads);
        // The key remains TaxName, but the value is mapped from TaxNameAlias
        Assert.Equal("General Tax Alias", head.TaxName);
        Assert.Equal(100m, head.TaxAmount);
    }
}

