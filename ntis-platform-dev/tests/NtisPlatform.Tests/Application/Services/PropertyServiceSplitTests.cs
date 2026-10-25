using AutoMapper;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Options;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models;
using Xunit;

namespace NtisPlatform.Tests.Application.Services;

/// <summary>
/// Comprehensive tests for PropertyService SplitProperty functionality,
/// UPIC ID generation via UpicIdBuilderHelper, and unique key collision avoidance.
/// </summary>
public class PropertyServiceSplitTests
{
    private readonly Mock<IRepository<PropertyEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IPropertyRepository> _mockPropertyRepository;
    private readonly Mock<ILogger<PropertyService>> _mockLogger;
    private readonly Mock<IOptions<FeatureFlagsOptions>> _mockFeatureFlags;

    private readonly Mock<IRepository<WardEntity, int>> _mockWardRepository;
    private readonly Mock<IRepository<PropertyCategoryEntity, int>> _mockCategoryRepository;
    private readonly Mock<IRepository<SocietyDetailsEntity, int>> _mockSocietyRepository;
    private readonly Mock<IRepository<PropertyDetailsEntity, int>> _mockPropertyDetailsRepository;
    private readonly Mock<IRepository<RoomWiseSubmissionDetailsEntity, int>> _mockRoomWiseRepository;
    private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _mockAssessmentRepository;
    private readonly Mock<IRepository<GlobalSurveyWardAllocationEntity, int>> _mockWardAllocationRepository;
    private readonly Mock<IRepository<PropertyMapMasterEntity, int>> _mockPropertyMapMasterRepository;
    private readonly Mock<IRepository<PropertyMapDetailEntity, int>> _mockPropertyMapDetailRepository;
    private readonly Mock<IRepository<WingEntity, int>> _mockWingRepository;
    private readonly Mock<IRepository<UserEntity, int>> _mockUserRepository;
    private readonly Mock<IPropertyRuleApplicationLogService> _mockRuleLogService;
    private readonly Mock<IRepository<PropertyMastOldEntity, int>> _mockPropertyOldRepository;
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _mockPropertyTypeRepository;
    private readonly Mock<IPropertyWorkflowDetailsRepository> _mockWorkflowDetailsRepository;
    private readonly Mock<IRepository<PropertyWorkflowStageMasterEntity, int>> _mockWorkflowStageRepository;
    private readonly PropertyService _service;

    public PropertyServiceSplitTests()
    {
        _mockRepository = new Mock<IRepository<PropertyEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockPropertyRepository = new Mock<IPropertyRepository>();
        _mockLogger = new Mock<ILogger<PropertyService>>();
        _mockFeatureFlags = new Mock<IOptions<FeatureFlagsOptions>>();

        _mockWardRepository = new Mock<IRepository<WardEntity, int>>();
        _mockCategoryRepository = new Mock<IRepository<PropertyCategoryEntity, int>>();
        _mockSocietyRepository = new Mock<IRepository<SocietyDetailsEntity, int>>();
        _mockPropertyDetailsRepository = new Mock<IRepository<PropertyDetailsEntity, int>>();
        _mockRoomWiseRepository = new Mock<IRepository<RoomWiseSubmissionDetailsEntity, int>>();
        _mockAssessmentRepository = new Mock<IRepository<PropertyAssessmentEntity, int>>();
        _mockWardAllocationRepository = new Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>();
        _mockPropertyMapMasterRepository = new Mock<IRepository<PropertyMapMasterEntity, int>>();
        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());
        _mockPropertyMapDetailRepository = new Mock<IRepository<PropertyMapDetailEntity, int>>();
        _mockPropertyMapDetailRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());
        _mockWingRepository = new Mock<IRepository<WingEntity, int>>();
        _mockUserRepository = new Mock<IRepository<UserEntity, int>>();
        _mockRuleLogService = new Mock<IPropertyRuleApplicationLogService>();
        _mockPropertyOldRepository = new Mock<IRepository<PropertyMastOldEntity, int>>();
        _mockPropertyTypeRepository = new Mock<IRepository<PropertyTypeMasterEntity, int>>();
        _mockWorkflowDetailsRepository = new Mock<IPropertyWorkflowDetailsRepository>();
        _mockWorkflowStageRepository = new Mock<IRepository<PropertyWorkflowStageMasterEntity, int>>();
        _mockWorkflowStageRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyWorkflowStageMasterEntity>().BuildMock());
        _mockFeatureFlags.Setup(f => f.Value).Returns(new FeatureFlagsOptions());

        _service = new PropertyService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockPropertyRepository.Object,
            _mockLogger.Object,
            _mockFeatureFlags.Object,
            _mockWardRepository.Object,
            _mockCategoryRepository.Object,
            _mockSocietyRepository.Object,
            _mockPropertyDetailsRepository.Object,
            _mockRoomWiseRepository.Object,
            _mockAssessmentRepository.Object,
            _mockWardAllocationRepository.Object,
            new Mock<IRepository<OldWardMasterEntity, int>>().Object,
            _mockPropertyMapMasterRepository.Object,
            _mockPropertyMapDetailRepository.Object,
            _mockWingRepository.Object,
            _mockUserRepository.Object,
            _mockPropertyOldRepository.Object,
            _mockPropertyTypeRepository.Object,
            new Mock<IRepository<CommunicationDetailsEntity, int>>().Object,
            new Mock<IRepository<PropertyPhotoEntity, int>>().Object,
            new Mock<IRepository<DocumentBindingEntity, int>>().Object,
            new Mock<IRepository<DocumentEntity, int>>().Object,
            new Mock<IRepository<PropertyPhotoTypeEntity, int>>().Object,
            new Mock<IRepository<OwnerTypeMasterEntity, int>>().Object,
            new Mock<IRepository<WingEntity, int>>().Object,
            new Mock<IRepository<SocietyWingDetailsEntity, int>>().Object,
            ruleLogService: _mockRuleLogService.Object,
            workflowDetailsRepository: _mockWorkflowDetailsRepository.Object,
            workflowStageRepository: _mockWorkflowStageRepository.Object
        );
    }

    private void SetupValidUserAndWard(int userId, int wardId, int? moduleId = null)
    {
        var users = new List<UserEntity>
        {
            new UserEntity { Id = userId, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository.Setup(x => x.GetQueryable()).Returns(users.BuildMock());

        var allocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new GlobalSurveyWardAllocationEntity
            {
                UserId = userId,
                WardId = wardId,
                ModuleId = moduleId ?? 0,
                IsActive = true
            }
        };
        _mockWardAllocationRepository.Setup(x => x.GetQueryable()).Returns(allocations.BuildMock());
    }

    [Fact]
    public async Task SplitProperty_EmptyPropertyNo_ThrowsArgumentException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = string.Empty, NoOfSplit = 1, UserId = 1, WardId = 1 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.SplitProperty(dto));
        Assert.Equal("PROPERTY_NO_REQUIRED", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_ZeroSplits_ThrowsArgumentException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 0, UserId = 1, WardId = 1 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.SplitProperty(dto));
        Assert.Equal("NO_OF_SPLITS_GREATER_THAN_ZERO", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_InvalidUserId_ThrowsArgumentException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 0, WardId = 1 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.SplitProperty(dto));
        Assert.Equal("USER_ID_GREATER_THAN_ZERO", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_InvalidWardId_ThrowsArgumentException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 1, WardId = 0 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.SplitProperty(dto));
        Assert.Equal("WARD_ID_GREATER_THAN_ZERO", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_InvalidModuleId_ThrowsArgumentException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 1, WardId = 1, ModuleId = 0 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.SplitProperty(dto));
        Assert.Equal("MODULE_ID_GREATER_THAN_ZERO", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_ModuleNotAllocatedToUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 1, WardId = 1, ModuleId = 2 };
        SetupValidUserAndWard(userId: 1, wardId: 1, moduleId: 1); // User is allocated to moduleId 1, not 2

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.SplitProperty(dto));
        Assert.Equal("WARD_NOT_ALLOCATED_TO_USER", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_Success_PersistsWorkflowDetailsWithModuleId()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "P1",
            NoOfSplit = 2,
            UserId = 1,
            WardId = 1,
            ModuleId = 5,
            IsPartitionProperty = false,
            CreatedBy = 99,
            IsActive = true
        };
        SetupValidUserAndWard(1, 1, moduleId: 5);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "P1", WardId = 1, IsActive = true, PropertySeqNo = 1, TaxZoneId = 1 }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "10" });

        List<PropertyWorkflowDetailsEntity>? capturedWorkflow = null;
        _mockWorkflowDetailsRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyWorkflowDetailsEntity>, CancellationToken>((w, _) => capturedWorkflow = w.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Created.Count);
        Assert.NotNull(capturedWorkflow);
        Assert.Equal(2, capturedWorkflow.Count);
        Assert.All(capturedWorkflow, w =>
        {
            Assert.Equal(5, w.ModuleId);
            Assert.Equal(1, w.WorkflowStageId);
            Assert.True(w.CurrentStatus);
            Assert.True(w.IsActive);
            Assert.Equal(99, w.CreatedBy);
        });
        _mockWorkflowDetailsRepository.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SplitProperty_Success_CreatedByZeroOrNull_FallsBackToUserId()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "P1",
            NoOfSplit = 1,
            UserId = 1,
            WardId = 1,
            ModuleId = 1,
            IsPartitionProperty = false,
            CreatedBy = 0,
            IsActive = true
        };
        SetupValidUserAndWard(1, 1, moduleId: 1);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "P1", WardId = 1, IsActive = true, PropertySeqNo = 1, TaxZoneId = 1 }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "10" });

        List<PropertyWorkflowDetailsEntity>? capturedWorkflow = null;
        _mockWorkflowDetailsRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyWorkflowDetailsEntity>, CancellationToken>((w, _) => capturedWorkflow = w.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(capturedWorkflow);
        Assert.Single(capturedWorkflow);
        Assert.Equal(1, capturedWorkflow[0].CreatedBy); // Should fallback from 0 to UserId (1)
        Assert.Equal(1, capturedWorkflow[0].WorkflowStageId);
        Assert.Equal(1, capturedWorkflow[0].ModuleId);
    }

    [Fact]
    public async Task SplitProperty_Success_ResolvesGeoSequencingWorkflowStageId()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "P1",
            NoOfSplit = 1,
            UserId = 1,
            WardId = 1,
            ModuleId = 2,
            IsPartitionProperty = false,
            CreatedBy = 1,
            IsActive = true
        };
        SetupValidUserAndWard(1, 1, moduleId: 2);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "P1", WardId = 1, IsActive = true, PropertySeqNo = 1, TaxZoneId = 1 }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "10" });

        var stages = new List<PropertyWorkflowStageMasterEntity>
        {
            new PropertyWorkflowStageMasterEntity
            {
                Id = 42,
                StageName = WorkflowStageConstants.GeoSequencing,
                IsActive = true
            }
        };
        _mockWorkflowStageRepository.Setup(x => x.GetQueryable()).Returns(stages.BuildMock());

        List<PropertyWorkflowDetailsEntity>? capturedWorkflow = null;
        _mockWorkflowDetailsRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyWorkflowDetailsEntity>, CancellationToken>((w, _) => capturedWorkflow = w.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(capturedWorkflow);
        Assert.Single(capturedWorkflow);
        Assert.Equal(42, capturedWorkflow[0].WorkflowStageId);
        Assert.Equal(2, capturedWorkflow[0].ModuleId);
    }

    [Fact]
    public async Task SplitProperty_Success_AppliesBasePropertyAssessmentStatusIdToGeneratedProperties()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "P1",
            NoOfSplit = 2,
            UserId = 1,
            WardId = 1,
            ModuleId = 1,
            IsPartitionProperty = false,
            CreatedBy = 1,
            IsActive = true
        };
        SetupValidUserAndWard(1, 1, moduleId: 1);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity
            {
                Id = 1,
                PropertyNo = "P1",
                WardId = 1,
                IsActive = true,
                PropertySeqNo = 1,
                TaxZoneId = 1,
                PropertyAssessmentStatusId = 3 // Base property assessment status ID
            }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "10" });

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((p, _) => capturedProperties = p.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Created.Count);
        Assert.NotNull(capturedProperties);
        Assert.Equal(2, capturedProperties.Count);
        Assert.All(capturedProperties, p =>
        {
            Assert.Equal(3, p.PropertyAssessmentStatusId);
        });
    }

    [Fact]
    public async Task SplitProperty_UserNotFound_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 1, WardId = 1 };

        _mockUserRepository.Setup(x => x.GetQueryable()).Returns(new List<UserEntity>().BuildMock());
        _mockWardAllocationRepository.Setup(x => x.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.SplitProperty(dto));
        Assert.Equal("USER_NOT_EXIST_OR_INACTIVE", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_WardNotAllocated_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 1, WardId = 1 };

        var users = new List<UserEntity>
        {
            new UserEntity { Id = 1, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository.Setup(x => x.GetQueryable()).Returns(users.BuildMock());
        _mockWardAllocationRepository.Setup(x => x.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.SplitProperty(dto));
        Assert.Equal("WARD_NOT_ALLOCATED_TO_USER", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_MainPropertyNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 1, WardId = 1 };
        SetupValidUserAndWard(1, 1);

        _mockRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.SplitProperty(dto));
        Assert.Equal("BASE_PROPERTY_NOT_EXIST_OR_INACTIVE", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_IsPartitionProperty_MissingPartitionNo_ThrowsArgumentException()
    {
        // Arrange
        var dto = new PropertySplitCreateDto { PropertyNo = "P1", NoOfSplit = 1, UserId = 1, WardId = 1, IsPartitionProperty = true, PartitionNo = "" };
        SetupValidUserAndWard(1, 1);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "P1", WardId = 1, IsActive = true }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.SplitProperty(dto));
        Assert.Equal("PARTITION_NO_REQUIRED", ex.Message);
    }

    [Fact]
    public async Task SplitProperty_IsPartitionProperty_Success_GeneratesValidUpicAndNextSuffixes()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "P1",
            NoOfSplit = 2,
            UserId = 1,
            WardId = 1,
            IsPartitionProperty = true,
            PartitionNo = "A1",
            IsMainPropertyDataAttach = false,
            CreatedBy = 1,
            IsActive = true
        };
        SetupValidUserAndWard(1, 1);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "P1", WardId = 1, PartitionNo = "A1", IsActive = true, PropertySeqNo = 1, TaxZoneId = 1 },
            new PropertyEntity { Id = 2, PropertyNo = "P1", WardId = 1, PartitionNo = "A1A", IsActive = true } // Existing split
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "10" });

        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);
        _mockPropertyMapDetailRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyMapDetailEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Skipped);
        Assert.Equal(2, result.Created.Count);

        Assert.Equal("A1B", result.Created[0].GeneratedPartitionNo);
        Assert.Equal("A1C", result.Created[1].GeneratedPartitionNo);

        // Verify UPIC generation via UpicIdBuilderHelper (exact 30 chars, starts with ward and property)
        Assert.NotNull(capturedProperties);
        Assert.Equal(2, capturedProperties.Count);
        Assert.All(capturedProperties, prop =>
        {
            Assert.NotNull(prop.UPICId);
            Assert.Equal(30, prop.UPICId.Length);
            Assert.StartsWith("10P1", prop.UPICId);
        });

        _mockRepository.Verify(x => x.AddRangeAsync(It.Is<IEnumerable<PropertyEntity>>(list => list.Count() == 2), It.IsAny<CancellationToken>()), Times.Once);
        _mockPropertyMapDetailRepository.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyMapDetailEntity>>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(x => x.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SplitProperty_IsNotPartitionProperty_Success_WithOldDataAttached()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "P123",
            NoOfSplit = 2,
            UserId = 1,
            WardId = 1,
            IsPartitionProperty = false,
            IsOldPropertyDataAttach = true,
            CreatedBy = 1,
            IsActive = true
        };
        SetupValidUserAndWard(1, 1);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "P123", WardId = 1, PartitionNo = "A1", IsActive = true, PropertySeqNo = 1, TaxZoneId = 1 },
            new PropertyEntity { Id = 2, PropertyNo = "P123A", WardId = 1, IsActive = true } // Existing split
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "10" });

        var mapDetails = new List<PropertyMapDetailEntity>
        {
            new PropertyMapDetailEntity { PropertyIdNew = 1, PropertyIdOld = 99, IsActive = true }
        };
        _mockPropertyMapDetailRepository.Setup(x => x.GetQueryable()).Returns(mapDetails.BuildMock());
        _mockPropertyOldRepository.Setup(x => x.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyMastOldEntity
            {
                Id = 99,
                OldOwnerName = "Old Owner",
                OldOwnerNameEnglish = "Old Owner English",
                OldWardNo = "1",
                OldPropertyNo = "P123"
            });

        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());

        _mockMapper.Setup(x => x.Map<PropertyEntity>(It.IsAny<PropertyEntity>()))
            .Returns((PropertyEntity src) => new PropertyEntity { PropertyNo = src.PropertyNo, WardId = src.WardId, PartitionNo = src.PartitionNo });

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);
        _mockPropertyMapDetailRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyMapDetailEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Skipped);
        Assert.Equal(2, result.Created.Count);
        Assert.NotNull(result.OldPropertyIds);
        Assert.Contains(99, result.OldPropertyIds);

        Assert.Equal("P123B", result.Created[0].GeneratedPropertyNo);
        Assert.Equal("P123C", result.Created[1].GeneratedPropertyNo);

        Assert.NotNull(capturedProperties);
        Assert.Equal("Old Owner", capturedProperties[0].OwnerName);
        Assert.Equal("Old Owner English", capturedProperties[0].OwnerNameEnglish);

        // Validate UPIC format
        Assert.All(capturedProperties, prop =>
        {
            Assert.NotNull(prop.UPICId);
            Assert.Equal(30, prop.UPICId.Length);
            Assert.StartsWith("10P123", prop.UPICId);
        });

        _mockRepository.Verify(x => x.AddRangeAsync(It.Is<IEnumerable<PropertyEntity>>(list => list.Count() == 2), It.IsAny<CancellationToken>()), Times.Once);
        _mockPropertyMapDetailRepository.Verify(x => x.AddRangeAsync(It.Is<IEnumerable<PropertyMapDetailEntity>>(list => list.Count() == 2), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(x => x.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SplitProperty_WithInactiveExistingProperty_AvoidsCollisionAndAdvancesSuffix()
    {
        // Arrange - Base property 137885 with an INACTIVE 137885A in database (reproducing unique index collision bug)
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "137885",
            NoOfSplit = 1,
            UserId = 1,
            WardId = 88,
            IsPartitionProperty = false,
            CreatedBy = 1,
            IsActive = true
        };
        SetupValidUserAndWard(1, 88);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "137885", WardId = 88, IsActive = true },
            new PropertyEntity { Id = 2, PropertyNo = "137885A", WardId = 88, IsActive = false } // Inactive record in DB!
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(88, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 88, WardNo = "W88" });
        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert - Suffix must advance to 'B' to avoid colliding with 137885A
        Assert.NotNull(result);
        Assert.Single(result.Created);
        Assert.Equal("137885B", result.Created[0].GeneratedPropertyNo);

        Assert.NotNull(capturedProperties);
        Assert.Single(capturedProperties);
        Assert.Equal("137885B", capturedProperties[0].PropertyNo);
        Assert.Equal(30, capturedProperties[0].UPICId!.Length);
    }

    [Fact]
    public async Task SplitProperty_WithPaddedWhitespaceInPropertyNo_CorrectlyTrimsAndAdvances()
    {
        // Arrange - Property in database has trailing space padding e.g. "137885A  "
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "137885 ",
            NoOfSplit = 1,
            UserId = 1,
            WardId = 88,
            IsPartitionProperty = false,
            CreatedBy = 1,
            IsActive = true
        };
        SetupValidUserAndWard(1, 88);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "137885  ", WardId = 88, IsActive = true },
            new PropertyEntity { Id = 2, PropertyNo = "137885A ", WardId = 88, IsActive = true }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(88, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 88, WardNo = "W88" });
        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert - Correctly extracts "A" despite padding and advances to "137885B"
        Assert.NotNull(result);
        Assert.Single(result.Created);
        Assert.Equal("137885B", result.Created[0].GeneratedPropertyNo);
        Assert.NotNull(capturedProperties);
        Assert.Equal("137885B", capturedProperties[0].PropertyNo);
    }

    [Fact]
    public async Task SplitProperty_WithVirtualPropertyTrue_GeneratesVpPrefixedPropertiesAndSetsFlag()
    {
        // Arrange - User payload with IsVirtualProperty = true, requesting 5 splits
        var dto = new PropertySplitCreateDto
        {
            WardId = 88,
            UserId = 1,
            PropertyNo = "137885",
            NoOfSplit = 5,
            IsPartitionProperty = false,
            PartitionNo = "",
            IsOldPropertyDataAttach = true,
            IsActive = true,
            CreatedBy = 1,
            IsVirtualProperty = true
        };
        SetupValidUserAndWard(1, 88);

        var baseProperty = new PropertyEntity
        {
            Id = 1,
            WardId = 88,
            PropertyNo = "137885",
            IsActive = true,
            TaxZoneId = 1,
            PropertyTypeId = 2,
            PropertySeqNo = 100
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyEntity> { baseProperty }.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(88, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 88, WardNo = "88" });
        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());
        _mockPropertyMapDetailRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Created.Count);
        var expectedNos = new[] { "VP137885A", "VP137885B", "VP137885C", "VP137885D", "VP137885E" };
        for (int i = 0; i < 5; i++)
        {
            Assert.Equal(expectedNos[i], result.Created[i].GeneratedPropertyNo);
            Assert.True(result.Created[i].IsVirtualProperty);
            Assert.Equal("137885", result.Created[i].ParentPropertyNo);
            Assert.False(result.Created[i].IsPartitionProperty);
        }

        Assert.NotNull(capturedProperties);
        Assert.Equal(5, capturedProperties.Count);
        for (int i = 0; i < 5; i++)
        {
            Assert.Equal(expectedNos[i], capturedProperties[i].PropertyNo);
            Assert.True(capturedProperties[i].IsVirtualProperty);
            Assert.NotNull(capturedProperties[i].UPICId);
            Assert.Contains(expectedNos[i], capturedProperties[i].UPICId);
        }
    }

    [Fact]
    public async Task SplitProperty_PartitionSplit_WithVirtualPropertyTrue_GeneratesVpPrefixedPropertyAndSetsFlag()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            WardId = 88,
            UserId = 1,
            PropertyNo = "137885",
            PartitionNo = "P1",
            NoOfSplit = 2,
            IsPartitionProperty = true,
            IsOldPropertyDataAttach = false,
            IsActive = true,
            CreatedBy = 1,
            IsVirtualProperty = true
        };
        SetupValidUserAndWard(1, 88);

        var baseProperty = new PropertyEntity
        {
            Id = 1,
            WardId = 88,
            PropertyNo = "137885",
            PartitionNo = "P1",
            IsActive = true,
            TaxZoneId = 1,
            PropertyTypeId = 2
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyEntity> { baseProperty }.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(88, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 88, WardNo = "88" });
        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Created.Count);
        Assert.Equal("VP137885", result.Created[0].GeneratedPropertyNo);
        Assert.Equal("P1A", result.Created[0].GeneratedPartitionNo);
        Assert.True(result.Created[0].IsVirtualProperty);
        Assert.Equal("VP137885", result.Created[1].GeneratedPropertyNo);
        Assert.Equal("P1B", result.Created[1].GeneratedPartitionNo);
        Assert.True(result.Created[1].IsVirtualProperty);

        Assert.NotNull(capturedProperties);
        Assert.Equal(2, capturedProperties.Count);
        Assert.Equal("VP137885", capturedProperties[0].PropertyNo);
        Assert.Equal("P1A", capturedProperties[0].PartitionNo);
        Assert.True(capturedProperties[0].IsVirtualProperty);
    }

    [Fact]
    public async Task SplitProperty_BasePropertyAlreadyVpPrefixed_AvoidsDuplicateVpPrefix()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            WardId = 88,
            UserId = 1,
            PropertyNo = "VP137885",
            NoOfSplit = 1,
            IsPartitionProperty = false,
            PartitionNo = "",
            IsOldPropertyDataAttach = false,
            IsActive = true,
            CreatedBy = 1,
            IsVirtualProperty = true
        };
        SetupValidUserAndWard(1, 88);

        var baseProperty = new PropertyEntity
        {
            Id = 1,
            WardId = 88,
            PropertyNo = "VP137885",
            IsActive = true,
            IsVirtualProperty = true
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyEntity> { baseProperty }.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(88, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 88, WardNo = "88" });
        _mockPropertyMapMasterRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyMapMasterEntity>().BuildMock());

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Created);
        Assert.Equal("VP137885A", result.Created[0].GeneratedPropertyNo);
        Assert.True(result.Created[0].IsVirtualProperty);

        Assert.NotNull(capturedProperties);
        Assert.Equal("VP137885A", capturedProperties[0].PropertyNo);
        Assert.True(capturedProperties[0].IsVirtualProperty);
    }

    [Fact]
    public async Task GetPropertyListAsync_EmptyPropertyNo_ThrowsArgumentException()
    {
        var request = new PropertyLookupRequestDto { PropertyNo = "", UserId = 1, WardId = 1 };
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.GetPropertyListAsync(request));
        Assert.Equal("PROPERTY_NO_REQUIRED", ex.Message);
    }

    [Fact]
    public async Task GetPropertyListAsync_Success_ReturnsHierarchy()
    {
        // Arrange
        var request = new PropertyLookupRequestDto { PropertyNo = "P100", UserId = 1, WardId = 1 };
        SetupValidUserAndWard(1, 1);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "P100", WardId = 1, IsActive = true, OwnerName = "Owner 1" },
            new PropertyEntity { Id = 2, PropertyNo = "P100A", WardId = 1, IsActive = true, OwnerName = "Owner Split A" },
            new PropertyEntity { Id = 3, PropertyNo = "P100B", WardId = 1, IsActive = true, OwnerName = "Owner Split B" }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockCategoryRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyCategoryEntity>().BuildMock());

        // Act
        var result = await _service.GetPropertyListAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("P100", result[0].PropertyNo);
        Assert.Equal(2, result[0].Splits.Count);
        Assert.Equal("P100A", result[0].Splits[0].PropertyNo);
        Assert.Equal("P100B", result[0].Splits[1].PropertyNo);
    }

    [Fact]
    public async Task GetPropertyListAsync_NoMatchingProperties_ReturnsEmptyList()
    {
        // Arrange
        var request = new PropertyLookupRequestDto { PropertyNo = "P999", UserId = 1, WardId = 1 };
        SetupValidUserAndWard(1, 1);

        _mockRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());
        _mockCategoryRepository.Setup(x => x.GetQueryable()).Returns(new List<PropertyCategoryEntity>().BuildMock());

        // Act
        var result = await _service.GetPropertyListAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task SplitProperty_WithMultipleOldMappings_SelectsLatestOldMapping()
    {
        // Arrange
        var dto = new PropertySplitCreateDto
        {
            PropertyNo = "P1",
            NoOfSplit = 1,
            UserId = 1,
            WardId = 1,
            IsPartitionProperty = false,
            CreatedBy = 1,
            IsActive = true,
            IsOldPropertyDataAttach = true
        };
        SetupValidUserAndWard(1, 1);

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 10, PropertyNo = "P1", WardId = 1, IsActive = true, PropertySeqNo = 1, TaxZoneId = 1 }
        };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "10" });

        var mapDetails = new List<PropertyMapDetailEntity>
        {
            new PropertyMapDetailEntity { Id = 1, PropertyIdNew = 10, PropertyIdOld = 101, IsActive = true },
            new PropertyMapDetailEntity { Id = 5, PropertyIdNew = 10, PropertyIdOld = 105, IsActive = true }
        };
        _mockPropertyMapDetailRepository.Setup(x => x.GetQueryable()).Returns(mapDetails.BuildMock());

        var oldProp105 = new PropertyMastOldEntity
        {
            Id = 105,
            OldOwnerName = "Latest Owner",
            OldOwnerNameEnglish = "Latest Owner English"
        };
        _mockPropertyOldRepository.Setup(x => x.GetByIdAsync(105, It.IsAny<CancellationToken>()))
            .ReturnsAsync(oldProp105);

        List<PropertyEntity>? capturedNewProperties = null;
        _mockRepository.Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((p, _) => capturedNewProperties = p.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SplitProperty(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.OldPropertyIds);
        Assert.Contains(105, result.OldPropertyIds);
        Assert.NotNull(capturedNewProperties);
        Assert.Single(capturedNewProperties);
        Assert.Equal("Latest Owner", capturedNewProperties[0].OwnerName);
        Assert.Equal("Latest Owner English", capturedNewProperties[0].OwnerNameEnglish);
    }
}
