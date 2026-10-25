using System.Text.Json;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Services.HtmlReport;

namespace NtisPlatform.Tests.Reporting;

public class ThaneKarakarniTemplateTests
{
    [Fact]
    public void InlineTemplateIsValidAndBindsOwnerAssessmentAndRoomData()
    {
        var template = ThaneKarakarniTestTemplate.Json;
        var validation = new HtmlReportTemplateValidator().Validate(template);
        Assert.True(validation.IsValid, JsonSerializer.Serialize(validation.Errors));
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            ownerNameEnglish = "Example property owner", addressEnglish = "Example address",
            wardNo = "NKPUNE01", propertyNo = "1", partitionNo = "A8", flatOrShopNo = "801",
            propertyCategory = "Apartment", totalCarpetAreaSqMeter = 10.5m, totalBuiltupAreaSqMeter = 12.6m,
            propertyDetails = new[] { new { floorDescription = "8", assessmentYear = "2026",
                constructionCode = "A", typeOfUseCode = "C", carpetAreaSqMeter = 10.5m,
                builtupAreaSqMeter = 12.6m, roomDimensions = "3 x 3.5", roomType = "Office" } }
        }));
        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);
        foreach (var value in new[] { "Example property owner", "Example address", "NKPUNE01", "801", "Apartment", "10.50", "12.60", "3 x 3.5", "Office" })
            Assert.Contains(value, html);
        Assert.DoesNotContain("{MarathiOwnerPrathamNav}", html);
        Assert.DoesNotContain("PhotoPlan1", html);
    }

    [Fact]
    public void NumericFormattingDoesNotChangeTextOrRawData()
    {
        const string template = """
        {"schemaVersion":3,"page":{"size":"A4","orientation":"portrait"},"elements":[
          {"id":"amount","type":"field","path":"amount","format":"0.00"},
          {"id":"description","type":"field","path":"description","format":"0.00"}]}
        """;
        using var data = JsonDocument.Parse("{\"amount\":2680.1329000000005,\"description\":\"Open Plot\"}");
        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);
        Assert.Contains("2680.13", html);
        Assert.Contains("Open Plot", html);
        Assert.Equal(2680.1329000000005, data.RootElement.GetProperty("amount").GetDouble());
    }
}
