using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services;

public class PropertyWiseValidatorDuplicateTests
{
    private readonly Mock<IRepository<GlobalSurveyWardAllocationEntity, int>> _repoMock;
    private readonly Mock<IRepository<ZoneEntity, int>> _zoneRepoMock;
    private readonly Mock<IRepository<WardEntity, int>> _wardRepoMock;
    private readonly Mock<IRepository<OldWardMasterEntity, int>> _oldWardRepoMock;
    private readonly Mock<IRepository<UserEntity, int>> _userRepoMock;
    private readonly Mock<IRepository<UserModuleAllocationEntity, int>> _userModuleAllocRepoMock;
    private readonly Mock<IRepository<ModuleMasterEntity, int>> _moduleRepoMock;
    private readonly Mock<IRepository<UserRoleAllocationEntity, int>> _userRoleAllocRepoMock;
    private readonly Mock<IReferenceValidationService> _referenceValidationMock;
    private readonly Mock<ILogger<PropertyWiseValidator>> _loggerMock;
    private readonly PropertyWiseValidator _validator;

    public PropertyWiseValidatorDuplicateTests()
    {
        _repoMock = new Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>();
        _zoneRepoMock = new Mock<IRepository<ZoneEntity, int>>();
        _wardRepoMock = new Mock<IRepository<WardEntity, int>>();
        _oldWardRepoMock = new Mock<IRepository<OldWardMasterEntity, int>>();
        _userRepoMock = new Mock<IRepository<UserEntity, int>>();
        _userModuleAllocRepoMock = new Mock<IRepository<UserModuleAllocationEntity, int>>();
        _moduleRepoMock = new Mock<IRepository<ModuleMasterEntity, int>>();
        _userRoleAllocRepoMock = new Mock<IRepository<UserRoleAllocationEntity, int>>();
        _referenceValidationMock = new Mock<IReferenceValidationService>();
        _loggerMock = new Mock<ILogger<PropertyWiseValidator>>();

        // Default valid setups
        _userRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int id, CancellationToken _) => new UserEntity { Id = id, UserName = $"user{id}", IsActive = true, MarkedForDeletion = false });

        _userModuleAllocRepoMock.Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 1, DepartmentId = 1, ModuleId = 1, IsActive = true }
            }.BuildMock());

        _moduleRepoMock.Setup(x => x.GetQueryable())
            .Returns(new List<ModuleMasterEntity>
            {
                new() { Id = 1, ModuleName = "Other", ModuleCode = "OTHER", IsActive = true }
            }.BuildMock());

        _moduleRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int id, CancellationToken _) => new ModuleMasterEntity { Id = id, ModuleName = "Other", ModuleCode = "OTHER", IsActive = true });

        _zoneRepoMock.Setup(x => x.GetQueryable())
            .Returns(new List<ZoneEntity>
            {
                new() { Id = 1, ZoneNo = "1", IsActive = true },
                new() { Id = 2, ZoneNo = "2", IsActive = true }
            }.BuildMock());

        _wardRepoMock.Setup(x => x.GetQueryable())
            .Returns(new List<WardEntity>
            {
                new() { Id = 10, ZoneId = 1, WardNo = "10", IsActive = true },
                new() { Id = 20, ZoneId = 2, WardNo = "20", IsActive = true }
            }.BuildMock());

        _oldWardRepoMock.Setup(x => x.GetQueryable())
            .Returns(new List<OldWardMasterEntity>
            {
                new() { Id = 100, OldZoneId = 1, OldWardNo = "100", IsActive = true },
                new() { Id = 200, OldZoneId = 2, OldWardNo = "200", IsActive = true }
            }.BuildMock());

        _userRoleAllocRepoMock.Setup(x => x.GetQueryable())
            .Returns(new List<UserRoleAllocationEntity>().BuildMock());

        _validator = new PropertyWiseValidator(
            _repoMock.Object,
            _zoneRepoMock.Object,
            _wardRepoMock.Object,
            _oldWardRepoMock.Object,
            _userRepoMock.Object,
            _userModuleAllocRepoMock.Object,
            _moduleRepoMock.Object,
            _userRoleAllocRepoMock.Object,
            _referenceValidationMock.Object,
            _loggerMock.Object);
    }

    #region Create Duplicate Scenarios

    [Fact]
    public async Task ValidateCreateAsync_WhenExactDuplicateAllocationExists_ThrowsValidationException()
    {
        var existingEntities = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 1,
                UserId = 1,
                DepartmentId = 1,
                ModuleId = 1,
                ZoneId = 1,
                WardId = 10,
                OldWardId = 100,
                FromPropertyNo = "001",
                ToPropertyNo = "100",
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        _repoMock.Setup(x => x.GetQueryable())
            .Returns(existingEntities.BuildMock());

        var createDto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "001",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 100 } }
            }
        };

        var act = () => _validator.ValidateCreateAsync(createDto);

        var ex = await act.Should().ThrowAsync<ValidationException>();
        ex.WithMessage("*This Property Wise allocation already exists.*");
    }

    [Fact]
    public async Task ValidateCreateAsync_WhenCandidateHasCartesianMatchButNotRequestedPair_DoesNotThrowDuplicateException()
    {
        // DB has (Zone 1, Ward 20).
        // Requested pairs are (Zone 1, Ward 10) and (Zone 2, Ward 20).
        // Cartesian check (zoneIds.Contains && wardIds.Contains) would falsely match,
        // but non-Cartesian pair check recognizes (Zone 1, Ward 20) was NOT requested.
        var existingEntities = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 1,
                UserId = 1,
                DepartmentId = 1,
                ModuleId = 1,
                ZoneId = 1,
                WardId = 20, // Belongs to Zone 2 in request, but DB record has Zone 1
                FromPropertyNo = "001",
                ToPropertyNo = "100",
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        _repoMock.Setup(x => x.GetQueryable())
            .Returns(existingEntities.BuildMock());

        var createDto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "001",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 100 } },
                new() { ZoneId = 2, WardIds = new List<int> { 20 }, OldZoneId = new List<int> { 2 }, OldWardIds = new List<int> { 200 } }
            }
        };

        var act = () => _validator.ValidateCreateAsync(createDto);

        // Should not throw duplicate exception
        await act.Should().NotThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task ValidateCreateAsync_WhenExistingAllocationIsMarkedForDeletionOrInactive_DoesNotThrowDuplicateException()
    {
        var existingEntities = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 1,
                UserId = 1,
                DepartmentId = 1,
                ModuleId = 1,
                ZoneId = 1,
                WardId = 10,
                FromPropertyNo = "001",
                ToPropertyNo = "100",
                IsActive = false,
                MarkedForDeletion = true
            }
        };

        _repoMock.Setup(x => x.GetQueryable())
            .Returns(existingEntities.BuildMock());

        var createDto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "001",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 100 } }
            }
        };

        var act = () => _validator.ValidateCreateAsync(createDto);

        await act.Should().NotThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task ValidateCreateAsync_WhenDifferentPropertyRange_DoesNotThrowDuplicateException()
    {
        var existingEntities = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 1,
                UserId = 1,
                DepartmentId = 1,
                ModuleId = 1,
                ZoneId = 1,
                WardId = 10,
                FromPropertyNo = "001",
                ToPropertyNo = "100",
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        _repoMock.Setup(x => x.GetQueryable())
            .Returns(existingEntities.BuildMock());

        var createDto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "101",
            ToPropertyNo = "200",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 100 } }
            }
        };

        var act = () => _validator.ValidateCreateAsync(createDto);

        await act.Should().NotThrowAsync<ValidationException>();
    }

    #endregion

    #region Update Duplicate Scenarios

    [Fact]
    public async Task ValidateUpdateAsync_WhenUpdatingToExistingPropertyWiseDuplicate_ThrowsValidationException()
    {
        var existingEntityToUpdate = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100,
            FromPropertyNo = "001",
            ToPropertyNo = "100",
            IsActive = true
        };

        var otherDuplicateEntity = new GlobalSurveyWardAllocationEntity
        {
            Id = 2,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100,
            FromPropertyNo = "101",
            ToPropertyNo = "200",
            IsActive = true,
            MarkedForDeletion = false
        };

        _repoMock.Setup(x => x.GetQueryable())
            .Returns(new List<GlobalSurveyWardAllocationEntity> { existingEntityToUpdate, otherDuplicateEntity }.BuildMock());

        var updateDto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "101",
            ToPropertyNo = "200",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 100 } }
            }
        };

        var requestedPair = new PropertyWisePair
        {
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100
        };

        var act = () => _validator.ValidateUpdateAsync(1, existingEntityToUpdate, updateDto, requestedPair);

        var ex = await act.Should().ThrowAsync<ValidationException>();
        ex.WithMessage("*This Property Wise allocation already exists.*");
    }

    [Fact]
    public async Task ValidateUpdateAsync_WhenUpdatingSameEntity_DoesNotThrowDuplicateException()
    {
        var existingEntity = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100,
            FromPropertyNo = "001",
            ToPropertyNo = "100",
            IsActive = true,
            MarkedForDeletion = false
        };

        _repoMock.Setup(x => x.GetQueryable())
            .Returns(new List<GlobalSurveyWardAllocationEntity> { existingEntity }.BuildMock());

        var updateDto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "001",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 100 } }
            }
        };

        var requestedPair = new PropertyWisePair
        {
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100
        };

        var act = () => _validator.ValidateUpdateAsync(1, existingEntity, updateDto, requestedPair);

        await act.Should().NotThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task ValidateUpdateAsync_WhenUpdatingToWardWiseAndDuplicateWardWiseExists_ThrowsValidationException()
    {
        var existingEntityToUpdate = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100,
            FromPropertyNo = "001",
            ToPropertyNo = "100",
            IsActive = true
        };

        var existingWardWiseEntity = new GlobalSurveyWardAllocationEntity
        {
            Id = 2,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100,
            FromPropertyNo = null,
            ToPropertyNo = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        _repoMock.Setup(x => x.GetQueryable())
            .Returns(new List<GlobalSurveyWardAllocationEntity> { existingEntityToUpdate, existingWardWiseEntity }.BuildMock());

        var updateDto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = null,
            ToPropertyNo = null,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 100 } }
            }
        };

        var requestedPair = new PropertyWisePair
        {
            ZoneId = 1,
            WardId = 10,
            OldWardId = 100
        };

        var act = () => _validator.ValidateUpdateAsync(1, existingEntityToUpdate, updateDto, requestedPair);

        var ex = await act.Should().ThrowAsync<ValidationException>();
        ex.WithMessage("*Allocation already exists in Ward Wise.*");
    }

    #endregion
}