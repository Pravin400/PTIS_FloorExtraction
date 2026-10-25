using AutoMapper;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Application.Services.Master.WaterBill;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class ConnectionCategoryMasterServiceTests
{
    private readonly Mock<IRepository<ConnectionCategoryMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly Mock<IRepository<BillingFrequencyMasterEntity, int>> _mockBillingFrequencyRepository;
    private readonly ConnectionCategoryMasterService _service;

    public ConnectionCategoryMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<ConnectionCategoryMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockBillingFrequencyRepository = new Mock<IRepository<BillingFrequencyMasterEntity, int>>();

        _mockCurrentUserService.Setup(c => c.GetCurrentUserId()).Returns(1);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ConnectionCategoryMasterEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new List<ConnectionCategoryMasterEntity>().BuildMock());

        _service = new ConnectionCategoryMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            _mockBillingFrequencyRepository.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = null,
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Regular category"
        };
        var entity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Regular category",
            IsActive = true
        };
        var expectedDto = new ConnectionCategoryMasterDto
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Regular category",
            IsActive = true
        };

        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto))
            .Returns(entity);
        _mockRepository
            .Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterDto>(entity))
            .Returns(expectedDto);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("REGULAR", result.ConnectionCategoryCode);
        Assert.Equal("Regular Metered", result.ConnectionCategory);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithBillingFrequency_ValidatesAndCreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered"
        };
        var freqEntity = new BillingFrequencyMasterEntity
        {
            Id = 2,
            BillingFrequencyCode = "QUARTERLY",
            BillingFrequency = "Quarterly",
            IsActive = true
        };
        var entity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            IsActive = true
        };
        var expectedDto = new ConnectionCategoryMasterDto
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            BillingFrequency = "Quarterly",
            IsActive = true
        };

        _mockBillingFrequencyRepository
            .Setup(b => b.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(freqEntity);

        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto))
            .Returns(entity);
        _mockRepository
            .Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterDto>(entity))
            .Returns(expectedDto);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.BillingFrequencyId);
        _mockBillingFrequencyRepository.Verify(b => b.GetByIdAsync(2, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_InactiveBillingFrequency_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 3,
            BillingMethod = "Metered"
        };
        var inactiveFreq = new BillingFrequencyMasterEntity
        {
            Id = 3,
            BillingFrequency = "Inactive Frequency",
            IsActive = false
        };

        _mockBillingFrequencyRepository
            .Setup(b => b.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(inactiveFreq);

        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto))
            .Returns(new ConnectionCategoryMasterEntity { ConnectionCategoryCode = "REGULAR", ConnectionCategory = "Regular Metered", BillingFrequencyId = 3, BillingMethod = "Metered" });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_NonExistingBillingFrequency_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 999,
            BillingMethod = "Metered"
        };

        _mockBillingFrequencyRepository
            .Setup(b => b.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BillingFrequencyMasterEntity?)null);

        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto))
            .Returns(new ConnectionCategoryMasterEntity { ConnectionCategoryCode = "REGULAR", ConnectionCategory = "Regular Metered", BillingFrequencyId = 999, BillingMethod = "Metered" });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingMethod = "Metered"
        };
        var entity = new ConnectionCategoryMasterEntity
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingMethod = "Metered"
        };

        _mockMapper.Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto)).Returns(entity);

        var existingEntities = new List<ConnectionCategoryMasterEntity>
        {
            new() { Id = 2, ConnectionCategoryCode = "REGULAR", ConnectionCategory = "Existing" }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities.BuildMock());

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvalidBillingMethod_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "NEW_CODE",
            ConnectionCategory = "New Category",
            BillingMethod = "InvalidMethod"
        };
        var entity = new ConnectionCategoryMasterEntity
        {
            ConnectionCategoryCode = "NEW_CODE",
            ConnectionCategory = "New Category",
            BillingMethod = "InvalidMethod"
        };

        _mockMapper.Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto)).Returns(entity);

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_NonMeteredWithMeteredMethod_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "NEW_CODE",
            ConnectionCategory = "New Category",
            IsMetered = false,
            BillingMethod = "Metered"
        };
        var entity = new ConnectionCategoryMasterEntity
        {
            ConnectionCategoryCode = "NEW_CODE",
            ConnectionCategory = "New Category",
            IsMetered = false,
            BillingMethod = "Metered"
        };

        _mockMapper.Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto)).Returns(entity);

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_MeteredWithFlatMethod_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "NEW_CODE",
            ConnectionCategory = "New Category",
            IsMetered = true,
            BillingMethod = "Flat"
        };
        var entity = new ConnectionCategoryMasterEntity
        {
            ConnectionCategoryCode = "NEW_CODE",
            ConnectionCategory = "New Category",
            IsMetered = true,
            BillingMethod = "Flat"
        };

        _mockMapper.Setup(m => m.Map<ConnectionCategoryMasterEntity>(createDto)).Returns(entity);

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            IsActive = true
        };
        var expectedDto = new ConnectionCategoryMasterDto
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            IsActive = true
        };

        var entities = new List<ConnectionCategoryMasterEntity> { entity };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterDto>(It.IsAny<ConnectionCategoryMasterEntity>()))
            .Returns(expectedDto);

        // Act
        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("REGULAR", result.ConnectionCategoryCode);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new List<ConnectionCategoryMasterEntity>().BuildMock());

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

        var service = new ConnectionCategoryMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            _mockBillingFrequencyRepository.Object);

        var entities = new List<ConnectionCategoryMasterEntity>
        {
            new() { Id = 1, ConnectionCategoryCode = "REGULAR", ConnectionCategory = "Regular", BillingMethod = "Metered", IsActive = true },
            new() { Id = 2, ConnectionCategoryCode = "FLAT", ConnectionCategory = "Flat Rate", BillingMethod = "Flat", IsActive = true }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new ConnectionCategoryMasterQueryParameters();

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
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered Updated",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Updated description",
            IsActive = true
        };
        var existingEntity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            IsActive = true
        };
        var expectedDto = new ConnectionCategoryMasterDto
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered Updated",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Updated description",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);
        _mockRepository
            .Setup(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var freqEntity = new BillingFrequencyMasterEntity
        {
            Id = 2,
            BillingFrequencyCode = "QUARTERLY",
            BillingFrequency = "Quarterly",
            IsActive = true
        };
        _mockBillingFrequencyRepository
            .Setup(b => b.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(freqEntity);
        _mockMapper
            .Setup(m => m.Map(updateDto, existingEntity))
            .Callback((UpdateConnectionCategoryMasterDto src, ConnectionCategoryMasterEntity dest) =>
            {
                dest.ConnectionCategoryCode = src.ConnectionCategoryCode;
                dest.ConnectionCategory = src.ConnectionCategory;
                dest.BillingFrequencyId = src.BillingFrequencyId;
                dest.IsMetered = src.IsMetered;
                dest.BillingMethod = src.BillingMethod;
                dest.Description = src.Description;
                dest.IsActive = src.IsActive;
            });
        _mockMapper
            .Setup(m => m.Map<ConnectionCategoryMasterDto>(existingEntity))
            .Returns(expectedDto);

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Regular Metered Updated", result.ConnectionCategory);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "NONE",
            ConnectionCategory = "None",
            BillingMethod = "Metered"
        };
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionCategoryMasterEntity?)null);

        // Act
        var result = await _service.UpdateAsync(999, updateDto, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<ConnectionCategoryMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateCode_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "DUPLICATE",
            ConnectionCategory = "Regular",
            BillingMethod = "Metered",
            IsActive = true
        };
        var existingEntity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "ORIGINAL",
            ConnectionCategory = "Original",
            BillingMethod = "Metered",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        var allEntities = new List<ConnectionCategoryMasterEntity>
        {
            new() { Id = 2, ConnectionCategoryCode = "DUPLICATE", ConnectionCategory = "Other", BillingMethod = "Metered" }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(allEntities.BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ConnectionCategoryMasterEntity>()))
            .Callback((UpdateConnectionCategoryMasterDto src, ConnectionCategoryMasterEntity dest) =>
            {
                dest.ConnectionCategoryCode = src.ConnectionCategoryCode;
            });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_InvalidBillingMethod_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingMethod = "InvalidMethod"
        };
        var existingEntity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingMethod = "Metered"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<ConnectionCategoryMasterEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ConnectionCategoryMasterEntity>()))
            .Callback((UpdateConnectionCategoryMasterDto src, ConnectionCategoryMasterEntity dest) =>
            {
                dest.BillingMethod = src.BillingMethod;
            });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_NonMeteredWithMeteredMethod_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            IsMetered = false,
            BillingMethod = "Metered"
        };
        var existingEntity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            IsMetered = true,
            BillingMethod = "Metered"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<ConnectionCategoryMasterEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ConnectionCategoryMasterEntity>()))
            .Callback((UpdateConnectionCategoryMasterDto src, ConnectionCategoryMasterEntity dest) =>
            {
                dest.IsMetered = src.IsMetered;
                dest.BillingMethod = src.BillingMethod;
            });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_MeteredWithFlatMethod_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            IsMetered = true,
            BillingMethod = "Flat"
        };
        var existingEntity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            IsMetered = false,
            BillingMethod = "Flat"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<ConnectionCategoryMasterEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ConnectionCategoryMasterEntity>()))
            .Callback((UpdateConnectionCategoryMasterDto src, ConnectionCategoryMasterEntity dest) =>
            {
                dest.IsMetered = src.IsMetered;
                dest.BillingMethod = src.BillingMethod;
            });

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ReferencedRecordDeactivation_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular",
            BillingMethod = "Metered",
            IsActive = false
        };
        var existingEntity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular",
            BillingMethod = "Metered",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<ConnectionCategoryMasterEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ConnectionCategoryMasterEntity>()))
            .Callback((UpdateConnectionCategoryMasterDto src, ConnectionCategoryMasterEntity dest) =>
            {
                dest.IsActive = src.IsActive;
            });

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ConnectionCategoryMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Reference exists"));

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_DeletesSuccessfully()
    {
        // Arrange
        var entity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular",
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
            .ReturnsAsync((ConnectionCategoryMasterEntity?)null);

        // Act
        var result = await _service.DeleteAsync(999, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<ConnectionCategoryMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ReferencedRecord_ThrowsValidationException()
    {
        // Arrange
        var existingEntity = new ConnectionCategoryMasterEntity { Id = 1, ConnectionCategoryCode = "REGULAR" };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ConnectionCategoryMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Reference exists"));

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() =>
            _service.DeleteAsync(1, CancellationToken.None));
    }
}
