using System.Text.Json;
using Ntis.Reporting.Rendering.Html;

namespace NtisPlatform.Tests.Reporting;

public class ReportPhotoSeparationTests
{
    private const string Template = """
        {"page":{"widthMm":210,"heightMm":297},"bands":[{"id":"detail","type":"detail","elements":[
          {"id":"property_photo_image","type":"image","path":"propertyPhoto","x":0,"y":0,"w":40,"h":40},
          {"id":"plan_photo_image","type":"image","path":"planPhoto","x":50,"y":0,"w":40,"h":40}
        ]}]}
        """;

    [Fact]
    public void MissingPlanDoesNotDuplicateThePropertyPhoto()
    {
        using var data = JsonDocument.Parse("""{"propertyPhoto":"data:image/png;base64,cHJvcGVydHk=","planPhoto":null}""");
        var html = new HtmlTemplateRenderer().Render(Template, data.RootElement);
        Assert.Equal(1, html.Split("src=\"data:image/png;base64,cHJvcGVydHk=\"").Length - 1);
        Assert.Contains("फोटो उपलब्ध नाही", html);
    }

    [Theory]
    [InlineData("planPhoto")]
    [InlineData("buildingPlanPhoto")]
    public void RendersThePlanSeparatelyIncludingItsBindingAlias(string planKey)
    {
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new Dictionary<string, string>
        {
            ["propertyPhoto"] = "data:image/png;base64,cHJvcGVydHk=",
            [planKey] = "data:image/png;base64,cGxhbg==",
        }));
        var html = new HtmlTemplateRenderer().Render(Template, data.RootElement);
        Assert.Equal(1, html.Split("src=\"data:image/png;base64,cHJvcGVydHk=\"").Length - 1);
        Assert.Equal(1, html.Split("src=\"data:image/png;base64,cGxhbg==\"").Length - 1);
    }
}
