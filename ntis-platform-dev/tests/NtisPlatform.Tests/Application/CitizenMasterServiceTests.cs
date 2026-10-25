using AutoMapper;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Mappings.GrievanceMapping;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class CitizenMasterServiceTests
{
    private readonly Mock<IRepository<CitizenMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly CitizenMasterService _service;

    public CitizenMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<CitizenMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();

        var defaultEntities = new List<CitizenMasterEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(defaultEntities.BuildMock());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _service = new CitizenMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new CitizenMasterEntity
        {
            Id = 1,
            Name = "John Doe",
            MobileNo = "9876543210",
            IsVerified = true,
            FailedOtpCount = 0,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockMapper.Setup(m => m.Map<CitizenMasterDto>(It.IsAny<CitizenMasterEntity>()))
            .Returns(new CitizenMasterDto
            {
                Id = 1,
                Name = "John Doe",
                MobileNo = "9876543210",
                IsVerified = true,
                FailedOtpCount = 0,
                IsActive = true
            });

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("John Doe", result.Name);
        Assert.Equal("9876543210", result.MobileNo);
        Assert.True(result.IsVerified);
        Assert.True(result.IsActive);

        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockMapper.Verify(m => m.Map<CitizenMasterDto>(entity), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CitizenMasterEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
        _mockMapper.Verify(m => m.Map<CitizenMasterDto>(It.IsAny<CitizenMasterEntity>()), Times.Never);
    }

    #endregion

    #region GetByMobileNoAsync Tests

    [Fact]
    public async Task GetByMobileNoAsync_ExistingMobile_ReturnsDto()
    {
        // Arrange
        var entities = new List<CitizenMasterEntity>
        {
            new()
            {
                Id = 1,
                Name = "Jane Doe",
                MobileNo = "9876543210",
                IsVerified = true,
                IsActive = true
            }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        _mockMapper.Setup(m => m.Map<CitizenMasterDto>(It.IsAny<CitizenMasterEntity>()))
            .Returns(new CitizenMasterDto
            {
                Id = 1,
                Name = "Jane Doe",
                MobileNo = "9876543210",
                IsVerified = true,
                IsActive = true
            });

        // Act
        var result = await _service.GetByMobileNoAsync("9876543210");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("9876543210", result.MobileNo);
        Assert.Equal("Jane Doe", result.Name);
    }

    [Fact]
    public async Task GetByMobileNoAsync_NonExistingMobile_ReturnsNull()
    {
        // Arrange
        var entities = new List<CitizenMasterEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        // Act
        var result = await _service.GetByMobileNoAsync("9999999999");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByMobileNoAsync_DeactivatedCitizen_ReturnsNull()
    {
        // Arrange
        var entities = new List<CitizenMasterEntity>
        {
            new()
            {
                Id = 1,
                Name = "Deactivated Citizen",
                MobileNo = "9876543210",
                IsVerified = true,
                IsActive = false
            }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        // Act
        var result = await _service.GetByMobileNoAsync("9876543210");

        // Assert
        Assert.Null(result);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task GetByMobileNoAsync_NullOrEmptyMobile_ReturnsNull(string? mobileNo)
    {
        // Act
        var result = await _service.GetByMobileNoAsync(mobileNo!);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntities()
    {
        // Arrange
        var entities = new List<CitizenMasterEntity>
        {
            new() { Id = 1, Name = "Citizen 1", MobileNo = "9876543211", IsVerified = true, IsActive = true },
            new() { Id = 2, Name = "Citizen 2", MobileNo = "9876543212", IsVerified = false, IsActive = true },
            new() { Id = 3, Name = "Citizen 3", MobileNo = "9876543213", IsVerified = true, IsActive = false }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<CitizenMasterMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

        IMapper mapper = mapperConfig.CreateMapper();

        var service = new CitizenMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper);

        var queryParams = new CitizenMasterQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalCount);
        Assert.Equal(3, result.Items.Count());
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_ReturnsCreatedDto()
    {
        // Arrange
        var createDto = new CreateCitizenMasterDto
        {
            Name = "New Citizen",
            MobileNo = "9876543210",
            IsActive = true
        };

        _mockMapper
            .Setup(m => m.Map<CitizenMasterEntity>(It.IsAny<CreateCitizenMasterDto>()))
            .Returns((CreateCitizenMasterDto dto) => new CitizenMasterEntity
            {
                Name = dto.Name,
                MobileNo = dto.MobileNo,
                IsVerified = false,
                IsActive = dto.IsActive
            });

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<CitizenMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CitizenMasterEntity e, CancellationToken _) =>
            {
                e.Id = 1;
                return e;
            });

        _mockMapper
            .Setup(m => m.Map<CitizenMasterDto>(It.IsAny<CitizenMasterEntity>()))
            .Returns((CitizenMasterEntity e) => new CitizenMasterDto
            {
                Id = e.Id,
                Name = e.Name,
                MobileNo = e.MobileNo,
                IsVerified = e.IsVerified,
                IsActive = e.IsActive
            });

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("New Citizen", result.Name);
        Assert.Equal("9876543210", result.MobileNo);

        _mockRepository.Verify(r => r.AddAsync(It.IsAny<CitizenMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateCitizenMasterDto
        {
            Name = "Updated Citizen",
            MobileNo = "9876543210",
            IsActive = true
        };

        var existingEntity = new CitizenMasterEntity
        {
            Id = 1,
            Name = "Old Citizen",
            MobileNo = "9876543210",
            IsVerified = false,
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<CitizenMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateCitizenMasterDto>(), It.IsAny<CitizenMasterEntity>()))
            .Callback((UpdateCitizenMasterDto src, CitizenMasterEntity dest) =>
            {
                dest.Name = src.Name;
                dest.MobileNo = src.MobileNo;
                dest.IsActive = src.IsActive;
            });

        _mockMapper
            .Setup(m => m.Map<CitizenMasterDto>(It.IsAny<CitizenMasterEntity>()))
            .Returns((CitizenMasterEntity e) => new CitizenMasterDto
            {
                Id = e.Id,
                Name = e.Name,
                MobileNo = e.MobileNo,
                IsVerified = e.IsVerified,
                IsActive = e.IsActive
            });

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Citizen", result.Name);

        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        // Arrange
        var existingEntity = new CitizenMasterEntity
        {
            Id = 1,
            Name = "To Delete",
            MobileNo = "9876543210",
            IsActive = true
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.DeleteAsync(1, CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion
}
