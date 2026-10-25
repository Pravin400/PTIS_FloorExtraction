using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class PropertyWiseServiceTests
{
    private readonly Mock<IRepository<GlobalSurveyWardAllocationEntity, int>> _repoMock;
    private readonly Mock<IRepository<ZoneEntity, int>> _zoneRepoMock;
    private readonly Mock<IRepository<OldWardMasterEntity, int>> _oldWardRepoMock;
    private readonly Mock<IRepository<WardEntity, int>> _wardRepoMock;
    private readonly Mock<IRepository<UserEntity, int>> _userRepoMock;
    private readonly Mock<IRepository<UserModuleAllocationEntity, int>> _userModuleAllocRepoMock;
    private readonly Mock<IRepository<ModuleMasterEntity, int>> _moduleRepoMock;
    private readonly Mock<IRepository<UserRoleAllocationEntity, int>> _userRoleAllocRepoMock;
    private readonly Mock<IRepository<UserRoleMasterEntity, int>> _userRoleMasterRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IReferenceValidationService> _referenceValidationMock;
    private readonly Mock<ILogger<PropertyWiseValidator>> _validatorLoggerMock;
    private readonly Mock<ILogger<PropertyWiseService>> _loggerMock;
    private readonly PropertyWiseValidator _validator;
    private readonly PropertyWiseAllocationBuilder _allocationBuilder;
    private readonly PropertyWiseService _service;

    public PropertyWiseServiceTests()
    {
        _repoMock = new Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>();
        _zoneRepoMock = new Mock<IRepository<ZoneEntity, int>>();
        _oldWardRepoMock = new Mock<IRepository<OldWardMasterEntity, int>>();
        _wardRepoMock = new Mock<IRepository<WardEntity, int>>();
        _userRepoMock = new Mock<IRepository<UserEntity, int>>();
        _userModuleAllocRepoMock = new Mock<IRepository<UserModuleAllocationEntity, int>>();
        _moduleRepoMock = new Mock<IRepository<ModuleMasterEntity, int>>();
        _userRoleAllocRepoMock = new Mock<IRepository<UserRoleAllocationEntity, int>>();
        _userRoleMasterRepoMock = new Mock<IRepository<UserRoleMasterEntity, int>>();
        _uowMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _referenceValidationMock = new Mock<IReferenceValidationService>();
        _validatorLoggerMock = new Mock<ILogger<PropertyWiseValidator>>();
        _loggerMock = new Mock<ILogger<PropertyWiseService>>();

        _uowMock
            .Setup(x => x.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _uowMock
            .Setup(x => x.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _uowMock
            .Setup(x => x.RollbackTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _uowMock
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _repoMock.Setup(x => x.GetQueryable()).Returns(() => new List<GlobalSurveyWardAllocationEntity>().BuildMock<GlobalSurveyWardAllocationEntity>());
        _zoneRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<ZoneEntity>().BuildMock<ZoneEntity>());
        _oldWardRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<OldWardMasterEntity>().BuildMock<OldWardMasterEntity>());
        _wardRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<WardEntity>().BuildMock<WardEntity>());
        _userRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<UserEntity>
        {
            new() { Id = 1, UserName = "user1", IsActive = true, MarkedForDeletion = false },
            new() { Id = 10, UserName = "user10", IsActive = true, MarkedForDeletion = false }
        }.BuildMock<UserEntity>());
        _userRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int id, CancellationToken _) => new UserEntity { Id = id, UserName = $"user{id}", IsActive = true, MarkedForDeletion = false });
        _moduleRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int id, CancellationToken _) => new ModuleMasterEntity { Id = id, ModuleName = "Other", ModuleCode = "OTHER", IsActive = true });
        _userModuleAllocRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<UserModuleAllocationEntity>().BuildMock<UserModuleAllocationEntity>());
        _moduleRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<ModuleMasterEntity>().BuildMock<ModuleMasterEntity>());
        _userRoleAllocRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<UserRoleAllocationEntity>().BuildMock<UserRoleAllocationEntity>());
        _userRoleMasterRepoMock.Setup(x => x.GetQueryable()).Returns(() => new List<UserRoleMasterEntity>().BuildMock<UserRoleMasterEntity>());

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
            _validatorLoggerMock.Object);

        _allocationBuilder = new PropertyWiseAllocationBuilder();

        _service = new PropertyWiseService(
            _repoMock.Object,
            _uowMock.Object,
            _mapperMock.Object,
            _validator,
            _allocationBuilder,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateAsync_NullDto_ThrowsValidationException()
    {
        await Assert.ThrowsAsync<ValidationException>(
            () => _service.CreateAsync(null!, CancellationToken.None));
    }

    [Theory]
    [InlineData("", "10")]
    [InlineData("   ", "10")]
    [InlineData("null", "10")]
    public async Task CreateAsync_InvalidFromPropertyNo_ThrowsValidationException(string fromProp, string toProp)
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 2 } }
            }
        };

        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));
    }

    [Theory]
    [InlineData("1", "")]
    [InlineData("1", "   ")]
    [InlineData("1", "null")]
    public async Task CreateAsync_InvalidToPropertyNo_ThrowsValidationException(string fromProp, string toProp)
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 2 } }
            }
        };

        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));
    }

    [Theory]
    [InlineData("A23", "A50")]
    [InlineData("PROP-050", "PROP-100")]
    [InlineData("B12", "C99")]
    public async Task CreateAsync_AlphanumericPropertyNos_DoesNotThrowRangeValidationException(string fromProp, string toProp)
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp,
            Allocations = new List<PropertyWiseZoneWardDto>()
        };

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));

        Assert.Contains("At least one allocation is required", ex.Message);
    }

    [Theory]
    [InlineData("200", "100")]
    [InlineData("Z99", "A01")]
    [InlineData("PROP-100", "PROP-050")]
    public async Task CreateAsync_FromPropertyGreaterThanToProperty_ThrowsValidationException(string fromProp, string toProp)
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 2 } }
            }
        };

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));

        Assert.Contains("From Property No cannot be greater than To Property No.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_EmptyAllocations_ThrowsValidationException()
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "1",
            ToPropertyNo = "50",
            Allocations = new List<PropertyWiseZoneWardDto>()
        };

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));

        Assert.Contains("At least one allocation is required", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_SameWardAndOldWard_ThrowsValidationException()
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "1",
            ToPropertyNo = "50",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 5 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 5 } }
            }
        };

        _userModuleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 1, DepartmentId = 1, ModuleId = 1, IsActive = true }
            }.BuildMock<UserModuleAllocationEntity>());

        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock<GlobalSurveyWardAllocationEntity>());

        _wardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WardEntity>
            {
                new() { Id = 5, ZoneId = 1, IsActive = true }
            }.BuildMock<WardEntity>());

        var oldWards = new List<OldWardMasterEntity> { new() { Id = 5, OldZoneId = 1, IsActive = true } };
        _oldWardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(oldWards.BuildMock<OldWardMasterEntity>());

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));

        Assert.Contains("WardId 5 and OldWardId cannot be the same", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_MismatchedOldWardAndOldZone_ThrowsValidationException()
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "1",
            ToPropertyNo = "50",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 5 }, OldZoneId = new List<int> { 10 }, OldWardIds = new List<int> { 20 } }
            }
        };

        _userModuleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 1, DepartmentId = 1, ModuleId = 1, IsActive = true }
            }.BuildMock<UserModuleAllocationEntity>());

        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock<GlobalSurveyWardAllocationEntity>());

        _wardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WardEntity>
            {
                new() { Id = 5, ZoneId = 1, IsActive = true }
            }.BuildMock<WardEntity>());

        // OldWard 20 belongs to OldZone 99, but allocation specifies OldZone 10
        var oldWards = new List<OldWardMasterEntity> { new() { Id = 20, OldZoneId = 99, IsActive = true } };
        _oldWardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(oldWards.BuildMock<OldWardMasterEntity>());

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));

        Assert.Contains("do not belong to the selected OldZone(s)", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenOldWardIdsCountMismatch_ThrowsValidationException()
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "1",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 5, 6 }, OldZoneId = new List<int> { 10 }, OldWardIds = new List<int> { 20, 21, 22 } }
            }
        };

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(dto, CancellationToken.None));

        Assert.Contains("must either be 1 or match the number of WardIds", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ValidInput_CreatesAllocationsAndDeactivatesOld()
    {
        // Arrange
        var dto = new CreatePropertyWiseDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            FromPropertyNo = "1",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 101 }, OldZoneId = new List<int> { 10 }, OldWardIds = new List<int> { 501 } }
            },
            IsActive = true,
            CreatedBy = 99
        };

        _userModuleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 10, DepartmentId = 20, ModuleId = 30, IsActive = true }
            }.BuildMock<UserModuleAllocationEntity>());

        var existingEntities = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 1,
                UserId = 10,
                DepartmentId = 20,
                ModuleId = 30,
                ZoneId = 1,
                WardId = 101,
                OldWardId = 501,
                FromPropertyNo = "101",
                ToPropertyNo = "200",
                IsActive = true
            }
        };

        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(() => existingEntities.BuildMock<GlobalSurveyWardAllocationEntity>());

        _wardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WardEntity>
            {
                new() { Id = 101, ZoneId = 1, IsActive = true }
            }.BuildMock<WardEntity>());

        var oldWards = new List<OldWardMasterEntity>
        {
            new() { Id = 501, OldZoneId = 10, IsActive = true }
        };

        _oldWardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(oldWards.BuildMock<OldWardMasterEntity>());

        _userModuleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 10, ModuleId = 30, DepartmentId = 20, IsActive = true }
            }.BuildMock<UserModuleAllocationEntity>());

        _moduleRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<ModuleMasterEntity>
            {
                new() { Id = 30, ModuleName = "Other", IsActive = true }
            }.BuildMock<ModuleMasterEntity>());

        _userRoleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserRoleAllocationEntity>().BuildMock<UserRoleAllocationEntity>());

        _userRoleMasterRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserRoleMasterEntity>().BuildMock<UserRoleMasterEntity>());

        var addedList = new List<GlobalSurveyWardAllocationEntity>();
        _repoMock
            .Setup(x => x.AddAsync(It.IsAny<GlobalSurveyWardAllocationEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlobalSurveyWardAllocationEntity e, CancellationToken _) =>
            {
                e.Id = 100;
                addedList.Add(e);
                return e;
            });

        _mapperMock
            .Setup(m => m.Map<PropertyWiseDto>(It.IsAny<GlobalSurveyWardAllocationEntity>()))
            .Returns(new PropertyWiseDto { Id = 100, UserId = 10, FromPropertyNo = "1", ToPropertyNo = "100" });

        _mapperMock
            .Setup(m => m.Map<List<PropertyWiseDto>>(It.IsAny<List<GlobalSurveyWardAllocationEntity>>()))
            .Returns(new List<PropertyWiseDto> { new() { Id = 100, UserId = 10, FromPropertyNo = "1", ToPropertyNo = "100" } });

        // Act
        var result = await _service.CreateAsync(dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100, result.Id);
        Assert.True(existingEntities[0].IsActive);
        Assert.Equal("1", existingEntities[0].FromPropertyNo);
        Assert.Equal("100", existingEntities[0].ToPropertyNo);
        _repoMock.Verify(x => x.UpdateRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAllocationsAsync_WithMultipleAllocations_ReturnsAllCreatedAllocations()
    {
        // Arrange
        var dto = new CreatePropertyWiseDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            FromPropertyNo = "1",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 101, 102 }, OldZoneId = new List<int> { 10, 10 }, OldWardIds = new List<int> { 501, 502 } }
            },
            IsActive = true
        };

        _userModuleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 10, DepartmentId = 20, ModuleId = 30, IsActive = true }
            }.BuildMock<UserModuleAllocationEntity>());

        var entitiesInDb = new List<GlobalSurveyWardAllocationEntity>();

        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(() => entitiesInDb.BuildMock<GlobalSurveyWardAllocationEntity>());

        _wardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WardEntity>
            {
                new() { Id = 101, ZoneId = 1, IsActive = true },
                new() { Id = 102, ZoneId = 1, IsActive = true }
            }.BuildMock<WardEntity>());

        var oldWards = new List<OldWardMasterEntity>
        {
            new() { Id = 501, OldZoneId = 10, IsActive = true },
            new() { Id = 502, OldZoneId = 10, IsActive = true }
        };

        _oldWardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(oldWards.BuildMock<OldWardMasterEntity>());

        _moduleRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<ModuleMasterEntity>
            {
                new() { Id = 30, ModuleName = "Other", IsActive = true }
            }.BuildMock<ModuleMasterEntity>());

        _userRoleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserRoleAllocationEntity>().BuildMock<UserRoleAllocationEntity>());

        _userRoleMasterRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserRoleMasterEntity>().BuildMock<UserRoleMasterEntity>());

        _repoMock
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<GlobalSurveyWardAllocationEntity>, CancellationToken>((entities, _) =>
            {
                foreach (var e in entities)
                {
                    e.Id = entitiesInDb.Count + 1;
                    entitiesInDb.Add(e);
                }
            })
            .Returns(Task.CompletedTask);

        _mapperMock
            .Setup(m => m.Map<List<PropertyWiseDto>>(It.IsAny<List<GlobalSurveyWardAllocationEntity>>()))
            .Returns((List<GlobalSurveyWardAllocationEntity> src) => src.Select(e => new PropertyWiseDto { Id = e.Id, UserId = e.UserId, WardId = e.WardId }).ToList());

        // Act
        var result = await _service.CreateAllocationsAsync(dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(entitiesInDb, e => e.WardId == 101 && e.OldWardId == 501);
        Assert.Contains(entitiesInDb, e => e.WardId == 102 && e.OldWardId == 502);
        _repoMock.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenEntityNotFound_ReturnsNull()
    {
        _repoMock
            .Setup(x => x.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlobalSurveyWardAllocationEntity?)null);

        var result = await _service.UpdateAsync(999, new UpdatePropertyWiseDto(), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_WhenAllocationsEmpty_ThrowsValidationException()
    {
        var existing = new GlobalSurveyWardAllocationEntity { Id = 1, UserId = 10 };
        _repoMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var dto = new UpdatePropertyWiseDto
        {
            UserId = 10,
            Allocations = new List<PropertyWiseZoneWardDto>()
        };

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.UpdateAsync(1, dto, CancellationToken.None));

        Assert.Contains("Exactly one", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WhenMultiplePairsProvided_ThrowsValidationException()
    {
        var existing = new GlobalSurveyWardAllocationEntity { Id = 1, UserId = 10 };
        _repoMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var dto = new UpdatePropertyWiseDto
        {
            UserId = 10,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1, 2 } }
            }
        };

        var ex = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.UpdateAsync(1, dto, CancellationToken.None));

        Assert.Contains("Exactly one zone, ward, and old ward allocation is required", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WhenDuplicatePropertyWiseExists_ThrowsValidationException()
    {
        // Arrange
        var existing = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            ZoneId = 1,
            WardId = 101,
            OldWardId = 501,
            FromPropertyNo = "1",
            ToPropertyNo = "50",
            IsActive = true
        };

        _repoMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var dto = new UpdatePropertyWiseDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            FromPropertyNo = "1",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 101 }, OldZoneId = new List<int> { 10 }, OldWardIds = new List<int> { 501 } }
            },
            IsActive = true
        };

        _userModuleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 10, DepartmentId = 20, ModuleId = 30, IsActive = true }
            }.BuildMock<UserModuleAllocationEntity>());

        _wardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WardEntity>
            {
                new() { Id = 101, ZoneId = 1, IsActive = true }
            }.BuildMock<WardEntity>());

        _oldWardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<OldWardMasterEntity>
            {
                new() { Id = 501, OldZoneId = 10, IsActive = true }
            }.BuildMock<OldWardMasterEntity>());

        _moduleRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<ModuleMasterEntity>
            {
                new() { Id = 30, ModuleName = "Other", IsActive = true }
            }.BuildMock<ModuleMasterEntity>());

        // Another record with ID 2 has the exact same properties
        var existingRecords = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 2,
                UserId = 10,
                DepartmentId = 20,
                ModuleId = 30,
                ZoneId = 1,
                WardId = 101,
                OldWardId = 501,
                FromPropertyNo = "1",
                ToPropertyNo = "100",
                IsActive = true
            }
        };

        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(() => existingRecords.BuildMock<GlobalSurveyWardAllocationEntity>());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateAsync(1, dto, CancellationToken.None));

        Assert.Contains("This Property Wise allocation already exists", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_ValidInput_UpdatesAndReturnsDto()
    {
        // Arrange
        var existing = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            ZoneId = 1,
            WardId = 101,
            OldWardId = 501,
            FromPropertyNo = "1",
            ToPropertyNo = "50",
            IsActive = true
        };

        _repoMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var dto = new UpdatePropertyWiseDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            FromPropertyNo = "1",
            ToPropertyNo = "100",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 101 }, OldZoneId = new List<int> { 10 }, OldWardIds = new List<int> { 501 } }
            },
            IsActive = true,
            UpdatedBy = 99
        };

        _userModuleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserModuleAllocationEntity>
            {
                new() { UserId = 10, DepartmentId = 20, ModuleId = 30, IsActive = true }
            }.BuildMock<UserModuleAllocationEntity>());

        _wardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WardEntity>
            {
                new() { Id = 101, ZoneId = 1, IsActive = true }
            }.BuildMock<WardEntity>());

        _oldWardRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<OldWardMasterEntity>
            {
                new() { Id = 501, OldZoneId = 10, IsActive = true }
            }.BuildMock<OldWardMasterEntity>());

        _moduleRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<ModuleMasterEntity>
            {
                new() { Id = 30, ModuleName = "Other", IsActive = true }
            }.BuildMock<ModuleMasterEntity>());

        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(() => new List<GlobalSurveyWardAllocationEntity>().BuildMock<GlobalSurveyWardAllocationEntity>());

        _mapperMock
            .Setup(m => m.Map<PropertyWiseDto>(It.IsAny<GlobalSurveyWardAllocationEntity>()))
            .Returns((GlobalSurveyWardAllocationEntity src) => new PropertyWiseDto
            {
                Id = src.Id,
                UserId = src.UserId,
                FromPropertyNo = src.FromPropertyNo,
                ToPropertyNo = src.ToPropertyNo,
                IsActive = src.IsActive
            });

        // Act
        var result = await _service.UpdateAsync(1, dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("1", result.FromPropertyNo);
        Assert.Equal("100", result.ToPropertyNo);
        _repoMock.Verify(x => x.UpdateAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_WhenEntityExists_ReturnsMappedDto()
    {
        // Arrange
        var entity = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            ZoneId = 1,
            WardId = 2,
            OldWardId = 3,
            FromPropertyNo = "1",
            ToPropertyNo = "50",
            IsActive = true
        };

        var entities = new List<GlobalSurveyWardAllocationEntity> { entity };
        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(entities.BuildMock<GlobalSurveyWardAllocationEntity>());

        var expectedDto = new PropertyWiseDto { Id = 1, UserId = 10, EmployeeName = "Test" };
        _mapperMock
            .Setup(m => m.Map<PropertyWiseDto>(entity))
            .Returns(expectedDto);

        // Act
        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Test", result.EmployeeName);
    }

    [Fact]
    public async Task GetByIdAsync_WhenEntityDoesNotExist_ReturnsNull()
    {
        // Arrange
        var entities = new List<GlobalSurveyWardAllocationEntity>();
        _repoMock
            .Setup(x => x.GetQueryable())
            .Returns(entities.BuildMock<GlobalSurveyWardAllocationEntity>());

        // Act
        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_WhenEntityExists_SoftDeletesEntity()
    {
        // Arrange
        var entity = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 10,
            ZoneId = 1,
            WardId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            MarkedForDeletionDate = null
        };

        _repoMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _referenceValidationMock
            .Setup(x => x.ValidateReferencesAsync<GlobalSurveyWardAllocationEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        // Act
        var result = await _service.DeleteAsync(1, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.False(entity.IsActive);
        Assert.True(entity.MarkedForDeletion);
        Assert.NotNull(entity.MarkedForDeletionDate);
        _repoMock.Verify(x => x.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task BulkDeleteAsync_WhenEntitiesExist_SoftDeletesAll()
    {
        // Arrange
        var entity1 = new GlobalSurveyWardAllocationEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        var entity2 = new GlobalSurveyWardAllocationEntity { Id = 2, IsActive = true, MarkedForDeletion = false };

        _repoMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity1);
        _repoMock
            .Setup(x => x.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity2);

        _referenceValidationMock
            .Setup(x => x.ValidateReferencesAsync<GlobalSurveyWardAllocationEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        // Act
        var result = await _service.BulkDeleteAsync(new[] { 1, 2 }, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.SuccessCount);
        Assert.Equal(0, result.FailedCount);
        Assert.False(entity1.IsActive);
        Assert.True(entity1.MarkedForDeletion);
        Assert.NotNull(entity1.MarkedForDeletionDate);
        Assert.False(entity2.IsActive);
        Assert.True(entity2.MarkedForDeletion);
        Assert.NotNull(entity2.MarkedForDeletionDate);
        _repoMock.Verify(x => x.UpdateAsync(entity1, It.IsAny<CancellationToken>()), Times.Once);
        _repoMock.Verify(x => x.UpdateAsync(entity2, It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
