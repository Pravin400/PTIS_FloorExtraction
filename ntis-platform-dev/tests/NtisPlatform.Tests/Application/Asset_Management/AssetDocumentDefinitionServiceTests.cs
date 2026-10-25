using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;
using AppValidationException = NtisPlatform.Application.Exceptions.ValidationException;
using SystemValidationResult = System.ComponentModel.DataAnnotations.ValidationResult;

namespace NtisPlatform.Tests.Application.Asset_Management;

/// <summary>
/// Comprehensive tests for AssetDocumentDefinitionService targeting 100% code coverage.
/// Covers all CRUD, validation branches (category/type/duplicate/deactivation), and DTO/entity property paths.
/// </summary>
public class AssetDocumentDefinitionServiceTests
{
    private readonly Mock<IRepository<AssetDocumentDefinitionEntity, int>> _repositoryMock = new();
    private readonly Mock<IRepository<AssetCategoryEntity, int>> _categoryRepoMock = new();
    private readonly Mock<IRepository<AssetTypeEntity, int>> _typeRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IReferenceValidationService> _referenceValidatorMock = new();
    private readonly IMapper _mapper;

    public AssetDocumentDefinitionServiceTests()
    {
        var config = new MapperConfiguration(cfg =>
            cfg.AddProfile<AssetDocumentDefinitionMappingProfile>(), NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _referenceValidatorMock
            .Setup(x => x.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(It.IsAny<int>(), It.IsAny<ReferenceValidationOperation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());
    }

    private AssetDocumentDefinitionService CreateService() =>
        new(_repositoryMock.Object, _categoryRepoMock.Object, _typeRepoMock.Object,
            _unitOfWorkMock.Object, _mapper, _referenceValidatorMock.Object);

    // --------------- Entity & DTO Properties ---------------

    [Fact]
    public void Entity_Properties_GetSet_WorksCorrectly()
    {
        var now = DateTime.UtcNow;
        var entity = new AssetDocumentDefinitionEntity
        {
            Id = 10, AssetCategoryId = 1, AssetTypeId = 2,
            DocumentCode = "SALE_DEED", DocumentName = "Sale Deed",
            Description = "Desc", IsRequired = true, DisplayOrder = 3,
            AssetCategory = new AssetCategoryEntity { Id = 1, CategoryName = "Buildings" },
            AssetType = new AssetTypeEntity { Id = 2, TypeName = "Commercial" },
            IsActive = true, CreatedBy = 1, CreatedDate = now,
            UpdatedBy = 2, UpdatedDate = now, MarkedForDeletion = false, MarkedForDeletionDate = null
        };
        Assert.Equal(10, entity.Id);
        Assert.Equal("SALE_DEED", entity.DocumentCode);
        Assert.Equal("Buildings", entity.AssetCategory!.CategoryName);
        Assert.False(entity.MarkedForDeletion);
        entity.MarkedForDeletion = true;
        entity.MarkedForDeletionDate = now;
        Assert.True(entity.MarkedForDeletion);
        Assert.Equal(now, entity.MarkedForDeletionDate);
    }

    [Fact]
    public void Dto_Properties_GetSet_WorksCorrectly()
    {
        var dto = new AssetDocumentDefinitionDto
        {
            Id = 5, AssetCategoryId = 1, AssetTypeId = 2,
            AssetCategoryName = "Buildings", AssetTypeName = "Commercial",
            DocumentCode = "SALE_DEED", DocumentName = "Sale Deed",
            Description = "Desc", IsRequired = true, DisplayOrder = 1,
            IsActive = true
        };
        Assert.Equal(5, dto.Id);
        Assert.Equal("Buildings", dto.AssetCategoryName);
        Assert.Equal("Commercial", dto.AssetTypeName);
        Assert.Equal("SALE_DEED", dto.DocumentCode);
        Assert.True(dto.IsRequired);
    }

    [Fact]
    public void CreateDto_Validation_ValidInput_Passes()
    {
        var dto = new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "SALE_DEED", DocumentName = "Sale Deed",
            Description = "Desc", AssetCategoryId = 1, AssetTypeId = 2,
            IsRequired = true, DisplayOrder = 1, IsActive = true
        };
        var results = new List<SystemValidationResult>();
        Assert.True(Validator.TryValidateObject(dto, new ValidationContext(dto), results, true));
    }

    [Fact]
    public void CreateDto_Validation_MissingDocumentCode_Fails()
    {
        var dto = new CreateAssetDocumentDefinitionDto { DocumentCode = "", DocumentName = "X" };
        var results = new List<SystemValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, true);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.DocumentCode)));
    }

    [Fact]
    public void CreateDto_Validation_InvalidDocumentCodeChars_Fails()
    {
        var dto = new CreateAssetDocumentDefinitionDto { DocumentCode = "SALE DEED!", DocumentName = "X" };
        var results = new List<SystemValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, true);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.DocumentCode)));
    }

    [Fact]
    public void CreateDto_Validation_MissingDocumentName_Fails()
    {
        var dto = new CreateAssetDocumentDefinitionDto { DocumentCode = "X", DocumentName = "" };
        var results = new List<SystemValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, true);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.DocumentName)));
    }

    [Fact]
    public void UpdateDto_And_QueryParameters_Properties_WorkCorrectly()
    {
        var upd = new UpdateAssetDocumentDefinitionDto
        {
            DocumentCode = "SALE-DEED", DocumentName = "Updated",
            Description = "Desc2", AssetCategoryId = 1, AssetTypeId = 2,
            IsRequired = false, DisplayOrder = 2, IsActive = true, UpdatedBy = 99
        };
        Assert.Equal("SALE-DEED", upd.DocumentCode);
        Assert.Equal(99, upd.UpdatedBy);

        var qp = new AssetDocumentDefinitionQueryParameters
        {
            DocumentCode = "X", DocumentName = "Y", Description = "D",
            DisplayOrder = 1, AssetCategoryId = 1, AssetTypeId = 2,
            IsRequired = true, MarkedForDeletion = false, IsActive = true,
            SearchTerm = "deed", PageNumber = 2, PageSize = 25
        };
        Assert.Equal("X", qp.DocumentCode);
        Assert.Equal(2, qp.PageNumber);
    }

    // --------------- Mapping ---------------

    [Fact]
    public void Mapper_EntityToDto_WithNavigation_MapsNames()
    {
        var entity = new AssetDocumentDefinitionEntity
        {
            Id = 1, DocumentCode = "DEED", DocumentName = "Deed",
            AssetCategoryId = 1, AssetTypeId = 2,
            AssetCategory = new AssetCategoryEntity { Id = 1, CategoryName = "Buildings" },
            AssetType = new AssetTypeEntity { Id = 2, TypeName = "Commercial" },
            IsRequired = true, DisplayOrder = 5
        };
        var dto = _mapper.Map<AssetDocumentDefinitionDto>(entity);
        Assert.Equal("Buildings", dto.AssetCategoryName);
        Assert.Equal("Commercial", dto.AssetTypeName);
        Assert.True(dto.IsRequired);
        Assert.Equal(5, dto.DisplayOrder);
    }

    [Fact]
    public void Mapper_EntityToDto_NullNavigation_ReturnsNullNames()
    {
        var entity = new AssetDocumentDefinitionEntity
        {
            Id = 1, DocumentCode = "DEED", DocumentName = "Deed",
            AssetCategory = null, AssetType = null
        };
        var dto = _mapper.Map<AssetDocumentDefinitionDto>(entity);
        Assert.Null(dto.AssetCategoryName);
        Assert.Null(dto.AssetTypeName);
    }

    [Fact]
    public void Mapper_CreateAndUpdateDto_ToEntity_MapsCorrectly()
    {
        var createDto = new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "DEED", DocumentName = "Deed",
            AssetCategoryId = 1, AssetTypeId = 2, Description = "D",
            IsRequired = true, DisplayOrder = 3, CreatedBy = 10
        };
        var entity = _mapper.Map<AssetDocumentDefinitionEntity>(createDto);
        Assert.Equal("DEED", entity.DocumentCode);
        Assert.Equal(1, entity.AssetCategoryId);

        var updateDto = new UpdateAssetDocumentDefinitionDto
        {
            DocumentCode = "DEED_V2", DocumentName = "Deed V2", UpdatedBy = 99
        };
        var upEntity = _mapper.Map<AssetDocumentDefinitionEntity>(updateDto);
        Assert.Equal("DEED_V2", upEntity.DocumentCode);
    }

    // --------------- GetAllAsync ---------------

    [Fact]
    public async Task GetAllAsync_ReturnsFilteredPagedResult()
    {
        var list = new List<AssetDocumentDefinitionEntity>
        {
            new() { Id = 1, DocumentCode = "SALE_DEED", DocumentName = "Sale Deed", AssetCategoryId = 1, AssetTypeId = 1, IsActive = true },
            new() { Id = 2, DocumentCode = "NOC", DocumentName = "NOC", AssetCategoryId = 2, IsActive = false }
        };
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(list.BuildMockDbSet().Object);

        var service = CreateService();
        var result = await service.GetAllAsync(new AssetDocumentDefinitionQueryParameters
        {
            SearchTerm = "DEED", DocumentCode = "SALE_DEED", DocumentName = "Sale",
            AssetCategoryId = 1, AssetTypeId = 1, IsActive = true
        }, CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetAllAsync_EmptyRepository_ReturnsEmpty()
    {
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity>().BuildMockDbSet().Object);

        var service = CreateService();
        var result = await service.GetAllAsync(new AssetDocumentDefinitionQueryParameters(), CancellationToken.None);

        Assert.Equal(0, result.TotalCount);
    }

    // --------------- GetByIdAsync ---------------

    [Fact]
    public async Task GetByIdAsync_Existing_WithNavigation_ReturnsDto()
    {
        var entity = new AssetDocumentDefinitionEntity
        {
            Id = 1, DocumentCode = "DEED", DocumentName = "Deed",
            AssetCategoryId = 1, AssetTypeId = 2,
            AssetCategory = new AssetCategoryEntity { Id = 1, CategoryName = "Buildings" },
            AssetType = new AssetTypeEntity { Id = 2, TypeName = "Commercial" },
            IsActive = true
        };
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(new List<AssetDocumentDefinitionEntity> { entity }.BuildMockDbSet().Object);

        var result = await CreateService().GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("DEED", result!.DocumentCode);
        Assert.Equal("Buildings", result.AssetCategoryName);
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity>().BuildMockDbSet().Object);

        var result = await CreateService().GetByIdAsync(999, CancellationToken.None);
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_NullNavigation_ReturnsNullNames()
    {
        var entity = new AssetDocumentDefinitionEntity
        {
            Id = 1, DocumentCode = "DEED", DocumentName = "Deed",
            AssetCategory = null, AssetType = null
        };
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(new List<AssetDocumentDefinitionEntity> { entity }.BuildMockDbSet().Object);

        var result = await CreateService().GetByIdAsync(1, CancellationToken.None);

        Assert.Null(result!.AssetCategoryName);
        Assert.Null(result.AssetTypeName);
    }

    // --------------- CreateAsync ---------------

    [Fact]
    public async Task CreateAsync_NoCategoryNoType_ReturnsDto()
    {
        var empty = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.SetupSequence(r => r.GetQueryable())
            .Returns(empty.BuildMockDbSet().Object)
            .Returns(empty.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity e, CancellationToken _) => { e.Id = 1; return e; });

        var result = await CreateService().CreateAsync(
            new CreateAssetDocumentDefinitionDto { DocumentCode = "NOC", DocumentName = "NOC" },
            CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateAsync_WithValidCategoryAndType_ReturnsDto()
    {
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetTypeEntity> { new() { Id = 2, AssetCategoryId = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);

        var empty = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.SetupSequence(r => r.GetQueryable())
            .Returns(empty.BuildMockDbSet().Object)
            .Returns(empty.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity e, CancellationToken _) => { e.Id = 1; return e; });

        var result = await CreateService().CreateAsync(new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "DEED", DocumentName = "Deed", AssetCategoryId = 1, AssetTypeId = 2,
            Description = "A deed", IsRequired = true, DisplayOrder = 1
        }, CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateAsync_CategoryOnly_NoType_ReturnsDto()
    {
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);

        var empty = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.SetupSequence(r => r.GetQueryable())
            .Returns(empty.BuildMockDbSet().Object)
            .Returns(empty.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity e, CancellationToken _) => { e.Id = 1; return e; });

        var result = await CreateService().CreateAsync(
            new CreateAssetDocumentDefinitionDto { DocumentCode = "NOC2", DocumentName = "NOC2", AssetCategoryId = 1 },
            CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateAsync_TypeOnlyNoCategory_ValidType_ReturnsDto()
    {
        _typeRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetTypeEntity> { new() { Id = 2, AssetCategoryId = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);

        var empty = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.SetupSequence(r => r.GetQueryable())
            .Returns(empty.BuildMockDbSet().Object)
            .Returns(empty.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity e, CancellationToken _) => { e.Id = 1; return e; });

        var result = await CreateService().CreateAsync(
            new CreateAssetDocumentDefinitionDto { DocumentCode = "TYPE_ONLY", DocumentName = "Type Only", AssetTypeId = 2 },
            CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        var existing = new List<AssetDocumentDefinitionEntity>
            { new() { Id = 1, DocumentCode = "DEED" } };
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(existing.BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().CreateAsync(
                new CreateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Duplicate" },
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvalidCategory_ThrowsValidationException()
    {
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity>().BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity>().BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().CreateAsync(
                new CreateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", AssetCategoryId = 999 },
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvalidType_ThrowsValidationException()
    {
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetTypeEntity>().BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity>().BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().CreateAsync(
                new CreateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", AssetCategoryId = 1, AssetTypeId = 999 },
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_TypeBelongsToDifferentCategory_ThrowsValidationException()
    {
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetTypeEntity> { new() { Id = 2, AssetCategoryId = 5, MarkedForDeletion = false } }.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity>().BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().CreateAsync(
                new CreateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", AssetCategoryId = 1, AssetTypeId = 2 },
                CancellationToken.None));
    }

    // --------------- UpdateAsync ---------------

    [Fact]
    public async Task UpdateAsync_ValidInput_UpdatesSuccessfully()
    {
        var existing = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity> { existing }.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);

        var result = await CreateService().UpdateAsync(1,
            new UpdateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Updated Deed", AssetCategoryId = 1, IsActive = true },
            CancellationToken.None);

        Assert.NotNull(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NotFound_ReturnsNull()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity?)null);

        var result = await CreateService().UpdateAsync(999,
            new UpdateAssetDocumentDefinitionDto { DocumentCode = "X", DocumentName = "Y" },
            CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateCode_ThrowsValidationException()
    {
        var existing = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED", IsActive = true };
        var other = new AssetDocumentDefinitionEntity { Id = 2, DocumentCode = "NOC", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity> { existing, other }.BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().UpdateAsync(1,
                new UpdateAssetDocumentDefinitionDto { DocumentCode = "NOC", DocumentName = "Changed", IsActive = true },
                CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_InvalidCategory_ThrowsValidationException()
    {
        var existing = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity> { existing }.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity>().BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().UpdateAsync(1,
                new UpdateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", AssetCategoryId = 99, IsActive = true },
                CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_InvalidType_ThrowsValidationException()
    {
        var existing = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity> { existing }.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetTypeEntity>().BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().UpdateAsync(1,
                new UpdateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", AssetCategoryId = 1, AssetTypeId = 99, IsActive = true },
                CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_TypeBelongsToDifferentCategory_ThrowsValidationException()
    {
        var existing = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity> { existing }.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetTypeEntity> { new() { Id = 3, AssetCategoryId = 5, MarkedForDeletion = false } }.BuildMockDbSet().Object);

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().UpdateAsync(1,
                new UpdateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", AssetCategoryId = 1, AssetTypeId = 3, IsActive = true },
                CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_Deactivation_WithReferences_ThrowsValidationException()
    {
        var existing = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _referenceValidatorMock
            .Setup(x => x.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Id", "In use"));

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().UpdateAsync(1,
                new UpdateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", IsActive = false },
                CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_Deactivation_NoReferences_Succeeds()
    {
        var existing = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<AssetDocumentDefinitionEntity> { existing }.BuildMockDbSet().Object);
        _referenceValidatorMock
            .Setup(x => x.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        await CreateService().UpdateAsync(1,
            new UpdateAssetDocumentDefinitionDto { DocumentCode = "DEED", DocumentName = "Deed", IsActive = false },
            CancellationToken.None);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    // --------------- DeleteAsync ---------------

    [Fact]
    public async Task DeleteAsync_Existing_ReturnsTrue()
    {
        var entity = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await CreateService().DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NotFound_ReturnsFalse()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity?)null);

        var result = await CreateService().DeleteAsync(999, CancellationToken.None);
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_WithActiveReferences_ThrowsValidationException()
    {
        var entity = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "DEED" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _referenceValidatorMock
            .Setup(x => x.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Id", "Referenced by Asset Documents"));

        await Assert.ThrowsAsync<AppValidationException>(() =>
            CreateService().DeleteAsync(1, CancellationToken.None));
    }
}
