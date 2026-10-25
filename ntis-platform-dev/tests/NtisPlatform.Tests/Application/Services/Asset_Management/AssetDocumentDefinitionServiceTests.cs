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

namespace NtisPlatform.Tests.Application;

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
        {
            cfg.AddProfile<AssetDocumentDefinitionMappingProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _referenceValidatorMock
            .Setup(x => x.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(It.IsAny<int>(), It.IsAny<ReferenceValidationOperation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());
    }

    private AssetDocumentDefinitionService CreateService() =>
        new(_repositoryMock.Object, _categoryRepoMock.Object, _typeRepoMock.Object, _unitOfWorkMock.Object, _mapper, _referenceValidatorMock.Object);

    #region Entity & DTO Property Coverage

    [Fact]
    public void EntityAndDtos_Properties_GetSet_WorksCorrectly()
    {
        var now = DateTime.Now;
        var entity = new AssetDocumentDefinitionEntity
        {
            Id = 1,
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt",
            Description = "Property tax payment receipt",
            DisplayOrder = 1,
            AssetCategoryId = 2,
            AssetTypeId = 3,
            IsActive = true,
            CreatedBy = 1,
            CreatedDate = now,
            UpdatedBy = 2,
            UpdatedDate = now,
            MarkedForDeletion = false,
            MarkedForDeletionDate = null
        };

        Assert.Equal(1, entity.Id);
        Assert.Equal("TAX_RECEIPT", entity.DocumentCode);
        Assert.Equal("Tax Receipt", entity.DocumentName);
        Assert.Equal("Property tax payment receipt", entity.Description);
        Assert.Equal(2, entity.AssetCategoryId);
        Assert.Equal(3, entity.AssetTypeId);

        var dto = new AssetDocumentDefinitionDto
        {
            Id = 1,
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt",
            Description = "Property tax payment receipt",
            AssetCategoryId = 2,
            AssetTypeId = 3,
            IsActive = true,
            CreatedDate = now
        };

        Assert.Equal(1, dto.Id);

        var updateDto = new UpdateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Updated Tax Receipt",
            Description = "Updated description",
            AssetCategoryId = 2,
            AssetTypeId = 3,
            IsActive = true
        };

        Assert.Equal("Updated Tax Receipt", updateDto.DocumentName);

        var qp = new AssetDocumentDefinitionQueryParameters
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax",
            AssetCategoryId = 2,
            AssetTypeId = 3,
            SearchTerm = "Receipt",
            IsActive = true,
            PageNumber = 1,
            PageSize = 10
        };

        Assert.Equal("TAX_RECEIPT", qp.DocumentCode);
        Assert.Equal("Tax", qp.DocumentName);
        Assert.Equal(2, qp.AssetCategoryId);
        Assert.Equal(3, qp.AssetTypeId);
        Assert.Equal("Receipt", qp.SearchTerm);
    }

    [Fact]
    public void CreateDto_Validation_Passes()
    {
        var dto = new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt",
            Description = "Property tax receipt",
            AssetCategoryId = 2,
            AssetTypeId = 3,
            IsActive = true,
            DisplayOrder = 1
        };

        var results = new List<SystemValidationResult>();
        var isValid = Validator.TryValidateObject(dto, new ValidationContext(dto), results, true);
        Assert.True(isValid);
    }

    #endregion

    #region Service Operations

    [Fact]
    public async Task GetAllAsync_ReturnsPagedResult()
    {
        var list = new List<AssetDocumentDefinitionEntity>
        {
            new()
            {
                Id = 1,
                DocumentCode = "TAX_RECEIPT",
                DocumentName = "Tax Receipt",
                AssetCategoryId = 1,
                AssetTypeId = 1,
                IsActive = true
            }
        };
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(list.BuildMockDbSet().Object);

        var service = CreateService();
        var qp = new AssetDocumentDefinitionQueryParameters { SearchTerm = "TAX", DocumentCode = "TAX_RECEIPT", DocumentName = "Tax", AssetCategoryId = 1, AssetTypeId = 1 };

        var result = await service.GetAllAsync(qp, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
    }

    [Fact]
    public async Task GetByIdAsync_Existing_ReturnsDto()
    {
        var entity = new AssetDocumentDefinitionEntity
        {
            Id = 1,
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt",
            IsActive = true
        };

        var list = new List<AssetDocumentDefinitionEntity> { entity };

        _repositoryMock
            .Setup(r => r.GetQueryable())
            .Returns(list.BuildMockDbSet().Object);

        var service = CreateService();

        var result = await service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("TAX_RECEIPT", result.DocumentCode);
    }

    [Fact]
    public async Task CreateAsync_ValidInput_ReturnsDto()
    {
        var categories = new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } };
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(categories.BuildMockDbSet().Object);

        var types = new List<AssetTypeEntity> { new() { Id = 1, AssetCategoryId = 1, MarkedForDeletion = false } };
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(types.BuildMockDbSet().Object);

        var existingList = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(existingList.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity entity, CancellationToken _) =>
            {
                // Simulate the saved row (with its joined category/type) being visible to the post-save re-read.
                entity.Id = 1;
                existingList.Add(new AssetDocumentDefinitionEntity
                {
                    Id = 1,
                    DocumentCode = entity.DocumentCode,
                    DocumentName = entity.DocumentName,
                    AssetCategoryId = 1,
                    AssetTypeId = 1,
                    AssetCategory = new AssetCategoryEntity { Id = 1, CategoryName = "Land" },
                    AssetType = new AssetTypeEntity { Id = 1, TypeName = "Open Plot" }
                });
                return entity;
            });

        var service = CreateService();
        var dto = new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt Document",
            AssetCategoryId = 1,
            AssetTypeId = 1
        };

        var result = await service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("TAX_RECEIPT", result.DocumentCode);
        Assert.Equal("Land", result.AssetCategoryName);
        Assert.Equal("Open Plot", result.AssetTypeName);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        var existingList = new List<AssetDocumentDefinitionEntity>
        {
            new() { Id = 1, DocumentCode = "TAX_RECEIPT", MarkedForDeletion = false }
        };
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(existingList.BuildMockDbSet().Object);

        var service = CreateService();
        var dto = new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt Document"
        };

        await Assert.ThrowsAsync<AppValidationException>(() => service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvalidCategory_ThrowsValidationException()
    {
        var existingList = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(existingList.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>().BuildMockDbSet().Object);

        var service = CreateService();
        var dto = new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt Document",
            AssetCategoryId = 99
        };

        await Assert.ThrowsAsync<AppValidationException>(() => service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvalidType_ThrowsValidationException()
    {
        var existingList = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(existingList.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity> { new() { Id = 1 } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity>().BuildMockDbSet().Object);

        var service = CreateService();
        var dto = new CreateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Tax Receipt Document",
            AssetCategoryId = 1,
            AssetTypeId = 99
        };

        await Assert.ThrowsAsync<AppValidationException>(() => service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ValidInput_UpdatesSuccessfully()
    {
        var existingEntity = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "TAX_RECEIPT", DocumentName = "Old", IsActive = true };
        var list = new List<AssetDocumentDefinitionEntity> { existingEntity };

        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(list.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.UpdateAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var categories = new List<AssetCategoryEntity> { new() { Id = 1, MarkedForDeletion = false } };
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(categories.BuildMockDbSet().Object);

        var service = CreateService();
        var updateDto = new UpdateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Updated Tax Receipt",
            AssetCategoryId = 1,
            IsActive = true
        };

        var result = await service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Updated Tax Receipt", result.DocumentName);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsReloadedDto_WithCategoryAndTypeNames()
    {
        // FindAsync-style entity: no navigations loaded, as in a real request.
        var tracked = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "TAX_RECEIPT", DocumentName = "Old", AssetCategoryId = 1, AssetTypeId = 1, IsActive = true };
        // What the post-save re-read (GetByIdAsync with Include) returns.
        var reloaded = new AssetDocumentDefinitionEntity
        {
            Id = 1,
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Updated Tax Receipt",
            AssetCategoryId = 2,
            AssetTypeId = 3,
            IsActive = true,
            AssetCategory = new AssetCategoryEntity { Id = 2, CategoryName = "Building" },
            AssetType = new AssetTypeEntity { Id = 3, TypeName = "Office Building" }
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(tracked);
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(new List<AssetDocumentDefinitionEntity> { reloaded }.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity> { new() { Id = 2 } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity> { new() { Id = 3, AssetCategoryId = 2 } }.BuildMockDbSet().Object);

        var service = CreateService();
        var updateDto = new UpdateAssetDocumentDefinitionDto
        {
            DocumentCode = "TAX_RECEIPT",
            DocumentName = "Updated Tax Receipt",
            AssetCategoryId = 2,
            AssetTypeId = 3,
            IsActive = true
        };

        var result = await service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Updated Tax Receipt", result.DocumentName);
        Assert.Equal("Building", result.AssetCategoryName);
        Assert.Equal("Office Building", result.AssetTypeName);
    }

    [Fact]
    public async Task CreateAsync_TypeBelongsToAnotherCategory_ThrowsValidationException()
    {
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(new List<AssetDocumentDefinitionEntity>().BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity> { new() { Id = 1 }, new() { Id = 2 } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity> { new() { Id = 5, AssetCategoryId = 2 } }.BuildMockDbSet().Object);

        var service = CreateService();
        var dto = new CreateAssetDocumentDefinitionDto { DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", AssetCategoryId = 1, AssetTypeId = 5 };

        var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.CreateAsync(dto, CancellationToken.None));

        Assert.Equal("AssetDocumentDefinition_AssetTypeId_Invalid", ex.Errors[nameof(AssetDocumentDefinitionEntity.AssetTypeId)]);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_TypeWithoutCategory_Succeeds()
    {
        var existingList = new List<AssetDocumentDefinitionEntity>();
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(existingList.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity> { new() { Id = 5, AssetCategoryId = 2 } }.BuildMockDbSet().Object);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetDocumentDefinitionEntity entity, CancellationToken _) => { entity.Id = 1; return entity; });

        var service = CreateService();
        var dto = new CreateAssetDocumentDefinitionDto { DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", AssetTypeId = 5 };

        var result = await service.CreateAsync(dto, CancellationToken.None);

        Assert.Equal(5, result.AssetTypeId);
        Assert.Null(result.AssetCategoryId);
    }

    [Fact]
    public async Task UpdateAsync_TypeBelongsToAnotherCategory_ThrowsValidationException()
    {
        var tracked = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", AssetCategoryId = 1, AssetTypeId = 4, IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(tracked);
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(new List<AssetDocumentDefinitionEntity> { tracked }.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity> { new() { Id = 1 }, new() { Id = 2 } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity> { new() { Id = 4, AssetCategoryId = 1 }, new() { Id = 5, AssetCategoryId = 2 } }.BuildMockDbSet().Object);

        var service = CreateService();
        var updateDto = new UpdateAssetDocumentDefinitionDto { DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", AssetCategoryId = 1, AssetTypeId = 5, IsActive = true };

        var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Equal("AssetDocumentDefinition_AssetTypeId_Invalid", ex.Errors[nameof(AssetDocumentDefinitionEntity.AssetTypeId)]);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DeactivateWhileReferenced_ThrowsValidationException()
    {
        var tracked = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(tracked);
        _referenceValidatorMock
            .Setup(x => x.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Referenced by Asset Document"));

        var service = CreateService();
        var updateDto = new UpdateAssetDocumentDefinitionDto { DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", IsActive = false };

        await Assert.ThrowsAsync<AppValidationException>(() => service.UpdateAsync(1, updateDto, CancellationToken.None));

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_WhileReferenced_ThrowsValidationException()
    {
        var existingEntity = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "TAX_RECEIPT", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _referenceValidatorMock
            .Setup(x => x.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Referenced by Asset Document"));

        var service = CreateService();

        await Assert.ThrowsAsync<AppValidationException>(() => service.DeleteAsync(1, CancellationToken.None));

        _repositoryMock.Verify(r => r.DeleteAsync(It.IsAny<AssetDocumentDefinitionEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_UnknownId_ReturnsFalse()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((AssetDocumentDefinitionEntity?)null);

        var service = CreateService();
        var result = await service.DeleteAsync(99, CancellationToken.None);

        Assert.False(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_UnknownId_ReturnsNullWithoutSaving()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((AssetDocumentDefinitionEntity?)null);

        var service = CreateService();
        var result = await service.UpdateAsync(99, new UpdateAssetDocumentDefinitionDto { DocumentCode = "X", DocumentName = "X" }, CancellationToken.None);

        Assert.Null(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        _repositoryMock.Verify(r => r.GetQueryable(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateCode_ThrowsValidationException()
    {
        var tracked = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", IsActive = true };
        var other = new AssetDocumentDefinitionEntity { Id = 2, DocumentCode = "SALE_DEED", DocumentName = "Sale Deed", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(tracked);
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(new List<AssetDocumentDefinitionEntity> { tracked, other }.BuildMockDbSet().Object);

        var service = CreateService();
        var updateDto = new UpdateAssetDocumentDefinitionDto { DocumentCode = "SALE_DEED", DocumentName = "Tax Receipt", IsActive = true };

        var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Equal("Document Code 'SALE_DEED' already exists.", ex.Errors[nameof(AssetDocumentDefinitionEntity.DocumentCode)]);
        Assert.False(ex.Errors.ContainsKey(nameof(AssetDocumentDefinitionEntity.DocumentName)));
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateNameWithinSameCategoryAndType_ThrowsValidationException()
    {
        var tracked = new AssetDocumentDefinitionEntity { Id = 1, AssetCategoryId = 1, AssetTypeId = 10, DocumentCode = "TAX_RECEIPT", DocumentName = "Tax Receipt", IsActive = true };
        var other = new AssetDocumentDefinitionEntity { Id = 2, AssetCategoryId = 1, AssetTypeId = 10, DocumentCode = "SALE_DEED", DocumentName = "Sale Deed", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(tracked);
        _repositoryMock.Setup(r => r.GetQueryable()).Returns(new List<AssetDocumentDefinitionEntity> { tracked, other }.BuildMockDbSet().Object);
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity> { new() { Id = 1 } }.BuildMockDbSet().Object);
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity> { new() { Id = 10, AssetCategoryId = 1 } }.BuildMockDbSet().Object);

        var service = CreateService();
        var updateDto = new UpdateAssetDocumentDefinitionDto { AssetCategoryId = 1, AssetTypeId = 10, DocumentCode = "TAX_RECEIPT", DocumentName = "Sale Deed", IsActive = true };

        var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Equal("Document Name 'Sale Deed' already exists for the selected Asset Category and Asset Type.", ex.Errors[nameof(AssetDocumentDefinitionEntity.DocumentName)]);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_Valid_DeletesSuccessfully()
    {
        var existingEntity = new AssetDocumentDefinitionEntity { Id = 1, DocumentCode = "TAX_RECEIPT", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        var service = CreateService();
        var result = await service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
    #endregion
}
