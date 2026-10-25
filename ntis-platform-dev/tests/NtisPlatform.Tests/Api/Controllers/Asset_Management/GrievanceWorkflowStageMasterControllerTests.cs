using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Asset_Management
{
    public class GrievanceWorkflowStageMasterControllerTests
    {
        private static GrievanceWorkflowStageMasterController Create(
            out Mock<IGrievanceWorkflowStageMasterService> service,
            out Mock<IHardDeleteCleanupService> cleanupService,
            out Mock<IReferenceValidationService> referenceValidationService)
        {
            service = new Mock<IGrievanceWorkflowStageMasterService>();
            cleanupService = new Mock<IHardDeleteCleanupService>();
            referenceValidationService = new Mock<IReferenceValidationService>();
            var logger = new Mock<ILogger<GrievanceWorkflowStageMasterController>>();

            return new GrievanceWorkflowStageMasterController(
                service.Object,
                cleanupService.Object,
                referenceValidationService.Object,
                logger.Object);
        }

        [Fact]
        public async Task GetAll_ReturnsOk()
        {
            var controller = Create(out var service, out _, out _);
            var query = new GrievanceWorkflowStageQueryParameters();

            service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PagedResult<GrievanceWorkflowStageMasterDto>(new List<GrievanceWorkflowStageMasterDto>(), 0, 1, 10));

            var result = await controller.GetAll(query, CancellationToken.None);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetById_ExistingId_ReturnsOk()
        {
            var controller = Create(out var service, out _, out _);
            service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new GrievanceWorkflowStageMasterDto { Id = 1, StageCode = "CORRECTION" });

            var result = await controller.GetById(1, CancellationToken.None);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetById_NonExistingId_ReturnsNotFound()
        {
            var controller = Create(out var service, out _, out _);
            service.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((GrievanceWorkflowStageMasterDto?)null);

            var result = await controller.GetById(999, CancellationToken.None);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GetStagesByUlbType_ValidUlbTypeId_ReturnsOkWithStages()
        {
            var controller = Create(out var service, out _, out _);
            var stages = new List<GrievanceWorkflowStageMasterDto>
            {
                new() { Id = 1, UlbTypeId = 1, StageCode = "CORRECTION", StageOrder = 1 }
            };

            service.Setup(s => s.GetStagesByUlbTypeAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(stages);

            var result = await controller.GetStagesByUlbType(1, CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<ApiResponse<List<GrievanceWorkflowStageMasterDto>>>(okResult.Value);
            Assert.True(response.Success);
            Assert.NotNull(response.Items);
            Assert.Single(response.Items);
        }

        [Fact]
        public async Task GetStagesByUlbType_InvalidUlbTypeId_ReturnsBadRequest()
        {
            var controller = Create(out _, out _, out _);

            var result = await controller.GetStagesByUlbType(0, CancellationToken.None);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<ApiResponse<List<GrievanceWorkflowStageMasterDto>>>(badRequest.Value);
            Assert.False(response.Success);
        }

        [Fact]
        public async Task Create_ReturnsOk()
        {
            var controller = Create(out var service, out _, out _);
            var dto = new CreateGrievanceWorkflowStageMasterDto
            {
                UlbTypeId = 1,
                StageCode = "CORRECTION",
                StageName = "Correction",
                StageOrder = 1,
                Status = "OPEN"
            };

            service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new GrievanceWorkflowStageMasterDto { Id = 1, StageCode = "CORRECTION" });

            var result = await controller.Create(dto, CancellationToken.None);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Update_ExistingId_ReturnsOk()
        {
            var controller = Create(out var service, out _, out _);
            var dto = new UpdateGrievanceWorkflowStageMasterDto
            {
                UlbTypeId = 1,
                StageCode = "CORRECTION",
                StageName = "Updated Correction",
                StageOrder = 1,
                Status = "OPEN"
            };

            service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new GrievanceWorkflowStageMasterDto { Id = 1, StageCode = "CORRECTION" });

            var result = await controller.Update(1, dto, CancellationToken.None);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Delete_ExistingId_ReturnsOk()
        {
            var controller = Create(out var service, out _, out _);

            service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var result = await controller.Delete(1, CancellationToken.None);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ForceHardDelete_ReturnsOk()
        {
            var controller = Create(out _, out var cleanupService, out var refValService);
            refValService.Setup(r => r.ValidateReferencesAsync<GrievanceWorkflowStageMasterEntity>(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(ValidationResult.Success());
            cleanupService.Setup(c => c.ForceHardDeleteAsync<GrievanceWorkflowStageMasterEntity, int>(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var result = await controller.ForceHardDelete(1, CancellationToken.None);
            Assert.IsType<OkObjectResult>(result);
        }
    }
}
