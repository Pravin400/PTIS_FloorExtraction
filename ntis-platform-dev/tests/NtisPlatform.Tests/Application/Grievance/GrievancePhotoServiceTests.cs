using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.DTOs.Grievance;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Application.Services.GrievanceService;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Application.Grievance
{
    public class GrievancePhotoServiceTests
    {
        private readonly Mock<IRepository<GrievancePhotoEntity, int>> _mockPhotoRepo;
        private readonly Mock<IRepository<GrievancePhotoTypeEntity, int>> _mockPhotoTypeRepo;
        private readonly Mock<IRepository<GrievanceApplicationEntity, int>> _mockGrievanceRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IDocumentApplicationService> _mockDocumentService;
        private readonly Mock<IModuleLookupService> _mockModuleLookup;
        private readonly Mock<ILogger<GrievancePhotoService>> _mockLogger;
        private readonly GrievancePhotoService _service;

        public GrievancePhotoServiceTests()
        {
            _mockPhotoRepo = new Mock<IRepository<GrievancePhotoEntity, int>>();
            _mockPhotoTypeRepo = new Mock<IRepository<GrievancePhotoTypeEntity, int>>();
            _mockGrievanceRepo = new Mock<IRepository<GrievanceApplicationEntity, int>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockDocumentService = new Mock<IDocumentApplicationService>();
            _mockModuleLookup = new Mock<IModuleLookupService>();
            _mockLogger = new Mock<ILogger<GrievancePhotoService>>();

            _service = new GrievancePhotoService(
                _mockPhotoRepo.Object,
                _mockPhotoTypeRepo.Object,
                _mockDocumentService.Object,
                _mockModuleLookup.Object,
                _mockGrievanceRepo.Object,
                _mockLogger.Object,
                _mockUnitOfWork.Object);
        }

        [Fact]
        public async Task GetPhotosByGrievanceIdAsync_ReturnsMappedPhotos()
        {
            // Arrange
            var entity = GrievancePhotoEntity.Create(10, 1, "remarks");
            typeof(GrievancePhotoEntity).GetProperty("Id")!.SetValue(entity, 1);
            typeof(GrievancePhotoEntity).GetProperty("PhotoType")!.SetValue(entity, new GrievancePhotoTypeEntity { PhotoTypeName = "Site", PhotoTypeCode = "S" });

            var data = new List<GrievancePhotoEntity> { entity }.BuildMock();

            _mockPhotoRepo.Setup(r => r.GetQueryable()).Returns(data);

            // Act
            var result = await _service.GetPhotosByGrievanceIdAsync(10, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.Equal(1, resultList[0].Id);
            Assert.Equal("Site", resultList[0].PhotoTypeName);
        }

        [Fact]
        public async Task UploadMultiplePhotosAsync_UploadsAndReturnsIds()
        {
            // Arrange
            var mockFile = new Mock<IFormFile>();
            var stream = new MemoryStream();
            mockFile.Setup(f => f.OpenReadStream()).Returns(stream);
            mockFile.Setup(f => f.Length).Returns(100);
            mockFile.Setup(f => f.FileName).Returns("test.jpg");
            mockFile.Setup(f => f.ContentType).Returns("image/jpeg");

            var dto = new UploadMultipleGrievancePhotosDto
            {
                GrievanceApplicationId = 10,
                PhotoTypeId = 1,
                Files = new List<IFormFile> { mockFile.Object }
            };

            _mockPhotoTypeRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new GrievancePhotoTypeEntity { Id = 1, IsActive = true, PhotoTypeCode = "TEST" });

            // Create a minimal mock or object for GrievanceApplicationEntity if possible
            var grievanceEntity = new GrievanceApplicationEntity { CreatedBy = 1 };
            _mockGrievanceRepo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(grievanceEntity);

            _mockModuleLookup.Setup(m => m.GetDepartmentAndModuleAsync("GRV", "GRV_M", It.IsAny<CancellationToken>()))
                .ReturnsAsync((1, 2));

            _mockDocumentService.Setup(d => d.UploadDocumentAsync(
                    It.IsAny<Stream>(), 
                    It.IsAny<string>(), 
                    It.IsAny<string>(), 
                    It.IsAny<long>(), 
                    It.IsAny<DocumentUploadDto>(), 
                    It.IsAny<int>(), 
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DocumentUploadResponseDto { DocumentBindingId = 99 });

            _mockPhotoRepo.Setup(r => r.AddAsync(It.IsAny<GrievancePhotoEntity>(), It.IsAny<CancellationToken>()))
                .Callback<GrievancePhotoEntity, CancellationToken>((e, c) => 
                {
                    typeof(GrievancePhotoEntity).GetProperty("Id")!.SetValue(e, 55);
                })
                .ReturnsAsync(GrievancePhotoEntity.Create(10, 1, ""));

            // Act
            var result = await _service.UploadMultiplePhotosAsync(dto, 1, CancellationToken.None);

            // Assert
            Assert.Single(result);
            Assert.Equal(55, result[0]);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task ViewPhotoAsync_ReturnsStreamAndMetadata()
        {
            // Arrange
            var entity = GrievancePhotoEntity.Create(10, 1, "remarks");
            typeof(GrievancePhotoEntity).GetProperty("Id")!.SetValue(entity, 55);

            var document = new DocumentEntity { DocumentGuid = System.Guid.NewGuid() };
            var documentBinding = new DocumentBindingEntity();
            typeof(DocumentBindingEntity).GetProperty("Document")!.SetValue(documentBinding, document);

            typeof(GrievancePhotoEntity).GetProperty("DocumentBinding")!.SetValue(entity, documentBinding);

            var data = new List<GrievancePhotoEntity> { entity }.BuildMock();
            _mockPhotoRepo.Setup(r => r.GetQueryable()).Returns(data);

            var stream = new MemoryStream();
            _mockDocumentService.Setup(d => d.ViewDocumentAsync(document.DocumentGuid, It.IsAny<CancellationToken>()))
                .ReturnsAsync((stream, "test.jpg", "image/jpeg"));

            // Act
            var result = await _service.ViewPhotoAsync(55, CancellationToken.None);

            // Assert
            Assert.NotNull(result.FileStream);
            Assert.Equal("test.jpg", result.FileName);
            Assert.Equal("image/jpeg", result.MimeType);
        }

        [Fact]
        public async Task UploadPhotoAsync_UploadsAndReturnsId()
        {
            // Arrange
            var mockFile = new Mock<IFormFile>();
            var stream = new MemoryStream();
            mockFile.Setup(f => f.OpenReadStream()).Returns(stream);
            mockFile.Setup(f => f.Length).Returns(100);
            mockFile.Setup(f => f.FileName).Returns("test.jpg");
            mockFile.Setup(f => f.ContentType).Returns("image/jpeg");

            var dto = new UploadGrievancePhotoDto
            {
                GrievanceApplicationId = 10,
                PhotoTypeId = 1,
                Remarks = "test remark",
                File = mockFile.Object
            };

            _mockPhotoTypeRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new GrievancePhotoTypeEntity { Id = 1, IsActive = true, PhotoTypeCode = "TEST" });

            var grievanceEntity = new GrievanceApplicationEntity { CreatedBy = 1 };
            _mockGrievanceRepo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(grievanceEntity);

            _mockModuleLookup.Setup(m => m.GetDepartmentAndModuleAsync("GRV", "GRV_M", It.IsAny<CancellationToken>()))
                .ReturnsAsync((1, 2));

            _mockDocumentService.Setup(d => d.UploadDocumentAsync(
                    It.IsAny<Stream>(), 
                    It.IsAny<string>(), 
                    It.IsAny<string>(), 
                    It.IsAny<long>(), 
                    It.IsAny<DocumentUploadDto>(), 
                    It.IsAny<int>(), 
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DocumentUploadResponseDto { DocumentBindingId = 99 });

            _mockPhotoRepo.Setup(r => r.AddAsync(It.IsAny<GrievancePhotoEntity>(), It.IsAny<CancellationToken>()))
                .Callback<GrievancePhotoEntity, CancellationToken>((e, c) => 
                {
                    typeof(GrievancePhotoEntity).GetProperty("Id")!.SetValue(e, 55);
                })
                .ReturnsAsync(GrievancePhotoEntity.Create(10, 1, ""));

            // Act
            var result = await _service.UploadPhotoAsync(dto, 1, CancellationToken.None);

            // Assert
            Assert.Equal(55, result);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task DeletePhotoAsync_DeletesPhotoAndDocument()
        {
            // Arrange
            var entity = GrievancePhotoEntity.Create(10, 1, "remarks");
            typeof(GrievancePhotoEntity).GetProperty("Id")!.SetValue(entity, 55);
            entity.CreatedBy = 1;

            var document = new DocumentEntity { DocumentGuid = System.Guid.NewGuid() };
            var documentBinding = new DocumentBindingEntity();
            typeof(DocumentBindingEntity).GetProperty("Document")!.SetValue(documentBinding, document);
            typeof(GrievancePhotoEntity).GetProperty("DocumentBinding")!.SetValue(entity, documentBinding);

            var grievanceEntity = new GrievanceApplicationEntity { CreatedBy = 1 };
            _mockGrievanceRepo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(grievanceEntity);

            var data = new List<GrievancePhotoEntity> { entity }.BuildMock();
            _mockPhotoRepo.Setup(r => r.GetQueryable()).Returns(data);

            // Act
            await _service.DeletePhotoAsync(55, 1, CancellationToken.None);

            // Assert
            Assert.True(entity.MarkedForDeletion);
            _mockPhotoRepo.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
            _mockDocumentService.Verify(d => d.DeleteDocumentAsync(document.DocumentGuid, 1, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
