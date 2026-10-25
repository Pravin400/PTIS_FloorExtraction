using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Services.Handlers;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.Services.Handlers
{
    public class GrievancePhotoDocumentBindingHandlerTests
    {
        private readonly Mock<IRepository<GrievancePhotoEntity, int>> _mockPhotoRepo;
        private readonly Mock<ILogger<GrievancePhotoDocumentBindingHandler>> _mockLogger;
        private readonly GrievancePhotoDocumentBindingHandler _handler;

        public GrievancePhotoDocumentBindingHandlerTests()
        {
            _mockPhotoRepo = new Mock<IRepository<GrievancePhotoEntity, int>>();
            _mockLogger = new Mock<ILogger<GrievancePhotoDocumentBindingHandler>>();
            _handler = new GrievancePhotoDocumentBindingHandler(_mockPhotoRepo.Object, _mockLogger.Object);
        }

        [Fact]
        public void Handles_ReturnsTrue_ForGrievancePhoto()
        {
            // Act
            var result = _handler.Handles("GrievancePhoto");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void Handles_ReturnsFalse_ForOtherTables()
        {
            // Act
            var result = _handler.Handles("SomeOtherTable");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task ReferenceExistsAsync_ReturnsTrue_WhenPhotoExists()
        {
            // Arrange
            _mockPhotoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(GrievancePhotoEntity.Create(1, 1, ""));

            // Act
            var result = await _handler.ReferenceExistsAsync(1, CancellationToken.None);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task ReferenceExistsAsync_ReturnsFalse_WhenPhotoDoesNotExist()
        {
            // Arrange
            _mockPhotoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((GrievancePhotoEntity?)null);

            // Act
            var result = await _handler.ReferenceExistsAsync(1, CancellationToken.None);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task OnAfterUploadAsync_LinksDocumentBinding_WhenPhotoExists()
        {
            // Arrange
            var photo = GrievancePhotoEntity.Create(10, 1, "remarks");
            _mockPhotoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(photo);

            // Act
            await _handler.OnAfterUploadAsync(documentId: 100, bindingId: 99, referenceTableId: 1, uploadedBy: 5, CancellationToken.None);

            // Assert
            Assert.Equal(99, photo.DocumentBindingId);
            Assert.Equal(5, photo.UpdatedBy);
            _mockPhotoRepo.Verify(r => r.UpdateAsync(photo, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task OnBeforeDeleteAsync_MarksPhotoForDeletion_WhenPhotoExists()
        {
            // Arrange
            var photo = GrievancePhotoEntity.Create(10, 1, "remarks");
            _mockPhotoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(photo);

            var documentBinding = new DocumentBindingEntity();
            typeof(DocumentBindingEntity).GetProperty("ReferenceTableId")!.SetValue(documentBinding, 1);

            // Act
            await _handler.OnBeforeDeleteAsync(documentBinding, deletedBy: 5, CancellationToken.None);

            // Assert
            Assert.True(photo.MarkedForDeletion);
            Assert.Equal(5, photo.UpdatedBy);
            _mockPhotoRepo.Verify(r => r.UpdateAsync(photo, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
