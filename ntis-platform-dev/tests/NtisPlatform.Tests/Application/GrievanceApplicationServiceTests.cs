using AutoMapper;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Mappings.GrievanceMapping;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class GrievanceApplicationServiceTests
{
    private readonly Mock<IRepository<GrievanceApplicationEntity, int>> _mockRepository;
    private readonly Mock<IRepository<CitizenMasterEntity, int>> _mockCitizenRepository;
    private readonly Mock<IRepository<GrievanceDepartmentMasterEntity, int>> _mockDeptRepository;
    private readonly Mock<IRepository<GrievanceTypeMasterEntity, int>> _mockTypeRepository;
    private readonly Mock<IRepository<GrievanceWorkflowEntity, int>> _mockWorkflowRepository;
    private readonly Mock<IRepository<GrievanceWorkflowStateEntity, int>> _mockStateRepository;
    private readonly Mock<IRepository<GrievanceWorkflowTransitionEntity, int>> _mockWorkflowTransitionRepository;
    private readonly Mock<IRepository<GrievanceActivityLogEntity, long>> _mockActivityLogRepository;
    private readonly Mock<IRepository<GrievanceDeptForwardingEntity, int>> _mockDeptForwardingRepository;
    private readonly Mock<IRepository<WardEntity, int>> _mockWardRepository;
    private readonly Mock<IRepository<ZoneEntity, int>> _mockZoneRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly IMapper _mapper;
    private readonly GrievanceApplicationService _service;

    public GrievanceApplicationServiceTests()
    {
        _mockRepository = new Mock<IRepository<GrievanceApplicationEntity, int>>();
        _mockCitizenRepository = new Mock<IRepository<CitizenMasterEntity, int>>();
        _mockDeptRepository = new Mock<IRepository<GrievanceDepartmentMasterEntity, int>>();
        _mockTypeRepository = new Mock<IRepository<GrievanceTypeMasterEntity, int>>();
        _mockWorkflowRepository = new Mock<IRepository<GrievanceWorkflowEntity, int>>();
        _mockStateRepository = new Mock<IRepository<GrievanceWorkflowStateEntity, int>>();
        _mockWorkflowTransitionRepository = new Mock<IRepository<GrievanceWorkflowTransitionEntity, int>>();
        _mockActivityLogRepository = new Mock<IRepository<GrievanceActivityLogEntity, long>>();
        _mockDeptForwardingRepository = new Mock<IRepository<GrievanceDeptForwardingEntity, int>>();
        _mockWardRepository = new Mock<IRepository<WardEntity, int>>();
        _mockZoneRepository = new Mock<IRepository<ZoneEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<GrievanceApplicationMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        var defaultApplications = new List<GrievanceApplicationEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(defaultApplications.BuildMock());

        var defaultLogs = new List<GrievanceActivityLogEntity>();
        _mockActivityLogRepository.Setup(r => r.GetQueryable()).Returns(defaultLogs.BuildMock());

        var defaultForwardings = new List<GrievanceDeptForwardingEntity>();
        _mockDeptForwardingRepository.Setup(r => r.GetQueryable()).Returns(defaultForwardings.BuildMock());

        var defaultTransitions = new List<GrievanceWorkflowTransitionEntity>();
        _mockWorkflowTransitionRepository.Setup(r => r.GetQueryable()).Returns(defaultTransitions.BuildMock());

        var defaultWards = new List<WardEntity>();
        _mockWardRepository.Setup(r => r.GetQueryable()).Returns(defaultWards.BuildMock());

        var defaultZones = new List<ZoneEntity>();
        _mockZoneRepository.Setup(r => r.GetQueryable()).Returns(defaultZones.BuildMock());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _service = new GrievanceApplicationService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockCitizenRepository.Object,
            _mockDeptRepository.Object,
            _mockTypeRepository.Object,
            _mockWorkflowRepository.Object,
            _mockStateRepository.Object,
            _mockActivityLogRepository.Object,
            _mockDeptForwardingRepository.Object,
            userRepository: null,
            workflowTransitionRepository: _mockWorkflowTransitionRepository.Object,
            wardRepository: _mockWardRepository.Object,
            zoneRepository: _mockZoneRepository.Object);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceNo = "GRV-2026-000001",
            CitizenId = 10,
            GrievanceDepartmentId = 2,
            GrievanceTypeId = 5,
            WorkflowId = 1,
            CurrentStateId = 1,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("GRV-2026-000001", result.GrievanceNo);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceApplicationEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByGrievanceNoAsync Tests

    [Fact]
    public async Task GetByGrievanceNoAsync_ExistingNumber_ReturnsDto()
    {
        // Arrange
        var applications = new List<GrievanceApplicationEntity>
        {
            new()
            {
                Id = 1,
                GrievanceNo = "GRV-2026-000001",
                CitizenId = 1,
                GrievanceDepartmentId = 10,
                GrievanceTypeId = 100,
                WorkflowId = 1,
                CurrentStateId = 5,
                IsActive = true
            }
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(applications);

        // Act
        var result = await _service.GetByGrievanceNoAsync("GRV-2026-000001");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("GRV-2026-000001", result.GrievanceNo);
    }

    [Fact]
    public async Task GetByGrievanceNoAsync_NonExistingNumber_ReturnsNull()
    {
        // Arrange
        var applications = new List<GrievanceApplicationEntity>().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(applications);

        // Act
        var result = await _service.GetByGrievanceNoAsync("NON_EXISTING");

        // Assert
        Assert.Null(result);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task GetByGrievanceNoAsync_NullOrEmptyNumber_ReturnsNull(string? grievanceNo)
    {
        // Act
        var result = await _service.GetByGrievanceNoAsync(grievanceNo!);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByCitizenIdAsync Tests

    [Fact]
    public async Task GetByCitizenIdAsync_ReturnsMatchingApplications()
    {
        // Arrange
        var applications = new List<GrievanceApplicationEntity>
        {
            new() { Id = 1, GrievanceNo = "GRV-1", CitizenId = 5, GrievanceDepartmentId = 1, GrievanceTypeId = 1, WorkflowId = 1, CurrentStateId = 1, IsActive = true },
            new() { Id = 2, GrievanceNo = "GRV-2", CitizenId = 5, GrievanceDepartmentId = 2, GrievanceTypeId = 2, WorkflowId = 1, CurrentStateId = 1, IsActive = true },
            new() { Id = 3, GrievanceNo = "GRV-3", CitizenId = 9, GrievanceDepartmentId = 1, GrievanceTypeId = 1, WorkflowId = 1, CurrentStateId = 1, IsActive = true }
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(applications);

        var queryParams = new GrievanceApplicationQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var result = await _service.GetByCitizenIdAsync(5, queryParams);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count());
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesApplicationAndInitialActivityLog()
    {
        // Arrange
        var citizens = new List<CitizenMasterEntity>
        {
            new() { Id = 1, Name = "John Citizen", MobileNo = "9876543210", IsActive = true }
        }.BuildMock();

        var departments = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 10, DepartmentName = "Public Works", IsActive = true }
        }.BuildMock();

        var types = new List<GrievanceTypeMasterEntity>
        {
            new() { Id = 100, GrievanceDepartmentId = 10, GrievanceType = "Pothole", IsActive = true }
        }.BuildMock();

        var workflows = new List<GrievanceWorkflowEntity>
        {
            new() { Id = 1, WorkflowName = "Default Workflow", IsDefault = true, IsActive = true }
        }.BuildMock();

        var states = new List<GrievanceWorkflowStateEntity>
        {
            new() { Id = 5, WorkflowId = 1, StateName = "Pending", IsInitial = true, IsActive = true, DisplayOrder = 1 }
        }.BuildMock();

        var applications = new List<GrievanceApplicationEntity>().BuildMock();

        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(citizens);
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(departments);
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(types);
        _mockWorkflowRepository.Setup(r => r.GetQueryable()).Returns(workflows);
        _mockStateRepository.Setup(r => r.GetQueryable()).Returns(states);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(applications);

        GrievanceApplicationEntity? savedEntity = null;
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceApplicationEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceApplicationEntity, CancellationToken>((entity, _) =>
            {
                entity.Id = 1;
                savedEntity = entity;
            })
            .ReturnsAsync((GrievanceApplicationEntity entity, CancellationToken _) => entity);

        GrievanceActivityLogEntity? savedLog = null;
        _mockActivityLogRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceActivityLogEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceActivityLogEntity, CancellationToken>((log, _) =>
            {
                savedLog = log;
            })
            .ReturnsAsync((GrievanceActivityLogEntity log, CancellationToken _) => log);

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => savedEntity);

        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            RoadLandmark = "Near City Center",
            Latitude = 18.520430m,
            Longitude = 73.856744m,
            Description = "Large pothole on main road."
        };

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(savedEntity);
        Assert.StartsWith("GRV-", savedEntity.GrievanceNo);
        Assert.Equal(1, savedEntity.WorkflowId);
        Assert.Equal(5, savedEntity.CurrentStateId);
        Assert.Equal(18.520430m, savedEntity.Latitude);
        Assert.Equal(73.856744m, savedEntity.Longitude);
        Assert.True(savedEntity.IsActive);

        Assert.NotEmpty(savedEntity.ActivityLogs);
        var log = savedEntity.ActivityLogs.First();
        Assert.Equal(5, log.ToStateId);
        Assert.Null(log.FromStateId);
        Assert.Null(log.ActionByUserId);
        Assert.Equal("Grievance ticket submitted.", log.Remark);
    }

    [Fact]
    public async Task CreateAsync_InvalidCitizen_ThrowsValidationException()
    {
        // Arrange
        var citizens = new List<CitizenMasterEntity>().BuildMock();
        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(citizens);

        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 999,
            GrievanceDepartmentId = 1,
            GrievanceTypeId = 1
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    public async Task CreateAsync_InvalidDepartment_ThrowsValidationException()
    {
        // Arrange
        var citizens = new List<CitizenMasterEntity>
        {
            new() { Id = 1, Name = "John", MobileNo = "9876543210", IsActive = true }
        }.BuildMock();

        var departments = new List<GrievanceDepartmentMasterEntity>().BuildMock();

        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(citizens);
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(departments);

        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 999,
            GrievanceTypeId = 1
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    public async Task CreateAsync_InvalidType_ThrowsValidationException()
    {
        // Arrange
        var citizens = new List<CitizenMasterEntity>
        {
            new() { Id = 1, Name = "John", MobileNo = "9876543210", IsActive = true }
        }.BuildMock();

        var departments = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 10, DepartmentName = "Public Works", IsActive = true }
        }.BuildMock();

        var types = new List<GrievanceTypeMasterEntity>().BuildMock();

        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(citizens);
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(departments);
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(types);

        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 999
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    public async Task CreateAsync_NoActiveWorkflow_ThrowsValidationException()
    {
        // Arrange
        var citizens = new List<CitizenMasterEntity>
        {
            new() { Id = 1, Name = "John", MobileNo = "9876543210", IsActive = true }
        }.BuildMock();

        var departments = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 10, DepartmentName = "Public Works", IsActive = true }
        }.BuildMock();

        var types = new List<GrievanceTypeMasterEntity>
        {
            new() { Id = 100, GrievanceDepartmentId = 10, GrievanceType = "Pothole", IsActive = true }
        }.BuildMock();

        var workflows = new List<GrievanceWorkflowEntity>().BuildMock();

        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(citizens);
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(departments);
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(types);
        _mockWorkflowRepository.Setup(r => r.GetQueryable()).Returns(workflows);

        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    public async Task CreateAsync_ExplicitInactiveWorkflow_ThrowsValidationException()
    {
        // Arrange
        var citizens = new List<CitizenMasterEntity>
        {
            new() { Id = 1, Name = "John", MobileNo = "9876543210", IsActive = true }
        }.BuildMock();

        var departments = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 10, DepartmentName = "Public Works", IsActive = true }
        }.BuildMock();

        var types = new List<GrievanceTypeMasterEntity>
        {
            new() { Id = 100, GrievanceDepartmentId = 10, GrievanceType = "Pothole", IsActive = true }
        }.BuildMock();

        var workflows = new List<GrievanceWorkflowEntity>
        {
            new() { Id = 50, WorkflowName = "Inactive Workflow", IsActive = false }
        }.BuildMock();

        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(citizens);
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(departments);
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(types);
        _mockWorkflowRepository.Setup(r => r.GetQueryable()).Returns(workflows);

        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            WorkflowId = 50
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceApplicationEntity?)null);

        var updateDto = new UpdateGrievanceApplicationDto
        {
            RoadLandmark = "New Landmark"
        };

        // Act
        var result = await _service.UpdateAsync(999, updateDto);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        // Arrange
        var existingEntity = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceNo = "GRV-2026-000001",
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            WorkflowId = 1,
            CurrentStateId = 5,
            RoadLandmark = "Old Landmark",
            Description = "Old Description",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GrievanceApplicationEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var updateDto = new UpdateGrievanceApplicationDto
        {
            RoadLandmark = "New Landmark",
            Description = "New Description",
            IsActive = true
        };

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Landmark", existingEntity.RoadLandmark);
        Assert.Equal("New Description", existingEntity.Description);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDepartmentAndType_UpdatesSuccessfully()
    {
        // Arrange
        var existingEntity = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceNo = "GRV-2026-000001",
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 20, IsActive = true, DepartmentName = "Sanitation" }
        };
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());

        var types = new List<GrievanceTypeMasterEntity>
        {
            new() { Id = 200, GrievanceDepartmentId = 20, IsActive = true, GrievanceType = "Garbage" }
        };
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(types.BuildMock());

        var updateDto = new UpdateGrievanceApplicationDto
        {
            GrievanceDepartmentId = 20,
            GrievanceTypeId = 200,
            Latitude = 18.530000m,
            Longitude = 73.860000m,
            Description = "Updated description",
            IsActive = true
        };

        // Act
        var result = await _service.UpdateAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(20, existingEntity.GrievanceDepartmentId);
        Assert.Equal(200, existingEntity.GrievanceTypeId);
        Assert.Equal(18.530000m, existingEntity.Latitude);
        Assert.Equal(73.860000m, existingEntity.Longitude);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_PartialUpdateWithZeroFks_PreservesExistingForeignKeys()
    {
        // Arrange
        var existingEntity = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            RoadLandmark = "Old Landmark",
            Description = "Old Description",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { existingEntity }.BuildMock());

        var updateDto = new UpdateGrievanceApplicationDto
        {
            GrievanceDepartmentId = 0, // Omitted in partial update
            GrievanceTypeId = 0,       // Omitted in partial update
            RoadLandmark = "New Landmark",
            Description = "New Description"
        };

        // Act
        var result = await _service.UpdateAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, existingEntity.GrievanceDepartmentId);
        Assert.Equal(100, existingEntity.GrievanceTypeId);
        Assert.Equal("New Landmark", existingEntity.RoadLandmark);
        Assert.Equal("New Description", existingEntity.Description);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_InactiveOrNonExistingDepartment_ThrowsValidationException()
    {
        // Arrange
        var existingEntity = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceDepartmentMasterEntity>().BuildMock());

        var updateDto = new UpdateGrievanceApplicationDto
        {
            GrievanceDepartmentId = 999,
            GrievanceTypeId = 100
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
    }

    [Fact]
    public async Task UpdateAsync_MismatchedGrievanceType_ThrowsValidationException()
    {
        // Arrange
        var existingEntity = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 10, IsActive = true }
        };
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());

        // Type belongs to department 99, not 10
        var types = new List<GrievanceTypeMasterEntity>
        {
            new() { Id = 100, GrievanceDepartmentId = 99, IsActive = true }
        };
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(types.BuildMock());

        var updateDto = new UpdateGrievanceApplicationDto
        {
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_NonExistingId_ReturnsFalse()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceApplicationEntity?)null);

        // Act
        var result = await _service.DeleteAsync(999);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesApplicationAndCascadeDeletesLogsAndForwardings()
    {
        // Arrange
        var existingEntity = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceNo = "GRV-2026-000001",
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100,
            WorkflowId = 1,
            CurrentStateId = 5,
            IsActive = true
        };

        var relatedForwardings = new List<GrievanceDeptForwardingEntity>
        {
            new() { Id = 101, GrievanceApplicationId = 1, IsActive = true },
            new() { Id = 102, GrievanceApplicationId = 1, IsActive = true }
        };

        var relatedLogs = new List<GrievanceActivityLogEntity>
        {
            new() { Id = 501, GrievanceApplicationId = 1 },
            new() { Id = 502, GrievanceApplicationId = 1 }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockDeptForwardingRepository.Setup(r => r.GetQueryable()).Returns(relatedForwardings.BuildMock());
        _mockActivityLogRepository.Setup(r => r.GetQueryable()).Returns(relatedLogs.BuildMock());

        _mockDeptForwardingRepository.Setup(r => r.HardDeleteAsync(It.IsAny<GrievanceDeptForwardingEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockActivityLogRepository.Setup(r => r.HardDeleteAsync(It.IsAny<GrievanceActivityLogEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockRepository.Setup(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(1, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockDeptForwardingRepository.Verify(r => r.HardDeleteAsync(It.IsAny<GrievanceDeptForwardingEntity>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _mockActivityLogRepository.Verify(r => r.HardDeleteAsync(It.IsAny<GrievanceActivityLogEntity>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region TrackGrievanceAsync Tests

    [Fact]
    public async Task TrackGrievanceAsync_ValidGrievanceNo_ReturnsTrackingDetailsWithTimeline()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 10,
            GrievanceNo = "GRV-2026-000010",
            CitizenId = 1,
            Citizen = new CitizenMasterEntity { Id = 1, Name = "Test Citizen", MobileNo = "9876543210" },
            GrievanceDepartmentId = 2,
            GrievanceDepartment = new GrievanceDepartmentMasterEntity { Id = 2, DepartmentName = "Water Department" },
            GrievanceTypeId = 3,
            GrievanceType = new GrievanceTypeMasterEntity { Id = 3, GrievanceType = "Pipe Leakage" },
            CurrentStateId = 4,
            CurrentState = new GrievanceWorkflowStateEntity { Id = 4, StateName = "In Progress" },
            SubmittedDate = DateTime.Now.AddDays(-2),
            IsActive = true
        };

        var logs = new List<GrievanceActivityLogEntity>
        {
            new()
            {
                Id = 101,
                GrievanceApplicationId = 10,
                ToState = new GrievanceWorkflowStateEntity { StateName = "Submitted" },
                Remark = "Registered online",
                ActionAt = DateTime.Now.AddDays(-2)
            },
            new()
            {
                Id = 102,
                GrievanceApplicationId = 10,
                FromState = new GrievanceWorkflowStateEntity { StateName = "Submitted" },
                ToState = new GrievanceWorkflowStateEntity { StateName = "In Progress" },
                Remark = "Engineer assigned",
                ActionAt = DateTime.Now.AddDays(-1)
            }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());
        _mockActivityLogRepository.Setup(r => r.GetQueryable()).Returns(logs.BuildMock());

        // Act
        var result = await _service.TrackGrievanceAsync("GRV-2026-000010", "9876543210", CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("GRV-2026-000010", result.GrievanceNo);
        Assert.Equal("In Progress", result.CurrentStateName);
        Assert.Equal("Water Department", result.DepartmentName);
        Assert.Equal("XXXXXX3210", result.MaskedMobileNo);
        Assert.Equal(2, result.Timeline.Count);
        Assert.Equal(60, result.ProgressPercentage);
        Assert.True(result.Timeline.Last().IsCurrentStep);
    }

    [Fact]
    public async Task TrackGrievanceAsync_MismatchMobileNo_ReturnsNull()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 10,
            GrievanceNo = "GRV-2026-000010",
            CitizenId = 1,
            Citizen = new CitizenMasterEntity { Id = 1, Name = "Test Citizen", MobileNo = "9876543210" },
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        // Act
        var result = await _service.TrackGrievanceAsync("GRV-2026-000010", "1111111111", CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task TrackGrievanceAsync_WithoutMobileNo_ReturnsSanitizedPublicView()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 10,
            GrievanceNo = "GRV-2026-000010",
            CitizenId = 1,
            Citizen = new CitizenMasterEntity { Id = 1, Name = "Prajwal Bhoyar", MobileNo = "9876543210" },
            GrievanceDepartment = new GrievanceDepartmentMasterEntity { Id = 1, DepartmentName = "Water Department" },
            CurrentState = new GrievanceWorkflowStateEntity { Id = 2, StateName = "In Progress" },
            RoadLandmark = "Near Gandhi Square",
            Latitude = 19.0760m,
            Longitude = 72.8777m,
            SubmittedDate = DateTime.Now.AddDays(-2),
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        // Act
        var result = await _service.TrackGrievanceAsync("GRV-2026-000010", null, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("GRV-2026-000010", result.GrievanceNo);
        Assert.Equal(0, result.CitizenId); // Scrubbed
        Assert.Equal("P*****l B****r", result.CitizenName); // Masked
        Assert.Equal("XXXXXX3210", result.MaskedMobileNo); // Masked
        Assert.Null(result.RoadLandmark); // Scrubbed for privacy
        Assert.Null(result.Latitude); // Scrubbed for privacy
        Assert.Null(result.Longitude); // Scrubbed for privacy
    }

    #endregion

    #region Workflow Operations (Assign, Forward, Transition, History) Tests

    [Fact]
    public async Task AssignOfficerAsync_ValidRequest_AssignsOfficerAndLogsActivity()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 5,
            GrievanceNo = "GRV-2026-000005",
            CurrentStateId = 1,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(app);

        var dto = new AssignGrievanceDto
        {
            AssignedToUserId = 42,
            Remark = "Assigned for field verification"
        };

        // Act
        var result = await _service.AssignOfficerAsync(5, dto, actionByUserId: 1);

        // Assert
        Assert.Equal(42, app.CurrentAssignedToUserId);
        _mockRepository.Verify(r => r.UpdateAsync(app, It.IsAny<CancellationToken>()), Times.Once);
        _mockActivityLogRepository.Verify(r => r.AddAsync(It.Is<GrievanceActivityLogEntity>(l =>
            l.GrievanceApplicationId == 5 &&
            l.ActionByUserId == 1 &&
            l.AssignedToUserId == 42 &&
            l.Remark == "Assigned for field verification"), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AssignOfficerAsync_NonExistingGrievance_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceApplicationEntity?)null);

        var dto = new AssignGrievanceDto { AssignedToUserId = 42 };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.AssignOfficerAsync(999, dto, 1));
    }

    [Fact]
    public async Task ForwardToDepartmentAsync_ValidRequest_ForwardsAndCreatesDeptForwardingRecord()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 7,
            GrievanceNo = "GRV-2026-000007",
            GrievanceDepartmentId = 1,
            CurrentStateId = 1,
            IsActive = true
        };

        var targetDept = new GrievanceDepartmentMasterEntity
        {
            Id = 3,
            DepartmentName = "Sanitation & Drainage",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(app);
        _mockDeptRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetDept);

        var dto = new ForwardGrievanceDto
        {
            ForwardedToDeptId = 3,
            AssignedToUserId = 55,
            Remark = "Forwarded to Sanitation team for clearing blockage",
            UpdatePrimaryDepartment = true
        };

        // Act
        var result = await _service.ForwardToDepartmentAsync(7, dto, actionByUserId: 2);

        // Assert
        Assert.Equal(3, app.GrievanceDepartmentId);
        Assert.Equal(55, app.CurrentAssignedToUserId);
        _mockRepository.Verify(r => r.UpdateAsync(app, It.IsAny<CancellationToken>()), Times.Once);
        _mockActivityLogRepository.Verify(r => r.AddAsync(It.Is<GrievanceActivityLogEntity>(l =>
            l.GrievanceApplicationId == 7 &&
            l.ActionByUserId == 2 &&
            l.AssignedToUserId == 55), It.IsAny<CancellationToken>()), Times.Once);
        _mockDeptForwardingRepository.Verify(r => r.AddAsync(It.Is<GrievanceDeptForwardingEntity>(f =>
            f.GrievanceApplicationId == 7 &&
            f.ForwardedToDeptId == 3 &&
            f.AssignedToUserId == 55 &&
            f.ForwardingStatus == "PENDING"), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ForwardToDepartmentAsync_InvalidDepartment_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 8, IsActive = true };
        _mockRepository.Setup(r => r.GetByIdAsync(8, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockDeptRepository.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((GrievanceDepartmentMasterEntity?)null);

        var dto = new ForwardGrievanceDto { ForwardedToDeptId = 99 };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.ForwardToDepartmentAsync(8, dto, 1));
    }

    [Fact]
    public async Task TransitionStateAsync_ValidRequest_TransitionsStateAndLogsActivity()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 12,
            WorkflowId = 1,
            CurrentStateId = 1,
            IsActive = true
        };

        var nextState = new GrievanceWorkflowStateEntity
        {
            Id = 2,
            WorkflowId = 1,
            StateName = "Under Investigation",
            IsActive = true,
            IsFinal = false
        };

        var transitions = new List<GrievanceWorkflowTransitionEntity>
        {
            new() { Id = 10, WorkflowId = 1, FromStateId = 1, ToStateId = 2, TransitionName = "Start Investigation", IsActive = true }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(app);
        _mockStateRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(nextState);
        _mockWorkflowTransitionRepository.Setup(r => r.GetQueryable())
            .Returns(transitions.BuildMock());

        var dto = new TransitionGrievanceStateDto
        {
            ToStateId = 2,
            AssignedToUserId = 77,
            Remark = "Investigating site issue"
        };

        // Act
        var result = await _service.TransitionStateAsync(12, dto, actionByUserId: 1);

        // Assert
        Assert.Equal(2, app.CurrentStateId);
        Assert.Equal(77, app.CurrentAssignedToUserId);
        _mockRepository.Verify(r => r.UpdateAsync(app, It.IsAny<CancellationToken>()), Times.Once);
        _mockActivityLogRepository.Verify(r => r.AddAsync(It.Is<GrievanceActivityLogEntity>(l =>
            l.GrievanceApplicationId == 12 &&
            l.FromStateId == 1 &&
            l.ToStateId == 2 &&
            l.ActionByUserId == 1 &&
            l.AssignedToUserId == 77), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TransitionStateAsync_FinalResolvedState_SetsResolvedAndClosedDates()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 15,
            WorkflowId = 1,
            CurrentStateId = 2,
            IsActive = true
        };

        var resolvedState = new GrievanceWorkflowStateEntity
        {
            Id = 4,
            WorkflowId = 1,
            StateName = "Resolved & Closed",
            IsActive = true,
            IsFinal = true
        };

        var transitions = new List<GrievanceWorkflowTransitionEntity>
        {
            new() { Id = 20, WorkflowId = 1, FromStateId = 2, ToStateId = 4, TransitionName = "Resolve Ticket", IsActive = true }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(15, It.IsAny<CancellationToken>()))
            .ReturnsAsync(app);
        _mockStateRepository.Setup(r => r.GetByIdAsync(4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedState);
        _mockWorkflowTransitionRepository.Setup(r => r.GetQueryable())
            .Returns(transitions.BuildMock());

        var dto = new TransitionGrievanceStateDto
        {
            ToStateId = 4,
            Remark = "Issue resolved on-site and verified."
        };

        // Act
        await _service.TransitionStateAsync(15, dto, actionByUserId: 5);

        // Assert
        Assert.Equal(4, app.CurrentStateId);
        Assert.NotNull(app.ResolvedDate);
        Assert.NotNull(app.ClosedDate);
    }

    [Fact]
    public async Task TransitionStateAsync_RemarkRequired_ThrowsValidationException_WhenRemarkEmpty()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 18,
            WorkflowId = 1,
            CurrentStateId = 1,
            IsActive = true
        };

        var nextState = new GrievanceWorkflowStateEntity
        {
            Id = 3,
            WorkflowId = 1,
            StateName = "Rejected",
            IsActive = true
        };

        var transitions = new List<GrievanceWorkflowTransitionEntity>
        {
            new() { Id = 30, WorkflowId = 1, FromStateId = 1, ToStateId = 3, TransitionName = "Reject", RemarkRequired = true, IsActive = true }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(18, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockStateRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>())).ReturnsAsync(nextState);
        _mockWorkflowTransitionRepository.Setup(r => r.GetQueryable()).Returns(transitions.BuildMock());

        var dto = new TransitionGrievanceStateDto
        {
            ToStateId = 3,
            Remark = "   " // Empty remark
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.TransitionStateAsync(18, dto, 1));
    }

    [Fact]
    public async Task TransitionStateAsync_MismatchedTransitionId_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 19,
            WorkflowId = 1,
            CurrentStateId = 1,
            IsActive = true
        };

        var nextState = new GrievanceWorkflowStateEntity
        {
            Id = 2,
            WorkflowId = 1,
            StateName = "Under Investigation",
            IsActive = true
        };

        var transitions = new List<GrievanceWorkflowTransitionEntity>
        {
            new() { Id = 10, WorkflowId = 1, FromStateId = 1, ToStateId = 2, TransitionName = "Investigate", IsActive = true }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(19, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockStateRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(nextState);
        _mockWorkflowTransitionRepository.Setup(r => r.GetQueryable()).Returns(transitions.BuildMock());

        var dto = new TransitionGrievanceStateDto
        {
            ToStateId = 2,
            TransitionId = 999, // Mismatched ID
            Remark = "Proceed"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.TransitionStateAsync(19, dto, 1));
    }

    [Fact]
    public async Task TransitionStateAsync_TargetStateDifferentWorkflow_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 16,
            WorkflowId = 1,
            CurrentStateId = 2,
            IsActive = true
        };

        var otherWorkflowState = new GrievanceWorkflowStateEntity
        {
            Id = 99,
            WorkflowId = 2, // Different workflow
            StateName = "Road Inspected",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(16, It.IsAny<CancellationToken>()))
            .ReturnsAsync(app);
        _mockStateRepository.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync(otherWorkflowState);

        var dto = new TransitionGrievanceStateDto
        {
            ToStateId = 99,
            Remark = "Attempting cross-workflow transition"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.TransitionStateAsync(16, dto, 1));
    }

    [Fact]
    public async Task TransitionStateAsync_DisallowedTransitionRule_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 17,
            WorkflowId = 1,
            CurrentStateId = 1, // Registered
            IsActive = true
        };

        var targetState = new GrievanceWorkflowStateEntity
        {
            Id = 5, // Closed
            WorkflowId = 1,
            StateName = "Closed",
            IsActive = true
        };

        var allowedTransitions = new List<GrievanceWorkflowTransitionEntity>
        {
            // Only Registered -> Under Review is allowed
            new() { Id = 1, WorkflowId = 1, FromStateId = 1, ToStateId = 2, TransitionName = "Review", IsActive = true }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(17, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockStateRepository.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(targetState);
        _mockWorkflowTransitionRepository.Setup(r => r.GetQueryable()).Returns(allowedTransitions.BuildMock());

        var dto = new TransitionGrievanceStateDto
        {
            ToStateId = 5, // Trying to jump directly to Closed
            Remark = "Direct close"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.TransitionStateAsync(17, dto, 1));
    }

    [Fact]
    public async Task GetHistoryAsync_ValidGrievance_ReturnsTimelineHistory()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 20, IsActive = true };
        _mockRepository.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(app);

        var logs = new List<GrievanceActivityLogEntity>
        {
            new GrievanceActivityLogEntity
            {
                Id = 101,
                GrievanceApplicationId = 20,
                ActionByUserId = 1,
                ActionByUser = new NtisPlatform.Core.Entities.Master.UserEntity { Id = 1, FirstName = "Admin", LastName = "User" },
                Remark = "Initial Submission",
                ActionAt = DateTime.Now.AddDays(-2)
            },
            new GrievanceActivityLogEntity
            {
                Id = 102,
                GrievanceApplicationId = 20,
                ActionByUserId = 1,
                AssignedToUserId = 25,
                AssignedToUser = new NtisPlatform.Core.Entities.Master.UserEntity { Id = 25, FirstName = "Field", LastName = "Officer" },
                Remark = "Assigned to field officer",
                ActionAt = DateTime.Now.AddDays(-1)
            }
        };

        _mockActivityLogRepository.Setup(r => r.GetQueryable()).Returns(logs.BuildMock());

        // Act
        var history = await _service.GetHistoryAsync(20, CancellationToken.None);

        // Assert
        Assert.NotNull(history);
        Assert.Equal(2, history.Count);
        Assert.Equal("Admin User", history[0].ActionBy);
        Assert.Equal("Field Officer", history[1].AssignedTo);
        Assert.Equal(25, history[1].AssignedToUserId);
        Assert.True(history[1].IsCurrentStep);
    }

    #endregion

    #region Ward and Zone Validation Tests

    [Fact(Skip = "Zone and Ward validation is optional until GIS integration")]
    public async Task CreateAsync_InvalidZoneId_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 2,
            GrievanceTypeId = 3,
            ZoneId = 999
        };

        var citizen = new CitizenMasterEntity { Id = 1, IsActive = true };
        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(new List<CitizenMasterEntity> { citizen }.BuildMock());

        var dept = new GrievanceDepartmentMasterEntity { Id = 2, IsActive = true };
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceDepartmentMasterEntity> { dept }.BuildMock());

        var type = new GrievanceTypeMasterEntity { Id = 3, GrievanceDepartmentId = 2, IsActive = true };
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceTypeMasterEntity> { type }.BuildMock());

        _mockZoneRepository.Setup(r => r.GetQueryable()).Returns(new List<ZoneEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.True(ex.Errors.ContainsKey(nameof(createDto.ZoneId)));
    }

    [Fact(Skip = "Zone and Ward validation is optional until GIS integration")]
    public async Task CreateAsync_InvalidWardId_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 2,
            GrievanceTypeId = 3,
            WardId = 888
        };

        var citizen = new CitizenMasterEntity { Id = 1, IsActive = true };
        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(new List<CitizenMasterEntity> { citizen }.BuildMock());

        var dept = new GrievanceDepartmentMasterEntity { Id = 2, IsActive = true };
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceDepartmentMasterEntity> { dept }.BuildMock());

        var type = new GrievanceTypeMasterEntity { Id = 3, GrievanceDepartmentId = 2, IsActive = true };
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceTypeMasterEntity> { type }.BuildMock());

        _mockWardRepository.Setup(r => r.GetQueryable()).Returns(new List<WardEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.True(ex.Errors.ContainsKey(nameof(createDto.WardId)));
    }

    [Fact(Skip = "Zone and Ward validation is optional until GIS integration")]
    public async Task CreateAsync_MismatchedWardAndZone_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 2,
            GrievanceTypeId = 3,
            WardId = 10,
            ZoneId = 5
        };

        var citizen = new CitizenMasterEntity { Id = 1, IsActive = true };
        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(new List<CitizenMasterEntity> { citizen }.BuildMock());

        var dept = new GrievanceDepartmentMasterEntity { Id = 2, IsActive = true };
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceDepartmentMasterEntity> { dept }.BuildMock());

        var type = new GrievanceTypeMasterEntity { Id = 3, GrievanceDepartmentId = 2, IsActive = true };
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceTypeMasterEntity> { type }.BuildMock());

        var zone = new ZoneEntity { Id = 5, IsActive = true };
        _mockZoneRepository.Setup(r => r.GetQueryable()).Returns(new List<ZoneEntity> { zone }.BuildMock());

        // Ward belongs to Zone 9, NOT Zone 5
        var ward = new WardEntity { Id = 10, ZoneId = 9, IsActive = true };
        _mockWardRepository.Setup(r => r.GetQueryable()).Returns(new List<WardEntity> { ward }.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.True(ex.Errors.ContainsKey(nameof(createDto.WardId)));
    }

    [Fact(Skip = "Zone and Ward validation is optional until GIS integration")]
    public async Task UpdateAsync_MismatchedWardAndZone_ThrowsValidationException()
    {
        // Arrange
        var existing = new GrievanceApplicationEntity
        {
            Id = 50,
            CitizenId = 1,
            GrievanceDepartmentId = 2,
            GrievanceTypeId = 3,
            WorkflowId = 1,
            CurrentStateId = 1,
            WardId = 10,
            ZoneId = 5,
            IsActive = true
        };
        _mockRepository.Setup(r => r.GetByIdAsync(50, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdateGrievanceApplicationDto
        {
            GrievanceDepartmentId = 2,
            GrievanceTypeId = 3,
            WardId = 10,
            ZoneId = 99 // Mismatched zone
        };

        var dept = new GrievanceDepartmentMasterEntity { Id = 2, IsActive = true };
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceDepartmentMasterEntity> { dept }.BuildMock());

        var type = new GrievanceTypeMasterEntity { Id = 3, GrievanceDepartmentId = 2, IsActive = true };
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceTypeMasterEntity> { type }.BuildMock());

        var zone = new ZoneEntity { Id = 99, IsActive = true };
        _mockZoneRepository.Setup(r => r.GetQueryable()).Returns(new List<ZoneEntity> { zone }.BuildMock());

        var ward = new WardEntity { Id = 10, ZoneId = 5, IsActive = true };
        _mockWardRepository.Setup(r => r.GetQueryable()).Returns(new List<WardEntity> { ward }.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(50, updateDto));
        Assert.True(ex.Errors.ContainsKey(nameof(updateDto.WardId)));
    }

    [Fact]
    public async Task CreateAsync_MismatchedWardAndZone_Succeeds_WhenValidationIsOptional()
    {
        // Arrange
        GrievanceApplicationEntity? savedEntity = null;
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceApplicationEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceApplicationEntity, CancellationToken>((entity, _) =>
            {
                entity.Id = 1;
                savedEntity = entity;
            })
            .ReturnsAsync((GrievanceApplicationEntity entity, CancellationToken _) => entity);

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => savedEntity);

        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 2,
            GrievanceTypeId = 3,
            WardId = 10,
            ZoneId = 5
        };

        var citizen = new CitizenMasterEntity { Id = 1, IsActive = true };
        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(new List<CitizenMasterEntity> { citizen }.BuildMock());

        var dept = new GrievanceDepartmentMasterEntity { Id = 2, IsActive = true };
        _mockDeptRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceDepartmentMasterEntity> { dept }.BuildMock());

        var type = new GrievanceTypeMasterEntity { Id = 3, GrievanceDepartmentId = 2, IsActive = true };
        _mockTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceTypeMasterEntity> { type }.BuildMock());

        var workflows = new List<GrievanceWorkflowEntity>
        {
            new() { Id = 1, WorkflowName = "Default Workflow", IsDefault = true, IsActive = true }
        }.BuildMock();
        _mockWorkflowRepository.Setup(r => r.GetQueryable()).Returns(workflows);

        var states = new List<GrievanceWorkflowStateEntity>
        {
            new() { Id = 5, WorkflowId = 1, StateName = "Pending", IsInitial = true, IsActive = true, DisplayOrder = 1 }
        }.BuildMock();
        _mockStateRepository.Setup(r => r.GetQueryable()).Returns(states);

        var zone = new ZoneEntity { Id = 5, IsActive = true };
        _mockZoneRepository.Setup(r => r.GetQueryable()).Returns(new List<ZoneEntity> { zone }.BuildMock());

        // Ward belongs to Zone 9, NOT Zone 5 - but should NOT throw
        var ward = new WardEntity { Id = 10, ZoneId = 9, IsActive = true };
        _mockWardRepository.Setup(r => r.GetQueryable()).Returns(new List<WardEntity> { ward }.BuildMock());

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(savedEntity);
        Assert.Equal(10, savedEntity.WardId);
        Assert.Equal(5, savedEntity.ZoneId);
    }

    #endregion
}
