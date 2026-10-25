using AutoMapper;
using FluentAssertions;
using Moq;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class FLatGenerationGroupMasterServiceTests
{
    private readonly Mock<IRepository<FLatGenerationGroupMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IReferenceValidationService> _referenceValidatorMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly FLatGenerationGroupMasterService _service;

    public FLatGenerationGroupMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<FLatGenerationGroupMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _referenceValidatorMock = new Mock<IReferenceValidationService>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();

        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(42);

        _service = new FLatGenerationGroupMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object,
            _referenceValidatorMock.Object,
            _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var id = 1;
        var entity = new FLatGenerationGroupMasterEntity
        {
            Id = id,
            FLatGenerationGroup = "UPPER",
            IsActive = true
        };
        var expectedDto = new FLatGenerationGroupMasterDto
        {
            Id = id,
            FLatGenerationGroup = "UPPER",
            IsActive = true
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _mapperMock.Setup(m => m.Map<FLatGenerationGroupMasterDto>(entity))
            .Returns(expectedDto);

        var result = await _service.GetByIdAsync(id, CancellationToken.None);

        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedDto);
    }

    [Fact]
    public async Task UpdateAsync_WhenDeactivatingAndReferenced_ThrowsValidationException()
    {
        var id = 1;
        var existingEntity = new FLatGenerationGroupMasterEntity
        {
            Id = id,
            FLatGenerationGroup = "UPPER",
            IsActive = true
        };

        var updateDto = new UpdateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = "UPPER",
            IsActive = false
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mapperMock.Setup(m => m.Map(updateDto, existingEntity))
            .Callback<UpdateFLatGenerationGroupMasterDto, FLatGenerationGroupMasterEntity>((dto, ent) => ent.IsActive = false);

        _referenceValidatorMock.Setup(v => v.ValidateReferencesAsync<FLatGenerationGroupMasterEntity>(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate group referenced by active floors."));

        var act = async () => await _service.UpdateAsync(id, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*deactivate*");
    }

    [Fact]
    public async Task DeleteAsync_WhenReferenced_ThrowsValidationException()
    {
        var id = 1;
        var entity = new FLatGenerationGroupMasterEntity
        {
            Id = id,
            FLatGenerationGroup = "UPPER",
            IsActive = true
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _referenceValidatorMock.Setup(v => v.ValidateReferencesAsync<FLatGenerationGroupMasterEntity>(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete group referenced by active floors."));

        var act = async () => await _service.DeleteAsync(id, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotReferenced_Succeeds()
    {
        var id = 1;
        var entity = new FLatGenerationGroupMasterEntity
        {
            Id = id,
            FLatGenerationGroup = "UPPER",
            IsActive = true
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _referenceValidatorMock.Setup(v => v.ValidateReferencesAsync<FLatGenerationGroupMasterEntity>(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _repositoryMock.Setup(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var result = await _service.DeleteAsync(id, CancellationToken.None);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_PopulatesCreatedByFromCurrentUserService_OverwritesClientValue()
    {
        var createDto = new CreateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = "UPPER",
            CreatedBy = 999 // Client-supplied spoofed ID
        };

        var entity = new FLatGenerationGroupMasterEntity { Id = 1, FLatGenerationGroup = "UPPER" };
        var resultDto = new FLatGenerationGroupMasterDto { Id = 1, FLatGenerationGroup = "UPPER" };

        _mapperMock.Setup(m => m.Map<FLatGenerationGroupMasterEntity>(createDto))
            .Callback<object>(dto =>
            {
                var d = (CreateFLatGenerationGroupMasterDto)dto;
                // Verify that CreatedBy was overwritten with 42 (from CurrentUserService)
                d.CreatedBy.Should().Be(42);
            })
            .Returns(entity);

        _repositoryMock.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _mapperMock.Setup(m => m.Map<FLatGenerationGroupMasterDto>(entity))
            .Returns(resultDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        createDto.CreatedBy.Should().Be(42);
        _currentUserServiceMock.Verify(u => u.GetCurrentUserId(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_PopulatesUpdatedByFromCurrentUserService_OverwritesClientValue()
    {
        var id = 1;
        var updateDto = new UpdateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = "UPPER_MODIFIED",
            UpdatedBy = 999 // Client-supplied spoofed ID
        };

        var existingEntity = new FLatGenerationGroupMasterEntity { Id = id, FLatGenerationGroup = "UPPER", IsActive = true };
        var resultDto = new FLatGenerationGroupMasterDto { Id = id, FLatGenerationGroup = "UPPER_MODIFIED" };

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mapperMock.Setup(m => m.Map(updateDto, existingEntity))
            .Callback<object, object>((dto, ent) =>
            {
                var d = (UpdateFLatGenerationGroupMasterDto)dto;
                // Verify that UpdatedBy was overwritten with 42 (from CurrentUserService)
                d.UpdatedBy.Should().Be(42);
            });

        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _mapperMock.Setup(m => m.Map<FLatGenerationGroupMasterDto>(existingEntity))
            .Returns(resultDto);

        var result = await _service.UpdateAsync(id, updateDto, CancellationToken.None);

        result.Should().NotBeNull();
        updateDto.UpdatedBy.Should().Be(42);
        _currentUserServiceMock.Verify(u => u.GetCurrentUserId(), Times.Once);
    }
}
