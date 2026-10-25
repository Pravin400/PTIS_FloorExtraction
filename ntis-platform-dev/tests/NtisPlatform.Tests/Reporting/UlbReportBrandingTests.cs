using System.Text.Json;
using System.Text.RegularExpressions;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Services.HtmlReport;

namespace NtisPlatform.Tests.Reporting;

public sealed class UlbReportBrandingTests
{
    private const string CurrentLogo = "data:image/png;base64,TkVX";
    private const string OldLogo = "data:image/png;base64,T0xE";
    private const string OldWatermark = "data:image/png;base64,V01BUks=";

    [Theory]
    [InlineData("THANE_KARAKARNI", true)]
    [InlineData("FrontpageThane", true)]
    [InlineData("TSR_SIGNREPORT_AUTOMATION", true)]
    [InlineData("SPECIAL_NOTICE_THANE", true)]
    [InlineData("THANE_KARAKARNI", false)]
    [InlineData("FrontpageThane", false)]
    [InlineData("TSR_SIGNREPORT_AUTOMATION", false)]
    [InlineData("SPECIAL_NOTICE_THANE", false)]
    public void All_four_reports_use_only_the_configured_logo_for_both_images(string reportCode, bool uploaded)
    {
        var template = Template(reportCode);
        var normalized = UlbReportBranding.Normalize(template);
        Assert.True(new HtmlReportTemplateValidator().Validate(normalized).IsValid);
        Assert.Equal(normalized, UlbReportBranding.Normalize(normalized));
        Assert.DoesNotContain(OldLogo, normalized);
        Assert.DoesNotContain(OldWatermark, normalized);
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            ulbLogo = uploaded ? CurrentLogo : null,
            CouncilLogo = OldLogo,
            logo = OldLogo
        }));

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.DoesNotContain(OldLogo, html);
        Assert.DoesNotContain(OldWatermark, html);
        Assert.DoesNotContain("OLD TEXT WATERMARK", html);
        Assert.Equal(uploaded ? 2 : 0, Regex.Matches(html, "<img\\b").Count);
        Assert.Equal(uploaded ? 2 : 0, Regex.Matches(html, Regex.Escape(CurrentLogo)).Count);
        if (uploaded) Assert.Contains("opacity:0.12", html);
    }

    [Theory]
    [InlineData("THANE_KARAKARNI")]
    [InlineData("FrontpageThane")]
    [InlineData("TSR_SIGNREPORT_AUTOMATION")]
    [InlineData("SPECIAL_NOTICE_THANE")]
    public void Watermark_is_added_when_missing_and_tracks_logo_changes_per_page(string reportCode)
    {
        var template = Template(reportCode, watermark: false);
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            records = new[] { new { ulbLogo = CurrentLogo }, new { ulbLogo = OldLogo } }
        }));

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Equal(2, Regex.Matches(html, "class=\"report-page\"").Count);
        Assert.Equal(2, Regex.Matches(html, Regex.Escape(CurrentLogo)).Count);
        Assert.Equal(2, Regex.Matches(html, Regex.Escape(OldLogo)).Count);
        Assert.Equal(4, Regex.Matches(html, "<img\\b").Count);
    }

    [Fact]
    public void Designer_normalization_preserves_photo_bindings_and_unrelated_reports()
    {
        var template = Template("SPECIAL_NOTICE_THANE");
        using var normalized = JsonDocument.Parse(UlbReportBranding.Normalize(template));
        var photo = normalized.RootElement.GetProperty("bands")[0].GetProperty("elements")
            .EnumerateArray().Single(element => element.GetProperty("id").GetString() == "property_photo");
        Assert.Equal("propertyPhoto", photo.GetProperty("path").GetString());
        var unrelated = Template("CUSTOM_REPORT");
        Assert.Equal(unrelated, UlbReportBranding.Normalize(unrelated));
    }

    [Fact]
    public void Nested_legacy_watermarks_are_replaced_by_one_page_watermark()
    {
        const string template = """
        {"reportCode":"FrontpageThane","page":{"widthMm":210,"heightMm":297},
         "elements":[{"type":"container","children":[
          {"id":"logo","type":"image","binding":"CouncilLogo","src":"old-logo"},
          {"id":"old-watermark","type":"watermark","text":"OLD TEXT WATERMARK","src":"old-watermark"}
         ]}],"bands":[]}
        """;
        using var normalized = JsonDocument.Parse(UlbReportBranding.Normalize(template));
        var elements = normalized.RootElement.GetProperty("elements");
        Assert.Single(elements.EnumerateArray(), element => element.GetProperty("type").GetString() == "watermark");
        var nestedLogo = elements[1].GetProperty("children")[0];
        Assert.Equal("ulbLogo", nestedLogo.GetProperty("path").GetString());
        Assert.False(nestedLogo.TryGetProperty("src", out _));
    }

    private static string Template(string code, bool watermark = true) => JsonSerializer.Serialize(new
    {
        schemaVersion = 3,
        reportCode = code,
        page = new { size = "A4", orientation = "portrait", widthMm = 210, heightMm = 297 },
        watermark = new { type = "text", text = "OLD TEXT WATERMARK", src = OldWatermark },
        elements = watermark
            ? new object[]
            {
                new { id = "old-watermark", type = "image", path = "CouncilLogo", src = OldWatermark,
                    x = 65, y = 115, w = 80, h = 70, style = new { opacity = .12 } }
            }
            : Array.Empty<object>(),
        bands = new[]
        {
            new { id = "header", type = "pageHeader", heightMm = 35, elements = new object[]
            {
                new { id = "imported-image-uuid", type = "image", src = OldLogo, x = 10, y = 10, w = 22, h = 22 },
                new { id = "property_photo", type = "image", path = "propertyPhoto", x = 150, y = 40, w = 40, h = 40 }
            } }
        }
    });
}
