using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories.Property;

namespace NtisPlatform.Tests.Infrastructure.Repositories;

public class PropertySocialDetailsRepositoryTests
{
    [Fact]
    public async Task GetSocialDetailsByFiltersAsync_WhenNoRecordsAppliedToSociety_ReturnsEmptyList()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        const int societyDetailId = 1510588;
        const int wingDetailId = 1517645;
        const int socialAttributeId = 17;

        context.Set<SocialAttributeEntity>().Add(new SocialAttributeEntity
        {
            Id = socialAttributeId,
            SocialAttributeCode = "HAS_TEST_ATTRIBUTE",
            SocialAttributeName = "Has test attribute",
            DataType = "bool",
            IsActive = true
        });

        // Flats/properties have records, but Society itself has NO records
        context.Set<PropertySocialDetailsEntity>().AddRange(
            new PropertySocialDetailsEntity
            {
                Id = 1,
                PropertyId = 101,
                SocialAttributeId = socialAttributeId,
                WingDetailId = wingDetailId,
                SocietyDetailId = societyDetailId,
                EntityType = "P",
                BitValue = true,
                IsActive = true
            });

        await context.SaveChangesAsync();

        var repository = new PropertySocialDetailsRepository(context);

        // Act: Query for society level (only societyDetailId provided)
        var result = await repository.GetSocialDetailsByFiltersAsync(
            null,
            societyDetailId,
            null,
            null);

        // Assert: Society has no records applied to it -> returns empty
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetSocialDetailsByFiltersAsync_WhenRecordsAppliedToSociety_ReturnsOnlySocietyRecords()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        const int societyDetailId = 1510588;
        const int socialAttributeId = 17;

        context.Set<SocialAttributeEntity>().Add(new SocialAttributeEntity
        {
            Id = socialAttributeId,
            SocialAttributeCode = "HAS_TEST_ATTRIBUTE",
            SocialAttributeName = "Has test attribute",
            DataType = "bool",
            IsActive = true
        });

        context.Set<PropertySocialDetailsEntity>().AddRange(
            // Society-level record
            new PropertySocialDetailsEntity
            {
                Id = 1,
                SocietyDetailId = societyDetailId,
                SocialAttributeId = socialAttributeId,
                WingDetailId = null,
                PropertyId = null,
                EntityType = "S",
                BitValue = true,
                IsActive = true
            },
            // Property-level record under same society
            new PropertySocialDetailsEntity
            {
                Id = 2,
                SocietyDetailId = societyDetailId,
                SocialAttributeId = socialAttributeId,
                WingDetailId = 555,
                PropertyId = 999,
                EntityType = "P",
                BitValue = false,
                IsActive = true
            });

        await context.SaveChangesAsync();

        var repository = new PropertySocialDetailsRepository(context);

        var result = await repository.GetSocialDetailsByFiltersAsync(
            null,
            societyDetailId,
            null,
            null);

        Assert.Single(result);
        Assert.Equal(1, result[0].Id);
        Assert.Equal(societyDetailId, result[0].SocietyDetailId);
        Assert.Null(result[0].PropertyId);
    }

    [Fact]
    public async Task GetSocialDetailsByFiltersAsync_WhenRecordsAppliedToWing_ReturnsOnlyWingRecords()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        const int societyDetailId = 1510588;
        const int wingDetailId = 1517645;
        const int socialAttributeId = 17;

        context.Set<SocialAttributeEntity>().Add(new SocialAttributeEntity
        {
            Id = socialAttributeId,
            SocialAttributeCode = "HAS_TEST_ATTRIBUTE",
            SocialAttributeName = "Has test attribute",
            DataType = "bool",
            IsActive = true
        });

        context.Set<PropertySocialDetailsEntity>().AddRange(
            // Wing record with matching society
            new PropertySocialDetailsEntity
            {
                Id = 10,
                SocietyDetailId = societyDetailId,
                WingDetailId = wingDetailId,
                SocialAttributeId = socialAttributeId,
                PropertyId = 1675460,
                EntityType = "",
                BitValue = true,
                IsActive = true
            },
            // Another wing record with matching society
            new PropertySocialDetailsEntity
            {
                Id = 20,
                SocietyDetailId = societyDetailId,
                WingDetailId = wingDetailId,
                SocialAttributeId = socialAttributeId,
                PropertyId = 1675860,
                EntityType = "",
                BitValue = true,
                IsActive = true
            },
            // Wing record with DIFFERENT society
            new PropertySocialDetailsEntity
            {
                Id = 30,
                SocietyDetailId = 9999999,
                WingDetailId = wingDetailId,
                SocialAttributeId = socialAttributeId,
                PropertyId = 0,
                EntityType = "",
                BitValue = true,
                IsActive = true
            });

        await context.SaveChangesAsync();

        var repository = new PropertySocialDetailsRepository(context);

        // Act 1: Query with both societyDetailId and wingDetailId
        var resultWithBoth = await repository.GetSocialDetailsByFiltersAsync(
            null,
            societyDetailId,
            wingDetailId,
            null);

        // Should return only records matching this society and wing (Ids 10, 20)
        Assert.Equal(2, resultWithBoth.Count);
        Assert.All(resultWithBoth, r => Assert.Equal(societyDetailId, r.SocietyDetailId));

        // Act 2: Query with ONLY wingDetailId
        var resultWingOnly = await repository.GetSocialDetailsByFiltersAsync(
            null,
            null,
            wingDetailId,
            null);

        // Should return all records for this wing (Ids 10, 20, 30)
        Assert.Equal(3, resultWingOnly.Count);
    }

    [Fact]
    public async Task GetSocialDetailsByFiltersAsync_WhenSocietyRecordStoredUnderSocietyMasterPropertyId_ReturnsSocietyRecord()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        const int societyDetailId = 1506556;
        const int societyPropertyId = 2171832;
        const int socialAttributeId = 21;

        context.Set<SocietyDetailsEntity>().Add(new SocietyDetailsEntity
        {
            Id = societyDetailId,
            PropertyId = societyPropertyId,
            SocietyName = "Test Society"
        });

        context.Set<SocialAttributeEntity>().Add(new SocialAttributeEntity
        {
            Id = socialAttributeId,
            SocialAttributeCode = "FIRE_SAFETY",
            SocialAttributeName = "Fire Safety",
            DataType = "bool",
            IsActive = true
        });

        // Legacy society record has SocietyDetailId = null, WingDetailId = 0, PropertyId = societyPropertyId
        context.Set<PropertySocialDetailsEntity>().Add(new PropertySocialDetailsEntity
        {
            Id = 200,
            SocietyDetailId = null,
            WingDetailId = 0,
            SocialAttributeId = socialAttributeId,
            PropertyId = societyPropertyId,
            EntityType = "S",
            BitValue = true,
            IsActive = true
        });

        await context.SaveChangesAsync();

        var repository = new PropertySocialDetailsRepository(context);

        // When UI passes only societyDetailId
        var result = await repository.GetSocialDetailsByFiltersAsync(
            null,
            societyDetailId,
            null,
            null);

        Assert.Single(result);
        Assert.Equal(200, result[0].Id);
        Assert.Equal(societyPropertyId, result[0].PropertyId);
    }

    [Fact]
    public async Task GetSocialDetailsByFiltersAsync_WhenOnlySocietyHasRecords_AndWingDetailIdProvided_ReturnsSocietyRecords()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        const int societyDetailId = 1507857;
        const int wingDetailId = 1530992;
        const int socialAttributeId = 12;

        context.Set<SocialAttributeEntity>().Add(new SocialAttributeEntity
        {
            Id = socialAttributeId,
            SocialAttributeCode = "SOLAR_WATER",
            SocialAttributeName = "Solar Water Heating",
            DataType = "bool",
            IsActive = true
        });

        // Wing belongs to Society
        context.Set<WingDetailsMastEntity>().Add(new WingDetailsMastEntity
        {
            Id = wingDetailId,
            SocietyDetailsMastId = societyDetailId,
            WingName = "A Wing"
        });

        // Applied at Society/Apartment level (WingDetailId = 0, PropertyId = 0)
        context.Set<PropertySocialDetailsEntity>().AddRange(
            new PropertySocialDetailsEntity
            {
                Id = 2747542,
                SocietyDetailId = societyDetailId,
                WingDetailId = 0,
                PropertyId = 0,
                SocialAttributeId = socialAttributeId,
                BitValue = true,
                IsActive = true
            },
            new PropertySocialDetailsEntity
            {
                Id = 2747543,
                SocietyDetailId = societyDetailId,
                WingDetailId = 0,
                PropertyId = 0,
                SocialAttributeId = socialAttributeId,
                BitValue = true,
                IsActive = true
            }
        );

        await context.SaveChangesAsync();

        var repository = new PropertySocialDetailsRepository(context);

        // Case 1: Query with both societyDetailId and wingDetailId
        var resultWithBoth = await repository.GetSocialDetailsByFiltersAsync(
            null,
            societyDetailId,
            wingDetailId,
            null);

        Assert.Equal(2, resultWithBoth.Count);
        Assert.Contains(resultWithBoth, r => r.Id == 2747542);
        Assert.Contains(resultWithBoth, r => r.Id == 2747543);

        // Case 2: Query with ONLY wingDetailId (resolves parent society 1507857)
        var resultWingOnly = await repository.GetSocialDetailsByFiltersAsync(
            null,
            null,
            wingDetailId,
            null);

        Assert.Equal(2, resultWingOnly.Count);
        Assert.Contains(resultWingOnly, r => r.Id == 2747542);
        Assert.Contains(resultWingOnly, r => r.Id == 2747543);
    }

    [Fact]
    public async Task GetSocialDetailsByFiltersAsync_WhenWingAndSocietyHaveRecords_ReturnsOnlyWingRecords()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        const int societyDetailId = 1507857;
        const int wingDetailId = 1530992;
        const int socialAttributeId = 12;

        context.Set<SocialAttributeEntity>().Add(new SocialAttributeEntity
        {
            Id = socialAttributeId,
            SocialAttributeCode = "SOLAR_WATER",
            SocialAttributeName = "Solar Water Heating",
            DataType = "bool",
            IsActive = true
        });

        context.Set<PropertySocialDetailsEntity>().AddRange(
            new PropertySocialDetailsEntity
            {
                Id = 1,
                SocietyDetailId = societyDetailId,
                WingDetailId = 0,
                PropertyId = 0,
                SocialAttributeId = socialAttributeId,
                EntityType = "S",
                BitValue = false,
                IsActive = true
            },
            new PropertySocialDetailsEntity
            {
                Id = 2,
                SocietyDetailId = societyDetailId,
                WingDetailId = wingDetailId,
                PropertyId = 0,
                SocialAttributeId = socialAttributeId,
                EntityType = "W",
                BitValue = true,
                IsActive = true
            });

        await context.SaveChangesAsync();

        var repository = new PropertySocialDetailsRepository(context);

        var result = await repository.GetSocialDetailsByFiltersAsync(
            null,
            societyDetailId,
            wingDetailId,
            null);

        var record = Assert.Single(result);
        Assert.Equal(2, record.Id);
        Assert.Equal(wingDetailId, record.WingDetailId);
    }
}

