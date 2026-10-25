using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.WaterBill;
using NtisPlatform.Application.Services.WaterBill;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.WaterBill;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Comprehensive unit and integration tests for DepartmentPortalConfigurationService.
/// Validates business rules, audit resolution, concurrency checks, active department enforcement, and model invariants.
/// </summary>
public class DepartmentPortalConfigurationServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Repository<DepartmentPortalConfigurationEntity, int> _repository;
    private readonly Repository<DepartmentMasterEntity, int> _departmentRepository;
    private readonly UnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly Mock<ICurrentUserService> _mockCurrentUser;
    private readonly DepartmentPortalConfigurationService _service;

    public DepartmentPortalConfigurationServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"DepartmentPortalConfigTests_{Guid.NewGuid()}")
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new Repository<DepartmentPortalConfigurationEntity, int>(_context);
        _departmentRepository = new Repository<DepartmentMasterEntity, int>(_context);
        _unitOfWork = new UnitOfWork(_context);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<DepartmentPortalConfigurationProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _mockCurrentUser = new Mock<ICurrentUserService>();
        _mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(42);

        _service = new DepartmentPortalConfigurationService(
            _repository,
            _departmentRepository,
            _unitOfWork,
            _mapper,
            _mockCurrentUser.Object
        );

        // Seed reference departments
        SeedDepartment(1, "WT", "Water Tax", isActive: true);
        SeedDepartment(2, "PTIS", "Property Tax", isActive: true);
        SeedDepartment(3, "INACT", "Inactive Dept", isActive: false);
    }

    private void SeedDepartment(int id, string code, string name, bool isActive)
    {
        _context.DepartmentMasters.Add(new DepartmentMasterEntity
        {
            Id = id,
            DepartmentCode = code,
            DepartmentName = name,
            IsActive = isActive,
            CreatedDate = DateTime.UtcNow
        });
        _context.SaveChanges();
    }

    private const string ValidJson = """
    {
        "portal": {
            "portalTitle": "Panvel Municipal Corporation",
            "portalSubTitle": "Water Bill Services",
            "departmentLogo": "/images/pmc-logo.png"
        },
        "contact": {
            "email": "info@panvelmc.gov.in",
            "helplineNo": "022-2745 6700",
            "officeHours": "9:00 AM to 6:00 PM"
        },
        "theme": {
            "primaryColor": "#004C97",
            "secondaryColor": "#006BD6",
            "accentColor": "#00A651"
        }
    }
    """;

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_WithValidData_CreatesSuccessfullyWithVersion1AndServerAudit()
    {
        // Arrange
        var createDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        };

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal(1, result.DepartmentId);
        Assert.Equal(1, result.ConfigVersion);
        Assert.True(result.IsActive);
        Assert.Equal(42, result.CreatedBy); // Verified server-side resolution
        Assert.NotNull(result.CreatedDate);
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentDepartment_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 999, // Does not exist
            ConfigJson = ValidJson,
            IsActive = true
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("does not exist", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateAsync_WithInactiveDepartment_ThrowsValidationException()
    {
        // Arrange - Department 3 was seeded as IsActive = false
        var createDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 3,
            ConfigJson = ValidJson,
            IsActive = true
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("inactive and cannot be configured", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateDepartment_ThrowsValidationException()
    {
        // Arrange
        var firstDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        };
        await _service.CreateAsync(firstDto);

        var duplicateDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(duplicateDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("already exists", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateAsync_WithInvalidJsonSyntax_ThrowsValidationExceptionWithStableMessage()
    {
        // Arrange
        var createDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = "{ invalid json without quotes: 123 ",
            IsActive = true
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("malformed or invalid JSON", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateAsync_WithEmptyJson_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = "   ",
            IsActive = true
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("cannot be null or empty", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateAsync_WithNonObjectJson_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = "[1, 2, 3]", // Array, not an object
            IsActive = true
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("valid JSON object", StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDtoWithDepartmentInfo()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        // Act
        var result = await _service.GetByIdAsync(created.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(created.Id, result.Id);
        Assert.Equal(1, result.DepartmentId);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // Act
        var result = await _service.GetByIdAsync(9999);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByDepartmentIdAsync Tests (Portal Lookup)

    [Fact]
    public async Task GetByDepartmentIdAsync_WithActiveConfiguration_ReturnsDto()
    {
        // Arrange
        await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        // Act
        var result = await _service.GetByDepartmentIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.DepartmentId);
        Assert.Equal(1, result.ConfigVersion);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task GetByDepartmentIdAsync_WithInactiveConfiguration_ReturnsNull()
    {
        // Arrange - configuration exists but is inactive
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });
        await _service.SetActiveStatusAsync(created.Id, false);

        // Act
        var result = await _service.GetByDepartmentIdAsync(1);

        // Assert - Runtime portal lookup MUST NOT return disabled configurations
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByDepartmentIdAsync_WithNonExistentDepartmentId_ReturnsNull()
    {
        // Act
        var result = await _service.GetByDepartmentIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByDepartmentIdAsync_WithInvalidDepartmentId_ReturnsNull()
    {
        // Act
        var result = await _service.GetByDepartmentIdAsync(-1);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region UpdateAsync & Optimistic Concurrency Tests

    [Fact]
    public async Task UpdateAsync_WithValidDataAndCorrectExpectedVersion_IncrementsVersionAndPreservesCreatedDate()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        var originalCreatedDate = created.CreatedDate;
        var updatedJson = ValidJson.Replace("Water Bill Services", "Updated Water Services");

        var updateDto = new UpdateDepartmentPortalConfigurationDto
        {
            ConfigJson = updatedJson,
            IsActive = true,
            ExpectedVersion = 1 // Matches current version
        };

        // Act
        _mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(84);
        var updated = await _service.UpdateAsync(created.Id, updateDto);

        // Assert
        Assert.NotNull(updated);
        Assert.Equal(2, updated.ConfigVersion); // Version incremented from 1 to 2
        Assert.Equal(updatedJson, updated.ConfigJson);
        Assert.Equal(42, updated.CreatedBy); // Preserved
        Assert.Equal(originalCreatedDate, updated.CreatedDate); // Preserved
        Assert.Equal(84, updated.UpdatedBy); // Server-resolved
        Assert.NotNull(updated.UpdatedDate);
    }

    [Fact]
    public async Task UpdateAsync_WithStaleExpectedVersion_ThrowsValidationException()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        // First update advances version to 2
        await _service.UpdateAsync(created.Id, new UpdateDepartmentPortalConfigurationDto
        {
            ConfigJson = ValidJson,
            IsActive = true,
            ExpectedVersion = 1
        });

        // Second update still sends stale ExpectedVersion = 1
        var staleUpdateDto = new UpdateDepartmentPortalConfigurationDto
        {
            ConfigJson = ValidJson,
            IsActive = true,
            ExpectedVersion = 1 // Stale! Current is 2
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(created.Id, staleUpdateDto));
        Assert.Contains("concurrency conflict", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateAsync_WhenDepartmentBecomesInactive_ThrowsValidationException()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        // Deactivate Department 1 in master table
        var dept1 = await _context.DepartmentMasters.FindAsync(1);
        Assert.NotNull(dept1);
        dept1.IsActive = false;
        await _context.SaveChangesAsync();

        var updateDto = new UpdateDepartmentPortalConfigurationDto
        {
            ConfigJson = ValidJson,
            IsActive = true,
            ExpectedVersion = 1
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(created.Id, updateDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("inactive and cannot be updated", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidJson_ThrowsValidationExceptionWithStableMessage()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        var updateDto = new UpdateDepartmentPortalConfigurationDto
        {
            ConfigJson = "not json",
            IsActive = true,
            ExpectedVersion = 1
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(created.Id, updateDto));
        Assert.Contains(ex.Errors.Values, v => v.Contains("malformed or invalid JSON", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task UpdateAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateDepartmentPortalConfigurationDto
        {
            ConfigJson = ValidJson,
            IsActive = true,
            ExpectedVersion = 1
        };

        // Act
        var result = await _service.UpdateAsync(9999, updateDto);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region Status Toggle Tests (Advances Version & Validates Department)

    [Fact]
    public async Task SetActiveStatusAsync_AdvancesConcurrencyTokenOnStatusChange()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });
        Assert.Equal(1, created.ConfigVersion);

        // Act - Deactivate
        _mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(99);
        var deactivated = await _service.SetActiveStatusAsync(created.Id, false);

        // Assert
        Assert.True(deactivated);
        var checkDeactivated = await _service.GetByIdAsync(created.Id);
        Assert.NotNull(checkDeactivated);
        Assert.False(checkDeactivated.IsActive);
        Assert.Equal(99, checkDeactivated.UpdatedBy);
        // Finding 7: Status update advances concurrency token (ConfigVersion) to protect against concurrent edits
        Assert.Equal(2, checkDeactivated.ConfigVersion);

        // Act - Reactivate
        _mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(100);
        var reactivated = await _service.SetActiveStatusAsync(created.Id, true);
        Assert.True(reactivated);
        var checkReactivated = await _service.GetByIdAsync(created.Id);
        Assert.NotNull(checkReactivated);
        Assert.True(checkReactivated.IsActive);
        Assert.Equal(100, checkReactivated.UpdatedBy);
        // ConfigVersion advances again
        Assert.Equal(3, checkReactivated.ConfigVersion);
    }

    [Fact]
    public async Task SetActiveStatusAsync_WhenReactivatingWithInactiveDepartment_ThrowsValidationException()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        // Deactivate configuration first
        await _service.SetActiveStatusAsync(created.Id, false);

        // Now deactivate Department 1 in master table
        var dept1 = await _context.DepartmentMasters.FindAsync(1);
        Assert.NotNull(dept1);
        dept1.IsActive = false;
        await _context.SaveChangesAsync();

        // Act & Assert - Finding 14: Reactivation must fail when department is inactive
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.SetActiveStatusAsync(created.Id, true));
        Assert.Contains(ex.Errors.Values, v => v.Contains("is inactive or does not exist", StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_PerformsSoftDelete()
    {
        // Arrange
        var created = await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        // Act
        var deleted = await _service.DeleteAsync(created.Id);

        // Assert
        Assert.True(deleted);

        // Record still exists in repository but IsActive is false (soft delete)
        var rawEntity = await _context.DepartmentPortalConfigurations.FindAsync(created.Id);
        Assert.NotNull(rawEntity);
        Assert.False(rawEntity.IsActive);
    }

    [Fact]
    public async Task DeleteAsync_WithNonExistentId_ReturnsFalse()
    {
        // Act
        var result = await _service.DeleteAsync(9999);

        // Assert
        Assert.False(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsPagedListWithDepartmentInfo()
    {
        // Arrange
        await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 1,
            ConfigJson = ValidJson,
            IsActive = true
        });

        await _service.CreateAsync(new CreateDepartmentPortalConfigurationDto
        {
            DepartmentId = 2,
            ConfigJson = ValidJson,
            IsActive = true
        });

        // Act
        var result = await _service.GetAllAsync(new DepartmentPortalConfigurationQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        });

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count());
        Assert.All(result.Items, item => Assert.True(item.DepartmentId > 0));
    }

    #endregion

    #region EF Model Mapping Invariant Tests

    [Fact]
    public void ApplicationDbContext_ConfiguresDepartmentPortalConfiguration_WithInvariants()
    {
        var entityType = _context.Model.FindEntityType(typeof(DepartmentPortalConfigurationEntity));
        Assert.NotNull(entityType);

        // Unique index on DepartmentId
        var deptIndex = entityType.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(DepartmentPortalConfigurationEntity.DepartmentId)));
        Assert.NotNull(deptIndex);
        Assert.True(deptIndex.IsUnique);

        // Concurrency token on ConfigVersion
        var versionProp = entityType.FindProperty(nameof(DepartmentPortalConfigurationEntity.ConfigVersion));
        Assert.NotNull(versionProp);
        Assert.True(versionProp.IsConcurrencyToken);
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}
