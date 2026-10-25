using AutoMapper;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Options;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Tests.Helpers;
using System.Linq.Expressions;

namespace NtisPlatform.Tests.Application.Services;

public class PropertyServicePartitionTests
{
    private readonly Mock<IRepository<PropertyEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly IMapper _mapper;
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
    private readonly Mock<IRepository<OldWardMasterEntity, int>> _mockOldWardMasterRepository;
    private readonly Mock<IRepository<PropertyMapMasterEntity, int>> _mockPropertyMapMasterRepository;
    private readonly Mock<IRepository<PropertyMapDetailEntity, int>> _mockPropertyMapDetailRepository;
    private readonly Mock<IRepository<WingEntity, int>> _mockWingRepository;
    private readonly Mock<IRepository<UserEntity, int>> _mockUserRepository;
    private readonly Mock<IRepository<PropertyMastOldEntity, int>> _mockPropertyOldRepository;
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _mockPropertyTypeRepository;
    private readonly Mock<IPropertyRuleApplicationLogService> _mockRuleLogService;
    private readonly Mock<IPropertyWorkflowDetailsRepository> _mockWorkflowDetailsRepository;
    private readonly Mock<IRepository<PropertyWorkflowStageMasterEntity, int>> _mockWorkflowStageRepository;

    private readonly PropertyService _service;

    public PropertyServicePartitionTests()
    {
        _mockRepository = new Mock<IRepository<PropertyEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mapper = AutoMapperTestHelper.CreateMapper();

        _mockPropertyRepository = new Mock<IPropertyRepository>();
        _mockLogger = new Mock<ILogger<PropertyService>>();
        _mockFeatureFlags = new Mock<IOptions<FeatureFlagsOptions>>();
        _mockFeatureFlags.Setup(f => f.Value).Returns(new FeatureFlagsOptions());

        _mockWardRepository = new Mock<IRepository<WardEntity, int>>();
        _mockCategoryRepository = new Mock<IRepository<PropertyCategoryEntity, int>>();
        _mockSocietyRepository = new Mock<IRepository<SocietyDetailsEntity, int>>();
        _mockPropertyDetailsRepository = new Mock<IRepository<PropertyDetailsEntity, int>>();
        _mockRoomWiseRepository = new Mock<IRepository<RoomWiseSubmissionDetailsEntity, int>>();
        _mockAssessmentRepository = new Mock<IRepository<PropertyAssessmentEntity, int>>();
        _mockWardAllocationRepository = new Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>();
        _mockOldWardMasterRepository = new Mock<IRepository<OldWardMasterEntity, int>>();
        _mockPropertyMapMasterRepository = new Mock<IRepository<PropertyMapMasterEntity, int>>();
        _mockPropertyMapDetailRepository = new Mock<IRepository<PropertyMapDetailEntity, int>>();
        _mockWingRepository = new Mock<IRepository<WingEntity, int>>();
        _mockUserRepository = new Mock<IRepository<UserEntity, int>>();
        _mockPropertyOldRepository = new Mock<IRepository<PropertyMastOldEntity, int>>();
        _mockPropertyTypeRepository = new Mock<IRepository<PropertyTypeMasterEntity, int>>();
        _mockRuleLogService = new Mock<IPropertyRuleApplicationLogService>();
        _mockWorkflowDetailsRepository = new Mock<IPropertyWorkflowDetailsRepository>();
        _mockWorkflowStageRepository = new Mock<IRepository<PropertyWorkflowStageMasterEntity, int>>();
        var defaultStages = new List<PropertyWorkflowStageMasterEntity>
        {
            new() { Id = 1, StageName = WorkflowStageConstants.GeoSequencing, IsActive = true }
        };
        _mockWorkflowStageRepository.Setup(x => x.GetQueryable()).Returns(defaultStages.BuildMock());

        _service = new PropertyService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
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
            _mockOldWardMasterRepository.Object,
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

    private void SetupValidUserAndWardAllocation(int userId, int wardId, int? moduleId = null)
    {
        var users = new List<UserEntity>
        {
            new() { Id = userId, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { Id = 1, UserId = userId, WardId = wardId, ModuleId = moduleId ?? 1, IsActive = true }
        };
        _mockWardAllocationRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<GlobalSurveyWardAllocationEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(wardAllocations);
    }

    #region GenerateMissingPartition Tests

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenWardIdIsInvalid()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 0,
            MainPropertyNo = "100",
            UserId = 1
        };

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_WardId_is_Invalid.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenMainPropertyNoIsEmpty()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "   ",
            UserId = 1
        };

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_MainPropertyNo_is_required.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenUserIdIsInvalid()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 0
        };

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_UserId_is_required.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenUserNotFound()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 999
        };

        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserEntity>());

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_User_not_found.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenWardNotAllocated()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1
        };

        var users = new List<UserEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        _mockWardAllocationRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<GlobalSurveyWardAllocationEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GlobalSurveyWardAllocationEntity>());

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_Ward_not_allocated.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenWardAllocationIsMarkedForDeletion()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1
        };

        var users = new List<UserEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { Id = 1, UserId = 1, WardId = 1, IsActive = true, MarkedForDeletion = true }
        };
        _mockWardAllocationRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<GlobalSurveyWardAllocationEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Expression<Func<GlobalSurveyWardAllocationEntity, bool>> predicate, CancellationToken _) =>
                wardAllocations.Where(predicate.Compile()).ToList());

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_Ward_not_allocated.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenMainPropertyNotFound()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1
        };

        SetupValidUserAndWardAllocation(1, 1);

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity>());

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_Main_property_not_found.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_GeneratesMissingPartitions_WithClonedData_WhenGapsExist()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 10,
            MainPropertyNo = "100",
            UserId = 1,
            IsMainPropertyDataAttach = true
        };

        SetupValidUserAndWardAllocation(1, 10);

        var mainProperty = new PropertyEntity
        {
            Id = 1001,
            WardId = 10,
            TaxZoneId = 2,
            PropertyNo = "100",
            PropertySeqNo = 5,
            OwnerName = "Owner A",
            OwnerNameEnglish = "Owner A English",
            IsActive = true
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        // Existing partitions: P1 and P3 exist -> P2 is missing
        var existingProperties = new List<PropertyEntity>
        {
            new() { Id = 1002, WardId = 10, PropertyNo = "100", PartitionNo = "P1", IsActive = true },
            new() { Id = 1003, WardId = 10, PropertyNo = "100", PartitionNo = "P3", IsActive = true }
        };

        _mockRepository
            .Setup(x => x.GetQueryable())
            .Returns(existingProperties.BuildMock());

        List<PropertyEntity>? addedProperties = null;
        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => addedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("GenerateMissingPartition_Success.", result.Message);
        Assert.NotNull(result.Items);
        Assert.Equal(1, result.Items.MissingFoundCount);
        Assert.Equal(1, result.Items.CreatedCount);
        Assert.Single(result.Items.CreatedList);
        Assert.Equal("100-P2", result.Items.CreatedList[0]);
        Assert.Equal(2, result.Items.SkippedList.Count);
        Assert.Contains("100-P1", result.Items.SkippedList);
        Assert.Contains("100-P3", result.Items.SkippedList);

        Assert.NotNull(addedProperties);
        Assert.Single(addedProperties);
        var createdProp = addedProperties.First();
        Assert.Equal("P2", createdProp.PartitionNo);
        Assert.Equal("100", createdProp.PropertyNo);
        Assert.Equal(1, createdProp.CreatedBy);
        Assert.True(createdProp.IsActive);
        Assert.Equal("Owner A", createdProp.OwnerName); // Cloned from main property
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GenerateMissingPartition_GeneratesMissingPartitions_WithDefaultHolder_WhenIsMainPropertyDataAttachIsFalse()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 10,
            MainPropertyNo = "100",
            UserId = 1,
            IsMainPropertyDataAttach = false
        };

        SetupValidUserAndWardAllocation(1, 10);

        var mainProperty = new PropertyEntity
        {
            Id = 1001,
            WardId = 10,
            TaxZoneId = 2,
            PropertyNo = "100",
            PropertySeqNo = 5,
            OwnerName = "Original Owner",
            IsActive = true
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        // Existing partitions: P1 and P3 exist
        var existingProperties = new List<PropertyEntity>
        {
            new() { Id = 1002, WardId = 10, PropertyNo = "100", PartitionNo = "P1", IsActive = true },
            new() { Id = 1003, WardId = 10, PropertyNo = "100", PartitionNo = "P3", IsActive = true }
        };

        _mockRepository
            .Setup(x => x.GetQueryable())
            .Returns(existingProperties.BuildMock());

        List<PropertyEntity>? addedProperties = null;
        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => addedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(addedProperties);
        var createdProp = addedProperties.First();
        Assert.Equal("धारक", createdProp.OwnerName);
        Assert.Equal("The Holder", createdProp.OwnerNameEnglish);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsNoMissingFound_WhenSequenceIsComplete()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 10,
            MainPropertyNo = "100",
            UserId = 1,
            IsMainPropertyDataAttach = true
        };

        SetupValidUserAndWardAllocation(1, 10);

        var mainProperty = new PropertyEntity
        {
            Id = 1001,
            WardId = 10,
            PropertyNo = "100",
            IsActive = true
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        // Existing partitions: P1, P2, P3 -> No gaps
        var existingProperties = new List<PropertyEntity>
        {
            new() { Id = 1002, WardId = 10, PropertyNo = "100", PartitionNo = "P1", IsActive = true },
            new() { Id = 1003, WardId = 10, PropertyNo = "100", PartitionNo = "P2", IsActive = true },
            new() { Id = 1004, WardId = 10, PropertyNo = "100", PartitionNo = "P3", IsActive = true }
        };

        _mockRepository
            .Setup(x => x.GetQueryable())
            .Returns(existingProperties.BuildMock());

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("GenerateMissingPartition_No_missing_found.", result.Message);
        Assert.NotNull(result.Items);
        Assert.Equal(0, result.Items.CreatedCount);
        Assert.Equal(3, result.Items.SkippedList.Count);
        _mockRepository.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsError_WhenModuleNotAllocatedToUser()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            ModuleId = 99
        };

        var users = new List<UserEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        _mockWardAllocationRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<GlobalSurveyWardAllocationEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GlobalSurveyWardAllocationEntity>());

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("GenerateMissingPartition_Ward_not_allocated.", result.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_PersistsWorkflowDetails_WhenPartitionsCreated()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 10,
            MainPropertyNo = "100",
            UserId = 1,
            ModuleId = 5,
            IsMainPropertyDataAttach = true
        };

        SetupValidUserAndWardAllocation(1, 10, 5);

        var mainProperty = new PropertyEntity
        {
            Id = 1001,
            WardId = 10,
            TaxZoneId = 2,
            PropertyNo = "100",
            PropertySeqNo = 5,
            OwnerName = "Owner Cloned",
            IsActive = true
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        var existingProperties = new List<PropertyEntity>
        {
            new() { Id = 1002, WardId = 10, PropertyNo = "100", PartitionNo = "P1", IsActive = true },
            new() { Id = 1003, WardId = 10, PropertyNo = "100", PartitionNo = "P3", IsActive = true }
        };

        _mockRepository
            .Setup(x => x.GetQueryable())
            .Returns(existingProperties.BuildMock());

        var workflowStages = new List<PropertyWorkflowStageMasterEntity>
        {
            new() { Id = 1, StageName = WorkflowStageConstants.GeoSequencing, IsActive = true }
        };
        _mockWorkflowStageRepository
            .Setup(x => x.GetQueryable())
            .Returns(workflowStages.BuildMock());

        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) =>
            {
                int idCounter = 3001;
                foreach (var p in props)
                {
                    p.Id = idCounter++;
                }
            })
            .Returns(Task.CompletedTask);

        List<PropertyWorkflowDetailsEntity>? persistedWorkflow = null;
        _mockWorkflowDetailsRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyWorkflowDetailsEntity>, CancellationToken>((entries, _) => persistedWorkflow = entries.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Items);
        Assert.Equal(1, result.Items.CreatedCount);

        Assert.NotNull(persistedWorkflow);
        Assert.Single(persistedWorkflow);
        Assert.Equal(3001, persistedWorkflow[0].PropertyId);
        Assert.Equal(5, persistedWorkflow[0].ModuleId);
        Assert.Equal(1, persistedWorkflow[0].WorkflowStageId);
        Assert.True(persistedWorkflow[0].CurrentStatus);
        Assert.True(persistedWorkflow[0].IsActive);
        Assert.Equal(1, persistedWorkflow[0].CreatedBy);
        Assert.NotNull(persistedWorkflow[0].CreatedDate);

        _mockWorkflowDetailsRepository.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region CreateNewPartitionPropertysAsync Tests

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenWardIdIsInvalid()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 0,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2
        };

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_WardId_is_Invalid.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenMainPropertyNoIsEmpty()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "  ",
            UserId = 1,
            Nopartition = 2
        };

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_MainPropertyNo_is_required.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenUserIdIsInvalid()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 0,
            Nopartition = 2
        };

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_UserId_is_required.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenNopartitionIsZeroOrNegative()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 0
        };

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_Nopartition_must_be_greater_than_zero.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenNopartitionExceedsUpperLimit()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 1001
        };

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_Nopartition_exceeds_maximum_limit_of_1000.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenUserNotFound()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 999,
            Nopartition = 2
        };

        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserEntity>());

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_User_not_found.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenWardNotAllocated()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2
        };

        var users = new List<UserEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        _mockWardAllocationRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<GlobalSurveyWardAllocationEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GlobalSurveyWardAllocationEntity>());

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_Ward_not_allocated.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenWardAllocationIsMarkedForDeletion()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2
        };

        var users = new List<UserEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { Id = 1, UserId = 1, WardId = 1, IsActive = true, MarkedForDeletion = true }
        };
        _mockWardAllocationRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<GlobalSurveyWardAllocationEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Expression<Func<GlobalSurveyWardAllocationEntity, bool>> predicate, CancellationToken _) =>
                wardAllocations.Where(predicate.Compile()).ToList());

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_Ward_not_allocated.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenMainPropertyNotFound()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2
        };

        SetupValidUserAndWardAllocation(1, 1);

        _mockWardRepository
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 1, WardNo = "W01" });

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity>());

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_Main_property_not_found.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_CreatesSequentialPartitions_WhenPartitionsExist()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 10,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2,
            IsMainPropertyDataAttach = true
        };

        SetupValidUserAndWardAllocation(1, 10);

        _mockWardRepository
            .Setup(x => x.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var mainProperty = new PropertyEntity
        {
            Id = 1001,
            WardId = 10,
            TaxZoneId = 2,
            PropertyNo = "100",
            PropertySeqNo = 5,
            OwnerName = "Owner Cloned",
            IsActive = true
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        // Existing partitions: P1, P2 (max = 2) -> Next will be P3, P4
        var existingProperties = new List<PropertyEntity>
        {
            new() { Id = 1002, WardId = 10, PropertyNo = "100", PartitionNo = "P1", IsActive = true },
            new() { Id = 1003, WardId = 10, PropertyNo = "100", PartitionNo = "P2", IsActive = true }
        };

        _mockRepository
            .Setup(x => x.GetQueryable())
            .Returns(existingProperties.BuildMock());

        List<PropertyEntity>? addedProperties = null;
        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => addedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Items);
        Assert.Equal(2, result.Items.CreatedCount);
        Assert.Equal(2, result.Items.CreatedList.Count);
        Assert.Equal("P3", result.Items.CreatedList[0].PartitionNo);
        Assert.Equal("P4", result.Items.CreatedList[1].PartitionNo);
        Assert.Equal("Property no 100 is Partition no P3 to P4 generated successfully", result.Message);

        Assert.NotNull(addedProperties);
        Assert.Equal(2, addedProperties.Count);
        Assert.Equal("P3", addedProperties[0].PartitionNo);
        Assert.Equal("P4", addedProperties[1].PartitionNo);
        Assert.Equal("Owner Cloned", addedProperties[0].OwnerName);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateNewPartition_CreatesFirstPartitions_WhenNoPartitionsExist()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 10,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2,
            IsMainPropertyDataAttach = false
        };

        SetupValidUserAndWardAllocation(1, 10);

        _mockWardRepository
            .Setup(x => x.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var mainProperty = new PropertyEntity
        {
            Id = 1001,
            WardId = 10,
            TaxZoneId = 2,
            PropertyNo = "100",
            PropertySeqNo = 5,
            OwnerName = "Owner Test",
            IsActive = true
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        // No existing partitions
        var existingProperties = new List<PropertyEntity>();

        _mockRepository
            .Setup(x => x.GetQueryable())
            .Returns(existingProperties.BuildMock());

        List<PropertyEntity>? addedProperties = null;
        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => addedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Items);
        Assert.Equal(2, result.Items.CreatedCount);
        Assert.Equal("1", result.Items.CreatedList[0].PartitionNo);
        Assert.Equal("2", result.Items.CreatedList[1].PartitionNo);

        Assert.NotNull(addedProperties);
        Assert.Equal(2, addedProperties.Count);
        Assert.Equal("धारक", addedProperties[0].OwnerName);
        Assert.Equal("The Holder", addedProperties[0].OwnerNameEnglish);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenModuleIdIsInvalid()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2,
            ModuleId = 0
        };

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_ModuleId_is_Invalid.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_ReturnsError_WhenModuleNotAllocatedToUser()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2,
            ModuleId = 99
        };

        var users = new List<UserEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false }
        };
        _mockUserRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<UserEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        _mockWardAllocationRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<GlobalSurveyWardAllocationEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GlobalSurveyWardAllocationEntity>());

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("CreateNewPartition_Ward_not_allocated.", result.Message);
    }

    [Fact]
    public async Task CreateNewPartition_PersistsWorkflowDetails_WhenPartitionsCreated()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 10,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2,
            ModuleId = 5,
            IsMainPropertyDataAttach = true
        };

        SetupValidUserAndWardAllocation(1, 10, 5);

        _mockWardRepository
            .Setup(x => x.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var mainProperty = new PropertyEntity
        {
            Id = 1001,
            WardId = 10,
            TaxZoneId = 2,
            PropertyNo = "100",
            PropertySeqNo = 5,
            OwnerName = "Owner Cloned",
            IsActive = true
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        var existingProperties = new List<PropertyEntity>
        {
            new() { Id = 1002, WardId = 10, PropertyNo = "100", PartitionNo = "P1", IsActive = true }
        };

        _mockRepository
            .Setup(x => x.GetQueryable())
            .Returns(existingProperties.BuildMock());

        var workflowStages = new List<PropertyWorkflowStageMasterEntity>
        {
            new() { Id = 1, StageName = WorkflowStageConstants.GeoSequencing, IsActive = true }
        };
        _mockWorkflowStageRepository
            .Setup(x => x.GetQueryable())
            .Returns(workflowStages.BuildMock());

        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) =>
            {
                int idCounter = 2001;
                foreach (var p in props)
                {
                    p.Id = idCounter++;
                }
            })
            .Returns(Task.CompletedTask);

        List<PropertyWorkflowDetailsEntity>? persistedWorkflow = null;
        _mockWorkflowDetailsRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyWorkflowDetailsEntity>, CancellationToken>((entries, _) => persistedWorkflow = entries.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Items);
        Assert.Equal(2, result.Items.CreatedCount);

        Assert.NotNull(persistedWorkflow);
        Assert.Equal(2, persistedWorkflow.Count);
        Assert.Equal(2001, persistedWorkflow[0].PropertyId);
        Assert.Equal(2002, persistedWorkflow[1].PropertyId);
        Assert.Equal(5, persistedWorkflow[0].ModuleId);
        Assert.Equal(5, persistedWorkflow[1].ModuleId);
        Assert.Equal(1, persistedWorkflow[0].WorkflowStageId);
        Assert.Equal(1, persistedWorkflow[1].WorkflowStageId);
        Assert.True(persistedWorkflow[0].CurrentStatus);
        Assert.True(persistedWorkflow[0].IsActive);
        Assert.Equal(1, persistedWorkflow[0].CreatedBy);
        Assert.NotNull(persistedWorkflow[0].CreatedDate);

        _mockWorkflowDetailsRepository.Verify(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyWorkflowDetailsEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task CreateNewPartition_InheritsBasePropertyAssessmentStatusId(bool isAttachOldData)
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "101",
            UserId = 1,
            Nopartition = 2,
            IsMainPropertyDataAttach = isAttachOldData,
            ModuleId = 1
        };

        SetupValidUserAndWardAllocation(1, 1, 1);

        var mainProperty = new PropertyEntity
        {
            Id = 100,
            WardId = 1,
            PropertyNo = "101",
            PartitionNo = "",
            IsActive = true,
            MarkedForDeletion = false,
            PropertyAssessmentStatusId = 7
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        var properties = new List<PropertyEntity> { mainProperty };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());

        var ward = new WardEntity { Id = 1, WardNo = "W1" };
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(ward);

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateNewPartitionPropertysAsync(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(capturedProperties);
        Assert.Equal(2, capturedProperties.Count);
        Assert.All(capturedProperties, p =>
        {
            Assert.Equal(7, p.PropertyAssessmentStatusId);
        });
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task GenerateMissingPartition_InheritsBasePropertyAssessmentStatusId(bool isAttachOldData)
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 1,
            MainPropertyNo = "101",
            UserId = 1,
            IsMainPropertyDataAttach = isAttachOldData,
            ModuleId = 1
        };

        SetupValidUserAndWardAllocation(1, 1, 1);

        var mainProperty = new PropertyEntity
        {
            Id = 100,
            WardId = 1,
            PropertyNo = "101",
            PartitionNo = "",
            IsActive = true,
            MarkedForDeletion = false,
            PropertyAssessmentStatusId = 9
        };

        _mockRepository
            .Setup(x => x.GetAsync(It.IsAny<Expression<Func<PropertyEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertyEntity> { mainProperty });

        // Existing partition is P2, so P1 is missing
        var existingPart2 = new PropertyEntity
        {
            Id = 102,
            WardId = 1,
            PropertyNo = "101",
            PartitionNo = "P2",
            IsActive = true,
            MarkedForDeletion = false,
            PropertyAssessmentStatusId = 9
        };

        var properties = new List<PropertyEntity> { mainProperty, existingPart2 };
        _mockRepository.Setup(x => x.GetQueryable()).Returns(properties.BuildMock());

        var ward = new WardEntity { Id = 1, WardNo = "W1" };
        _mockWardRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(ward);

        List<PropertyEntity>? capturedProperties = null;
        _mockRepository
            .Setup(x => x.AddRangeAsync(It.IsAny<IEnumerable<PropertyEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyEntity>, CancellationToken>((props, _) => capturedProperties = props.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(capturedProperties);
        Assert.Single(capturedProperties);
        Assert.Equal(9, capturedProperties[0].PropertyAssessmentStatusId);
    }

    #endregion
}
