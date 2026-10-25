using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Core.Entities;
using NtisPlatform.Infrastructure.Services.Handlers;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.Services.Handlers;

public class PtisDocumentAuthorizationHandlerTests
{
    private const int PtisDepartmentId = 1;
    private readonly Mock<ILogger<PtisDocumentAuthorizationHandler>> _mockLogger;
    private readonly PtisDocumentAuthorizationHandler _handler;

    public PtisDocumentAuthorizationHandlerTests()
    {
        _mockLogger = new Mock<ILogger<PtisDocumentAuthorizationHandler>>();
        _handler = new PtisDocumentAuthorizationHandler(PtisDepartmentId, _mockLogger.Object);
    }

    [Fact]
    public async Task CanAccessAsync_ReturnsTrue_ForAuthenticatedUser_WithValidBinding()
    {
        // Arrange: User B (userId = 42) accessing property photo document
        var binding = new DocumentBindingEntity
        {
            Id = 10,
            DocumentId = 100,
            DepartmentId = PtisDepartmentId,
            AuthDepartmentId = PtisDepartmentId,
            AuthReferenceId = 5001, // PropertyId
            ReferenceTableName = "PropertyPhoto",
            ReferenceTableId = 10,
            ReferencePropertyName = "Id",
            IsActive = true
        };

        // Act
        var result = await _handler.CanAccessAsync(binding, userId: 42, CancellationToken.None);

        // Assert: Authenticated user can view/read property documents
        Assert.True(result);
    }

    [Fact]
    public async Task CanAccessAsync_ReturnsFalse_WhenUserIdIsInvalid()
    {
        // Arrange
        var binding = new DocumentBindingEntity
        {
            Id = 10,
            AuthDepartmentId = PtisDepartmentId,
            AuthReferenceId = 5001,
            IsActive = true
        };

        // Act
        var result = await _handler.CanAccessAsync(binding, userId: 0, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task CanAccessAsync_ReturnsFalse_WhenDepartmentDoesNotMatch()
    {
        // Arrange: Binding is for a different department (e.g., DeptId = 2)
        var binding = new DocumentBindingEntity
        {
            Id = 10,
            AuthDepartmentId = 999,
            AuthReferenceId = 5001,
            IsActive = true
        };

        // Act
        var result = await _handler.CanAccessAsync(binding, userId: 42, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task CanAccessAsync_ReturnsFalse_WhenPropertyIdIsMissing()
    {
        // Arrange: Binding missing AuthReferenceId and ReferenceTableId
        var binding = new DocumentBindingEntity
        {
            Id = 10,
            AuthDepartmentId = PtisDepartmentId,
            AuthReferenceId = null,
            ReferenceTableId = null,
            IsActive = true
        };

        // Act
        var result = await _handler.CanAccessAsync(binding, userId: 42, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task CanModifyAsync_ReturnsFalse_ForNonUploader()
    {
        // Arrange
        var binding = new DocumentBindingEntity
        {
            Id = 10,
            AuthDepartmentId = PtisDepartmentId,
            AuthReferenceId = 5001,
            IsActive = true
        };

        // Act
        var result = await _handler.CanModifyAsync(binding, userId: 42, CancellationToken.None);

        // Assert: Non-uploader cannot modify/delete property documents
        Assert.False(result);
    }
}
