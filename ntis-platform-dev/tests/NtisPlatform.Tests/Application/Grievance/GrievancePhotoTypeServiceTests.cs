using AutoMapper;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using NtisPlatform.Application.Models;
using System.Reflection;

namespace NtisPlatform.Tests.Application.Grievance
{
    public class GrievancePhotoTypeServiceTests
    {
        private readonly Mock<IRepository<GrievancePhotoTypeEntity, int>> _mockRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IMapper> _mockMapper;
        private readonly GrievancePhotoTypeService _service;

        public GrievancePhotoTypeServiceTests()
        {
            _mockRepo = new Mock<IRepository<GrievancePhotoTypeEntity, int>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _service = new GrievancePhotoTypeService(_mockRepo.Object, _mockUnitOfWork.Object, _mockMapper.Object);
        }

        [Fact]
        public async Task ValidateForCreateAsync_ReturnsFailure_WhenCodeExists()
        {
            // Arrange
            var data = new List<GrievancePhotoTypeEntity>
            {
                new GrievancePhotoTypeEntity { Id = 1, PhotoTypeName = "Test1", PhotoTypeCode = "DUPLICATE" }
            }.AsQueryable();

            _mockRepo.Setup(r => r.GetQueryable()).Returns(data);

            var entityToCreate = new GrievancePhotoTypeEntity { PhotoTypeCode = "duplicate" };

            // Act - call protected method via reflection
            var method = typeof(GrievancePhotoTypeService).GetMethod("ValidateForCreateAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
            var task = (Task<ValidationResult>)method.Invoke(_service, new object[] { entityToCreate, CancellationToken.None })!;
            var result = await task;

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal("Photo type code must be unique.", result.Errors[0].ErrorMessage);
        }

        [Fact]
        public async Task ValidateForCreateAsync_ReturnsSuccess_WhenCodeIsUnique()
        {
            // Arrange
            var data = new List<GrievancePhotoTypeEntity>
            {
                new GrievancePhotoTypeEntity { Id = 1, PhotoTypeName = "Test1", PhotoTypeCode = "OTHER" }
            }.AsQueryable();

            _mockRepo.Setup(r => r.GetQueryable()).Returns(data);

            var entityToCreate = new GrievancePhotoTypeEntity { PhotoTypeCode = "UNIQUE" };

            // Act
            var method = typeof(GrievancePhotoTypeService).GetMethod("ValidateForCreateAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
            var task = (Task<ValidationResult>)method.Invoke(_service, new object[] { entityToCreate, CancellationToken.None })!;
            var result = await task;

            // Assert
            Assert.True(result.IsValid);
        }
    }
}
