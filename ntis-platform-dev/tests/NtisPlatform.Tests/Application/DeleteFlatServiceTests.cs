using FluentAssertions;
using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.DeleteFlat;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class DeleteFlatServiceTests
{
    private readonly Mock<ILogger<DeleteFlatService>> _loggerMock;
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepositoryMock;
    private readonly Mock<IRepository<WingDetailsMastEntity, int>> _wingDetailsRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly DeleteFlatService _service;

    public DeleteFlatServiceTests()
    {
        _loggerMock = new Mock<ILogger<DeleteFlatService>>();
        _propertyRepositoryMock = new Mock<IRepository<PropertyEntity, int>>();
        _wingDetailsRepositoryMock = new Mock<IRepository<WingDetailsMastEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();

        _service = new DeleteFlatService(
            _loggerMock.Object,
            _propertyRepositoryMock.Object,
            _wingDetailsRepositoryMock.Object,
            _unitOfWorkMock.Object);

        // Default UnitOfWork setup
        _unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    private static PropertyTypeMasterEntity CreateValidPropertyTypeMaster() => new()
    {
        PartType = "Flat"
    };

    [Fact]
    public async Task SoftDeleteFlatAsync_InvalidFilterType_ThrowsValidationException()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = "InvalidFilterType",
            FilterValue = 10
        };

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        var ex = (await act.Should().ThrowAsync<ValidationException>()).Which;
        ex.Errors.Should().ContainKey("filterType");
        ex.Message.Should().Contain("Filter type 'InvalidFilterType' is not supported.");
        ex.OperationType.Should().Be(OperationType.Delete);
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_PropertyWise_PropertyNotFound_ThrowsValidationException()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.PropertyWise,
            FilterValue = 999
        };

        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity>().BuildMock());

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        var ex = (await act.Should().ThrowAsync<ValidationException>()).Which;
        ex.Errors.Should().ContainKey("Property");
        ex.Message.Should().Contain("The requested active Flat was not found or is not eligible for deletion.");
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_PropertyWise_NoWingDetailId_ThrowsValidationException()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.PropertyWise,
            FilterValue = 1
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = null,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            }
        };

        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        var ex = (await act.Should().ThrowAsync<ValidationException>()).Which;
        ex.Errors.Should().ContainKey("Property");
        ex.Message.Should().Contain("This property does not belong to any wing and cannot be deleted.");
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_PropertyWise_NotLastPropertyInWing_ThrowsValidationException()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.PropertyWise,
            FilterValue = 1
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = 10,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            },
            new()
            {
                Id = 2,
                WingDetailId = 10,
                PartitionNo = "102",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            }
        };

        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        var ex = (await act.Should().ThrowAsync<ValidationException>()).Which;
        ex.Errors.Should().ContainKey("Property");
        ex.Message.Should().Contain("Property 101 cannot be deleted because it is not the last property in the wing.");
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_PropertyWise_IsLastPropertyInWing_DeletesSuccessfully()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.PropertyWise,
            FilterValue = 2
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = 10,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            },
            new()
            {
                Id = 2,
                WingDetailId = 10,
                PartitionNo = "102",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            }
        };

        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        // Act
        var result = await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("1 Flat deleted successfully.");
        result.DeletedCount.Should().Be(1);
        result.AffectedPropertyIds.Should().ContainSingle(id => id == 2);

        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_WingWise_ValidWing_DeletesSuccessfully()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.WingWise,
            FilterValue = 10
        };

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 10, IsActive = true, MarkedForDeletion = false }
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = 10,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            }
        };

        _wingDetailsRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(wings.BuildMock());
        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        // Act
        var result = await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("1 Flat deleted successfully.");
        result.DeletedCount.Should().Be(1);

        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_SocietyWise_ValidSociety_DeletesSuccessfully()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.SocietyWise,
            FilterValue = 100
        };

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 10, SocietyDetailsMastId = 100, IsActive = true, MarkedForDeletion = false }
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = 10,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            }
        };

        _wingDetailsRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(wings.BuildMock());
        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        // Act
        var result = await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("1 Flat deleted successfully.");
        result.DeletedCount.Should().Be(1);

        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_SurveyVerified_ThrowsValidationException()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.WingWise,
            FilterValue = 10
        };

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 10, IsActive = true, MarkedForDeletion = false }
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = 10,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster(),
                WorkflowHistory = new List<PropertyWorkflowDetailsEntity>
                {
                    new()
                    {
                        IsActive = true,
                        PropertySurveyVisits = new List<PropertySurveyVisitEntity>
                        {
                            new() { IsActive = true, InternalSurveyVerified = true }
                        }
                    }
                }
            }
        };

        _wingDetailsRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(wings.BuildMock());
        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        var ex = (await act.Should().ThrowAsync<ValidationException>()).Which;
        ex.Errors.Should().ContainKey("Survey");
        ex.Message.Should().Contain("Properties cannot be deleted because internal survey is verified.");
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_SubmissionComplete_ThrowsValidationException()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.WingWise,
            FilterValue = 10
        };

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 10, IsActive = true, MarkedForDeletion = false }
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = 10,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster(),
                PropertyDetails = new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        IsActive = true,
                        MarkedForDeletion = false,
                        CarpetAreaSqMeter = 50.0,
                        BuiltupAreaSqMeter = 60.0
                    }
                }
            }
        };

        _wingDetailsRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(wings.BuildMock());
        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        var ex = (await act.Should().ThrowAsync<ValidationException>()).Which;
        ex.Errors.Should().ContainKey("Submission");
        ex.Message.Should().Contain("Properties cannot be deleted because submission is completed.");
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_NoMatchingPropertiesFound_ThrowsValidationException()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.WingWise,
            FilterValue = 999
        };

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 999, IsActive = true, MarkedForDeletion = false }
        };

        _wingDetailsRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(wings.BuildMock());
        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity>().BuildMock());

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        var ex = (await act.Should().ThrowAsync<ValidationException>()).Which;
        ex.Errors.Should().ContainKey(FilterTypeConstants.WingWise);
        ex.Message.Should().Contain("flat not found");
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_OnException_RollsBackTransactionAndRethrows()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = FilterTypeConstants.WingWise,
            FilterValue = 10
        };

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 10, IsActive = true, MarkedForDeletion = false }
        };

        var properties = new List<PropertyEntity>
        {
            new()
            {
                Id = 1,
                WingDetailId = 10,
                PartitionNo = "101",
                IsActive = true,
                MarkedForDeletion = false,
                PropertyTypeMaster = CreateValidPropertyTypeMaster()
            }
        };

        _wingDetailsRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(wings.BuildMock());
        _propertyRepositoryMock.Setup(r => r.GetQueryable())
            .Returns(properties.BuildMock());

        _unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Database connection error"));

        // Act
        Func<Task> act = async () => await _service.SoftDeleteFlatAsync(requestDto, 1);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();

        _unitOfWorkMock.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
