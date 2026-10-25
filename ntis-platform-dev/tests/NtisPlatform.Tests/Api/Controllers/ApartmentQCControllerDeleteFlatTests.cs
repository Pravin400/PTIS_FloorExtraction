using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.DeleteFlat;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService;
using NtisPlatform.Application.Interfaces.Master;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class ApartmentQCControllerDeleteFlatTests
{
    private readonly Mock<IDeleteFlatService> _mockDeleteFlatService;
    private readonly ApartmentQCController _controller;

    public ApartmentQCControllerDeleteFlatTests()
    {
        _mockDeleteFlatService = new Mock<IDeleteFlatService>();

        _controller = new ApartmentQCController(
            new Mock<IApartmentQCService>().Object,
            new Mock<IWingWiseDetailsService>().Object,
            new Mock<ICapitalValueService>().Object,
            new Mock<IApartmentQcCertificateGridService>().Object,
            new Mock<IApartmentQcSearchService>().Object,
            new Mock<IApartmentQcTopSectionService>().Object,
            new Mock<IApartmentQcTopSectionBelowFlexService>().Object,
            new Mock<IApartmentTaxDetailsService>().Object,
            new Mock<IPropertyCertificateApplicationService>().Object,
            new Mock<ISocialAttributeService>().Object,
            NullLogger<ApartmentQCController>.Instance,
            new Mock<IGetApartmentDetailsWingWiseService>().Object,
            new Mock<IApartmentDashboardService>().Object,
            _mockDeleteFlatService.Object);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "1") };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task SoftDeleteFlatAsync_ValidRequest_ReturnsOkObjectResultWithResponseDto()
    {
        // Arrange
        var requestDto = new DeleteFlatRequestDto
        {
            FilterType = "PropertyWise",
            FilterValue = 10
        };
        var expectedResponse = new DeleteFlatResponseDto
        {
            Success = true,
            Message = "1 Flat deleted successfully.",
            FilterType = "PropertyWise",
            FilterValue = 10,
            DeletedCount = 1,
            AffectedPropertyIds = new List<int> { 10 }
        };

        _mockDeleteFlatService
            .Setup(s => s.SoftDeleteFlatAsync(requestDto, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SoftDeleteFlatAsync(requestDto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<DeleteFlatResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.Message.Should().Be("1 Flat deleted successfully.");

        _mockDeleteFlatService.Verify(s => s.SoftDeleteFlatAsync(requestDto, 1, It.IsAny<CancellationToken>()), Times.Once);
    }
}
