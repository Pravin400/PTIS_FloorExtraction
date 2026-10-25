using AutoMapper;
using MockQueryable;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Application.Interfaces.Master;

namespace NtisPlatform.Tests.Application;

public class AssetFieldDefinitionServiceTests
{
    private readonly Mock<IRepository<AssetFieldDefinitionEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly Mock<IHardDeleteCleanupService> _mockCleanupService;
    private readonly Mock<ILogger<AssetFieldDefinitionController>> _mockLogger;
    private readonly AssetFieldDefinitionService _service;

    public AssetFieldDefinitionServiceTests()
    {
        _mockRepository = new Mock<IRepository<AssetFieldDefinitionEntity, int>>();
        // Create/Update run a FieldCode/FieldName duplicate check through GetQueryable(); default to an
        // empty async-capable set so tests that don't care about duplicates see no clash.
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetFieldDefinitionEntity>().BuildMock());
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();
        _mockCleanupService = new Mock<IHardDeleteCleanupService>();
        _mockLogger = new Mock<ILogger<AssetFieldDefinitionController>>();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _service = new AssetFieldDefinitionService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockReferenceValidator.Object);
    }

    private static AssetFieldDefinitionEntity CreateEntity(
        int id = 1,
        int assetCategoryId = 1,
        int assetTypeId = 2,
        string fieldCode = "FLD001",
        string fieldName = "SerialNumber",
        bool isActive = true,
        string? fieldGroup = "Group1")
    {
        return new AssetFieldDefinitionEntity
        {
            Id = id,
            AssetCategoryId = assetCategoryId,
            AssetTypeId = assetTypeId,
            FieldCode = fieldCode,
            FieldName = fieldName,
            FieldLabel = "Serial Number",
            FieldType = "Text",
            FieldGroup = fieldGroup,
            IsRequired = true,
            DisplayOrder = 1,
            IsActive = isActive,
            CreatedBy = 1,
            CreatedDate = DateTime.Now,
            MarkedForDeletion = false,
            MarkedForDeletionDate = null
        };
    }

    [Fact]
    public void TestAllProperties_ToEnsureCodeCoverage()
    {
        // Entity
        var entity = new AssetFieldDefinitionEntity
        {
            Id = 1,
            AssetCategoryId = 2,
            AssetTypeId = 3,
            FieldCode = "A",
            FieldName = "B",
            FieldLabel = "C",
            FieldType = "D",
            FieldGroup = "E",
            IsRequired = true,
            DisplayOrder = 1,
            OptionsJson = "[\"F\"]",
            IsActive = true,
            MarkedForDeletion = true,
            MarkedForDeletionDate = DateTime.Now
        };
        Assert.Equal(1, entity.Id);
        Assert.Equal(2, entity.AssetCategoryId);
        Assert.Equal(3, entity.AssetTypeId);
        Assert.Equal("A", entity.FieldCode);
        Assert.Equal("B", entity.FieldName);
        Assert.Equal("C", entity.FieldLabel);
        Assert.Equal("D", entity.FieldType);
        Assert.Equal("E", entity.FieldGroup);
        Assert.True(entity.IsRequired);
        Assert.Equal(1, entity.DisplayOrder);
        Assert.Equal("[\"F\"]", entity.OptionsJson);
        Assert.True(entity.IsActive);
        Assert.True(entity.MarkedForDeletion);
        Assert.NotNull(entity.MarkedForDeletionDate);

        // DTOs
        var dto = new AssetFieldDefinitionDto
        {
            Id = 1,
            AssetCategoryId = 2,
            AssetTypeId = 3,
            FieldCode = "A",
            FieldName = "B",
            FieldLabel = "C",
            FieldType = "D",
            FieldGroup = "E",
            IsRequired = true,
            DisplayOrder = 1,
            OptionsJson = "[\"F\"]",
            IsActive = true
        };
        Assert.Equal(1, dto.Id);
        Assert.Equal(2, dto.AssetCategoryId);
        Assert.Equal(3, dto.AssetTypeId);
        Assert.Equal("A", dto.FieldCode);
        Assert.Equal("B", dto.FieldName);
        Assert.Equal("C", dto.FieldLabel);
        Assert.Equal("D", dto.FieldType);
        Assert.Equal("E", dto.FieldGroup);
        Assert.True(dto.IsRequired);
        Assert.Equal(1, dto.DisplayOrder);
        Assert.Equal("[\"F\"]", dto.OptionsJson);
        Assert.True(dto.IsActive);

        var createDto = new CreateAssetFieldDefinitionDto
        {
            AssetCategoryId = 2,
            AssetTypeId = 3,
            FieldCode = "A",
            FieldName = "B",
            FieldLabel = "C",
            FieldType = "D",
            FieldGroup = "E",
            IsRequired = true,
            DisplayOrder = 1,
            OptionsJson = "[\"F\"]",
            CreatedBy = 2
        };
        Assert.Equal(2, createDto.AssetCategoryId);
        Assert.Equal(3, createDto.AssetTypeId);
        Assert.Equal("A", createDto.FieldCode);
        Assert.Equal("B", createDto.FieldName);
        Assert.Equal("C", createDto.FieldLabel);
        Assert.Equal("D", createDto.FieldType);
        Assert.Equal("E", createDto.FieldGroup);
        Assert.True(createDto.IsRequired);
        Assert.Equal(1, createDto.DisplayOrder);
        Assert.Equal("[\"F\"]", createDto.OptionsJson);
        Assert.Equal(2, createDto.CreatedBy);

        var updateDto = new UpdateAssetFieldDefinitionDto
        {
            AssetCategoryId = 2,
            AssetTypeId = 3,
            FieldCode = "A",
            FieldName = "B",
            FieldLabel = "C",
            FieldType = "D",
            FieldGroup = "E",
            IsRequired = true,
            DisplayOrder = 1,
            OptionsJson = "[\"F\"]",
            UpdatedBy = 3,
            IsActive = false
        };
        Assert.Equal(2, updateDto.AssetCategoryId);
        Assert.Equal(3, updateDto.AssetTypeId);
        Assert.Equal("A", updateDto.FieldCode);
        Assert.Equal("B", updateDto.FieldName);
        Assert.Equal("C", updateDto.FieldLabel);
        Assert.Equal("D", updateDto.FieldType);
        Assert.Equal("E", updateDto.FieldGroup);
        Assert.True(updateDto.IsRequired);
        Assert.Equal(1, updateDto.DisplayOrder);
        Assert.Equal("[\"F\"]", updateDto.OptionsJson);
        Assert.Equal(3, updateDto.UpdatedBy);
        Assert.False(updateDto.IsActive);

        // Query parameters
        var qp = new AssetFieldDefinitionQueryParameters
        {
            AssetCategoryId = 2,
            AssetTypeId = 3,
            FieldCode = "A",
            FieldName = "B",
            IsActive = true,
            PageNumber = 1,
            PageSize = 10
        };
        Assert.Equal(2, qp.AssetCategoryId);
        Assert.Equal(3, qp.AssetTypeId);
        Assert.Equal("A", qp.FieldCode);
        Assert.Equal("B", qp.FieldName);
        Assert.True(qp.IsActive);
        Assert.Equal(1, qp.PageNumber);
        Assert.Equal(10, qp.PageSize);
    }

    [Fact]
    public void TestMappingProfile()
    {
        var configuration = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AssetFieldDefinitionMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        configuration.AssertConfigurationIsValid();
    }

    [Fact]
    public void TestMappingProfile_MapsOptionsJson()
    {
        const string optionsJson = "[{\"value\":\"A\",\"label\":\"Option A\"},{\"value\":\"B\",\"label\":\"Option B\"}]";
        var mapper = new MapperConfiguration(cfg => cfg.AddProfile<AssetFieldDefinitionMappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance)
            .CreateMapper();

        var fromCreate = mapper.Map<AssetFieldDefinitionEntity>(new CreateAssetFieldDefinitionDto { OptionsJson = optionsJson });
        Assert.Equal(optionsJson, fromCreate.OptionsJson);

        var existing = CreateEntity(1);
        existing.OptionsJson = "[]";
        mapper.Map(new UpdateAssetFieldDefinitionDto { OptionsJson = optionsJson }, existing);
        Assert.Equal(optionsJson, existing.OptionsJson);

        var dto = mapper.Map<AssetFieldDefinitionDto>(existing);
        Assert.Equal(optionsJson, dto.OptionsJson);

        mapper.Map(new UpdateAssetFieldDefinitionDto { OptionsJson = null }, existing);
        Assert.Null(existing.OptionsJson);
    }

    #region OptionsJson (AMS.AssetFieldDefinition.OptionsJson nvarchar(max) NULL, CK: NULL or ISJSON = 1)

    private static IMapper CreateRealMapper() =>
        new MapperConfiguration(cfg => cfg.AddProfile<AssetFieldDefinitionMappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance)
            .CreateMapper();

    private static CreateAssetFieldDefinitionDto ValidCreateDto(string? optionsJson) => new()
    {
        AssetCategoryId = 1,
        AssetTypeId = 2,
        FieldCode = "ROOF_TYPE",
        FieldName = "Roof Type",
        FieldLabel = "Roof Type",
        FieldType = "Dropdown",
        DisplayOrder = 1,
        OptionsJson = optionsJson
    };

    private static UpdateAssetFieldDefinitionDto ValidUpdateDto(string? optionsJson) => new()
    {
        AssetCategoryId = 1,
        AssetTypeId = 2,
        FieldCode = "ROOF_TYPE",
        FieldName = "Roof Type",
        FieldLabel = "Roof Type",
        FieldType = "Dropdown",
        DisplayOrder = 1,
        IsActive = true,
        OptionsJson = optionsJson
    };

    private static List<System.ComponentModel.DataAnnotations.ValidationResult> Validate(object dto)
    {
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        System.ComponentModel.DataAnnotations.Validator.TryValidateObject(
            dto, new System.ComponentModel.DataAnnotations.ValidationContext(dto), results, validateAllProperties: true);
        return results;
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("[{\"value\":\"RCC\",\"label\":\"RCC\"},{\"value\":\"TIN\",\"label\":\"Tin Sheet\"}]")]
    [InlineData("{\"min\":0,\"max\":100}")]
    public void Dtos_ValidOrMissingOptionsJson_PassValidation(string? optionsJson)
    {
        Assert.Empty(Validate(ValidCreateDto(optionsJson)));
        Assert.Empty(Validate(ValidUpdateDto(optionsJson)));
    }

    [Theory]
    [InlineData("Red,Green,Blue")]
    [InlineData("\"RCC\"")]
    [InlineData("[{\"value\":\"RCC\"},]")]
    [InlineData("{'value':'RCC'}")]
    public void Dtos_OptionsJsonTheDatabaseCheckWouldReject_FailValidation(string optionsJson)
    {
        // Without this the value reaches CK_AssetFieldDefinition_OptionsJson and the API answers with a misleading
        // 409 "record already exists" (CrudControllerExtensions treats any "constraint" error as a duplicate).
        foreach (var dto in new object[] { ValidCreateDto(optionsJson), ValidUpdateDto(optionsJson) })
        {
            var error = Assert.Single(Validate(dto));
            Assert.Equal("AssetFieldDefinition_OptionsJson_Invalid", error.ErrorMessage);
            Assert.Contains(nameof(CreateAssetFieldDefinitionDto.OptionsJson), error.MemberNames);
        }
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void MappingProfile_BlankOptionsJson_IsStoredAsNull(string blank)
    {
        // ISJSON('') = 0, so a cleared options box must reach the database as NULL.
        var mapper = CreateRealMapper();

        Assert.Null(mapper.Map<AssetFieldDefinitionEntity>(new CreateAssetFieldDefinitionDto { OptionsJson = blank }).OptionsJson);

        var existing = CreateEntity(1);
        existing.OptionsJson = "[]";
        mapper.Map(new UpdateAssetFieldDefinitionDto { OptionsJson = blank }, existing);
        Assert.Null(existing.OptionsJson);
    }

    [Fact]
    public void MappingProfile_JsonOptions_AreStoredUnchanged()
    {
        const string optionsJson = "  [ {\"value\":\"RCC\"} ]  ";

        var entity = CreateRealMapper().Map<AssetFieldDefinitionEntity>(new CreateAssetFieldDefinitionDto { OptionsJson = optionsJson });

        Assert.Equal(optionsJson, entity.OptionsJson);
    }

    [Theory]
    [InlineData("  ", null)]
    [InlineData("[{\"value\":\"RCC\"}]", "[{\"value\":\"RCC\"}]")]
    public async Task CreateAsync_WithRealMapper_PersistsOptionsJsonAsTheDatabaseAllows(string? optionsJson, string? expectedStored)
    {
        AssetFieldDefinitionEntity? added = null;
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetFieldDefinitionEntity>().BuildMock());
        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetFieldDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .Callback((AssetFieldDefinitionEntity e, CancellationToken _) => added = e)
            .ReturnsAsync((AssetFieldDefinitionEntity e, CancellationToken _) => e);
        var service = new AssetFieldDefinitionService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object);

        var result = await service.CreateAsync(ValidCreateDto(optionsJson));

        Assert.NotNull(added);
        Assert.Equal(expectedStored, added!.OptionsJson);
        Assert.Equal(expectedStored, result.OptionsJson);
    }

    [Fact]
    public void EfModel_OptionsJson_MatchesDatabaseColumn()
    {
        // The column is owned by ntis-database-manager (10_AMS/01_base_schema.sql: [OptionsJson] [nvarchar](max) NULL);
        // the EF model must describe that same column. The SQL Server provider only builds the model here — no
        // connection is opened — and it is what resolves the real store type.
        using var context = new NtisPlatform.Infrastructure.Data.ApplicationDbContext(
            new DbContextOptionsBuilder<NtisPlatform.Infrastructure.Data.ApplicationDbContext>()
                .UseSqlServer("Server=model-only;Database=model-only;Trusted_Connection=True;TrustServerCertificate=True", sql => sql.UseNetTopologySuite())
                .Options);

        var property = context.Model.FindEntityType(typeof(AssetFieldDefinitionEntity))!.FindProperty(nameof(AssetFieldDefinitionEntity.OptionsJson))!;

        Assert.True(property.IsNullable);
        Assert.Equal("nvarchar(max)", property.GetColumnType());
    }

    #endregion

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = CreateEntity(1);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<AssetFieldDefinitionDto>(entity)).Returns(new AssetFieldDefinitionDto { Id = 1, FieldCode = "FLD001" });

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsPagedResult()
    {
        var entities = new List<AssetFieldDefinitionEntity> { CreateEntity(1), CreateEntity(2) };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<AssetFieldDefinitionMappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        var service = new AssetFieldDefinitionService(_mockRepository.Object, _mockUnitOfWork.Object, mapperConfig.CreateMapper(), _mockReferenceValidator.Object);

        var qp = new AssetFieldDefinitionQueryParameters { PageNumber = 1, PageSize = 10 };
        var result = await service.GetAllAsync(qp);

        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_Succeeds()
    {
        var dto = new CreateAssetFieldDefinitionDto { AssetCategoryId = 1, AssetTypeId = 2, FieldCode = "FLD001", FieldName = "Test" };
        var entity = CreateEntity(0, 1, 2, "FLD001", "Test");

        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetFieldDefinitionEntity>().BuildMock());
        _mockMapper.Setup(m => m.Map<AssetFieldDefinitionEntity>(dto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<AssetFieldDefinitionDto>(entity)).Returns(new AssetFieldDefinitionDto { Id = 1 });

        var result = await _service.CreateAsync(dto);

        Assert.NotNull(result);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_Duplicate_ThrowsValidationException()
    {
        var dto = new CreateAssetFieldDefinitionDto { AssetCategoryId = 1, AssetTypeId = 2, FieldCode = "FLD001" };
        var existing = CreateEntity(1, 1, 2, "FLD001");
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetFieldDefinitionEntity> { existing }.BuildMock());
        _mockMapper.Setup(m => m.Map<AssetFieldDefinitionEntity>(dto)).Returns(CreateEntity(0, 1, 2, "FLD001"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto));
    }

    [Fact]
    public async Task UpdateAsync_DeactivateWithReferences_ThrowsValidationException()
    {
        var dto = new UpdateAssetFieldDefinitionDto { AssetCategoryId = 1, AssetTypeId = 2, FieldCode = "FLD001", IsActive = false };
        var existing = CreateEntity(1, isActive: true);

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockReferenceValidator.Setup(rv => rv.ValidateReferencesAsync<AssetFieldDefinitionEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Referenced"));
        _mockMapper.Setup(m => m.Map(dto, existing)).Returns(existing).Callback<UpdateAssetFieldDefinitionDto, AssetFieldDefinitionEntity>((d, e) => e.IsActive = d.IsActive);

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, dto));
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existing = CreateEntity(1);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockReferenceValidator.Setup(rv => rv.ValidateReferencesAsync<AssetFieldDefinitionEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Referenced"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1));
    }

    [Fact]
    public async Task DeleteAsync_NoReferences_Succeeds()
    {
        var existing = CreateEntity(1);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockReferenceValidator.Setup(rv => rv.ValidateReferencesAsync<AssetFieldDefinitionEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());
        _mockRepository.Setup(r => r.DeleteAsync(existing, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task GetDistinctFieldGroupsAsync_ReturnsDistinctSortedNonEmptyGroups()
    {
        var entities = new List<AssetFieldDefinitionEntity>
        {
            CreateEntity(1, fieldGroup: "Zeta"),
            CreateEntity(2, fieldGroup: "Alpha"),
            CreateEntity(3, fieldGroup: "Alpha"),
            CreateEntity(4, fieldGroup: null),
            CreateEntity(5, fieldGroup: string.Empty),
            CreateEntity(6, fieldGroup: "Beta"),
            CreateEntity(7, fieldGroup: "   "),
            CreateEntity(8, fieldGroup: " Alpha "),
            CreateEntity(9, fieldGroup: "Beta  ")
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        var result = await _service.GetDistinctFieldGroupsAsync();

        // Whitespace-only groups are left out and padded duplicates collapse into the trimmed value.
        Assert.Equal(new List<string> { "Alpha", "Beta", "Zeta" }, result);
    }

    [Fact]
    public async Task GetDistinctFieldGroupsAsync_OnlyBlankGroups_ReturnsEmptyList()
    {
        var entities = new List<AssetFieldDefinitionEntity>
        {
            CreateEntity(1, fieldGroup: "   "),
            CreateEntity(2, fieldGroup: string.Empty),
            CreateEntity(3, fieldGroup: null)
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        var result = await _service.GetDistinctFieldGroupsAsync();

        Assert.Empty(result);
    }

    [Theory]
    [InlineData("   ", null)]
    [InlineData("", null)]
    [InlineData(null, null)]
    [InlineData("  Survey Details ", "Survey Details")]
    [InlineData("Survey Details", "Survey Details")]
    public void MappingProfile_FieldGroup_IsStoredTrimmedWithBlankAsNull(string? fieldGroup, string? expected)
    {
        var mapper = CreateRealMapper();

        Assert.Equal(expected, mapper.Map<AssetFieldDefinitionEntity>(new CreateAssetFieldDefinitionDto { FieldGroup = fieldGroup }).FieldGroup);

        var existing = CreateEntity(1, fieldGroup: "Old Group");
        mapper.Map(new UpdateAssetFieldDefinitionDto { FieldGroup = fieldGroup }, existing);
        Assert.Equal(expected, existing.FieldGroup);
    }

    [Fact]
    public async Task GetDistinctFieldGroupsAsync_NoGroups_ReturnsEmptyList()
    {
        var entities = new List<AssetFieldDefinitionEntity>
        {
            CreateEntity(1, fieldGroup: null),
            CreateEntity(2, fieldGroup: string.Empty)
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

        var result = await _service.GetDistinctFieldGroupsAsync();

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task Controller_GetAll_ReturnsOk()
    {
        var mockService = new Mock<IAssetFieldDefinitionService>();
        mockService.Setup(s => s.GetAllAsync(It.IsAny<AssetFieldDefinitionQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<AssetFieldDefinitionDto>(new List<AssetFieldDefinitionDto>(), 0, 1, 10));
        var controller = new AssetFieldDefinitionController(mockService.Object, _mockCleanupService.Object, _mockReferenceValidator.Object, _mockLogger.Object);
        var qp = new AssetFieldDefinitionQueryParameters();

        var result = await controller.GetAll(qp, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Controller_GetById_ReturnsOk()
    {
        var mockService = new Mock<IAssetFieldDefinitionService>();
        mockService.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetFieldDefinitionDto { Id = 1 });
        var controller = new AssetFieldDefinitionController(mockService.Object, _mockCleanupService.Object, _mockReferenceValidator.Object, _mockLogger.Object);

        var result = await controller.GetById(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Controller_GetFieldGroups_ReturnsOk()
    {
        var mockService = new Mock<IAssetFieldDefinitionService>();
        var fieldGroups = new List<string> { "Electrical", "General" };
        mockService.Setup(s => s.GetDistinctFieldGroupsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(fieldGroups);
        var controller = new AssetFieldDefinitionController(mockService.Object, _mockCleanupService.Object, _mockReferenceValidator.Object, _mockLogger.Object);

        var result = await controller.GetFieldGroups(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(fieldGroups, okResult.Value);
    }

    [Fact]
    public async Task Controller_Create_ReturnsOk()
    {
        var mockService = new Mock<IAssetFieldDefinitionService>();
        var dto = new CreateAssetFieldDefinitionDto { FieldCode = "FLD001" };
        mockService.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetFieldDefinitionDto { Id = 1 });
        var controller = new AssetFieldDefinitionController(mockService.Object, _mockCleanupService.Object, _mockReferenceValidator.Object, _mockLogger.Object);

        var result = await controller.Create(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Controller_Update_ReturnsOk()
    {
        var mockService = new Mock<IAssetFieldDefinitionService>();
        var dto = new UpdateAssetFieldDefinitionDto { FieldCode = "FLD001" };
        mockService.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetFieldDefinitionDto { Id = 1 });
        var controller = new AssetFieldDefinitionController(mockService.Object, _mockCleanupService.Object, _mockReferenceValidator.Object, _mockLogger.Object);

        var result = await controller.Update(1, dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Controller_Delete_ReturnsOk()
    {
        var mockService = new Mock<IAssetFieldDefinitionService>();
        mockService.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = new AssetFieldDefinitionController(mockService.Object, _mockCleanupService.Object, _mockReferenceValidator.Object, _mockLogger.Object);

        var result = await controller.Delete(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Controller_Purge_ReturnsOk()
    {
        var mockService = new Mock<IAssetFieldDefinitionService>();
        var controller = new AssetFieldDefinitionController(mockService.Object, _mockCleanupService.Object, _mockReferenceValidator.Object, _mockLogger.Object);
        _mockCleanupService.Setup(c => c.ForceHardDeleteAsync<AssetFieldDefinitionEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Purge(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }
}
