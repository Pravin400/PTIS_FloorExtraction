using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using MockQueryable;
using Moq;
using NtisPlatform.Api.Controllers.Reporting.Html;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities.Reporting;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class KarakarniSchemaTests
{
    private static readonly string[] RequiredPaths =
    [
        "propertyTax", "PropertyTax", "newRent", "NewRent", "new_rent",
        "newToiletNo", "NewToiletNo", "new_toilet_no",
        "commToiletNo", "CommToiletNo", "commtoiletNo", "commtoilet_no",
        "oldToiletNo", "oldRent", "oldALV",
    ];

    [Fact]
    public void ProviderExposesEveryNumericBindingAlias()
    {
        AssertRequiredFields(CreateProvider().GetSchemaFields());
    }

    [Theory]
    [InlineData("KarakarniDataProvider")]
    [InlineData("KarakarniReport")]
    [InlineData("KARAKARNI")]
    public async Task DatabaseSchemaKeepsCustomFieldsAndIncludesProviderAliases(string requestedCode)
    {
        var provider = CreateProvider();
        var databaseFields = new List<HtmlReportDataSourceFieldDto>
        {
            new("propertyTax", "Custom tax label", "field", "Custom group", "number"),
            new("databaseOnly", "Database custom field", "field", "Custom group"),
        };
        var fragment = new HtmlReportFragmentVersionEntity
        {
            VersionNo = 1,
            Status = "Published",
            Fragment = new HtmlReportFragmentEntity { FragmentCode = "KARAKARNI", IsActive = true },
            FragmentJson = JsonSerializer.Serialize(databaseFields),
        };
        var repository = new Mock<IReportingRepository<HtmlReportFragmentVersionEntity, long>>();
        repository.Setup(repo => repo.GetQueryable()).Returns(new[] { fragment }.BuildMock());
        var resolver = new Mock<IReportDataProviderResolver>();
        resolver.Setup(value => value.Resolve(It.IsAny<string>())).Throws(new KeyNotFoundException());
        resolver.Setup(value => value.Resolve(provider.ProviderCode)).Returns(provider);
        var controller = new DesignerReportTemplatesController(
            Mock.Of<IHtmlReportService>(), resolver.Object, [provider]);

        var result = await controller.GetSchema(requestedCode, repository.Object, CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        var fields = Assert.IsAssignableFrom<IReadOnlyList<HtmlReportDataSourceFieldDto>>(response.Value);
        AssertRequiredFields(fields);
        Assert.Equal("Custom tax label", Assert.Single(fields, field => field.Path == "propertyTax").Label);
        Assert.Contains(fields, field => field.Path == "databaseOnly");
    }

    private static void AssertRequiredFields(IReadOnlyList<HtmlReportDataSourceFieldDto> fields)
    {
        foreach (var path in RequiredPaths)
        {
            var field = Assert.Single(fields, field => field.Path == path);
            Assert.Equal("number", field.ValueType);
            Assert.Equal("field", field.ElementType);
        }
    }

    // Schema discovery does not query any of the provider's data dependencies.
    private static KarakarniDataProvider CreateProvider() => new(
        propertyRepository: null!, wardRepository: null!, societyRepository: null!,
        typeOfUseRepository: null!, propertyDetailsRepository: null!, floorRepository: null!,
        constructionTypeRepository: null!, transmastRepository: null!, taxMastRepository: null!,
        ulbMasterRepository: null!, userRepository: null!, yearRepository: null!,
        propertyTypeRepository: null!, rvResultsRepository: null!, wingRepository: null!,
        propertyPhotoRepository: null!, buildingPlanRepository: null!, propertyMastOldRepository: null!,
        documentApplicationService: null!, cache: null!, currentTenant: null!, logger: null!, ulbConfigService: null!);
}
