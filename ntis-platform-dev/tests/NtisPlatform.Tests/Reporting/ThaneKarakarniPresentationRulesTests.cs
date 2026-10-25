using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Services.HtmlReport;

namespace NtisPlatform.Tests.Reporting;

public class ThaneKarakarniPresentationRulesTests
{
    [Theory]
    [InlineData("OP", "C")]
    [InlineData("8", "OPC")]
    [InlineData(" op ", "C")]
    [InlineData("8", " opc ")]
    public void OpenPlotRowsAreRemovedFromBothTablesAndTheirTotals(string floor, string use)
    {
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            totalCarpetAreaSqMeter = 60m, totalBuiltupAreaSqMeter = 80m,
            annualRentalValue = 1500m, maintenance = 150m, rateableValue = 1350m,
            propertyDetails = new[] { Row("retained", "8", "C", 10m, 20m, 1000m),
                Row("excluded", floor, use, 50m, 60m, 500m) }
        }));
        var original = data.RootElement.GetRawText();

        var text = RenderText("THANE_KARAKARNI", data.RootElement);

        Assert.Equal(2, Regex.Matches(text, "retained").Count);
        Assert.DoesNotContain("excluded", text);
        Assert.Contains("10.00", text);
        Assert.Contains("20.00", text);
        Assert.Contains("1000.00", text);
        Assert.Contains("100.00", text);
        Assert.Contains("900.00", text);
        Assert.DoesNotContain("60.00", text);
        Assert.DoesNotContain("1500.00", text);
        Assert.Equal(original, data.RootElement.GetRawText());
    }

    [Theory]
    [InlineData("KARAKARNI")]
    [InlineData("PRARUP_YADI")]
    [InlineData(null)]
    public void OtherReportsKeepOpenPlotRowsAndExistingTotals(string? reportCode)
    {
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            totalCarpetAreaSqMeter = 50m,
            propertyDetails = new[] { Row("openplot", "OP", "OPC", 50m, 60m, 500m) }
        }));

        var text = RenderText(reportCode, data.RootElement);

        Assert.Equal(2, Regex.Matches(text, "openplot").Count);
        Assert.Contains("50.00", text);
    }

    [Fact]
    public void TotalsAreCalculatedSeparatelyForEachPropertyIncludingAnEmptyTable()
    {
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            records = new[]
            {
                new { totalCarpetAreaSqMeter = 60m,
                    propertyDetails = new[] { Row("first-retained", "8", "C", 10m, 20m, 1000m),
                        Row("first-excluded", "OP", "C", 50m, 60m, 500m) } },
                new { totalCarpetAreaSqMeter = 90m,
                    propertyDetails = new[] { Row("second-excluded", "8", "OPC", 90m, 100m, 500m) } }
            }
        }));

        var text = RenderText("THANE_KARAKARNI", data.RootElement);

        Assert.Equal(2, Regex.Matches(text, "first-retained").Count);
        Assert.DoesNotContain("excluded", text);
        Assert.Contains("10.00", text);
        Assert.Contains("0.00", text);
        Assert.DoesNotContain("60.00", text);
        Assert.DoesNotContain("90.00", text);
    }

    [Fact]
    public void AssessmentUsesSavedFloorAreasWithoutChangingTaxValuesOrSourceData()
    {
        using var template = JsonDocument.Parse("""{"reportCode":"THANE_KARAKARNI"}""");
        using var data = JsonDocument.Parse("""
        {
          "totalCarpetAreaSqMeter":243.29,"totalBuiltupAreaSqMeter":291.95,
          "annualRentalValue":457585.31,"maintenance":45758.53,"rateableValue":411826.78,
          "propertyDetails":[{
            "floorCode":"8","typeOfUseCode":"C","carpetAreaSqMeter":243.29,"builtupAreaSqMeter":291.95,
            "monthlyRate":118.40,"annualRentalValue":457585.31,"maintenance":45758.53,"rateableValue":411826.78
          }]
        }
        """);
        var original = data.RootElement.GetRawText();

        var result = ThaneKarakarniPresentationRules.Apply(template.RootElement, data.RootElement);
        var row = Assert.Single(result.GetProperty("propertyDetails").EnumerateArray());

        Assert.Equal(243.29m, row.GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(243.29m, result.GetProperty("totalCarpetAreaSqMeter").GetDecimal());
        Assert.Equal(291.95m, row.GetProperty("builtupAreaSqMeter").GetDecimal());
        Assert.Equal(291.95m, result.GetProperty("totalBuiltupAreaSqMeter").GetDecimal());
        foreach (var field in new[] { "annualRentalValue", "maintenance", "rateableValue" })
        {
            Assert.Equal(data.RootElement.GetProperty(field).GetDecimal(), result.GetProperty(field).GetDecimal());
            Assert.Equal(data.RootElement.GetProperty("propertyDetails")[0].GetProperty(field).GetDecimal(), row.GetProperty(field).GetDecimal());
        }
        Assert.Equal(118.40m, row.GetProperty("monthlyRate").GetDecimal());
        Assert.Equal(original, data.RootElement.GetRawText());
        Assert.Equal(result.GetRawText(), ThaneKarakarniPresentationRules.Apply(template.RootElement, result).GetRawText());
    }

    [Fact]
    public void AssessmentKeepsEachVisibleFloorsSavedCarpetAndTheirTotal()
    {
        using var template = JsonDocument.Parse("""{"reportCode":"THANE_KARAKARNI"}""");
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            totalCarpetAreaSqMeter = 80m,
            propertyDetails = new[] { Row("first", "8", "C", 50m, 100m, 1000m),
                Row("second", "9", "R", 30m, 50m, 500m) }
        }));

        var result = ThaneKarakarniPresentationRules.Apply(template.RootElement, data.RootElement);

        Assert.Equal(50m, result.GetProperty("propertyDetails")[0].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(30m, result.GetProperty("propertyDetails")[1].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(80m, result.GetProperty("totalCarpetAreaSqMeter").GetDecimal());
    }

    private static object Row(string label, string floor, string use, decimal carpet, decimal builtup, decimal rental) => new
    {
        label, floorCode = floor, typeOfUseCode = use,
        carpetAreaSqMeter = carpet, builtupAreaSqMeter = builtup,
        annualRentalValue = rental, maintenance = rental / 10, rateableValue = rental * .9m
    };

    private static string RenderText(string? reportCode, JsonElement data)
    {
        var template = new JsonObject
        {
            ["schemaVersion"] = 3,
            ["page"] = new JsonObject { ["size"] = "A4", ["orientation"] = "portrait" },
            ["bands"] = new JsonArray(
                JsonNode.Parse("""{"id":"assessment","type":"subreport","dataPath":"propertyDetails","heightMm":5,"elements":[{"type":"field","path":"label"}]}"""),
                JsonNode.Parse("""{"id":"rooms","type":"subreport","dataPath":"propertyDetails","heightMm":5,"elements":[{"type":"field","path":"label"}]}"""),
                JsonNode.Parse("""{"id":"totals","type":"groupFooter","heightMm":5,"elements":[{"type":"field","path":"totalCarpetAreaSqMeter","format":"number"},{"type":"field","path":"totalBuiltupAreaSqMeter","format":"number"},{"type":"field","path":"annualRentalValue","format":"number"},{"type":"field","path":"maintenance","format":"number"},{"type":"field","path":"rateableValue","format":"number"}]}"""))
        };
        if (reportCode is not null) template["reportCode"] = reportCode;
        var html = new HtmlTemplateRenderer().Render(template.ToJsonString(), data);
        return Regex.Replace(html, "<[^>]*>", " ");
    }
}
