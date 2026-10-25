using System.Text.Json;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;

namespace NtisPlatform.Tests.Reporting;

public sealed class HtmlReportingTests
{
    [Fact]
    public void Validator_accepts_a_valid_schema_v3_template()
    {
        var result = new HtmlReportTemplateValidator().Validate(TemplateJson("field"));

        Assert.True(result.IsValid);
        Assert.Equal(3, result.SchemaVersion);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Validator_and_renderer_accept_the_designer_watermark_element()
    {
        const string json = """
        {
          "schemaVersion": 2,
          "recordsPerPage": 5,
          "page": { "size": "Custom", "orientation": "landscape", "widthMm": 420, "heightMm": 297 },
          "elements": [],
          "bands": [{ "id": "header", "type": "reportHeader", "heightMm": 20, "elements": [
            { "id": "draft", "type": "watermark", "watermarkType": "text", "text": "DRAFT", "x": 1, "y": 1, "w": 100, "h": 10 }
          ] }]
        }
        """;

        var validation = new HtmlReportTemplateValidator().Validate(json);
        using var data = JsonDocument.Parse("{}");
        var html = new HtmlTemplateRenderer().Render(json, data.RootElement);

        Assert.True(validation.IsValid);
        Assert.Contains("DRAFT", html);
        Assert.Contains("opacity:0.12", html);
    }

    [Theory]
    [InlineData("image", "", true)]
    [InlineData(null, "", true)]
    [InlineData("image", "ulbLogo", false)]
    [InlineData(null, "ulbLogo", false)]
    [InlineData("image", "ulbLogo", true)]
    [InlineData(null, "ulbLogo", true)]
    public void Image_watermark_uses_only_the_bound_image(string? watermarkType, string binding, bool hasLogo)
    {
        const string templateImage = "data:image/png;base64,T0xE";
        const string configuredLogo = "data:image/png;base64,TkVX";
        var json = JsonSerializer.Serialize(new
        {
            schemaVersion = 3,
            page = new { size = "A4", orientation = "portrait", widthMm = 210, heightMm = 297 },
            elements = new[]
            {
                new { id = "watermark", type = "watermark", watermarkType, binding,
                    src = templateImage, x = 10, y = 30, w = 100, h = 100 }
            },
            bands = Array.Empty<object>()
        });
        using var data = JsonDocument.Parse(hasLogo
            ? JsonSerializer.Serialize(new { ulbLogo = configuredLogo }) : "{}");

        var html = new HtmlTemplateRenderer().Render(json, data.RootElement);

        Assert.DoesNotContain(templateImage, html);
        if (hasLogo && binding == "ulbLogo")
        {
            Assert.Contains(configuredLogo, html);
            Assert.Contains("<img", html);
        }
        else
        {
            Assert.DoesNotContain("<img", html);
            Assert.DoesNotContain("WATERMARK", html);
        }
    }

    [Fact]
    public void Validator_rejects_unknown_expression_operators()
    {
        var json = TemplateJson("field", "\"visibility\":{\"operator\":\"eval\",\"left\":{\"literal\":true}},");

        var result = new HtmlReportTemplateValidator().Validate(json);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, issue => issue.Code == "expression.operator");
    }

    [Fact]
    public void Validator_rejects_circular_fragments()
    {
        const string json = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [],
          "bands": [],
          "fragments": [
            { "code": "A", "bands": [{ "id": "a", "type": "subreport", "heightMm": 10, "fragmentCode": "B", "elements": [] }] },
            { "code": "B", "bands": [{ "id": "b", "type": "subreport", "heightMm": 10, "fragmentCode": "A", "elements": [] }] }
          ]
        }
        """;

        var result = new HtmlReportTemplateValidator().Validate(json);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, issue => issue.Code == "fragment.cycle");
    }

    [Fact]
    public void Renderer_preserves_marathi_and_encodes_untrusted_values()
    {
        using var data = JsonDocument.Parse("""{"owner":"<script>alert(1)</script> मराठी"}""");

        var html = new HtmlTemplateRenderer().Render(TemplateJson("field"), data.RootElement);

        Assert.Contains("मराठी", html);
        Assert.Contains("&lt;script&gt;alert(1)&lt;/script&gt;", html);
        Assert.DoesNotContain("<script>alert(1)</script>", html);
    }

    [Fact]
    public void Renderer_supports_bounded_aggregate_expressions()
    {
        const string json = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [
            { "id": "total", "type": "text", "x": 1, "y": 25, "w": 30, "h": 6, "text": "VISIBLE",
              "visibility": { "operator": "greaterThan", "left": { "operator": "sum", "left": { "path": "values" } }, "right": { "literal": 5 } } }
          ],
          "bands": []
        }
        """;
        using var data = JsonDocument.Parse("""{"verification":"verify-123","values":[2,4]}""");

        var html = new HtmlTemplateRenderer().Render(json, data.RootElement);

        Assert.Contains("VISIBLE", html);
    }

    [Fact]
    public void Renderer_preserves_designer_text_emphasis_and_rotation()
    {
        using var data = JsonDocument.Parse("""{"owner":"Styled value"}""");
        var json = TemplateJson(
            "field",
            "\"style\":{\"fontStyle\":\"italic\",\"textDecoration\":\"underline\",\"rotation\":90,\"verticalAlign\":\"bottom\"},");

        var html = new HtmlTemplateRenderer().Render(json, data.RootElement);

        Assert.Contains("font-style:italic;", html);
        Assert.Contains("text-decoration:underline;", html);
        Assert.Contains("transform:rotate(90deg);", html);
        Assert.Contains("transform-origin:center;", html);
        Assert.Contains("display:flex;align-items:flex-end;", html);
    }

    [Fact]
    public void Permission_notice_adapter_exposes_nested_fields_at_the_template_root()
    {
        using var source = JsonDocument.Parse(
            """{"council":{"name":"à¤¨à¤—à¤° à¤ªà¤°à¤¿à¤·à¤¦"},"property":{"ownerName":"à¤¸à¤¾à¤µà¤¿à¤¤à¥à¤°à¥€ à¤ªà¤¾à¤Ÿà¥€à¤²"}}""");
        var row = source.RootElement.Clone();
        var envelope = new HtmlReportDataEnvelope(
            [row],
            new Dictionary<string, IReadOnlyList<JsonElement>> { ["main"] = [row] },
            Guid.NewGuid());

        var adapted = new PermissionNoticeHtmlDataAdapter().Adapt(envelope);
        var json = JsonSerializer.SerializeToElement(adapted);

        Assert.Equal("à¤¨à¤—à¤° à¤ªà¤°à¤¿à¤·à¤¦", json.GetProperty("council").GetProperty("name").GetString());
        Assert.Equal("à¤¸à¤¾à¤µà¤¿à¤¤à¥à¤°à¥€ à¤ªà¤¾à¤Ÿà¥€à¤²", json.GetProperty("property").GetProperty("ownerName").GetString());
    }

    [Fact]
    public void Karakarni_adapter_creates_one_record_per_property_with_only_its_floor_rows()
    {
        using var mainSource = JsonDocument.Parse("""[{"propertyId":101,"propertyNo":"15"},{"propertyId":202,"propertyNo":"21"}]""");
        using var detailSource = JsonDocument.Parse("""[{"propertyId":202,"floorDescription":"Second"},{"propertyId":101,"floorDescription":"Ground"},{"propertyId":202,"floorDescription":"Third"}]""");
        var main = mainSource.RootElement.EnumerateArray().Select(x => x.Clone()).ToList();
        var details = detailSource.RootElement.EnumerateArray().Select(x => x.Clone()).ToList();
        var envelope = new HtmlReportDataEnvelope(main,
            new Dictionary<string, IReadOnlyList<JsonElement>>
            {
                ["main"] = main,
                ["propertyDetails"] = details
            }, Guid.NewGuid());

        var adapted = new KarakarniHtmlDataAdapter().Adapt(envelope);
        var json = JsonSerializer.SerializeToElement(adapted);
        var records = json.GetProperty("records");

        Assert.Equal(2, records.GetArrayLength());
        Assert.Equal("15", records[0].GetProperty("propertyNo").GetString());
        Assert.Single(records[0].GetProperty("propertyDetails").EnumerateArray());
        Assert.Equal(2, records[1].GetProperty("propertyDetails").GetArrayLength());
        Assert.All(records[1].GetProperty("propertyDetails").EnumerateArray(),
            row => Assert.Equal(202, row.GetProperty("propertyId").GetInt32()));
    }

    [Fact]
    public void Prarup_yadi_adapter_groups_floor_rows_into_printable_property_records()
    {
        using var mainSource = JsonDocument.Parse(
            """[{"ownerId":101,"propertyNo":"15","CouncilName":"Akola","CouncilLogo":"data:image/png;base64,AA==","propertyPhoto":"data:image/png;base64,AA=="},{"ownerId":202,"propertyNo":"21","CouncilName":"Akola"}]""");
        using var detailSource = JsonDocument.Parse(
            """[{"ownerId":202,"propertyNo":"21","FloorCode":"1","TotalTax":"220"},{"ownerId":101,"propertyNo":"15","FloorCode":"G","TotalTax":"110"},{"ownerId":202,"propertyNo":"21","FloorCode":"2","TotalTax":"220"}]""");
        var main = mainSource.RootElement.EnumerateArray().Select(row => row.Clone()).ToList();
        var details = detailSource.RootElement.EnumerateArray().Select(row => row.Clone()).ToList();
        var envelope = new HtmlReportDataEnvelope(main,
            new Dictionary<string, IReadOnlyList<JsonElement>>
            {
                ["PrarupYadi"] = main,
                ["PrarupYadiTaxInfo"] = details
            }, Guid.NewGuid());

        var adapted = new PrarupYadiHtmlDataAdapter().Adapt(envelope);
        var json = JsonSerializer.SerializeToElement(adapted);
        var records = json.GetProperty("records");

        Assert.Equal(2, records.GetArrayLength());
        Assert.Equal("Akola", json.GetProperty("CouncilName").GetString());
        Assert.Equal("data:image/png;base64,AA==", json.GetProperty("CouncilLogo").GetString() ?? string.Empty);
        Assert.Equal("data:image/png;base64,AA==", records[0].GetProperty("propertyPhoto").GetString());
        Assert.Single(records[0].GetProperty("floors").EnumerateArray());
        Assert.Equal(2, records[1].GetProperty("floors").GetArrayLength());
        Assert.Equal("220", records[1].GetProperty("TaxTotal").GetString());
    }


    [Fact]
    public void Renderer_applies_compact_dynamic_table_cell_styles()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [{
            "id": "floors", "type": "table", "x": 1, "y": 1, "w": 100, "h": 30,
            "path": "floors", "showHeader": false,
            "properties": { "cellBorderColor": "#008b8b", "cellBorderWidth": 0.5, "cellPaddingMm": 0.2, "cellFontSize": 7.5, "rowHeightMm": 4.2 },
            "columns": [{ "path": "FloorCode", "width": 10 }]
          }],
          "bands": []
        }
        """;
        using var data = JsonDocument.Parse("""{"floors":[{"FloorCode":"G"}]}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("border:0.5px solid #008b8b", html);
        Assert.Contains("padding:0.2mm", html);
        Assert.Contains("font-size:7.5px", html);
        Assert.Contains("height:4.2mm", html);
    }

    [Fact]
    public void Renderer_creates_one_page_per_record_and_accepts_designer_top_level_table_columns()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [
            { "id": "property", "type": "field", "x": 1, "y": 1, "w": 30, "h": 6, "path": "propertyId" },
            { "id": "floors", "type": "table", "x": 1, "y": 10, "w": 100, "h": 30, "path": "propertyDetails",
              "columns": [{ "label": "Floor", "path": "floorDescription", "width": 25 }] }
          ],
          "bands": []
        }
        """;
        using var data = JsonDocument.Parse("""{"records":[{"propertyId":101,"propertyDetails":[{"floorDescription":"Ground"}]},{"propertyId":202,"propertyDetails":[{"floorDescription":"First"}]}]}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Equal(2, html.Split("<section class=\"report-page\">", StringSplitOptions.None).Length - 1);
        Assert.Contains("<th style=\"width:25mm\">Floor</th>", html);
        Assert.Contains("Ground", html);
        Assert.Contains("First", html);
    }

    [Fact]
    public void Renderer_preserves_static_table_spans_sizes_styles_and_bound_content()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [],
          "bands": [{ "id": "detail", "type": "detail", "heightMm": 60, "elements": [
            { "id": "matrix", "type": "table", "x": 5, "y": 5, "w": 120, "h": 35,
              "table": {
                "version": 1, "rows": 3, "cols": 3,
                "columnWidths": [70, 100, 70], "rowHeights": [26, 30, 34],
                "cells": {
                  "0_0": { "content": "Property summary", "colSpan": 3, "style": { "textAlign": "center", "fontWeight": 700, "backgroundColor": "#e2e8f0" } },
                  "0_1": { "content": "", "hidden": true, "mergedInto": "0_0" },
                  "0_2": { "content": "", "hidden": true, "mergedInto": "0_0" },
                  "1_0": { "content": "Property", "rowSpan": 2 },
                  "2_0": { "content": "", "hidden": true, "mergedInto": "1_0" },
                  "1_1": { "content": "{propertyNo}" },
                  "1_2": { "content": "Wrapped text", "style": { "wrap": true, "padding": 6 } },
                  "2_1": { "content": "Owner" },
                  "2_2": { "content": "{ownerName}" }
                }
              }
            }
          ]}]
        }
        """;
        using var data = JsonDocument.Parse("""{"propertyNo":"P-101","ownerName":"Asha Patil"}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("colspan=\"3\"", html);
        Assert.Contains("rowspan=\"2\"", html);
        Assert.Contains("width:29.167%", html);
        Assert.Contains("height:34px", html);
        Assert.Contains("background:#e2e8f0", html);
        Assert.Contains("padding:6px", html);
        Assert.Contains("P-101", html);
        Assert.Contains("Asha Patil", html);
    }

    [Fact]
    public void Renderer_resolves_inline_text_fields_and_matches_designer_font_units()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [],
          "bands": [{ "id": "detail", "type": "detail", "heightMm": 30, "elements": [
            { "id": "certificate-text", "type": "text", "x": 5, "y": 5, "w": 180, "h": 15,
              "text": "Applicant {ownerTitle} {ownerName} / Property {{propertyNo}}",
              "style": { "fontSize": 9, "background": "#ffffff", "borderColor": "#1e293b", "borderWidth": 1, "padding": 4 }
            }
          ]}]
        }
        """;
        using var data = JsonDocument.Parse("""{"ownerTitle":"Mr.","ownerName":"Ajay Patil","propertyNo":"P-101"}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("Applicant Mr. Ajay Patil / Property P-101", html);
        Assert.Contains("font-size:9px", html);
        Assert.DoesNotContain("border-color:#1e293b", html);
    }

    [Fact]
    public void Renderer_keeps_records_detail_rows_together_when_they_fit_on_one_page()
    {
        const string template = """
        {
          "schemaVersion": 2,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [],
          "bands": [{ "id": "rows", "type": "detail", "heightMm": 20, "dataPath": "records", "elements": [
            { "id": "property", "type": "field", "x": 1, "y": 1, "w": 40, "h": 8, "path": "propertyNo" }
          ] }]
        }
        """;
        using var data = JsonDocument.Parse("""{"records":[{"propertyNo":"A-1"},{"propertyNo":"A-2"}]}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Equal(1, html.Split("<section class=\"report-page\">", StringSplitOptions.None).Length - 1);
        Assert.Contains("A-1", html);
        Assert.Contains("A-2", html);
    }

    [Fact]
    public void Renderer_paginates_five_akola_sized_property_rows_per_page()
    {
        const string template = """
        {
          "schemaVersion": 2,
          "page": { "size": "Custom", "orientation": "landscape", "widthMm": 420, "heightMm": 297 },
          "elements": [],
          "bands": [
            { "id": "header", "type": "reportHeader", "heightMm": 24, "elements": [] },
            { "id": "columns", "type": "groupHeader", "heightMm": 22, "elements": [] },
            { "id": "rows", "type": "detail", "heightMm": 45, "dataPath": "records", "elements": [
              { "id": "property", "type": "field", "x": 1, "y": 1, "w": 40, "h": 8, "path": "propertyNo" }
            ] },
            { "id": "footer", "type": "reportFooter", "heightMm": 16, "elements": [] }
          ]
        }
        """;
        using var data = JsonDocument.Parse("""{"records":[{"propertyNo":"A-1"},{"propertyNo":"A-2"},{"propertyNo":"A-3"},{"propertyNo":"A-4"},{"propertyNo":"A-5"},{"propertyNo":"A-6"},{"propertyNo":"A-7"},{"propertyNo":"A-8"}]}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Equal(2, html.Split("<section class=\"report-page\">", StringSplitOptions.None).Length - 1);
        Assert.All(Enumerable.Range(1, 8), number => Assert.Contains($"A-{number}", html));
    }

    [Fact]
    public void Renderer_repeats_inline_subreport_elements_for_dynamic_child_rows()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [],
          "bands": [{
            "id": "floor-subreport", "type": "subreport", "heightMm": 8,
            "dataPath": "propertyDetails",
            "elements": [
              { "id": "floor", "type": "field", "x": 1, "y": 1, "w": 40, "h": 6, "path": "floorDescription" }
            ]
          }]
        }
        """;
        using var data = JsonDocument.Parse("""{"propertyDetails":[{"floorDescription":"Ground"},{"floorDescription":"First"},{"floorDescription":"Second"}]}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("Ground", html);
        Assert.Contains("First", html);
        Assert.Contains("Second", html);
    }

    [Fact]
    public void Renderer_resolves_inline_subreport_rows_nested_in_bulk_records()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [],
          "bands": [
            { "id": "properties", "type": "detail", "heightMm": 5, "dataPath": "records", "elements": [] },
            { "id": "floor-subreport", "type": "subreport", "heightMm": 8,
              "dataPath": "propertyDetails",
              "elements": [
                { "id": "floor", "type": "field", "x": 1, "y": 1, "w": 40, "h": 6, "path": "floorDescription" }
              ]
            }
          ]
        }
        """;
        using var data = JsonDocument.Parse("""{"records":[{"propertyNo":"A-1","propertyDetails":[{"floorDescription":"Ground floor"}]},{"propertyNo":"A-2","propertyDetails":[{"floorDescription":"First floor"},{"floorDescription":"Second floor"}]}]}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("Ground floor", html);
        Assert.Contains("First floor", html);
        Assert.Contains("Second floor", html);
    }

    [Fact]
    public void Renderer_binds_non_detail_bands_to_the_single_record_page_context()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "recordsPerPage": 1,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [],
          "bands": [
            { "id": "property", "type": "detail", "heightMm": 8, "dataPath": "records", "elements": [
              { "id": "property-no", "type": "field", "x": 1, "y": 1, "w": 40, "h": 6, "path": "propertyNo" }
            ] },
            { "id": "owner", "type": "groupHeader", "heightMm": 8, "elements": [
              { "id": "owner-name", "type": "field", "x": 1, "y": 1, "w": 60, "h": 6, "path": "ownerName" }
            ] },
            { "id": "totals", "type": "groupFooter", "heightMm": 8, "elements": [
              { "id": "total-tax", "type": "field", "x": 1, "y": 1, "w": 40, "h": 6, "path": "totalTax" }
            ] }
          ]
        }
        """;
        using var data = JsonDocument.Parse("""{"records":[{"propertyNo":"P-101","ownerName":"Asha Patil","totalTax":1106}]}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("P-101", html);
        Assert.Contains("Asha Patil", html);
        Assert.Contains("1106", html);
    }

    [Fact]
    public void Renderer_does_not_render_borders_when_border_color_is_none()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [
            { "id": "t1", "type": "text", "x": 1, "y": 1, "w": 50, "h": 10, "text": "Hello",
              "style": { "borderWidth": 0.3, "borderColor": "none" } },
            { "id": "f1", "type": "field", "x": 1, "y": 15, "w": 50, "h": 10, "binding": "title",
              "style": { "borderWidth": 0.3, "borderColor": "none" } }
          ],
          "bands": []
        }
        """;
        using var data = JsonDocument.Parse("""{"title":"Sample"}""");
        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.DoesNotContain("border-style:solid", html);
        Assert.DoesNotContain("border-width:", html);
        Assert.Contains("Hello", html);
        Assert.Contains("Sample", html);
    }

    [Fact]
    public void Renderer_renders_single_border_for_line_element_without_box_borders()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [
            { "id": "line1", "type": "line", "x": 5, "y": 10, "w": 190, "h": 0.3,
              "style": { "borderWidth": 0.3, "borderColor": "none", "backgroundColor": "#000000" } }
          ],
          "bands": []
        }
        """;
        using var data = JsonDocument.Parse("{}");
        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("border-top:0.3px solid #000000", html);
        Assert.DoesNotContain("border-style:solid", html);
    }

    [Fact]
    public void Renderer_does_not_render_broken_image_tag_for_unresolved_relative_urls()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [
            { "id": "img1", "type": "image", "x": 1, "y": 1, "w": 30, "h": 10, "binding": "logo" }
          ],
          "bands": []
        }
        """;
        using var relativeData = JsonDocument.Parse("""{"logo":"/api/UlbImageMaster/123/view"}""");
        var htmlRelative = new HtmlTemplateRenderer().Render(template, relativeData.RootElement);
        Assert.DoesNotContain("<img", htmlRelative);

        using var base64Data = JsonDocument.Parse("""{"logo":"data:image/png;base64,iVBORw0KGgo="}""");
        var htmlBase64 = new HtmlTemplateRenderer().Render(template, base64Data.RootElement);
        Assert.Contains("<img", htmlBase64);
        Assert.Contains("data:image/png;base64,iVBORw0KGgo=", htmlBase64);
    }

    [Fact]
    public void Renderer_resolves_bindings_case_insensitively()
    {
        const string template = """
        {
          "schemaVersion": 3,
          "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
          "elements": [
            { "id": "mobile", "type": "field", "x": 1, "y": 1, "w": 40, "h": 8, "binding": "MobileNo" },
            { "id": "logo", "type": "image", "x": 1, "y": 10, "w": 30, "h": 10, "binding": "CouncilLogo" }
          ],
          "bands": []
        }
        """;
        using var data = JsonDocument.Parse("""{"mobileNo":"9876543210","councilLogo":"data:image/png;base64,iVBORw0KGgo="}""");

        var html = new HtmlTemplateRenderer().Render(template, data.RootElement);

        Assert.Contains("9876543210", html);
        Assert.Contains("data:image/png;base64,iVBORw0KGgo=", html);
    }

    private static string TemplateJson(string elementType, string extra = "") => $$"""
    {
      "schemaVersion": 3,
      "page": { "size": "A4", "orientation": "portrait", "widthMm": 210, "heightMm": 297 },
      "elements": [{ "id": "owner", "type": "{{elementType}}", "x": 1, "y": 1, "w": 80, "h": 8, {{extra}} "binding": "owner" }],
      "bands": []
    }
    """;
}
