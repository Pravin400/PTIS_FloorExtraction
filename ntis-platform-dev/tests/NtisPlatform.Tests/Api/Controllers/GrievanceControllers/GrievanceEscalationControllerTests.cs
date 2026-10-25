using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.GrievanceControllers;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.GrievanceControllers;

public class GrievanceEscalationControllerTests
{
    private static GrievanceEscalationController Create(out Mock<IGrievanceEscalationService> service, int? authenticatedUserId = null, bool isCitizen = false)
    {
        service = new Mock<IGrievanceEscalationService>();
        var logger = new Mock<ILogger<GrievanceEscalationController>>();
        var controller = new GrievanceEscalationController(service.Object, logger.Object);

        if (isCitizen)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, (authenticatedUserId ?? 1).ToString()),
                new Claim(ClaimTypes.Role, "Citizen"),
                new Claim("user_type", "citizen")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }
        else if (authenticatedUserId.HasValue)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, authenticatedUserId.Value.ToString()),
                new Claim(ClaimTypes.Role, "Staff")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }
        else
        {
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
            };
        }

        return controller;
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        // Arrange
        var controller = Create(out var service);
        var query = new GrievanceEscalationQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GrievanceEscalationDto>(new List<GrievanceEscalationDto>(), 0, 1, 10));

        // Act
        var result = await controller.GetAll(query, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOk()
    {
        // Arrange
        var controller = Create(out var service);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GrievanceEscalationDto { Id = 1, GrievanceApplicationId = 10 });

        // Act
        var result = await controller.GetById(1, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByGrievanceId_Success_ReturnsOk()
    {
        // Arrange
        var controller = Create(out var service);
        service.Setup(s => s.GetByGrievanceIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GrievanceEscalationDto>
            {
                new() { Id = 1, GrievanceApplicationId = 10, Reason = "Overdue" }
            });

        // Act
        var result = await controller.GetByGrievanceId(10, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsType<List<GrievanceEscalationDto>>(okResult.Value);
        Assert.Single(list);
    }

    [Fact]
    public async Task GetByGrievanceId_Exception_Returns500()
    {
        // Arrange
        var controller = Create(out var service);
        service.Setup(s => s.GetByGrievanceIdAsync(10, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await controller.GetByGrievanceId(10, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetByWardId_Success_ReturnsOk()
    {
        // Arrange
        var controller = Create(out var service);
        var query = new GrievanceEscalationQueryParameters();
        service.Setup(s => s.GetByWardIdAsync(5, query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GrievanceEscalationDto>(new List<GrievanceEscalationDto>(), 0, 1, 10));

        // Act
        var result = await controller.GetByWardId(5, query, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByWardId_Exception_Returns500()
    {
        // Arrange
        var controller = Create(out var service);
        var query = new GrievanceEscalationQueryParameters();
        service.Setup(s => s.GetByWardIdAsync(5, query, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Error retrieving ward escalations"));

        // Act
        var result = await controller.GetByWardId(5, query, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetByZoneId_Success_ReturnsOk()
    {
        // Arrange
        var controller = Create(out var service);
        var query = new GrievanceEscalationQueryParameters();
        service.Setup(s => s.GetByZoneIdAsync(2, query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GrievanceEscalationDto>(new List<GrievanceEscalationDto>(), 0, 1, 10));

        // Act
        var result = await controller.GetByZoneId(2, query, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByZoneId_Exception_Returns500()
    {
        // Arrange
        var controller = Create(out var service);
        var query = new GrievanceEscalationQueryParameters();
        service.Setup(s => s.GetByZoneIdAsync(2, query, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Error retrieving zone escalations"));

        // Act
        var result = await controller.GetByZoneId(2, query, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task Escalate_WithValidUserClaim_ReturnsCreatedAtAction()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 5);
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            Reason = "No progress made in 7 days"
        };

        service.Setup(s => s.EscalateGrievanceAsync(dto, 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GrievanceEscalationDto { Id = 101, GrievanceApplicationId = 10 });

        // Act
        var result = await controller.Escalate(dto, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(GrievanceEscalationController.GetById), createdResult.ActionName);
        var returnedDto = Assert.IsType<GrievanceEscalationDto>(createdResult.Value);
        Assert.Equal(101, returnedDto.Id);
    }

    [Fact]
    public async Task Escalate_WithoutUserClaim_ReturnsUnauthorized()
    {
        // Arrange
        var controller = Create(out var _, authenticatedUserId: null);
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            Reason = "No progress"
        };

        // Act
        var result = await controller.Escalate(dto, CancellationToken.None);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Escalate_ValidationException_ReturnsBadRequest()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 5);
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            Reason = "Duplicate"
        };

        service.Setup(s => s.EscalateGrievanceAsync(dto, 5, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ValidationException("Escalation", "A pending poke is already active.", OperationType.Create));

        // Act
        var result = await controller.Escalate(dto, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task Escalate_UnhandledException_Returns500()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 5);
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 10,
            Reason = "Unexpected failure"
        };

        service.Setup(s => s.EscalateGrievanceAsync(dto, 5, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database deadlock"));

        // Act
        var result = await controller.Escalate(dto, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task RespondToEscalation_WithValidUserClaim_ReturnsOk()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 12);
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Work order issued to contractor.",
            EscalationStatus = "ACKNOWLEDGED"
        };

        service.Setup(s => s.RespondToEscalationAsync(1, dto, 12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GrievanceEscalationDto { Id = 1, StaffResponse = dto.StaffResponse });

        // Act
        var result = await controller.RespondToEscalation(1, dto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<GrievanceEscalationDto>(okResult.Value);
        Assert.Equal("Work order issued to contractor.", returnedDto.StaffResponse);
    }

    [Fact]
    public async Task RespondToEscalation_WhenResultIsNull_ReturnsNotFound()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 12);
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Acknowledged",
            EscalationStatus = "ACKNOWLEDGED"
        };

        service.Setup(s => s.RespondToEscalationAsync(999, dto, 12, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceEscalationDto?)null);

        // Act
        var result = await controller.RespondToEscalation(999, dto, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task RespondToEscalation_KeyNotFoundException_ReturnsNotFound()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 12);
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Acknowledged",
            EscalationStatus = "ACKNOWLEDGED"
        };

        service.Setup(s => s.RespondToEscalationAsync(999, dto, 12, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("GrievanceEscalation with ID '999' was not found."));

        // Act
        var result = await controller.RespondToEscalation(999, dto, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.NotNull(notFoundResult.Value);
    }

    [Fact]
    public async Task RespondToEscalation_WithoutUserClaim_ReturnsUnauthorized()
    {
        // Arrange
        var controller = Create(out var _, authenticatedUserId: null);
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Acknowledged",
            EscalationStatus = "ACKNOWLEDGED"
        };

        // Act
        var result = await controller.RespondToEscalation(1, dto, CancellationToken.None);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task RespondToEscalation_ValidationException_ReturnsBadRequest()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 12);
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Acknowledged",
            EscalationStatus = "ACKNOWLEDGED"
        };

        service.Setup(s => s.RespondToEscalationAsync(1, dto, 12, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ValidationException("staffUserId", "Active staff user does not exist.", OperationType.Update));

        // Act
        var result = await controller.RespondToEscalation(1, dto, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task RespondToEscalation_UnhandledException_Returns500()
    {
        // Arrange
        var controller = Create(out var service, authenticatedUserId: 12);
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Acknowledged",
            EscalationStatus = "ACKNOWLEDGED"
        };

        service.Setup(s => s.RespondToEscalationAsync(1, dto, 12, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected server error"));

        // Act
        var result = await controller.RespondToEscalation(1, dto, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsOk()
    {
        // Arrange
        var controller = Create(out var service);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await controller.Delete(1, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_WhenCitizen_ReturnsForbid()
    {
        var controller = Create(out var _, isCitizen: true);
        var result = await controller.GetAll(new GrievanceEscalationQueryParameters(), CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetById_WhenCitizen_ReturnsForbid()
    {
        var controller = Create(out var _, isCitizen: true);
        var result = await controller.GetById(1, CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetByGrievanceId_WhenCitizen_ReturnsForbid()
    {
        var controller = Create(out var _, isCitizen: true);
        var result = await controller.GetByGrievanceId(10, CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Escalate_WhenCitizen_ReturnsForbid()
    {
        var controller = Create(out var _, isCitizen: true);
        var result = await controller.Escalate(new CreateGrievanceEscalationDto { GrievanceApplicationId = 1, Reason = "Citizen trying to poke" }, CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task RespondToEscalation_WhenCitizen_ReturnsForbid()
    {
        var controller = Create(out var _, isCitizen: true);
        var result = await controller.RespondToEscalation(1, new RespondGrievanceEscalationDto { StaffResponse = "Citizen response", EscalationStatus = "ACKNOWLEDGED" }, CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Delete_WhenCitizen_ReturnsForbid()
    {
        var controller = Create(out var _, isCitizen: true);
        var result = await controller.Delete(1, CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }
}
