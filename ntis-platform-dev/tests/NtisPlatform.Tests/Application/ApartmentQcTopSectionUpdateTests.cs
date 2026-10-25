using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class ApartmentQcTopSectionUpdateTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_Success_WhenPropertyExistsAndUnlocked()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var property = new PropertyEntity
        {
            Id = 1,
            OwnerName = "Old Owner",
            OwnerNameEnglish = "Old Owner Eng",
            MobileNo = "9876543210",
            IsActive = true,
            MarkedForDeletion = false
        };
        var assessment = new PropertyAssessmentEntity
        {
            Id = 10,
            PropertyId = 1,
            AdharCardNo = "111122223333",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now
        };
        var society = new SocietyDetailsEntity
        {
            Id = 20,
            PropertyId = 1,
            SocietyName = "Old Society",
            SecretaryName = "Old Secretary",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now
        };

        context.PropertyMast.Add(property);
        context.PropertyMastDetails.Add(assessment);
        context.SocietyDetailsMast.Add(society);
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var updateDto = new UpdateApartmentQcTopSectionDto
        {
            OwnerName = "New Owner Regional",
            OwnerNameEnglish = "New Owner English",
            MobileNo = "9999999999",
            AadharNo = "999988887777",
            SocietyName = "New Green Park",
            SecretaryName = "John Doe"
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(1, updateDto, updatedBy: 42);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);

        var updatedProp = await context.PropertyMast.FindAsync(1);
        Assert.NotNull(updatedProp);
        Assert.Equal("New Owner Regional", updatedProp.OwnerName);
        Assert.Equal("New Owner English", updatedProp.OwnerNameEnglish);
        Assert.Equal("9999999999", updatedProp.MobileNo);
        Assert.Equal(42, updatedProp.UpdatedBy);

        var updatedAssessment = await context.PropertyMastDetails.FindAsync(10);
        Assert.NotNull(updatedAssessment);
        Assert.Equal("999988887777", updatedAssessment.AdharCardNo);
        Assert.Equal(42, updatedAssessment.UpdatedBy);

        var updatedSociety = await context.SocietyDetailsMast.FindAsync(20);
        Assert.NotNull(updatedSociety);
        Assert.Equal("New Green Park", updatedSociety.SocietyName);
        Assert.Equal("John Doe", updatedSociety.SecretaryName);
        Assert.Equal(42, updatedSociety.UpdatedBy);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_ReturnsNotFound_WhenPropertyDoesNotExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var repo = new ApartmentQcTopSectionRepository(context);
        var updateDto = new UpdateApartmentQcTopSectionDto
        {
            OwnerName = "Test"
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(999, updateDto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.PropertyNotFound, outcome);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_ReturnsPropertyLocked_WhenScreenLockExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var property = new PropertyEntity
        {
            Id = 5,
            OwnerName = "Locked Property",
            IsActive = true,
            MarkedForDeletion = false
        };
        var lockEntity = new PropertyScreenLockEntity
        {
            Id = 1,
            PropertyId = 5,
            IsLocked = true,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now
        };

        context.PropertyMast.Add(property);
        context.PropertyScreenLocks.Add(lockEntity);
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var updateDto = new UpdateApartmentQcTopSectionDto
        {
            MobileNo = "8888888888"
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(5, updateDto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.PropertyLocked, outcome);
    }

    [Fact]
    public async Task Service_UpdateTopSection_ReturnsNoFieldsProvided_WhenDtoIsEmpty()
    {
        // Arrange
        var repoMock = new Mock<IApartmentQcTopSectionRepository>();
        var calc = new ApartmentQcTopSectionPerformanceCalculator();
        var service = new ApartmentQcTopSectionService(repoMock.Object, calc);

        // Act
        var outcome = await service.UpdateTopSectionAsync(1, new UpdateApartmentQcTopSectionDto(), updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.NoFieldsProvided, outcome);
        repoMock.Verify(r => r.UpdateTopSectionAsync(It.IsAny<int>(), It.IsAny<UpdateApartmentQcTopSectionDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static ApartmentQCController CreateController(Mock<IApartmentQcTopSectionService> topSectionService)
    {
        return new ApartmentQCController(
            new Mock<IApartmentQCService>().Object,
            new Mock<IWingWiseDetailsService>().Object,
            new Mock<ICapitalValueService>().Object,
            new Mock<IApartmentQcCertificateGridService>().Object,
            new Mock<IApartmentQcSearchService>().Object,
            topSectionService.Object,
            new Mock<IApartmentQcTopSectionBelowFlexService>().Object,
            new Mock<IApartmentTaxDetailsService>().Object,
            new Mock<IPropertyCertificateApplicationService>().Object,
            new Mock<NtisPlatform.Application.Interfaces.Master.ISocialAttributeService>().Object,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ApartmentQCController>.Instance,
            new Mock<IGetApartmentDetailsWingWiseService>().Object,
            new Mock<IApartmentDashboardService>().Object,
            new Mock<IDeleteFlatService>().Object);
    }

    [Fact]
    public async Task Controller_Update_ReturnsOk_WhenServiceSucceeds()
    {
        // Arrange
        var serviceMock = new Mock<IApartmentQcTopSectionService>();
        serviceMock.Setup(s => s.UpdateTopSectionAsync(1, It.IsAny<UpdateApartmentQcTopSectionDto>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.Success);

        var controller = CreateController(serviceMock);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10")
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        var dto = new UpdateApartmentQcTopSectionDto { OwnerName = "New Owner" };

        // Act
        var result = await controller.Update(1, dto, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(apiResponse.Success);
    }

    [Fact]
    public async Task Controller_Update_ReturnsLocked_WhenPropertyIsLocked()
    {
        // Arrange
        var serviceMock = new Mock<IApartmentQcTopSectionService>();
        serviceMock.Setup(s => s.UpdateTopSectionAsync(1, It.IsAny<UpdateApartmentQcTopSectionDto>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.PropertyLocked);

        var controller = CreateController(serviceMock);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10")
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        var dto = new UpdateApartmentQcTopSectionDto { OwnerName = "New Owner" };

        // Act
        var result = await controller.Update(1, dto, default);

        // Assert
        var objResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status423Locked, objResult.StatusCode);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_NoTargetWings_LeavesWingsUntouched()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, SecretaryName = "Old Sec", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 31, SocietyDetailsMastId = 34, WingName = "A Wing", SecretaryName = "Wing A Sec", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 131, SocietyDetailsMastId = 34, WingName = "B Wing", SecretaryName = "Wing B Sec", IsActive = true, MarkedForDeletion = false });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcTopSectionDto
        {
            SecretaryName = "New Society Sec",
            SecretaryTargetWingDetailIds = null,
            ManagerTargetWingDetailIds = null // No wings targeted
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(10, dto, updatedBy: 99);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);
        var society = await context.SocietyDetailsMast.FindAsync(34);
        Assert.Equal("New Society Sec", society!.SecretaryName);

        var wingA = await context.WingDetailsMast.FindAsync(31);
        Assert.Equal("Wing A Sec", wingA!.SecretaryName); // untouched

        var wingB = await context.WingDetailsMast.FindAsync(131);
        Assert.Equal("Wing B Sec", wingB!.SecretaryName); // untouched
    }

    [Fact]
    public async Task Repository_UpdateTopSection_AllTargetWings_UpdatesAllWings()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, SecretaryName = "Old Sec", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 31, SocietyDetailsMastId = 34, WingName = "A Wing", SecretaryName = "Wing A Sec", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 131, SocietyDetailsMastId = 34, WingName = "B Wing", SecretaryName = "Wing B Sec", IsActive = true, MarkedForDeletion = false });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcTopSectionDto
        {
            SecretaryName = "Central Secretary",
            SecretaryTargetWingDetailIds = new List<int> { 31, 131 }
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(10, dto, updatedBy: 99);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);
        var society = await context.SocietyDetailsMast.FindAsync(34);
        Assert.Equal("Central Secretary", society!.SecretaryName);

        var wingA = await context.WingDetailsMast.FindAsync(31);
        Assert.Equal("Central Secretary", wingA!.SecretaryName); // updated!
        Assert.Equal(99, wingA.UpdatedBy);

        var wingB = await context.WingDetailsMast.FindAsync(131);
        Assert.Equal("Central Secretary", wingB!.SecretaryName); // updated!
        Assert.Equal(99, wingB.UpdatedBy);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_SpecificTargetWings_UpdatesOnlySpecifiedWings()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, SecretaryName = "Old Sec", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 31, SocietyDetailsMastId = 34, WingName = "A Wing", SecretaryName = "Wing A Sec", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 131, SocietyDetailsMastId = 34, WingName = "B Wing", SecretaryName = "Wing B Sec", IsActive = true, MarkedForDeletion = false });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcTopSectionDto
        {
            SecretaryName = "Selective Secretary",
            SecretaryTargetWingDetailIds = new List<int> { 31 }
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(10, dto, updatedBy: 99);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);
        var society = await context.SocietyDetailsMast.FindAsync(34);
        Assert.Equal("Selective Secretary", society!.SecretaryName);

        var wingA = await context.WingDetailsMast.FindAsync(31);
        Assert.Equal("Selective Secretary", wingA!.SecretaryName); // updated!

        var wingB = await context.WingDetailsMast.FindAsync(131);
        Assert.Equal("Wing B Sec", wingB!.SecretaryName); // NOT updated!
    }

    [Fact]
    public async Task Repository_GetSocietyWings_ReturnsWingsListCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, SecretaryName = "Sec", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity
        {
            Id = 31,
            SocietyDetailsMastId = 34,
            WingName = "A Wing",
            SecretaryName = "Wing A Sec",
            SecretaryMobileNo = "9820011221",
            ManagerName = "Wing A Mgr",
            IsActive = true,
            MarkedForDeletion = false
        });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act
        var wings = await repo.GetSocietyWingsAsync(10);

        // Assert
        Assert.NotNull(wings);
        Assert.Single(wings);
        Assert.Equal(31, wings[0].WingDetailId);
        Assert.Equal("A Wing", wings[0].WingName);
        Assert.Equal("Wing A Sec", wings[0].SecretaryName);
        Assert.Equal("9820011221", wings[0].SecretaryMobileNo);
        Assert.Equal("Wing A Mgr", wings[0].ManagerName);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_MultiFieldAdministrativeUpdates_ReplicateCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 31, SocietyDetailsMastId = 34, WingName = "A Wing", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 131, SocietyDetailsMastId = 34, WingName = "B Wing", IsActive = true, MarkedForDeletion = false });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcTopSectionDto
        {
            SecretaryName = "New Sec",
            SecretaryMobileNo = "9876543210",
            ManagerName = "New Mgr",
            ManagerMobileNo = "9123456780",
            SecretaryTargetWingDetailIds = new List<int> { 31 },
            ManagerTargetWingDetailIds = new List<int> { 31 }
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(10, dto, updatedBy: 7);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);

        var society = await context.SocietyDetailsMast.FindAsync(34);
        Assert.Equal("New Sec", society!.SecretaryName);
        Assert.Equal("9876543210", society.SecretaryMobileNo);
        Assert.Equal("New Mgr", society.ManagerName);
        Assert.Equal("9123456780", society.ManagerMobileNo);

        var wingA = await context.WingDetailsMast.FindAsync(31);
        Assert.Equal("New Sec", wingA!.SecretaryName);
        Assert.Equal("9876543210", wingA.SecretaryMobileNo);
        Assert.Equal("New Mgr", wingA.ManagerName);
        Assert.Equal("9123456780", wingA.ManagerMobileNo);

        var wingB = await context.WingDetailsMast.FindAsync(131);
        Assert.Null(wingB!.SecretaryName); // untouched
        Assert.Null(wingB.ManagerName);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_IndependentSecretaryAndManagerWings_UpdatesCorrespondingWingsCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, IsActive = true, MarkedForDeletion = false });

        // Wing 31: Both
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 31, SocietyDetailsMastId = 34, WingName = "A Wing", IsActive = true, MarkedForDeletion = false });
        // Wing 131: Secretary only
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 131, SocietyDetailsMastId = 34, WingName = "B Wing", IsActive = true, MarkedForDeletion = false });
        // Wing 231: Manager only
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 231, SocietyDetailsMastId = 34, WingName = "C Wing", IsActive = true, MarkedForDeletion = false });
        // Wing 331: Neither
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 331, SocietyDetailsMastId = 34, WingName = "D Wing", IsActive = true, MarkedForDeletion = false });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcTopSectionDto
        {
            SecretaryName = "Shared Secretary",
            SecretaryMobileNo = "9820011221",
            SecretaryTargetWingDetailIds = new List<int> { 31, 131 },

            ManagerName = "Shared Manager",
            ManagerMobileNo = "9820011222",
            ManagerTargetWingDetailIds = new List<int> { 31, 231 }
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(10, dto, updatedBy: 42);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);

        // Society has both
        var society = await context.SocietyDetailsMast.FindAsync(34);
        Assert.Equal("Shared Secretary", society!.SecretaryName);
        Assert.Equal("Shared Manager", society.ManagerName);

        // Wing 31 has both
        var wingA = await context.WingDetailsMast.FindAsync(31);
        Assert.Equal("Shared Secretary", wingA!.SecretaryName);
        Assert.Equal("Shared Manager", wingA.ManagerName);
        Assert.Equal(42, wingA.UpdatedBy);

        // Wing 131 has Secretary only
        var wingB = await context.WingDetailsMast.FindAsync(131);
        Assert.Equal("Shared Secretary", wingB!.SecretaryName);
        Assert.Null(wingB.ManagerName);
        Assert.Equal(42, wingB.UpdatedBy);

        // Wing 231 has Manager only
        var wingC = await context.WingDetailsMast.FindAsync(231);
        Assert.Null(wingC!.SecretaryName);
        Assert.Equal("Shared Manager", wingC.ManagerName);
        Assert.Equal(42, wingC.UpdatedBy);

        // Wing 331 has neither
        var wingD = await context.WingDetailsMast.FindAsync(331);
        Assert.Null(wingD!.SecretaryName);
        Assert.Null(wingD.ManagerName);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_SocietyDetails_UpdatesAllSocietyFieldsCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity
        {
            Id = 34,
            PropertyId = 10,
            SocietyName = "Old Society",
            SocietyNameEnglish = "Old Society English",
            SocietyAddress = "Old Address",
            SocietyAddressEnglish = "Old Address English",
            SocietyEmailId = "old@society.com",
            LandOwnerName = "Old LandOwner",
            LandOwnerNameEnglish = "Old LandOwner English",
            BuilderName = "Old Builder",
            BuilderNameEnglish = "Old Builder English",
            BuilderMobileNo = "9000000001",
            IsActive = true,
            MarkedForDeletion = false
        });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcTopSectionDto
        {
            SocietyName = "New Society",
            SocietyNameEnglish = "New Society English",
            SocietyAddress = "New Address",
            SocietyAddressEnglish = "New Address English",
            SocietyEmailId = "new@society.com",
            LandOwnerName = "New LandOwner",
            LandOwnerNameEnglish = "New LandOwner English",
            BuilderName = "New Builder",
            BuilderNameEnglish = "New Builder English",
            BuilderMobileNo = "9876543210"
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(10, dto, updatedBy: 77);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);
        var society = await context.SocietyDetailsMast.FindAsync(34);
        Assert.NotNull(society);
        Assert.Equal("New Society", society.SocietyName);
        Assert.Equal("New Society English", society.SocietyNameEnglish);
        Assert.Equal("New Address", society.SocietyAddress);
        Assert.Equal("New Address English", society.SocietyAddressEnglish);
        Assert.Equal("new@society.com", society.SocietyEmailId);
        Assert.Equal("New LandOwner", society.LandOwnerName);
        Assert.Equal("New LandOwner English", society.LandOwnerNameEnglish);
        Assert.Equal("New Builder", society.BuilderName);
        Assert.Equal("New Builder English", society.BuilderNameEnglish);
        Assert.Equal("9876543210", society.BuilderMobileNo);
        Assert.Equal(77, society.UpdatedBy);
    }

    [Fact]
    public async Task Repository_UpdateWingDetails_Success_WhenWingExistsAndUnlocked()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity
        {
            Id = 100,
            SocietyDetailsMastId = 34,
            WingMasterId = 1,
            WingName = "A",
            SecretaryName = "Old Sec",
            SecretaryNameEnglish = "Old Sec Eng",
            SecretaryMobileNo = "1111111111",
            SecretaryEmailId = "oldsec@mail.com",
            ManagerName = "Old Mgr",
            ManagerNameEnglish = "Old Mgr Eng",
            ManagerMobileNo = "2222222222",
            ManagerEmailId = "oldmgr@mail.com",
            IsActive = true,
            MarkedForDeletion = false
        });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcWingDetailsDto
        {
            WingName = "A1",
            SecretaryName = "New Sec",
            SecretaryNameEnglish = "New Sec Eng",
            SecretaryMobileNo = "9999999999",
            SecretaryEmailId = "newsec@mail.com",
            ManagerName = "New Mgr",
            ManagerNameEnglish = "New Mgr Eng",
            ManagerMobileNo = "8888888888",
            ManagerEmailId = "newmgr@mail.com"
        };

        // Act
        var outcome = await repo.UpdateWingDetailsAsync(100, dto, updatedBy: 42);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);
        var updatedWing = await context.WingDetailsMast.FindAsync(100);
        Assert.NotNull(updatedWing);
        Assert.Equal("A1", updatedWing.WingName);
        Assert.Equal("New Sec", updatedWing.SecretaryName);
        Assert.Equal("New Sec Eng", updatedWing.SecretaryNameEnglish);
        Assert.Equal("9999999999", updatedWing.SecretaryMobileNo);
        Assert.Equal("newsec@mail.com", updatedWing.SecretaryEmailId);
        Assert.Equal("New Mgr", updatedWing.ManagerName);
        Assert.Equal("New Mgr Eng", updatedWing.ManagerNameEnglish);
        Assert.Equal("8888888888", updatedWing.ManagerMobileNo);
        Assert.Equal("newmgr@mail.com", updatedWing.ManagerEmailId);
        Assert.Equal(42, updatedWing.UpdatedBy);
    }

    [Fact]
    public async Task Repository_UpdateWingDetails_ReturnsWingNotFound_WhenWingDoesNotExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcWingDetailsDto { WingName = "B" };

        // Act
        var outcome = await repo.UpdateWingDetailsAsync(999, dto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.WingNotFound, outcome);
    }

    [Fact]
    public async Task Repository_UpdateWingDetails_ReturnsPropertyLocked_WhenPropertyIsLocked()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.PropertyMast.Add(new PropertyEntity { Id = 10, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 34, PropertyId = 10, IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity
        {
            Id = 100,
            SocietyDetailsMastId = 34,
            WingName = "A",
            IsActive = true,
            MarkedForDeletion = false
        });
        context.PropertyScreenLocks.Add(new PropertyScreenLockEntity
        {
            Id = 1,
            PropertyId = 10,
            IsLocked = true,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.Now
        });
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcWingDetailsDto { SecretaryName = "New Sec" };

        // Act
        var outcome = await repo.UpdateWingDetailsAsync(100, dto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.PropertyLocked, outcome);
    }

    [Fact]
    public async Task Service_UpdateWingDetails_ReturnsNoFieldsProvided_WhenDtoIsEmpty()
    {
        // Arrange
        var repoMock = new Mock<IApartmentQcTopSectionRepository>();
        var calc = new ApartmentQcTopSectionPerformanceCalculator();
        var service = new ApartmentQcTopSectionService(repoMock.Object, calc);

        // Act
        var outcome = await service.UpdateWingDetailsAsync(100, new UpdateApartmentQcWingDetailsDto(), updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.NoFieldsProvided, outcome);
        repoMock.Verify(r => r.UpdateWingDetailsAsync(It.IsAny<int>(), It.IsAny<UpdateApartmentQcWingDetailsDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Service_UpdateWingDetails_DelegatesToRepository_WhenValid()
    {
        // Arrange
        var repoMock = new Mock<IApartmentQcTopSectionRepository>();
        var calc = new ApartmentQcTopSectionPerformanceCalculator();
        var service = new ApartmentQcTopSectionService(repoMock.Object, calc);
        var dto = new UpdateApartmentQcWingDetailsDto { WingName = "C" };

        repoMock.Setup(r => r.UpdateWingDetailsAsync(100, dto, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.Success);

        // Act
        var outcome = await service.UpdateWingDetailsAsync(100, dto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);
        repoMock.Verify(r => r.UpdateWingDetailsAsync(100, dto, 1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Controller_UpdateWingDetails_ReturnsOk_WhenSuccess()
    {
        // Arrange
        var serviceMock = new Mock<IApartmentQcTopSectionService>();
        serviceMock.Setup(s => s.UpdateWingDetailsAsync(100, It.IsAny<UpdateApartmentQcWingDetailsDto>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.Success);

        var controller = CreateController(serviceMock);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10")
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        var dto = new UpdateApartmentQcWingDetailsDto { WingName = "A" };

        // Act
        var result = await controller.UpdateWingDetails(100, dto, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(apiResponse.Success);
    }

    [Fact]
    public async Task Controller_UpdateWingDetails_ReturnsNotFound_WhenWingNotFound()
    {
        // Arrange
        var serviceMock = new Mock<IApartmentQcTopSectionService>();
        serviceMock.Setup(s => s.UpdateWingDetailsAsync(100, It.IsAny<UpdateApartmentQcWingDetailsDto>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.WingNotFound);

        var controller = CreateController(serviceMock);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10")
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        var dto = new UpdateApartmentQcWingDetailsDto { WingName = "A" };

        // Act
        var result = await controller.UpdateWingDetails(100, dto, default);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<object>>(notFoundResult.Value);
        Assert.False(apiResponse.Success);
    }

    [Fact]
    public async Task Controller_UpdateWingDetails_ReturnsLocked_WhenPropertyLocked()
    {
        // Arrange
        var serviceMock = new Mock<IApartmentQcTopSectionService>();
        serviceMock.Setup(s => s.UpdateWingDetailsAsync(100, It.IsAny<UpdateApartmentQcWingDetailsDto>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.PropertyLocked);

        var controller = CreateController(serviceMock);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10")
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        var dto = new UpdateApartmentQcWingDetailsDto { WingName = "A" };

        // Act
        var result = await controller.UpdateWingDetails(100, dto, default);

        // Assert
        var objResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status423Locked, objResult.StatusCode);
    }

    [Fact]
    public async Task Repository_GetAdditionalRevenueTaxDetailsAsync_CalculatesCurrentTaxFromPolicyTaxDetails_AndRetroTaxFromTransMast()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var taxTotal = new NtisPlatform.Core.Entities.Master.TaxMasterEntity
        {
            Id = 1,
            TaxCode = "TAXTOTAL",
            TaxName = "Tax Total",
            IsActive = true
        };
        var generalTax = new NtisPlatform.Core.Entities.Master.TaxMasterEntity
        {
            Id = 2,
            TaxCode = "GENTAX",
            TaxName = "General Tax",
            IsActive = true
        };
        var retroPolicy = new NtisPlatform.Core.Entities.Master.PolicyCodeMasterEntity
        {
            Id = 10,
            IsRetroDemand = true,
            IsActive = true
        };
        var regularPolicy = new NtisPlatform.Core.Entities.Master.PolicyCodeMasterEntity
        {
            Id = 20,
            PolicyCode = "NETTAX",
            IsRetroDemand = false,
            IsActive = true
        };

        // PropertyMast record
        context.PropertyMast.Add(new PropertyEntity
        {
            Id = 1487316,
            WardId = 1,
            PropertyNo = "100",
            PartitionNo = "A1",
            IsActive = true,
            MarkedForDeletion = false
        });

        // 1. Current tax row in PolicyTaxDetails (a real tax component, not the reserved TaxTotal
        // sentinel -- CurrentTax must never trust that sentinel's own stored value, see
        // PropertyRepository.cs's identical exclusion). IsCurrent = true, IsActive = true, MarkedForDeletion = false.
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity
        {
            Id = 1,
            PropertyId = 1487316,
            PolicyCodeId = 20,
            TaxId = 2,
            TaxAmount = 2051.00m,
            IsActive = true,
            MarkedForDeletion = false,
            IsCurrent = true
        });

        // Current tax row with IsCurrent = false (should be excluded from CurrentTax)
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity
        {
            Id = 2,
            PropertyId = 1487316,
            PolicyCodeId = 20,
            TaxId = 2,
            TaxAmount = 500.00m,
            IsActive = true,
            MarkedForDeletion = false,
            IsCurrent = false
        });

        // 2. Retro tax row in TransMast (TAXTOTAL, PolicyCode.IsRetroDemand = true, IsActive = true, MarkedForDeletion = false)
        context.TransMast.Add(new TransMastEntity
        {
            Id = 1,
            PropertyId = 1487316,
            PolicyCodeId = 10,
            TaxId = 1,
            TaxAmount = 2074.00m,
            IsActive = true
        });

        // 3. Pending current row in TransMast (PolicyCode = OLD_ARREARS, TAXTOTAL)
        var oldArrearsPolicy = new NtisPlatform.Core.Entities.Master.PolicyCodeMasterEntity
        {
            Id = 30,
            PolicyCode = "OLD_ARREARS",
            IsActive = true
        };
        context.TransMast.Add(new TransMastEntity
        {
            Id = 10,
            PropertyId = 1487316,
            PolicyCodeId = 30,
            TaxId = 1,
            TaxAmount = 300.00m,
            IsActive = true
        });

        context.TaxMaster.Add(taxTotal);
        context.TaxMaster.Add(generalTax);
        context.PolicyCodeMaster.Add(retroPolicy);
        context.PolicyCodeMaster.Add(regularPolicy);
        context.PolicyCodeMaster.Add(oldArrearsPolicy);
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act
        var (currentTax, retroTax, oldCurrentTax, pendingCurrent) = await repo.GetAdditionalRevenueTaxDetailsAsync(1487316);

        // Assert
        Assert.Equal(2051.00m, currentTax);
        Assert.Equal(2074.00m, retroTax);
        Assert.Equal(300.00m, pendingCurrent);
    }

    [Fact]
    public void Calculator_ComputeAdditionalRevenue_CalculatesPendingDemandAndTotalDemandCorrectly()
    {
        // Arrange
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();
        decimal currentTax = 2051.00m;
        decimal retroTax = 2074.00m;
        decimal oldCurrentTax = 2440.00m;
        decimal pendingCurrent = 300.00m;

        // Act
        var result = calculator.ComputeAdditionalRevenue(currentTax, retroTax, oldCurrentTax, pendingCurrent);

        // Assert
        Assert.Equal(2051.00m, result.CurrentTax);
        Assert.Equal(2074.00m, result.RetroTax);
        Assert.Equal(4125.00m, result.TotalTax);
        Assert.Equal(2051.00m, result.CurrentDemand);
        Assert.Equal(300.00m, result.PendingCurrent);
        Assert.Equal(2374.00m, result.PendingDemand); // retroTax (2074) + pendingCurrent (300)
        Assert.Equal(4425.00m, result.TotalDemand);   // currentDemand (2051) + pendingDemand (2374)
        Assert.Equal(0m, result.Collection);
        Assert.Equal(4425.00m, result.TotalBalance);
        Assert.Equal(2440.00m, result.OldCurrentTax);
        Assert.Equal(1685.00m, result.DifferenceAmount); // totalTax (4125) - oldCurrentTax (2440)
        Assert.Equal(69.06, result.ChangePercent); // 1685 / 2440 (old current tax) * 100, rounded
    }

    [Fact]
    public async Task Repository_GetAdditionalRevenueTaxDetailsAsync_Case1_SocietySearch_CalculatesAllFlatsInAllWings()
    {
        // Arrange: Society with PropertyId = 100, having 2 wings (Wing 1, Wing 2), each wing having 2 flats
        using var context = CreateInMemoryDbContext();
        var taxTotal = new TaxMasterEntity { Id = 1, TaxCode = "TAXTOTAL", TaxName = "Tax Total", IsActive = true };
        var generalTax = new TaxMasterEntity { Id = 2, TaxCode = "GENTAX", TaxName = "General Tax", IsActive = true };
        context.TaxMaster.Add(taxTotal);
        context.TaxMaster.Add(generalTax);

        var retroPolicy = new PolicyCodeMasterEntity { Id = 10, PolicyCode = "RETRO", IsRetroDemand = true, IsActive = true };
        var regularPolicy = new PolicyCodeMasterEntity { Id = 20, PolicyCode = "NETTAX", IsRetroDemand = false, IsActive = true };
        var oldArrearsPolicy = new PolicyCodeMasterEntity { Id = 30, PolicyCode = "OLD_ARREARS", IsRetroDemand = false, IsActive = true };
        context.PolicyCodeMaster.Add(retroPolicy);
        context.PolicyCodeMaster.Add(regularPolicy);
        context.PolicyCodeMaster.Add(oldArrearsPolicy);

        // Society property (PartitionNo is null/empty -> Society)
        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 5329, PropertyNo = "184", PartitionNo = null, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 100, SocietyName = "Gokuldham", IsActive = true, MarkedForDeletion = false });

        // Wings
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 20, SocietyDetailsMastId = 50, WingName = "B", IsActive = true, MarkedForDeletion = false });

        // Wing A flats: Property 101, 102
        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 10, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", WingDetailId = 10, IsActive = true, MarkedForDeletion = false });

        // Wing B flats: Property 201, 202
        context.PropertyMast.Add(new PropertyEntity { Id = 201, WardId = 5329, PropertyNo = "184", PartitionNo = "B1", WingDetailId = 20, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 202, WardId = 5329, PropertyNo = "184", PartitionNo = "B2", WingDetailId = 20, IsActive = true, MarkedForDeletion = false });

        // Current tax rows for each flat (PolicyCodeId = 20 regular, a real tax component -- not
        // the reserved TaxTotal sentinel, since CurrentTax never trusts that sentinel's value)
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 1, PropertyId = 101, PolicyCodeId = 20, TaxId = 2, TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 2, PropertyId = 102, PolicyCodeId = 20, TaxId = 2, TaxAmount = 1500m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 3, PropertyId = 201, PolicyCodeId = 20, TaxId = 2, TaxAmount = 2000m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 4, PropertyId = 202, PolicyCodeId = 20, TaxId = 2, TaxAmount = 2500m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });

        // Retro tax rows in TransMast (PolicyCodeId = 10 retro)
        context.TransMast.Add(new TransMastEntity { Id = 11, PropertyId = 101, PolicyCodeId = 10, TaxId = 1, TaxAmount = 300m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 12, PropertyId = 102, PolicyCodeId = 10, TaxId = 1, TaxAmount = 400m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 13, PropertyId = 201, PolicyCodeId = 10, TaxId = 1, TaxAmount = 500m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 14, PropertyId = 202, PolicyCodeId = 10, TaxId = 1, TaxAmount = 600m, IsActive = true });

        // Pending current in TransMast (PolicyCodeId = 30 OLD_ARREARS)
        context.TransMast.Add(new TransMastEntity { Id = 1, PropertyId = 101, PolicyCodeId = 30, TaxId = 1, TaxAmount = 50m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 2, PropertyId = 102, PolicyCodeId = 30, TaxId = 1, TaxAmount = 75m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 3, PropertyId = 201, PolicyCodeId = 30, TaxId = 1, TaxAmount = 100m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 4, PropertyId = 202, PolicyCodeId = 30, TaxId = 1, TaxAmount = 125m, IsActive = true });

        // Non-current, non-retro tax row (should be ignored)
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 5, PropertyId = 101, PolicyCodeId = 20, TaxId = 2, TaxAmount = 999m, IsActive = true, MarkedForDeletion = false, IsCurrent = false });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act: Society search (propertyId = 100, wingDetailId = null)
        var (currentTax, retroTax, _, pendingCurrent) = await repo.GetAdditionalRevenueTaxDetailsAsync(100, wingDetailId: null);

        // Assert:
        // currentTax = 1000 + 1500 + 2000 + 2500 = 7000
        // retroTax = 300 + 400 + 500 + 600 = 1800
        // pendingCurrent = 50 + 75 + 100 + 125 = 350
        Assert.Equal(7000m, currentTax);
        Assert.Equal(1800m, retroTax);
        Assert.Equal(350m, pendingCurrent);
    }

    [Fact]
    public async Task Repository_GetAdditionalRevenueTaxDetailsAsync_Case2_WingSearch_CalculatesAllFlatsInSpecificWingOnly()
    {
        // Arrange: Society with PropertyId = 100, Wing A (id=10) with flats 101, 102 and Wing B (id=20) with flats 201, 202
        using var context = CreateInMemoryDbContext();
        var taxTotal = new TaxMasterEntity { Id = 1, TaxCode = "TAXTOTAL", TaxName = "Tax Total", IsActive = true };
        var generalTax = new TaxMasterEntity { Id = 2, TaxCode = "GENTAX", TaxName = "General Tax", IsActive = true };
        context.TaxMaster.Add(taxTotal);
        context.TaxMaster.Add(generalTax);

        var retroPolicy = new PolicyCodeMasterEntity { Id = 10, PolicyCode = "RETRO", IsRetroDemand = true, IsActive = true };
        var regularPolicy = new PolicyCodeMasterEntity { Id = 20, PolicyCode = "NETTAX", IsRetroDemand = false, IsActive = true };
        var oldArrearsPolicy = new PolicyCodeMasterEntity { Id = 30, PolicyCode = "OLD_ARREARS", IsRetroDemand = false, IsActive = true };
        context.PolicyCodeMaster.Add(retroPolicy);
        context.PolicyCodeMaster.Add(regularPolicy);
        context.PolicyCodeMaster.Add(oldArrearsPolicy);

        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 5329, PropertyNo = "184", PartitionNo = null, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 100, IsActive = true, MarkedForDeletion = false });

        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 20, SocietyDetailsMastId = 50, WingName = "B", IsActive = true, MarkedForDeletion = false });

        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 10, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", WingDetailId = 10, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 201, WardId = 5329, PropertyNo = "184", PartitionNo = "B1", WingDetailId = 20, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 202, WardId = 5329, PropertyNo = "184", PartitionNo = "B2", WingDetailId = 20, IsActive = true, MarkedForDeletion = false });

        // Current taxes (a real tax component, not the reserved TaxTotal sentinel)
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 1, PropertyId = 101, PolicyCodeId = 20, TaxId = 2, TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 2, PropertyId = 102, PolicyCodeId = 20, TaxId = 2, TaxAmount = 1500m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 3, PropertyId = 201, PolicyCodeId = 20, TaxId = 2, TaxAmount = 2000m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 4, PropertyId = 202, PolicyCodeId = 20, TaxId = 2, TaxAmount = 2500m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });

        // Retro taxes in TransMast
        context.TransMast.Add(new TransMastEntity { Id = 11, PropertyId = 101, PolicyCodeId = 10, TaxId = 1, TaxAmount = 300m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 12, PropertyId = 102, PolicyCodeId = 10, TaxId = 1, TaxAmount = 400m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 13, PropertyId = 201, PolicyCodeId = 10, TaxId = 1, TaxAmount = 500m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 14, PropertyId = 202, PolicyCodeId = 10, TaxId = 1, TaxAmount = 600m, IsActive = true });

        // Pending current
        context.TransMast.Add(new TransMastEntity { Id = 1, PropertyId = 101, PolicyCodeId = 30, TaxId = 1, TaxAmount = 50m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 2, PropertyId = 102, PolicyCodeId = 30, TaxId = 1, TaxAmount = 75m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 3, PropertyId = 201, PolicyCodeId = 30, TaxId = 1, TaxAmount = 100m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 4, PropertyId = 202, PolicyCodeId = 30, TaxId = 1, TaxAmount = 125m, IsActive = true });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act: Wing search for Wing A (wingDetailId = 10)
        var (currentTaxA, retroTaxA, _, pendingCurrentA) = await repo.GetAdditionalRevenueTaxDetailsAsync(100, wingDetailId: 10);

        // Act: Wing search for Wing B (wingDetailId = 20)
        var (currentTaxB, retroTaxB, _, pendingCurrentB) = await repo.GetAdditionalRevenueTaxDetailsAsync(100, wingDetailId: 20);

        // Assert
        Assert.Equal(2500m, currentTaxA); // 1000 + 1500
        Assert.Equal(700m, retroTaxA);     // 300 + 400
        Assert.Equal(125m, pendingCurrentA); // 50 + 75

        Assert.Equal(4500m, currentTaxB); // 2000 + 2500
        Assert.Equal(1100m, retroTaxB);    // 500 + 600
        Assert.Equal(225m, pendingCurrentB); // 100 + 125
    }

    [Fact]
    public async Task Repository_GetAdditionalRevenueTaxDetailsAsync_Case3_IndividualPropertySearch_CalculatesSelectedPropertyOnly()
    {
        // Arrange: Individual property (PartitionNo not empty, not registered in SocietyDetailsMast)
        using var context = CreateInMemoryDbContext();
        var taxTotal = new TaxMasterEntity { Id = 1, TaxCode = "TAXTOTAL", TaxName = "Tax Total", IsActive = true };
        var generalTax = new TaxMasterEntity { Id = 2, TaxCode = "GENTAX", TaxName = "General Tax", IsActive = true };
        context.TaxMaster.Add(taxTotal);
        context.TaxMaster.Add(generalTax);

        var retroPolicy = new PolicyCodeMasterEntity { Id = 10, PolicyCode = "RETRO", IsRetroDemand = true, IsActive = true };
        var regularPolicy = new PolicyCodeMasterEntity { Id = 20, PolicyCode = "NETTAX", IsRetroDemand = false, IsActive = true };
        var oldArrearsPolicy = new PolicyCodeMasterEntity { Id = 30, PolicyCode = "OLD_ARREARS", IsRetroDemand = false, IsActive = true };
        context.PolicyCodeMaster.Add(retroPolicy);
        context.PolicyCodeMaster.Add(regularPolicy);
        context.PolicyCodeMaster.Add(oldArrearsPolicy);

        context.PropertyMast.Add(new PropertyEntity { Id = 500, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 501, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", IsActive = true, MarkedForDeletion = false });

        // Current taxes (a real tax component, not the reserved TaxTotal sentinel)
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 1, PropertyId = 500, PolicyCodeId = 20, TaxId = 2, TaxAmount = 3200m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 2, PropertyId = 501, PolicyCodeId = 20, TaxId = 2, TaxAmount = 4800m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });

        context.TransMast.Add(new TransMastEntity { Id = 11, PropertyId = 500, PolicyCodeId = 10, TaxId = 1, TaxAmount = 800m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 12, PropertyId = 501, PolicyCodeId = 10, TaxId = 1, TaxAmount = 1200m, IsActive = true });

        context.TransMast.Add(new TransMastEntity { Id = 1, PropertyId = 500, PolicyCodeId = 30, TaxId = 1, TaxAmount = 150m, IsActive = true });
        context.TransMast.Add(new TransMastEntity { Id = 2, PropertyId = 501, PolicyCodeId = 30, TaxId = 1, TaxAmount = 250m, IsActive = true });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act: Individual property search (propertyId = 500, wingDetailId = null)
        var (currentTax, retroTax, _, pendingCurrent) = await repo.GetAdditionalRevenueTaxDetailsAsync(500, wingDetailId: null);

        // Assert: only property 500 tax
        Assert.Equal(3200m, currentTax);
        Assert.Equal(800m, retroTax);
        Assert.Equal(150m, pendingCurrent);
    }

    [Fact]
    public async Task Repository_GetAdditionalRevenueTaxDetailsAsync_FiltersPendingDemandAndRetroTaxByFinanceYearLessThanCurrent()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var taxTotal = new TaxMasterEntity { Id = 1, TaxCode = "TAXTOTAL", TaxName = "Tax Total", IsActive = true };
        var generalTax = new TaxMasterEntity { Id = 2, TaxCode = "GENTAX", TaxName = "General Tax", IsActive = true };
        context.TaxMaster.Add(taxTotal);
        context.TaxMaster.Add(generalTax);

        var retroPolicy = new PolicyCodeMasterEntity { Id = 10, PolicyCode = "RETRO", IsRetroDemand = true, IsActive = true };
        var regularPolicy = new PolicyCodeMasterEntity { Id = 20, PolicyCode = "NETTAX", IsRetroDemand = false, IsActive = true };
        var oldArrearsPolicy = new PolicyCodeMasterEntity { Id = 30, PolicyCode = "OLD_ARREARS", IsRetroDemand = false, IsActive = true };
        context.PolicyCodeMaster.AddRange(retroPolicy, regularPolicy, oldArrearsPolicy);

        // YearMaster entries: 2024 (past), 2025 (past), 2026 (current active), 2027 (future)
        var ym2024 = new YearMasterEntity { Id = 1, Year = 2024, YearCode = "2024-25", IsActive = false };
        var ym2025 = new YearMasterEntity { Id = 2, Year = 2025, YearCode = "2025-26", IsActive = false };
        var ym2026 = new YearMasterEntity { Id = 3, Year = 2026, YearCode = "2026-27", IsActive = true };
        var ym2027 = new YearMasterEntity { Id = 4, Year = 2027, YearCode = "2027-28", IsActive = false };
        context.YearMaster.AddRange(ym2024, ym2025, ym2026, ym2027);

        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 1, PropertyNo = "100", PartitionNo = "A1", IsActive = true, MarkedForDeletion = false });

        // Current tax (PolicyTaxDetails; a real tax component, not the reserved TaxTotal sentinel)
        context.PolicyTaxDetails.Add(new PolicyTaxDetailsEntity { Id = 1, PropertyId = 100, PolicyCodeId = 20, TaxId = 2, TaxAmount = 5000m, IsActive = true, MarkedForDeletion = false, IsCurrent = true });

        // Retro tax in TransMast:
        // FY 2024 (past -> included)
        context.TransMast.Add(new TransMastEntity { Id = 1, PropertyId = 100, FinanceYearId = 1, PolicyCodeId = 10, TaxId = 1, TaxAmount = 1000m, IsActive = true });
        // FY 2025 (past -> included)
        context.TransMast.Add(new TransMastEntity { Id = 2, PropertyId = 100, FinanceYearId = 2, PolicyCodeId = 10, TaxId = 1, TaxAmount = 1500m, IsActive = true });
        // FY 2026 (current -> excluded)
        context.TransMast.Add(new TransMastEntity { Id = 3, PropertyId = 100, FinanceYearId = 3, PolicyCodeId = 10, TaxId = 1, TaxAmount = 2000m, IsActive = true });
        // FY 2027 (future -> excluded)
        context.TransMast.Add(new TransMastEntity { Id = 4, PropertyId = 100, FinanceYearId = 4, PolicyCodeId = 10, TaxId = 1, TaxAmount = 3000m, IsActive = true });

        // Old Arrears in TransMast:
        // FY 2024 (past -> included)
        context.TransMast.Add(new TransMastEntity { Id = 5, PropertyId = 100, FinanceYearId = 1, PolicyCodeId = 30, TaxId = 1, TaxAmount = 200m, IsActive = true });
        // FY 2026 (current -> excluded)
        context.TransMast.Add(new TransMastEntity { Id = 6, PropertyId = 100, FinanceYearId = 3, PolicyCodeId = 30, TaxId = 1, TaxAmount = 500m, IsActive = true });

        await context.SaveChangesAsync();

        var financeYearProviderMock = new Mock<IFinanceYearProvider>();
        financeYearProviderMock.Setup(p => p.GetCurrentFinanceYear()).Returns(2026);

        var repo = new ApartmentQcTopSectionRepository(context, financeYearProviderMock.Object);

        // Act
        var (currentTax, retroTax, _, pendingCurrent) = await repo.GetAdditionalRevenueTaxDetailsAsync(100, wingDetailId: null);

        // Assert:
        // currentTax = 5000
        // retroTax = 1000 (2024) + 1500 (2025) = 2500 (2026 and 2027 excluded)
        // pendingCurrent = 200 (2024) (2026 excluded)
        Assert.Equal(5000m, currentTax);
        Assert.Equal(2500m, retroTax);
        Assert.Equal(200m, pendingCurrent);
    }

    [Fact]
    public async Task Service_GetTopSectionAsync_PassesWingDetailsIdToRepository()
    {
        // Arrange
        var repoMock = new Mock<IApartmentQcTopSectionRepository>();
        var calc = new ApartmentQcTopSectionPerformanceCalculator();
        var service = new ApartmentQcTopSectionService(repoMock.Object, calc);

        var query = new ApartmentQcTopSectionQueryParameters
        {
            PropertyId = 100,
            WingDetailsId = 10
        };

        repoMock.Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyTopSectionRawData { Id = 100, Upic = "UPIC01", IsActive = true, WardNo = "W10" });

        repoMock.Setup(r => r.GetCarpetAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync((100, 10));
        repoMock.Setup(r => r.GetBuiltUpAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync((120, 12));
        repoMock.Setup(r => r.GetAdditionalRevenueTaxDetailsAsync(100, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync((5000m, 1000m, 2000m, 300m));
        repoMock.Setup(r => r.GetSocietyWingsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SocietyWingSummaryDto> { new() { WingDetailId = 10, WingName = "Wing A" } });

        repoMock.Setup(r => r.GetPropertyTypeCountsAsync(100, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyTypeCountSummaryDto { Total = 20, Residential = 15, Commercial = 3, Amenity = 2 });
        repoMock.Setup(r => r.GetTotalFloorAsync(100, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync("G+7");

        // Act
        var result = await service.GetTopSectionAsync(query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5000m, result!.AdditionalRevenue.CurrentTax);
        Assert.Equal("W10", result.PropertyOverview.WardNo);
        Assert.Equal("G+7", result.PropertyOverview.TotalFloor);
        Assert.Equal(20, result.PropertyOverview.PropertyCounts.Total);
        Assert.Equal(15, result.PropertyOverview.PropertyCounts.Residential);
        Assert.Equal(3, result.PropertyOverview.PropertyCounts.Commercial);
        Assert.Equal(2, result.PropertyOverview.PropertyCounts.Amenity);
        repoMock.Verify(r => r.GetAdditionalRevenueTaxDetailsAsync(100, 10, It.IsAny<CancellationToken>()), Times.Once);
        repoMock.Verify(r => r.GetPropertyTypeCountsAsync(100, 10, It.IsAny<CancellationToken>()), Times.Once);
        repoMock.Verify(r => r.GetTotalFloorAsync(100, 10, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Service_GetTopSectionAsync_UnrelatedWingDetailsId_PassesNullWingToRevenueAndCounts()
    {
        // Arrange
        var repoMock = new Mock<IApartmentQcTopSectionRepository>();
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();
        var service = new ApartmentQcTopSectionService(repoMock.Object, calculator);

        var query = new ApartmentQcTopSectionQueryParameters
        {
            PropertyId = 100,
            WingDetailsId = 99 // Unrelated wing not in property's society
        };

        repoMock.Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyTopSectionRawData { Id = 100, Upic = "UPIC01", IsActive = true, WardNo = "W10" });

        repoMock.Setup(r => r.GetCarpetAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync((100, 10));
        repoMock.Setup(r => r.GetBuiltUpAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync((120, 12));
        repoMock.Setup(r => r.GetAdditionalRevenueTaxDetailsAsync(100, (int?)null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((5000m, 1000m, 2000m, 300m));
        repoMock.Setup(r => r.GetSocietyWingsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SocietyWingSummaryDto> { new() { WingDetailId = 10, WingName = "Wing A" } });

        repoMock.Setup(r => r.GetPropertyTypeCountsAsync(100, (int?)null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyTypeCountSummaryDto { Total = 20, Residential = 15, Commercial = 3, Amenity = 2 });
        repoMock.Setup(r => r.GetTotalFloorAsync(100, (int?)null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("G+7");

        // Act
        var result = await service.GetTopSectionAsync(query);

        // Assert
        Assert.NotNull(result);
        repoMock.Verify(r => r.GetAdditionalRevenueTaxDetailsAsync(100, (int?)null, It.IsAny<CancellationToken>()), Times.Once);
        repoMock.Verify(r => r.GetPropertyTypeCountsAsync(100, (int?)null, It.IsAny<CancellationToken>()), Times.Once);
        repoMock.Verify(r => r.GetTotalFloorAsync(100, (int?)null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Repository_GetPropertyTypeCountsAsync_SocietySearch_CalculatesAllUnitsAcrossAllWings_IncludingRootSocietyRecord()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var resType = new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Flat", PartType = "Residential", IsActive = true };
        var comType = new PropertyTypeMasterEntity { Id = 2, PropertyDescription = "Shop", PartType = "Commercial", IsActive = true };
        var amenType = new PropertyTypeMasterEntity { Id = 3, PropertyDescription = "Club House", PartType = "Amenity", IsActive = true };
        context.PropertyTypeMasters.AddRange(resType, comType, amenType);

        // Society root property (PropertyTypeId = 1 -> Residential)
        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 5329, PropertyNo = "184", PartitionNo = null, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 100, IsActive = true, MarkedForDeletion = false });

        // Wing A (Id=10): 2 Residential, 1 Commercial
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 10, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", WingDetailId = 10, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 103, WardId = 5329, PropertyNo = "184", PartitionNo = "A3", WingDetailId = 10, PropertyTypeId = 2, IsActive = true, MarkedForDeletion = false });

        // Wing B (Id=20): 1 Residential, 1 Amenity
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 20, SocietyDetailsMastId = 50, WingName = "B", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 201, WardId = 5329, PropertyNo = "184", PartitionNo = "B1", WingDetailId = 20, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 202, WardId = 5329, PropertyNo = "184", PartitionNo = "B2", WingDetailId = 20, PropertyTypeId = 3, IsActive = true, MarkedForDeletion = false });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act: Society level query
        var counts = await repo.GetPropertyTypeCountsAsync(100, wingDetailId: null);

        // Assert: 4 Residential (100, 101, 102, 201) + 1 Commercial (103) + 1 Amenity (202) = 6 Total
        Assert.Equal(6, counts.Total);
        Assert.Equal(4, counts.Residential);
        Assert.Equal(1, counts.Commercial);
        Assert.Equal(1, counts.Amenity);
    }

    [Fact]
    public async Task Repository_GetPropertyTypeCountsAsync_SocietySearch_WithSocietyLevelAmenityNullWingDetailId_CountsAmenityCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var resType = new PropertyTypeMasterEntity { Id = 12, PropertyDescription = "Flat", PartType = "Residential", IsActive = true };
        var comType = new PropertyTypeMasterEntity { Id = 69, PropertyDescription = "Office", PartType = "Commercial", IsActive = true };
        var amenType = new PropertyTypeMasterEntity { Id = 140, PropertyDescription = "STORE ROOM", PartType = "Amenity", IsActive = true };
        context.PropertyTypeMasters.AddRange(resType, comType, amenType);

        // Root Society property (PropertyTypeId = 69 -> Commercial)
        context.PropertyMast.Add(new PropertyEntity { Id = 1675455, WardId = 5329, PropertyNo = "184", PartitionNo = null, PropertyTypeId = 69, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 1675455, IsActive = true, MarkedForDeletion = false });

        // Wing A
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 1525593, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 1861555, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 1525593, PropertyTypeId = 12, IsActive = true, MarkedForDeletion = false });

        // Society-level Amenity (WingDetailId is null, PartitionNo is AM1, PropertyTypeId is 140)
        context.PropertyMast.Add(new PropertyEntity { Id = 1861631, WardId = 5329, PropertyNo = "184", PartitionNo = "AM1", WingDetailId = null, PropertyTypeId = 140, IsActive = true, MarkedForDeletion = false });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act
        var counts = await repo.GetPropertyTypeCountsAsync(1675455, wingDetailId: null);

        // Assert: 1 Res (1861555) + 1 Com (1675455) + 1 Amenity (1861631) = 3 Total
        Assert.Equal(3, counts.Total);
        Assert.Equal(1, counts.Residential);
        Assert.Equal(1, counts.Commercial);
        Assert.Equal(1, counts.Amenity);
    }

    [Fact]
    public async Task Repository_GetPropertyTypeCountsAsync_ClassifiesByMasterTypeAndPropertyType_R_N_Residential_C_I_IC_RC_Commercial_Amenity()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var resR = new PropertyTypeMasterEntity { Id = 1, Type = "R", PropertyDescription = "Residential Unit", IsActive = true };
        var resN = new PropertyTypeMasterEntity { Id = 2, Type = "N", PropertyDescription = "Niwas", IsActive = true };
        var comC = new PropertyTypeMasterEntity { Id = 3, Type = "C", PropertyDescription = "Commercial Unit", IsActive = true };
        var comI = new PropertyTypeMasterEntity { Id = 4, Type = "I", PropertyDescription = "Industrial Unit", IsActive = true };
        var comIC = new PropertyTypeMasterEntity { Id = 5, Type = "I-C", PropertyDescription = "Industrial Commercial", IsActive = true };
        var comRC = new PropertyTypeMasterEntity { Id = 6, Type = "R-C", PropertyDescription = "Res-Commercial", IsActive = true };
        var amen = new PropertyTypeMasterEntity { Id = 7, Type = null, PropertyDescription = "अॅमिनीटी", PartType = "Amenity", IsActive = true };

        context.PropertyTypeMasters.AddRange(resR, resN, comC, comI, comIC, comRC, amen);

        // Root society
        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 5329, PropertyNo = "184", PartitionNo = null, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 100, IsActive = true, MarkedForDeletion = false });

        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        // Residential (Type R and N): 2 units + 1 root (Type R) = 3 Residential
        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 10, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", WingDetailId = 10, PropertyTypeId = 2, IsActive = true, MarkedForDeletion = false });

        // Commercial (Type C, I, I-C, R-C): 4 units
        context.PropertyMast.Add(new PropertyEntity { Id = 103, WardId = 5329, PropertyNo = "184", PartitionNo = "A3", WingDetailId = 10, PropertyTypeId = 3, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 104, WardId = 5329, PropertyNo = "184", PartitionNo = "A4", WingDetailId = 10, PropertyTypeId = 4, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 105, WardId = 5329, PropertyNo = "184", PartitionNo = "A5", WingDetailId = 10, PropertyTypeId = 5, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 106, WardId = 5329, PropertyNo = "184", PartitionNo = "A6", WingDetailId = 10, PropertyTypeId = 6, IsActive = true, MarkedForDeletion = false });

        // Amenity: 1 unit
        context.PropertyMast.Add(new PropertyEntity { Id = 107, WardId = 5329, PropertyNo = "184", PartitionNo = "AM1", WingDetailId = null, PropertyTypeId = 7, IsActive = true, MarkedForDeletion = false });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act
        var counts = await repo.GetPropertyTypeCountsAsync(100, wingDetailId: null);

        // Assert: 3 Res (100, 101, 102) + 4 Com (103, 104, 105, 106) + 1 Amen (107) = 8 Total
        Assert.Equal(8, counts.Total);
        Assert.Equal(3, counts.Residential);
        Assert.Equal(4, counts.Commercial);
        Assert.Equal(1, counts.Amenity);
    }

    [Fact]
    public async Task Repository_GetPropertyTypeCountsAsync_NivasiWithoutAnivasi_GoesToResidential_AnivasiAnywhere_GoesToCommercial()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        // Type 1: Nivasi only in description -> Residential
        var res1 = new PropertyTypeMasterEntity { Id = 1, Type = "NEW_RES_TYPE", PropertyDescription = "केवळ निवासी", IsActive = true };
        // Type 2: Anivasi in description -> Commercial
        var com1 = new PropertyTypeMasterEntity { Id = 2, Type = "NEW_COM_TYPE", PropertyDescription = "अनिवासी गाळा", IsActive = true };
        // Type 3: English nivasi in PartType -> Residential
        var res2 = new PropertyTypeMasterEntity { Id = 3, Type = null, PropertyDescription = "Custom Unit", PartType = "Nivasi", IsActive = true };
        // Type 4: English anivasi in PartType -> Commercial
        var com2 = new PropertyTypeMasterEntity { Id = 4, Type = null, PropertyDescription = "Custom Unit", PartType = "Anivasi", IsActive = true };

        context.PropertyTypeMasters.AddRange(res1, com1, res2, com2);

        // Root society (PropertyTypeId = 1 -> Residential)
        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 5329, PropertyNo = "184", PartitionNo = null, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 100, IsActive = true, MarkedForDeletion = false });

        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 10, PropertyTypeId = 2, IsActive = true, MarkedForDeletion = false }); // Commercial (अनिवासी)
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", WingDetailId = 10, PropertyTypeId = 3, IsActive = true, MarkedForDeletion = false }); // Residential (Nivasi)
        context.PropertyMast.Add(new PropertyEntity { Id = 103, WardId = 5329, PropertyNo = "184", PartitionNo = "A3", WingDetailId = 10, PropertyTypeId = 4, IsActive = true, MarkedForDeletion = false }); // Commercial (Anivasi)

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act
        var counts = await repo.GetPropertyTypeCountsAsync(100, wingDetailId: null);

        // Assert: 2 Res (100, 102) + 2 Com (101, 103) = 4 Total
        Assert.Equal(4, counts.Total);
        Assert.Equal(2, counts.Residential);
        Assert.Equal(2, counts.Commercial);
        Assert.Equal(0, counts.Amenity);
    }

    [Fact]
    public async Task Repository_GetPropertyTypeCountsAsync_WingSearch_CalculatesSpecificWingOnly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var resType = new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Flat", PartType = "Residential", IsActive = true };
        var comType = new PropertyTypeMasterEntity { Id = 2, PropertyDescription = "Shop", PartType = "Commercial", IsActive = true };
        var amenType = new PropertyTypeMasterEntity { Id = 3, PropertyDescription = "Club House", PartType = "Amenity", IsActive = true };
        context.PropertyTypeMasters.AddRange(resType, comType, amenType);

        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 5329, PropertyNo = "184", PartitionNo = null, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 100, IsActive = true, MarkedForDeletion = false });

        // Wing A: 2 Res, 1 Com
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 10, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", WingDetailId = 10, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 103, WardId = 5329, PropertyNo = "184", PartitionNo = "A3", WingDetailId = 10, PropertyTypeId = 2, IsActive = true, MarkedForDeletion = false });

        // Wing B: 1 Res, 1 Amenity
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 20, SocietyDetailsMastId = 50, WingName = "B", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 201, WardId = 5329, PropertyNo = "184", PartitionNo = "B1", WingDetailId = 20, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 202, WardId = 5329, PropertyNo = "184", PartitionNo = "B2", WingDetailId = 20, PropertyTypeId = 3, IsActive = true, MarkedForDeletion = false });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act: Wing A query
        var countsWingA = await repo.GetPropertyTypeCountsAsync(100, wingDetailId: 10);
        // Act: Wing B query
        var countsWingB = await repo.GetPropertyTypeCountsAsync(100, wingDetailId: 20);

        // Assert Wing A: 2 Res, 1 Com, 0 Amenity = 3 Total
        Assert.Equal(3, countsWingA.Total);
        Assert.Equal(2, countsWingA.Residential);
        Assert.Equal(1, countsWingA.Commercial);
        Assert.Equal(0, countsWingA.Amenity);

        // Assert Wing B: 1 Res, 0 Com, 1 Amenity = 2 Total
        Assert.Equal(2, countsWingB.Total);
        Assert.Equal(1, countsWingB.Residential);
        Assert.Equal(0, countsWingB.Commercial);
        Assert.Equal(1, countsWingB.Amenity);
    }

    [Fact]
    public async Task Repository_GetPropertyTypeCountsAsync_IndividualFlatSearch_CalculatesFlatsInSameWing()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var resType = new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Flat", PartType = "Residential", IsActive = true };
        var comType = new PropertyTypeMasterEntity { Id = 2, PropertyDescription = "Shop", PartType = "Commercial", IsActive = true };
        context.PropertyTypeMasters.AddRange(resType, comType);

        // Flat 101 (searched flat) belongs to Wing A (Id=10)
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 5329, PropertyNo = "184", PartitionNo = "A1", WingDetailId = 10, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 5329, PropertyNo = "184", PartitionNo = "A2", WingDetailId = 10, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 103, WardId = 5329, PropertyNo = "184", PartitionNo = "A3", WingDetailId = 10, PropertyTypeId = 2, IsActive = true, MarkedForDeletion = false });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act: Search for flat 101 without wingDetailId
        var counts = await repo.GetPropertyTypeCountsAsync(101, wingDetailId: null);

        // Assert: Resolved to Wing A (2 Res + 1 Com = 3 Total)
        Assert.Equal(3, counts.Total);
        Assert.Equal(2, counts.Residential);
        Assert.Equal(1, counts.Commercial);
        Assert.Equal(0, counts.Amenity);
    }

    [Fact]
    public async Task Repository_GetTotalFloorAsync_SocietySearchWithMultipleWings_ReturnsHighestFloor()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var floor1 = new FloorEntity { Id = 1, FloorCode = "1", SequenceNo = 1, Description = "पहिला मजला", IsActive = true };
        var floor7 = new FloorEntity { Id = 7, FloorCode = "7", SequenceNo = 7, Description = "सातवा मजला", IsActive = true };
        var floor12 = new FloorEntity { Id = 12, FloorCode = "12", SequenceNo = 12, Description = "बारावा मजला", IsActive = true };
        context.FloorEntity.AddRange(floor1, floor7, floor12);

        // Society property
        context.PropertyMast.Add(new PropertyEntity { Id = 100, WardId = 86, PropertyNo = "123", PartitionNo = null, IsActive = true, MarkedForDeletion = false });
        context.SocietyDetailsMast.Add(new SocietyDetailsEntity { Id = 50, PropertyId = 100, SocietyName = "GOLDCROFT", IsActive = true, MarkedForDeletion = false });

        // Wing A has max floor 7
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 50, WingName = "A", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 101, WardId = 86, PropertyNo = "123", PartitionNo = "A1", WingDetailId = 10, IsActive = true, MarkedForDeletion = false });
        context.PropertyDetails.Add(new PropertyDetailsEntity { Id = 1, PropertyId = 101, FloorId = 7, IsActive = true, MarkedForDeletion = false });

        // Wing B has max floor 12
        context.WingDetailsMast.Add(new WingDetailsMastEntity { Id = 20, SocietyDetailsMastId = 50, WingName = "B", IsActive = true, MarkedForDeletion = false });
        context.PropertyMast.Add(new PropertyEntity { Id = 102, WardId = 86, PropertyNo = "123", PartitionNo = "B1", WingDetailId = 20, IsActive = true, MarkedForDeletion = false });
        context.PropertyDetails.Add(new PropertyDetailsEntity { Id = 2, PropertyId = 102, FloorId = 12, IsActive = true, MarkedForDeletion = false });

        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);

        // Act & Assert 1: Society-level search (across all wings) -> highest floor is 12 -> "G+12"
        var societyTotalFloor = await repo.GetTotalFloorAsync(100, wingDetailId: null);
        Assert.Equal("G+12", societyTotalFloor);

        // Act & Assert 2: Wing A search -> highest floor is 7 -> "G+7"
        var wingATotalFloor = await repo.GetTotalFloorAsync(100, wingDetailId: 10);
        Assert.Equal("G+7", wingATotalFloor);

        // Act & Assert 3: Individual flat in Wing A (Id=101) -> highest floor in Wing A -> "G+7"
        var flatTotalFloor = await repo.GetTotalFloorAsync(101, wingDetailId: null);
        Assert.Equal("G+7", flatTotalFloor);
    }

    [Fact]
    public async Task Repository_UpdateTopSection_CascadesSocietyAddressToChildFlats()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        // Society property
        var societyProp = new PropertyEntity
        {
            Id = 100,
            WardId = 88,
            PropertyNo = "500",
            PartitionNo = null,
            Address = "Old Society Addr",
            AddressEnglish = "Old Society Addr Eng",
            IsActive = true,
            MarkedForDeletion = false
        };
        var society = new SocietyDetailsEntity
        {
            Id = 50,
            PropertyId = 100,
            SocietyName = "Sunrise Heights",
            SocietyAddress = "Old Society Addr",
            SocietyAddressEnglish = "Old Society Addr Eng",
            IsActive = true,
            MarkedForDeletion = false
        };
        var wingA = new WingDetailsMastEntity
        {
            Id = 10,
            SocietyDetailsMastId = 50,
            WingName = "Wing A",
            IsActive = true,
            MarkedForDeletion = false
        };

        // Flat 101 in Wing A
        var flat101 = new PropertyEntity
        {
            Id = 101,
            WardId = 88,
            PropertyNo = "500",
            PartitionNo = "A1",
            WingDetailId = 10,
            FlatOrShopName = "Flat 101",
            FlatOrShopNameEnglish = "Flat 101",
            Address = "Old Flat 101 Addr",
            AddressEnglish = "Old Flat 101 Addr Eng",
            IsActive = true,
            MarkedForDeletion = false
        };

        // Flat 201 without Wing (single bldg unit under same society)
        var flat201 = new PropertyEntity
        {
            Id = 201,
            WardId = 88,
            PropertyNo = "500",
            PartitionNo = "B1",
            WingDetailId = null,
            FlatOrShopNo = "201",
            Address = "Old Flat 201 Addr",
            AddressEnglish = "Old Flat 201 Addr Eng",
            IsActive = true,
            MarkedForDeletion = false
        };

        // Inactive flat (should not be touched)
        var inactiveFlat = new PropertyEntity
        {
            Id = 301,
            WardId = 88,
            PropertyNo = "500",
            PartitionNo = "C1",
            Address = "Inactive Addr",
            AddressEnglish = "Inactive Addr Eng",
            IsActive = false,
            MarkedForDeletion = false
        };

        context.PropertyMast.AddRange(societyProp, flat101, flat201, inactiveFlat);
        context.SocietyDetailsMast.Add(society);
        context.WingDetailsMast.Add(wingA);
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var updateDto = new UpdateApartmentQcTopSectionDto
        {
            SocietyAddress = "New Society Addr Reg",
            SocietyAddressEnglish = "New Society Addr Eng"
        };

        // Act
        var outcome = await repo.UpdateTopSectionAsync(100, updateDto, updatedBy: 99);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);

        // Verify parent property address synced
        var updatedSocietyProp = await context.PropertyMast.FindAsync(100);
        Assert.Equal("New Society Addr Reg", updatedSocietyProp!.Address);
        Assert.Equal("New Society Addr Eng", updatedSocietyProp.AddressEnglish);

        // Verify Flat 101 (with wing): Flat 101, Wing A, New Society Addr Eng
        var updatedFlat101 = await context.PropertyMast.FindAsync(101);
        Assert.Equal("Flat 101, Wing A, New Society Addr Reg", updatedFlat101!.Address);
        Assert.Equal("Flat 101, Wing A, New Society Addr Eng", updatedFlat101.AddressEnglish);
        Assert.Equal(99, updatedFlat101.UpdatedBy);

        // Verify Flat 201 (without wing): 201, New Society Addr Eng
        var updatedFlat201 = await context.PropertyMast.FindAsync(201);
        Assert.Equal("201, New Society Addr Reg", updatedFlat201!.Address);
        Assert.Equal("201, New Society Addr Eng", updatedFlat201.AddressEnglish);

        // Inactive flat was NOT updated
        var updatedInactiveFlat = await context.PropertyMast.FindAsync(301);
        Assert.Equal("Inactive Addr", updatedInactiveFlat!.Address);
    }

    [Fact]
    public async Task Repository_UpdateWingDetails_CascadesNewWingNameToFlatsInThatWing()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var society = new SocietyDetailsEntity
        {
            Id = 50,
            PropertyId = 100,
            SocietyName = "Sunrise Heights",
            SocietyAddress = "Society Road, Ward 1",
            SocietyAddressEnglish = "Society Road, Ward 1",
            IsActive = true,
            MarkedForDeletion = false
        };
        var wingA = new WingDetailsMastEntity
        {
            Id = 10,
            SocietyDetailsMastId = 50,
            WingName = "Old Wing A",
            IsActive = true,
            MarkedForDeletion = false
        };

        var flat101 = new PropertyEntity
        {
            Id = 101,
            WardId = 88,
            PropertyNo = "500",
            PartitionNo = "A1",
            WingDetailId = 10,
            FlatOrShopName = "Flat 101",
            FlatOrShopNameEnglish = "Flat 101",
            Address = "Flat 101, Old Wing A, Society Road, Ward 1",
            AddressEnglish = "Flat 101, Old Wing A, Society Road, Ward 1",
            IsActive = true,
            MarkedForDeletion = false
        };

        context.SocietyDetailsMast.Add(society);
        context.WingDetailsMast.Add(wingA);
        context.PropertyMast.Add(flat101);
        await context.SaveChangesAsync();

        var repo = new ApartmentQcTopSectionRepository(context);
        var dto = new UpdateApartmentQcWingDetailsDto
        {
            WingName = "New Tower A"
        };

        // Act
        var outcome = await repo.UpdateWingDetailsAsync(10, dto, updatedBy: 45);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, outcome);

        var updatedWing = await context.WingDetailsMast.FindAsync(10);
        Assert.Equal("New Tower A", updatedWing!.WingName);

        var updatedFlat = await context.PropertyMast.FindAsync(101);
        Assert.Equal("Flat 101, New Tower A, Society Road, Ward 1", updatedFlat!.Address);
        Assert.Equal("Flat 101, New Tower A, Society Road, Ward 1", updatedFlat.AddressEnglish);
        Assert.Equal(45, updatedFlat.UpdatedBy);
    }
}




