using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.Property.PropertySurveyDashboard;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class PropertySurveyDashboardServiceTests
{
    private readonly Mock<ILogger<PropertySurveyDashboardService>> _mockLogger = new();
    private readonly Mock<IRepository<PropertyEntity, int>> _mockPropertyRepo = new();
    private readonly Mock<IRepository<PropertyMastOldEntity, int>> _mockPropertyOldRepo = new();
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _mockPropertyTypeRepo = new();
    private readonly Mock<IRepository<PropertyCategoryEntity, int>> _mockCategoryRepo = new();
    private readonly Mock<IRepository<PropertyDetailsEntity, int>> _mockPropertyDetailsRepo = new();
    private readonly Mock<IRepository<PropertyWorkflowDetailsEntity, int>> _mockPropertyWorkflowRepo = new();
    private readonly Mock<IRepository<PropertySurveyVisitEntity, int>> _mockPropertySurveyVisitRepo = new();
    private readonly Mock<IRepository<PropertyAssessmentStatusEntity, int>> _mockAssessmentStatusRepo = new();
    private readonly Mock<IRepository<UserRoleMasterEntity, int>> _mockUserRoleMasterRepo = new();
    private readonly Mock<IRepository<UserRoleAllocationEntity, int>> _mockUserRoleAllocationRepo = new();
    private readonly Mock<IRepository<DepartmentMasterEntity, int>> _mockDepartmentMasterRepo = new();
    private readonly Mock<IRepository<ModuleMasterEntity, int>> _mockModuleMasterRepo = new();
    private readonly Mock<IRepository<UserModuleAllocationEntity, int>> _mockUserModuleAllocationRepo = new();
    private readonly Mock<IRepository<GlobalSurveyWardAllocationEntity, int>> _mockWardAllocationRepo = new();
    private readonly Mock<IRepository<OldWardMasterEntity, int>> _mockOldWardRepo = new();

    private readonly PropertySurveyDashboardService _service;

    public PropertySurveyDashboardServiceTests()
    {
        _service = new PropertySurveyDashboardService(
            _mockLogger.Object,
            _mockPropertyRepo.Object,
            _mockPropertyOldRepo.Object,
            _mockPropertyTypeRepo.Object,
            _mockCategoryRepo.Object,
            _mockPropertyDetailsRepo.Object,
            _mockPropertyWorkflowRepo.Object,
            _mockPropertySurveyVisitRepo.Object,
            _mockAssessmentStatusRepo.Object,
            _mockUserRoleMasterRepo.Object,
            _mockUserRoleAllocationRepo.Object,
            _mockDepartmentMasterRepo.Object,
            _mockModuleMasterRepo.Object,
            _mockUserModuleAllocationRepo.Object,
            _mockWardAllocationRepo.Object);

        SetupEmptyDefaults();
    }

    private void SetupEmptyDefaults()
    {
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());
        _mockPropertyOldRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMastOldEntity>().BuildMock());
        _mockPropertyTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTypeMasterEntity>().BuildMock());
        _mockCategoryRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyCategoryEntity>().BuildMock());
        _mockPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _mockPropertyWorkflowRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyWorkflowDetailsEntity>().BuildMock());
        _mockPropertySurveyVisitRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertySurveyVisitEntity>().BuildMock());
        _mockAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentStatusEntity>().BuildMock());
        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleMasterEntity>().BuildMock());
        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleAllocationEntity>().BuildMock());
        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<DepartmentMasterEntity>().BuildMock());
        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<ModuleMasterEntity>().BuildMock());
        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserModuleAllocationEntity>().BuildMock());
        _mockWardAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock());
    }

    private void SetupAuthorizedUserForAllWards(int userId, string roleName = RoleConstants.SuperAdmin)
    {
        const int departmentId = 10;
        const int userRoleId = 20;
        const int moduleId = 30;

        var departments = new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        };

        var userRoles = new List<UserRoleMasterEntity>
        {
            new() { Id = userRoleId, DepartmentId = departmentId, UserRoleName = roleName, IsActive = true }
        };

        var roleAllocations = new List<UserRoleAllocationEntity>
        {
            new() { UserRoleId = userRoleId, UserId = userId, IsActive = true }
        };

        var modules = new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = departmentId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        };

        var userModuleAllocations = new List<UserModuleAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, IsActive = true }
        };

        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(departments.BuildMock());
        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(userRoles.BuildMock());
        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(roleAllocations.BuildMock());
        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(modules.BuildMock());
        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(userModuleAllocations.BuildMock());
    }

    private void SetupAuthorizedUserForWard(int userId, int wardId, int oldWardId = 1, string oldWardNo = "1")
    {
        const int departmentId = 10;
        const int userRoleId = 20;
        const int moduleId = 30;

        var departments = new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        };

        var userRoles = new List<UserRoleMasterEntity>
        {
            new() { Id = userRoleId, DepartmentId = departmentId, UserRoleName = RoleConstants.ZoneManager, IsActive = true }
        };

        var roleAllocations = new List<UserRoleAllocationEntity>
        {
            new() { UserRoleId = userRoleId, UserId = userId, IsActive = true }
        };

        var modules = new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = departmentId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        };

        var userModuleAllocations = new List<UserModuleAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, IsActive = true }
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                Id = 1,
                UserId = userId,
                DepartmentId = departmentId,
                ModuleId = moduleId,
                WardId = wardId,
                OldWardId = oldWardId,
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        var oldWards = new List<OldWardMasterEntity>
        {
            new() { Id = oldWardId, OldWardNo = oldWardNo, IsActive = true }
        };

        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(departments.BuildMock());
        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(userRoles.BuildMock());
        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(roleAllocations.BuildMock());
        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(modules.BuildMock());
        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(userModuleAllocations.BuildMock());
        _mockWardAllocationRepo.Setup(r => r.GetQueryable()).Returns(wardAllocations.BuildMock());
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeAll_WhenUserAuthorized_ReturnsAggregatedDataForAllWards()
    {
        // Arrange
        const int userId = 1;
        SetupAuthorizedUserForAllWards(userId, RoleConstants.Admin);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = 10, IsActive = true },
            new() { Id = 2, WardId = 20, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var query = new SurveyDashboardQueryParameters { FilterType = "All" };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalProperties);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeAll_WhenUserUnauthorized_ThrowsForbiddenException()
    {
        // Arrange
        const int userId = 99;
        var query = new SurveyDashboardQueryParameters { WardId = 5, FilterType = "All" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("User is not allowed to view all wards.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeAll_WhenRoleExistsButNoUserModuleAllocation_ThrowsForbiddenException()
    {
        // Arrange
        const int userId = 5;
        const int departmentId = 10;
        const int userRoleId = 20;
        const int moduleId = 30;

        var departments = new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        };
        var userRoles = new List<UserRoleMasterEntity>
        {
            new() { Id = userRoleId, DepartmentId = departmentId, UserRoleName = RoleConstants.SuperAdmin, IsActive = true }
        };
        var roleAllocations = new List<UserRoleAllocationEntity>
        {
            new() { UserRoleId = userRoleId, UserId = userId, IsActive = true }
        };
        var modules = new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = departmentId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        };

        // UserModuleAllocation is empty for this user
        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(departments.BuildMock());
        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(userRoles.BuildMock());
        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(roleAllocations.BuildMock());
        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(modules.BuildMock());
        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserModuleAllocationEntity>().BuildMock());

        var query = new SurveyDashboardQueryParameters { FilterType = "All" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("User is not allowed to view all wards.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeSpecificWard_WhenUserAuthorizedForWard_FiltersBySpecifiedWardOnly()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 5;
        SetupAuthorizedUserForWard(userId, wardId);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = wardId, IsActive = true },
            new() { Id = 2, WardId = wardId, IsActive = true },
            new() { Id = 3, WardId = 9, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId, FilterType = "Ward" };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalProperties);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeWard_WhenMissingWardAllocation_ThrowsForbiddenException()
    {
        // Arrange
        const int userId = 1;
        const int requestedWardId = 5;
        SetupEmptyDefaults();

        var query = new SurveyDashboardQueryParameters { WardId = requestedWardId, FilterType = "Ward" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("User is not allocated to the requested ward.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeWard_WhenWardAllocationInactive_ThrowsForbiddenException()
    {
        // Arrange
        const int userId = 1;
        const int requestedWardId = 5;
        const int departmentId = 10;
        const int userRoleId = 20;
        const int moduleId = 30;

        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        }.BuildMock());

        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleMasterEntity>
        {
            new() { Id = userRoleId, DepartmentId = departmentId, UserRoleName = RoleConstants.ZoneManager, IsActive = true }
        }.BuildMock());

        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleAllocationEntity>
        {
            new() { UserRoleId = userRoleId, UserId = userId, IsActive = true }
        }.BuildMock());

        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = departmentId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        }.BuildMock());

        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserModuleAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, IsActive = true }
        }.BuildMock());

        _mockWardAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                UserId = userId,
                DepartmentId = departmentId,
                ModuleId = moduleId,
                WardId = requestedWardId,
                IsActive = false // Inactive allocation
            }
        }.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = requestedWardId, FilterType = "Ward" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("User is not allocated to the requested ward.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeAll_WhenModuleAllocationRevoked_ThrowsForbiddenException()
    {
        // Arrange
        const int userId = 1;
        const int departmentId = 10;
        const int userRoleId = 20;
        const int moduleId = 30;

        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        }.BuildMock());

        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleMasterEntity>
        {
            new() { Id = userRoleId, DepartmentId = departmentId, UserRoleName = RoleConstants.ZoneManager, IsActive = true }
        }.BuildMock());

        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleAllocationEntity>
        {
            new() { UserRoleId = userRoleId, UserId = userId, IsActive = true }
        }.BuildMock());

        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = departmentId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        }.BuildMock());

        // Inactive module allocation simulates revoked access
        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserModuleAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, IsActive = false }
        }.BuildMock());

        var query = new SurveyDashboardQueryParameters { FilterType = "All" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("User is not allowed to view all wards.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeWard_WhenCrossWardRequested_ThrowsForbiddenException()
    {
        // Arrange
        const int userId = 1;
        const int allocatedWardId = 5;
        const int crossWardId = 10;
        SetupAuthorizedUserForWard(userId, allocatedWardId);

        var query = new SurveyDashboardQueryParameters { WardId = crossWardId, FilterType = "Ward" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("User is not allocated to the requested ward.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_WhenNoPropertiesExist_ReturnsDtoWithZeroTotalsAndOnlyOldPropertiesCount()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        const string oldWardNo = "W01";
        SetupAuthorizedUserForWard(userId, wardId, oldWardId: 10, oldWardNo: oldWardNo);

        var oldProperties = new List<PropertyMastOldEntity>
        {
            new() { Id = 101, OldWardNo = oldWardNo, IsActive = true },
            new() { Id = 102, OldWardNo = oldWardNo, IsActive = true },
            new() { Id = 103, OldWardNo = oldWardNo, IsActive = false, MarkedForDeletion = true },
            new() { Id = 104, OldWardNo = "OTHER_WARD", IsActive = true }
        };
        _mockPropertyOldRepo.Setup(r => r.GetQueryable()).Returns(oldProperties.BuildMock());
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId, FilterType = "Ward" };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.TotalProperties);
        Assert.Equal(3, result.TotalOldProperties);
        Assert.Equal(0, result.TotalWings);
        Assert.Equal(0, result.Assessed);
        Assert.Equal(0, result.Unassessed);
        Assert.Equal(0, result.TotalAmenities);
    }

    [Fact]
    public async Task GetAllAsync_AlwaysReturnsTotalOldProperties_WithoutCheckingAnyWardAllocation()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        var oldProperties = new List<PropertyMastOldEntity>
        {
            new() { Id = 1, OldWardNo = "U_WARD", IsActive = true, MarkedForDeletion = false },
            new() { Id = 2, OldWardNo = "OTHER_WARD", IsActive = true, MarkedForDeletion = false },
            new() { Id = 3, OldWardNo = "DELETED_WARD", IsActive = true, MarkedForDeletion = true },
            new() { Id = 4, OldWardNo = "INACTIVE_WARD", IsActive = false, MarkedForDeletion = false }
        };
        _mockPropertyOldRepo.Setup(r => r.GetQueryable()).Returns(oldProperties.BuildMock());
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId, FilterType = "Ward" };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalOldProperties); // Both active, non-deleted old properties counted without checking allocation
    }

    [Fact]
    public async Task GetAllAsync_CalculatesGeneralCountsCorrectly_IncludingDistinctWingsAndAmenities()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        const int amenityTypeId = 100;
        const int regularTypeId = 200;
        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = amenityTypeId, PartType = PartTypeConstants.Amenity, IsActive = true },
            new() { Id = regularTypeId, PartType = "Regular", IsActive = true }
        };
        _mockPropertyTypeRepo.Setup(r => r.GetQueryable()).Returns(propertyTypes.BuildMock());

        const int assessedStatusId = 10;
        const int unassessedStatusId = 20;
        var assessmentStatuses = new List<PropertyAssessmentStatusEntity>
        {
            new() { Id = assessedStatusId, StatusName = PropertyAssessmentStatus.Assessed, IsActive = true },
            new() { Id = unassessedStatusId, StatusName = PropertyAssessmentStatus.Unassessed, IsActive = true }
        };
        _mockAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(assessmentStatuses.BuildMock());

        var properties = new List<PropertyEntity>
        {
            // Prop 1: Wing 101, Amenity, Assessed
            new() { Id = 1, WardId = wardId, WingDetailId = 101, PropertyTypeId = amenityTypeId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            // Prop 2: Wing 101 (duplicate wing), Not amenity, Assessed
            new() { Id = 2, WardId = wardId, WingDetailId = 101, PropertyTypeId = regularTypeId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            // Prop 3: Wing 102, Amenity, Unassessed
            new() { Id = 3, WardId = wardId, WingDetailId = 102, PropertyTypeId = amenityTypeId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },
            // Prop 4: No wing (null), Not amenity, Unassessed
            new() { Id = 4, WardId = wardId, WingDetailId = null, PropertyTypeId = regularTypeId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.Equal(4, result.TotalProperties);
        Assert.Equal(2, result.TotalWings); // 101 and 102 distinct
        Assert.Equal(2, result.Assessed);
        Assert.Equal(2, result.Unassessed);
        Assert.Equal(2, result.TotalAmenities);
    }

    [Fact]
    public async Task GetAllAsync_NullAndUnknownAssessmentStatuses_OnlyExplicitUnassessedCountedAsUnassessed()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 3;
        SetupAuthorizedUserForWard(userId, wardId);

        const int assessedStatusId = 10;
        const int unassessedStatusId = 20;
        const int unknownStatusId = 30;
        var assessmentStatuses = new List<PropertyAssessmentStatusEntity>
        {
            new() { Id = assessedStatusId, StatusName = PropertyAssessmentStatus.Assessed, IsActive = true },
            new() { Id = unassessedStatusId, StatusName = PropertyAssessmentStatus.Unassessed, IsActive = true },
            new() { Id = unknownStatusId, StatusName = "PENDING_VERIFICATION", IsActive = true }
        };
        _mockAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(assessmentStatuses.BuildMock());

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = wardId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            new() { Id = 2, WardId = wardId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },
            new() { Id = 3, WardId = wardId, PropertyAssessmentStatusId = null, IsActive = true },
            new() { Id = 4, WardId = wardId, PropertyAssessmentStatusId = unknownStatusId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.Equal(4, result.TotalProperties);
        Assert.Equal(1, result.Assessed);
        Assert.Equal(1, result.Unassessed);
    }

    [Fact]
    public async Task GetAllAsync_CalculatesSurveyVerifiedAndPendingBreakdownsCorrectly_UsingLatestVisitStatus()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        const int assessedStatusId = 10;
        const int unassessedStatusId = 20;
        var assessmentStatuses = new List<PropertyAssessmentStatusEntity>
        {
            new() { Id = assessedStatusId, StatusName = PropertyAssessmentStatus.Assessed, IsActive = true },
            new() { Id = unassessedStatusId, StatusName = PropertyAssessmentStatus.Unassessed, IsActive = true }
        };
        _mockAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(assessmentStatuses.BuildMock());

        var properties = new List<PropertyEntity>
        {
            // Prop 1: Assessed, Survey Verified
            new() { Id = 1, WardId = wardId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            // Prop 2: Unassessed, Survey Verified
            new() { Id = 2, WardId = wardId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },
            // Prop 3: Assessed, Survey Pending (older visit was verified, but latest visit is unverified)
            new() { Id = 3, WardId = wardId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            // Prop 4: Unassessed, Survey Pending (no visit)
            new() { Id = 4, WardId = wardId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var workflows = new List<PropertyWorkflowDetailsEntity>
        {
            new() { Id = 100, PropertyId = 1, IsActive = true },
            new() { Id = 200, PropertyId = 2, IsActive = true },
            new() { Id = 300, PropertyId = 3, IsActive = true },
            new() { Id = 400, PropertyId = 4, IsActive = true }
        };
        _mockPropertyWorkflowRepo.Setup(r => r.GetQueryable()).Returns(workflows.BuildMock());

        var visits = new List<PropertySurveyVisitEntity>
        {
            new() { Id = 1, PropertyWorkflowDetailsId = 100, InternalSurveyVerified = true, IsActive = true },
            new() { Id = 2, PropertyWorkflowDetailsId = 200, InternalSurveyVerified = true, IsActive = true },
            // Prop 3 has older verified visit (visit 3) but newer unverified visit (visit 4)
            new() { Id = 3, PropertyWorkflowDetailsId = 300, InternalSurveyVerified = true, IsActive = true },
            new() { Id = 4, PropertyWorkflowDetailsId = 300, InternalSurveyVerified = false, IsActive = true }
        };
        _mockPropertySurveyVisitRepo.Setup(r => r.GetQueryable()).Returns(visits.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        var survey = result.SurveyVerifiedDetails;
        Assert.NotNull(survey);
        Assert.Equal(3, survey.InternalSurveyVerified);
        Assert.Equal(2, survey.InternalSurveyVerifiedAssessed);
        Assert.Equal(1, survey.InternalSurveyVerifiedUnassessed);
        Assert.Equal(1, survey.InternalSurveyPending);
        Assert.Equal(0, survey.InternalSurveyPendingAssessed);
        Assert.Equal(1, survey.InternalSurveyPendingUnassessed);
    }

    [Fact]
    public async Task GetAllAsync_CalculatesSubmissionCompleteAndPendingBreakdownsCorrectly_RequiringAllDetailsComplete()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        const int assessedStatusId = 1;
        const int unassessedStatusId = 2;
        var assessmentStatuses = new List<PropertyAssessmentStatusEntity>
        {
            new() { Id = assessedStatusId, StatusName = PropertyAssessmentStatus.Assessed, IsActive = true },
            new() { Id = unassessedStatusId, StatusName = PropertyAssessmentStatus.Unassessed, IsActive = true }
        };
        _mockAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(assessmentStatuses.BuildMock());

        var properties = new List<PropertyEntity>
        {
            // Prop 1: Assessed, Submission Complete (all floors have area > 1)
            new() { Id = 1, WardId = wardId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            // Prop 2: Unassessed, Submission Complete (single floor has area > 1)
            new() { Id = 2, WardId = wardId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },
            // Prop 3: Assessed, Submission Pending (multi-floor where floor 1 is > 1 but floor 2 is <= 1)
            new() { Id = 3, WardId = wardId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            // Prop 4: Unassessed, Submission Pending (no details)
            new() { Id = 4, WardId = wardId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var propertyDetails = new List<PropertyDetailsEntity>
        {
            // Prop 1 (multi-floor: all > 1)
            new() { PropertyId = 1, CarpetAreaSqMeter = 25.0, BuiltupAreaSqMeter = 30.0, IsActive = true },
            new() { PropertyId = 1, CarpetAreaSqMeter = 20.0, BuiltupAreaSqMeter = 22.0, IsActive = true },

            // Prop 2 (single floor: > 1)
            new() { PropertyId = 2, CarpetAreaSqMeter = 10.0, BuiltupAreaSqMeter = 12.0, IsActive = true },

            // Prop 3 (multi-floor: floor 1 is > 1, but floor 2 is <= 1 => NOT submission complete)
            new() { PropertyId = 3, CarpetAreaSqMeter = 15.0, BuiltupAreaSqMeter = 18.0, IsActive = true },
            new() { PropertyId = 3, CarpetAreaSqMeter = 0.5, BuiltupAreaSqMeter = 0.8, IsActive = true }
        };
        _mockPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(propertyDetails.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        var submission = result.SubmissionDetails;
        Assert.NotNull(submission);
        Assert.Equal(3, submission.SubmissionComplete);
        Assert.Equal(2, submission.SubmissionCompleteAssessed);
        Assert.Equal(1, submission.SubmissionCompleteUnassessed);
        Assert.Equal(1, submission.SubmissionPending);
        Assert.Equal(0, submission.SubmissionPendingAssessed);
        Assert.Equal(1, submission.SubmissionPendingUnassessed);
    }

    [Fact]
    public async Task GetAllAsync_SubmissionDetails_WithZeroOrNullAreas_CountedAsPending()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = wardId, IsActive = true },
            new() { Id = 2, WardId = wardId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var propertyDetails = new List<PropertyDetailsEntity>
        {
            new() { PropertyId = 1, CarpetAreaSqMeter = null, BuiltupAreaSqMeter = 15.0, IsActive = true },
            new() { PropertyId = 2, CarpetAreaSqMeter = 20.0, BuiltupAreaSqMeter = 0.0, IsActive = true }
        };
        _mockPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(propertyDetails.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.SubmissionDetails.SubmissionComplete);
        Assert.Equal(2, result.SubmissionDetails.SubmissionPending);
    }

    [Fact]
    public async Task GetAllAsync_CalculatesCategoryMetricsCorrectly_ForApartmentIndustryPlotAndIndividual()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 2;
        SetupAuthorizedUserForWard(userId, wardId);

        const int assessedStatusId = 1;
        const int unassessedStatusId = 2;
        var assessmentStatuses = new List<PropertyAssessmentStatusEntity>
        {
            new() { Id = assessedStatusId, StatusName = PropertyAssessmentStatus.Assessed, IsActive = true },
            new() { Id = unassessedStatusId, StatusName = PropertyAssessmentStatus.Unassessed, IsActive = true }
        };
        _mockAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(assessmentStatuses.BuildMock());

        const int amenityTypeId = 100;
        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = amenityTypeId, PartType = PartTypeConstants.Amenity, IsActive = true }
        };
        _mockPropertyTypeRepo.Setup(r => r.GetQueryable()).Returns(propertyTypes.BuildMock());

        const int catApartment = 10;
        const int catIndustry = 20;
        const int catPlot = 30;
        const int catIndividual = 40;
        var categories = new List<PropertyCategoryEntity>
        {
            new() { Id = catApartment, PropertyCategoryName = PropertyCategoryConstants.ApartmentCategoryNames.First(), IsActive = true },
            new() { Id = catIndustry, PropertyCategoryName = PropertyCategoryConstants.Industry, IsActive = true },
            new() { Id = catPlot, PropertyCategoryName = PropertyCategoryConstants.Plot, IsActive = true },
            new() { Id = catIndividual, PropertyCategoryName = PropertyCategoryConstants.IndividualCategoryNames.First(), IsActive = true }
        };
        _mockCategoryRepo.Setup(r => r.GetQueryable()).Returns(categories.BuildMock());

        var properties = new List<PropertyEntity>
        {
            // Apartment:
            new() { Id = 1, WardId = wardId, CategoryId = catApartment, PartitionNo = null, PropertyTypeId = null, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            new() { Id = 2, WardId = wardId, CategoryId = catApartment, PartitionNo = "   ", PropertyTypeId = amenityTypeId, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            new() { Id = 3, WardId = wardId, CategoryId = catApartment, PartitionNo = "A1", PropertyTypeId = amenityTypeId, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },
            new() { Id = 4, WardId = wardId, CategoryId = catApartment, PartitionNo = "A2", PropertyTypeId = null, PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },

            // Industry:
            new() { Id = 5, WardId = wardId, CategoryId = catIndustry, PartitionNo = null, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            new() { Id = 6, WardId = wardId, CategoryId = catIndustry, PartitionNo = "IND-P", PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },

            // Plot:
            new() { Id = 7, WardId = wardId, CategoryId = catPlot, PartitionNo = "", PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            new() { Id = 8, WardId = wardId, CategoryId = catPlot, PartitionNo = "PL-1", PropertyAssessmentStatusId = unassessedStatusId, IsActive = true },

            // Individual:
            new() { Id = 9, WardId = wardId, CategoryId = catIndividual, PartitionNo = null, PropertyAssessmentStatusId = assessedStatusId, IsActive = true },
            new() { Id = 10, WardId = wardId, CategoryId = catIndividual, PartitionNo = "INDV-1", PropertyAssessmentStatusId = unassessedStatusId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.TotalProperties);

        // Apartment
        var apt = result.ApartmentDetails;
        Assert.Equal(4, apt.TotalApartmentProperties);
        Assert.Equal(2, apt.ApartmentAmenity);
        Assert.Equal(1, apt.ApartmentMainProperty);
        Assert.Equal(1, apt.ApartmentPartitionProperty);
        Assert.Equal(2, apt.ApartmentAssessed);
        Assert.Equal(2, apt.ApartmentUnassessed);

        // Industry
        var ind = result.IndustryDetails;
        Assert.Equal(2, ind.TotalIndustryProperties);
        Assert.Equal(1, ind.IndustryMainProperty);
        Assert.Equal(1, ind.IndustryPartitionProperty);
        Assert.Equal(1, ind.IndustryAssessed);
        Assert.Equal(1, ind.IndustryUnassessed);

        // Plot
        var plt = result.PlotDetails;
        Assert.Equal(2, plt.TotalPlotProperties);
        Assert.Equal(1, plt.PlotMainProperty);
        Assert.Equal(1, plt.PlotPartitionProperty);
        Assert.Equal(1, plt.PlotAssessed);
        Assert.Equal(1, plt.PlotUnassessed);

        // Individual
        var indv = result.IndividualDetails;
        Assert.Equal(2, indv.TotalIndividualProperties);
        Assert.Equal(1, indv.IndividualMainProperty);
        Assert.Equal(1, indv.IndividualPartitionProperty);
        Assert.Equal(1, indv.IndividualAssessed);
        Assert.Equal(1, indv.IndividualUnassessed);
    }

    [Fact]
    public async Task GetAllAsync_FiltersOutInactiveAndMarkedForDeletionRecords()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = wardId, IsActive = true, MarkedForDeletion = false },
            new() { Id = 2, WardId = wardId, IsActive = false, MarkedForDeletion = false },
            new() { Id = 3, WardId = wardId, IsActive = true, MarkedForDeletion = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalProperties);
    }

    [Fact]
    public async Task GetAllAsync_WhenQueryIsNull_ThrowsValidationException()
    {
        // Arrange & Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetAllAsync(null!, 1, CancellationToken.None));

        Assert.Equal("Query parameters are required.", ex.Message);
        Assert.Equal(OperationType.Read, ex.OperationType);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task GetAllAsync_WhenUserIdInvalid_ThrowsValidationException(int invalidUserId)
    {
        // Arrange
        var query = new SurveyDashboardQueryParameters { WardId = 1 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetAllAsync(query, invalidUserId, CancellationToken.None));

        Assert.Equal("Valid user identification is required.", ex.Message);
        Assert.Equal(OperationType.Read, ex.OperationType);
    }

    [Fact]
    public async Task GetAllAsync_WhenFilterTypeUnsupported_ThrowsValidationException()
    {
        // Arrange
        const int userId = 1;
        var query = new SurveyDashboardQueryParameters { WardId = 1, FilterType = "ZoneWise" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Contains("Invalid filter type 'ZoneWise'", ex.Message);
        Assert.Equal(OperationType.Read, ex.OperationType);
    }

    [Fact]
    public async Task GetAllAsync_WhenWardFilterAndWardIdMissing_ThrowsValidationException()
    {
        // Arrange
        const int userId = 1;
        var query = new SurveyDashboardQueryParameters { WardId = null, FilterType = "Ward" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("WardId is required for ward-specific dashboard queries.", ex.Message);
        Assert.Equal(OperationType.Read, ex.OperationType);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeAll_WhenZoneManager_AggregatesAllCorporationWards()
    {
        // Arrange
        const int userId = 1;
        const int departmentId = 10;
        const int userRoleId = 20;
        const int moduleId = 30;

        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        }.BuildMock());

        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleMasterEntity>
        {
            new() { Id = userRoleId, DepartmentId = departmentId, UserRoleName = RoleConstants.ZoneManager, IsActive = true }
        }.BuildMock());

        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleAllocationEntity>
        {
            new() { UserRoleId = userRoleId, UserId = userId, IsActive = true }
        }.BuildMock());

        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = departmentId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        }.BuildMock());

        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserModuleAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, IsActive = true }
        }.BuildMock());

        // ZoneManager allocated to Ward 10 and Ward 20 only
        _mockWardAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, WardId = 10, IsActive = true },
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, WardId = 20, IsActive = true }
        }.BuildMock());

        // Properties: 2 in Ward 10, 1 in Ward 20, 2 in unassigned Ward 30
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = 10, IsActive = true },
            new() { Id = 2, WardId = 10, IsActive = true },
            new() { Id = 3, WardId = 20, IsActive = true },
            new() { Id = 4, WardId = 30, IsActive = true },
            new() { Id = 5, WardId = 30, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var query = new SurveyDashboardQueryParameters { FilterType = "All" };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.TotalProperties);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeAll_WhenZoneManagerHasNoAllocatedWards_ReturnsDashboardWithoutThrowing()
    {
        // Arrange
        const int userId = 1;
        const int departmentId = 10;
        const int userRoleId = 20;
        const int moduleId = 30;

        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<DepartmentMasterEntity>
        {
            new() { Id = departmentId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        }.BuildMock());

        _mockUserRoleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleMasterEntity>
        {
            new() { Id = userRoleId, DepartmentId = departmentId, UserRoleName = RoleConstants.ZoneManager, IsActive = true }
        }.BuildMock());

        _mockUserRoleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserRoleAllocationEntity>
        {
            new() { UserRoleId = userRoleId, UserId = userId, IsActive = true }
        }.BuildMock());

        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = departmentId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        }.BuildMock());

        _mockUserModuleAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<UserModuleAllocationEntity>
        {
            new() { UserId = userId, DepartmentId = departmentId, ModuleId = moduleId, IsActive = true }
        }.BuildMock());

        // Zero ward allocations
        _mockWardAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock());

        var query = new SurveyDashboardQueryParameters { FilterType = "All" };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.TotalProperties);
    }

    [Fact]
    public async Task GetAllAsync_FilterTypeWard_WhenModuleDepartmentMismatch_ThrowsForbiddenException()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 5;
        const int deptId = 10;
        const int otherDeptId = 99;
        const int moduleId = 30;

        _mockDepartmentMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<DepartmentMasterEntity>
        {
            new() { Id = deptId, DepartmentCode = DepartmentConstants.Ptis, IsActive = true }
        }.BuildMock());

        // ModuleMaster points to otherDeptId, violating mm.DepartmentId == dm.Id
        _mockModuleMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<ModuleMasterEntity>
        {
            new() { Id = moduleId, DepartmentId = otherDeptId, ModuleCode = ModuleConstants.Survey, IsActive = true }
        }.BuildMock());

        _mockWardAllocationRepo.Setup(r => r.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>
        {
            new()
            {
                UserId = userId,
                DepartmentId = deptId,
                ModuleId = moduleId,
                WardId = wardId,
                IsActive = true
            }
        }.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId, FilterType = "Ward" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetAllAsync(query, userId, CancellationToken.None));

        Assert.Equal("User is not allocated to the requested ward.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_SubmissionComplete_WhenPlotCategoryWithZeroAreaDetail_CountsAsSubmissionPending()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        const int plotCategoryId = 50;
        var categories = new List<PropertyCategoryEntity>
        {
            new() { Id = plotCategoryId, PropertyCategoryName = PropertyCategoryConstants.Plot, IsActive = true }
        };
        _mockCategoryRepo.Setup(r => r.GetQueryable()).Returns(categories.BuildMock());

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = wardId, CategoryId = plotCategoryId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        // Detail with 0 carpet/builtup area (typical for open plots), but active
        var details = new List<PropertyDetailsEntity>
        {
            new() { PropertyId = 1, CarpetAreaSqMeter = 0, BuiltupAreaSqMeter = 0, IsActive = true }
        };
        _mockPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.SubmissionDetails.SubmissionComplete);
        Assert.Equal(1, result.SubmissionDetails.SubmissionPending);
    }

    [Fact]
    public async Task GetAllAsync_SurveyVerified_WhenWorkflowVisitHasInternalSurveyVerifiedTrue_CountsAsSurveyVerified()
    {
        // Arrange
        const int userId = 1;
        const int wardId = 1;
        SetupAuthorizedUserForWard(userId, wardId);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = wardId, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var nonInternalStage = new PropertyWorkflowStageMasterEntity
        {
            Id = 99,
            StageName = "ExternalAudit",
            IsActive = true
        };

        var workflows = new List<PropertyWorkflowDetailsEntity>
        {
            new() { Id = 100, PropertyId = 1, IsActive = true, WorkflowStage = nonInternalStage }
        };
        _mockPropertyWorkflowRepo.Setup(r => r.GetQueryable()).Returns(workflows.BuildMock());

        var visits = new List<PropertySurveyVisitEntity>
        {
            new() { Id = 1, PropertyWorkflowDetailsId = 100, InternalSurveyVerified = true, IsActive = true }
        };
        _mockPropertySurveyVisitRepo.Setup(r => r.GetQueryable()).Returns(visits.BuildMock());

        var query = new SurveyDashboardQueryParameters { WardId = wardId };

        // Act
        var result = await _service.GetAllAsync(query, userId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.SurveyVerifiedDetails.InternalSurveyVerified);
        Assert.Equal(0, result.SurveyVerifiedDetails.InternalSurveyPending);
    }
}
