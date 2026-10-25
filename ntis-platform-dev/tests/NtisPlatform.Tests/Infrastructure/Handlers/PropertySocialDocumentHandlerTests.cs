using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Services.Handlers;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.Handlers;

public class PropertySocialDocumentHandlerTests
{
    private readonly Mock<IRepository<PropertySocialDocumentEntity>> _mockRepository;
    private readonly Mock<IRepository<PropertySocialDetailsEntity>> _mockDetailsRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ILogger<PropertySocialDocumentHandler>> _mockLogger;
    private readonly PropertySocialDocumentHandler _handler;

    public PropertySocialDocumentHandlerTests()
    {
        _mockRepository = new Mock<IRepository<PropertySocialDocumentEntity>>();
        _mockDetailsRepository = new Mock<IRepository<PropertySocialDetailsEntity>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockLogger = new Mock<ILogger<PropertySocialDocumentHandler>>();

        _handler = new PropertySocialDocumentHandler(
            _mockRepository.Object,
            _mockDetailsRepository.Object,
            _mockUnitOfWork.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void ReferenceTableName_ShouldBePropertySocialDocument()
    {
        Assert.Equal("PropertySocialDocument", _handler.ReferenceTableName);
    }

    [Theory]
    [InlineData("PropertySocialDocument", true)]
    [InlineData("PTIS.PropertySocialDocument", true)]
    [InlineData("propertysocialdocument", true)]
    [InlineData("InvalidName", false)]
    [InlineData("", false)]
    public void Handles_ShouldReturnExpectedResult(string tableName, bool expected)
    {
        var result = _handler.Handles(tableName);
        Assert.Equal(expected, result);
    }

    [Fact]
    public async Task ReferenceExistsAsync_ShouldReturnTrue_WhenExists()
    {
        // Arrange
        var details = new List<PropertySocialDetailsEntity>
        {
            new PropertySocialDetailsEntity { Id = 1, MarkedForDeletion = false }
        };
        var mockQueryable = details.BuildMockDbSet().Object;
        _mockDetailsRepository.Setup(r => r.GetQueryable()).Returns(mockQueryable);

        // Act
        var result = await _handler.ReferenceExistsAsync(1, CancellationToken.None);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ReferenceExistsAsync_ShouldReturnFalse_WhenNotExists()
    {
        // Arrange
        var details = new List<PropertySocialDetailsEntity>
        {
            new PropertySocialDetailsEntity { Id = 1, MarkedForDeletion = true } // Deleted
        };
        var mockQueryable = details.BuildMockDbSet().Object;
        _mockDetailsRepository.Setup(r => r.GetQueryable()).Returns(mockQueryable);

        // Act
        var result = await _handler.ReferenceExistsAsync(1, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task OnAfterUploadAsync_ShouldUpdateExistingEntity_WhenEntityExists()
    {
        // Arrange
        var existingEntity = new PropertySocialDocumentEntity
        {
            Id = 1,
            PropertySocialDetailsId = 10,
            MarkedForDeletion = false,
            DocumentBindingId = 5
        };
        var entities = new List<PropertySocialDocumentEntity> { existingEntity };
        var mockQueryable = entities.BuildMockDbSet().Object;
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQueryable);

        // Act
        await _handler.OnAfterUploadAsync(
            documentId: 100,
            bindingId: 20,
            referenceTableId: 10,
            uploadedBy: 2,
            CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.UpdateAsync(It.Is<PropertySocialDocumentEntity>(e => 
            e.Id == 1 &&
            e.DocumentBindingId == 20 &&
            e.UpdatedBy == 2), It.IsAny<CancellationToken>()), Times.Once);
            
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<PropertySocialDocumentEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task OnAfterUploadAsync_ShouldAddNewEntity_WhenNoEntityExists()
    {
        // Arrange
        var entities = new List<PropertySocialDocumentEntity>();
        var mockQueryable = entities.BuildMockDbSet().Object;
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQueryable);

        // Act
        await _handler.OnAfterUploadAsync(
            documentId: 100,
            bindingId: 20,
            referenceTableId: 10,
            uploadedBy: 2,
            CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.AddAsync(It.Is<PropertySocialDocumentEntity>(e => 
            e.PropertySocialDetailsId == 10 &&
            e.DocumentBindingId == 20 &&
            e.IsActive == true &&
            e.MarkedForDeletion == false &&
            e.CreatedBy == 2), It.IsAny<CancellationToken>()), Times.Once);

        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<PropertySocialDocumentEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task OnBeforeDeleteAsync_ShouldDoNothing_WhenReferenceTableIdIsNull()
    {
        // Arrange
        var binding = new DocumentBindingEntity { Id = 1, ReferenceTableId = null };

        // Act
        await _handler.OnBeforeDeleteAsync(binding, 2, CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.GetQueryable(), Times.Never);
    }

    [Fact]
    public async Task OnBeforeDeleteAsync_ShouldDoNothing_WhenReferenceTableIdIsZero()
    {
        // Arrange
        var binding = new DocumentBindingEntity { Id = 1, ReferenceTableId = 0 };

        // Act
        await _handler.OnBeforeDeleteAsync(binding, 2, CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.GetQueryable(), Times.Never);
    }

    [Fact]
    public async Task OnBeforeDeleteAsync_ShouldUpdateEntity_WhenFound()
    {
        // Arrange
        var binding = new DocumentBindingEntity { Id = 5, ReferenceTableId = 10 };
        var existingEntity = new PropertySocialDocumentEntity
        {
            Id = 1,
            DocumentBindingId = 5,
            MarkedForDeletion = false,
            IsActive = true
        };
        var entities = new List<PropertySocialDocumentEntity> { existingEntity };
        var mockQueryable = entities.BuildMockDbSet().Object;
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQueryable);

        // Act
        await _handler.OnBeforeDeleteAsync(binding, 2, CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.UpdateAsync(It.Is<PropertySocialDocumentEntity>(e => 
            e.Id == 1 &&
            e.IsActive == false &&
            e.MarkedForDeletion == true &&
            e.UpdatedBy == 2), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task OnBeforeDeleteAsync_ShouldDoNothing_WhenEntityNotFound()
    {
        // Arrange
        var binding = new DocumentBindingEntity { Id = 5, ReferenceTableId = 10 };
        var entities = new List<PropertySocialDocumentEntity>();
        var mockQueryable = entities.BuildMockDbSet().Object;
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQueryable);

        // Act
        await _handler.OnBeforeDeleteAsync(binding, 2, CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<PropertySocialDocumentEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
