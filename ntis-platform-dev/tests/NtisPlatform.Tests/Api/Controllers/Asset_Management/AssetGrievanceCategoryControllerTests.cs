using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Asset_Management;

public class AssetGrievanceCategoryControllerTests
{
    private static AssetGrievanceCategoryController Create(
        out Mock<IAssetGrievanceCategoryService> service,
        out Mock<IHardDeleteCleanupService> cleanupService,
        out Mock<IReferenceValidationService> referenceValidationService)
    {
        service = new Mock<IAssetGrievanceCategoryService>();
        cleanupService = new Mock<IHardDeleteCleanupService>();
        referenceValidationService = new Mock<IReferenceValidationService>();
        var logger = new Mock<ILogger<AssetGrievanceCategoryController>>();
        return new AssetGrievanceCategoryController(service.Object, cleanupService.Object, referenceValidationService.Object, logger.Object);
    }

    private static AssetGrievanceCategoryDto SampleDto(int id = 1) => new()
    {
        Id = id,
        GrievanceTypeCode = "NAME_CORR",
        GrievanceTypeName = "Owner Name Correction",
        GrievanceTypeNameLocal = "मालकाचे नाव दुरुस्ती",
        Description = "Correction of the owner name on an asset",
        TargetTableName = "AMS.AssetMaster",
        SLADays = 7,
        CodeFormat = "GRV-{YYYY}-{####}",
        DisplaySequence = 1,
        IsActive = true
    };

    private static CreateAssetGrievanceCategoryDto SampleCreateDto() => new()
    {
        GrievanceTypeCode = "NAME_CORR",
        GrievanceTypeName = "Owner Name Correction",
        TargetTableName = "AMS.AssetMaster",
        SLADays = 7,
        CodeFormat = "GRV-{YYYY}-{####}",
        DisplaySequence = 1,
        IsActive = true,
        CreatedBy = 1
    };

    private static UpdateAssetGrievanceCategoryDto SampleUpdateDto() => new()
    {
        GrievanceTypeCode = "NAME_CORR",
        GrievanceTypeName = "Owner Name Correction - Updated",
        TargetTableName = "AMS.AssetMaster",
        SLADays = 5,
        CodeFormat = "GRV-{YYYY}-{####}",
        DisplaySequence = 2,
        IsActive = true,
        UpdatedBy = 1
    };

    #region GET /api/asset-management/asset-grievance-category

    [Fact]
    public async Task GetAll_ReturnsOkWithPagedResult()
    {
        var controller = Create(out var service, out _, out _);
        var query = new AssetGrievanceCategoryQueryParameters();
        var paged = new PagedResult<AssetGrievanceCategoryDto>(new List<AssetGrievanceCategoryDto> { SampleDto() }, 1, 1, 10);
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>())).ReturnsAsync(paged);

        var result = await controller.GetAll(query, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsType<PagedResult<AssetGrievanceCategoryDto>>(ok.Value);
        Assert.Equal(1, body.TotalCount);
        Assert.Equal("NAME_CORR", Assert.Single(body.Items).GrievanceTypeCode);
    }

    [Fact]
    public async Task GetAll_InvalidSortField_ReturnsBadRequest()
    {
        var controller = Create(out var service, out _, out _);
        var query = new AssetGrievanceCategoryQueryParameters { SortBy = "CategoryName" };
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new FilterValidationException("SortBy", "Field 'CategoryName' is not sortable."));

        var result = await controller.GetAll(query, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_UnexpectedError_Returns500()
    {
        var controller = Create(out var service, out _, out _);
        var query = new AssetGrievanceCategoryQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Invalid column name 'CategoryName'."));

        var result = await controller.GetAll(query, CancellationToken.None);

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, error.StatusCode);
    }

    #endregion

    #region GET /api/asset-management/asset-grievance-category/{id}

    [Fact]
    public async Task GetById_ExistingId_ReturnsOkWithDto()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(SampleDto());

        var result = await controller.GetById(1, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<AssetGrievanceCategoryDto>(ok.Value);
        Assert.Equal("NAME_CORR", dto.GrievanceTypeCode);
        Assert.Equal("Owner Name Correction", dto.GrievanceTypeName);
        Assert.Equal("GRV-{YYYY}-{####}", dto.CodeFormat);
        Assert.Equal(7, dto.SLADays);
        Assert.Equal(1, dto.DisplaySequence);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetGrievanceCategoryDto?)null);

        var result = await controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetById_UnexpectedError_Returns500()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var result = await controller.GetById(1, CancellationToken.None);

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, error.StatusCode);
    }

    #endregion

    #region POST /api/asset-management/asset-grievance-category

    [Fact]
    public async Task Create_ValidDto_ReturnsOkWithCreatedRecord()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleCreateDto();
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>())).ReturnsAsync(SampleDto());

        var result = await controller.Create(dto, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetGrievanceCategoryDto>>(ok.Value);
        Assert.True(response.Success);
        Assert.Equal(1, response.Items!.Id);
        Assert.Equal("NAME_CORR", response.Items.GrievanceTypeCode);
    }

    [Fact]
    public async Task Create_UniqueConstraintViolation_ReturnsConflict()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleCreateDto();
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Microsoft.EntityFrameworkCore.DbUpdateException("An error occurred while saving the entity changes.",
                new Exception("Violation of UNIQUE KEY constraint 'UQ_GrievanceCategoryMaster_GrievanceTypeCode_GrievanceTypeName'.")));

        var result = await controller.Create(dto, CancellationToken.None);

        var conflict = Assert.IsType<ConflictObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetGrievanceCategoryDto>>(conflict.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Create_DuplicateCode_PropagatesValidationException()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleCreateDto();
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ValidationException("Validation failed for create operation",
                new Dictionary<string, string> { ["GrievanceTypeCode"] = "AssetGrievanceCategory_GrievanceTypeCode_Duplicate" },
                OperationType.Create));

        // ValidationException is left for GlobalExceptionHandlerMiddleware to turn into a 400.
        await Assert.ThrowsAsync<ValidationException>(() => controller.Create(dto, CancellationToken.None));
    }

    [Fact]
    public async Task Create_UnexpectedError_Returns500()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleCreateDto();
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var result = await controller.Create(dto, CancellationToken.None);

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, error.StatusCode);
    }

    #endregion

    #region PUT /api/asset-management/asset-grievance-category/{id}

    [Fact]
    public async Task Update_ExistingId_ReturnsOkWithUpdatedRecord()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleUpdateDto();
        var updated = SampleDto();
        updated.GrievanceTypeName = dto.GrievanceTypeName;
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        var result = await controller.Update(1, dto, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetGrievanceCategoryDto>>(ok.Value);
        Assert.True(response.Success);
        Assert.Equal("Owner Name Correction - Updated", response.Items!.GrievanceTypeName);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsOkWithSuccessFalse()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleUpdateDto();
        service.Setup(s => s.UpdateAsync(999, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetGrievanceCategoryDto?)null);

        var result = await controller.Update(999, dto, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetGrievanceCategoryDto>>(ok.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Update_UniqueConstraintViolation_ReturnsConflict()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleUpdateDto();
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Microsoft.EntityFrameworkCore.DbUpdateException("An error occurred while saving the entity changes.",
                new Exception("Cannot insert duplicate key row in object 'AMS.GrievanceCategoryMaster'.")));

        var result = await controller.Update(1, dto, CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Update_DeactivationBlockedByReferences_PropagatesValidationException()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleUpdateDto();
        dto.IsActive = false;
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ValidationException("Category is referenced by remarks", OperationType.Update));

        await Assert.ThrowsAsync<ValidationException>(() => controller.Update(1, dto, CancellationToken.None));
    }

    [Fact]
    public async Task Update_UnexpectedError_Returns500()
    {
        var controller = Create(out var service, out _, out _);
        var dto = SampleUpdateDto();
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var result = await controller.Update(1, dto, CancellationToken.None);

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, error.StatusCode);
    }

    #endregion

    #region DELETE /api/asset-management/asset-grievance-category/{id}

    [Fact]
    public async Task Delete_ExistingId_ReturnsOkWithSuccessTrue()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetGrievanceCategoryDto>>(ok.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Delete_NonExistingId_ReturnsOkWithSuccessFalse()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.DeleteAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.Delete(999, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetGrievanceCategoryDto>>(ok.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Delete_ReferencedByRemarks_PropagatesValidationException()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ValidationException("Category has remarks", OperationType.Delete));

        await Assert.ThrowsAsync<ValidationException>(() => controller.Delete(1, CancellationToken.None));
    }

    [Fact]
    public async Task Delete_UnexpectedError_Returns500()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var result = await controller.Delete(1, CancellationToken.None);

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, error.StatusCode);
    }

    #endregion

    #region DELETE /api/asset-management/asset-grievance-category/{id}/purge

    [Fact]
    public async Task Purge_ExistingId_ReturnsOkWithSuccessTrue()
    {
        var controller = Create(out _, out var cleanupService, out _);
        cleanupService.Setup(c => c.ForceHardDeleteAsync<AssetGrievanceCategoryEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Purge(1, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(ok.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Purge_NonExistingId_ReturnsOkWithSuccessFalse()
    {
        var controller = Create(out _, out var cleanupService, out _);
        cleanupService.Setup(c => c.ForceHardDeleteAsync<AssetGrievanceCategoryEntity, int>(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await controller.Purge(999, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(ok.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Purge_ReferencedByRemarks_ReturnsConflict()
    {
        var controller = Create(out _, out var cleanupService, out _);
        cleanupService.Setup(c => c.ForceHardDeleteAsync<AssetGrievanceCategoryEntity, int>(1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Microsoft.EntityFrameworkCore.DbUpdateException("An error occurred while saving the entity changes.",
                new Exception("The DELETE statement conflicted with the REFERENCE constraint \"FK_GrievanceRemarkMaster_GrievanceCategoryMaster\".")));

        var result = await controller.Purge(1, CancellationToken.None);

        var conflict = Assert.IsType<ConflictObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(conflict.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Purge_UnexpectedError_Returns500()
    {
        var controller = Create(out _, out var cleanupService, out _);
        cleanupService.Setup(c => c.ForceHardDeleteAsync<AssetGrievanceCategoryEntity, int>(1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var result = await controller.Purge(1, CancellationToken.None);

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, error.StatusCode);
    }

    #endregion
}
