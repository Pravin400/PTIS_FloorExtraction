using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Reporting;

public class KarakarniLogoIntegrationTests
{
    [Theory]
    [InlineData("ulbLogo", "header_logo", false)]
    [InlineData("logo", "header_logo", false)]
    [InlineData("councilLogo", "header_logo", false)]
    [InlineData("municipal_logo", "header_logo", false)]
    [InlineData("", "municipal_logo", false)]
    [InlineData("", "logo", false)]
    [InlineData("", "decoration", true)]
    public void Renderer_ignores_template_src_for_logos_only(string binding, string id, bool usesTemplateImage)
    {
        const string templateImage = "data:image/png;base64,T0xE";
        var templateJson = JsonSerializer.Serialize(new
        {
            schemaVersion = 3,
            page = new { size = "A4", orientation = "portrait", widthMm = 210, heightMm = 297 },
            elements = new[]
            {
                new { id, type = "image", binding, src = templateImage, x = 10, y = 10, w = 20, h = 20 }
            },
            bands = Array.Empty<object>()
        });
        using var data = JsonDocument.Parse("{}");

        var html = new HtmlTemplateRenderer().Render(templateJson, data.RootElement);

        if (usesTemplateImage)
        {
            Assert.Contains(templateImage, html);
            Assert.Contains("<img", html);
        }
        else
        {
            Assert.DoesNotContain(templateImage, html);
            Assert.DoesNotContain("<img", html);
        }
    }

    [Fact]
    public void HtmlTemplateRenderer_Renders_MunicipalLogo_When_Path_Is_UlbLogo()
    {
        var templateJson = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "bands": [
            {
              "id": "header",
              "type": "detail",
              "elements": [
                {
                  "id": "municipal_logo",
                  "type": "image",
                  "x": 9.3,
                  "y": 4.5,
                  "w": 22.5,
                  "h": 17.2,
                  "path": "ulbLogo",
                  "style": { "objectFit": "contain" }
                }
              ]
            }
          ]
        }
        """;

        var fakeBase64Logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        using var dataDoc = JsonDocument.Parse($$"""
        {
            "ulbLogo": "{{fakeBase64Logo}}"
        }
        """);

        var renderer = new HtmlTemplateRenderer();
        var html = renderer.Render(templateJson, dataDoc.RootElement);

        Assert.Contains("<img", html);
        Assert.Contains(fakeBase64Logo, html);
        Assert.Contains("left:9.3mm;top:4.5mm;width:22.5mm;height:17.2mm;", html);
    }

    [Fact]
    public void HtmlTemplateRenderer_FallsBack_To_UlbLogo_When_Binding_Is_MunicipalLogo()
    {
        var templateJson = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "bands": [
            {
              "id": "header",
              "type": "detail",
              "elements": [
                {
                  "id": "municipal_logo",
                  "type": "image",
                  "x": 9.3,
                  "y": 4.5,
                  "w": 22.5,
                  "h": 17.2,
                  "binding": "municipal_logo",
                  "style": { "objectFit": "contain" }
                }
              ]
            }
          ]
        }
        """;

        var fakeBase64Logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        using var dataDoc = JsonDocument.Parse($$"""
        {
            "ulbLogo": "{{fakeBase64Logo}}"
        }
        """);

        var renderer = new HtmlTemplateRenderer();
        var html = renderer.Render(templateJson, dataDoc.RootElement);

        Assert.Contains("<img", html);
        Assert.Contains(fakeBase64Logo, html);
    }
}
