using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using MockQueryable;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.PropertyMedia;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Enums;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

public class PropertyMediaDownloadServiceTests
{
    private readonly Mock<IRepository<PropertyPhotoEntity, int>> _photoRepoMock = new();
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepoMock = new();
    private readonly Mock<IPropertyMediaUploadService> _uploadServiceMock = new();
    private readonly Mock<IFileStorageService> _fileStorageServiceMock = new();

    private PropertyMediaDownloadService CreateService()
    {
        return new PropertyMediaDownloadService(
            _photoRepoMock.Object,
            _propertyRepoMock.Object,
            _uploadServiceMock.Object,
            _fileStorageServiceMock.Object,
            NullLogger<PropertyMediaDownloadService>.Instance);
    }

    [Fact]
    public async Task GetPropertyNumbersAsync_ReturnsSortedPropertyNumbers_FilteredByWardAndDivision()
    {
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "100", TaxZoneId = 1, WardId = 2, IsActive = true },
            new PropertyEntity { Id = 2, PropertyNo = "20", TaxZoneId = 1, WardId = 2, IsActive = true },
            new PropertyEntity { Id = 3, PropertyNo = "5", TaxZoneId = 1, WardId = 2, IsActive = true },
            new PropertyEntity { Id = 4, PropertyNo = "999", TaxZoneId = 2, WardId = 5, IsActive = true } // different ward
        };

        _propertyRepoMock.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var service = CreateService();
        var query = new PropertyMediaPropertyNumbersQueryParameters
        {
            WardIds = new List<int> { 2 }
        };

        var result = await service.GetPropertyNumbersAsync(query, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        // Verify natural ordering: 5, 20, 100 (not string alphabetical: 100, 20, 5)
        Assert.Equal(new[] { "5", "20", "100" }, result);
    }

    [Fact]
    public async Task GetPropertyNumbersAsync_ReturnsSortedPropertyNumbers_FilteredByMultipleWards()
    {
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "10", TaxZoneId = 1, WardId = 89, IsActive = true },
            new PropertyEntity { Id = 2, PropertyNo = "15", TaxZoneId = 1, WardId = 89, IsActive = true },
            new PropertyEntity { Id = 3, PropertyNo = "25", TaxZoneId = 1, WardId = 90, IsActive = true },
            new PropertyEntity { Id = 4, PropertyNo = "999", TaxZoneId = 1, WardId = 95, IsActive = true } // Ward 95 not selected
        };

        _propertyRepoMock.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var service = CreateService();
        var query = new PropertyMediaPropertyNumbersQueryParameters
        {
            WardIds = new List<int> { 89, 90 }
        };

        var result = await service.GetPropertyNumbersAsync(query, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(new[] { "10", "15", "25" }, result);
    }

    [Fact]
    public async Task DownloadImagesZipAsync_ThrowsArgumentException_WhenFromPropertyGreaterThanToProperty()
    {
        var service = CreateService();
        var query = new PropertyMediaDownloadQueryParameters
        {
            Category = PropertyMediaCategory.Photo,
            PhotoTypeId = 1,
            DivisionId = 1,
            WardIds = new List<int> { 2 },
            FromPropertyNo = "100",
            ToPropertyNo = "20" // 100 > 20 in natural numeric comparison
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.DownloadImagesZipAsync(query, CancellationToken.None));

        Assert.Contains("cannot be greater than", ex.Message);
    }

    [Fact]
    public async Task Controller_GetPropertyNumbers_ReturnsOkWithNumbers()
    {
        var downloadServiceMock = new Mock<IPropertyMediaDownloadService>();
        var uploadServiceMock = new Mock<IPropertyMediaUploadService>();
        var dashboardServiceMock = new Mock<IPropertyMediaDashboardService>();
        var opsServiceMock = new Mock<IPropertyMediaOperationsService>();
        var envMock = new Mock<IWebHostEnvironment>();

        var expectedProps = new List<string> { "10", "20", "100" };
        downloadServiceMock.Setup(s => s.GetPropertyNumbersAsync(It.IsAny<PropertyMediaPropertyNumbersQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedProps);

        var exportServiceMock = new Mock<IPropertyMediaExportService>();
        var controller = new PropertyMediaController(
            dashboardServiceMock.Object,
            exportServiceMock.Object,
            uploadServiceMock.Object,
            opsServiceMock.Object,
            downloadServiceMock.Object);

        var actionResult = await controller.GetPropertyNumbers(new PropertyMediaPropertyNumbersQueryParameters { WardIds = new List<int> { 5 } }, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<List<string>>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(expectedProps, apiResponse.Items);
    }

    [Fact]
    public async Task Controller_DownloadImagesZip_ReturnsBadRequest_WhenServiceThrowsArgumentException()
    {
        var downloadServiceMock = new Mock<IPropertyMediaDownloadService>();
        var uploadServiceMock = new Mock<IPropertyMediaUploadService>();
        var dashboardServiceMock = new Mock<IPropertyMediaDashboardService>();
        var opsServiceMock = new Mock<IPropertyMediaOperationsService>();
        var envMock = new Mock<IWebHostEnvironment>();

        downloadServiceMock.Setup(s => s.DownloadImagesZipAsync(It.IsAny<PropertyMediaDownloadQueryParameters>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("From Property No cannot be greater than To Property No."));

        var exportServiceMock = new Mock<IPropertyMediaExportService>();
        var controller = new PropertyMediaController(
            dashboardServiceMock.Object,
            exportServiceMock.Object,
            uploadServiceMock.Object,
            opsServiceMock.Object,
            downloadServiceMock.Object);

        var actionResult = await controller.DownloadImages(new PropertyMediaDownloadQueryParameters
        {
            FromPropertyNo = "50",
            ToPropertyNo = "10"
        }, CancellationToken.None);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<object>>(badRequestResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("From Property No cannot be greater than To Property No.", apiResponse.Message);
    }

    [Fact]
    public async Task CommaSeparatedIntModelBinder_BindsCommaSeparatedString_Successfully()
    {
        var binder = new CommaSeparatedIntModelBinder();
        var vpMock = new Mock<Microsoft.AspNetCore.Mvc.ModelBinding.IValueProvider>();
        vpMock.Setup(v => v.GetValue("WardIds"))
            .Returns(new Microsoft.AspNetCore.Mvc.ModelBinding.ValueProviderResult(new Microsoft.Extensions.Primitives.StringValues("89,90")));

        var bindingContext = new Microsoft.AspNetCore.Mvc.ModelBinding.DefaultModelBindingContext
        {
            ModelName = "WardIds",
            ValueProvider = vpMock.Object,
            ModelState = new Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary()
        };

        await binder.BindModelAsync(bindingContext);

        Assert.True(bindingContext.Result.IsModelSet);
        var list = Assert.IsType<List<int>>(bindingContext.Result.Model);
        Assert.Equal(new[] { 89, 90 }, list);
    }

    [Fact]
    public async Task CommaSeparatedIntModelBinder_BindsMultipleValues_Successfully()
    {
        var binder = new CommaSeparatedIntModelBinder();
        var vpMock = new Mock<Microsoft.AspNetCore.Mvc.ModelBinding.IValueProvider>();
        vpMock.Setup(v => v.GetValue("WardIds"))
            .Returns(new Microsoft.AspNetCore.Mvc.ModelBinding.ValueProviderResult(new Microsoft.Extensions.Primitives.StringValues(new[] { "89", "90" })));

        var bindingContext = new Microsoft.AspNetCore.Mvc.ModelBinding.DefaultModelBindingContext
        {
            ModelName = "WardIds",
            ValueProvider = vpMock.Object,
            ModelState = new Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary()
        };

        await binder.BindModelAsync(bindingContext);

        Assert.True(bindingContext.Result.IsModelSet);
        var list = Assert.IsType<List<int>>(bindingContext.Result.Model);
        Assert.Equal(new[] { 89, 90 }, list);
    }

    [Fact]
    public async Task FlexibleNullableIntModelBinder_ParsesCommaSeparatedFirstInt_Successfully()
    {
        var binder = new FlexibleNullableIntModelBinder();
        var vpMock = new Mock<Microsoft.AspNetCore.Mvc.ModelBinding.IValueProvider>();
        vpMock.Setup(v => v.GetValue("WardId"))
            .Returns(new Microsoft.AspNetCore.Mvc.ModelBinding.ValueProviderResult(new Microsoft.Extensions.Primitives.StringValues("89,90")));

        var bindingContext = new Microsoft.AspNetCore.Mvc.ModelBinding.DefaultModelBindingContext
        {
            ModelName = "WardId",
            ValueProvider = vpMock.Object,
            ModelState = new Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary()
        };

        await binder.BindModelAsync(bindingContext);

        Assert.True(bindingContext.Result.IsModelSet);
        Assert.Equal(89, (int)bindingContext.Result.Model!);
    }
}
