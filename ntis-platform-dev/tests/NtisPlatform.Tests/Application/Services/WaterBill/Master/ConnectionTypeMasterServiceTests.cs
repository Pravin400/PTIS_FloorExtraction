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

public class ConnectionTypeMasterServiceTests
{
    private readonly Mock<IRepository<ConnectionTypeMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly ConnectionTypeMasterService _service;

    public ConnectionTypeMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<ConnectionTypeMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();

        _mockCurrentUserService.Setup(c => c.GetCurrentUserId()).Returns(1);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ConnectionTypeMasterEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new System.Collections.Generic.List<ConnectionTypeMasterEntity>().BuildMock());

        _service = new ConnectionTypeMasterService(
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
        var createDto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Residential water connection"
        };
        var entity = new ConnectionTypeMasterEntity
        {
            Id = 1,
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Residential water connection",
            IsActive = true
        };
        var expectedDto = new ConnectionTypeMasterDto
        {
            Id = 1,
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Residential water connection",
            IsActive = true
        };

        _mockMapper
            .Setup(m => m.Map<ConnectionTypeMasterEntity>(createDto))
            .Returns(entity);
        _mockRepository
            .Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockMapper
            .Setup(m => m.Map<ConnectionTypeMasterDto>(entity))
            .Returns(expectedDto);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("RES", result.ConnectionTypeCode);
        Assert.Equal("Residential", result.ConnectionType);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new ConnectionTypeMasterEntity
        {
            Id = 1,
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Residential water connection",
            IsActive = true
        };
        var expectedDto = new ConnectionTypeMasterDto
        {
            Id = 1,
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Residential water connection",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockMapper
            .Setup(m => m.Map<ConnectionTypeMasterDto>(entity))
            .Returns(expectedDto);

        // Act
        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("RES", result.ConnectionTypeCode);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionTypeMasterEntity?)null);

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

        var service = new ConnectionTypeMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object);

        var entities = new List<ConnectionTypeMasterEntity>
        {
            new() { Id = 1, ConnectionTypeCode = "RES", ConnectionType = "Residential", Description = "Domestic", IsActive = true },
            new() { Id = 2, ConnectionTypeCode = "COM", ConnectionType = "Commercial", Description = "Commercial", IsActive = true }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new ConnectionTypeMasterQueryParameters();

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
        var updateDto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "COM",
            ConnectionType = "Commercial Enterprise",
            Description = "Updated description",
            IsActive = true
        };
        var existingEntity = new ConnectionTypeMasterEntity
        {
            Id = 1,
            ConnectionTypeCode = "COM",
            ConnectionType = "Commercial",
            Description = "Old description",
            IsActive = true
        };
        var expectedDto = new ConnectionTypeMasterDto
        {
            Id = 1,
            ConnectionTypeCode = "COM",
            ConnectionType = "Commercial Enterprise",
            Description = "Updated description",
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
            .Callback((UpdateConnectionTypeMasterDto src, ConnectionTypeMasterEntity dest) =>
            {
                dest.ConnectionTypeCode = src.ConnectionTypeCode;
                dest.ConnectionType = src.ConnectionType;
                dest.Description = src.Description;
                dest.IsActive = src.IsActive;
            });
        _mockMapper
            .Setup(m => m.Map<ConnectionTypeMasterDto>(existingEntity))
            .Returns(expectedDto);

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Commercial Enterprise", result.ConnectionType);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "NONE",
            ConnectionType = "None"
        };
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionTypeMasterEntity?)null);

        // Act
        var result = await _service.UpdateAsync(999, updateDto, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<ConnectionTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_DeletesSuccessfully()
    {
        // Arrange
        var entity = new ConnectionTypeMasterEntity
        {
            Id = 1,
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
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
            .ReturnsAsync((ConnectionTypeMasterEntity?)null);

        // Act
        var result = await _service.DeleteAsync(999, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<ConnectionTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateConnectionTypeMasterDto { ConnectionTypeCode = "RES" };
        var entity = new ConnectionTypeMasterEntity { ConnectionTypeCode = "RES" };

        _mockMapper.Setup(m => m.Map<ConnectionTypeMasterEntity>(createDto)).Returns(entity);

        var existingEntities = new List<ConnectionTypeMasterEntity> { new() { Id = 2, ConnectionTypeCode = "RES" } };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities.BuildMock());

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_DuplicateCode_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateConnectionTypeMasterDto { ConnectionTypeCode = "COM", IsActive = true };
        var existingEntity = new ConnectionTypeMasterEntity { Id = 1, ConnectionTypeCode = "RES", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        
        var allEntities = new List<ConnectionTypeMasterEntity> { new() { Id = 2, ConnectionTypeCode = "COM" } };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(allEntities.BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ConnectionTypeMasterEntity>()))
            .Callback((UpdateConnectionTypeMasterDto src, ConnectionTypeMasterEntity dest) => 
            {
                dest.ConnectionTypeCode = src.ConnectionTypeCode;
            });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ReferencedRecordDeactivation_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateConnectionTypeMasterDto { ConnectionTypeCode = "RES", IsActive = false };
        var existingEntity = new ConnectionTypeMasterEntity { Id = 1, ConnectionTypeCode = "RES", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<ConnectionTypeMasterEntity>().BuildMock());
        
        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ConnectionTypeMasterEntity>()))
            .Callback((UpdateConnectionTypeMasterDto src, ConnectionTypeMasterEntity dest) => 
            {
                dest.IsActive = src.IsActive;
            });

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ConnectionTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Reference exists"));

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_ReferencedRecord_ThrowsValidationException()
    {
        // Arrange
        var existingEntity = new ConnectionTypeMasterEntity { Id = 1, ConnectionTypeCode = "RES" };
        
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        
        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ConnectionTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Reference exists"));

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => 
            _service.DeleteAsync(1, CancellationToken.None));
    }
}
