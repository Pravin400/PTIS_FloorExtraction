using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Mappings.GrievanceMapping;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class GrievanceEscalationServiceTests
{
    private readonly Mock<IRepository<GrievanceEscalationEntity, int>> _mockRepository;
    private readonly Mock<IRepository<GrievanceApplicationEntity, int>> _mockApplicationRepository;
    private readonly Mock<IRepository<GrievanceActivityLogEntity, long>> _mockActivityLogRepository;
    private readonly Mock<IRepository<UserEntity, int>> _mockUserRepository;
    private readonly Mock<IRepository<WardEntity, int>> _mockWardRepository;
    private readonly Mock<IRepository<ZoneEntity, int>> _mockZoneRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly IMapper _mapper;
    private readonly GrievanceEscalationService _service;

    public GrievanceEscalationServiceTests()
    {
        _mockRepository = new Mock<IRepository<GrievanceEscalationEntity, int>>();
        _mockApplicationRepository = new Mock<IRepository<GrievanceApplicationEntity, int>>();
        _mockActivityLogRepository = new Mock<IRepository<GrievanceActivityLogEntity, long>>();
        _mockUserRepository = new Mock<IRepository<UserEntity, int>>();
        _mockWardRepository = new Mock<IRepository<WardEntity, int>>();
        _mockZoneRepository = new Mock<IRepository<ZoneEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<GrievanceEscalationMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        var defaultEscalations = new List<GrievanceEscalationEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(defaultEscalations.BuildMock());

        var defaultApplications = new List<GrievanceApplicationEntity>();
        _mockApplicationRepository.Setup(r => r.GetQueryable()).Returns(defaultApplications.BuildMock());

        var defaultLogs = new List<GrievanceActivityLogEntity>();
        _mockActivityLogRepository.Setup(r => r.GetQueryable()).Returns(defaultLogs.BuildMock());

        var defaultWards = new List<WardEntity>();
        _mockWardRepository.Setup(r => r.GetQueryable()).Returns(defaultWards.BuildMock());

        var defaultZones = new List<ZoneEntity>();
        _mockZoneRepository.Setup(r => r.GetQueryable()).Returns(defaultZones.BuildMock());

        _mockUserRepository.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserEntity { Id = 1, IsActive = true });

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _service = new GrievanceEscalationService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockApplicationRepository.Object,
            _mockActivityLogRepository.Object,
            _mockUserRepository.Object,
            _mockWardRepository.Object,
            _mockZoneRepository.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WhenExistsAndActive_ReturnsDto()
    {
        // Arrange
        var entity = new GrievanceEscalationEntity
        {
            Id = 1,
            GrievanceApplicationId = 10,
            EscalatedByUserId = 2,
            Reason = "Pothole unattended for 2 weeks",
            Priority = "URGENT",
            EscalationStatus = "PENDING",
            IsActive = true,
            GrievanceApplication = new GrievanceApplicationEntity { Id = 10, GrievanceNo = "GRV-2026-000010" }
        };

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceEscalationEntity> { entity }.BuildMock());

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(10, result.GrievanceApplicationId);
        Assert.Equal("GRV-2026-000010", result.GrievanceNo);
        Assert.Equal("URGENT", result.Priority);
        Assert.Equal("PENDING", result.EscalationStatus);
    }

    [Fact]
    public async Task GetByIdAsync_WhenNonExistent_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceEscalationEntity>().BuildMock());
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceEscalationEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_WhenInactive_ReturnsNull()
    {
        // Arrange
        var entity = new GrievanceEscalationEntity
        {
            Id = 2,
            GrievanceApplicationId = 10,
            IsActive = false
        };

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceEscalationEntity> { entity }.BuildMock());
        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        // Act
        var result = await _service.GetByIdAsync(2);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_ValidRequest_CreatesEscalationAndLogsActivity()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 5,
            GrievanceNo = "GRV-2026-000005",
            WardId = 3,
            ZoneId = 1,
            GrievanceDepartmentId = 10,
            CurrentAssignedToUserId = 20,
            CurrentStateId = 2,
            IsActive = true,
            ClosedDate = null
        };

        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceEscalationEntity>().BuildMock());

        GrievanceEscalationEntity? savedEscalation = null;
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceEscalationEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceEscalationEntity, CancellationToken>((entity, _) =>
            {
                entity.Id = 101;
                savedEscalation = entity;
            })
            .ReturnsAsync((GrievanceEscalationEntity entity, CancellationToken _) => entity);

        GrievanceActivityLogEntity? savedLog = null;
        _mockActivityLogRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceActivityLogEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceActivityLogEntity, CancellationToken>((log, _) =>
            {
                savedLog = log;
            })
            .ReturnsAsync((GrievanceActivityLogEntity log, CancellationToken _) => log);

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 5,
            Reason = "No action taken for over 10 days by assigned officer.",
            Priority = "URGENT"
        };

        // Act
        var result = await _service.EscalateGrievanceAsync(dto, escalatedByUserId: 15);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(savedEscalation);
        Assert.Equal(5, savedEscalation.GrievanceApplicationId);
        Assert.Equal(15, savedEscalation.EscalatedByUserId);
        Assert.Equal(15, savedEscalation.CreatedBy);
        Assert.Equal(3, savedEscalation.WardId);
        Assert.Equal(1, savedEscalation.ZoneId);
        Assert.Equal(10, savedEscalation.TargetDepartmentId);
        Assert.Equal(20, savedEscalation.TargetAssignedToUserId);
        Assert.Equal("PENDING", savedEscalation.EscalationStatus);
        Assert.Equal("URGENT", savedEscalation.Priority);

        Assert.NotNull(savedLog);
        Assert.Equal(5, savedLog.GrievanceApplicationId);
        Assert.Equal(2, savedLog.FromStateId);
        Assert.Equal(2, savedLog.ToStateId);
        Assert.Equal(15, savedLog.ActionByUserId);
        Assert.Equal(20, savedLog.AssignedToUserId);
        Assert.Contains("[OBSERVER POKE - URGENT]", savedLog.Remark);
        Assert.Contains("No action taken for over 10 days", savedLog.Remark);

        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WithExplicitWardAndZone_UsesExplicitWardAndZone()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 7,
            WardId = 3,
            ZoneId = 1,
            GrievanceDepartmentId = 10,
            CurrentAssignedToUserId = 20,
            CurrentStateId = 2,
            IsActive = true,
            ClosedDate = null
        };

        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        _mockZoneRepository.Setup(r => r.GetQueryable())
            .Returns(new List<ZoneEntity> { new ZoneEntity { Id = 4, IsActive = true } }.BuildMock());

        _mockWardRepository.Setup(r => r.GetQueryable())
            .Returns(new List<WardEntity> { new WardEntity { Id = 8, ZoneId = 4, IsActive = true } }.BuildMock());

        GrievanceEscalationEntity? savedEscalation = null;
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceEscalationEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceEscalationEntity, CancellationToken>((entity, _) =>
            {
                entity.Id = 102;
                savedEscalation = entity;
            })
            .ReturnsAsync((GrievanceEscalationEntity entity, CancellationToken _) => entity);

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 7,
            WardId = 8,
            ZoneId = 4,
            Reason = "Cross-ward escalation",
            Priority = ""
        };

        // Act
        var result = await _service.EscalateGrievanceAsync(dto, escalatedByUserId: 12);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(savedEscalation);
        Assert.Equal(8, savedEscalation.WardId);
        Assert.Equal(4, savedEscalation.ZoneId);
        Assert.Equal("NORMAL", savedEscalation.Priority);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenGrievanceDoesNotExist_ThrowsValidationException()
    {
        // Arrange
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity>().BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 999,
            Reason = "Complaint overdue"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1));
        Assert.Contains("Active Grievance application with ID '999' does not exist.", ex.Message);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenGrievanceIsInactive_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 8,
            IsActive = false
        };

        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 8,
            Reason = "Inactive grievance"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1));
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenGrievanceIsClosed_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 9,
            IsActive = true,
            ClosedDate = DateTime.Now.AddDays(-1)
        };

        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 9,
            Reason = "Re-escalating a closed ticket"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1));
        Assert.Contains("Cannot escalate a grievance complaint that is already closed.", ex.Message);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenPendingEscalationAlreadyExists_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 10,
            IsActive = true,
            ClosedDate = null
        };

        var existingPendingEscalation = new GrievanceEscalationEntity
        {
            Id = 1,
            GrievanceApplicationId = 10,
            EscalatedByUserId = 5,
            EscalationStatus = "PENDING",
            IsActive = true
        };

        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceEscalationEntity> { existingPendingEscalation }.BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            Reason = "Second escalation while first is still pending"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 5));
        Assert.Contains("A pending poke/escalation for this grievance ticket is already active.", ex.Message);
    }

    [Fact]
    public async Task RespondToEscalationAsync_ValidRequest_UpdatesEscalationAndLogsActivity()
    {
        // Arrange
        var escalation = new GrievanceEscalationEntity
        {
            Id = 50,
            GrievanceApplicationId = 12,
            EscalatedByUserId = 3,
            EscalationStatus = "PENDING",
            TargetAssignedToUserId = 25,
            IsActive = true
        };

        var app = new GrievanceApplicationEntity
        {
            Id = 12,
            CurrentStateId = 4,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(escalation);

        _mockApplicationRepository.Setup(r => r.GetByIdAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(app);

        GrievanceActivityLogEntity? savedLog = null;
        _mockActivityLogRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceActivityLogEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceActivityLogEntity, CancellationToken>((log, _) =>
            {
                savedLog = log;
            })
            .ReturnsAsync((GrievanceActivityLogEntity log, CancellationToken _) => log);

        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Field inspection scheduled for tomorrow morning.",
            EscalationStatus = "ACKNOWLEDGED"
        };

        // Act
        var result = await _service.RespondToEscalationAsync(50, dto, staffUserId: 8);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Field inspection scheduled for tomorrow morning.", escalation.StaffResponse);
        Assert.Equal("ACKNOWLEDGED", escalation.EscalationStatus);
        Assert.Equal(8, escalation.RespondedByUserId);
        Assert.Equal(8, escalation.UpdatedBy);
        Assert.NotNull(escalation.RespondedAt);
        Assert.NotNull(escalation.UpdatedDate);

        Assert.NotNull(savedLog);
        Assert.Equal(12, savedLog.GrievanceApplicationId);
        Assert.Equal(4, savedLog.FromStateId);
        Assert.Equal(4, savedLog.ToStateId);
        Assert.Equal(8, savedLog.ActionByUserId);
        Assert.Equal(25, savedLog.AssignedToUserId);
        Assert.Contains("[STAFF RESPONSE TO OBSERVER (ACKNOWLEDGED)]", savedLog.Remark);
        Assert.Contains("Field inspection scheduled", savedLog.Remark);

        _mockRepository.Verify(r => r.UpdateAsync(escalation, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RespondToEscalationAsync_WhenNonExistent_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceEscalationEntity?)null);

        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Acknowledged",
            EscalationStatus = "ACKNOWLEDGED"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.RespondToEscalationAsync(999, dto, staffUserId: 1));
    }

    [Fact]
    public async Task RespondToEscalationAsync_WhenInactive_ThrowsKeyNotFoundException()
    {
        // Arrange
        var escalation = new GrievanceEscalationEntity
        {
            Id = 51,
            IsActive = false
        };

        _mockRepository.Setup(r => r.GetByIdAsync(51, It.IsAny<CancellationToken>()))
            .ReturnsAsync(escalation);

        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Acknowledged",
            EscalationStatus = "ACKNOWLEDGED"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.RespondToEscalationAsync(51, dto, staffUserId: 1));
    }

    [Fact]
    public async Task GetByGrievanceIdAsync_ReturnsOrderedEscalations()
    {
        // Arrange
        var escalations = new List<GrievanceEscalationEntity>
        {
            new()
            {
                Id = 1,
                GrievanceApplicationId = 10,
                Reason = "First escalation",
                CreatedDate = DateTime.Now.AddDays(-2),
                IsActive = true
            },
            new()
            {
                Id = 2,
                GrievanceApplicationId = 10,
                Reason = "Second escalation",
                CreatedDate = DateTime.Now.AddDays(-1),
                IsActive = true
            },
            new()
            {
                Id = 3,
                GrievanceApplicationId = 99,
                Reason = "Different grievance",
                CreatedDate = DateTime.Now,
                IsActive = true
            },
            new()
            {
                Id = 4,
                GrievanceApplicationId = 10,
                Reason = "Inactive escalation",
                CreatedDate = DateTime.Now,
                IsActive = false
            }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(escalations.BuildMock());

        // Act
        var result = await _service.GetByGrievanceIdAsync(10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(2, result[0].Id);
        Assert.Equal(1, result[1].Id);
    }

    [Fact]
    public async Task GetByWardIdAsync_AppliesWardFilterAndReturnsPagedResult()
    {
        // Arrange
        var escalations = new List<GrievanceEscalationEntity>
        {
            new() { Id = 1, GrievanceApplicationId = 10, WardId = 5, IsActive = true, CreatedDate = DateTime.Now },
            new() { Id = 2, GrievanceApplicationId = 11, WardId = 5, IsActive = true, CreatedDate = DateTime.Now },
            new() { Id = 3, GrievanceApplicationId = 12, WardId = 6, IsActive = true, CreatedDate = DateTime.Now }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(escalations.BuildMock());

        var query = new GrievanceEscalationQueryParameters { PageNumber = 1, PageSize = 10 };

        // Act
        var result = await _service.GetByWardIdAsync(5, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, query.WardId);
    }

    [Fact]
    public async Task GetByZoneIdAsync_AppliesZoneFilterAndReturnsPagedResult()
    {
        // Arrange
        var escalations = new List<GrievanceEscalationEntity>
        {
            new() { Id = 1, GrievanceApplicationId = 10, ZoneId = 2, IsActive = true, CreatedDate = DateTime.Now },
            new() { Id = 2, GrievanceApplicationId = 11, ZoneId = 2, IsActive = true, CreatedDate = DateTime.Now }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(escalations.BuildMock());

        var query = new GrievanceEscalationQueryParameters { PageNumber = 1, PageSize = 10 };

        // Act
        var result = await _service.GetByZoneIdAsync(2, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, query.ZoneId);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenDbUpdateExceptionOccurs_TranslatesToValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity
        {
            Id = 5,
            CurrentStateId = 2,
            IsActive = true,
            ClosedDate = null
        };

        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceEscalationEntity>().BuildMock());

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateException("Violation of UNIQUE KEY constraint 'UQ_GrievanceEscalation_PendingActive'. Cannot insert duplicate key."));

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 5,
            Reason = "Concurrent duplicate poke"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 15));
        Assert.Contains("A pending poke/escalation for this grievance ticket is already active.", ex.Message);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenUserNotFoundOrInactive_ThrowsValidationException()
    {
        // Arrange
        _mockUserRepository.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserEntity?)null);

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 5,
            Reason = "Poke with invalid user"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 99));
        Assert.Contains("Active observer or staff user does not exist.", ex.Message);
    }

    [Fact]
    public async Task RespondToEscalationAsync_WhenStaffUserNotFoundOrInactive_ThrowsValidationException()
    {
        // Arrange
        var escalation = new GrievanceEscalationEntity
        {
            Id = 50,
            GrievanceApplicationId = 12,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(escalation);

        _mockUserRepository.Setup(r => r.GetByIdAsync(88, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserEntity { Id = 88, IsActive = false });

        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Inactive staff responding",
            EscalationStatus = "ACKNOWLEDGED"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.RespondToEscalationAsync(50, dto, staffUserId: 88));
        Assert.Contains("Active staff user does not exist.", ex.Message);
    }

    [Fact]
    public async Task RespondToEscalationAsync_WhenStatusInvalid_ThrowsValidationException()
    {
        // Arrange
        var escalation = new GrievanceEscalationEntity
        {
            Id = 50,
            GrievanceApplicationId = 12,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(escalation);

        _mockUserRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserEntity { Id = 1, IsActive = true });

        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Responding with invalid status",
            EscalationStatus = "INVALID_STATUS"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.RespondToEscalationAsync(50, dto, staffUserId: 1));
        Assert.True(ex.Errors.ContainsKey(nameof(dto.EscalationStatus)));
    }

    [Fact]
    public async Task RespondToEscalationAsync_WhenStatusIsPending_ThrowsValidationException()
    {
        // Arrange
        var escalation = new GrievanceEscalationEntity
        {
            Id = 50,
            GrievanceApplicationId = 12,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(escalation);

        _mockUserRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserEntity { Id = 1, IsActive = true });

        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Trying to set back to PENDING",
            EscalationStatus = "PENDING"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.RespondToEscalationAsync(50, dto, staffUserId: 1));
        Assert.True(ex.Errors.ContainsKey(nameof(dto.EscalationStatus)));
        Assert.Contains("Escalation status must be ACKNOWLEDGED, RESOLVED, REJECTED, or CLOSED.", ex.Message);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenZoneNotFoundOrInactive_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 10, IsActive = true };
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        _mockZoneRepository.Setup(r => r.GetQueryable())
            .Returns(new List<ZoneEntity>().BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            ZoneId = 999,
            Reason = "Testing invalid zone"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1));
        Assert.True(ex.Errors.ContainsKey(nameof(dto.ZoneId)));
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenWardNotFoundOrInactive_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 10, IsActive = true };
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        _mockWardRepository.Setup(r => r.GetQueryable())
            .Returns(new List<WardEntity>().BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            WardId = 888,
            Reason = "Testing invalid ward"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1));
        Assert.True(ex.Errors.ContainsKey(nameof(dto.WardId)));
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenWardDoesNotBelongToZone_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 10, IsActive = true, ZoneId = 1 };
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        var zone = new ZoneEntity { Id = 1, IsActive = true };
        _mockZoneRepository.Setup(r => r.GetQueryable())
            .Returns(new List<ZoneEntity> { zone }.BuildMock());

        // Ward belongs to Zone 2, but application/payload is Zone 1
        var ward = new WardEntity { Id = 5, ZoneId = 2, IsActive = true };
        _mockWardRepository.Setup(r => r.GetQueryable())
            .Returns(new List<WardEntity> { ward }.BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            WardId = 5,
            ZoneId = 1,
            Reason = "Testing mismatched ward and zone"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1));
        Assert.True(ex.Errors.ContainsKey(nameof(dto.WardId)));
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenOnlyWardProvided_ResolvesZoneFromWard()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 10, IsActive = true, ZoneId = 99 };
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        var ward = new WardEntity { Id = 5, ZoneId = 2, IsActive = true };
        _mockWardRepository.Setup(r => r.GetQueryable())
            .Returns(new List<WardEntity> { ward }.BuildMock());

        GrievanceEscalationEntity? savedEscalation = null;
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceEscalationEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceEscalationEntity, CancellationToken>((entity, _) =>
            {
                entity.Id = 201;
                savedEscalation = entity;
            })
            .ReturnsAsync((GrievanceEscalationEntity entity, CancellationToken _) => entity);

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            WardId = 5,
            ZoneId = null,
            Reason = "Escalation specifying only ward"
        };

        // Act
        var result = await _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(savedEscalation);
        Assert.Equal(5, savedEscalation.WardId);
        Assert.Equal(2, savedEscalation.ZoneId);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenAppHasWardAndNoZone_ResolvesZoneFromAppWard()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 10, IsActive = true, WardId = 5, ZoneId = null };
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        var ward = new WardEntity { Id = 5, ZoneId = 2, IsActive = true };
        _mockWardRepository.Setup(r => r.GetQueryable())
            .Returns(new List<WardEntity> { ward }.BuildMock());

        GrievanceEscalationEntity? savedEscalation = null;
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceEscalationEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceEscalationEntity, CancellationToken>((entity, _) =>
            {
                entity.Id = 202;
                savedEscalation = entity;
            })
            .ReturnsAsync((GrievanceEscalationEntity entity, CancellationToken _) => entity);

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            Reason = "Escalation with default ward from app"
        };

        // Act
        var result = await _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(savedEscalation);
        Assert.Equal(5, savedEscalation.WardId);
        Assert.Equal(2, savedEscalation.ZoneId);
    }

    [Fact]
    public async Task EscalateGrievanceAsync_WhenPriorityInvalid_ThrowsValidationException()
    {
        // Arrange
        var app = new GrievanceApplicationEntity { Id = 10, IsActive = true };
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(new List<GrievanceApplicationEntity> { app }.BuildMock());

        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            Reason = "Escalation with invalid priority",
            Priority = "CRITICAL"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.EscalateGrievanceAsync(dto, escalatedByUserId: 1));
        Assert.True(ex.Errors.ContainsKey(nameof(dto.Priority)));
        Assert.Contains("Priority must be one of: NORMAL, HIGH, URGENT.", ex.Message);
    }
}
