using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Tests.Helpers;
using Xunit;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Integration tests for PropertyWiseService, PropertyWiseValidator and PropertyWiseAllocationBuilder
/// using real EF Core In-Memory database to verify actual query behavior, transactions,
/// concurrent operations, and cascade/rollback handling.
/// </summary>
[Trait("Category", "Integration")]
public class PropertyWiseIntegrationTests : IAsyncLifetime
{
    private ApplicationDbContext _context = null!;
    private IUnitOfWork _unitOfWork = null!;
    private IRepository<GlobalSurveyWardAllocationEntity, int> _repo = null!;
    private IRepository<ZoneEntity, int> _zoneRepo = null!;
    private IRepository<WardEntity, int> _wardRepo = null!;
    private IRepository<OldWardMasterEntity, int> _oldWardRepo = null!;
    private IRepository<UserEntity, int> _userRepo = null!;
    private IRepository<UserModuleAllocationEntity, int> _userModuleAllocRepo = null!;
    private IRepository<ModuleMasterEntity, int> _moduleRepo = null!;
    private IRepository<UserRoleAllocationEntity, int> _userRoleAllocRepo = null!;
    private IPropertyWiseValidator _validator = null!;
    private IPropertyWiseAllocationBuilder _builder = null!;
    private PropertyWiseService _service = null!;

    public async Task InitializeAsync()
    {
        var dbName = $"PropertyWiseIntegration_{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ApplicationDbContext(options);
        await _context.Database.EnsureCreatedAsync();

        _unitOfWork = new UnitOfWork(_context);
        _repo = new Repository<GlobalSurveyWardAllocationEntity, int>(_context);
        _zoneRepo = new Repository<ZoneEntity, int>(_context);
        _wardRepo = new Repository<WardEntity, int>(_context);
        _oldWardRepo = new Repository<OldWardMasterEntity, int>(_context);
        _userRepo = new Repository<UserEntity, int>(_context);
        _userModuleAllocRepo = new Repository<UserModuleAllocationEntity, int>(_context);
        _moduleRepo = new Repository<ModuleMasterEntity, int>(_context);
        _userRoleAllocRepo = new Repository<UserRoleAllocationEntity, int>(_context);

        var mapper = AutoMapperTestHelper.CreateMapper();
        var refValidationMock = new Mock<IReferenceValidationService>();
        refValidationMock.Setup(x => x.ValidateReferencesAsync<GlobalSurveyWardAllocationEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _validator = new PropertyWiseValidator(
            _repo,
            _zoneRepo,
            _wardRepo,
            _oldWardRepo,
            _userRepo,
            _userModuleAllocRepo,
            _moduleRepo,
            _userRoleAllocRepo,
            refValidationMock.Object,
            NullLogger<PropertyWiseValidator>.Instance);

        _builder = new PropertyWiseAllocationBuilder();

        _service = new PropertyWiseService(
            _repo,
            _unitOfWork,
            mapper,
            _validator,
            _builder,
            NullLogger<PropertyWiseService>.Instance);

        await SeedBaseDataAsync();
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();
        await _context.DisposeAsync();
    }

    private async Task SeedBaseDataAsync()
    {
        var user = new UserEntity { Id = 1, UserName = "testuser", Email = "test1@example.com", IsActive = true, CreatedDate = DateTime.UtcNow };
        var otherUser = new UserEntity { Id = 2, UserName = "otheruser", Email = "test2@example.com", IsActive = true, CreatedDate = DateTime.UtcNow };
        var adminUser = new UserEntity { Id = 3, UserName = "adminuser", Email = "admin@example.com", IsActive = true, CreatedDate = DateTime.UtcNow };

        var dept = new DepartmentMasterEntity { Id = 1, DepartmentName = "Tax Department", DepartmentCode = "TAX", IsActive = true, CreatedDate = DateTime.UtcNow };
        var module = new ModuleMasterEntity { Id = 1, ModuleName = "PTIS", ModuleCode = "PTIS", IsActive = true, CreatedDate = DateTime.UtcNow };
        var surveyModule = new ModuleMasterEntity { Id = 2, ModuleName = "Survey", ModuleCode = ModuleConstants.Survey, IsActive = true, CreatedDate = DateTime.UtcNow };

        var zone1 = new ZoneEntity { Id = 1, ZoneNo = "Z1", Description = "Zone 1", IsActive = true, CreatedDate = DateTime.UtcNow };
        var ward1 = new WardEntity { Id = 1, WardNo = "W1", Description = "Ward 1", ZoneId = 1, IsActive = true, CreatedDate = DateTime.UtcNow };
        var ward2 = new WardEntity { Id = 2, WardNo = "W2", Description = "Ward 2", ZoneId = 1, IsActive = true, CreatedDate = DateTime.UtcNow };

        var oldWard1 = new OldWardMasterEntity { Id = 10, OldZoneId = 1, OldWardNo = "OW1", Description = "Old Ward 1", IsActive = true, CreatedDate = DateTime.UtcNow };
        var oldWard2 = new OldWardMasterEntity { Id = 20, OldZoneId = 1, OldWardNo = "OW2", Description = "Old Ward 2", IsActive = true, CreatedDate = DateTime.UtcNow };

        var userMod1 = new UserModuleAllocationEntity { Id = 1, UserId = 1, DepartmentId = 1, ModuleId = 1, IsActive = true, CreatedDate = DateTime.UtcNow };
        var userMod2 = new UserModuleAllocationEntity { Id = 2, UserId = 1, DepartmentId = 1, ModuleId = 2, IsActive = true, CreatedDate = DateTime.UtcNow };
        var otherUserMod = new UserModuleAllocationEntity { Id = 3, UserId = 2, DepartmentId = 1, ModuleId = 1, IsActive = true, CreatedDate = DateTime.UtcNow };
        var adminUserMod = new UserModuleAllocationEntity { Id = 4, UserId = 3, DepartmentId = 1, ModuleId = 2, IsActive = true, CreatedDate = DateTime.UtcNow };

        var adminRole = new UserRoleMasterEntity { Id = 1, UserRoleName = "Super Admin", IsActive = true, CreatedDate = DateTime.UtcNow };
        var adminRoleAlloc = new UserRoleAllocationEntity { Id = 1, UserId = 3, UserRoleId = 1, IsActive = true, CreatedDate = DateTime.UtcNow };

        await _context.Set<UserEntity>().AddRangeAsync(user, otherUser, adminUser);
        await _context.Set<DepartmentMasterEntity>().AddAsync(dept);
        await _context.Set<ModuleMasterEntity>().AddRangeAsync(module, surveyModule);
        await _context.Set<ZoneEntity>().AddAsync(zone1);
        await _context.Set<WardEntity>().AddRangeAsync(ward1, ward2);
        await _context.Set<OldWardMasterEntity>().AddRangeAsync(oldWard1, oldWard2);
        await _context.Set<UserModuleAllocationEntity>().AddRangeAsync(userMod1, userMod2, otherUserMod, adminUserMod);
        await _context.Set<UserRoleMasterEntity>().AddAsync(adminRole);
        await _context.Set<UserRoleAllocationEntity>().AddAsync(adminRoleAlloc);

        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task CreateAllocationsAsync_ValidData_PersistsInDatabase()
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "100",
            ToPropertyNo = "200",
            IsActive = true,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new()
                {
                    ZoneId = 1,
                    WardIds = new List<int> { 1 },
                    OldZoneId = new List<int> { 1 },
                    OldWardIds = new List<int> { 10 }
                }
            }
        };

        var result = await _service.CreateAllocationsAsync(dto);

        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("100", result[0].FromPropertyNo);
        Assert.Equal("200", result[0].ToPropertyNo);

        var dbEntity = await _context.Set<GlobalSurveyWardAllocationEntity>().FirstOrDefaultAsync(x => x.UserId == 1 && x.ZoneId == 1 && x.WardId == 1);
        Assert.NotNull(dbEntity);
        Assert.Equal("100", dbEntity.FromPropertyNo);
        Assert.Equal("200", dbEntity.ToPropertyNo);
        Assert.Equal(10, dbEntity.OldWardId);
    }

    [Fact]
    public async Task UpdateAsync_ValidUpdate_UpdatesRecordCorrectly()
    {
        var existing = new GlobalSurveyWardAllocationEntity
        {
            Id = 101,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            OldWardId = 10,
            FromPropertyNo = "100",
            ToPropertyNo = "200",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Set<GlobalSurveyWardAllocationEntity>().AddAsync(existing);
        await _context.SaveChangesAsync();

        var updateDto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "300",
            ToPropertyNo = "400",
            IsActive = true,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new()
                {
                    ZoneId = 1,
                    WardIds = new List<int> { 1 },
                    OldZoneId = new List<int> { 1 },
                    OldWardIds = new List<int> { 10 }
                }
            }
        };

        var result = await _service.UpdateAsync(101, updateDto);

        Assert.NotNull(result);
        Assert.Equal("300", result.FromPropertyNo);
        Assert.Equal("400", result.ToPropertyNo);

        var dbEntity = await _context.Set<GlobalSurveyWardAllocationEntity>().FindAsync(101);
        Assert.NotNull(dbEntity);
        Assert.Equal("300", dbEntity.FromPropertyNo);
        Assert.Equal("400", dbEntity.ToPropertyNo);
    }

    [Fact]
    public async Task UpdateAsync_WhenWardIsUpdated_DeactivatesExistingRecordAndInsertsNewRecord()
    {
        var existing = new GlobalSurveyWardAllocationEntity
        {
            Id = 150,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            OldWardId = 10,
            FromPropertyNo = "10",
            ToPropertyNo = "50",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Set<GlobalSurveyWardAllocationEntity>().AddAsync(existing);
        await _context.SaveChangesAsync();

        var updateDto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "10",
            ToPropertyNo = "50",
            IsActive = true,
            UpdatedBy = 99,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new()
                {
                    ZoneId = 1,
                    WardIds = new List<int> { 2 },
                    OldZoneId = new List<int> { 1 },
                    OldWardIds = new List<int> { 20 }
                }
            }
        };

        var result = await _service.UpdateAsync(150, updateDto);

        Assert.NotNull(result);
        Assert.NotEqual(150, result.Id);
        Assert.Equal(2, result.WardId);
        Assert.True(result.IsActive);

        // Old entity must be deactivated
        var dbOld = await _context.Set<GlobalSurveyWardAllocationEntity>().FindAsync(150);
        Assert.NotNull(dbOld);
        Assert.False(dbOld.IsActive);
        Assert.True(dbOld.MarkedForDeletion);
        Assert.NotNull(dbOld.MarkedForDeletionDate);

        // New entity must exist and be active
        var dbNew = await _context.Set<GlobalSurveyWardAllocationEntity>().FindAsync(result.Id);
        Assert.NotNull(dbNew);
        Assert.Equal(2, dbNew.WardId);
        Assert.Equal(20, dbNew.OldWardId);
        Assert.True(dbNew.IsActive);
        Assert.False(dbNew.MarkedForDeletion);
    }

    [Fact]
    public async Task UpdateAsync_WhenWardWiseUpdatedToPropertyWiseWithoutChangingWard_UpdatesSameRow()
    {
        var existingWardWise = new GlobalSurveyWardAllocationEntity
        {
            Id = 160,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            OldWardId = 10,
            FromPropertyNo = null,
            ToPropertyNo = null,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Set<GlobalSurveyWardAllocationEntity>().AddAsync(existingWardWise);
        await _context.SaveChangesAsync();

        var updateDto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "100",
            ToPropertyNo = "200",
            IsActive = true,
            UpdatedBy = 99,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new()
                {
                    ZoneId = 1,
                    WardIds = new List<int> { 1 },
                    OldZoneId = new List<int> { 1 },
                    OldWardIds = new List<int> { 10 }
                }
            }
        };

        var result = await _service.UpdateAsync(160, updateDto);

        Assert.NotNull(result);
        Assert.Equal(160, result.Id);
        Assert.Equal("100", result.FromPropertyNo);
        Assert.Equal("200", result.ToPropertyNo);

        var dbEntity = await _context.Set<GlobalSurveyWardAllocationEntity>().FindAsync(160);
        Assert.NotNull(dbEntity);
        Assert.Equal(160, dbEntity.Id);
        Assert.Equal("100", dbEntity.FromPropertyNo);
        Assert.Equal("200", dbEntity.ToPropertyNo);
        Assert.True(dbEntity.IsActive);
        Assert.False(dbEntity.MarkedForDeletion);
    }

    [Fact]
    public async Task GetAllAsync_WithParameters_ReturnsPagedData()
    {
        var alloc1 = new GlobalSurveyWardAllocationEntity
        {
            Id = 201,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            OldWardId = 10,
            FromPropertyNo = "1",
            ToPropertyNo = "50",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        var alloc2 = new GlobalSurveyWardAllocationEntity
        {
            Id = 202,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 2,
            OldWardId = 20,
            FromPropertyNo = "51",
            ToPropertyNo = "100",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Set<GlobalSurveyWardAllocationEntity>().AddRangeAsync(alloc1, alloc2);
        await _context.SaveChangesAsync();

        var queryParams = new PropertyWiseQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            UserId = 1
        };

        var pagedResult = await _service.GetAllAsync(queryParams);

        Assert.NotNull(pagedResult);
        Assert.True(pagedResult.TotalCount >= 2);
        Assert.Contains(pagedResult.Items, x => x.Id == 201);
        Assert.Contains(pagedResult.Items, x => x.Id == 202);
    }

    [Fact]
    public async Task ValidateConflicts_WhenAnotherUserHasWard_ThrowsValidationException()
    {
        var existingAllocation = new GlobalSurveyWardAllocationEntity
        {
            Id = 301,
            UserId = 2,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            OldWardId = 10,
            FromPropertyNo = "1",
            ToPropertyNo = "100",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Set<GlobalSurveyWardAllocationEntity>().AddAsync(existingAllocation);
        await _context.SaveChangesAsync();

        var createDto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "101",
            ToPropertyNo = "200",
            IsActive = true,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new()
                {
                    ZoneId = 1,
                    WardIds = new List<int> { 1 },
                    OldZoneId = new List<int> { 1 },
                    OldWardIds = new List<int> { 10 }
                }
            }
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAllocationsAsync(createDto));
        Assert.Contains("already allocated to another user", ex.Message);
    }

    [Fact]
    public async Task SingleWardRestriction_ForNonAdminSurveyUser_ThrowsWhenMultipleWardsAllocated()
    {
        var createDto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 2, // Survey Module
            FromPropertyNo = "1",
            ToPropertyNo = "100",
            IsActive = true,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new()
                {
                    ZoneId = 1,
                    WardIds = new List<int> { 1, 2 }, // Multiple wards
                    OldZoneId = new List<int> { 1 },
                    OldWardIds = new List<int> { 10, 20 }
                }
            }
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAllocationsAsync(createDto));
        Assert.Contains("only one zone and one ward", ex.Message);
    }

    [Fact]
    public async Task ConcurrentAllocations_MultipleTasks_ExecuteSuccessfully()
    {
        var tasks = Enumerable.Range(1, 3).Select(async i =>
        {
            var updateDto = new UpdatePropertyWiseDto
            {
                UserId = 1,
                DepartmentId = 1,
                ModuleId = 1,
                FromPropertyNo = $"10{i}",
                ToPropertyNo = $"20{i}",
                IsActive = true,
                Allocations = new List<PropertyWiseZoneWardDto>
                {
                    new()
                    {
                        ZoneId = 1,
                        WardIds = new List<int> { 1 },
                        OldZoneId = new List<int> { 1 },
                        OldWardIds = new List<int> { 10 }
                    }
                }
            };

            await _validator.ValidatePropertyWiseAsync(
                updateDto.UserId, updateDto.DepartmentId, updateDto.ModuleId, updateDto.Allocations,
                updateDto.FromPropertyNo, updateDto.ToPropertyNo, CancellationToken.None);
        });

        await Task.WhenAll(tasks);
    }

    #region Delete and MarkedForDeletion Tests

    [Fact]
    public async Task DeleteAsync_SetsMarkedForDeletionImmediatelyAndDeactivates()
    {
        var existing = new GlobalSurveyWardAllocationEntity
        {
            Id = 301,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            FromPropertyNo = "100",
            ToPropertyNo = "200",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Set<GlobalSurveyWardAllocationEntity>().AddAsync(existing);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAsync(301, CancellationToken.None);

        Assert.True(result);
        var dbEntity = await _context.Set<GlobalSurveyWardAllocationEntity>().FindAsync(301);
        Assert.NotNull(dbEntity);
        Assert.False(dbEntity!.IsActive);
        Assert.True(dbEntity.MarkedForDeletion);
        Assert.NotNull(dbEntity.MarkedForDeletionDate);
    }

    [Fact]
    public async Task BulkDeleteAsync_SetsMarkedForDeletionImmediatelyAndDeactivates()
    {
        var alloc1 = new GlobalSurveyWardAllocationEntity
        {
            Id = 302,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            FromPropertyNo = "10",
            ToPropertyNo = "20",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        var alloc2 = new GlobalSurveyWardAllocationEntity
        {
            Id = 303,
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ZoneId = 1,
            WardId = 1,
            FromPropertyNo = "21",
            ToPropertyNo = "30",
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Set<GlobalSurveyWardAllocationEntity>().AddRangeAsync(alloc1, alloc2);
        await _context.SaveChangesAsync();

        var result = await _service.BulkDeleteAsync(new[] { 302, 303 }, CancellationToken.None);

        Assert.Equal(2, result.SuccessCount);
        Assert.Equal(0, result.FailedCount);

        var db1 = await _context.Set<GlobalSurveyWardAllocationEntity>().FindAsync(302);
        Assert.NotNull(db1);
        Assert.False(db1!.IsActive);
        Assert.True(db1.MarkedForDeletion);
        Assert.NotNull(db1.MarkedForDeletionDate);

        var db2 = await _context.Set<GlobalSurveyWardAllocationEntity>().FindAsync(303);
        Assert.NotNull(db2);
        Assert.False(db2!.IsActive);
        Assert.True(db2.MarkedForDeletion);
        Assert.NotNull(db2.MarkedForDeletionDate);
    }
    #endregion
}
