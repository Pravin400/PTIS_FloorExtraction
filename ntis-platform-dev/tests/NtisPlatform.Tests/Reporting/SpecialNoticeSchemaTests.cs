using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using MockQueryable;
using Moq;
using NtisPlatform.Api.Controllers.Reporting.Html;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities.Reporting;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public sealed class SpecialNoticeSchemaTests
{
    [Fact]
    public void Both_special_notice_data_sources_expose_the_logo_as_an_image()
    {
        var controller = Controller(Providers());

        var result = Assert.IsType<OkObjectResult>(controller.DataSources().Result);
        var sources = Assert.IsAssignableFrom<IReadOnlyList<HtmlReportDataSourceDto>>(result.Value);

        Assert.Equal(2, sources.Count);
        foreach (var source in sources) AssertLogo(source.Fields);
    }

    [Theory]
    [InlineData("SPECIAL_NOTICE", false)]
    [InlineData("SpecialNoticeReport", false)]
    [InlineData("SpecialNoticeDataProvider", false)]
    [InlineData("SPECIAL_NOTICE_THANE", true)]
    [InlineData("SpecialNoticeThaneDataProvider", true)]
    public async Task Schema_selects_the_correct_notice_regardless_of_registration_order(string code, bool thane)
    {
        var providers = Providers();
        foreach (var registration in new[] { providers, providers.Reverse().ToArray() })
        {
            var result = await Controller(registration).GetSchema(code, Repository(), CancellationToken.None);

            var fields = Fields(result);
            AssertLogo(fields);
            Assert.Equal(thane, fields.Any(field => field.Path == "ulbLogoStatus"));
        }
    }

    [Fact]
    public async Task An_older_database_schema_keeps_its_fields_and_gains_the_logo()
    {
        var fragment = new HtmlReportFragmentVersionEntity
        {
            VersionNo = 1,
            Status = "Published",
            Fragment = new HtmlReportFragmentEntity { FragmentCode = "SPECIAL_NOTICE", IsActive = true },
            FragmentJson = JsonSerializer.Serialize(new[]
            {
                new HtmlReportDataSourceFieldDto("custom", "Custom field", "field", "Custom")
            })
        };

        var result = await Controller(Providers()).GetSchema("SPECIAL_NOTICE", Repository(fragment), CancellationToken.None);

        var fields = Fields(result);
        AssertLogo(fields);
        Assert.Contains(fields, field => field.Path == "custom" && field.Label == "Custom field");
    }

    [Theory]
    [InlineData("\u00e0\u00a4\u00ae", "ULB Logo")]
    [InlineData("Municipal logo", "Municipal logo")]
    public async Task Database_logo_labels_are_repaired_without_replacing_readable_custom_labels(
        string storedLabel, string expectedLabel)
    {
        var fragment = new HtmlReportFragmentVersionEntity
        {
            VersionNo = 1,
            Status = "Published",
            Fragment = new HtmlReportFragmentEntity { FragmentCode = "SPECIAL_NOTICE", IsActive = true },
            FragmentJson = JsonSerializer.Serialize(new[]
            {
                new HtmlReportDataSourceFieldDto("ulbLogo", storedLabel, "image", "ULB")
            })
        };

        var result = await Controller(Providers()).GetSchema("SPECIAL_NOTICE", Repository(fragment), CancellationToken.None);

        var logo = Assert.Single(Fields(result), field => field.Path == "ulbLogo");
        Assert.Equal(expectedLabel, logo.Label);
        Assert.Equal("image", logo.ElementType);
    }

    private static void AssertLogo(IReadOnlyList<HtmlReportDataSourceFieldDto> fields)
    {
        var logo = Assert.Single(fields, field => field.Path == "ulbLogo");
        Assert.Equal("ULB Logo", logo.Label);
        Assert.Equal("image", logo.ElementType);
        Assert.Equal("ULB", logo.Group);
    }

    private static IReadOnlyList<HtmlReportDataSourceFieldDto> Fields(
        ActionResult<IReadOnlyList<HtmlReportDataSourceFieldDto>> result) =>
        Assert.IsAssignableFrom<IReadOnlyList<HtmlReportDataSourceFieldDto>>(
            Assert.IsType<OkObjectResult>(result.Result).Value);

    private static DesignerReportTemplatesController Controller(IReportDataProvider[] providers) =>
        new(Mock.Of<IHtmlReportService>(), new ReportDataProviderResolver(providers), providers);

    private static IReportingRepository<HtmlReportFragmentVersionEntity, long> Repository(
        params HtmlReportFragmentVersionEntity[] fragments)
    {
        var repository = new Mock<IReportingRepository<HtmlReportFragmentVersionEntity, long>>();
        repository.Setup(value => value.GetQueryable()).Returns(fragments.BuildMock());
        return repository.Object;
    }

    private static IReportDataProvider[] Providers() =>
    [
        new SpecialNoticeDataProvider(null!, null!, null!, null!, null!, null!, null!, null!),
        CreateThaneProvider()
    ];

    // Schema discovery must work without querying any of the report's data dependencies.
    private static SpecialNoticeThaneDataProvider CreateThaneProvider()
    {
        var constructor = typeof(SpecialNoticeThaneDataProvider).GetConstructors().Single();
        return (SpecialNoticeThaneDataProvider)constructor.Invoke(
            constructor.GetParameters().Select(_ => (object?)null).ToArray());
    }
}
