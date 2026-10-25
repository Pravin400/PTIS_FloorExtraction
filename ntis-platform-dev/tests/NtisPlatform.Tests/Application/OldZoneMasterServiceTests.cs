using AutoMapper;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;
using ValidationResult = NtisPlatform.Application.Models.ValidationResult;

namespace NtisPlatform.Tests.Application;

public class OldZoneMasterServiceTests
{
    private readonly Mock<IRepository<OldZoneMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly OldZoneMasterService _service;

    public OldZoneMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<OldZoneMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

        _mockUnitOfWork
            .Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockUnitOfWork
            .Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _service = new OldZoneMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockReferenceValidator.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new OldZoneMasterEntity
        {
            Id = 1,
            OldZoneNo = "OZ01",
            Description = "Old Zone 1",
            IsActive = true,
            CreatedDate = DateTime.Now,
            CreatedBy = 1,
            UpdatedDate = null,
            UpdatedBy = null
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockMapper.Setup(m => m.Map<OldZoneMasterDto>(It.IsAny<OldZoneMasterEntity>()))
            .Returns((OldZoneMasterEntity e) => new OldZoneMasterDto
            {
                Id = e.Id,
                OldZoneNo = e.OldZoneNo,
                OldZoneName = e.Description,
                IsActive = e.IsActive,
                CreatedDate = e.CreatedDate,
                UpdatedDate = e.UpdatedDate
            });

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("OZ01", result.OldZoneNo);
        Assert.Equal("Old Zone 1", result.OldZoneName);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((OldZoneMasterEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_InactiveEntity_ReturnsDtoWithoutFiltering()
    {
        // Arrange
        var entity = new OldZoneMasterEntity
        {
            Id = 1,
            OldZoneNo = "OZ01",
            Description = "Old Zone 1",
            IsActive = false,
            CreatedDate = DateTime.Now,
            CreatedBy = 1,
            UpdatedDate = null,
            UpdatedBy = null
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockMapper.Setup(m => m.Map<OldZoneMasterDto>(It.IsAny<OldZoneMasterEntity>()))
            .Returns((OldZoneMasterEntity e) => new OldZoneMasterDto
            {
                Id = e.Id,
                OldZoneNo = e.OldZoneNo,
                OldZoneName = e.Description,
                IsActive = e.IsActive,
                CreatedDate = e.CreatedDate,
                UpdatedDate = e.UpdatedDate
            });

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntities()
    {
        // Arrange
        var entities = new List<OldZoneMasterEntity>
        {
            new() { Id = 1, OldZoneNo = "OZ01", Description = "Old Zone 1", IsActive = true, CreatedBy = 1, CreatedDate = DateTime.Now },
            new() { Id = 2, OldZoneNo = "OZ02", Description = "Old Zone 2", IsActive = true, CreatedBy = 1, CreatedDate = DateTime.Now }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<OldZoneMasterEntity, OldZoneMasterDto>()
                .ForMember(dest => dest.OldZoneName, opt => opt.MapFrom(src => src.Description));
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

        mapperConfig.AssertConfigurationIsValid();
        IMapper mapper = mapperConfig.CreateMapper();

        var service = new OldZoneMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper,
            _mockReferenceValidator.Object);

        var qp = new OldZoneMasterQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            FilterLogic = NtisPlatform.Application.Enums.FilterLogic.And
        };

        // Act
        var result = await service.GetAllAsync(qp, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);

        var items = result.Items.ToList();
        Assert.Equal(2, items.Count);
        Assert.Contains(items, x => x.OldZoneNo == "OZ01");
        Assert.Contains(items, x => x.OldZoneNo == "OZ02");
    }

    [Fact]
    public async Task CreateAsync_ValidDto_ReturnsCreatedDto()
    {
        // Arrange
        var createDto = new CreateOldZoneMasterDto
        {
            OldZoneNo = "OZ01",
            OldZoneName = "Old Zone 1",
            CreatedBy = 1,
            IsActive = true
        };

        _mockMapper
            .Setup(m => m.Map<OldZoneMasterEntity>(It.IsAny<CreateOldZoneMasterDto>()))
            .Returns((CreateOldZoneMasterDto dto) => new OldZoneMasterEntity
            {
                Id = 1,
                OldZoneNo = dto.OldZoneNo,
                Description = dto.OldZoneName,
                IsActive = true,
                CreatedDate = DateTime.Now,
                CreatedBy = dto.CreatedBy
            });

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((OldZoneMasterEntity e, CancellationToken _) => e);

        _mockMapper
            .Setup(m => m.Map<OldZoneMasterDto>(It.IsAny<OldZoneMasterEntity>()))
            .Returns((OldZoneMasterEntity e) => new OldZoneMasterDto
            {
                Id = e.Id,
                OldZoneNo = e.OldZoneNo,
                OldZoneName = e.Description,
                IsActive = e.IsActive,
                CreatedDate = e.CreatedDate
            });

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("OZ01", result.OldZoneNo);
        Assert.Equal("Old Zone 1", result.OldZoneName);
        Assert.True(result.IsActive);

        _mockRepository.Verify(r => r.AddAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateOldZoneMasterDto
        {
            OldZoneNo = "OZ01-Updated",
            OldZoneName = "Old Zone 1 Updated",
            IsActive = true,
            UpdatedBy = 2
        };

        var existingEntity = new OldZoneMasterEntity
        {
            Id = 1,
            OldZoneNo = "OZ01",
            Description = "Old Zone 1",
            IsActive = true,
            CreatedDate = DateTime.Now,
            CreatedBy = 1
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateOldZoneMasterDto>(), It.IsAny<OldZoneMasterEntity>()))
            .Callback((UpdateOldZoneMasterDto src, OldZoneMasterEntity dest) =>
            {
                dest.OldZoneNo = src.OldZoneNo;
                dest.Description = src.OldZoneName;
                dest.IsActive = src.IsActive;
                dest.UpdatedBy = src.UpdatedBy;
                dest.UpdatedDate = DateTime.Now;
            });

        _mockMapper
            .Setup(m => m.Map<OldZoneMasterDto>(It.IsAny<OldZoneMasterEntity>()))
            .Returns((OldZoneMasterEntity e) => new OldZoneMasterDto
            {
                Id = e.Id,
                OldZoneNo = e.OldZoneNo,
                OldZoneName = e.Description,
                IsActive = e.IsActive
            });

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);

        Assert.Equal("OZ01-Updated", existingEntity.OldZoneNo);
        Assert.Equal("Old Zone 1 Updated", existingEntity.Description);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingEntity_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateOldZoneMasterDto
        {
            OldZoneNo = "OZ01",
            OldZoneName = "Old Zone 1",
            IsActive = true,
            UpdatedBy = 2
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((OldZoneMasterEntity?)null);

        // Act
        var result = await _service.UpdateAsync(999, updateDto, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesAndSaves_ReturnsTrue()
    {
        // Arrange
        var idToDelete = 1;
        var existingEntity = new OldZoneMasterEntity
        {
            Id = 1,
            OldZoneNo = "OZ01",
            Description = "Old Zone 1",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockReferenceValidator
            .Setup(r => r.ValidateReferencesAsync<OldZoneMasterEntity>(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _mockRepository
            .Setup(r => r.DeleteAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(idToDelete, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockRepository.Verify(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()), Times.Once);
        _mockReferenceValidator.Verify(r => r.ValidateReferencesAsync<OldZoneMasterEntity>(idToDelete, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingEntity_ReturnsFalse_DoesNotSave()
    {
        // Arrange
        var idToDelete = 999;

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync((OldZoneMasterEntity?)null);

        // Act
        var result = await _service.DeleteAsync(idToDelete, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DeactivateWithReferences_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateOldZoneMasterDto
        {
            OldZoneNo = "OZ01",
            OldZoneName = "Old Zone 1",
            IsActive = false
        };

        var existingEntity = new OldZoneMasterEntity
        {
            Id = 1,
            OldZoneNo = "OZ01",
            Description = "Old Zone 1",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateOldZoneMasterDto>(), It.IsAny<OldZoneMasterEntity>()))
            .Callback((UpdateOldZoneMasterDto src, OldZoneMasterEntity dest) =>
            {
                dest.IsActive = src.IsActive;
            });

        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<OldZoneMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate OldZoneMaster. It is referenced by other records."));

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));

        _mockReferenceValidator.Verify(v => v.ValidateReferencesAsync<OldZoneMasterEntity>(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        // Arrange
        var idToDelete = 1;
        var existingEntity = new OldZoneMasterEntity
        {
            Id = 1,
            OldZoneNo = "OZ01",
            Description = "Old Zone 1",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<OldZoneMasterEntity>(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete record because it is referenced elsewhere."));

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(idToDelete, CancellationToken.None));

        _mockReferenceValidator.Verify(v => v.ValidateReferencesAsync<OldZoneMasterEntity>(idToDelete, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<OldZoneMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
