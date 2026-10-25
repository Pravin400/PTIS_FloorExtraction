using Microsoft.AspNetCore.Mvc;
using Moq;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs.Master.ScreenFieldValidation;
using NtisPlatform.Application.Interfaces.Master;
using Xunit;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class ScreenFieldValidationControllerTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsOk_WithPayload()
    {
        // Arrange
        var service = new Mock<IScreenFieldValidationService>();
        var query = new ScreenFieldValidationQueryParameters { DepartmentId = 1, ModuleId = 1, ScreenId = 0 };

        var payload = new List<ScreenFieldValidationCustomDto>
        {
            new()
            {
                ScreenId = 1,
                ScreenName = "Data Analytics",
                FieldValidationDetails = new List<FieldValidationDetailsDto>
                {
                    new() { FieldCode = "F_NAME", FieldName = "Name", FieldTypeName = "Text" }
                },
                ButtonPermissionDetails = new List<ButtonPermissionDetailsDto>
                {
                    new() { ButtonCode = "BTN_SAVE", ButtonName = "Save", ButtonTypeName = "Save", IsVisible = true, IsEnabled = true }
                }
            }
        };

        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payload);

        var controller = new ScreenFieldValidationController(service.Object);

        // Act
        var result = await controller.GetAllAsync(query, CancellationToken.None);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var value = Assert.IsType<List<ScreenFieldValidationCustomDto>>(ok.Value);
        Assert.Single(value);
        Assert.Equal(1, value[0].ScreenId);
    }

    [Fact]
    public async Task GetAllAsync_CallsServiceOnce()
    {
        // Arrange
        var service = new Mock<IScreenFieldValidationService>();
        var query = new ScreenFieldValidationQueryParameters { DepartmentId = 1, ModuleId = 1, ScreenId = 5 };

        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ScreenFieldValidationCustomDto>());

        var controller = new ScreenFieldValidationController(service.Object);

        // Act
        await controller.GetAllAsync(query, CancellationToken.None);

        // Assert
        service.Verify(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }
}