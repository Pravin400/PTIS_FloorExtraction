using System.Text.Json;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Services.HtmlReport;

namespace NtisPlatform.Tests.Reporting;

public class ThaneKarakarniUnitHolderTests
{
    private const string Template = """
        {"reportCode":"THANE_KARAKARNI","page":{"widthMm":210,"heightMm":297},"bands":[
          {"id":"thane_header","type":"reportHeader","heightMm":20,"elements":[
            {"id":"thane_39","type":"text","text":"Unit Owner /Holder Name","x":0,"y":0,"w":60,"h":5},
            {"id":"thane_41","type":"field","path":"ownerNameEnglish","x":60,"y":0,"w":60,"h":5},
            {"id":"other_owner","type":"field","path":"ownerNameEnglish","x":0,"y":6,"w":60,"h":5},
            {"id":"builder","type":"field","path":"builderName","x":60,"y":6,"w":60,"h":5}]}]}
        """;

    [Theory]
    [InlineData("PROPERTY OCCUPIER", "PROPERTY OCCUPIER")]
    [InlineData(null, "")]
    [InlineData("", "")]
    public void OnlyTheUnitHolderValueUsesOccupierAndNeverFallsBackToOwner(string? occupier, string expected)
    {
        using var template = JsonDocument.Parse(Template);
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            ownerNameEnglish = "PROPERTY OWNER", occupierNameEnglish = occupier, builderName = "BUILDER"
        }));
        var originalData = data.RootElement.GetRawText();
        var bound = ThaneKarakarniPresentationRules.BindUnitHolder(template.RootElement);
        var elements = bound.GetProperty("bands")[0].GetProperty("elements");
        Assert.Equal("occupierNameEnglish", elements[1].GetProperty("path").GetString());
        Assert.Equal("ownerNameEnglish", elements[2].GetProperty("path").GetString());
        var html = new HtmlTemplateRenderer().Render(Template, data.RootElement);
        Assert.Contains("Unit Owner /Holder Name", html);
        Assert.Contains($">{expected}<", html);
        Assert.Contains(">PROPERTY OWNER<", html);
        Assert.Contains(">BUILDER<", html);
        Assert.Equal(Template, template.RootElement.GetRawText());
        Assert.Equal(originalData, data.RootElement.GetRawText());
    }

    [Fact]
    public void OtherReportsRetainTheirExistingOwnerBinding()
    {
        using var template = JsonDocument.Parse(Template.Replace("THANE_KARAKARNI", "KARAKARNI"));
        var original = template.RootElement.GetRawText();
        Assert.Equal(original, ThaneKarakarniPresentationRules.BindUnitHolder(template.RootElement).GetRawText());
    }
}
