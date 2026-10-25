using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;

namespace NtisPlatform.Tests.Api.Controllers;

public class PropertyRevisionControllerTests
{
    private readonly Mock<IPropertyRevisionService> _mockService;
    private readonly Mock<IWebHostEnvironment> _mockEnvironment;
    private readonly PropertyRevisionController _controller;

    public PropertyRevisionControllerTests()
    {
        _mockService = new Mock<IPropertyRevisionService>();
        _mockEnvironment = new Mock<IWebHostEnvironment>();
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Production");

        _controller = new PropertyRevisionController(
            _mockService.Object,
            NullLogger<PropertyRevisionController>.Instance,
            _mockEnvironment.Object);
    }

    [Fact]
    public async Task Create_ValidRequest_ReturnsOkWithCreatedDto()
    {
        var request = new CreatePropertyRevisionDto
        {
            FinanceYearId = 1,
            CalculationType = RevisionCalculationType.RV,
            CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
            RevisionType = "AREA_CHANGE"
        };

        var created = new PropertyRevisionCreatedDto
        {
            RevisionId = 10001,
            PropertyId = 1487254,
            FinanceYearId = 1,
            RevisionNo = 2,
            CalculationType = RevisionCalculationType.RV,
            CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
            RevisionStatus = RevisionStatus.DRAFT
        };

        _mockService
            .Setup(s => s.CreateAsync(1487254, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var actionResult = await _controller.Create(1487254, request, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<PropertyRevisionCreatedDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal(10001, response.Items!.RevisionId);
    }

    [Fact]
    public async Task Create_PropertyNotFound_ReturnsNotFound()
    {
        var request = new CreatePropertyRevisionDto
        {
            FinanceYearId = 1,
            CalculationType = RevisionCalculationType.RV,
            CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
            RevisionType = "AREA_CHANGE"
        };

        _mockService
            .Setup(s => s.CreateAsync(999, request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new PropertyNotFoundException(999));

        var actionResult = await _controller.Create(999, request, CancellationToken.None);

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<object>>(notFoundResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Create_ValidationFailure_ReturnsBadRequest()
    {
        var request = new CreatePropertyRevisionDto
        {
            FinanceYearId = 1,
            CalculationType = RevisionCalculationType.RV,
            CalculationScope = RevisionCalculationScope.PERIOD_WISE,
            RevisionType = "USE_CHANGE",
            EffectiveDate = null
        };

        _mockService
            .Setup(s => s.CreateAsync(1487254, request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RevisionValidationException("EffectiveDate is required when CalculationScope is PERIOD_WISE."));

        var actionResult = await _controller.Create(1487254, request, CancellationToken.None);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<object>>(badRequestResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Create_RevisionConflict_ReturnsConflict()
    {
        var request = new CreatePropertyRevisionDto
        {
            FinanceYearId = 1,
            CalculationType = RevisionCalculationType.RV,
            CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
            RevisionType = "AREA_CHANGE"
        };

        _mockService
            .Setup(s => s.CreateAsync(1487254, request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RevisionConflictException("An open revision already exists for this property and finance year."));

        var actionResult = await _controller.Create(1487254, request, CancellationToken.None);

        var conflictResult = Assert.IsType<ConflictObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<object>>(conflictResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Get_ExistingRevision_ReturnsOk()
    {
        var details = new PropertyRevisionDetailsDto { RevisionId = 5001, PropertyId = 1487254 };

        _mockService
            .Setup(s => s.GetAsync(5001, It.IsAny<CancellationToken>()))
            .ReturnsAsync(details);

        var actionResult = await _controller.Get(5001, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<PropertyRevisionDetailsDto>>(okResult.Value);
        Assert.Equal(5001, response.Items!.RevisionId);
    }

    [Fact]
    public async Task Get_UnknownRevision_ReturnsNotFound()
    {
        _mockService
            .Setup(s => s.GetAsync(999, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RevisionNotFoundException(999));

        var actionResult = await _controller.Get(999, CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(actionResult);
    }

    [Fact]
    public async Task GetHistory_ReturnsOkWithPagedResult()
    {
        var paged = new PagedResult<PropertyRevisionSummaryDto>(
            new List<PropertyRevisionSummaryDto> { new() { RevisionId = 5002, RevisionNo = 2 } },
            totalCount: 1, pageNumber: 1, pageSize: 20);

        _mockService
            .Setup(s => s.GetHistoryAsync(1487254, It.IsAny<PropertyRevisionQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paged);

        var actionResult = await _controller.GetHistory(1487254, new PropertyRevisionQueryParameters(), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<PagedResult<PropertyRevisionSummaryDto>>>(okResult.Value);
        Assert.Equal(1, response.TotalCount);
    }
}
