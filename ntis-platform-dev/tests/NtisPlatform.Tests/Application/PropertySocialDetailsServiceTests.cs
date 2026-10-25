using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using MockQueryable;
using MockQueryable.Moq;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Property;
using NtisPlatform.Application.Mappings;
using Xunit;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Unit tests for PropertySocialDetailsService
/// </summary>
public class PropertySocialDetailsServiceTests
{
    private readonly Mock<IRepository<PropertySocialDetailsEntity, int>> _mockRepository;
    private readonly Mock<IPropertySocialDetailsRepository> _mockSocialDetailsRepository;
    private readonly Mock<IDocumentApplicationService> _mockDocumentApplicationService;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly IMapper _mapper;
    private readonly PropertySocialDetailsService _service;

    public PropertySocialDetailsServiceTests()
    {
        _mockRepository = new Mock<IRepository<PropertySocialDetailsEntity, int>>();
        _mockSocialDetailsRepository = new Mock<IPropertySocialDetailsRepository>();
        _mockDocumentApplicationService = new Mock<IDocumentApplicationService>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PropertySocialDetailsMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        // Delegate unmocked mapping calls to real AutoMapper
        _mockMapper.Setup(m => m.Map<PropertySocialDetailsDto>(It.IsAny<object>()))
            .Returns((object src) => _mapper.Map<PropertySocialDetailsDto>(src));
        _mockMapper.Setup(m => m.Map<List<PropertySocialDetailsDto>>(It.IsAny<object>()))
            .Returns((object src) => _mapper.Map<List<PropertySocialDetailsDto>>(src));
        _mockMapper.Setup(m => m.Map<List<AppliedSocialAttributeDto>>(It.IsAny<object>()))
            .Returns((object src) => _mapper.Map<List<AppliedSocialAttributeDto>>(src));
        _mockMapper.Setup(m => m.Map<List<NonAppliedSocialAttributeDto>>(It.IsAny<object>()))
            .Returns((object src) => _mapper.Map<List<NonAppliedSocialAttributeDto>>(src));
        _mockMapper.Setup(m => m.Map<SocialAttributeHierarchyDto>(It.IsAny<object>()))
            .Returns((object src) => _mapper.Map<SocialAttributeHierarchyDto>(src));
        _mockMapper.Setup(m => m.Map<PropertySocialDetailsEntity>(It.IsAny<CreatePropertySocialDetailsDto>()))
            .Returns((CreatePropertySocialDetailsDto src) => _mapper.Map<PropertySocialDetailsEntity>(src));
        _mockMapper.Setup(m => m.Map<PropertySocialDetailsEntity>(It.IsAny<UpdatePropertySocialDetailsDto>()))
            .Returns((UpdatePropertySocialDetailsDto src) => _mapper.Map<PropertySocialDetailsEntity>(src));
        _mockMapper.Setup(m => m.Map(It.IsAny<object>(), It.IsAny<object>()))
            .Callback<object, object>((src, dest) => _mapper.Map(src, dest));

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PropertySocialDetailsEntity, CancellationToken>((e, ct) => { if (e.Id == 0) e.Id = 1; });

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity>().BuildMock());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Set up empty document binding list so EnrichDtosAsync does not fail
        _mockDocumentApplicationService
            .Setup(d => d.GetDocumentsByReferenceTableAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<int>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<DocumentBindingInfoDto>());

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SocialAttributeEntity>());

        _service = new PropertySocialDetailsService(
            _mockRepository.Object,
            _mockSocialDetailsRepository.Object,
            _mockDocumentApplicationService.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object
        );
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_WithExistingId_ReturnsDto()
    {
        // Arrange
        var entityId = 1;
        var entity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IntValue = 10,
            DecimalValue = 100.50m,
            TextValue = "Test Value",
            DateValue = DateTime.Now,
            Remark = "Test Remark",
            IsActive = true
        };

        var dto = new PropertySocialDetailsDto
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IntValue = 10,
            DecimalValue = 100.50m,
            TextValue = "Test Value",
            DateValue = entity.DateValue,
            Remark = "Test Remark",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<PropertySocialDetailsDto>(It.IsAny<PropertySocialDetailsEntity>()))
            .Returns(dto);
        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SocialAttributeEntity>
            {
                new() { Id = 5, SocialAttributeCode = "HAS_FAMILY_PLANNING", IsActive = true, IsDiscountApplicable = false }
            });

        // Act
        var result = await _service.GetByIdAsync(entityId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.Id, result.Id);
        Assert.Equal(dto.PropertyId, result.PropertyId);
        Assert.Equal(dto.SocialAttributeId, result.SocialAttributeId);
        Assert.Equal(dto.BitValue, result.BitValue);
        Assert.Equal(dto.TextValue, result.TextValue);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var nonExistentId = 999;
        _mockRepository.Setup(r => r.GetByIdAsync(nonExistentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertySocialDetailsEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(nonExistentId, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_WithValidDto_ReturnsCreatedDto()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IntValue = 10,
            DecimalValue = 50.25m,
            TextValue = "New Value",
            DateValue = DateTime.Now,
            Remark = "New Remark",
            IsActive = true
        };

        var entity = new PropertySocialDetailsEntity
        {
            Id = 1,
            PropertyId = createDto.PropertyId,
            SocialAttributeId = createDto.SocialAttributeId,
            BitValue = createDto.BitValue,
            IntValue = createDto.IntValue,
            DecimalValue = createDto.DecimalValue,
            TextValue = createDto.TextValue,
            DateValue = createDto.DateValue,
            Remark = createDto.Remark,
            IsActive = createDto.IsActive
        };

        var dto = new PropertySocialDetailsDto
        {
            Id = 1,
            PropertyId = createDto.PropertyId,
            SocialAttributeId = createDto.SocialAttributeId,
            BitValue = createDto.BitValue,
            IntValue = createDto.IntValue,
            DecimalValue = createDto.DecimalValue,
            TextValue = createDto.TextValue,
            DateValue = createDto.DateValue,
            Remark = createDto.Remark,
            IsActive = createDto.IsActive
        };

        _mockMapper.Setup(m => m.Map<PropertySocialDetailsEntity>(It.IsAny<CreatePropertySocialDetailsDto>()))
            .Returns(entity);
        _mockMapper.Setup(m => m.Map<PropertySocialDetailsDto>(It.IsAny<PropertySocialDetailsEntity>()))
            .Returns(dto);
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.PropertyId, result.PropertyId);
        Assert.Equal(dto.SocialAttributeId, result.SocialAttributeId);
        Assert.Equal(dto.TextValue, result.TextValue);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithNullableValues_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = null,
            IntValue = null,
            DecimalValue = null,
            TextValue = null,
            DateValue = null,
            Remark = null,
            IsActive = true
        };

        var entity = new PropertySocialDetailsEntity
        {
            Id = 1,
            PropertyId = createDto.PropertyId,
            SocialAttributeId = createDto.SocialAttributeId,
            IsActive = true
        };

        var dto = new PropertySocialDetailsDto
        {
            Id = 1,
            PropertyId = createDto.PropertyId,
            SocialAttributeId = createDto.SocialAttributeId,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<PropertySocialDetailsEntity>(It.IsAny<CreatePropertySocialDetailsDto>()))
            .Returns(entity);
        _mockMapper.Setup(m => m.Map<PropertySocialDetailsDto>(It.IsAny<PropertySocialDetailsEntity>()))
            .Returns(dto);
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.PropertyId, result.PropertyId);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_WithExistingEntity_ReturnsUpdatedDto()
    {
        // Arrange
        var entityId = 1;
        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = false,
            IntValue = 20,
            DecimalValue = 75.50m,
            TextValue = "Updated Value",
            DateValue = DateTime.Now.AddDays(1),
            Remark = "Updated Remark",
            IsActive = true
        };

        var existingEntity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IntValue = 10,
            TextValue = "Old Value",
            IsActive = true
        };

        var updatedDto = new PropertySocialDetailsDto
        {
            Id = entityId,
            PropertyId = updateDto.PropertyId,
            SocialAttributeId = updateDto.SocialAttributeId,
            BitValue = updateDto.BitValue,
            IntValue = updateDto.IntValue,
            DecimalValue = updateDto.DecimalValue,
            TextValue = updateDto.TextValue,
            DateValue = updateDto.DateValue,
            Remark = updateDto.Remark,
            IsActive = updateDto.IsActive
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);
        _mockMapper.Setup(m => m.Map(It.IsAny<UpdatePropertySocialDetailsDto>(), It.IsAny<PropertySocialDetailsEntity>()))
            .Returns(existingEntity);
        _mockMapper.Setup(m => m.Map<PropertySocialDetailsDto>(It.IsAny<PropertySocialDetailsEntity>()))
            .Returns(updatedDto);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateAsync(entityId, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(updatedDto.TextValue, result.TextValue);
        Assert.Equal(updatedDto.BitValue, result.BitValue);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var nonExistentId = 999;
        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5
        };

        _mockRepository.Setup(r => r.GetByIdAsync(nonExistentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertySocialDetailsEntity?)null);

        // Act
        var result = await _service.UpdateAsync(nonExistentId, updateDto, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_WithExistingEntity_ReturnsTrue()
    {
        // Arrange
        var entityId = 1;
        var entity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 42,
            IsActive = true
        };

        var dummyBindings = new List<DocumentBindingInfoDto>
        {
            new() { BindingId = 42, ReferenceTableId = entityId, DocumentGuid = Guid.NewGuid(), BindingPurpose = "Document" }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                It.IsAny<IReadOnlyList<int>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(dummyBindings);
        _mockDocumentApplicationService.Setup(d => d.DeactivateDocumentBindingAsync(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(entityId, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.Equal(42, entity.DocumentBindingId); // DocumentBindingId should NOT be nullified
        Assert.Null(entity.BitValue); // Remains default (null)
        Assert.True(entity.MarkedForDeletion);
        Assert.NotNull(entity.MarkedForDeletionDate);
        Assert.True(entity.IsActive); // Make sure IsActive remains true

        _mockRepository.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(42, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithNonExistentEntity_ReturnsFalse()
    {
        // Arrange
        var nonExistentId = 999;

        _mockRepository.Setup(r => r.GetByIdAsync(nonExistentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertySocialDetailsEntity?)null);

        // Act
        var result = await _service.DeleteAsync(nonExistentId, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteByPropertyAndAttributeAsync_WithExistingEntity_ReturnsTrueAndDoesNotClearDetailValues()
    {
        // Arrange
        var propertyId = 100;
        var socialAttributeId = 5;
        var entity = new PropertySocialDetailsEntity
        {
            Id = 1,
            PropertyId = propertyId,
            SocialAttributeId = socialAttributeId,
            DocumentBindingId = 42,
            BitValue = true,
            Remark = "Test remark",
            IntValue = 10,
            DecimalValue = 10.5m,
            TextValue = "some text",
            DateValue = DateTime.Now,
            IsActive = true
        };

        var dummyBindings = new List<DocumentBindingInfoDto>
        {
            new() { BindingId = 42, ReferenceTableId = 1, DocumentGuid = Guid.NewGuid(), BindingPurpose = "Document" }
        };

        var entities = new List<PropertySocialDetailsEntity> { entity }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                It.IsAny<IReadOnlyList<int>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(dummyBindings);
        _mockDocumentApplicationService.Setup(d => d.DeactivateDocumentBindingAsync(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteByPropertyAndAttributeAsync(propertyId, socialAttributeId, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.Equal(42, entity.DocumentBindingId); // DocumentBindingId should NOT be nullified
        Assert.True(entity.BitValue); // BitValue should not be cleared/set to false
        Assert.Equal("Test remark", entity.Remark);
        Assert.Equal(10, entity.IntValue);
        Assert.Equal(10.5m, entity.DecimalValue);
        Assert.Equal("some text", entity.TextValue);
        Assert.NotNull(entity.DateValue);
        Assert.True(entity.MarkedForDeletion);
        Assert.NotNull(entity.MarkedForDeletionDate);
        Assert.True(entity.IsActive); // Make sure IsActive remains true

        _mockRepository.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(42, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteByPropertyAndAttributeAsync_WithNonExistentEntity_ReturnsFalse()
    {
        // Arrange
        var propertyId = 999;
        var socialAttributeId = 999;
        var entities = new List<PropertySocialDetailsEntity>().BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);

        // Act
        var result = await _service.DeleteByPropertyAndAttributeAsync(propertyId, socialAttributeId, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_ApartmentLevel_DeactivatesBindingWhenNoOtherRowsShareIt()
    {
        // Arrange
        var entity = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "Society",
            SocietyDetailId = 10,
            WingDetailId = null,
            PropertyId = null,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { entity }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "Society",
            SocialAttributeId = 5,
            SocietyDetailsId = 10
        };

        // Act
        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        // Assert
        Assert.Equal(1, deletedCount);
        Assert.False(entity.IsActive);
        Assert.True(entity.MarkedForDeletion);
        Assert.NotNull(entity.MarkedForDeletionDate);

        _mockRepository.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(99, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_WithoutBindingId_UsesBindingReferenceForSelectedRow()
    {
        var entity = new PropertySocialDetailsEntity
        {
            Id = 11,
            EntityType = "S",
            SocietyDetailId = 10,
            SocialAttributeId = 5,
            DocumentBindingId = null,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { entity }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockDocumentApplicationService
            .Setup(d => d.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                It.Is<IReadOnlyList<int>>(ids => ids.Count == 1 && ids[0] == 11),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new DocumentBindingInfoDto
                {
                    ReferenceTableId = 11,
                    BindingId = 99,
                    DocumentGuid = Guid.NewGuid()
                }
            });

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "S",
            SocialAttributeId = 5,
            SocietyDetailsId = 10
        };

        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        Assert.Equal(1, deletedCount);
        Assert.True(entity.MarkedForDeletion);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(
            99, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_NonPropertyScope_DeactivatesBindingWithoutSharedBindingCheck()
    {
        var societyEntity = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "Society",
            SocietyDetailId = 10,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };
        var propertyEntity = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "Unit",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 101,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { societyEntity, propertyEntity }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "Society",
            SocialAttributeId = 5,
            SocietyDetailsId = 10
        };

        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        Assert.Equal(1, deletedCount);
        Assert.True(societyEntity.MarkedForDeletion);
        Assert.True(propertyEntity.IsActive);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(
            99, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_WingLevel_SoftDeletesOnlyMatchingWingEntities()
    {
        // Arrange
        var wingEntity = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "WingLevel",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = null,
            SocialAttributeId = 5,
            IsActive = true,
            MarkedForDeletion = false
        };
        var otherWingEntity = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "Unit",
            SocietyDetailId = 10,
            WingDetailId = 30,
            PropertyId = 101,
            SocialAttributeId = 5,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { wingEntity, otherWingEntity }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "WingLevel",
            SocialAttributeId = 5,
            SocietyDetailsId = 10,
            WingDetailId = 20
        };

        // Act
        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        // Assert
        Assert.Equal(1, deletedCount);
        Assert.False(wingEntity.IsActive);
        Assert.True(wingEntity.MarkedForDeletion);
        Assert.True(otherWingEntity.IsActive);
        Assert.False(otherWingEntity.MarkedForDeletion);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_SinglePropertyIdInCsv_SoftDeletesScopedProperty()
    {
        // Arrange
        var targetProperty = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "Unit",
            WingDetailId = 20,
            PropertyId = 101,
            SocialAttributeId = 5,
            IsActive = true,
            MarkedForDeletion = false
        };
        var otherProperty = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "Unit",
            WingDetailId = 20,
            PropertyId = 102,
            SocialAttributeId = 5,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { targetProperty, otherProperty }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "Unit",
            SocialAttributeId = 5,
            WingDetailId = 20,
            PropertyIds = "101"
        };

        // Act
        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        // Assert
        Assert.Equal(1, deletedCount);
        Assert.False(targetProperty.IsActive);
        Assert.True(targetProperty.MarkedForDeletion);
        Assert.True(otherProperty.IsActive);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_UiEntityType_DoesNotDeleteDifferentEntityTypeInSameWing()
    {
        var wingEntity = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "WingLevel",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = null,
            SocialAttributeId = 5,
            IsActive = true,
            MarkedForDeletion = false
        };
        var propertyEntity = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "Unit",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 101,
            SocialAttributeId = 5,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { wingEntity, propertyEntity }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "WingLevel",
            SocialAttributeId = 5,
            SocietyDetailsId = 10,
            WingDetailId = 20
        };

        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        Assert.Equal(1, deletedCount);
        Assert.True(wingEntity.MarkedForDeletion);
        Assert.False(wingEntity.IsActive);
        Assert.False(propertyEntity.MarkedForDeletion);
        Assert.True(propertyEntity.IsActive);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_PartialPropertyDelete_KeepsSharedDocumentBindingActive()
    {
        var targetProperty = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "Unit",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 101,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };
        var remainingProperty = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "Unit",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 102,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { targetProperty, remainingProperty }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "Unit",
            SocialAttributeId = 5,
            SocietyDetailsId = 10,
            WingDetailId = 20,
            DocumentBindingId = 99,
            PropertyIds = "101"
        };

        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        Assert.Equal(1, deletedCount);
        Assert.True(targetProperty.MarkedForDeletion);
        Assert.True(remainingProperty.IsActive);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(
            99, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_WithoutBindingId_PartialPropertyDeleteKeepsSharedBindingActive()
    {
        var targetProperty = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "P",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 101,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };
        var remainingProperty = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "P",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 102,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { targetProperty, remainingProperty }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "P",
            SocialAttributeId = 5,
            SocietyDetailsId = 10,
            WingDetailId = 20,
            PropertyIds = "101"
        };

        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        Assert.Equal(1, deletedCount);
        Assert.True(targetProperty.MarkedForDeletion);
        Assert.True(remainingProperty.IsActive);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(
            99, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_CommaSeparatedPropertiesDeleted_DeactivatesSharedBindingOnce()
    {
        var firstProperty = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "Unit",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 101,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };
        var secondProperty = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "Unit",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 102,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { firstProperty, secondProperty }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "Unit",
            SocialAttributeId = 5,
            SocietyDetailsId = 10,
            WingDetailId = 20,
            DocumentBindingId = 99,
            PropertyIds = "101, 102,invalid,0,101"
        };

        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        Assert.Equal(2, deletedCount);
        Assert.True(firstProperty.MarkedForDeletion);
        Assert.True(secondProperty.MarkedForDeletion);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(
            99, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_WithoutBindingId_AllPropertiesDeleted_DeactivatesSharedBindingOnce()
    {
        var firstProperty = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = "P",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 101,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };
        var secondProperty = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "P",
            SocietyDetailId = 10,
            WingDetailId = 20,
            PropertyId = 102,
            SocialAttributeId = 5,
            DocumentBindingId = 99,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entities = new List<PropertySocialDetailsEntity> { firstProperty, secondProperty }.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<PropertySocialDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "P",
            SocialAttributeId = 5,
            SocietyDetailsId = 10,
            WingDetailId = 20,
            PropertyIds = "101,102"
        };

        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        Assert.Equal(2, deletedCount);
        Assert.True(firstProperty.MarkedForDeletion);
        Assert.True(secondProperty.MarkedForDeletion);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(
            99, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Discount Applicability Filtering Tests

    [Fact]
    public async Task GetPropertySocialInfoAsync_FiltersOutDiscountApplicableBranches()
    {
        // Arrange
        var allAttributes = new List<SocialAttributeEntity>
        {
            // Branch A: Parent allowed, child is discount applicable -> entire branch should be filtered out
            new() { Id = 1, SocialAttributeCode = "PARENT_A", IsDiscountApplicable = false, ParentAttributeId = null, IsActive = true },
            new() { Id = 2, SocialAttributeCode = "CHILD_A", IsDiscountApplicable = true, ParentAttributeId = 1, IsActive = true },
            
            // Branch B: Parent is discount applicable -> entire branch filtered out
            new() { Id = 3, SocialAttributeCode = "PARENT_B", IsDiscountApplicable = true, ParentAttributeId = null, IsActive = true },
            new() { Id = 4, SocialAttributeCode = "CHILD_B", IsDiscountApplicable = false, ParentAttributeId = 3, IsActive = true },

            // Branch C: Parent and child allowed -> entire branch preserved
            new() { Id = 5, SocialAttributeCode = "PARENT_C", IsDiscountApplicable = false, ParentAttributeId = null, IsActive = true },
            new() { Id = 6, SocialAttributeCode = "CHILD_C", IsDiscountApplicable = false, ParentAttributeId = 5, IsActive = true }
        };

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(allAttributes);
       

        // Act
        var result = await _service.GetPropertySocialInfoAsync(100, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.SocialAttributes);
        var activeParent = result.SocialAttributes[0];
        Assert.Equal(5, activeParent.Id);
        Assert.Single(activeParent.Children);
        Assert.Equal(6, activeParent.Children[0].Id);
    }

    [Fact]
    public async Task UpsertPropertySocialInfoAsync_WithDiscountApplicableAttribute_ThrowsPropertyValidationException()
    {
        // Arrange
        var allAttributes = new List<SocialAttributeEntity>
        {
            new() { Id = 1, SocialAttributeCode = "DISCOUNT_ATTR", IsDiscountApplicable = true, ParentAttributeId = null, IsActive = true }
        };

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(allAttributes);

        var upsertDto = new UpsertPropertySocialInfoDto
        {
            PropertyId = 100,
            UpdatedBy = 1,
            SocialAttributes = new List<PropertySocialInfoItemDto>
            {
                new() { SocialAttributeId = 1, BitValue = true }
            }
        };

        // Act & Assert
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.PropertyValidationException>(() =>
            _service.UpsertPropertySocialInfoAsync(upsertDto, CancellationToken.None));
    }

    #endregion

    #region GetByFiltersAsync Tests

    [Fact]
    public async Task GetByFiltersAsync_WithAppliedAndNonAppliedAttributes_ReturnsPartitionedResponseDto()
    {
        // Arrange
        var societyDetailId = 1504941;
        var docGuid = Guid.NewGuid();

        var activeAttributes = new List<SocialAttributeEntity>
        {
            new() { Id = 10, SocialAttributeCode = "ATTR_10", SocialAttributeName = "Attribute Ten", DataType = "BIT", IsActive = true, IsDiscountApplicable = false },
            new() { Id = 20, SocialAttributeCode = "ATTR_20", SocialAttributeName = "Attribute Twenty", DataType = "TEXT", IsActive = true, IsDiscountApplicable = false }
        };

        var appliedEntities = new List<PropertySocialDetailsEntity>
        {
            new()
            {
                Id = 101,
                SocialAttributeId = 10,
                SocietyDetailId = societyDetailId,
                WingDetailId = null,
                PropertyId = null,
                BitValue = true,
                IsActive = true,
                SocialAttribute = activeAttributes[0],
                DocumentBindingId = 55,
                DocumentBinding = new DocumentBindingEntity
                {
                    Id = 55,
                    DocumentId = 66,
                    Document = new DocumentEntity
                    {
                        Id = 66,
                        DocumentGuid = docGuid
                    }
                }
            }
        };

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeAttributes);

        _mockSocialDetailsRepository.Setup(r => r.GetSocialDetailsByFiltersAsync(null, societyDetailId, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(appliedEntities);

        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(55, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentDto { Id = 66, DocumentGuid = docGuid });

        // Act
        var result = await _service.GetByFiltersAsync(null, societyDetailId, null, null, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.AppliedAttributes);
        Assert.Single(result.NonAppliedAttributes);

        var applied = result.AppliedAttributes[0];
        Assert.Equal(10, applied.SocialAttributeId);
        Assert.Equal(10, applied.AttributeMasterId);
        Assert.Equal("ATTR_10", applied.SocialAttributeCode);
        Assert.Equal("Attribute Ten", applied.SocialAttributeName);
        Assert.Equal(101, applied.PropertySocialDetailId);
        Assert.Equal(societyDetailId, applied.SocietyDetailId);
        Assert.True(applied.BitValue);
        Assert.Equal(docGuid, applied.DocumentGuid);

        var nonApplied = result.NonAppliedAttributes[0];
        Assert.Equal(20, nonApplied.Id);
        Assert.Equal(20, nonApplied.SocialAttributeId);
        Assert.Equal("ATTR_20", nonApplied.SocialAttributeCode);
        Assert.Equal("Attribute Twenty", nonApplied.SocialAttributeName);
        Assert.True(nonApplied.IsActive);
    }

    [Fact]
    public async Task GetByFiltersAsync_FiltersOutDiscountApplicableAttributes()
    {
        // Arrange
        var societyDetailId = 1504941;

        var activeAttributes = new List<SocialAttributeEntity>
        {
            new() { Id = 10, SocialAttributeCode = "SOCIAL_ATTR", SocialAttributeName = "Social", DataType = "BIT", IsActive = true, IsDiscountApplicable = false },
            new() { Id = 30, SocialAttributeCode = "DISCOUNT_ATTR", SocialAttributeName = "Discount", DataType = "BIT", IsActive = true, IsDiscountApplicable = true }
        };

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeAttributes);

        _mockSocialDetailsRepository.Setup(r => r.GetSocialDetailsByFiltersAsync(null, societyDetailId, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertySocialDetailsEntity>());

        // Act
        var result = await _service.GetByFiltersAsync(null, societyDetailId, null, null, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.AppliedAttributes);
        Assert.Single(result.NonAppliedAttributes);
        Assert.Equal(10, result.NonAppliedAttributes[0].AttributeMasterId);
    }

    [Fact]
    public async Task GetByFiltersAsync_WithHierarchyAndPropertyFilters_DelegatesCorrectlyToRepository()
    {
        // Arrange
        var socialAttributeId = 15;
        var societyDetailId = 1504941;
        var wingDetailId = 1525597;
        var propertyId = 42;

        var activeAttributes = new List<SocialAttributeEntity>
        {
            new() { Id = 15, SocialAttributeCode = "ATTR_15", SocialAttributeName = "Attribute 15", DataType = "BIT", IsActive = true, IsDiscountApplicable = false }
        };

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeAttributes);

        _mockSocialDetailsRepository.Setup(r => r.GetSocialDetailsByFiltersAsync(socialAttributeId, societyDetailId, wingDetailId, propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertySocialDetailsEntity>());

        // Act
        var result = await _service.GetByFiltersAsync(socialAttributeId, societyDetailId, wingDetailId, propertyId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.AppliedAttributes);
        Assert.Single(result.NonAppliedAttributes);
        Assert.Equal(15, result.NonAppliedAttributes[0].AttributeMasterId);

        _mockSocialDetailsRepository.Verify(r => r.GetSocialDetailsByFiltersAsync(socialAttributeId, societyDetailId, wingDetailId, propertyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region CreateAsync Document Binding & EntityType Regression Tests

    [Fact]
    public async Task CreateAsync_WithDocumentBinding_ValidatesAndLinksReference()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 50,
            EntityType = "P"
        };

        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentDto { Id = 50, DocumentGuid = Guid.NewGuid() });

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        _mockDocumentApplicationService.Verify(d => d.UpdateDocumentBindingReferenceAsync(50, result.Id, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentDocumentBinding_ThrowsPropertyValidationException()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 999,
            EntityType = "P"
        };

        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DocumentDto?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<PropertyValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        Assert.Contains("does not exist", ex.Message);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }


    [Fact]
    public async Task CreateAsync_WhenDocumentBindingUpdateFails_RollsBackTransaction()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 50,
            EntityType = "P"
        };

        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentDto { Id = 50, DocumentGuid = Guid.NewGuid() });

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity>().BuildMock());

        _mockDocumentApplicationService.Setup(d => d.UpdateDocumentBindingReferenceAsync(50, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Binding persistence failure"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithInvalidEntityType_ThrowsPropertyValidationException()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            EntityType = "INVALID"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<PropertyValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        Assert.Contains("Invalid EntityType", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithNullEntityType_DefaultsToProperty()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            EntityType = null
        };

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity>().BuildMock());

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(PropertySocialDetailsConstants.EntityTypes.Property, result.EntityType);
    }

    #endregion

    #region UpdateAsync Document Transitions & Rollback Regression Tests

    [Fact]
    public async Task UpdateAsync_DocumentTransition_OldToNew_DeactivatesOldAndLinksNew()
    {
        // Arrange (Finding 1 & 9: Old -> New)
        var entityId = 1;
        var existingEntity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 10,
            EntityType = "P",
            IsActive = true
        };

        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 20,
            EntityType = "P"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentDto { Id = 20, DocumentGuid = Guid.NewGuid() });

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity> { existingEntity }.BuildMock());

        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
            "PropertySocialDetails",
            new[] { entityId },
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DocumentBindingInfoDto>
            {
                new() { BindingId = 10, ReferenceTableId = entityId, DocumentGuid = Guid.NewGuid() }
            });

        // Act
        var result = await _service.UpdateAsync(entityId, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        // Verify old binding was deactivated
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(10, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        // Verify new binding was NOT deactivated
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(20, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        // Verify new binding reference updated to this entity ID
        _mockDocumentApplicationService.Verify(d => d.UpdateDocumentBindingReferenceAsync(20, entityId, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        // Verify entity state updated
        Assert.Equal(20, existingEntity.DocumentBindingId);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DocumentTransition_OldToNull_DeactivatesOldBindingAndClearsRelationship()
    {
        // Arrange (Finding 1 & 10: Old -> Null)
        var entityId = 1;
        var existingEntity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 10,
            EntityType = "P",
            IsActive = true
        };

        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = null, // user removed document
            EntityType = "P"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity> { existingEntity }.BuildMock());

        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
            "PropertySocialDetails",
            new[] { entityId },
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DocumentBindingInfoDto>
            {
                new() { BindingId = 10, ReferenceTableId = entityId, DocumentGuid = Guid.NewGuid() }
            });

        // Act
        var result = await _service.UpdateAsync(entityId, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(10, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.Null(existingEntity.DocumentBindingId);
        _mockDocumentApplicationService.Verify(d => d.UpdateDocumentBindingReferenceAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DocumentTransition_NullToNew_LinksNewBinding()
    {
        // Arrange (Finding 1: Null -> New)
        var entityId = 1;
        var existingEntity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = null, // previously no document
            EntityType = "P",
            IsActive = true
        };

        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 20,
            EntityType = "P"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentDto { Id = 20, DocumentGuid = Guid.NewGuid() });

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity> { existingEntity }.BuildMock());

        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
            "PropertySocialDetails",
            new[] { entityId },
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<DocumentBindingInfoDto>());

        // Act
        var result = await _service.UpdateAsync(entityId, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockDocumentApplicationService.Verify(d => d.UpdateDocumentBindingReferenceAsync(20, entityId, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal(20, existingEntity.DocumentBindingId);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DocumentTransition_SameToSame_PreservesExistingBindingWithoutDeactivation()
    {
        // Arrange (Finding 1: Same -> Same)
        var entityId = 1;
        var existingEntity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 10,
            EntityType = "P",
            IsActive = true
        };

        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 10, // same document
            EntityType = "P"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity> { existingEntity }.BuildMock());

        // Act
        var result = await _service.UpdateAsync(entityId, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        _mockDocumentApplicationService.Verify(d => d.DeactivateDocumentBindingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockDocumentApplicationService.Verify(d => d.UpdateDocumentBindingReferenceAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.Equal(10, existingEntity.DocumentBindingId);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenDocumentBindingUpdateFails_RollsBackTransaction()
    {
        // Arrange (Finding 3: Rollback on binding failure)
        var entityId = 1;
        var existingEntity = new PropertySocialDetailsEntity
        {
            Id = entityId,
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 10,
            EntityType = "P",
            IsActive = true
        };

        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            DocumentBindingId = 20,
            EntityType = "P"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(entityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentDto { Id = 20, DocumentGuid = Guid.NewGuid() });

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity> { existingEntity }.BuildMock());

        _mockDocumentApplicationService.Setup(d => d.UpdateDocumentBindingReferenceAsync(20, entityId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated document binding error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateAsync(entityId, updateDto, CancellationToken.None));
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region UpsertPropertySocialInfoAsync Legacy Normalization Tests

    [Fact]
    public async Task UpsertPropertySocialInfoAsync_WithLegacyNullOrEmptyEntityType_NormalizesToProperty()
    {
        // Arrange (Finding 7: Normalizing matched legacy records to EntityType = "P")
        var propertyId = 100;
        var existingEntity = new PropertySocialDetailsEntity
        {
            Id = 1,
            PropertyId = propertyId,
            SocialAttributeId = 5,
            EntityType = null, // legacy record with null EntityType
            IsActive = true
        };

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialAttributesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SocialAttributeEntity>
            {
                new() { Id = 5, SocialAttributeCode = "ATTR5", IsActive = true, IsDiscountApplicable = false }
            });

        _mockSocialDetailsRepository.Setup(r => r.GetSocialDetailsByPropertyAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertySocialDetailsEntity> { existingEntity });

        _mockSocialDetailsRepository.Setup(r => r.GetActiveSocialDetailsWithAttributeByPropertyAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PropertySocialDetailsEntity> { existingEntity });

        var dto = new UpsertPropertySocialInfoDto
        {
            PropertyId = propertyId,
            UpdatedBy = 1,
            SocialAttributes = new List<PropertySocialInfoItemDto>
            {
                new() { Id = 1, SocialAttributeId = 5, TextValue = "Updated Text" }
            }
        };

        // Act
        var result = await _service.UpsertPropertySocialInfoAsync(dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(PropertySocialDetailsConstants.EntityTypes.Property, existingEntity.EntityType);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region SoftDeleteByHierarchyAsync Compatibility Query Regression Tests

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("P")]
    public async Task SoftDeleteByHierarchyAsync_PropertyScopeP_MatchesLegacyNullAndEmptyAndP(string? legacyEntityType)
    {
        // Arrange (Finding 11: P matches null, "", and "P")
        var entity = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = legacyEntityType,
            SocialAttributeId = 10,
            PropertyId = 101,
            IsActive = true,
            MarkedForDeletion = false
        };

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity> { entity }.BuildMock());

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "P",
            SocialAttributeId = 10,
            PropertyIds = "101"
        };

        // Act
        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        // Assert
        Assert.Equal(1, deletedCount);
        Assert.False(entity.IsActive);
        Assert.True(entity.MarkedForDeletion);
    }

    [Fact]
    public async Task SoftDeleteByHierarchyAsync_NonPropertyScope_DoesNotMatchLegacyNullOrEmpty()
    {
        // Arrange (Finding 11: non-P does NOT match legacy null or empty)
        var entityNull = new PropertySocialDetailsEntity
        {
            Id = 1,
            EntityType = null,
            SocialAttributeId = 10,
            WingDetailId = 50,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entityEmpty = new PropertySocialDetailsEntity
        {
            Id = 2,
            EntityType = "",
            SocialAttributeId = 10,
            WingDetailId = 50,
            IsActive = true,
            MarkedForDeletion = false
        };

        var entityWing = new PropertySocialDetailsEntity
        {
            Id = 3,
            EntityType = "W",
            SocialAttributeId = 10,
            WingDetailId = 50,
            IsActive = true,
            MarkedForDeletion = false
        };

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertySocialDetailsEntity> { entityNull, entityEmpty, entityWing }.BuildMock());

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "W",
            SocialAttributeId = 10,
            WingDetailId = 50
        };

        // Act
        var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, CancellationToken.None);

        // Assert
        Assert.Equal(1, deletedCount); // Only entityWing is matched
        Assert.True(entityNull.IsActive);
        Assert.False(entityNull.MarkedForDeletion);
        Assert.True(entityEmpty.IsActive);
        Assert.False(entityEmpty.MarkedForDeletion);
        Assert.False(entityWing.IsActive);
        Assert.True(entityWing.MarkedForDeletion);
    }

    #endregion

    #region Discount & Social Grid Tests

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_NonExistentSociety_ThrowsSocietyNotFoundException()
    {
        // Arrange
        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(999, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((null, null, new List<WingDetailsMastEntity>(), new List<PropertyEntity>(), new List<PropertySocialDetailsEntity>(), new List<SocialAttributeEntity>()));

        // Act & Assert
        await Assert.ThrowsAsync<SocietyNotFoundException>(() =>
            _service.GetApartmentSocietyDiscountAndSocialGridAsync(999, null, CancellationToken.None));
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_UnrelatedPropertyId_ThrowsPropertyValidationException()
    {
        // Arrange
        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, 999, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new PropertyValidationException("Property with ID 999 does not belong to Society with ID 100."));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<PropertyValidationException>(() =>
            _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, 999, CancellationToken.None));

        Assert.Contains("does not belong to Society", ex.Message);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_ValidHierarchy_ReturnsHierarchyAndCounts()
    {
        // Arrange
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10 };
        var societyProperty = new PropertyEntity { Id = 10, PropertyNo = "116" };
        var wingA = new WingDetailsMastEntity { Id = 201, SocietyDetailsMastId = 100, WingName = "Asha Wing", IsActive = true };
        var unit1 = new PropertyEntity { Id = 301, WingDetailId = 201, PartitionNo = "101", IsActive = true };

        var attrDiscount = new SocialAttributeEntity
        {
            Id = 1,
            SocialAttributeCode = "STP",
            SocialAttributeName = "Sewage Treatment Plant",
            IsDiscountApplicable = true,
            DisplayOrder = 1,
            IsActive = true
        };
        var attrSocial = new SocialAttributeEntity
        {
            Id = 2,
            SocialAttributeCode = "TREE",
            SocialAttributeName = "Tree Plantation",
            IsDiscountApplicable = false,
            DisplayOrder = 2,
            IsActive = true
        };

        var socialDetailApt = new PropertySocialDetailsEntity
        {
            Id = 1001,
            SocietyDetailId = 100,
            SocialAttributeId = 1,
            SocialAttribute = attrDiscount,
            BitValue = true,
            EntityType = "S"
        };
        var socialDetailWing = new PropertySocialDetailsEntity
        {
            Id = 1002,
            SocietyDetailId = 100,
            WingDetailId = 201,
            SocialAttributeId = 2,
            SocialAttribute = attrSocial,
            IntValue = 5,
            EntityType = "W"
        };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, societyProperty, new List<WingDetailsMastEntity> { wingA }, new List<PropertyEntity> { unit1 },
                new List<PropertySocialDetailsEntity> { socialDetailApt, socialDetailWing },
                new List<SocialAttributeEntity> { attrDiscount, attrSocial }));

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.LevelCounts.All);
        Assert.Equal(1, result.LevelCounts.Apartment);
        Assert.Equal(1, result.LevelCounts.Wing);
        Assert.Equal(0, result.LevelCounts.Unit);

        Assert.Single(result.DiscountData.AppliedAttributes);
        Assert.Equal("Apartment", result.DiscountData.AppliedAttributes[0].Level);
        Assert.Equal("Apartment Level (116)", result.DiscountData.AppliedAttributes[0].DisplayLevelLabel);

        Assert.Single(result.SocialData.AppliedAttributes);
        Assert.Equal("Wing", result.SocialData.AppliedAttributes[0].Level);
        Assert.Equal("Asha Wing", result.SocialData.AppliedAttributes[0].DisplayLevelLabel);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_InconsistentEntityType_NormalizesLevelByTrueHierarchy()
    {
        // Arrange
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10 };
        var societyProperty = new PropertyEntity { Id = 10, PropertyNo = "116" };
        var wingA = new WingDetailsMastEntity { Id = 201, SocietyDetailsMastId = 100, WingName = "Asha", IsActive = true };
        var unit1 = new PropertyEntity { Id = 301, WingDetailId = 201, PartitionNo = "101", IsActive = true };

        var attrDiscount = new SocialAttributeEntity
        {
            Id = 1,
            SocialAttributeCode = "SOLAR",
            SocialAttributeName = "Solar Plant",
            IsDiscountApplicable = true,
            DisplayOrder = 1,
            IsActive = true
        };

        // Entity has EntityType="S" (Apartment) but actually has PropertyId=301 (Unit)
        var inconsistentEntity = new PropertySocialDetailsEntity
        {
            Id = 1001,
            SocietyDetailId = 100,
            WingDetailId = 201,
            PropertyId = 301,
            SocialAttributeId = 1,
            SocialAttribute = attrDiscount,
            BitValue = true,
            EntityType = "S"
        };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, societyProperty, new List<WingDetailsMastEntity> { wingA }, new List<PropertyEntity> { unit1 },
                new List<PropertySocialDetailsEntity> { inconsistentEntity },
                new List<SocialAttributeEntity> { attrDiscount }));

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert - Normalized to Unit level based on PropertyId=301
        Assert.Single(result.DiscountData.AppliedAttributes);
        Assert.Equal("Unit", result.DiscountData.AppliedAttributes[0].Level);
        Assert.Equal("P", result.DiscountData.AppliedAttributes[0].EntityType);
        Assert.Equal("Asha - 101 Unit", result.DiscountData.AppliedAttributes[0].DisplayLevelLabel);
        Assert.Equal(1, result.LevelCounts.Unit);
        Assert.Equal(0, result.LevelCounts.Apartment);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_CaseInsensitiveBindingPurpose_ResolvesPhotoAndDocument()
    {
        // Arrange
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10 };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "STP", IsDiscountApplicable = true, IsActive = true };
        var entity = new PropertySocialDetailsEntity
        {
            Id = 500,
            SocietyDetailId = 100,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            BitValue = true
        };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, new List<WingDetailsMastEntity>(), new List<PropertyEntity>(),
                new List<PropertySocialDetailsEntity> { entity },
                new List<SocialAttributeEntity> { attr }));

        var photoGuid = Guid.NewGuid();
        var docGuid = Guid.NewGuid();

        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                It.Is<IReadOnlyList<int>>(ids => ids.Contains(500)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new DocumentBindingInfoDto { BindingId = 10, ReferenceTableId = 500, DocumentGuid = photoGuid, BindingPurpose = "  photo  " },
                new DocumentBindingInfoDto { BindingId = 11, ReferenceTableId = 500, DocumentGuid = docGuid, BindingPurpose = "Document" }
            });

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert
        var item = result.DiscountData.AppliedAttributes[0];
        Assert.Equal(10, item.PhotoBindingId);
        Assert.Equal(photoGuid, item.PhotoGuid);
        Assert.Equal(11, item.DocumentBindingId);
        Assert.Equal(docGuid, item.DocumentGuid);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_PhotoBindingNotMisclassifiedAsDocument_WhenExactDocumentBindingIdMatchesPhoto()
    {
        // Arrange (Finding 2: Photo binding must not leak into document slot even when DocumentBindingId points to it)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10 };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "STP", IsDiscountApplicable = true, IsActive = true };
        var photoGuid = Guid.NewGuid();
        var docGuid = Guid.NewGuid();

        var entity = new PropertySocialDetailsEntity
        {
            Id = 500,
            SocietyDetailId = 100,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            BitValue = true,
            DocumentBindingId = 10 // Erroneously pointing to photo binding id 10
        };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, new List<WingDetailsMastEntity>(), new List<PropertyEntity>(),
                new List<PropertySocialDetailsEntity> { entity },
                new List<SocialAttributeEntity> { attr }));

        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                It.Is<IReadOnlyList<int>>(ids => ids.Contains(500)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new DocumentBindingInfoDto { BindingId = 10, ReferenceTableId = 500, DocumentGuid = photoGuid, BindingPurpose = "Photo" },
                new DocumentBindingInfoDto { BindingId = 11, ReferenceTableId = 500, DocumentGuid = docGuid, BindingPurpose = "Document" }
            });

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert
        var item = result.DiscountData.AppliedAttributes[0];
        Assert.Equal(10, item.PhotoBindingId);
        Assert.Equal(photoGuid, item.PhotoGuid);
        // Document must NOT be binding 10 (which is Photo); it must resolve to binding 11 (Document)
        Assert.Equal(11, item.DocumentBindingId);
        Assert.Equal(docGuid, item.DocumentGuid);
    }

    [Fact]
    public async Task GetIndividualPropertyDiscountAndSocialGridAsync_NonExistentProperty_ThrowsPropertyNotFoundException()
    {
        // Arrange
        _mockSocialDetailsRepository.Setup(r => r.GetIndividualPropertyDiscountAndSocialDataAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((null, null, new List<PropertySocialDetailsEntity>(), new List<SocialAttributeEntity>()));

        // Act & Assert
        await Assert.ThrowsAsync<PropertyNotFoundException>(() =>
            _service.GetIndividualPropertyDiscountAndSocialGridAsync(999, CancellationToken.None));
    }

    [Fact]
    public async Task GetIndividualPropertyDiscountAndSocialGridAsync_ValidProperty_ReturnsGrid()
    {
        // Arrange
        var property = new PropertyEntity { Id = 50, PropertyNo = "116", PartitionNo = "A1", WingDetailId = 10 };
        var wing = new WingDetailsMastEntity { Id = 10, WingName = "A Wing" };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };
        var socialDetail = new PropertySocialDetailsEntity
        {
            Id = 200,
            PropertyId = 50,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            BitValue = true
        };

        _mockSocialDetailsRepository.Setup(r => r.GetIndividualPropertyDiscountAndSocialDataAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync((property, wing, new List<PropertySocialDetailsEntity> { socialDetail }, new List<SocialAttributeEntity> { attr }));

        // Act
        var result = await _service.GetIndividualPropertyDiscountAndSocialGridAsync(50, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.DiscountData.AppliedAttributes);
        Assert.Equal("Unit", result.DiscountData.AppliedAttributes[0].Level);
        Assert.Equal("A1 Unit", result.DiscountData.AppliedAttributes[0].DisplayLevelLabel);
        Assert.Equal(1, result.LevelCounts.Unit);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_WithInvalidPropertyId_ThrowsPropertyValidationException()
    {
        // Act & Assert (Finding 8)
        await Assert.ThrowsAsync<PropertyValidationException>(() =>
            _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, 0, CancellationToken.None));

        await Assert.ThrowsAsync<PropertyValidationException>(() =>
            _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, -5, CancellationToken.None));
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_PhotoOnlyRecord_RecognizedAsApplied()
    {
        // Arrange (Finding 2)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10, SocietyName = "Green Society" };
        var wings = new List<WingDetailsMastEntity>();
        var units = new List<PropertyEntity>();
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };

        // Entity has NO scalar value and NO DocumentBindingId
        var socialDetail = new PropertySocialDetailsEntity
        {
            Id = 501,
            SocietyDetailId = 100,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            BitValue = null,
            IntValue = null,
            DecimalValue = null,
            TextValue = null,
            DateValue = null,
            DocumentBindingId = null
        };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, wings, units, new List<PropertySocialDetailsEntity> { socialDetail }, new List<SocialAttributeEntity> { attr }));

        var photoGuid = Guid.NewGuid();
        _mockDocumentApplicationService.Setup(d => d.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                It.Is<IReadOnlyList<int>>(ids => ids.Contains(501)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new DocumentBindingInfoDto { BindingId = 99, ReferenceTableId = 501, DocumentGuid = photoGuid, BindingPurpose = "Photo" }
            });

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert
        Assert.Single(result.DiscountData.AppliedAttributes);
        var item = result.DiscountData.AppliedAttributes[0];
        Assert.Equal(99, item.PhotoBindingId);
        Assert.Equal(photoGuid, item.PhotoGuid);
        Assert.Equal("Apartment", item.Level);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_StaleDeletedDocumentBinding_NotMarkedAsApplied()
    {
        // Arrange (Finding 2)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10, SocietyName = "Green Society" };
        var wings = new List<WingDetailsMastEntity>();
        var units = new List<PropertyEntity>();
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Solar", IsDiscountApplicable = true, IsActive = true };

        // Entity has stale DocumentBindingId=777, but no scalar values and no active document resolved
        var socialDetail = new PropertySocialDetailsEntity
        {
            Id = 502,
            SocietyDetailId = 100,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            DocumentBindingId = 777
        };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, wings, units, new List<PropertySocialDetailsEntity> { socialDetail }, new List<SocialAttributeEntity> { attr }));

        // Document service returns null (e.g. inactive / deleted)
        _mockDocumentApplicationService.Setup(d => d.GetDocumentByBindingAsync(777, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DocumentDto?)null);

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert: Row is NOT considered applied; instead the attribute is in NonAppliedAttributes
        Assert.Empty(result.DiscountData.AppliedAttributes);
        Assert.Single(result.DiscountData.NonAppliedAttributes);
        Assert.Equal("Apartment", result.DiscountData.NonAppliedAttributes[0].Level);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_AllUnitsScope_GeneratesNonAppliedForAllUnitsWhenPropertyIdOmitted()
    {
        // Arrange (Finding 3 & 5)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10, SocietyName = "Green Society" };
        var wings = new List<WingDetailsMastEntity> { new() { Id = 1, WingName = "A Wing", SocietyDetailsMastId = 100 } };
        var units = new List<PropertyEntity>
        {
            new() { Id = 21, PropertyNo = "P1", PartitionNo = "1", WingDetailId = 1 },
            new() { Id = 22, PropertyNo = "P2", PartitionNo = "2", WingDetailId = 1 }
        };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, wings, units, new List<PropertySocialDetailsEntity>(), new List<SocialAttributeEntity> { attr }));

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert
        Assert.Equal("AllUnits", result.UnitEvaluationScope);
        // NonApplied contains: 1 Apartment level + 1 Wing level + 2 Unit level (units 21 and 22)
        var unitNonApplied = result.DiscountData.NonAppliedAttributes.Where(x => x.Level == "Unit").ToList();
        Assert.Equal(2, unitNonApplied.Count);
        Assert.Contains(unitNonApplied, x => x.PropertyId == 21);
        Assert.Contains(unitNonApplied, x => x.PropertyId == 22);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_SingleUnitScope_WhenPropertyIdProvided()
    {
        // Arrange (Finding 3 & 5)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10, SocietyName = "Green Society" };
        var wings = new List<WingDetailsMastEntity> { new() { Id = 1, WingName = "A Wing", SocietyDetailsMastId = 100 } };
        var units = new List<PropertyEntity>
        {
            new() { Id = 21, PropertyNo = "P1", PartitionNo = "1", WingDetailId = 1 }
        };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, 21, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, wings, units, new List<PropertySocialDetailsEntity>(), new List<SocialAttributeEntity> { attr }));

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, 21, CancellationToken.None);

        // Assert
        Assert.Equal("SingleUnit", result.UnitEvaluationScope);
        var unitNonApplied = result.DiscountData.NonAppliedAttributes.Where(x => x.Level == "Unit").ToList();
        Assert.Single(unitNonApplied);
        Assert.Equal(21, unitNonApplied[0].PropertyId);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_MainPropertyPassed_DoesNotGenerateUnitNonAppliedRows()
    {
        // Arrange (Finding 3 & 5)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10, SocietyName = "Green Society" };
        var societyProp = new PropertyEntity { Id = 10, PropertyNo = "MAIN" };
        var wings = new List<WingDetailsMastEntity> { new() { Id = 1, WingName = "A Wing", SocietyDetailsMastId = 100 } };
        var units = new List<PropertyEntity>
        {
            new() { Id = 21, PropertyNo = "P1", PartitionNo = "1", WingDetailId = 1 }
        };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };

        // When propertyId=10 (the society main property), targetUnits becomes empty and scope is None
        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, societyProp, wings, units, new List<PropertySocialDetailsEntity>(), new List<SocialAttributeEntity> { attr }));

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, 10, CancellationToken.None);

        // Assert
        Assert.Equal("None", result.UnitEvaluationScope);
        var unitNonApplied = result.DiscountData.NonAppliedAttributes.Where(x => x.Level == "Unit").ToList();
        Assert.Empty(unitNonApplied);
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_NormalizesIdsAndNaturalSortsPartitionNumbers()
    {
        // Arrange (Finding 6 & 10)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10, SocietyName = "Green Society" };
        var wings = new List<WingDetailsMastEntity> { new() { Id = 1, WingName = "A Wing", SocietyDetailsMastId = 100 } };
        var units = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "P1", PartitionNo = "10", WingDetailId = 1 },
            new() { Id = 102, PropertyNo = "P2", PartitionNo = "2", WingDetailId = 1 },
            new() { Id = 103, PropertyNo = "P3", PartitionNo = "1", WingDetailId = 1 }
        };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };

        // Social details rows have null SocietyDetailId/WingDetailId to test normalization
        var sd1 = new PropertySocialDetailsEntity { Id = 1, PropertyId = 101, SocialAttributeId = 1, SocialAttribute = attr, BitValue = true, SocietyDetailId = null, WingDetailId = null };
        var sd2 = new PropertySocialDetailsEntity { Id = 2, PropertyId = 102, SocialAttributeId = 1, SocialAttribute = attr, BitValue = true, SocietyDetailId = null, WingDetailId = null };
        var sd3 = new PropertySocialDetailsEntity { Id = 3, PropertyId = 103, SocialAttributeId = 1, SocialAttribute = attr, BitValue = true, SocietyDetailId = null, WingDetailId = null };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, wings, units, new List<PropertySocialDetailsEntity> { sd1, sd2, sd3 }, new List<SocialAttributeEntity> { attr }));

        // Act
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, null, CancellationToken.None);

        // Assert: Natural sort order should be 1, 2, 10 (not lexicographical 1, 10, 2)
        var applied = result.DiscountData.AppliedAttributes.Where(x => x.Level == "Unit").ToList();
        Assert.Equal(3, applied.Count);
        Assert.Equal("1", applied[0].PartitionNo);
        Assert.Equal("2", applied[1].PartitionNo);
        Assert.Equal("10", applied[2].PartitionNo);

        // Assert: Normalized IDs are correctly populated from hierarchy context
        foreach (var item in applied)
        {
            Assert.Equal(100, item.SocietyDetailId);
            Assert.Equal(1, item.WingDetailId);
        }
    }

    [Fact]
    public async Task GetApartmentSocietyDiscountAndSocialGridAsync_SingleUnitScope_ExcludesAppliedAttributesFromOtherUnits()
    {
        // Arrange (Finding 1 & 6: Cross-unit isolation regression test)
        var society = new SocietyDetailsEntity { Id = 100, PropertyId = 10, SocietyName = "Green Society" };
        var wings = new List<WingDetailsMastEntity> { new() { Id = 1, WingName = "A Wing", SocietyDetailsMastId = 100 } };
        var units = new List<PropertyEntity>
        {
            new() { Id = 21, PropertyNo = "P1", PartitionNo = "1", WingDetailId = 1 },
            new() { Id = 22, PropertyNo = "P2", PartitionNo = "2", WingDetailId = 1 }
        };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };

        // Both units have applied attributes returned by the repository
        var sdUnit21 = new PropertySocialDetailsEntity
        {
            Id = 1,
            PropertyId = 21,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            BitValue = true,
            SocietyDetailId = 100,
            WingDetailId = 1
        };
        var sdUnit22 = new PropertySocialDetailsEntity
        {
            Id = 2,
            PropertyId = 22,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            BitValue = true,
            SocietyDetailId = 100,
            WingDetailId = 1
        };

        _mockSocialDetailsRepository.Setup(r => r.GetDiscountAndSocialHierarchyDataAsync(100, 21, It.IsAny<CancellationToken>()))
            .ReturnsAsync((society, null, wings, units, new List<PropertySocialDetailsEntity> { sdUnit21, sdUnit22 }, new List<SocialAttributeEntity> { attr }));

        // Act: Request specifically for Unit 21
        var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(100, 21, CancellationToken.None);

        // Assert: Scope is SingleUnit, and applied attributes for other units (Unit 22) are excluded
        Assert.Equal("SingleUnit", result.UnitEvaluationScope);
        var unitApplied = result.DiscountData.AppliedAttributes.Where(x => x.Level == "Unit").ToList();
        Assert.Single(unitApplied);
        Assert.Equal(21, unitApplied[0].PropertyId);
        Assert.DoesNotContain(unitApplied, x => x.PropertyId == 22);
        Assert.Equal(1, result.LevelCounts.Unit);
        Assert.Equal(1, result.LevelCounts.All);
    }

    [Fact]
    public async Task GetIndividualPropertyDiscountAndSocialGridAsync_StandaloneProperty_ReturnsPropertyLevelAndCounts()
    {
        // Arrange (Finding 3: Standalone Property level and counts)
        var property = new PropertyEntity { Id = 50, PropertyNo = "STANDALONE-116", WingDetailId = null };
        var attr = new SocialAttributeEntity { Id = 1, SocialAttributeName = "Rainwater", IsDiscountApplicable = true, IsActive = true };
        var socialDetail = new PropertySocialDetailsEntity
        {
            Id = 200,
            PropertyId = 50,
            SocialAttributeId = 1,
            SocialAttribute = attr,
            BitValue = true
        };

        _mockSocialDetailsRepository.Setup(r => r.GetIndividualPropertyDiscountAndSocialDataAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync((property, null, new List<PropertySocialDetailsEntity> { socialDetail }, new List<SocialAttributeEntity> { attr }));

        // Act
        var result = await _service.GetIndividualPropertyDiscountAndSocialGridAsync(50, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.DiscountData.AppliedAttributes);
        Assert.Equal("Property", result.DiscountData.AppliedAttributes[0].Level);
        Assert.Equal(0, result.LevelCounts.Unit);
        Assert.Equal(1, result.LevelCounts.Property);
        Assert.Equal(1, result.LevelCounts.All);
    }

    [Fact]
    public async Task GetDiscountAndSocialHierarchyDataAsync_InMemoryDbContext_FiltersActiveAndExcludesCrossSocietyRows()
    {
        // Arrange (Finding 7 & 11: InMemory EF Core DbContext query execution)
        var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<NtisPlatform.Infrastructure.Data.ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var dbContext = new NtisPlatform.Infrastructure.Data.ApplicationDbContext(options);

        // 1. Seed Society & Wings
        var society = new SocietyDetailsEntity { Id = 500, PropertyId = 1000, SocietyName = "Omega Towers", IsActive = true, MarkedForDeletion = false };
        var mainProp = new PropertyEntity { Id = 1000, PropertyNo = "1000", IsActive = true, MarkedForDeletion = false };
        var wingA = new WingDetailsMastEntity { Id = 50, WingName = "Wing A", SocietyDetailsMastId = 500, IsActive = true, MarkedForDeletion = false };
        var unit1 = new PropertyEntity { Id = 1001, PropertyNo = "1001", PartitionNo = "U1", WingDetailId = 50, IsActive = true, MarkedForDeletion = false };
        var unit2 = new PropertyEntity { Id = 1002, PropertyNo = "1002", PartitionNo = "U2", WingDetailId = 50, IsActive = true, MarkedForDeletion = false };

        // Another society (unrelated)
        var otherSociety = new SocietyDetailsEntity { Id = 600, PropertyId = 2000, SocietyName = "Beta Towers", IsActive = true, MarkedForDeletion = false };
        var otherUnit = new PropertyEntity { Id = 2001, PropertyNo = "2001", PartitionNo = "B1", WingDetailId = 60, IsActive = true, MarkedForDeletion = false };

        var attr = new SocialAttributeEntity { Id = 10, SocialAttributeCode = "SOLAR", SocialAttributeName = "Solar Power", DataType = "BIT", IsActive = true, IsDiscountApplicable = true };

        // Active document and active binding
        var activeDoc = new DocumentEntity { Id = 101, DocumentGuid = Guid.NewGuid(), FileName = "test.pdf", StoragePath = "p", OriginalFileName = "test.pdf", FileExtension = ".pdf", MimeType = "application/pdf", IsActive = true, MarkedForDeletion = false };
        var activeBinding = new DocumentBindingEntity { Id = 201, DocumentId = 101, DepartmentId = 1, ModuleId = 1, ReferenceTableName = "PropertySocialDetails", ReferenceTableId = 1, ReferencePropertyName = "Doc", IsActive = true, MarkedForDeletion = false };

        // Inactive / deleted document and binding
        var deletedDoc = new DocumentEntity { Id = 102, DocumentGuid = Guid.NewGuid(), FileName = "del.pdf", StoragePath = "p", OriginalFileName = "del.pdf", FileExtension = ".pdf", MimeType = "application/pdf", IsActive = false, MarkedForDeletion = true };
        var deletedBinding = new DocumentBindingEntity { Id = 202, DocumentId = 102, DepartmentId = 1, ModuleId = 1, ReferenceTableName = "PropertySocialDetails", ReferenceTableId = 2, ReferencePropertyName = "Doc", IsActive = false, MarkedForDeletion = true };

        // Rows for society 500:
        // Apartment level row
        var rowApartment = new PropertySocialDetailsEntity
        {
            Id = 1,
            SocietyDetailId = 500,
            PropertyId = 1000,
            SocialAttributeId = 10,
            BitValue = true,
            IsActive = true,
            MarkedForDeletion = false,
            DocumentBindingId = 201
        };

        // Unit level row
        var rowUnit = new PropertySocialDetailsEntity
        {
            Id = 2,
            PropertyId = 1001,
            SocialAttributeId = 10,
            BitValue = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        // Cross-society row: matches SocietyDetailId 500 BUT references otherUnit (Id 2001) belonging to society 600
        var rowMismatched = new PropertySocialDetailsEntity
        {
            Id = 3,
            SocietyDetailId = 500,
            PropertyId = 2001,
            SocialAttributeId = 10,
            BitValue = true,
            IsActive = true,
            MarkedForDeletion = false
        };

        // Deleted row
        var rowDeleted = new PropertySocialDetailsEntity
        {
            Id = 4,
            SocietyDetailId = 500,
            SocialAttributeId = 10,
            BitValue = true,
            IsActive = true,
            MarkedForDeletion = true
        };

        dbContext.Set<SocietyDetailsEntity>().AddRange(society, otherSociety);
        dbContext.Set<PropertyEntity>().AddRange(mainProp, unit1, unit2, otherUnit);
        dbContext.Set<WingDetailsMastEntity>().Add(wingA);
        dbContext.Set<SocialAttributeEntity>().Add(attr);
        dbContext.Set<DocumentEntity>().AddRange(activeDoc, deletedDoc);
        dbContext.Set<DocumentBindingEntity>().AddRange(activeBinding, deletedBinding);
        dbContext.Set<PropertySocialDetailsEntity>().AddRange(rowApartment, rowUnit, rowMismatched, rowDeleted);
        await dbContext.SaveChangesAsync();

        var repo = new NtisPlatform.Infrastructure.Repositories.Property.PropertySocialDetailsRepository(dbContext);

        // Act
        var result = await repo.GetDiscountAndSocialHierarchyDataAsync(500, null, CancellationToken.None);

        // Assert
        Assert.NotNull(result.Society);
        Assert.Equal(500, result.Society.Id);
        Assert.NotNull(result.SocietyProperty);
        Assert.Equal(1000, result.SocietyProperty.Id);

        // Society main property must be excluded from child units
        Assert.DoesNotContain(result.Units, u => u.Id == 1000);
        Assert.Contains(result.Units, u => u.Id == 1001);
        Assert.Contains(result.Units, u => u.Id == 1002);

        // Cross-society row (Id = 3) and deleted row (Id = 4) must be excluded
        Assert.DoesNotContain(result.SocialDetails, s => s.Id == 3);
        Assert.DoesNotContain(result.SocialDetails, s => s.Id == 4);

        // Valid rows retained
        Assert.Contains(result.SocialDetails, s => s.Id == 1);
        Assert.Contains(result.SocialDetails, s => s.Id == 2);

        // Active document binding resolved, inactive excluded
        var apRow = result.SocialDetails.First(s => s.Id == 1);
        Assert.NotNull(apRow.DocumentBinding);
        Assert.NotNull(apRow.DocumentBinding.Document);
        Assert.Equal(activeDoc.DocumentGuid, apRow.DocumentBinding.Document.DocumentGuid);
    }

    #endregion
}
