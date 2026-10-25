using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.VirtualPropertyTransferHistory;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class VirtualPropertyTransferHistoryServiceTests
{
    private readonly Mock<IRepository<VirtualPropertyTransferHistoryEntity, int>> _historyRepoMock;
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyMastMock;
    private readonly Mock<IRepository<WardEntity, int>> _wardRepoMock;
    private readonly Mock<IRepository<PropertyCategoryEntity, int>> _categoryRepoMock;
    private readonly Mock<IRepository<SocietyWingDetailsEntity, int>> _societyWingRepoMock;
    private readonly Mock<IRepository<WingDetailsMastEntity, int>> _wingDetailsMastRepoMock;
    private readonly Mock<IRepository<SocietyDetailsEntity, int>> _societyDetailsRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly VirtualPropertyTransferHistoryService _service;

    public VirtualPropertyTransferHistoryServiceTests()
    {
        _historyRepoMock = new Mock<IRepository<VirtualPropertyTransferHistoryEntity, int>>();
        _propertyMastMock = new Mock<IRepository<PropertyEntity, int>>();
        _wardRepoMock = new Mock<IRepository<WardEntity, int>>();
        _categoryRepoMock = new Mock<IRepository<PropertyCategoryEntity, int>>();
        _societyWingRepoMock = new Mock<IRepository<SocietyWingDetailsEntity, int>>();
        _wingDetailsMastRepoMock = new Mock<IRepository<WingDetailsMastEntity, int>>();
        _societyDetailsRepoMock = new Mock<IRepository<SocietyDetailsEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();

        _service = new VirtualPropertyTransferHistoryService(
            _historyRepoMock.Object,
            _propertyMastMock.Object,
            _wardRepoMock.Object,
            _categoryRepoMock.Object,
            _societyWingRepoMock.Object,
            _wingDetailsMastRepoMock.Object,
            _societyDetailsRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object);

        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());
        _societyWingRepoMock.Setup(w => w.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());
        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity>().BuildMock());
    }

    [Fact]
    public async Task Transfer_ThrowsValidationException_WhenSelfWardAndSamePropertyNo()
    {
        // Arrange: Self-ward transfer with identical property numbers
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "VP100"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("Cannot transfer property to the same property number within the same ward", ex.Message);
    }

    [Fact]
    public async Task Transfer_ThrowsValidationException_WhenSourcePropertyNotVirtual()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200"
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var nonVirtualSource = new PropertyEntity
        {
            Id = 1,
            WardId = 10,
            PropertyNo = "100",
            PartitionNo = null,
            IsVirtualProperty = false
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(nonVirtualSource);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("is not a Virtual Property", ex.Message);
    }

    [Fact]
    public async Task Transfer_Successful_InSelfWard_UpdatesSubPropertiesAndIsVirtualProperty()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 99
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity
        {
            Id = 1,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 5,
            PartitionNo = null,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false,
            CategoryId = 1
        };

        var subProperty1 = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "A",
            IsVirtualProperty = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProperty1 };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        var apartmentCat = new PropertyCategoryEntity
        {
            Id = 3,
            PropertyCategoryName = PropertyConstants.Categories.Apartment
        };
        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity> { apartmentCat }.BuildMock());

        _societyWingRepoMock.Setup(w => w.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());
        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.PropertyId);
        Assert.Equal(10, result.WardId);
        Assert.Equal("VP100", result.PropertyNo);
        Assert.Equal(10, result.TransferredWardId);
        Assert.Equal("200", result.TransferredPropertyNo);

        // Verify subProperty updated: ward, propertyNo, seqNo, IsVirtualProperty (from targetMaster which is false)
        Assert.Equal("200", subProperty1.PropertyNo);
        Assert.Equal(5, subProperty1.PropertySeqNo);
        Assert.False(subProperty1.IsVirtualProperty);
        Assert.NotNull(subProperty1.UPICId);
        Assert.Equal(30, subProperty1.UPICId.Length);
        Assert.StartsWith("W10200A", subProperty1.UPICId);

        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _historyRepoMock.Verify(h => h.AddAsync(It.IsAny<VirtualPropertyTransferHistoryEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Transfer_Successful_InCrossWard_TransfersSubPropertiesAndRelinksWings()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 10,
            WardId = 1,
            PropertyNo = "VP101",
            TransferredWardId = 2,
            TransferredPropertyNo = "202",
            CreatedBy = 42
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 2, WardNo = "W02" });

        var sourceMaster = new PropertyEntity
        {
            Id = 10,
            WardId = 1,
            PropertyNo = "VP101",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 20,
            WardId = 2,
            PropertyNo = "202",
            PropertySeqNo = 12,
            PartitionNo = null,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false,
            CategoryId = 1
        };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 1,
            PropertyNo = "VP101",
            PartitionNo = "1",
            WingDetailId = 55,
            IsVirtualProperty = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        var apartmentCat = new PropertyCategoryEntity
        {
            Id = 3,
            PropertyCategoryName = PropertyConstants.Categories.Apartment
        };
        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity> { apartmentCat }.BuildMock());

        var wing = new SocietyWingDetailsEntity
        {
            Id = 501,
            PropertyId = 10,
            WingDetailsMastId = 55,
            SocietyDetailId = 77,
            IsActive = true
        };
        _societyWingRepoMock.Setup(w => w.GetQueryable()).Returns(new List<SocietyWingDetailsEntity> { wing }.BuildMock());

        var society = new SocietyDetailsEntity
        {
            Id = 77,
            PropertyId = 10,
            IsActive = true
        };
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TransferredWardId);
        Assert.Equal("202", result.TransferredPropertyNo);

        // Verify sub-property transferred to new ward
        Assert.Equal(2, subProp.WardId);
        Assert.Equal("202", subProp.PropertyNo);
        Assert.False(subProp.IsVirtualProperty);
        Assert.Equal(12, subProp.PropertySeqNo);

        // Verify wing re-linked to target property ID
        Assert.Equal(20, wing.PropertyId);
        Assert.Equal(20, society.PropertyId);
        _societyWingRepoMock.Verify(s => s.UpdateRangeAsync(It.IsAny<IEnumerable<SocietyWingDetailsEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
        _societyDetailsRepoMock.Verify(s => s.UpdateRangeAsync(It.IsAny<IEnumerable<SocietyDetailsEntity>>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Transfer_WingSpecific_ReusesExistingTargetSocietyAndGeneratesWing_TransfersSubProperties()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 10,
            WardId = 1,
            PropertyNo = "VP101",
            TransferredWardId = 2,
            TransferredPropertyNo = "202",
            CreatedBy = 42,
            WingDetailIds = new List<int> { 55 }
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 2, WardNo = "W02" });

        var sourceMaster = new PropertyEntity
        {
            Id = 10,
            WardId = 1,
            PropertyNo = "VP101",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 20,
            WardId = 2,
            PropertyNo = "202",
            PropertySeqNo = 12,
            PartitionNo = null,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false,
            CategoryId = 1
        };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 1,
            PropertyNo = "VP101",
            PartitionNo = "1",
            WingDetailId = 55,
            IsVirtualProperty = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        var apartmentCat = new PropertyCategoryEntity
        {
            Id = 3,
            PropertyCategoryName = PropertyConstants.Categories.Apartment
        };
        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity> { apartmentCat }.BuildMock());

        // Target property already has a society!
        var existingTargetSociety = new SocietyDetailsEntity
        {
            Id = 999,
            PropertyId = 20,
            SocietyName = "Green Valley Society",
            IsActive = true,
            MarkedForDeletion = false
        };
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity> { existingTargetSociety }.BuildMock());

        // Source wing exists
        var sourceWing = new WingDetailsMastEntity
        {
            Id = 55,
            SocietyDetailsMastId = 77,
            WingMasterId = 5,
            WingName = "Wing A",
            IsActive = true
        };
        _wingDetailsMastRepoMock.Setup(w => w.GetByIdAsync(55, It.IsAny<CancellationToken>())).ReturnsAsync(sourceWing);
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _wingDetailsMastRepoMock.Setup(w => w.AddAsync(It.IsAny<WingDetailsMastEntity>(), It.IsAny<CancellationToken>()))
            .Callback<WingDetailsMastEntity, CancellationToken>((w, _) => w.Id = 888)
            .ReturnsAsync((WingDetailsMastEntity w, CancellationToken _) => w);

        _societyWingRepoMock.Setup(w => w.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());
        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TransferredWardId);
        Assert.Equal("202", result.TransferredPropertyNo);

        // Sub-property updated
        Assert.Equal(2, subProp.WardId);
        Assert.Equal("202", subProp.PropertyNo);
        Assert.False(subProp.IsVirtualProperty);
        Assert.Equal(888, subProp.WingDetailId); // Mapped to new target wing!

        // Wing created on target society
        _wingDetailsMastRepoMock.Verify(w => w.AddAsync(It.Is<WingDetailsMastEntity>(wing => wing.SocietyDetailsMastId == 999 && wing.WingName == "Wing A"), It.IsAny<CancellationToken>()), Times.Once);
        _societyWingRepoMock.Verify(w => w.AddAsync(It.Is<SocietyWingDetailsEntity>(wing => wing.PropertyId == 20 && wing.SocietyDetailId == 999), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Transfer_WingSpecific_ThrowsValidationException_WhenTargetWingHasSubProperties()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 10,
            WardId = 1,
            PropertyNo = "VP101",
            TransferredWardId = 2,
            TransferredPropertyNo = "202",
            CreatedBy = 42,
            WingDetailIds = new List<int> { 55 }
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 2, WardNo = "W02" });

        var sourceMaster = new PropertyEntity
        {
            Id = 10,
            WardId = 1,
            PropertyNo = "VP101",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 20,
            WardId = 2,
            PropertyNo = "202",
            PropertySeqNo = 12,
            PartitionNo = null,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false,
            CategoryId = 1
        };

        var sourceSubProp = new PropertyEntity
        {
            Id = 101,
            WardId = 1,
            PropertyNo = "VP101",
            PartitionNo = "1",
            WingDetailId = 55,
            IsVirtualProperty = true,
            IsActive = true
        };

        // Existing sub-property already present under target wing 500!
        var existingTargetSubProp = new PropertyEntity
        {
            Id = 201,
            WardId = 2,
            PropertyNo = "202",
            PartitionNo = "T1",
            WingDetailId = 500,
            IsActive = true
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, sourceSubProp, existingTargetSubProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        var apartmentCat = new PropertyCategoryEntity
        {
            Id = 3,
            PropertyCategoryName = PropertyConstants.Categories.Apartment
        };
        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity> { apartmentCat }.BuildMock());

        var targetSociety = new SocietyDetailsEntity
        {
            Id = 999,
            PropertyId = 20,
            IsActive = true
        };
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity> { targetSociety }.BuildMock());

        var sourceWing = new WingDetailsMastEntity
        {
            Id = 55,
            SocietyDetailsMastId = 77,
            WingMasterId = 5,
            WingName = "Wing A",
            IsActive = true
        };
        _wingDetailsMastRepoMock.Setup(w => w.GetByIdAsync(55, It.IsAny<CancellationToken>())).ReturnsAsync(sourceWing);

        var existingTargetWing = new WingDetailsMastEntity
        {
            Id = 500,
            SocietyDetailsMastId = 999,
            WingMasterId = 5,
            WingName = "Wing A",
            IsActive = true
        };
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity> { existingTargetWing }.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("already has sub-properties/partitions", ex.Message);
    }

    [Fact]
    public async Task Transfer_ThrowsValidationException_WhenSourcePropertyInactiveOrMarkedForDeletion()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200"
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var inactiveSource = new PropertyEntity
        {
            Id = 1,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = false,
            MarkedForDeletion = false
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(inactiveSource);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("inactive or marked for deletion", ex.Message);
    }

    [Fact]
    public async Task Transfer_ThrowsValidationException_WhenPropertyNoDoesNotMatchSourceMaster()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP999",
            TransferredWardId = 10,
            TransferredPropertyNo = "200"
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sourceMaster = new PropertyEntity
        {
            Id = 1,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true,
            MarkedForDeletion = false
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("does not match source master property number", ex.Message);
    }

    [Fact]
    public async Task Transfer_PreservesTargetMasterCategoryId_DoesNotForceApartmentCategory()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 99
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity
        {
            Id = 1,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        const int originalCommercialCategoryId = 7;
        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 5,
            PartitionNo = null,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false,
            CategoryId = originalCommercialCategoryId
        };

        var subProperty1 = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "A",
            IsVirtualProperty = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProperty1 };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(originalCommercialCategoryId, targetMaster.CategoryId);
    }

    [Fact]
    public async Task FetchSourceData_ScopesToExactSourceMaster_ExcludesOtherPropertiesSharingBaseNumber()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 99
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity
        {
            Id = 1,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PartitionNo = null,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var matchingSubProp = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "P1",
            IsVirtualProperty = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        // Another sub-property sharing base number "100" without VP prefix belonging to an unrelated property
        var unrelatedSubProp = new PropertyEntity
        {
            Id = 999,
            WardId = 10,
            PropertyNo = "100",
            PartitionNo = "P1",
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, matchingSubProp, unrelatedSubProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("200", matchingSubProp.PropertyNo);
        // Unrelated subproperty should remain untouched
        Assert.Equal("100", unrelatedSubProp.PropertyNo);
    }

    [Fact]
    public async Task BatchTransfer_ReturnsPartialFailureContract_WhenOneItemFails()
    {
        // Arrange
        var request = new BatchTransferRequestDto
        {
            Items = new List<CreateVirtualPropertyTransferHistoryDto>
            {
                new()
                {
                    PropertyId = 1,
                    WardId = 10,
                    PropertyNo = "VP100",
                    TransferredWardId = 10,
                    TransferredPropertyNo = "200",
                    CreatedBy = 99
                },
                new()
                {
                    PropertyId = 999, // Non-existent
                    WardId = 10,
                    PropertyNo = "VP999",
                    TransferredWardId = 10,
                    TransferredPropertyNo = "300",
                    CreatedBy = 99
                }
            }
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity
        {
            Id = 1,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);
        _propertyMastMock.Setup(p => p.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((PropertyEntity?)null);

        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PartitionNo = null,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "P1",
            IsVirtualProperty = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Act
        var response = await _service.BatchTransferAsync(request);

        // Assert
        Assert.False(response.Success);
        Assert.NotNull(response.Items);
        Assert.Single(response.Items);
        Assert.NotNull(response.Errors);
        Assert.Single(response.Errors);
        Assert.Contains("Batch transfer partially completed: 1 succeeded, 1 failed.", response.Message);
    }

    [Fact]
    public async Task GetHistoryAsync_ReturnsEmptyListAndZeroTotalCount_WhenNoRecordsMatch()
    {
        // Arrange
        _historyRepoMock.Setup(h => h.GetQueryable())
            .Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        _mapperMock
            .Setup(m => m.Map<List<VirtualPropertyTransferHistoryDto>>(It.IsAny<List<VirtualPropertyTransferHistoryEntity>>()))
            .Returns(new List<VirtualPropertyTransferHistoryDto>());

        var request = new GetVirtualPropertyTransferHistoryRequestDto
        {
            WardId = 1,
            PropertyNo = "VP999"
        };

        // Act
        var response = await _service.GetHistoryAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Empty(response.Items!);
        Assert.Equal(0, response.TotalCount);
    }

    [Fact]
    public async Task GetHistoryAsync_FiltersCorrectly_ByWardIdAndPropertyNo()
    {
        // Arrange
        var testEntities = new List<VirtualPropertyTransferHistoryEntity>
        {
            new() { Id = 1, WardId = 1, PropertyNo = "101", TransferredWardId = 2, TransferredPropertyNo = "201", IsActive = true, CreatedDate = DateTime.Now.AddDays(-2) },
            new() { Id = 2, WardId = 1, PropertyNo = "102", TransferredWardId = 2, TransferredPropertyNo = "202", IsActive = true, CreatedDate = DateTime.Now.AddDays(-1) },
            new() { Id = 3, WardId = 2, PropertyNo = "101", TransferredWardId = 3, TransferredPropertyNo = "301", IsActive = true, CreatedDate = DateTime.Now },
            new() { Id = 4, WardId = 1, PropertyNo = "101", TransferredWardId = 2, TransferredPropertyNo = "201", IsActive = false, CreatedDate = DateTime.Now } // Inactive
        };

        _historyRepoMock.Setup(h => h.GetQueryable())
            .Returns(testEntities.BuildMock());

        _mapperMock
            .Setup(m => m.Map<List<VirtualPropertyTransferHistoryDto>>(It.IsAny<List<VirtualPropertyTransferHistoryEntity>>()))
            .Returns((List<VirtualPropertyTransferHistoryEntity> entities) => entities.Select(e => new VirtualPropertyTransferHistoryDto
            {
                Id = e.Id,
                WardId = e.WardId,
                PropertyNo = e.PropertyNo,
                TransferredWardId = e.TransferredWardId,
                TransferredPropertyNo = e.TransferredPropertyNo,
                IsActive = e.IsActive
            }).ToList());

        var request = new GetVirtualPropertyTransferHistoryRequestDto
        {
            WardId = 1,
            PropertyNo = "101"
        };

        // Act
        var response = await _service.GetHistoryAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal(1, response.TotalCount);
        Assert.NotNull(response.Items);
        var item = Assert.Single(response.Items!);
        Assert.Equal(1, item.Id);
        Assert.Equal(1, item.WardId);
        Assert.Equal("101", item.PropertyNo);
    }

    [Fact]
    public async Task GetHistoryAsync_FiltersCorrectly_ByTransferredWardIdAndTransferredPropertyNo()
    {
        // Arrange
        var testEntities = new List<VirtualPropertyTransferHistoryEntity>
        {
            new() { Id = 1, WardId = 1, PropertyNo = "101", TransferredWardId = 5, TransferredPropertyNo = "500", IsActive = true, CreatedDate = DateTime.Now },
            new() { Id = 2, WardId = 1, PropertyNo = "102", TransferredWardId = 6, TransferredPropertyNo = "600", IsActive = true, CreatedDate = DateTime.Now }
        };

        _historyRepoMock.Setup(h => h.GetQueryable())
            .Returns(testEntities.BuildMock());

        _mapperMock
            .Setup(m => m.Map<List<VirtualPropertyTransferHistoryDto>>(It.IsAny<List<VirtualPropertyTransferHistoryEntity>>()))
            .Returns((List<VirtualPropertyTransferHistoryEntity> entities) => entities.Select(e => new VirtualPropertyTransferHistoryDto
            {
                Id = e.Id,
                WardId = e.WardId,
                PropertyNo = e.PropertyNo,
                TransferredWardId = e.TransferredWardId,
                TransferredPropertyNo = e.TransferredPropertyNo,
                IsActive = e.IsActive
            }).ToList());

        var request = new GetVirtualPropertyTransferHistoryRequestDto
        {
            WardId = 5,
            PropertyNo = "500"
        };

        // Act
        var response = await _service.GetHistoryAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal(1, response.TotalCount);
        Assert.NotNull(response.Items);
        var item = Assert.Single(response.Items!);
        Assert.Equal(5, item.TransferredWardId);
        Assert.Equal("500", item.TransferredPropertyNo);
    }

    [Fact]
    public async Task GetHistoryAsync_AppliesPagination_WhenPageNumberAndPageSizeProvided()
    {
        // Arrange
        var testEntities = new List<VirtualPropertyTransferHistoryEntity>
        {
            new() { Id = 1, WardId = 1, PropertyNo = "101", TransferredWardId = 2, TransferredPropertyNo = "201", IsActive = true, CreatedDate = new DateTime(2026, 1, 1) },
            new() { Id = 2, WardId = 1, PropertyNo = "101", TransferredWardId = 2, TransferredPropertyNo = "202", IsActive = true, CreatedDate = new DateTime(2026, 1, 2) },
            new() { Id = 3, WardId = 1, PropertyNo = "101", TransferredWardId = 2, TransferredPropertyNo = "203", IsActive = true, CreatedDate = new DateTime(2026, 1, 3) },
            new() { Id = 4, WardId = 1, PropertyNo = "101", TransferredWardId = 2, TransferredPropertyNo = "204", IsActive = true, CreatedDate = new DateTime(2026, 1, 4) },
            new() { Id = 5, WardId = 1, PropertyNo = "101", TransferredWardId = 2, TransferredPropertyNo = "205", IsActive = true, CreatedDate = new DateTime(2026, 1, 5) }
        };

        _historyRepoMock.Setup(h => h.GetQueryable())
            .Returns(testEntities.BuildMock());

        _mapperMock
            .Setup(m => m.Map<List<VirtualPropertyTransferHistoryDto>>(It.IsAny<List<VirtualPropertyTransferHistoryEntity>>()))
            .Returns((List<VirtualPropertyTransferHistoryEntity> entities) => entities.Select(e => new VirtualPropertyTransferHistoryDto
            {
                Id = e.Id,
                WardId = e.WardId,
                PropertyNo = e.PropertyNo,
                TransferredWardId = e.TransferredWardId,
                TransferredPropertyNo = e.TransferredPropertyNo,
                IsActive = e.IsActive
            }).ToList());

        var request = new GetVirtualPropertyTransferHistoryRequestDto
        {
            WardId = 1,
            PropertyNo = "101",
            PageNumber = 2,
            PageSize = 2
        };

        // Act
        var response = await _service.GetHistoryAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal(5, response.TotalCount);
        Assert.NotNull(response.Items);
        Assert.Equal(2, response.Items!.Count);
        // Ordered desc by CreatedDate, Id: [5, 4, 3, 2, 1] -> Page 2 with size 2 is [3, 2]
        Assert.Equal(3, response.Items[0].Id);
        Assert.Equal(2, response.Items[1].Id);
    }

    [Fact]
    public async Task Transfer_ThrowsValidationException_WhenTargetAlreadyContainsConflictingPartition()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200"
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity { Id = 2, WardId = 10, PropertyNo = "200", IsVirtualProperty = false, IsActive = true, MarkedForDeletion = false };

        var sourceSubProperty = new PropertyEntity { Id = 101, WardId = 10, PropertyNo = "VP100", PartitionNo = "A1", IsActive = true, MarkedForDeletion = false };
        var targetExistingSubProperty = new PropertyEntity { Id = 201, WardId = 10, PropertyNo = "200", PartitionNo = "A1", IsActive = true, MarkedForDeletion = false };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, sourceSubProperty, targetExistingSubProperty };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("Cannot transfer: Target property already contains sub-properties with partition number(s)", ex.Message);
        Assert.Contains("A1", ex.Message);
    }

    [Fact]
    public async Task Transfer_ThrowsValidationException_WhenSourceSubPropertiesContainInternalDuplicatePartitions()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200"
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity { Id = 2, WardId = 10, PropertyNo = "200", IsVirtualProperty = false, IsActive = true, MarkedForDeletion = false };

        var sourceSub1 = new PropertyEntity { Id = 101, WardId = 10, PropertyNo = "VP100", PartitionNo = "DUP", IsActive = true, MarkedForDeletion = false };
        var sourceSub2 = new PropertyEntity { Id = 102, WardId = 10, PropertyNo = "VP100", PartitionNo = "DUP", IsActive = true, MarkedForDeletion = false };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, sourceSub1, sourceSub2 };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("Source property contains duplicate sub-properties with partition number(s)", ex.Message);
        Assert.Contains("DUP", ex.Message);
    }

    [Fact]
    public async Task Transfer_FullTransfer_DeactivatesSourceMasterProperty_WhenAllSubPropertiesTransferred()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity { Id = 2, WardId = 10, PropertyNo = "200", PropertySeqNo = 1, IsVirtualProperty = false, IsActive = true, MarkedForDeletion = false };
        var subProp = new PropertyEntity { Id = 101, WardId = 10, PropertyNo = "VP100", PartitionNo = "1", IsActive = true, MarkedForDeletion = false };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity>
        {
            new() { Id = 3, PropertyCategoryName = PropertyConstants.Categories.Apartment, IsActive = true }
        }.BuildMock());

        _societyWingRepoMock.Setup(w => w.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());
        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.False(sourceMaster.IsActive);
        _propertyMastMock.Verify(p => p.UpdateAsync(sourceMaster, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task Transfer_DeepSocietyRelinking_BackfillsTargetSociety_WhenSourceSocietyLinkedToSubProperty()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 20,
            TransferredPropertyNo = "400",
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 20, WardNo = "W20" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity { Id = 2, WardId = 20, PropertyNo = "400", PropertySeqNo = 1, IsVirtualProperty = false, IsActive = true, MarkedForDeletion = false };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "1",
            WingDetailId = 55,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity>
        {
            new() { Id = 3, PropertyCategoryName = PropertyConstants.Categories.Apartment, IsActive = true }
        }.BuildMock());

        // Target already has a society but with empty Name and Secretary
        var targetSociety = new SocietyDetailsEntity
        {
            Id = 999,
            PropertyId = 2,
            SocietyName = null,
            SecretaryName = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        // Source society is linked to SUB-PROPERTY ID (101), NOT the master property (1)
        var sourceSociety = new SocietyDetailsEntity
        {
            Id = 888,
            PropertyId = 101, // Linked to sub-property!
            SocietyName = "Sunrise Cooperative Housing",
            SecretaryName = "Amit Patil",
            IsActive = true,
            MarkedForDeletion = false
        };
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity> { targetSociety, sourceSociety }.BuildMock());

        var wing = new WingDetailsMastEntity
        {
            Id = 55,
            SocietyDetailsMastId = 888,
            WingName = "A",
            IsActive = true,
            MarkedForDeletion = false
        };
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());

        _societyWingRepoMock.Setup(w => w.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());
        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        // Target society should be backfilled
        Assert.Equal("Sunrise Cooperative Housing", targetSociety.SocietyName);
        Assert.Equal("Amit Patil", targetSociety.SecretaryName);

        // Wing should be re-linked to targetSociety.Id (999)
        Assert.Equal(999, wing.SocietyDetailsMastId);
        _wingDetailsMastRepoMock.Verify(w => w.UpdateRangeAsync(It.Is<IEnumerable<WingDetailsMastEntity>>(list => list.Any(item => item.Id == 55 && item.SocietyDetailsMastId == 999)), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Transfer_PreservesAmenityCategory_WhenSubPropertyIsCommonAmenityWithoutWing()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity { Id = 2, WardId = 10, PropertyNo = "200", PropertySeqNo = 1, IsVirtualProperty = false, IsActive = true, MarkedForDeletion = false, CategoryId = 3 };

        // Flat under Wing (WingDetailId = 55) -> Should be updated to Apartment (3)
        var wingedFlat = new PropertyEntity { Id = 101, WardId = 10, PropertyNo = "VP100", PartitionNo = "Flat-1", WingDetailId = 55, CategoryId = 1, IsActive = true, MarkedForDeletion = false };

        // Amenity without wing (WingDetailId = null, CategoryId = 99 e.g. Utility/Clubhouse) -> Should be PRESERVED
        var commonAmenity = new PropertyEntity { Id = 102, WardId = 10, PropertyNo = "VP100", PartitionNo = "ClubHouse", WingDetailId = null, CategoryId = 99, IsActive = true, MarkedForDeletion = false };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, wingedFlat, commonAmenity };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity>
        {
            new() { Id = 3, PropertyCategoryName = PropertyConstants.Categories.Apartment, IsActive = true }
        }.BuildMock());

        _societyWingRepoMock.Setup(w => w.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());
        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, wingedFlat.CategoryId);       // Flat upgraded to Apartment
        Assert.Equal(99, commonAmenity.CategoryId);   // Amenity category preserved!
    }

    [Fact]
    public async Task Transfer_ThrowsValidationException_WhenDbUpdateExceptionOccursDueToUniqueConstraint()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity { Id = 2, WardId = 10, PropertyNo = "200", PropertySeqNo = 1, IsVirtualProperty = false, IsActive = true, MarkedForDeletion = false };
        var subProp = new PropertyEntity { Id = 101, WardId = 10, PropertyNo = "VP100", PartitionNo = "A1", IsActive = true, MarkedForDeletion = false };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        _unitOfWorkMock.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateException("Cannot insert duplicate key row in object 'dbo.PropertyMast' with unique index 'UX_PropertyMast_ActiveProperty'.", new Exception("duplicate key violation")));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("Cannot transfer: A partition number conflict occurred on the target property.", ex.Message);
        _unitOfWorkMock.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Transfer_UpgradesTargetCategoryToApartment_WhenTargetIsIndividualCategory()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        const int individualCatId = 1;
        const int apartmentCatId = 3;

        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 1,
            CategoryId = individualCatId,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "1",
            WingDetailId = 55,
            CategoryId = individualCatId,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity>
        {
            new() { Id = individualCatId, PropertyCategoryName = "Individual", IsActive = true },
            new() { Id = apartmentCatId, PropertyCategoryName = "Apartment", IsActive = true }
        }.BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(apartmentCatId, targetMaster.CategoryId);
        Assert.Equal(apartmentCatId, subProp.CategoryId);
    }

    [Fact]
    public async Task Transfer_PreservesTargetMasterCategoryAndSubProperties_WhenTargetIsCommercialOrPlotOrIndustry()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        const int commercialCatId = 7;
        const int apartmentCatId = 3;

        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 1,
            CategoryId = commercialCatId,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "Shop-1",
            WingDetailId = 55,
            CategoryId = commercialCatId,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity>
        {
            new() { Id = commercialCatId, PropertyCategoryName = "Commercial", IsActive = true },
            new() { Id = apartmentCatId, PropertyCategoryName = "Apartment", IsActive = true }
        }.BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(commercialCatId, targetMaster.CategoryId);
        Assert.Equal(commercialCatId, subProp.CategoryId);
    }

    [Fact]
    public async Task Transfer_WingSpecific_DoesNotAssignSourceSocietyToTarget_WhenRequestedSocietyBelongsToSourceProperty()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            WingDetailIds = new List<int> { 55 },
            SocityDetailMastIds = new List<int> { 888 }, // Belongs to source property!
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 1,
            OwnerName = "Target Owner",
            Address = "Target Address",
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "101",
            WingDetailId = 55,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Society 888 belongs to SOURCE property 1, not target property 2
        var sourceSociety = new SocietyDetailsEntity
        {
            Id = 888,
            PropertyId = 1,
            SocietyName = "Source Residency",
            IsActive = true,
            MarkedForDeletion = false
        };

        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity> { sourceSociety }.BuildMock());

        var sourceWing = new WingDetailsMastEntity
        {
            Id = 55,
            SocietyDetailsMastId = 888,
            WingName = "A",
            IsActive = true,
            MarkedForDeletion = false
        };
        _wingDetailsMastRepoMock.Setup(w => w.GetQueryable()).Returns(new List<WingDetailsMastEntity> { sourceWing }.BuildMock());

        SocietyDetailsEntity? createdTargetSociety = null;
        _societyDetailsRepoMock.Setup(s => s.AddAsync(It.IsAny<SocietyDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SocietyDetailsEntity s, CancellationToken _) =>
            {
                s.Id = 999;
                createdTargetSociety = s;
                return s;
            });

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        // Created target society must belong to target property (2), NOT source property (1)
        Assert.NotNull(createdTargetSociety);
        Assert.Equal(2, createdTargetSociety.PropertyId);
        // SocityDetailMastIds returned in result must NOT contain source society 888
        Assert.DoesNotContain(888, result.SocityDetailMastIds ?? new List<int>());
        Assert.Contains(999, result.SocityDetailMastIds ?? new List<int>());
    }

    [Fact]
    public async Task Transfer_RelinkWingsAndSocieties_DoesNotReassignUnrelatedSociety_WhenRequestedSocietyBelongsToAnotherProperty()
    {
        // Arrange
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 1,
            WardId = 10,
            PropertyNo = "VP100",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            SocityDetailMastIds = new List<int> { 777 }, // Belongs to unrelated property 999
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity { Id = 1, WardId = 10, PropertyNo = "VP100", IsVirtualProperty = true, IsActive = true };
        _propertyMastMock.Setup(p => p.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 2,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 1,
            OwnerName = "Target Building",
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var subProp = new PropertyEntity
        {
            Id = 101,
            WardId = 10,
            PropertyNo = "VP100",
            PartitionNo = "1",
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster, subProp };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Society 777 belongs to an unrelated property 999
        var unrelatedSociety = new SocietyDetailsEntity
        {
            Id = 777,
            PropertyId = 999,
            SocietyName = "Unrelated Towers",
            IsActive = true,
            MarkedForDeletion = false
        };

        _societyDetailsRepoMock.Setup(s => s.GetQueryable()).Returns(new List<SocietyDetailsEntity> { unrelatedSociety }.BuildMock());

        SocietyDetailsEntity? addedTargetSociety = null;
        _societyDetailsRepoMock.Setup(s => s.AddAsync(It.IsAny<SocietyDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SocietyDetailsEntity s, CancellationToken _) =>
            {
                s.Id = 1000;
                addedTargetSociety = s;
                return s;
            });

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        // Unrelated society must NOT have its PropertyId reassigned to 2
        Assert.Equal(999, unrelatedSociety.PropertyId);
        // A new society should be created for target property
        Assert.NotNull(addedTargetSociety);
        Assert.Equal(2, addedTargetSociety.PropertyId);
    }

    [Fact]
    public async Task Transfer_StandaloneVirtualIndividualProperty_TransfersSuccessfullyWithoutUpgradingToApartment()
    {
        // Arrange: Single virtual house (e.g., VP50 with NO partitions/sub-properties)
        // transferring into an existing physical house (Property 200, Category: Individual)
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 50,
            WardId = 10,
            PropertyNo = "VP50",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        const int individualCatId = 1;
        const int apartmentCatId = 3;

        var sourceMaster = new PropertyEntity
        {
            Id = 50,
            WardId = 10,
            PropertyNo = "VP50",
            PartitionNo = null, // No partition - standalone master
            CategoryId = individualCatId,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(50, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 200,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 1,
            PartitionNo = null, // No partition - standalone physical house
            CategoryId = individualCatId,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        // ONLY master properties exist, 0 sub-properties / partitions exist in DB
        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        _categoryRepoMock.Setup(c => c.GetQueryable()).Returns(new List<PropertyCategoryEntity>
        {
            new() { Id = individualCatId, PropertyCategoryName = "Individual", IsActive = true },
            new() { Id = apartmentCatId, PropertyCategoryName = "Apartment", IsActive = true }
        }.BuildMock());

        _historyRepoMock.Setup(h => h.GetQueryable()).Returns(new List<VirtualPropertyTransferHistoryEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(50, result.PropertyId);
        Assert.Equal("200", result.TransferredPropertyNo);

        // Target physical house remains INDIVIDUAL - NOT upgraded to Apartment!
        Assert.Equal(individualCatId, targetMaster.CategoryId);

        // Source virtual master property is deactivated
        Assert.False(sourceMaster.IsActive);

        // Unit of work commits the transaction
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _historyRepoMock.Verify(h => h.AddAsync(It.IsAny<VirtualPropertyTransferHistoryEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Transfer_StandaloneVirtualProperty_ThrowsValidationException_WhenWingFilterProvided()
    {
        // Arrange: Standalone virtual property with no sub-properties, but caller filters by WingDetailIds
        var request = new CreateVirtualPropertyTransferHistoryDto
        {
            PropertyId = 50,
            WardId = 10,
            PropertyNo = "VP50",
            TransferredWardId = 10,
            TransferredPropertyNo = "200",
            WingDetailIds = new List<int> { 999 }, // Wing filter provided on standalone property
            CreatedBy = 1
        };

        _wardRepoMock.Setup(w => w.ExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wardRepoMock.Setup(w => w.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new WardEntity { Id = 10, WardNo = "W10" });

        var sourceMaster = new PropertyEntity
        {
            Id = 50,
            WardId = 10,
            PropertyNo = "VP50",
            PartitionNo = null,
            IsVirtualProperty = true,
            IsActive = true
        };
        _propertyMastMock.Setup(p => p.GetByIdAsync(50, It.IsAny<CancellationToken>())).ReturnsAsync(sourceMaster);

        var targetMaster = new PropertyEntity
        {
            Id = 200,
            WardId = 10,
            PropertyNo = "200",
            PropertySeqNo = 1,
            IsVirtualProperty = false,
            IsActive = true,
            MarkedForDeletion = false
        };

        var allProperties = new List<PropertyEntity> { sourceMaster, targetMaster };
        _propertyMastMock.Setup(p => p.GetQueryable()).Returns(allProperties.BuildMock());

        // Act & Assert: Should throw ValidationException because wing filter did not match any sub-properties
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
        Assert.Contains("Matching Sub-properties Not Found", ex.Message);
    }
}

