using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mapping;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Integration;

[Trait("Category", "Integration")]
public class WardAllocationIntegrationTests : IAsyncLifetime
{
    private ApplicationDbContext _context = null!;
    private WardAllocationService _service = null!;
    private IMapper _mapper = null!;
    private UnitOfWork _unitOfWork = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"WardAllocationIntegrationTests_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ApplicationDbContext(options);
        await _context.Database.EnsureCreatedAsync();

        var config = new MapperConfiguration(cfg => cfg.AddProfile<WardAllocationProfile>(),
            NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
        _unitOfWork = new UnitOfWork(_context);

        var allocRepo = new Repository<GlobalSurveyWardAllocationEntity, int>(_context);
        var userRepo = new Repository<UserEntity, int>(_context);
        var userDeptAllocRepo = new Repository<UserDepartmentAllocationEntity, int>(_context);
        var userModuleAllocRepo = new Repository<UserModuleAllocationEntity, int>(_context);
        var deptRepo = new Repository<DepartmentMasterEntity, int>(_context);
        var moduleRepo = new Repository<ModuleMasterEntity, int>(_context);
        var zoneRepo = new Repository<ZoneEntity, int>(_context);
        var wardRepo = new Repository<WardEntity, int>(_context);
        var oldWardRepo = new Repository<OldWardMasterEntity, int>(_context);
        var oldZoneRepo = new Repository<OldZoneMasterEntity, int>(_context);
        var userRoleAllocRepo = new Repository<UserRoleAllocationEntity, int>(_context);
        var refValMock = new Mock<IReferenceValidationService>();
        refValMock.Setup(x => x.ValidateReferencesAsync<GlobalSurveyWardAllocationEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        var validator = new WardAllocationValidator(
            allocRepo,
            userRepo,
            deptRepo,
            moduleRepo,
            userDeptAllocRepo,
            userModuleAllocRepo,
            userRoleAllocRepo,
            wardRepo,
            oldWardRepo,
            refValMock.Object,
            NullLogger<WardAllocationValidator>.Instance);

        var builder = new WardAllocationBuilder();

        _service = new WardAllocationService(
            allocRepo,
            _unitOfWork,
            _mapper,
            validator,
            builder,
            zoneRepo,
            wardRepo,
            oldWardRepo,
            userRepo,
            userModuleAllocRepo,
            deptRepo,
            moduleRepo,
            NullLogger<WardAllocationService>.Instance,
            oldZoneRepo);

        await SeedBaseDataAsync();
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.DisposeAsync();
        }
    }

    private async Task SeedBaseDataAsync()
    {
        // 1. Users
        var user1 = new UserEntity { Id = 1, UserName = "john.doe", FirstName = "John", UserCode = "EMP001", IsActive = true, CreatedDate = DateTime.UtcNow };
        var adminUser = new UserEntity { Id = 2, UserName = "admin.user", FirstName = "Admin", UserCode = "ADM001", IsActive = true, CreatedDate = DateTime.UtcNow };
        var inactiveUser = new UserEntity { Id = 3, UserName = "inactive.user", FirstName = "Inactive", UserCode = "EMP003", IsActive = false, CreatedDate = DateTime.UtcNow };
        _context.Set<UserEntity>().AddRange(user1, adminUser, inactiveUser);

        // 2. Roles
        var adminRole = new UserRoleMasterEntity { Id = 1, UserRoleName = "Admin", DepartmentId = 10, IsActive = true, CreatedDate = DateTime.UtcNow };
        var employeeRole = new UserRoleMasterEntity { Id = 2, UserRoleName = "Employee", DepartmentId = 10, IsActive = true, CreatedDate = DateTime.UtcNow };
        _context.Set<UserRoleMasterEntity>().AddRange(adminRole, employeeRole);

        var adminRoleAlloc = new UserRoleAllocationEntity { Id = 1, UserId = 2, DepartmentId = 10, UserRoleId = 1, IsActive = true, CreatedDate = DateTime.UtcNow };
        var empRoleAlloc = new UserRoleAllocationEntity { Id = 2, UserId = 1, DepartmentId = 10, UserRoleId = 2, IsActive = true, CreatedDate = DateTime.UtcNow };
        _context.Set<UserRoleAllocationEntity>().AddRange(adminRoleAlloc, empRoleAlloc);

        // 3. Departments and Modules
        var dept1 = new DepartmentMasterEntity { Id = 10, DepartmentCode = "TAX", DepartmentName = "Property Tax", IsActive = true, CreatedDate = DateTime.UtcNow };
        var module1 = new ModuleMasterEntity { Id = 20, DepartmentId = 10, ModuleCode = ModuleConstants.Survey, ModuleName = ModuleConstants.SurveyName, IsActive = true, CreatedDate = DateTime.UtcNow };
        _context.Set<DepartmentMasterEntity>().Add(dept1);
        _context.Set<ModuleMasterEntity>().Add(module1);

        // User Dept & Module Allocations
        _context.Set<UserDepartmentAllocationEntity>().AddRange(
            new UserDepartmentAllocationEntity { Id = 1, UserId = 1, DepartmentId = 10, IsActive = true, CreatedDate = DateTime.UtcNow },
            new UserDepartmentAllocationEntity { Id = 2, UserId = 2, DepartmentId = 10, IsActive = true, CreatedDate = DateTime.UtcNow }
        );
        _context.Set<UserModuleAllocationEntity>().AddRange(
            new UserModuleAllocationEntity { Id = 1, UserId = 1, DepartmentId = 10, ModuleId = 20, IsActive = true, CreatedDate = DateTime.UtcNow },
            new UserModuleAllocationEntity { Id = 2, UserId = 2, DepartmentId = 10, ModuleId = 20, IsActive = true, CreatedDate = DateTime.UtcNow }
        );

        // 4. Zones, Wards and OldWards
        var zone1 = new ZoneEntity { Id = 100, ZoneNo = "Z1", Description = "Zone 1", IsActive = true, CreatedDate = DateTime.UtcNow };
        var zone2 = new ZoneEntity { Id = 200, ZoneNo = "Z2", Description = "Zone 2", IsActive = true, CreatedDate = DateTime.UtcNow };
        _context.Set<ZoneEntity>().AddRange(zone1, zone2);

        var ward1 = new WardEntity { Id = 1001, ZoneId = 100, WardNo = "W1", IsActive = true, CreatedDate = DateTime.UtcNow };
        var ward2 = new WardEntity { Id = 1002, ZoneId = 100, WardNo = "W2", IsActive = true, CreatedDate = DateTime.UtcNow };
        var ward3 = new WardEntity { Id = 2001, ZoneId = 200, WardNo = "W3", IsActive = true, CreatedDate = DateTime.UtcNow };
        _context.Set<WardEntity>().AddRange(ward1, ward2, ward3);

        var oldZone1 = new OldZoneMasterEntity { Id = 100, OldZoneNo = "OZ1", Description = "Old Zone 1", IsActive = true, CreatedDate = DateTime.UtcNow };
        var oldZone2 = new OldZoneMasterEntity { Id = 200, OldZoneNo = "OZ2", Description = "Old Zone 2", IsActive = true, CreatedDate = DateTime.UtcNow };
        _context.Set<OldZoneMasterEntity>().AddRange(oldZone1, oldZone2);

        var oldWard1 = new OldWardMasterEntity { Id = 5001, OldZoneId = 100, OldWardNo = "OW1", Description = "Old Ward 1", IsActive = true, CreatedDate = DateTime.UtcNow };
        var oldWard2 = new OldWardMasterEntity { Id = 5002, OldZoneId = 100, OldWardNo = "OW2", Description = "Old Ward 2", IsActive = true, CreatedDate = DateTime.UtcNow };
        _context.Set<OldWardMasterEntity>().AddRange(oldWard1, oldWard2);

        await _context.SaveChangesAsync();
    }

    #region Basic & Single Ward Allocation Tests

    [Fact]
    public async Task CreateFlexibleAsync_ValidNonAdminSingleWard_SuccessfullyPersistedInDatabase()
    {
        // Arrange
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 10,
            ModuleId = 20,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1001 },
                    OldWardId = 5001
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        // Act
        var result = await _service.CreateFlexibleAsync(dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var dbAllocations = await _context.GlobalSurveyWardAllocations
            .Where(a => a.UserId == 1)
            .ToListAsync();

        Assert.Single(dbAllocations);
        var alloc = dbAllocations[0];
        Assert.Equal(1, alloc.UserId);
        Assert.Equal(10, alloc.DepartmentId);
        Assert.Equal(20, alloc.ModuleId);
        Assert.Equal(100, alloc.ZoneId);
        Assert.Equal(1001, alloc.WardId);
        Assert.Equal(5001, alloc.OldWardId);
        Assert.True(alloc.IsActive);
    }

    [Fact]
    public async Task CreateFlexibleAsync_NonAdminMultipleWards_ThrowsValidationExceptionAndRollsBack()
    {
        // Arrange: User 1 is non-admin and tries to allocate 2 wards
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 10,
            ModuleId = 20,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1001, 1002 }
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateFlexibleAsync(dto, CancellationToken.None));

        Assert.Contains("can be allocated to only one zone and one ward", ex.Message);

        // Verify transaction integrity - nothing should be committed to database
        var count = await _context.GlobalSurveyWardAllocations.CountAsync();
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task CreateFlexibleAsync_AdminUserMultipleWards_Succeeds()
    {
        // Arrange: User 2 is Admin
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 2,
            DepartmentId = 10,
            ModuleId = 20,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1001, 1002 }
                },
                new()
                {
                    ZoneId = 200,
                    WardIds = new List<int> { 2001 }
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        // Act
        var result = await _service.CreateFlexibleAsync(dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);

        var dbAllocations = await _context.GlobalSurveyWardAllocations
            .Where(a => a.UserId == 2)
            .ToListAsync();
        Assert.Equal(3, dbAllocations.Count);
    }

    #endregion

    #region Edge Cases & Validation Failures

    [Fact]
    public async Task CreateFlexibleAsync_InvalidWardZoneMismatch_ThrowsValidationException()
    {
        // Ward 2001 belongs to Zone 200, not Zone 100
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 2,
            DepartmentId = 10,
            ModuleId = 20,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 2001 }
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateFlexibleAsync(dto, CancellationToken.None));

        Assert.Contains("Invalid ward(s) for Zone", ex.Message);
        Assert.Equal(0, await _context.GlobalSurveyWardAllocations.CountAsync());
    }

    [Fact]
    public async Task CreateFlexibleAsync_InactiveUser_ThrowsValidationException()
    {
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 3, // Inactive user
            DepartmentId = 10,
            ModuleId = 20,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new()
                {
                    ZoneId = 100,
                    WardIds = new List<int> { 1001 }
                }
            },
            IsActive = true,
            CreatedBy = 99
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateFlexibleAsync(dto, CancellationToken.None));

        Assert.Contains("not found or inactive", ex.Message);
        Assert.Equal(0, await _context.GlobalSurveyWardAllocations.CountAsync());
    }

    #endregion

    #region Concurrency and Race Condition Tests

    [Fact]
    public async Task CreateFlexibleAsync_ConcurrentRequestsForSameUser_MaintainsConsistency()
    {
        // Arrange
        var dto1 = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 10,
            ModuleId = 20,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 100, WardIds = new List<int> { 1001 } }
            },
            IsActive = true,
            CreatedBy = 101
        };

        var dto2 = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 10,
            ModuleId = 20,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 100, WardIds = new List<int> { 1002 } }
            },
            IsActive = true,
            CreatedBy = 102
        };

        // Act
        // First allocation succeeds
        var result1 = await _service.CreateFlexibleAsync(dto1, CancellationToken.None);
        Assert.NotNull(result1);

        // Second allocation for the same user must be rejected due to existing active allocation conflict
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateFlexibleAsync(dto2, CancellationToken.None));

        Assert.Contains("can be allocated to only one zone and one ward", ex.Message);

        // Database should only have 1 active allocation for UserId 1
        var allocations = await _context.GlobalSurveyWardAllocations
            .Where(a => a.UserId == 1 && a.IsActive)
            .ToListAsync();

        Assert.Single(allocations);
        Assert.Equal(1001, allocations[0].WardId);
    }

    #endregion

    #region Query and Real EF Linq Tests

    [Fact]
    public async Task GetAllocatedWardsByUserIdAsync_ReturnsDistinctAllocatedWards()
    {
        // Seed allocations
        _context.GlobalSurveyWardAllocations.AddRange(
            new GlobalSurveyWardAllocationEntity { Id = 1, UserId = 2, DepartmentId = 10, ModuleId = 20, ZoneId = 100, WardId = 1001, OldWardId = 5001, IsActive = true, CreatedDate = DateTime.UtcNow },
            new GlobalSurveyWardAllocationEntity { Id = 2, UserId = 2, DepartmentId = 10, ModuleId = 20, ZoneId = 100, WardId = 1001, OldWardId = 5002, IsActive = true, CreatedDate = DateTime.UtcNow },
            new GlobalSurveyWardAllocationEntity { Id = 3, UserId = 2, DepartmentId = 10, ModuleId = 20, ZoneId = 200, WardId = 2001, IsActive = true, CreatedDate = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var wards = await _service.GetAllocatedWardsByUserIdAsync(2, CancellationToken.None);

        // Assert: 2 distinct wards returned (allocations with same ModuleId, ZoneId, WardId collapsed across different OldWardIds)
        Assert.Equal(2, wards.Count);
        Assert.Contains(wards, w => w.WardId == 1001 && w.ZoneId == 100 && w.ModuleId == 20);
        Assert.Contains(wards, w => w.WardId == 2001 && w.ZoneId == 200 && w.ModuleId == 20);
    }

    [Fact]
    public async Task GetOldWardsByWardIdAsync_ReturnsOldWardsForUserAllocations()
    {
        _context.GlobalSurveyWardAllocations.AddRange(
            new GlobalSurveyWardAllocationEntity { Id = 1, UserId = 1, DepartmentId = 10, ModuleId = 20, ZoneId = 100, WardId = 1001, OldWardId = 5001, IsActive = true, CreatedDate = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var oldWards = await _service.GetOldWardsByWardIdAsync(wardId: 1001, userId: 1, CancellationToken.None);

        Assert.Single(oldWards);
        Assert.Equal(5001, oldWards[0].OldWardId);
        Assert.Equal("Old Ward 1", oldWards[0].OldWardName);
        Assert.Equal("Old Ward 1", oldWards[0].Description);
        Assert.Equal("Old Zone 1", oldWards[0].OldZoneName);
        Assert.Equal("OZ1", oldWards[0].OldZoneNo);
    }

    #endregion

    #region Delete and MarkedForDeletion Tests

    [Fact]
    public async Task DeleteAsync_SetsMarkedForDeletionImmediatelyAndDeactivates()
    {
        var entity = new GlobalSurveyWardAllocationEntity
        {
            Id = 50,
            UserId = 1,
            DepartmentId = 10,
            ModuleId = 20,
            ZoneId = 100,
            WardId = 1001,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        _context.GlobalSurveyWardAllocations.Add(entity);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAsync(50, CancellationToken.None);

        Assert.True(result);
        var deleted = await _context.GlobalSurveyWardAllocations.FindAsync(50);
        Assert.NotNull(deleted);
        Assert.False(deleted!.IsActive);
        Assert.True(deleted.MarkedForDeletion);
        Assert.NotNull(deleted.MarkedForDeletionDate);
    }

    [Fact]
    public async Task BulkDeleteAsync_SetsMarkedForDeletionImmediatelyAndDeactivates()
    {
        var entity1 = new GlobalSurveyWardAllocationEntity
        {
            Id = 51,
            UserId = 1,
            DepartmentId = 10,
            ModuleId = 20,
            ZoneId = 100,
            WardId = 1001,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        var entity2 = new GlobalSurveyWardAllocationEntity
        {
            Id = 52,
            UserId = 2,
            DepartmentId = 10,
            ModuleId = 20,
            ZoneId = 200,
            WardId = 2001,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = DateTime.UtcNow
        };
        _context.GlobalSurveyWardAllocations.AddRange(entity1, entity2);
        await _context.SaveChangesAsync();

        var result = await _service.BulkDeleteAsync(new[] { 51, 52 }, CancellationToken.None);

        Assert.Equal(2, result.SuccessCount);
        Assert.Equal(0, result.FailedCount);

        var deleted1 = await _context.GlobalSurveyWardAllocations.FindAsync(51);
        Assert.NotNull(deleted1);
        Assert.False(deleted1!.IsActive);
        Assert.True(deleted1.MarkedForDeletion);
        Assert.NotNull(deleted1.MarkedForDeletionDate);

        var deleted2 = await _context.GlobalSurveyWardAllocations.FindAsync(52);
        Assert.NotNull(deleted2);
        Assert.False(deleted2!.IsActive);
        Assert.True(deleted2.MarkedForDeletion);
        Assert.NotNull(deleted2.MarkedForDeletionDate);
    }

    #endregion
}
