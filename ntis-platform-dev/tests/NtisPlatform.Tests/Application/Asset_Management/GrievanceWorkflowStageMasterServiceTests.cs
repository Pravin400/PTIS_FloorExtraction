using AutoMapper;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Application.Asset_Management
{
    public class GrievanceWorkflowStageMasterServiceTests
    {
        private readonly Mock<IRepository<GrievanceWorkflowStageMasterEntity, int>> _mockStageRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
        private readonly GrievanceWorkflowStageMasterService _service;

        public GrievanceWorkflowStageMasterServiceTests()
        {
            _mockStageRepo = new Mock<IRepository<GrievanceWorkflowStageMasterEntity, int>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _mockReferenceValidator = new Mock<IReferenceValidationService>();

            _mockUnitOfWork
                .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            _service = new GrievanceWorkflowStageMasterService(
                _mockStageRepo.Object,
                _mockUnitOfWork.Object,
                _mockMapper.Object,
                _mockReferenceValidator.Object);
        }

        [Fact]
        public async Task GetStagesByUlbTypeAsync_ValidUlbTypeId_ReturnsOrderedActiveStages()
        {
            // Arrange
            int ulbTypeId = 1;
            var stages = new List<GrievanceWorkflowStageMasterEntity>
            {
                new() { Id = 2, UlbTypeId = 1, StageCode = "REVIEW", StageName = "Review", StageOrder = 2, Status = "PENDING_REVIEW", IsActive = true, MarkedForDeletion = false },
                new() { Id = 1, UlbTypeId = 1, StageCode = "SUBMITTED", StageName = "Submitted", StageOrder = 1, Status = "NEW", IsActive = true, MarkedForDeletion = false },
                new() { Id = 3, UlbTypeId = 1, StageCode = "DELETED", StageName = "Deleted", StageOrder = 3, Status = "CANCELLED", IsActive = true, MarkedForDeletion = true },
                new() { Id = 4, UlbTypeId = 2, StageCode = "OTHER_ULB", StageName = "Other", StageOrder = 1, Status = "NEW", IsActive = true, MarkedForDeletion = false }
            };

            _mockStageRepo.Setup(r => r.GetQueryable()).Returns(stages.BuildMock());

            _mockMapper.Setup(m => m.Map<List<GrievanceWorkflowStageMasterDto>>(It.IsAny<List<GrievanceWorkflowStageMasterEntity>>()))
                .Returns((List<GrievanceWorkflowStageMasterEntity> src) =>
                    src.Select(e => new GrievanceWorkflowStageMasterDto
                    {
                        Id = e.Id,
                        UlbTypeId = e.UlbTypeId,
                        StageCode = e.StageCode,
                        StageName = e.StageName,
                        StageOrder = e.StageOrder,
                        Status = e.Status
                    }).ToList());

            // Act
            var result = await _service.GetStagesByUlbTypeAsync(ulbTypeId);

            // Assert
            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Equal(2, list.Count);
            Assert.Equal("SUBMITTED", list[0].StageCode);
            Assert.Equal("REVIEW", list[1].StageCode);
        }

        [Fact]
        public async Task GetStagesByUlbTypeAsync_InvalidUlbTypeId_ThrowsArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _service.GetStagesByUlbTypeAsync(0));
            await Assert.ThrowsAsync<ArgumentException>(() => _service.GetStagesByUlbTypeAsync(-1));
        }

        [Fact]
        public async Task CreateAsync_NullDto_ThrowsArgumentNullException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateAsync(null!));
        }

        [Fact]
        public async Task CreateAsync_DuplicateStageCodeInSameUlbType_ThrowsValidationException()
        {
            // Arrange
            var existingStages = new List<GrievanceWorkflowStageMasterEntity>
            {
                new() { Id = 1, UlbTypeId = 1, StageCode = "CORRECTION", StageName = "Correction", StageOrder = 1, Status = "OPEN", IsActive = true, MarkedForDeletion = false }
            };
            _mockStageRepo.Setup(r => r.GetQueryable()).Returns(existingStages.BuildMock());

            var createDto = new CreateGrievanceWorkflowStageMasterDto
            {
                UlbTypeId = 1,
                StageCode = "CORRECTION",
                StageName = "Duplicate Correction",
                StageOrder = 2,
                Status = "OPEN"
            };

            var entityToCreate = new GrievanceWorkflowStageMasterEntity
            {
                UlbTypeId = 1,
                StageCode = "CORRECTION",
                StageName = "Duplicate Correction",
                StageOrder = 2,
                Status = "OPEN"
            };

            _mockMapper.Setup(m => m.Map<GrievanceWorkflowStageMasterEntity>(createDto))
                .Returns(entityToCreate);

            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        }

        [Fact]
        public async Task CreateAsync_ValidDto_SuccessfullyCreatesStage()
        {
            // Arrange
            var existingStages = new List<GrievanceWorkflowStageMasterEntity>();
            _mockStageRepo.Setup(r => r.GetQueryable()).Returns(existingStages.BuildMock());

            var createDto = new CreateGrievanceWorkflowStageMasterDto
            {
                UlbTypeId = 1,
                StageCode = "RESOLVED",
                StageName = "Resolved",
                StageOrder = 3,
                Status = "CLOSED"
            };

            var entity = new GrievanceWorkflowStageMasterEntity
            {
                Id = 10,
                UlbTypeId = 1,
                StageCode = "RESOLVED",
                StageName = "Resolved",
                StageOrder = 3,
                Status = "CLOSED"
            };

            _mockMapper.Setup(m => m.Map<GrievanceWorkflowStageMasterEntity>(createDto)).Returns(entity);
            _mockMapper.Setup(m => m.Map<GrievanceWorkflowStageMasterDto>(entity)).Returns(new GrievanceWorkflowStageMasterDto
            {
                Id = 10,
                UlbTypeId = 1,
                StageCode = "RESOLVED",
                StageName = "Resolved",
                StageOrder = 3,
                Status = "CLOSED"
            });

            _mockStageRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>()))
                .ReturnsAsync(entity);

            // Act
            var result = await _service.CreateAsync(createDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("RESOLVED", result.StageCode);
            Assert.Equal("CLOSED", result.Status);
        }

        [Fact]
        public async Task CreateAsync_DuplicateStageNameInSameUlbType_ThrowsValidationException()
        {
            // Arrange
            var existingStages = new List<GrievanceWorkflowStageMasterEntity>
            {
                new() { Id = 1, UlbTypeId = 1, StageCode = "CORRECTION", StageName = "Correction / Data Entry", StageOrder = 1, IsActive = true, MarkedForDeletion = false }
            };
            _mockStageRepo.Setup(r => r.GetQueryable()).Returns(existingStages.BuildMock());

            var createDto = new CreateGrievanceWorkflowStageMasterDto
            {
                UlbTypeId = 1,
                StageCode = "NEW_CORRECTION",
                StageName = "Correction / Data Entry",
                StageOrder = 2
            };

            var entityToCreate = new GrievanceWorkflowStageMasterEntity
            {
                UlbTypeId = 1,
                StageCode = "NEW_CORRECTION",
                StageName = "Correction / Data Entry",
                StageOrder = 2
            };

            _mockMapper.Setup(m => m.Map<GrievanceWorkflowStageMasterEntity>(createDto))
                .Returns(entityToCreate);

            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        }

        [Fact]
        public async Task CreateAsync_DuplicateStageOrderInSameUlbType_ThrowsValidationException()
        {
            // Arrange - UlbTypeId=1 already has StageOrder=1
            var existingStages = new List<GrievanceWorkflowStageMasterEntity>
            {
                new() { Id = 1, UlbTypeId = 1, StageCode = "CORRECTION", StageName = "Correction / Data Entry", StageOrder = 1, IsActive = true, MarkedForDeletion = false }
            };
            _mockStageRepo.Setup(r => r.GetQueryable()).Returns(existingStages.BuildMock());

            var createDto = new CreateGrievanceWorkflowStageMasterDto
            {
                UlbTypeId = 1,
                StageCode = "ANOTHER_STAGE",
                StageName = "Another Unique Name",
                StageOrder = 1 // Duplicate StageOrder for UlbTypeId = 1
            };

            var entityToCreate = new GrievanceWorkflowStageMasterEntity
            {
                UlbTypeId = 1,
                StageCode = "ANOTHER_STAGE",
                StageName = "Another Unique Name",
                StageOrder = 1
            };

            _mockMapper.Setup(m => m.Map<GrievanceWorkflowStageMasterEntity>(createDto))
                .Returns(entityToCreate);

            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        }

        [Fact]
        public async Task UpdateAsync_DuplicateStageOrderInSameUlbType_ThrowsValidationException()
        {
            // Arrange - UlbTypeId=1 has Stage 1 with StageOrder=1, and Stage 2 with StageOrder=2
            var existingStages = new List<GrievanceWorkflowStageMasterEntity>
            {
                new() { Id = 1, UlbTypeId = 1, StageCode = "CORRECTION", StageName = "Correction / Data Entry", StageOrder = 1, IsActive = true, MarkedForDeletion = false },
                new() { Id = 2, UlbTypeId = 1, StageCode = "VERIFICATION", StageName = "Field Verification", StageOrder = 2, IsActive = true, MarkedForDeletion = false }
            };
            _mockStageRepo.Setup(r => r.GetQueryable()).Returns(existingStages.BuildMock());
            _mockStageRepo.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existingStages[1]);

            var updateDto = new UpdateGrievanceWorkflowStageMasterDto
            {
                UlbTypeId = 1,
                StageCode = "VERIFICATION",
                StageName = "Field Verification",
                StageOrder = 1 // Attempting to change Stage 2's order to 1 (which already belongs to Stage 1)
            };

            _mockMapper.Setup(m => m.Map(updateDto, existingStages[1]))
                .Callback<UpdateGrievanceWorkflowStageMasterDto, GrievanceWorkflowStageMasterEntity>((dto, ent) =>
                {
                    ent.UlbTypeId = dto.UlbTypeId;
                    ent.StageCode = dto.StageCode;
                    ent.StageName = dto.StageName;
                    ent.StageOrder = dto.StageOrder;
                });

            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto));
        }
    }
}
