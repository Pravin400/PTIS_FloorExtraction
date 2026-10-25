using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Application.Models;
using System.Security.Claims;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class PropertyControllerIndividualTests
{
    [Fact]
    public async Task GetIndividualDetails_PropertyExists_ReturnsOkWithData()
    {
        // Arrange
        var mockPropertyService = new Mock<IPropertyService>();
        var mockLogger = new Mock<ILogger<PropertyController>>();
        var mockIndividualService = new Mock<IPropertyIndividualService>();

        var expectedDto = new PropertyIndividualDto
        {
            PropertyId = 100,
            PropertyNo = "270465-2024-000123",
            OwnerName = "MATOSHREE BUILDERS"
        };

        mockIndividualService.Setup(s => s.GetIndividualDetailsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var controller = PropertyControllerTestHelper.CreateController(
            mockPropertyService,
            mockLogger,
            individualService: mockIndividualService);

        // Act
        var actionResult = await controller.GetIndividualDetails(100, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<PropertyIndividualDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Items);
        Assert.Equal(100, apiResponse.Items!.PropertyId);
        Assert.Equal("270465-2024-000123", apiResponse.Items.PropertyNo);
    }

    [Fact]
    public async Task GetIndividualDetails_PropertyNotFound_ReturnsNotFound()
    {
        // Arrange
        var mockPropertyService = new Mock<IPropertyService>();
        var mockLogger = new Mock<ILogger<PropertyController>>();
        var mockIndividualService = new Mock<IPropertyIndividualService>();

        mockIndividualService.Setup(s => s.GetIndividualDetailsAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertyIndividualDto?)null);

        var controller = PropertyControllerTestHelper.CreateController(
            mockPropertyService,
            mockLogger,
            individualService: mockIndividualService);

        // Act
        var actionResult = await controller.GetIndividualDetails(999, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<object>>(notFoundResult.Value);
        Assert.False(apiResponse.Success);
    }

    [Fact]
    public async Task UpdateIndividualDetails_ValidDto_ReturnsOkWithUpdatedData()
    {
        // Arrange
        var mockPropertyService = new Mock<IPropertyService>();
        var mockLogger = new Mock<ILogger<PropertyController>>();
        var mockIndividualService = new Mock<IPropertyIndividualService>();

        var patchDto = new UpdatePropertyIndividualDto
        {
            OwnerName = "NEW OWNER NAME",
            MobileNo = "9998887776"
        };

        var expectedDto = new PropertyIndividualDto
        {
            PropertyId = 100,
            OwnerName = "NEW OWNER NAME",
            MobileNo = "9998887776"
        };

        mockIndividualService.Setup(s => s.UpdateIndividualDetailsAsync(
                100,
                It.IsAny<UpdatePropertyIndividualDto>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection.TopSectionUpdateOutcome.Success);

        mockIndividualService.Setup(s => s.GetIndividualDetailsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var controller = PropertyControllerTestHelper.CreateController(
            mockPropertyService,
            mockLogger,
            individualService: mockIndividualService);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, "1") }, "TestAuth"))
            }
        };

        // Act
        var actionResult = await controller.UpdateIndividualDetails(100, patchDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<PropertyIndividualDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal("NEW OWNER NAME", apiResponse.Items!.OwnerName);
    }

    [Fact]
    public async Task UpdateIndividualDetails_NoFields_ReturnsBadRequest()
    {
        // Arrange
        var mockPropertyService = new Mock<IPropertyService>();
        var mockLogger = new Mock<ILogger<PropertyController>>();
        var mockIndividualService = new Mock<IPropertyIndividualService>();

        var emptyDto = new UpdatePropertyIndividualDto();

        var controller = PropertyControllerTestHelper.CreateController(
            mockPropertyService,
            mockLogger,
            individualService: mockIndividualService);

        // Act
        var actionResult = await controller.UpdateIndividualDetails(100, emptyDto, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
        Assert.NotNull(badRequestResult);
    }
}
