using Microsoft.EntityFrameworkCore;
using Moq;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// The write paths that persist a BHKId (Apartment QC basic-details patch and bulk property creation)
/// must reject an unknown or inactive BHKMaster row before anything is written.
/// </summary>
public class BHKIdWritePathTests
{
    private static ApplicationDbContext CreateContext() => new(
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static async Task SeedPropertyWithAssessmentAsync(ApplicationDbContext context)
    {
        context.PropertyMast.Add(new PropertyEntity { Id = 1, OwnerName = "Old Owner", IsActive = true, MarkedForDeletion = false });
        context.PropertyMastDetails.Add(new PropertyAssessmentEntity
        {
            Id = 10, PropertyId = 1, IsActive = true, MarkedForDeletion = false, CreatedDate = DateTime.Now
        });
        context.BHKMasters.AddRange(
            new BHKMasterEntity { Id = 1, BHKCode = "1BHK", BHKName = "1 BHK", IsActive = true },
            new BHKMasterEntity { Id = 2, BHKCode = "OLD", BHKName = "Retired", IsActive = false });
        await context.SaveChangesAsync();
    }

    #region Apartment QC - PrepareBasicDetailsPatchAsync

    [Fact]
    public async Task PrepareBasicDetailsPatch_ActiveBHKId_SetsBHKIdOnLatestAssessment()
    {
        using var context = CreateContext();
        await SeedPropertyWithAssessmentAsync(context);
        var repository = new ApartmentQCRepository(context);

        var outcome = await repository.PrepareBasicDetailsPatchAsync(
            1, new UpdateApartmentQCBasicDetailsDto { BHKId = 1 }, updatedBy: 5);

        Assert.Equal(BasicDetailsPatchOutcome.Success, outcome);
        Assert.Equal(1, context.PropertyMastDetails.Local.Single(a => a.Id == 10).BHKId);
    }

    [Theory]
    [InlineData(999)] // does not exist
    [InlineData(2)]   // exists but inactive
    public async Task PrepareBasicDetailsPatch_UnknownOrInactiveBHKId_ReturnsBHKNotFoundWithoutChangingAnything(int bhkId)
    {
        using var context = CreateContext();
        await SeedPropertyWithAssessmentAsync(context);
        var repository = new ApartmentQCRepository(context);

        var outcome = await repository.PrepareBasicDetailsPatchAsync(
            1, new UpdateApartmentQCBasicDetailsDto { OwnerName = "New Owner", BHKId = bhkId }, updatedBy: 5);

        Assert.Equal(BasicDetailsPatchOutcome.BHKNotFound, outcome);
        // Rejected before any field is applied, including the unrelated OwnerName in the same request.
        Assert.Equal("Old Owner", context.PropertyMast.Local.Single(p => p.Id == 1).OwnerName);
        Assert.Null(context.PropertyMastDetails.Local.Single(a => a.Id == 10).BHKId);
    }

    #endregion

    #region Bulk property creation

    private static CreateBulkPropertyDto BulkDto(int? bhkId) => new()
    {
        TaxZoneId = 1,
        WardId = 1,
        PropertyNo = "P-100",
        PartitionNo = "A",
        PropertyTypeId = 1,
        CategoryId = 1,
        BHKId = bhkId
    };

    private static async Task SeedBulkMastersAsync(ApplicationDbContext context)
    {
        context.WardMaster.Add(new WardEntity { Id = 1, WardNo = "W1", ZoneId = 1, IsActive = true });
        context.TaxZoneMaster.Add(new TaxZoneEntity { Id = 1, TaxZoneNo = "TZ1", Remark = "Remark", IsActive = true });
        context.PropertyCategoryMaster.Add(new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Residential", IsActive = true });
        context.PropertyTypeMasters.Add(new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Residential", IsActive = true });
        context.BHKMasters.AddRange(
            new BHKMasterEntity { Id = 1, BHKCode = "1BHK", BHKName = "1 BHK", IsActive = true },
            new BHKMasterEntity { Id = 2, BHKCode = "OLD", BHKName = "Retired", IsActive = false });
        await context.SaveChangesAsync();
    }

    [Theory]
    [InlineData(999)] // does not exist
    [InlineData(2)]   // exists but inactive
    public async Task CreateBulkProperty_UnknownOrInactiveBHKId_IsRejectedBeforeAnythingIsInserted(int bhkId)
    {
        using var context = CreateContext();
        await SeedBulkMastersAsync(context);
        var repository = new PropertyRepository(context, Mock.Of<IFinanceYearProvider>());

        var response = await repository.CreateBulkPropertyAsync(BulkDto(bhkId));

        Assert.NotNull(response);
        Assert.False(response!.Success);
        Assert.Contains("BHK with Id " + bhkId, response.Message);
        Assert.Empty(context.PropertyMast);
        Assert.Empty(context.PropertyMastDetails);
    }

    [Fact]
    public async Task CreateBulkProperty_ActiveBHKId_IsStoredOnTheAssessmentRow()
    {
        using var context = CreateContext();
        await SeedBulkMastersAsync(context);
        var repository = new PropertyRepository(context, Mock.Of<IFinanceYearProvider>());

        var response = await repository.CreateBulkPropertyAsync(BulkDto(1));

        Assert.NotNull(response);
        Assert.True(response!.Success);
        Assert.Equal(1, context.PropertyMastDetails.Single().BHKId);
    }

    [Fact]
    public async Task CreateBulkProperty_UnknownTaxZoneId_IsRejected()
    {
        using var context = CreateContext();
        await SeedBulkMastersAsync(context);
        var repository = new PropertyRepository(context, Mock.Of<IFinanceYearProvider>());

        var dto = BulkDto(1);
        dto.TaxZoneId = 999;

        var response = await repository.CreateBulkPropertyAsync(dto);

        Assert.NotNull(response);
        Assert.False(response!.Success);
        Assert.Contains("TaxZone with Id 999", response.Message);
        Assert.Empty(context.PropertyMast);
    }

    [Fact]
    public async Task CreateBulkProperty_UnknownWardId_IsRejected()
    {
        using var context = CreateContext();
        await SeedBulkMastersAsync(context);
        var repository = new PropertyRepository(context, Mock.Of<IFinanceYearProvider>());

        var dto = BulkDto(1);
        dto.WardId = 999;

        var response = await repository.CreateBulkPropertyAsync(dto);

        Assert.NotNull(response);
        Assert.False(response!.Success);
        Assert.Contains("Ward with Id 999", response.Message);
        Assert.Empty(context.PropertyMast);
    }

    [Fact]
    public async Task CreateBulkProperty_UnknownCategoryId_IsRejected()
    {
        using var context = CreateContext();
        await SeedBulkMastersAsync(context);
        var repository = new PropertyRepository(context, Mock.Of<IFinanceYearProvider>());

        var dto = BulkDto(1);
        dto.CategoryId = 999;

        var response = await repository.CreateBulkPropertyAsync(dto);

        Assert.NotNull(response);
        Assert.False(response!.Success);
        Assert.Contains("Category with Id 999", response.Message);
        Assert.Empty(context.PropertyMast);
    }

    [Fact]
    public async Task CreateBulkProperty_UnknownPropertyTypeId_IsRejected()
    {
        using var context = CreateContext();
        await SeedBulkMastersAsync(context);
        var repository = new PropertyRepository(context, Mock.Of<IFinanceYearProvider>());

        var dto = BulkDto(1);
        dto.PropertyTypeId = 999;

        var response = await repository.CreateBulkPropertyAsync(dto);

        Assert.NotNull(response);
        Assert.False(response!.Success);
        Assert.Contains("PropertyType with Id 999", response.Message);
        Assert.Empty(context.PropertyMast);
    }

    #endregion
}
