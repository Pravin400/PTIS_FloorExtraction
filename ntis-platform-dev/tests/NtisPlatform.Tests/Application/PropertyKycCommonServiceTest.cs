using AutoMapper;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.PropertyKyc;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Options;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.Property;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Property;
using NtisPlatform.Core.Models;
using NtisPlatform.Application.Interfaces.Property;
using Xunit;

namespace NtisPlatform.Tests.Application.Services;

public class PropertyKycCommonServiceTest
{
    private readonly Mock<IRepository<PropertyEntity, int>>
        _propertyRepositoryMock;

    private readonly Mock<IUnitOfWork>
        _unitOfWorkMock;

    private readonly Mock<IMapper>
        _mapperMock;

    private readonly Mock<IPropertyRepository>
        _customPropertyRepositoryMock;

    private readonly Mock<ILogger<PropertyKycService>>
        _loggerMock;

    private readonly Mock<IOptions<FeatureFlagsOptions>>
        _featureFlagsMock;

    private readonly Mock<IRepository<WardEntity, int>>
        _wardRepositoryMock;

    private readonly Mock<IRepository<PropertyCategoryEntity, int>>
        _categoryRepositoryMock;

    private readonly Mock<IRepository<SocietyDetailsEntity, int>>
        _societyRepositoryMock;

    private readonly Mock<IRepository<PropertyDetailsEntity, int>>
        _propertyDetailsRepositoryMock;

    private readonly Mock<IRepository<RoomWiseSubmissionDetailsEntity, int>>
        _roomWiseRepositoryMock;

    private readonly Mock<IRepository<PropertyAssessmentEntity, int>>
        _assessmentRepositoryMock;

    private readonly Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>
        _wardAllocationRepositoryMock;

    private readonly Mock<IRepository<PropertyMapMasterEntity, int>>
        _propertyMapMasterRepositoryMock;

    private readonly Mock<IRepository<PropertyMapDetailEntity, int>>
        _propertyMapDetailRepositoryMock;

    private readonly Mock<IRepository<UserEntity, int>>
        _userRepositoryMock;

    private readonly Mock<IRepository<PropertyMastOldEntity, int>>
        _oldPropertyRepositoryMock;

    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>>
        _propertyTypeRepositoryMock;

    private readonly Mock<IRepository<CommunicationDetailsEntity, int>>
        _communicationRepositoryMock;

    private readonly Mock<IRepository<OwnerTypeMasterEntity, int>>
        _ownerTypeRepositoryMock;

    private readonly Mock<IRepository<WingEntity, int>>
        _wingRepositoryMock;

    private readonly Mock<IRepository<WingDetailsMastEntity, int>>
        _wingDetailsMastRepositoryMock;

    private readonly Mock<IRepository<VirtualPropertyTransferHistoryEntity, int>>
        _virtualPropertyTransferHistoryRepositoryMock;

    private readonly Mock<IRepository<WingEntity, int>>
        _wingMasterRepositoryMock;

    private readonly Mock<IPropertyRuleApplicationLogService>
        _ruleLogServiceMock;

    private readonly Mock<IRepository<PropertyPhotoEntity, int>>
        _propertyPhotoRepositoryMock;

    private readonly PropertyKycService _service;

    public PropertyKycCommonServiceTest()
    {
        _propertyRepositoryMock =
            new Mock<IRepository<PropertyEntity, int>>();

        _unitOfWorkMock =
            new Mock<IUnitOfWork>();

        _mapperMock =
            new Mock<IMapper>();

        _customPropertyRepositoryMock =
            new Mock<IPropertyRepository>();

        _loggerMock =
            new Mock<ILogger<PropertyKycService>>();

        _featureFlagsMock =
            new Mock<IOptions<FeatureFlagsOptions>>();

        _wardRepositoryMock =
            new Mock<IRepository<WardEntity, int>>();

        _categoryRepositoryMock =
            new Mock<IRepository<PropertyCategoryEntity, int>>();

        _societyRepositoryMock =
            new Mock<IRepository<SocietyDetailsEntity, int>>();

        _propertyDetailsRepositoryMock =
            new Mock<IRepository<PropertyDetailsEntity, int>>();

        _roomWiseRepositoryMock =
            new Mock<IRepository<RoomWiseSubmissionDetailsEntity, int>>();

        _assessmentRepositoryMock =
            new Mock<IRepository<PropertyAssessmentEntity, int>>();

        _wardAllocationRepositoryMock =
            new Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>();

        _propertyMapMasterRepositoryMock =
            new Mock<IRepository<PropertyMapMasterEntity, int>>();

        _propertyMapDetailRepositoryMock =
            new Mock<IRepository<PropertyMapDetailEntity, int>>();

        _userRepositoryMock =
            new Mock<IRepository<UserEntity, int>>();

        _oldPropertyRepositoryMock =
            new Mock<IRepository<PropertyMastOldEntity, int>>();

        _propertyTypeRepositoryMock =
            new Mock<IRepository<PropertyTypeMasterEntity, int>>();

        _communicationRepositoryMock =
            new Mock<IRepository<CommunicationDetailsEntity, int>>();

        _virtualPropertyTransferHistoryRepositoryMock =
            new Mock<IRepository<VirtualPropertyTransferHistoryEntity, int>>();

        _ownerTypeRepositoryMock =
            new Mock<IRepository<OwnerTypeMasterEntity, int>>();

        _wingRepositoryMock =
            new Mock<IRepository<WingEntity, int>>();

        _wingDetailsMastRepositoryMock =
            new Mock<IRepository<WingDetailsMastEntity, int>>();


        _wingMasterRepositoryMock =
            new Mock<IRepository<WingEntity, int>>();

        _ruleLogServiceMock =
            new Mock<IPropertyRuleApplicationLogService>();

        _propertyPhotoRepositoryMock =
            new Mock<IRepository<PropertyPhotoEntity, int>>();

        _featureFlagsMock
            .Setup(x => x.Value)
            .Returns(new FeatureFlagsOptions
            {
                AllowPropertyDeletionWithoutPaymentValidation = true
            });

        SetupEmptyRepositories();

        _service = new PropertyKycService(
            new Mock<IPropertyKycRepository>().Object,
            _unitOfWorkMock.Object,
            new Mock<IPropertyMutationInvariantPolicy>().Object,
            _propertyRepositoryMock.Object,
            _assessmentRepositoryMock.Object,
            _ownerTypeRepositoryMock.Object,
            _societyRepositoryMock.Object,
            _wingRepositoryMock.Object,
            _roomWiseRepositoryMock.Object,
            _communicationRepositoryMock.Object,
            _propertyMapDetailRepositoryMock.Object,
            _oldPropertyRepositoryMock.Object,
            _loggerMock.Object,
            _wingDetailsMastRepositoryMock.Object,
            _propertyDetailsRepositoryMock.Object,
            _virtualPropertyTransferHistoryRepositoryMock.Object,
            _userRepositoryMock.Object,
            _propertyPhotoRepositoryMock.Object);
    }

    private void SetupEmptyRepositories()
    {
        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity>().BuildMock());

        _assessmentRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyAssessmentEntity>().BuildMock());

        _ownerTypeRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<OwnerTypeMasterEntity>().BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity>().BuildMock());

        _wingRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingEntity>().BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity>().BuildMock());

        _roomWiseRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<RoomWiseSubmissionDetailsEntity>().BuildMock());

        _communicationRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<CommunicationDetailsEntity>().BuildMock());

        _propertyMapDetailRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyMapDetailEntity>().BuildMock());

        _oldPropertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyMastOldEntity>().BuildMock());

        _propertyDetailsRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyDetailsEntity>().BuildMock());

        _virtualPropertyTransferHistoryRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        _userRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserEntity>().BuildMock());

        _propertyPhotoRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyPhotoEntity>().BuildMock());
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenRequestIsNull_ThrowsArgumentNullException()
    {
        // Act and Assert
        var exception =
            await Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.GetKycDetailsCommon(
                    null!,
                    CancellationToken.None));

        Assert.Equal("queryParameters", exception.ParamName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPropertyDoesNotExist_ReturnsNull()
    {
        // Arrange
        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,
            PropertyNo = "99999",
            PartitionNo = null
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity>().BuildMock());

        // Act
        var result = await _service.GetKycDetailsCommon(
            request,
            CancellationToken.None);

        // Assert
        Assert.Null(result);

        _assessmentRepositoryMock.Verify(
            x => x.GetQueryable(),
            Times.Never);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPropertyExists_ReturnsBasicDetails()
    {
        // Arrange
        var property = new PropertyEntity
        {
            Id = 753362,
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = null,
            PropertyTypeId = 1,
            CategoryId = 2,
            PlotNo = "P-101",
            CSN = "CSN-001",
            OccupierTypeId = 3,
            OwnerTitle = "Mr.",
            OwnerName = "Test Owner",
            OwnerTitleEnglish = "Mr.",
            OwnerNameEnglish = "Test Owner",
            Address = "Test Address",
            AddressEnglish = "Test Address",
            Location = "Test Location",
            LocationEnglish = "Test Location",
            MobileNo = "9876543210",
            EmailId = "owner@example.com",
            PinCode = "411001",
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity>
            {
                property
            }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,

            // The service trims PropertyNo.
            PropertyNo = " 10 ",

            PartitionNo = null
        };

        // Act
        var result = await _service.GetKycDetailsCommon(
            request,
            CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(753362, result.PropertyId);
        Assert.Equal(1, result.PropertyTypeId);
        Assert.Equal(2, result.CategoryId);
        Assert.Equal("P-101", result.PlotNo);
        Assert.Equal("CSN-001", result.CSN);
        Assert.Equal(3, result.OccupierTypeId);
        Assert.Equal("Test Owner", result.OwnerName);
        Assert.Equal("9876543210", result.MobileNo);
        Assert.Equal("owner@example.com", result.EmailId);
        Assert.Equal("411001", result.PinCode);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WithPartitionNo_ReturnsExactPartition()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 100,
                WardId = 89,
                PropertyNo = "10",
                PartitionNo = "A",
                OwnerName = "Partition A Owner",
                IsActive = true,
                MarkedForDeletion = false
            },
            new()
            {
                Id = 101,
                WardId = 89,
                PropertyNo = "10",
                PartitionNo = "B",
                OwnerName = "Partition B Owner",
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(properties.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = " B "
        };

        // Act
        var result = await _service.GetKycDetailsCommon(
            request,
            CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(101, result.PropertyId);
        Assert.Equal("Partition B Owner", result.OwnerName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPropertyIsInactiveOrDeleted_ReturnsNull()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 100,
                WardId = 89,
                PropertyNo = "10",
                IsActive = false,
                MarkedForDeletion = false
            },
            new()
            {
                Id = 101,
                WardId = 89,
                PropertyNo = "10",
                IsActive = true,
                MarkedForDeletion = true
            }
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(properties.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,
            PropertyNo = "10"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(
            request,
            CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenRelatedRecordsExist_ReturnsMappedDetails()
    {
        // Arrange
        const int propertyId = 753362;

        var createdDate = new DateTime(2025, 5, 12, 10, 30, 0, DateTimeKind.Utc);
        var property = new PropertyEntity
        {
            Id = propertyId,
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = null,
            OwnerName = "Main Owner",
            CreatedBy = 105,
            CreatedDate = createdDate,
            IsActive = true,
            MarkedForDeletion = false
        };

        var assessment = new PropertyAssessmentEntity
        {
            Id = 1,
            PropertyId = propertyId,
            OwnerTypeId = 3,
            AdharCardNo = "123456789012",
            BlockNo = "BLOCK-A",
            SurveyRemark = "Survey completed",
            BHKId = 2,
            BHKMaster = new BHKMasterEntity
            {
                Id = 2,
                BHKName = "2 BHK",
                IsActive = true
            },
            IsActive = true,
            MarkedForDeletion = false
        };

        var ownerType = new OwnerTypeMasterEntity
        {
            Id = 3,
            OwnerType = "Owner",
            IsActive = true
        };

        var society = new SocietyDetailsEntity
        {
            Id = 50,
            PropertyId = propertyId,
            SocietyName = "Green Society",
            SocietyAddress = "Pune",
            ManagerName = "Manager One",
            SecretaryName = "Secretary One",
            BuilderName = "Builder One",
            IsActive = true,
            MarkedForDeletion = false
        };

        var wing = new WingEntity
        {
            Id = 7,
            WingNo = "A",
            IsActive = true
        };

        var roomWiseDetails = new RoomWiseSubmissionDetailsEntity
        {
            Id = 10,
            PropertyId = propertyId,
            LengthMtr = 10,
            WidthMtr = 20,
            TotalAreaSqMtr = 200,
            IsActive = true,
            MarkedForDeletion = false
        };

        var propertyDetails = new PropertyDetailsEntity
        {
            Id = 20,
            PropertyId = propertyId,
            TypeOfUseId = 15,
            IsActive = true,
            MarkedForDeletion = false
        };

        var mapDetail = new PropertyMapDetailEntity
        {
            Id = 30,
            PropertyIdNew = propertyId,
            PropertyIdOld = 999,
            Status = "ACTIVE",
            IsActive = true,
            IsCurrent = true
        };

        var transferHistory = new VirtualPropertyTransferHistoryEntity
        {
            Id = 40,
            PropertyId = propertyId,
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = null,
            TransferredWardId = 90,
            TransferredPropertyNo = "TP-101",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity>
            {
                property
            }.BuildMock());

        _assessmentRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyAssessmentEntity>
            {
                assessment
            }.BuildMock());

        _ownerTypeRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<OwnerTypeMasterEntity>
            {
                ownerType
            }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity>
            {
                society
            }.BuildMock());

        _wingRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingEntity>
            {
                wing
            }.BuildMock());

        _roomWiseRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<RoomWiseSubmissionDetailsEntity>
            {
                roomWiseDetails
            }.BuildMock());

        _propertyDetailsRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyDetailsEntity>
            {
                propertyDetails
            }.BuildMock());

        _propertyMapDetailRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyMapDetailEntity>
            {
                mapDetail
            }.BuildMock());

        _oldPropertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyMastOldEntity>
            {
                new PropertyMastOldEntity
                {
                    Id = 999,
                    OldWardNo = "W89",
                    OldCSN = "CSN-1",
                    OldSocietyName = "Old Society",
                    OldMobileNo = "9876543210"
                }
            }.BuildMock());

        _userRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserEntity>
            {
                new UserEntity
                {
                    Id = 105,
                    UserName = "john_doe"
                }
            }.BuildMock());

        _virtualPropertyTransferHistoryRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<VirtualPropertyTransferHistoryEntity>
            {
                transferHistory
            }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,
            PropertyNo = "10"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(
            request,
            CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(propertyId, result.PropertyId);
        Assert.Equal("10", result.PropertyNo);
        Assert.Null(result.PartitionNo);
        Assert.Equal(15, result.TypeOfUseId);

        Assert.Equal(3, result.OwnerTypeId);
        Assert.Equal("Owner", result.OwnerType);
        Assert.Equal("123456789012", result.AdharCardNo);
        Assert.False(result.IsVerified);
        Assert.Equal("BLOCK-A", result.BlockNo);
        Assert.Equal("Survey completed", result.SurveyRemark);
        Assert.Equal(2, result.BHKId);
        Assert.Equal("2 BHK", result.BHK);

        Assert.Equal(50, result.SocietyDetailId);
        Assert.Equal("Green Society", result.SocietyName);
        Assert.Equal("Pune", result.SocietyAddress);

        // No WingDetailsMast row links this society to a wing, so wing fields correctly stay
        // null -- they must never fall back to an arbitrary "first active wing" in the master.
        Assert.Null(result.WingId);
        Assert.Null(result.WingNo);
        Assert.Null(result.WingName);

        Assert.Equal("Manager One", result.ManagerName);
        Assert.Equal("Secretary One", result.SecretaryName);
        Assert.Equal("Builder One", result.BuilderName);

        Assert.Equal(10d, result.PlotLength);
        Assert.Equal(20d, result.PlotWidth);
        Assert.Equal(200d, result.TotalArea);

        Assert.Equal("999", result.PropertyIdOld);
        Assert.Equal("W89", result.OldWardNo);
        Assert.Equal("CSN-1", result.OldCSN);
        Assert.Equal("Old Society", result.OldSocietyName);
        Assert.Equal("9876543210", result.OldMobileNo);
        Assert.Equal(1, result.MapCount);

        Assert.Single(result.VirtualPropertyTransferHistory);
        Assert.Equal(40, result.VirtualPropertyTransferHistory[0].Id);
        Assert.Equal("TP-101", result.VirtualPropertyTransferHistory[0].TransferredPropertyNo);

        Assert.Equal("john_doe", result.CreatedBy);
        Assert.Equal(createdDate, result.CreatedDate);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenCreatedByUserIsInactiveOrMarkedForDeletion_ReturnsNullCreatedBy()
    {
        // Arrange
        const int propertyId = 753363;
        var property = new PropertyEntity
        {
            Id = propertyId,
            WardId = 89,
            PropertyNo = "11",
            CreatedBy = 200,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _userRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<UserEntity>
            {
                new UserEntity
                {
                    Id = 200,
                    UserName = "inactive_user",
                    IsActive = false,
                    MarkedForDeletion = false
                }
            }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,
            PropertyNo = "11"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.CreatedBy);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenAnotherWingPropertyHasPhoto_ReturnsIsVerifiedFalseAndVerifiedCountOne()
    {
        // Arrange
        const int wingDetailId = 20026;
        const int mainPropertyId = 2080460;
        const int unitPropertyId = 2080497;

        var mainProperty = new PropertyEntity
        {
            Id = mainPropertyId,
            WardId = 33,
            PropertyNo = "C",
            PartitionNo = "3911",
            WingDetailId = wingDetailId,
            IsActive = true,
            MarkedForDeletion = false
        };

        var unitProperty = new PropertyEntity
        {
            Id = unitPropertyId,
            WardId = 33,
            PropertyNo = "C1",
            PartitionNo = "3912",
            WingDetailId = wingDetailId,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { mainProperty, unitProperty }.BuildMock());

        var assessment = new PropertyAssessmentEntity
        {
            Id = 50,
            PropertyId = unitPropertyId,
            AdharCardNo = "998877665544",
            IsActive = true,
            MarkedForDeletion = false
        };

        _assessmentRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyAssessmentEntity> { assessment }.BuildMock());

        var wingDetail = new WingDetailsMastEntity
        {
            Id = wingDetailId,
            WingMasterId = 3,
            WingName = "C",
            IsActive = true
        };

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity> { wingDetail }.BuildMock());

        // Photo attached to the main wing property (2080460), but unit property (2080497) has no photo
        var photo = PropertyPhotoEntity.Create(
            propertyId: mainPropertyId,
            photoTypeId: 1,
            displayOrder: 1,
            remarks: "Front elevation");

        _propertyPhotoRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyPhotoEntity> { photo }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 33,
            PropertyNo = "C1",
            PartitionNo = "3912"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(unitPropertyId, result.PropertyId);
        Assert.Equal("998877665544", result.AdharCardNo);
        Assert.False(result.IsVerified);
        Assert.Equal(1, result.VerifiedWingPropertiesCount);
        Assert.Equal(1, result.UnverifiedWingPropertiesCount);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPropertyItselfHasPhoto_ReturnsIsVerifiedTrue()
    {
        // Arrange
        const int wingDetailId = 20026;
        const int unitPropertyId = 2080497;

        var unitProperty = new PropertyEntity
        {
            Id = unitPropertyId,
            WardId = 33,
            PropertyNo = "C1",
            PartitionNo = "3912",
            WingDetailId = wingDetailId,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { unitProperty }.BuildMock());

        var wingDetail = new WingDetailsMastEntity
        {
            Id = wingDetailId,
            WingMasterId = 3,
            WingName = "C",
            IsActive = true
        };

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity> { wingDetail }.BuildMock());

        var photo = PropertyPhotoEntity.Create(
            propertyId: unitPropertyId,
            photoTypeId: 1,
            displayOrder: 1,
            remarks: "Unit photo");

        _propertyPhotoRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyPhotoEntity> { photo }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 33,
            PropertyNo = "C1",
            PartitionNo = "3912"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsVerified);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenWingPropertiesHaveNoPhotos_ReturnsIsVerifiedFalse()
    {
        // Arrange
        const int wingDetailId = 20026;
        const int unitPropertyId = 2080497;

        var unitProperty = new PropertyEntity
        {
            Id = unitPropertyId,
            WardId = 33,
            PropertyNo = "C1",
            PartitionNo = "3912",
            WingDetailId = wingDetailId,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { unitProperty }.BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity>
            {
                new() { Id = wingDetailId, WingMasterId = 3, WingName = "C", IsActive = true }
            }.BuildMock());

        _propertyPhotoRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyPhotoEntity>().BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 33,
            PropertyNo = "C1",
            PartitionNo = "3912"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(unitPropertyId, result.PropertyId);
        Assert.False(result.IsVerified);
    }

    [Theory]
    [InlineData(true, true)]
    [InlineData(false, false)]
    [InlineData(null, false)]
    public async Task GetKycDetailsCommon_IsVirtualPropertyFlag_MatchesDatabaseValue(bool? dbIsVirtual, bool expected)
    {
        // Arrange
        var property = new PropertyEntity
        {
            Id = 555,
            WardId = 33,
            PropertyNo = "VP-1",
            IsVirtualProperty = dbIsVirtual,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 33,
            PropertyNo = "VP-1"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expected, result.IsVirtualProperty);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenTransferredWardIdAndPropertyNoMatchInTransferHistory_ReturnsIsVirtualPropertyTrue()
    {
        // Arrange: Property in DB has IsVirtualProperty = false
        var property = new PropertyEntity
        {
            Id = 777,
            WardId = 91,
            PropertyNo = "70",
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // VirtualPropertyTransferHistory contains transfer record to Ward 91, Property 70
        var transferHistory = new VirtualPropertyTransferHistoryEntity
        {
            Id = 1,
            PropertyId = 2259367,
            WardId = 18,
            PropertyNo = "VP148",
            TransferredWardId = 91,
            TransferredPropertyNo = "70",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _virtualPropertyTransferHistoryRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<VirtualPropertyTransferHistoryEntity> { transferHistory }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 91,
            PropertyNo = "70"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsVirtualProperty);
        Assert.Single(result.VirtualPropertyTransferHistory);
        Assert.Equal(91, result.VirtualPropertyTransferHistory[0].TransferredWardId);
        Assert.Equal("70", result.VirtualPropertyTransferHistory[0].TransferredPropertyNo);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenSourceWardIdAndPropertyNoMatchInTransferHistory_ReturnsIsVirtualPropertyTrue()
    {
        // Arrange: Property in DB has IsVirtualProperty = null
        var property = new PropertyEntity
        {
            Id = 2259367,
            WardId = 18,
            PropertyNo = "VP148",
            IsVirtualProperty = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        var transferHistory = new VirtualPropertyTransferHistoryEntity
        {
            Id = 1,
            PropertyId = 2259367,
            WardId = 18,
            PropertyNo = "VP148",
            TransferredWardId = 91,
            TransferredPropertyNo = "70",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _virtualPropertyTransferHistoryRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<VirtualPropertyTransferHistoryEntity> { transferHistory }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 18,
            PropertyNo = "VP148"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsVirtualProperty);
        Assert.Single(result.VirtualPropertyTransferHistory);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenTransferHistoryIsInactive_ReturnsIsVirtualPropertyFalse()
    {
        // Arrange: Property has IsVirtualProperty = false and transfer history is inactive
        var property = new PropertyEntity
        {
            Id = 888,
            WardId = 91,
            PropertyNo = "70",
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        var transferHistory = new VirtualPropertyTransferHistoryEntity
        {
            Id = 1,
            PropertyId = 2259367,
            WardId = 18,
            PropertyNo = "VP148",
            TransferredWardId = 91,
            TransferredPropertyNo = "70",
            IsActive = false, // Inactive
            CreatedDate = DateTime.UtcNow
        };

        _virtualPropertyTransferHistoryRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<VirtualPropertyTransferHistoryEntity> { transferHistory }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 91,
            PropertyNo = "70"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsVirtualProperty);
        Assert.Empty(result.VirtualPropertyTransferHistory);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenIndividualPropertyWithWingDetail_ReturnsSocietyNameAndWingName()
    {
        // Arrange
        var individualProperty = new PropertyEntity
        {
            Id = 200,
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = "1",
            WingDetailId = 15,
            OwnerName = "Unit Owner",
            IsActive = true,
            MarkedForDeletion = false
        };

        var wingDetail = new WingDetailsMastEntity
        {
            Id = 15,
            WingMasterId = 7,
            WingName = "A-Wing",
            SocietyDetailsMastId = 50,
            IsActive = true,
            MarkedForDeletion = false
        };

        var society = new SocietyDetailsEntity
        {
            Id = 50,
            PropertyId = 100, // belongs to main apartment, not individual unit 200
            SocietyName = "Gokul Dham",
            SocietyNameEnglish = "Gokul Dham Eng",
            ManagerName = "Manager M",
            IsActive = true,
            MarkedForDeletion = false
        };

        var wing = new WingEntity
        {
            Id = 7,
            WingNo = "A",
            IsActive = true
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { individualProperty }.BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity> { wingDetail }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity> { society }.BuildMock());

        _wingRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingEntity> { wing }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = "1"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.PropertyId);
        Assert.Equal("10", result.PropertyNo);
        Assert.Equal("1", result.PartitionNo);
        Assert.Equal("Gokul Dham", result.SocietyName);
        Assert.Equal("Gokul Dham Eng", result.SocietyNameEnglish);
        Assert.Equal("A-Wing", result.WingName);
        Assert.Equal("A", result.WingNo);
        Assert.Equal(15, result.WingDetailsId);
        Assert.Equal(50, result.SocietyDetailId);
        // Valid wing-linked society returns administrative details
        Assert.Equal("Manager M", result.ManagerName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenIndividualPropertyWithoutWingDetail_ReturnsNullSocietyDetailId()
    {
        // Arrange
        var mainApartmentProperty = new PropertyEntity
        {
            Id = 100,
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        var individualProperty = new PropertyEntity
        {
            Id = 200,
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = "2",
            WingDetailId = null,
            OwnerName = "Flat Owner",
            IsActive = true,
            MarkedForDeletion = false
        };

        var society = new SocietyDetailsEntity
        {
            Id = 50,
            PropertyId = 100,
            SocietyName = "Green Meadows",
            SocietyNameEnglish = "Green Meadows Eng",
            ManagerName = "Manager G",
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { mainApartmentProperty, individualProperty }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity> { society }.BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity>().BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 89,
            PropertyNo = "10",
            PartitionNo = "2"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.PropertyId);
        Assert.Equal("10", result.PropertyNo);
        Assert.Equal("2", result.PartitionNo);
        Assert.Null(result.SocietyDetailId);
        Assert.Null(result.SocietyName);
        Assert.Null(result.WingDetailsId);
        Assert.Null(result.WingName);
        Assert.Null(result.ManagerName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPartitionPropertyHasDummySocietyRow_ResolvesSocietyDetailIdFromWingDetailsMast()
    {
        // Arrange
        var partitionProperty = new PropertyEntity
        {
            Id = 2393150,
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = "A1",
            WingDetailId = 20089,
            OwnerName = "Unit Owner",
            IsActive = true,
            MarkedForDeletion = false
        };

        var wingDetail = new WingDetailsMastEntity
        {
            Id = 20089,
            WingMasterId = 1,
            WingName = "A",
            SocietyDetailsMastId = 26544,
            IsActive = true,
            MarkedForDeletion = false
        };

        var mainSociety = new SocietyDetailsEntity
        {
            Id = 26544,
            PropertyId = 2393149,
            SocietyName = "मुग्धा सोसायटी",
            SocietyNameEnglish = "Mugdha society",
            SecretaryName = "मुग्धा धनराज पाटील",
            IsActive = true,
            MarkedForDeletion = false
        };

        // Even if there is an active dummy row with PropertyId == partitionProperty.Id, it should NOT be chosen
        var dummyPartitionSociety = new SocietyDetailsEntity
        {
            Id = 26546,
            PropertyId = 2393150,
            SocietyName = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { partitionProperty }.BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity> { wingDetail }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity> { mainSociety, dummyPartitionSociety }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = "A1"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2393150, result.PropertyId);
        Assert.Equal("156", result.PropertyNo);
        Assert.Equal("A1", result.PartitionNo);
        Assert.Equal(26544, result.SocietyDetailId);
        Assert.Equal("मुग्धा सोसायटी", result.SocietyName);
        Assert.Equal("Mugdha society", result.SocietyNameEnglish);
        Assert.Equal("A", result.WingName);
        Assert.Equal(20089, result.WingDetailsId);
        Assert.Equal("मुग्धा धनराज पाटील", result.SecretaryName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenMainApartmentProperty_ResolvesSocietyDirectlyByPropertyId()
    {
        // Arrange
        var mainApartmentProperty = new PropertyEntity
        {
            Id = 2393149,
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = "",
            IsActive = true,
            MarkedForDeletion = false
        };

        var mainSociety = new SocietyDetailsEntity
        {
            Id = 26544,
            PropertyId = 2393149,
            SocietyName = "मुग्धा सोसायटी",
            SecretaryName = "मुग्धा धनराज पाटील",
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { mainApartmentProperty }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity> { mainSociety }.BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity>().BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = null
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2393149, result.PropertyId);
        Assert.Equal(26544, result.SocietyDetailId);
        Assert.Equal("मुग्धा सोसायटी", result.SocietyName);
        Assert.Equal("मुग्धा धनराज पाटील", result.SecretaryName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPartitionPropertyHasInactiveWing_ReturnsNullSocietyDetailId()
    {
        // Arrange
        var partitionProperty = new PropertyEntity
        {
            Id = 2393150,
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = "A1",
            WingDetailId = 20089,
            IsActive = true,
            MarkedForDeletion = false
        };

        var inactiveWingDetail = new WingDetailsMastEntity
        {
            Id = 20089,
            WingMasterId = 1,
            WingName = "A",
            SocietyDetailsMastId = 26544,
            IsActive = false, // Inactive wing
            MarkedForDeletion = false
        };

        var society = new SocietyDetailsEntity
        {
            Id = 26544,
            PropertyId = 2393149,
            SocietyName = "मुग्धा सोसायटी",
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { partitionProperty }.BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity> { inactiveWingDetail }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity> { society }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = "A1"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.SocietyDetailId);
        Assert.Null(result.SocietyName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPartitionPropertyHasInactiveSociety_ReturnsNullSocietyDetailId()
    {
        // Arrange
        var partitionProperty = new PropertyEntity
        {
            Id = 2393150,
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = "A1",
            WingDetailId = 20089,
            IsActive = true,
            MarkedForDeletion = false
        };

        var wingDetail = new WingDetailsMastEntity
        {
            Id = 20089,
            WingMasterId = 1,
            WingName = "A",
            SocietyDetailsMastId = 26544,
            IsActive = true,
            MarkedForDeletion = false
        };

        var inactiveSociety = new SocietyDetailsEntity
        {
            Id = 26544,
            PropertyId = 2393149,
            SocietyName = "मुग्धा सोसायटी",
            IsActive = false, // Inactive society
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { partitionProperty }.BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity> { wingDetail }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity> { inactiveSociety }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = "A1"
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.SocietyDetailId);
        Assert.Null(result.SocietyName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenMainPropertyWithoutDirectSociety_ReturnsNullSocietyDetailId()
    {
        // Arrange
        var mainApartmentProperty = new PropertyEntity
        {
            Id = 2393149,
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { mainApartmentProperty }.BuildMock());

        _societyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<SocietyDetailsEntity>().BuildMock());

        _wingDetailsMastRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<WingDetailsMastEntity>().BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "156",
            PartitionNo = null
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.SocietyDetailId);
        Assert.Null(result.SocietyName);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenMultipleOldPropertiesMapped_ReturnsCommaSeparatedOldPropertyNo()
    {
        // Arrange
        const int propertyId = 1523273;
        var property = new PropertyEntity
        {
            Id = propertyId,
            WardId = 5301,
            PropertyNo = "100",
            PartitionNo = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        var mapDetails = new List<PropertyMapDetailEntity>
        {
            new PropertyMapDetailEntity
            {
                Id = 1,
                PropertyIdNew = propertyId,
                PropertyIdOld = 101,
                PropertyNoOld = "1-10011506",
                IsActive = true,
                IsCurrent = true
            },
            new PropertyMapDetailEntity
            {
                Id = 2,
                PropertyIdNew = propertyId,
                PropertyIdOld = 102,
                PropertyNoOld = "1-10011506/0-00001",
                IsActive = true,
                IsCurrent = true
            }
        };

        _propertyMapDetailRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(mapDetails.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "100",
            PartitionNo = null
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1-10011506, 1-10011506/0-00001", result.OldPropertyNo);
        Assert.Equal("101, 102", result.PropertyIdOld);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenPropertyMapDetailHasNoPropertyNoOld_FallsBackToPropertyMastOld()
    {
        // Arrange
        const int propertyId = 1523274;
        var property = new PropertyEntity
        {
            Id = propertyId,
            WardId = 5301,
            PropertyNo = "101",
            PartitionNo = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        var mapDetails = new List<PropertyMapDetailEntity>
        {
            new PropertyMapDetailEntity
            {
                Id = 1,
                PropertyIdNew = propertyId,
                PropertyIdOld = 201,
                PropertyNoOld = null,
                IsActive = true,
                IsCurrent = true
            }
        };

        _propertyMapDetailRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(mapDetails.BuildMock());

        _oldPropertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyMastOldEntity>
            {
                new PropertyMastOldEntity
                {
                    Id = 201,
                    OldPropertyNo = "OLD-FALLBACK-99",
                    OldWardNo = "W53",
                    OldCSN = "CSN-99"
                }
            }.BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "101",
            PartitionNo = null
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("OLD-FALLBACK-99", result.OldPropertyNo);
        Assert.Equal("201", result.PropertyIdOld);
    }

    [Fact]
    public async Task GetKycDetailsCommon_WhenNoOldPropertyMapped_ReturnsNullOldPropertyNo()
    {
        // Arrange
        const int propertyId = 1523275;
        var property = new PropertyEntity
        {
            Id = propertyId,
            WardId = 5301,
            PropertyNo = "102",
            PartitionNo = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        _propertyRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _propertyMapDetailRepositoryMock
            .Setup(x => x.GetQueryable())
            .Returns(new List<PropertyMapDetailEntity>().BuildMock());

        var request = new PropertyKycDetailsQueryParameters
        {
            WardId = 5301,
            PropertyNo = "102",
            PartitionNo = null
        };

        // Act
        var result = await _service.GetKycDetailsCommon(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.OldPropertyNo);
        Assert.Null(result.PropertyIdOld);
    }
}