using AutoMapper;
using NtisPlatform.Application.Interfaces;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Application.Services.Master.WaterBill;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class TapSizeMasterServiceTests
{
    private readonly Mock<IRepository<TapSizeMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly TapSizeMasterService _service;

    public TapSizeMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<TapSizeMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();

        _mockCurrentUserService.Setup(c => c.GetCurrentUserId()).Returns(1);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TapSizeMasterEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new System.Collections.Generic.List<TapSizeMasterEntity>().BuildMock());

        _service = new TapSizeMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch"
        };
        var entity = new TapSizeMasterEntity
        {
            Id = 1,
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch",
            IsActive = true
        };
        var expectedDto = new TapSizeMasterDto
        {
            Id = 1,
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch",
            IsActive = true
        };

        _mockMapper
            .Setup(m => m.Map<TapSizeMasterEntity>(createDto))
            .Returns(entity);
        _mockRepository
            .Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockMapper
            .Setup(m => m.Map<TapSizeMasterDto>(entity))
            .Returns(expectedDto);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("0.5IN", result.TapSizeCode);
        Assert.Equal("1/2\"", result.TapSize);
        Assert.Equal(0.500m, result.NominalSizeValue);
        Assert.Equal("inch", result.SizeUnit);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new TapSizeMasterEntity
        {
            Id = 1,
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch",
            IsActive = true
        };
        var expectedDto = new TapSizeMasterDto
        {
            Id = 1,
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockMapper
            .Setup(m => m.Map<TapSizeMasterDto>(entity))
            .Returns(expectedDto);

        // Act
        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("0.5IN", result.TapSizeCode);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TapSizeMasterEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsPagedResult()
    {
        // Arrange
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<WaterBillMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        var mapper = mapperConfig.CreateMapper();

        var service = new TapSizeMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object);

        var entities = new List<TapSizeMasterEntity>
        {
            new() { Id = 1, TapSizeCode = "0.5IN", TapSize = "1/2\"", NominalSizeValue = 0.500m, SizeUnit = "inch", IsActive = true },
            new() { Id = 2, TapSizeCode = "0.75IN", TapSize = "3/4\"", NominalSizeValue = 0.750m, SizeUnit = "inch", IsActive = true }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new TapSizeMasterQueryParameters();

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count());
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "1IN",
            TapSize = "1 inch",
            NominalSizeValue = 1.000m,
            SizeUnit = "inch",
            IsActive = true
        };
        var existingEntity = new TapSizeMasterEntity
        {
            Id = 1,
            TapSizeCode = "1IN",
            TapSize = "1\"",
            NominalSizeValue = 1.000m,
            SizeUnit = "inch",
            IsActive = true
        };
        var expectedDto = new TapSizeMasterDto
        {
            Id = 1,
            TapSizeCode = "1IN",
            TapSize = "1 inch",
            NominalSizeValue = 1.000m,
            SizeUnit = "inch",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);
        _mockRepository
            .Setup(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockMapper
            .Setup(m => m.Map(updateDto, existingEntity))
            .Callback((UpdateTapSizeMasterDto src, TapSizeMasterEntity dest) =>
            {
                dest.TapSizeCode = src.TapSizeCode;
                dest.TapSize = src.TapSize;
                dest.NominalSizeValue = src.NominalSizeValue;
                dest.SizeUnit = src.SizeUnit;
                dest.IsActive = src.IsActive;
            });
        _mockMapper
            .Setup(m => m.Map<TapSizeMasterDto>(existingEntity))
            .Returns(expectedDto);

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1 inch", result.TapSize);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "NONE",
            TapSize = "None"
        };
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TapSizeMasterEntity?)null);

        // Act
        var result = await _service.UpdateAsync(999, updateDto, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<TapSizeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_DeletesSuccessfully()
    {
        // Arrange
        var entity = new TapSizeMasterEntity
        {
            Id = 1,
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockRepository
            .Setup(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(1, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingId_ReturnsFalse()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TapSizeMasterEntity?)null);

        // Act
        var result = await _service.DeleteAsync(999, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<TapSizeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateTapSizeMasterDto { TapSizeCode = "0.5IN" };
        var entity = new TapSizeMasterEntity { TapSizeCode = "0.5IN" };

        _mockMapper.Setup(m => m.Map<TapSizeMasterEntity>(createDto)).Returns(entity);

        var existingEntities = new List<TapSizeMasterEntity> { new() { Id = 2, TapSizeCode = "0.5IN" } };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities.BuildMock());

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_DuplicateCode_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateTapSizeMasterDto { TapSizeCode = "1IN", IsActive = true };
        var existingEntity = new TapSizeMasterEntity { Id = 1, TapSizeCode = "0.5IN", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        
        var allEntities = new List<TapSizeMasterEntity> { new() { Id = 2, TapSizeCode = "1IN" } };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(allEntities.BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TapSizeMasterEntity>()))
            .Callback((UpdateTapSizeMasterDto src, TapSizeMasterEntity dest) => 
            {
                dest.TapSizeCode = src.TapSizeCode;
            });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ReferencedRecordDeactivation_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateTapSizeMasterDto { TapSizeCode = "0.5IN", IsActive = false };
        var existingEntity = new TapSizeMasterEntity { Id = 1, TapSizeCode = "0.5IN", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<TapSizeMasterEntity>().BuildMock());
        
        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TapSizeMasterEntity>()))
            .Callback((UpdateTapSizeMasterDto src, TapSizeMasterEntity dest) => 
            {
                dest.IsActive = src.IsActive;
            });

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TapSizeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Reference exists"));

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_ReferencedRecord_ThrowsValidationException()
    {
        // Arrange
        var existingEntity = new TapSizeMasterEntity { Id = 1, TapSizeCode = "0.5IN" };
        
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        
        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TapSizeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Reference exists"));

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.DeleteAsync(1, CancellationToken.None));
    }
}
