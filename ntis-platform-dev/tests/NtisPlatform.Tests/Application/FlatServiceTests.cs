using AutoMapper;
using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Flat;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class FlatServiceTests
{
    private readonly Mock<IRepository<PropertyEntity, int>> _mockPropertyRepo;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<SocietyDetailsEntity, int>> _mockSocietyRepo;
    private readonly Mock<IRepository<WingDetailsMastEntity, int>> _mockWingRepo;
    private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _mockAssessmentRepo;
    private readonly Mock<ILogger<FlatService>> _mockLogger;
    private readonly IMapper _mapper;
    private readonly FlatService _service;

    public FlatServiceTests()
    {
        _mockPropertyRepo = new Mock<IRepository<PropertyEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockSocietyRepo = new Mock<IRepository<SocietyDetailsEntity, int>>();
        _mockWingRepo = new Mock<IRepository<WingDetailsMastEntity, int>>();
        _mockAssessmentRepo = new Mock<IRepository<PropertyAssessmentEntity, int>>();
        _mockLogger = new Mock<ILogger<FlatService>>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<FlatMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _service = new FlatService(
            _mockPropertyRepo.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockSocietyRepo.Object,
            _mockWingRepo.Object,
            _mockAssessmentRepo.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task UpdateAsync_ValidInput_UpdatesFlatShopNumberSuccessfully()
    {
        // Arrange
        var property = new PropertyEntity
        {
            Id = 1,
            PropertyNo = "101",
            FlatOrShopNo = "A-101",
            WingDetailId = 10,
            IsActive = true,
            MarkedForDeletion = false
        };

        var society = new SocietyDetailsEntity
        {
            Id = 5,
            PropertyId = 1,
            IsActive = true,
            MarkedForDeletion = false
        };

        var wing = new WingDetailsMastEntity
        {
            Id = 10,
            SocietyDetailsMastId = 5,
            WingName = "Wing A",
            IsActive = true,
            MarkedForDeletion = false
        };

        var assessment = new PropertyAssessmentEntity
        {
            Id = 100,
            PropertyId = 1,
            IsActive = true,
            MarkedForDeletion = false
        };

        var properties = new List<PropertyEntity> { property }.BuildMock();
        var societies = new List<SocietyDetailsEntity> { society }.BuildMock();
        var wings = new List<WingDetailsMastEntity> { wing }.BuildMock();
        var assessments = new List<PropertyAssessmentEntity> { assessment }.BuildMock();

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties);
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(societies);
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(wings);
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(assessments);

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102",
            FlatOrShopName = "Flat 102",
            UpdatedBy = 99
        };

        // Act
        var result = await _service.UpdateAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("A-102", property.FlatOrShopNo);
        Assert.Equal("A-102", result.FlatShopNumber);
        Assert.Equal(99, property.UpdatedBy);
        _mockPropertyRepo.Verify(r => r.UpdateAsync(property, It.IsAny<CancellationToken>()), Times.Once);
        _mockAssessmentRepo.Verify(r => r.UpdateAsync(It.IsAny<PropertyAssessmentEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_RouteIdAndBodyMismatch_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateFlatDto
        {
            PropertyId = 2,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("Route ID '1' does not match body PropertyId '2'", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_PropertyNotFound_ThrowsValidationException()
    {
        // Arrange
        var properties = new List<PropertyEntity>().BuildMock();
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties);

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 999,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(999, updateDto));
        Assert.Contains("Property with Id '999' was not found", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_PropertyInactive_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = false, MarkedForDeletion = false };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("is inactive", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_PropertyMarkedForDeletion_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = true };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("is marked for deletion", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_SocietyDetailsNotFound_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 999,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("SocietyDetails with Id '999' was not found", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_SocietyDetailsInactive_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = false, MarkedForDeletion = false };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("SocietyDetails with Id '5' is inactive", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_SocietyDetailsMarkedForDeletion_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = true };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("SocietyDetails with Id '5' is marked for deletion", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WingDetailsNotFound_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 999,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("WingDetails with Id '999' was not found", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WingDetailsInactive_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 5, IsActive = false, MarkedForDeletion = false };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("WingDetails with Id '10' is inactive", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WingDetailsMarkedForDeletion_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 5, IsActive = true, MarkedForDeletion = true };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("WingDetails with Id '10' is marked for deletion", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WingDoesNotBelongToSociety_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 99, IsActive = true, MarkedForDeletion = false };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("does not belong to SocietyDetails", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateFlatShopNumberCaseInsensitive_ThrowsValidationException()
    {
        // Arrange
        var property1 = new PropertyEntity
        {
            Id = 1,
            WingDetailId = 10,
            FlatOrShopNo = "A-101",
            IsActive = true,
            MarkedForDeletion = false
        };

        var property2 = new PropertyEntity
        {
            Id = 2,
            WingDetailId = 10,
            FlatOrShopNo = "A-102",
            IsActive = true,
            MarkedForDeletion = false
        };

        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 5, IsActive = true, MarkedForDeletion = false };

        var properties = new List<PropertyEntity> { property1, property2 }.BuildMock();
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties);
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "a-102" // Lowercase duplicate of "A-102"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("already exists in WingDetailsId", ex.Message);
    }



    [Fact]
    public async Task UpdateAsync_ReassignmentToDifferentWing_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, WingDetailId = 10, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 20, SocietyDetailsMastId = 5, IsActive = true, MarkedForDeletion = false };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 20, // Different wing from 10
            FlatShopNumber = "A-103"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("is already assigned to WingDetails '10'", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_FlatNumberExceeds100Chars_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, WingDetailId = 10, IsActive = true, MarkedForDeletion = false };
        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 5, IsActive = true, MarkedForDeletion = false };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = new string('A', 101)
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("cannot exceed 100 characters", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateFlatOrShopNoEnglish_ThrowsValidationException()
    {
        // Arrange
        var property1 = new PropertyEntity
        {
            Id = 1,
            WingDetailId = 10,
            FlatOrShopNo = "A-101",
            FlatOrShopNoEnglish = "Flat 101",
            IsActive = true,
            MarkedForDeletion = false
        };

        var property2 = new PropertyEntity
        {
            Id = 2,
            WingDetailId = 10,
            FlatOrShopNo = "A-102",
            FlatOrShopNoEnglish = "Flat 102",
            IsActive = true,
            MarkedForDeletion = false
        };

        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 5, IsActive = true, MarkedForDeletion = false };

        var properties = new List<PropertyEntity> { property1, property2 }.BuildMock();
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties);
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());

        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-999",
            FlatOrShopNoEnglish = "Flat 102" // Matches existing English number on property 2
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("already exists in WingDetailsId", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WhenFlatOrShopNoEnglishOmitted_FallbackMatchesExistingEnglish_ThrowsValidationException()
    {
        // Arrange: Property 2 has FlatOrShopNo = "102" and FlatOrShopNoEnglish = "Flat-102"
        var property1 = new PropertyEntity
        {
            Id = 1,
            WingDetailId = 10,
            FlatOrShopNo = "A-101",
            FlatOrShopNoEnglish = "Flat 101",
            IsActive = true,
            MarkedForDeletion = false
        };

        var property2 = new PropertyEntity
        {
            Id = 2,
            WingDetailId = 10,
            FlatOrShopNo = "102",
            FlatOrShopNoEnglish = "Flat-102",
            IsActive = true,
            MarkedForDeletion = false
        };

        var society = new SocietyDetailsEntity { Id = 5, IsActive = true, MarkedForDeletion = false };
        var wing = new WingDetailsMastEntity { Id = 10, SocietyDetailsMastId = 5, IsActive = true, MarkedForDeletion = false };

        var properties = new List<PropertyEntity> { property1, property2 }.BuildMock();
        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties);
        _mockSocietyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { society }.BuildMock());
        _mockWingRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity> { wing }.BuildMock());
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());

        // FlatOrShopNoEnglish is omitted (null); FlatShopNumber is "flat-102" (case-insensitive duplicate of property 2's FlatOrShopNoEnglish)
        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "flat-102",
            FlatOrShopNoEnglish = null
        };

        // Act & Assert: Must throw duplicate validation exception because fallback assigns "flat-102" to FlatOrShopNoEnglish
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("already exists in WingDetailsId", ex.Message);
    }
}
