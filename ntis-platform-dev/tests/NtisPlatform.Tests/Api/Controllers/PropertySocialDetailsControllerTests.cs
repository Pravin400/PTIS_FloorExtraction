using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

/// <summary>
/// Comprehensive tests for PropertySocialDetailsController
/// </summary>
public class PropertySocialDetailsControllerTests
{
    private readonly Mock<IPropertySocialDetailsService> _mockService;
    private readonly Mock<IPropertySocialDetailsBulkService> _mockBulkService;
    private readonly Mock<ILogger<PropertySocialDetailsController>> _mockLogger;
    private readonly PropertySocialDetailsController _controller;

    public PropertySocialDetailsControllerTests()
    {
        _mockService = new Mock<IPropertySocialDetailsService>();
        _mockBulkService = new Mock<IPropertySocialDetailsBulkService>();
        _mockLogger = new Mock<ILogger<PropertySocialDetailsController>>();

        _controller = new PropertySocialDetailsController(
            _mockLogger.Object,
            _mockService.Object,
            _mockBulkService.Object);

        // Set up HttpContext with authenticated user
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        }, "TestAuth"));
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
    }

    #region Bulk Create Tests

    [Fact]
    public async Task BulkCreateByPropertyIds_WithEntityType_ForwardsAndReturnsEntityType()
    {
        var request = new BulkCreatePropertySocialDetailsByPropertyIdsDto
        {
            PropertyIds = "101,102",
            SocialAttributeId = 5,
            EntityType = "W"
        };

        var bulkResult = new BulkResult<PropertySocialDetailsDto>(
            2,
            0,
            new List<PropertySocialDetailsDto>
            {
                new() { Id = 1, PropertyId = 101, SocialAttributeId = 5, EntityType = "W" },
                new() { Id = 2, PropertyId = 102, SocialAttributeId = 5, EntityType = "W" }
            });

        _mockService
            .Setup(service => service.BulkCreateAsync(
                It.Is<CreatePropertySocialDetailsDto[]>(items =>
                    items.Length == 2 && items.All(item => item.EntityType == "W")),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkCreateByPropertyIds(request, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<PropertySocialDetailsDto>>>(okResult.Value);
        Assert.All(response.Items!.Results, item => Assert.Equal("W", item.EntityType));
    }

    #endregion

    #region GetAll Tests

    [Fact]
    public async Task GetAll_WithValidQueryParameters_ReturnsOkResult()
    {
        // Arrange
        var queryParameters = new PropertySocialDetailsQueryParameters();
        var pagedResult = new PagedResult<PropertySocialDetailsDto>
        {
            Items = new List<PropertySocialDetailsDto>
            {
                new() { Id = 1, PropertyId = 100, SocialAttributeId = 5, BitValue = true }
            },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };

        _mockService.Setup(s => s.GetAllAsync(queryParameters, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetAll(queryParameters, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsType<PagedResult<PropertySocialDetailsDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
        _mockService.Verify(s => s.GetAllAsync(queryParameters, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAll_WithEmptyResult_ReturnsOkResultWithEmptyList()
    {
        // Arrange
        var queryParameters = new PropertySocialDetailsQueryParameters();
        var pagedResult = new PagedResult<PropertySocialDetailsDto>
        {
            Items = new List<PropertySocialDetailsDto>(),
            TotalCount = 0,
            PageNumber = 1,
            PageSize = 10
        };

        _mockService.Setup(s => s.GetAllAsync(queryParameters, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetAll(queryParameters, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetAll_WithFilterParameters_ReturnsFilteredResults()
    {
        // Arrange
        var queryParameters = new PropertySocialDetailsQueryParameters
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            IsActive = true
        };
        var pagedResult = new PagedResult<PropertySocialDetailsDto>
        {
            Items = new List<PropertySocialDetailsDto>
            {
                new() { Id = 1, PropertyId = 100, SocialAttributeId = 5, BitValue = true }
            },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };

        _mockService.Setup(s => s.GetAllAsync(queryParameters, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetAll(queryParameters, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsType<PagedResult<PropertySocialDetailsDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
    }

    [Fact]
    public async Task GetAll_WithFilterValidationException_ReturnsBadRequest()
    {
        // Arrange
        var queryParameters = new PropertySocialDetailsQueryParameters();
        var errors = new Dictionary<string, string> { { "PropertyId", "Invalid filter parameter" } };

        _mockService.Setup(s => s.GetAllAsync(queryParameters, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new FilterValidationException("Filter validation failed", errors));

        // Act
        var result = await _controller.GetAll(queryParameters, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);

        var responseType = badRequestResult.Value.GetType();
        var messageProperty = responseType.GetProperty("message");
        Assert.NotNull(messageProperty);
        var messageValue = messageProperty.GetValue(badRequestResult.Value) as string;
        Assert.Equal("Filter validation failed", messageValue);
    }

    [Fact]
    public async Task GetAll_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var queryParameters = new PropertySocialDetailsQueryParameters();

        _mockService.Setup(s => s.GetAllAsync(queryParameters, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.GetAll(queryParameters, CancellationToken.None);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusCodeResult.StatusCode);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(statusCodeResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("error occurred", apiResponse.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetAll_WithPropertyIdFilter_ReturnsFilteredByPropertyId()
    {
        // Arrange
        var queryParameters = new PropertySocialDetailsQueryParameters
        {
            PropertyId = 100
        };

        var pagedResult = new PagedResult<PropertySocialDetailsDto>
        {
            Items = new List<PropertySocialDetailsDto>
            {
                new() { Id = 1, PropertyId = 100, SocialAttributeId = 5 },
                new() { Id = 2, PropertyId = 100, SocialAttributeId = 6 }
            },
            TotalCount = 2,
            PageNumber = 1,
            PageSize = 10
        };

        _mockService.Setup(s => s.GetAllAsync(queryParameters, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetAll(queryParameters, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsType<PagedResult<PropertySocialDetailsDto>>(okResult.Value);
        Assert.Equal(2, returnedResult.Items.Count());
        Assert.All(returnedResult.Items, item => Assert.Equal(100, item.PropertyId));
    }

    #endregion

    #region GetById Tests

    [Fact]
    public async Task GetById_WithValidId_ReturnsOkResult()
    {
        // Arrange
        var id = 1;
        var dto = new PropertySocialDetailsDto
        {
            Id = id,
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IntValue = 10,
            TextValue = "Test Value"
        };

        _mockService.Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await _controller.GetById(id, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<PropertySocialDetailsDto>(okResult.Value);
        Assert.Equal(id, returnedDto.Id);
        Assert.Equal(100, returnedDto.PropertyId);
        _mockService.Verify(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_WithNonExistentId_ReturnsNotFound()
    {
        // Arrange
        var id = 999;

        _mockService.Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertySocialDetailsDto?)null);

        // Act
        var result = await _controller.GetById(id, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetById_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var id = 1;

        _mockService.Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.GetById(id, CancellationToken.None);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusCodeResult.StatusCode);
    }

    #endregion

    #region Create Tests

    [Fact]
    public async Task Create_WithValidDto_ReturnsCreatedResult()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IntValue = 10,
            TextValue = "New Value",
            IsActive = true
        };

        var createdDto = new PropertySocialDetailsDto
        {
            Id = 1,
            PropertyId = createDto.PropertyId,
            SocialAttributeId = createDto.SocialAttributeId,
            BitValue = createDto.BitValue,
            IntValue = createDto.IntValue,
            TextValue = createDto.TextValue,
            IsActive = createDto.IsActive
        };

        _mockService.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Items);
        Assert.Equal(createdDto.Id, apiResponse.Items.Id);
        _mockService.Verify(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Create_WithDuplicateConstraint_ReturnsConflict()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IsActive = true
        };

        _mockService.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Duplicate key constraint violation"));

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(conflictResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("already exists", apiResponse.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Create_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5
        };

        _mockService.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusCodeResult.StatusCode);
    }

    [Fact]
    public async Task Create_WithAllValueTypes_StoresCorrectly()
    {
        // Arrange
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = true,
            IntValue = 25,
            DecimalValue = 99.99m,
            TextValue = "Complex Value",
            DateValue = new DateTime(2024, 1, 15),
            Remark = "Test remark",
            IsActive = true
        };

        var createdDto = new PropertySocialDetailsDto
        {
            Id = 1,
            PropertyId = createDto.PropertyId,
            SocialAttributeId = createDto.SocialAttributeId,
            BitValue = createDto.BitValue,
            IntValue = createDto.IntValue,
            DecimalValue = createDto.DecimalValue,
            TextValue = createDto.TextValue,
            DateValue = createDto.DateValue,
            Remark = createDto.Remark,
            IsActive = createDto.IsActive
        };

        _mockService.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Items);
        Assert.Equal(createDto.BitValue, apiResponse.Items.BitValue);
        Assert.Equal(createDto.IntValue, apiResponse.Items.IntValue);
        Assert.Equal(createDto.DecimalValue, apiResponse.Items.DecimalValue);
        Assert.Equal(createDto.TextValue, apiResponse.Items.TextValue);
    }

    #endregion

    #region Update Tests

    [Fact]
    public async Task Update_WithValidDto_ReturnsOkResult()
    {
        // Arrange
        var id = 1;
        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5,
            BitValue = false,
            IntValue = 20,
            TextValue = "Updated Value",
            IsActive = true
        };

        var updatedDto = new PropertySocialDetailsDto
        {
            Id = id,
            PropertyId = updateDto.PropertyId,
            SocialAttributeId = updateDto.SocialAttributeId,
            BitValue = updateDto.BitValue,
            IntValue = updateDto.IntValue,
            TextValue = updateDto.TextValue,
            IsActive = updateDto.IsActive
        };

        _mockService.Setup(s => s.UpdateAsync(id, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        // Act
        var result = await _controller.Update(id, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Items);
        Assert.Equal(updatedDto.TextValue, apiResponse.Items.TextValue);
        _mockService.Verify(s => s.UpdateAsync(id, updateDto, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_WithNonExistentId_ReturnsNotFound()
    {
        // Arrange
        var id = 999;
        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5
        };

        _mockService.Setup(s => s.UpdateAsync(id, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertySocialDetailsDto?)null);

        // Act
        var result = await _controller.Update(id, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(okResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("not found", apiResponse.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Update_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var id = 1;
        var updateDto = new UpdatePropertySocialDetailsDto
        {
            PropertyId = 100,
            SocialAttributeId = 5
        };

        _mockService.Setup(s => s.UpdateAsync(id, updateDto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.Update(id, updateDto, CancellationToken.None);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusCodeResult.StatusCode);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public void DeleteByHierarchy_BindsValidatedRequestDtoFromQuery()
    {
        var method = typeof(PropertySocialDetailsController)
            .GetMethod(nameof(PropertySocialDetailsController.DeleteByHierarchy));
        var parameters = method!.GetParameters();
        var requestParameter = parameters.SingleOrDefault(x => x.ParameterType == typeof(SoftDeleteByHierarchyRequest));
        var entityTypeProperty = typeof(SoftDeleteByHierarchyRequest).GetProperty(nameof(SoftDeleteByHierarchyRequest.EntityType));
        var socialAttributeProperty = typeof(SoftDeleteByHierarchyRequest).GetProperty(nameof(SoftDeleteByHierarchyRequest.SocialAttributeId));
        var optionalIdProperties = new[]
        {
            nameof(SoftDeleteByHierarchyRequest.SocietyDetailsId),
            nameof(SoftDeleteByHierarchyRequest.WingDetailId),
            nameof(SoftDeleteByHierarchyRequest.DocumentBindingId)
        };

        Assert.NotNull(requestParameter);
        Assert.Contains(requestParameter!.GetCustomAttributes(false), x => x is FromQueryAttribute);
        Assert.Contains(entityTypeProperty!.GetCustomAttributes(false), x => x is RequiredAttribute);
        Assert.Contains(socialAttributeProperty!.GetCustomAttributes(false), x => x is RangeAttribute);
        foreach (var propertyName in optionalIdProperties)
        {
            var property = typeof(SoftDeleteByHierarchyRequest).GetProperty(propertyName);
            Assert.NotNull(property);
            Assert.Contains(property!.GetCustomAttributes(false), x => x is RangeAttribute);
        }
    }

    [Fact]
    public void SoftDeleteByHierarchyRequest_PropertyIds_UsesSingleCsvFieldAndDtoParser()
    {
        var propertyIdsProperty = typeof(SoftDeleteByHierarchyRequest)
            .GetProperty(nameof(SoftDeleteByHierarchyRequest.PropertyIds));
        var propertyIdProperty = typeof(SoftDeleteByHierarchyRequest).GetProperty("PropertyId");
        var parser = typeof(SoftDeleteByHierarchyRequest).GetMethod("ToPropertyIds");

        Assert.NotNull(propertyIdsProperty);
        Assert.Equal(typeof(string), propertyIdsProperty!.PropertyType);
        Assert.Null(propertyIdProperty);
        Assert.NotNull(parser);

        var request = new SoftDeleteByHierarchyRequest
        {
            EntityType = "Unit",
            SocialAttributeId = 5
        };
        propertyIdsProperty.SetValue(request, "101, 102,invalid,0,101");

        var propertyIds = Assert.IsType<List<int>>(parser!.Invoke(request, null));
        Assert.Equal(new[] { 101, 102 }, propertyIds);
    }

    [Fact]
    public async Task DeleteByHierarchy_WithValidApartmentParams_ReturnsOkWithCount()
    {
        // Arrange
        _mockService.Setup(s => s.SoftDeleteByHierarchyAsync(
                It.Is<SoftDeleteByHierarchyRequest>(r =>
                    r.SocialAttributeId == 5 &&
                    r.EntityType == "Society" &&
                    r.SocietyDetailsId == 10 &&
                    r.WingDetailId == null &&
                    r.PropertyIds == null),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);

        // Act
        var result = await _controller.DeleteByHierarchy(new SoftDeleteByHierarchyRequest
        {
            SocialAttributeId = 5,
            EntityType = "Society",
            SocietyDetailsId = 10
        }, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<int>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(3, apiResponse.Items);
        Assert.Contains("3 record(s) deleted", apiResponse.Message);
    }

    [Fact]
    public async Task DeleteByHierarchy_WithValidWingParams_ReturnsOkWithCount()
    {
        // Arrange
        _mockService.Setup(s => s.SoftDeleteByHierarchyAsync(
                It.Is<SoftDeleteByHierarchyRequest>(r =>
                    r.SocialAttributeId == 5 &&
                    r.EntityType == "WingLevel" &&
                    r.WingDetailId == 20 &&
                    r.PropertyIds == null),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        // Act
        var result = await _controller.DeleteByHierarchy(new SoftDeleteByHierarchyRequest
        {
            SocialAttributeId = 5,
            EntityType = "WingLevel",
            WingDetailId = 20
        }, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<int>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(2, apiResponse.Items);
    }

    [Fact]
    public async Task DeleteByHierarchy_WithValidPropertyParams_ReturnsOkWithCount()
    {
        // Arrange
        _mockService.Setup(s => s.SoftDeleteByHierarchyAsync(
                It.Is<SoftDeleteByHierarchyRequest>(r =>
                    r.SocialAttributeId == 5 &&
                    r.EntityType == "Unit" &&
                    r.WingDetailId == 20 &&
                    r.PropertyIds == "101,102"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        // Act
        var result = await _controller.DeleteByHierarchy(new SoftDeleteByHierarchyRequest
        {
            SocialAttributeId = 5,
            EntityType = "Unit",
            WingDetailId = 20,
            PropertyIds = "101,102"
        }, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<int>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(2, apiResponse.Items);
    }

    [Fact]
    public async Task DeleteByHierarchy_WithException_ReturnsInternalServerError()
    {
        // Arrange
        _mockService.Setup(s => s.SoftDeleteByHierarchyAsync(
                It.IsAny<SoftDeleteByHierarchyRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.DeleteByHierarchy(new SoftDeleteByHierarchyRequest
        {
            SocialAttributeId = 5,
            EntityType = "Society",
            SocietyDetailsId = 10
        }, CancellationToken.None);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusCodeResult.StatusCode);
    }

    [Fact]
    public async Task DeleteByPropertyAndAttribute_WithSuccess_ReturnsOk()
    {
        // Arrange
        _mockService.Setup(s => s.DeleteByPropertyAndAttributeAsync(100, 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteByPropertyAndAttribute(100, 5, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal("Record marked for deletion", apiResponse.Message);
    }

    [Fact]
    public async Task DeleteByPropertyAndAttribute_WithNotFound_ReturnsOkWithFalse()
    {
        // Arrange
        _mockService.Setup(s => s.DeleteByPropertyAndAttributeAsync(100, 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteByPropertyAndAttribute(100, 5, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsDto>>(okResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Equal("Record not found", apiResponse.Message);
    }

    #endregion

    #region GetByFilters Tests

    [Fact]
    public async Task GetByFilters_WithNoParameters_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.GetByFilters(null, null, null, null, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsFilterResponseDto>>(badRequestResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("At least one filter parameter", apiResponse.Message);
    }

    [Fact]
    public async Task GetByFilters_WithSocietyDetailId_ReturnsOkWithResponseDto()
    {
        // Arrange
        var societyDetailId = 1504941;
        var responseDto = new PropertySocialDetailsFilterResponseDto
        {
            AppliedAttributes = new List<AppliedSocialAttributeDto>
            {
                new() { AttributeMasterId = 10, AttributeName = "Amenity", PropertySocialDetailId = 1, SocietyDetailId = societyDetailId }
            },
            NonAppliedAttributes = new List<NonAppliedSocialAttributeDto>
            {
                new() { AttributeMasterId = 20, AttributeName = "Playground" }
            }
        };

        _mockService.Setup(s => s.GetByFiltersAsync(null, societyDetailId, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(responseDto);

        // Act
        var result = await _controller.GetByFilters(societyDetailId, null, null, null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsFilterResponseDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Items);
        Assert.Single(apiResponse.Items.AppliedAttributes);
        Assert.Single(apiResponse.Items.NonAppliedAttributes);
        _mockService.Verify(s => s.GetByFiltersAsync(null, societyDetailId, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByFilters_WithSocialAttributeId_PassesCorrectFilterAndReturnsOk()
    {
        // Arrange
        var socialAttributeId = 12;
        var societyDetailId = 1504941;
        var wingDetailId = 1525597;
        var propertyId = 42;
        var responseDto = new PropertySocialDetailsFilterResponseDto();

        _mockService.Setup(s => s.GetByFiltersAsync(socialAttributeId, societyDetailId, wingDetailId, propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(responseDto);

        // Act
        var result = await _controller.GetByFilters(societyDetailId, wingDetailId, propertyId, socialAttributeId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsFilterResponseDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        _mockService.Verify(s => s.GetByFiltersAsync(socialAttributeId, societyDetailId, wingDetailId, propertyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByFilters_WhenServiceThrowsException_Returns500InternalServerError()
    {
        // Arrange
        _mockService.Setup(s => s.GetByFiltersAsync(It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection failure"));

        // Act
        var result = await _controller.GetByFilters(1504941, null, null, null, CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        var apiResponse = Assert.IsType<ApiResponse<PropertySocialDetailsFilterResponseDto>>(objectResult.Value);
        Assert.False(apiResponse.Success);
    }

    #endregion

    #region Helper Methods

    private static IFormFile CreateMockFormFile(string fileName, string contentType)
    {
        var content = "Test file content"u8.ToArray();
        var stream = new MemoryStream(content);
        var mockFile = new Mock<IFormFile>();

        mockFile.Setup(f => f.FileName).Returns(fileName);
        mockFile.Setup(f => f.ContentType).Returns(contentType);
        mockFile.Setup(f => f.Length).Returns(content.Length);
        mockFile.Setup(f => f.OpenReadStream()).Returns(stream);

        return mockFile.Object;
    }

    #endregion
}
