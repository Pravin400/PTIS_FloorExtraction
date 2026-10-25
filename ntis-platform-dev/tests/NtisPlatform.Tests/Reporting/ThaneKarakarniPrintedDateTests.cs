using System.Text.Json;
using System.Text.RegularExpressions;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Services.ReportDataProviders;

namespace NtisPlatform.Tests.Reporting;

public class ThaneKarakarniPrintedDateTests
{
    [Fact]
    public void ProviderExposesPrintDateForDesignerBinding()
    {
        var constructor = typeof(KarakarniDataProvider).GetConstructors().Single();
        var provider = (KarakarniDataProvider)constructor.Invoke(new object?[constructor.GetParameters().Length]);
        Assert.Contains(provider.GetSchemaFields(), field => field.Path == "printDate");
    }

    [Fact]
    public void RendererUsesProvidedDateWithoutReplacingItWithTodaysDate()
    {
        using var data = JsonDocument.Parse("{\"printDate\":\"05-10-2026\"}");
        var html = new HtmlTemplateRenderer().Render(ThaneKarakarniTestTemplate.Json, data.RootElement);
        Assert.Contains("Printed Date: 05-10-2026", html);
        Assert.Equal("05-10-2026", data.RootElement.GetProperty("printDate").GetString());
    }

    [Fact]
    public void DateBindingRepeatsOnRoomContinuationPages()
    {
        var rooms = Enumerable.Range(1, 60).Select(id => new { roomId = id, totalAreaSqMtr = 1m, noOfRooms = 1m });
        var data = JsonSerializer.SerializeToElement(new { printDate = "06-10-2026", propertyDetails = new[] {
            new { floorCode = "8", typeOfUseCode = "C", carpetAreaSqMeter = 60m, builtupAreaSqMeter = 72m, rooms }
        }});
        var html = new HtmlTemplateRenderer().Render(ThaneKarakarniTestTemplate.Json, data);
        Assert.Equal(3, Regex.Matches(html, "class=\"report-page\"").Count);
        Assert.Equal(3, Regex.Matches(html, "Printed Date: 06-10-2026").Count);
    }
}
