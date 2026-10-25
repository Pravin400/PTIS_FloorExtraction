using AutoMapper;
using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
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

public class WardAllocationServiceTests
{
    private readonly Mock<IRepository<GlobalSurveyWardAllocationEntity, int>> _repoMock;
    private readonly Mock<IRepository<UserEntity, int>> _userRepoMock;
    private readonly Mock<IRepository<UserDepartmentAllocationEntity, int>> _userDeptAllocRepoMock;
    private readonly Mock<IRepository<UserModuleAllocationEntity, int>> _userModuleAllocRepoMock;
    private readonly Mock<IRepository<DepartmentMasterEntity, int>> _deptRepoMock;
    private readonly Mock<IRepository<ModuleMasterEntity, int>> _moduleRepoMock;
    private readonly Mock<IRepository<ZoneEntity, int>> _zoneRepoMock;
    private readonly Mock<IRepository<WardEntity, int>> _wardRepoMock;
    private readonly Mock<IRepository<OldWardMasterEntity, int>> _oldWardRepoMock;
    private readonly Mock<IRepository<UserRoleAllocationEntity, int>> _userRoleAllocRepoMock;
    private readonly Mock<IRepository<UserRoleMasterEntity, int>> _userRoleMasterRepoMock;
    private readonly Mock<IReferenceValidationService> _referenceValidationMock;
    private readonly Mock<ILogger<WardAllocationService>> _loggerMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;

    private readonly WardAllocationService _service;

    public WardAllocationServiceTests()
    {
        _repoMock = new Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>();
        _userRepoMock = new Mock<IRepository<UserEntity, int>>();
        _userDeptAllocRepoMock = new Mock<IRepository<UserDepartmentAllocationEntity, int>>();
        _userModuleAllocRepoMock = new Mock<IRepository<UserModuleAllocationEntity, int>>();
        _deptRepoMock = new Mock<IRepository<DepartmentMasterEntity, int>>();
        _moduleRepoMock = new Mock<IRepository<ModuleMasterEntity, int>>();
        _zoneRepoMock = new Mock<IRepository<ZoneEntity, int>>();
        _wardRepoMock = new Mock<IRepository<WardEntity, int>>();
        _oldWardRepoMock = new Mock<IRepository<OldWardMasterEntity, int>>();
        _userRoleAllocRepoMock = new Mock<IRepository<UserRoleAllocationEntity, int>>();
        _userRoleMasterRepoMock = new Mock<IRepository<UserRoleMasterEntity, int>>();
        _referenceValidationMock = new Mock<IReferenceValidationService>();
        _loggerMock = new Mock<ILogger<WardAllocationService>>();
        _uowMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();

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

        _userRoleAllocRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(() => new List<UserRoleAllocationEntity>().BuildMock<UserRoleAllocationEntity>());

        _userRoleMasterRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(() => new List<UserRoleMasterEntity>().BuildMock<UserRoleMasterEntity>());

        _zoneRepoMock
            .Setup(x => x.GetQueryable())
            .Returns(() => new List<ZoneEntity>().BuildMock<ZoneEntity>());

        _mapperMock.Setup(m => m.Map<List<WardAllocationDto>>(It.IsAny<object>()))
            .Returns((object src) =>
            {
                if (src is IEnumerable<GlobalSurveyWardAllocationEntity> list)
                {
                    return list.Select(x => new WardAllocationDto
                    {
                        Id = x.Id,
                        UserId = x.UserId,
                        DepartmentId = x.DepartmentId,
                        ModuleId = x.ModuleId,
                        ZoneId = x.ZoneId,
                        WardId = x.WardId,
                        OldWardId = x.OldWardId,
                        IsActive = x.IsActive
                    }).ToList();
                }
                return new List<WardAllocationDto>();
            });

        var validator = new WardAllocationValidator(
            _repoMock.Object,
            _userRepoMock.Object,
            _deptRepoMock.Object,
            _moduleRepoMock.Object,
            _userDeptAllocRepoMock.Object,
            _userModuleAllocRepoMock.Object,
            _userRoleAllocRepoMock.Object,
            _wardRepoMock.Object,
            _oldWardRepoMock.Object,
            _referenceValidationMock.Object,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<WardAllocationValidator>.Instance);

        var builder = new WardAllocationBuilder();

        _service = new WardAllocationService(
            _repoMock.Object,
            _uowMock.Object,
            _mapperMock.Object,
            validator,
            builder,
            _zoneRepoMock.Object,
            _wardRepoMock.Object,
            _oldWardRepoMock.Object,
            _userRepoMock.Object,
            _userModuleAllocRepoMock.Object,
            _deptRepoMock.Object,
            _moduleRepoMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateFlexibleAsync_Succeeds_CreatesAllocations()
    {
        // Arrange
        var createDto = new CreateFlexibleWardAllocationDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1000 }
                },
                new()
                {
                    ZoneId = 200,
                    WardIds = new List<int> { 2000 }
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        SetupValidUserDepartmentModule(userId: 10, departmentId: 20, moduleId: 30);

        var wards = new List<WardEntity>
        {
            new() { Id = 1000, ZoneId = 100, IsActive = true },
            new() { Id = 2000, ZoneId = 200, IsActive = true }
        };

        _wardRepoMock.Setup(x => x.GetQueryable()).Returns(wards.BuildMock<WardEntity>());
        _oldWardRepoMock.Setup(x => x.GetQueryable()).Returns(new List<OldWardMasterEntity>().BuildMock<OldWardMasterEntity>());

        var added = new List<GlobalSurveyWardAllocationEntity>();
        var nextId = 1;

        _repoMock.Setup(x => x.GetQueryable()).Returns(() => added.BuildMock<GlobalSurveyWardAllocationEntity>());
        _repoMock
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()))
            .Returns((IEnumerable<GlobalSurveyWardAllocationEntity> entities, CancellationToken _) =>
            {
                foreach (var entity in entities)
                {
                    entity.Id = nextId++;
                    added.Add(entity);
                }
                return Task.CompletedTask;
            });
        _repoMock
            .Setup(x => x.AddAsync(It.IsAny<GlobalSurveyWardAllocationEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlobalSurveyWardAllocationEntity entity, CancellationToken _) =>
            {
                entity.Id = nextId++;
                added.Add(entity);
                return entity;
            });

        // Act
        var result = await _service.CreateFlexibleAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(2, added.Count);

        Assert.Contains(added, x => x.ZoneId == 100 && x.WardId == 1000);
        Assert.Contains(added, x => x.ZoneId == 200 && x.WardId == 2000);

        _repoMock.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task CreateFlexibleAsync_WhenExistingAllocations_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateFlexibleWardAllocationDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1000 }
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        SetupValidUserDepartmentModule(userId: 10, departmentId: 20, moduleId: 30);

        var wards = new List<WardEntity>
        {
            new() { Id = 1000, ZoneId = 100, IsActive = true }
        };

        _wardRepoMock.Setup(x => x.GetQueryable()).Returns(wards.BuildMock<WardEntity>());
        _oldWardRepoMock.Setup(x => x.GetQueryable()).Returns(new List<OldWardMasterEntity>().BuildMock<OldWardMasterEntity>());

        var existingAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 1,
                UserId = 10,
                DepartmentId = 20,
                ModuleId = 30,
                ZoneId = 100,
                WardId = 1000,
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        _repoMock.Setup(x => x.GetQueryable()).Returns(existingAllocations.BuildMock<GlobalSurveyWardAllocationEntity>());

        // Act + Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateFlexibleAsync(createDto, CancellationToken.None));

        _repoMock.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReplaceAllocationsAsync_UserModuleMismatch_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateFlexibleWardAllocationDto
        {
            UserId = 11,
            DepartmentId = 21,
            ModuleId = 31,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 1,
                    WardIds = new List<int> { 1 }
                }
            },
            UpdatedBy = 5
        };

        _repoMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlobalSurveyWardAllocationEntity { Id = 1, IsActive = true, MarkedForDeletion = false });

        // Act + Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.ReplaceAllocationsAsync(1, 99, 99, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_WhenWardChanged_DeactivatesExistingAndInsertsNewEntity()
    {
        // Arrange
        var existing = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            ZoneId = 1,
            WardId = 10,
            IsActive = true,
            MarkedForDeletion = false
        };

        _repoMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var updateDto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = 20,
            ModuleId = 30,
            ZoneId = 1,
            WardId = 5,
            IsActive = true,
            UpdatedBy = 99
        };

        GlobalSurveyWardAllocationEntity? addedEntity = null;
        _repoMock.Setup(x => x.AddAsync(It.IsAny<GlobalSurveyWardAllocationEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GlobalSurveyWardAllocationEntity, CancellationToken>((entity, _) =>
            {
                entity.Id = 2;
                addedEntity = entity;
            })
            .ReturnsAsync((GlobalSurveyWardAllocationEntity entity, CancellationToken _) => entity);

        _mapperMock.Setup(m => m.Map<WardAllocationDto>(It.IsAny<GlobalSurveyWardAllocationEntity>()))
            .Returns((GlobalSurveyWardAllocationEntity src) => new WardAllocationDto
            {
                Id = src.Id,
                ZoneId = src.ZoneId,
                WardId = src.WardId,
                IsActive = src.IsActive
            });

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.WardId);
        Assert.False(existing.IsActive);
        Assert.True(existing.MarkedForDeletion);
        Assert.NotNull(existing.MarkedForDeletionDate);
        Assert.NotNull(addedEntity);
        Assert.Equal(5, addedEntity.WardId);
        Assert.True(addedEntity.IsActive);
        Assert.False(addedEntity.MarkedForDeletion);
        _uowMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenWardUnchanged_UpdatesExistingEntityInPlace()
    {
        // Arrange
        var existing = new GlobalSurveyWardAllocationEntity
        {
            Id = 1,
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            ZoneId = 1,
            WardId = 10,
            IsActive = true,
            MarkedForDeletion = false,
            FromPropertyNo = "10",
            ToPropertyNo = "20"
        };

        _repoMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var updateDto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = 20,
            ModuleId = 30,
            ZoneId = 1,
            WardId = 10,
            IsActive = true,
            UpdatedBy = 99
        };

        _mapperMock.Setup(m => m.Map(updateDto, existing));
        _mapperMock.Setup(m => m.Map<WardAllocationDto>(existing))
            .Returns(new WardAllocationDto { Id = 1, WardId = 10, IsActive = true });

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Null(existing.FromPropertyNo);
        Assert.Null(existing.ToPropertyNo);
        _repoMock.Verify(x => x.UpdateAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _repoMock.Verify(x => x.AddAsync(It.IsAny<GlobalSurveyWardAllocationEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task IsUserDeallocatedAsync_ReturnsTrueAndFalse()
    {
        // Arrange
        _userRepoMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserEntity { Id = 1, MarkedForDeletion = true });
        _userRepoMock.Setup(x => x.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserEntity { Id = 2, MarkedForDeletion = false });

        // Act
        var result1 = await _service.IsUserDeallocatedAsync(1, CancellationToken.None);
        var result2 = await _service.IsUserDeallocatedAsync(2, CancellationToken.None);

        // Assert
        Assert.True(result1);
        Assert.False(result2);
    }

    [Fact]
    public async Task CreateFlexibleAsync_WithValidOldWard_SavesOldWardId()
    {
        // Arrange
        var createDto = new CreateFlexibleWardAllocationDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1000 },
                    OldWardId = 500
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        SetupValidUserDepartmentModule(userId: 10, departmentId: 20, moduleId: 30);

        var wards = new List<WardEntity>
        {
            new() { Id = 1000, ZoneId = 100, IsActive = true }
        };

        _wardRepoMock.Setup(x => x.GetQueryable()).Returns(wards.BuildMock<WardEntity>());

        var oldWards = new List<OldWardMasterEntity>
        {
            new()
            {
                Id = 500,
                OldWardNo = "10",
                Description = "Old Zone A",
                IsActive = true
            }
        };

        _oldWardRepoMock.Setup(x => x.GetQueryable()).Returns(oldWards.BuildMock<OldWardMasterEntity>());

        var added = new List<GlobalSurveyWardAllocationEntity>();
        var nextId = 1;
        _repoMock.Setup(x => x.GetQueryable()).Returns(() => added.BuildMock<GlobalSurveyWardAllocationEntity>());
        _repoMock
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()))
            .Returns((IEnumerable<GlobalSurveyWardAllocationEntity> entities, CancellationToken _) =>
            {
                foreach (var entity in entities)
                {
                    entity.Id = nextId++;
                    added.Add(entity);
                }
                return Task.CompletedTask;
            });
        _repoMock
            .Setup(x => x.AddAsync(It.IsAny<GlobalSurveyWardAllocationEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlobalSurveyWardAllocationEntity entity, CancellationToken _) =>
            {
                entity.Id = nextId++;
                added.Add(entity);
                return entity;
            });

        // Act
        var result = await _service.CreateFlexibleAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Single(added);
        Assert.Equal(500, added[0].OldWardId);
        Assert.Equal(100, added[0].ZoneId);
        Assert.Equal(1000, added[0].WardId);
    }

    [Fact]
    public async Task CreateFlexibleAsync_WithInvalidOldWard_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateFlexibleWardAllocationDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1000 },
                    OldWardId = 999
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        SetupValidUserDepartmentModule(userId: 10, departmentId: 20, moduleId: 30);

        var wards = new List<WardEntity>
        {
            new() { Id = 1000, ZoneId = 100, IsActive = true }
        };

        _wardRepoMock.Setup(x => x.GetQueryable()).Returns(wards.BuildMock<WardEntity>());
        _oldWardRepoMock.Setup(x => x.GetQueryable()).Returns(new List<OldWardMasterEntity>().BuildMock<OldWardMasterEntity>());
        _repoMock.Setup(x => x.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock<GlobalSurveyWardAllocationEntity>());

        // Act
        var exception = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateFlexibleAsync(createDto, CancellationToken.None));

        // Assert
        Assert.Contains("999", exception.Message);
        _repoMock.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateFlexibleAsync_WithInactiveOldWard_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateFlexibleWardAllocationDto
        {
            UserId = 10,
            DepartmentId = 20,
            ModuleId = 30,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1000 },
                    OldWardId = 500
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        SetupValidUserDepartmentModule(userId: 10, departmentId: 20, moduleId: 30);

        var wards = new List<WardEntity>
        {
            new() { Id = 1000, ZoneId = 100, IsActive = true }
        };

        _wardRepoMock.Setup(x => x.GetQueryable()).Returns(wards.BuildMock<WardEntity>());

        var oldWards = new List<OldWardMasterEntity>
        {
            new()
            {
                Id = 500,
                OldWardNo = "10",
                Description = "Old Zone A",
                IsActive = false
            }
        };

        _oldWardRepoMock.Setup(x => x.GetQueryable()).Returns(oldWards.BuildMock<OldWardMasterEntity>());
        _repoMock.Setup(x => x.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock<GlobalSurveyWardAllocationEntity>());

        // Act
        var exception = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateFlexibleAsync(createDto, CancellationToken.None));

        // Assert
        Assert.Contains("500", exception.Message);
        _repoMock.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<GlobalSurveyWardAllocationEntity>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #region Helpers

    private void SetupValidUserDepartmentModule(int userId, int departmentId, int moduleId)
    {
        var users = new List<UserEntity>
        {
            new() { Id = userId, IsActive = true, MarkedForDeletion = false }
        };

        _userRepoMock.Setup(x => x.GetQueryable()).Returns(users.BuildMock<UserEntity>());
        _userRepoMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserEntity { Id = userId, IsActive = true, MarkedForDeletion = false });

        var departments = new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, IsActive = true }
        };

        _deptRepoMock.Setup(x => x.GetQueryable()).Returns(departments.BuildMock<DepartmentMasterEntity>());
        _deptRepoMock.Setup(x => x.GetByIdAsync(departmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DepartmentMasterEntity { Id = departmentId, IsActive = true });

        var modules = new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, ModuleName = "Other", ModuleCode = "OTHER", IsActive = true }
        };

        _moduleRepoMock.Setup(x => x.GetQueryable()).Returns(modules.BuildMock<ModuleMasterEntity>());
        _moduleRepoMock.Setup(x => x.GetByIdAsync(moduleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ModuleMasterEntity { Id = moduleId, ModuleName = "Other", ModuleCode = "OTHER", IsActive = true });

        var departmentAllocations = new List<UserDepartmentAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, IsActive = true }
        };

        _userDeptAllocRepoMock.Setup(x => x.GetQueryable()).Returns(departmentAllocations.BuildMock<UserDepartmentAllocationEntity>());

        var moduleAllocations = new List<UserModuleAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, IsActive = true }
        };

        _userModuleAllocRepoMock.Setup(x => x.GetQueryable()).Returns(moduleAllocations.BuildMock<UserModuleAllocationEntity>());
    }

    #endregion

    #region Delete Tests

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
        _uowMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
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

    #endregion
}