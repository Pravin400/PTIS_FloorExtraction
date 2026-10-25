using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.ApplicationSetting;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class ApplicationSettingServiceTests
{
    private readonly Mock<IRepository<ApplicationSettingEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IConfigurationProvider> _configurationProviderMock;
    private readonly ApplicationSettingService _service;

    public ApplicationSettingServiceTests()
    {
        _repositoryMock = new Mock<IRepository<ApplicationSettingEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _configurationProviderMock = new Mock<IConfigurationProvider>();

        _mapperMock.Setup(m => m.ConfigurationProvider).Returns(_configurationProviderMock.Object);

        _service = new ApplicationSettingService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        // Arrange
        var entity = new ApplicationSettingEntity
        {
            Id = 1,
            FlagName = "EnvirementStatus",
            DataType = "NVARCHAR",
            DefaultValue_NVARCHAR = "Development",
            Description = "Current application environment status"
        };

        var dto = new ApplicationSettingDto
        {
            Id = 1,
            FlagName = "EnvirementStatus",
            DataType = "NVARCHAR",
            DefaultValue_NVARCHAR = "Development",
            Description = "Current application environment status"
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mapperMock.Setup(m => m.Map<ApplicationSettingDto>(entity))
            .Returns(dto);

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("EnvirementStatus", result.FlagName);
        Assert.Equal("Development", result.DefaultValue_NVARCHAR);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationSettingEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_AddsAndSaves()
    {
        // Arrange
        var createDto = new CreateApplicationSettingDto
        {
            FlagName = "IsOTPVerificationForSign",
            DataType = "BIT",
            DefaultValue_Bit = false
        };

        var entity = new ApplicationSettingEntity
        {
            Id = 3,
            FlagName = "IsOTPVerificationForSign",
            DataType = "BIT",
            DefaultValue_Bit = false
        };

        var returnDto = new ApplicationSettingDto
        {
            Id = 3,
            FlagName = "IsOTPVerificationForSign",
            DataType = "BIT",
            DefaultValue_Bit = false
        };

        _mapperMock.Setup(m => m.Map<ApplicationSettingEntity>(createDto))
            .Returns(entity);
        _repositoryMock.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _mapperMock.Setup(m => m.Map<ApplicationSettingDto>(entity))
            .Returns(returnDto);

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Id);
        Assert.Equal("IsOTPVerificationForSign", result.FlagName);
        _repositoryMock.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSaves()
    {
        // Arrange
        var entity = new ApplicationSettingEntity
        {
            Id = 2,
            FlagName = "VersionNo",
            DataType = "NVARCHAR",
            DefaultValue_NVARCHAR = "1.0.0"
        };

        var updateDto = new UpdateApplicationSettingDto
        {
            Id = 2,
            FlagName = "VersionNo",
            DataType = "NVARCHAR",
            DefaultValue_NVARCHAR = "1.0.1"
        };

        var returnDto = new ApplicationSettingDto
        {
            Id = 2,
            FlagName = "VersionNo",
            DataType = "NVARCHAR",
            DefaultValue_NVARCHAR = "1.0.1"
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mapperMock.Setup(m => m.Map(updateDto, entity));
        _repositoryMock.Setup(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _mapperMock.Setup(m => m.Map<ApplicationSettingDto>(entity))
            .Returns(returnDto);

        // Act
        var result = await _service.UpdateAsync(2, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1.0.1", result.DefaultValue_NVARCHAR);
        _repositoryMock.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_DeletesAndSaves()
    {
        // Arrange
        var entity = new ApplicationSettingEntity { Id = 1 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _repositoryMock.Setup(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.DeleteAsync(1);

        // Assert
        Assert.True(result);
        _repositoryMock.Verify(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingId_ReturnsFalse()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationSettingEntity?)null);

        // Act
        var result = await _service.DeleteAsync(999);

        // Assert
        Assert.False(result);
        _repositoryMock.Verify(r => r.DeleteAsync(It.IsAny<ApplicationSettingEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetSettingsAsync_GroupsByModuleAndOutputsCorrectStructure()
    {
        // Arrange
        var module = new ModuleMasterEntity { Id = 8012, ModuleName = "GeoSequencing" };
        var settings = new System.Collections.Generic.List<ApplicationSettingEntity>
        {
            new()
            {
                Id = 1,
                ModuleId = 8012,
                Module = module,
                FlagName = "IsMaintenance",
                DataType = "BIT",
                DefaultValue_Bit = false,
                IsActive = true
            },
            new()
            {
                Id = 2,
                ModuleId = 8012,
                Module = module,
                FlagName = "VersionNo",
                DataType = "NVARCHAR",
                DefaultValue_NVARCHAR = "1.0.0",
                IsActive = true
            },
            new()
            {
                Id = 3,
                ModuleId = 8012,
                Module = module,
                FlagName = "IsOTPVerificationForSign",
                DataType = "BIT",
                DefaultValue_Bit = false,
                IsActive = true
            },
            new()
            {
                Id = 4,
                ModuleId = 8012,
                Module = module,
                FlagName = "MaxRetryCount",
                DataType = "INT",
                DefaultValue_INT = 5,
                IsActive = true
            }
        };

        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(settings.BuildMock());

        // Act
        var result = await _service.GetSettingsAsync(8012);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        var item = result[0];
        Assert.Equal(8012, item.ModuleId);
        Assert.Equal("GeoSequencing", item.ModuleName);
        Assert.True(item.Settings.ContainsKey("GeoSequencing"));

        // Verify JSON serialization produces expected output
        var json = System.Text.Json.JsonSerializer.Serialize(result, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        Assert.Contains("\"moduleId\": 8012", json);
        Assert.Contains("\"moduleName\": \"GeoSequencing\"", json);
        Assert.Contains("\"GeoSequencing\": [", json);
        Assert.Contains("\"IsMaintenance\": false", json);
        Assert.Contains("\"VersionNo\": \"1.0.0\"", json);
        Assert.Contains("\"IsOTPVerificationForSign\": false", json);
        Assert.Contains("\"MaxRetryCount\": 5", json);
    }

    [Fact]
    public async Task GetSettingsAsync_WithNullModule_FallsBackToGlobalSettingsAndMapsDatatypes()
    {
        // Arrange
        var settings = new System.Collections.Generic.List<ApplicationSettingEntity>
        {
            new()
            {
                Id = 10,
                ModuleId = null,
                Module = null,
                FlagName = "EnableAuditLog",
                DataType = "BOOLEAN",
                DefaultValue_Bit = true,
                IsActive = true
            },
            new()
            {
                Id = 11,
                ModuleId = null,
                Module = null,
                FlagName = "ApiUrl",
                DataType = "VARCHAR",
                DefaultValue_NVARCHAR = "https://api.example.com",
                IsActive = true
            }
        };

        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(settings.BuildMock());

        // Act
        var result = await _service.GetSettingsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        var item = result[0];
        Assert.Null(item.ModuleId);
        Assert.Null(item.ModuleName);
        Assert.True(item.Settings.ContainsKey("GlobalSettings"));

        var json = System.Text.Json.JsonSerializer.Serialize(result, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        Assert.Contains("\"GlobalSettings\": [", json);
        Assert.Contains("\"EnableAuditLog\": true", json);
        Assert.Contains("\"ApiUrl\": \"https://api.example.com\"", json);
    }
}
