using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using NtisPlatform.Application.Services.HtmlReport;

namespace Ntis.Reporting.Rendering.Html;

public interface IHtmlTemplateRenderer
{
    string Render(string templateJson, JsonElement data, IReadOnlyDictionary<string, string>? pinnedFragments = null);
}

public sealed class HtmlTemplateRenderer : IHtmlTemplateRenderer
{
    public string Render(string templateJson, JsonElement data, IReadOnlyDictionary<string, string>? pinnedFragments = null)
    {
        using var templateDocument = JsonDocument.Parse(templateJson, new JsonDocumentOptions { MaxDepth = 64 });
        var template = ThaneKarakarniPresentationRules.BindUnitHolder(templateDocument.RootElement);
        template = SignpageThanePresentationRules.BindOffices(template);
        template = UlbReportBranding.Normalize(template);
        var page = template.GetProperty("page");
        var width = Number(page, "widthMm", 210); var height = Number(page, "heightMm", 297);
        if (String(page, "orientation") == "landscape" && height > width) (width, height) = (height, width);
        var body = new StringBuilder();
        if (data.ValueKind == JsonValueKind.Object
            && data.TryGetProperty("records", out var many)
            && many.ValueKind == JsonValueKind.Array
            && HasRecordsDetailBand(template))
        {
            var records = many.EnumerateArray().Select(x => x.Clone()).ToList();
            var recordsPerPage = RecordsPerPage(template, height);
            for (var offset = 0; offset < records.Count; offset += recordsPerPage)
            {
                var pageData = WithRecords(data, records.Skip(offset).Take(recordsPerPage));
                foreach (var (noticeTemplate, noticeData) in SpecialNoticeThanePagination.Pages(template, pageData, height))
                    AppendPage(noticeTemplate, noticeData, body, pinnedFragments);
            }
        }
        else
        {
            var records = data.ValueKind == JsonValueKind.Object
                          && data.TryGetProperty("records", out many)
                          && many.ValueKind == JsonValueKind.Array
                ? many.EnumerateArray().Select(x => x.Clone()).ToList()
                : [data.Clone()];
            foreach (var record in records)
                foreach (var (pageTemplate, pageData) in ThaneKarakarniRoomTable.Pages(template, record, height))
                    foreach (var (noticeTemplate, noticeData) in SpecialNoticeThanePagination.Pages(pageTemplate, pageData, height))
                        AppendPage(noticeTemplate, noticeData, body, pinnedFragments);
        }
        var pageHeightMm = height > 1 ? height - 0.5 : height;
        return $$"""
        <!doctype html><html lang="mr"><head><meta charset="utf-8"><style>
        @page { size: {{width.ToString(CultureInfo.InvariantCulture)}}mm {{height.ToString(CultureInfo.InvariantCulture)}}mm; margin: 0; }
        * { box-sizing: border-box; } html,body { margin:0; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; overflow:hidden; }
        body { font-family: "Noto Sans Devanagari", "Nirmala UI", Arial, sans-serif; background:#fff; }
        .report-page { position:relative; width:{{width.ToString(CultureInfo.InvariantCulture)}}mm; height:{{pageHeightMm.ToString(CultureInfo.InvariantCulture)}}mm; max-height:{{pageHeightMm.ToString(CultureInfo.InvariantCulture)}}mm; overflow:hidden; page-break-after:always; break-after:page; background:white; }
        .report-page:last-of-type { page-break-after:avoid !important; break-after:avoid !important; }
        .el { position:absolute; overflow:hidden; white-space:pre-wrap; }
        table { border-collapse:collapse; width:100%; } td,th { border:0.2mm solid #bbb; padding:1mm; }
        </style></head><body>{{body}}</body></html>
        """;
    }

    private static void AppendPage(JsonElement template, JsonElement data, StringBuilder body,
        IReadOnlyDictionary<string, string>? pinnedFragments)
    {
        data = ThaneKarakarniPresentationRules.Apply(template, data);
        var pageBorderCss = PageBorderCss(template);
        var pageBorderInsetCss = PageBorderInsetCss(template);
        var pageStyle = pageBorderInsetCss.Length == 0 && pageBorderCss.Length > 0
            ? $" style=\"{pageBorderCss}\""
            : string.Empty;
        body.Append($"<section class=\"report-page\"{pageStyle}>");
        if (pageBorderCss.Length > 0 && pageBorderInsetCss.Length > 0)
            body.Append("<div aria-hidden=\"true\" style=\"position:absolute;pointer-events:none;box-sizing:border-box;z-index:1000;")
                .Append(pageBorderInsetCss).Append(pageBorderCss).Append("\"></div>");
        RenderTemplate(template, data, body, pinnedFragments ?? new Dictionary<string, string>(), 0);
        body.Append("</section>");
    }

    private static bool HasRecordsDetailBand(JsonElement template) =>
        template.TryGetProperty("bands", out var bands)
        && bands.ValueKind == JsonValueKind.Array
        && bands.EnumerateArray().Any(band =>
            String(band, "type") == "detail" && String(band, "dataPath") == "records");

    private static int RecordsPerPage(JsonElement template, double pageHeightMm)
    {
        var configuredRecordsPerPage = Number(template, "recordsPerPage", 0);
        if (configuredRecordsPerPage >= 1)
            return Math.Clamp((int)Math.Floor(configuredRecordsPerPage), 1, 1000);

        if (!template.TryGetProperty("bands", out var bands) || bands.ValueKind != JsonValueKind.Array)
            return 1;

        double fixedHeight = 0;
        double recordHeight = 0;
        foreach (var band in bands.EnumerateArray())
        {
            var height = Number(band, "heightMm", 10);
            if (String(band, "type") == "detail" && String(band, "dataPath") == "records")
                recordHeight += height;
            else
                fixedHeight += height;
        }

        if (recordHeight <= 0) return 1;
        var availableHeight = Math.Max(0, pageHeightMm - 0.5 - fixedHeight);
        return Math.Clamp((int)Math.Floor(availableHeight / recordHeight), 1, 1000);
    }

    private static JsonElement WithRecords(JsonElement data, IEnumerable<JsonElement> records)
    {
        var root = JsonNode.Parse(data.GetRawText()) as JsonObject ?? new JsonObject();
        root["records"] = new JsonArray(records
            .Select(record => JsonNode.Parse(record.GetRawText()))
            .ToArray());
        return JsonSerializer.SerializeToElement(root);
    }

    private static void RenderTemplate(JsonElement template, JsonElement data, StringBuilder html,
        IReadOnlyDictionary<string, string> fragments, int fragmentDepth)
    {
        if (fragmentDepth > 8) throw new InvalidOperationException("Fragment nesting exceeds 8.");
        if (template.TryGetProperty("elements", out var flat) && flat.ValueKind == JsonValueKind.Array)
            RenderElements(flat, data, html);
        if (!template.TryGetProperty("bands", out var bands) || bands.ValueKind != JsonValueKind.Array) return;
        double top = 0;
        foreach (var band in bands.EnumerateArray())
        {
            var height = Number(band, "heightMm", 10);
            if (String(band, "type") == "subreport" && String(band, "fragmentCode") is { Length: > 0 } code)
            {
                if (!fragments.TryGetValue(code, out var fragmentJson)) throw new InvalidOperationException($"Pinned fragment '{code}' is missing.");
                using var fragmentDocument = JsonDocument.Parse(fragmentJson);
                foreach (var item in ResolveSubreportCollection(data, String(band, "dataPath")))
                {
                    html.Append($"<div style=\"position:absolute;left:0;top:{Mm(top)};width:100%;height:{Mm(height)}\">");
                    RenderTemplate(fragmentDocument.RootElement, item, html, fragments, fragmentDepth + 1);
                    html.Append("</div>"); top += height;
                }
                continue;
            }
            var bandType = String(band, "type");
            var dataPath = String(band, "dataPath");
            // Inline subreports are designed directly inside the parent
            // template. They repeat their own elements for every child item;
            // fragmentCode remains available for reusable/nested subreports.
            var rows = bandType == "subreport"
                ? ResolveSubreportCollection(data, dataPath)
                : bandType == "detail" ? ResolveCollection(data, dataPath) : [data];
            // Flat-element templates still split a top-level records collection into one record
            // per page. Keep their designer detail band compatible with that isolated record.
            if (bandType == "detail" && dataPath == "records" && rows.Count == 0) rows = [data];
            foreach (var row in rows)
            {
                if (band.TryGetProperty("pageBreakBefore", out var before) && before.ValueKind == JsonValueKind.True) html.Append("<div style=\"break-before:page\"></div>");
                html.Append($"<div style=\"position:absolute;left:0;top:{Mm(top)};width:100%;height:{Mm(height)}\">");
                if (band.TryGetProperty("elements", out var elements)) RenderElements(elements, row, html);
                html.Append("</div>"); top += height;
            }
        }
    }

    private static void RenderElements(JsonElement elements, JsonElement data, StringBuilder html)
    {
        if (elements.ValueKind != JsonValueKind.Array) return;
        foreach (var element in elements.EnumerateArray())
        {
            if (element.TryGetProperty("visibility", out var expression) && !SafeExpressionEvaluator.EvaluateBoolean(expression, data)) continue;
            var type = String(element, "type") ?? "text";
            var x = Number(element, "x", 0); var y = Number(element, "y", 0);
            var width = Number(element, "width", Number(element, "w", 10));
            var height = Number(element, "height", Number(element, "h", 5));
            var style = element.TryGetProperty("style", out var styleNode) ? Css(styleNode, type) : string.Empty;
            var baseStyle = $"left:{Mm(x)};top:{Mm(y)};width:{Mm(width)};height:{Mm(height)};{style}";
            switch (type)
            {
                case "line":
                    var isVertical = height > width || (width <= 2 && height > 2);
                    var lineRawColor = element.TryGetProperty("style", out var lineStyleNode)
                        ? (String(lineStyleNode, "borderColor") ?? String(lineStyleNode, "backgroundColor") ?? String(lineStyleNode, "color"))
                        : null;
                    if (string.IsNullOrWhiteSpace(lineRawColor) || lineRawColor.Equals("none", StringComparison.OrdinalIgnoreCase))
                    {
                        lineRawColor = element.TryGetProperty("style", out lineStyleNode)
                            ? (String(lineStyleNode, "backgroundColor") ?? String(lineStyleNode, "color") ?? "#000000")
                            : "#000000";
                    }
                    var lineColor = SafeColor(lineRawColor) ?? "#000000";
                    var lineThickness = StyleNumber(element, "borderWidth", isVertical ? (width > 0 ? width : 0.3) : (height > 0 ? height : 0.3));
                    if (lineThickness <= 0) lineThickness = 0.3;
                    var linePattern = element.TryGetProperty("style", out var lsn) ? (String(lsn, "borderStyle") ?? "solid") : "solid";
                    if (linePattern != "dashed" && linePattern != "dotted") linePattern = "solid";
                    var side = isVertical ? "border-left" : "border-top";
                    var lineBorder = $"{lineThickness.ToString("0.###", CultureInfo.InvariantCulture)}px {linePattern} {lineColor}";
                    html.Append($"<div class=\"el\" style=\"{baseStyle}border:none;background:transparent;{side}:{lineBorder};\"></div>");
                    break;
                case "rectangle":
                case "square": html.Append($"<div class=\"el\" style=\"{baseStyle}\"></div>"); break;
                case "circle": html.Append($"<div class=\"el\" style=\"{baseStyle}border-radius:50%;\"></div>"); break;
                case "arrow_right":
                    var arrRightFill = StyleString(element, "backgroundColor", "transparent");
                    if (arrRightFill.Equals("#dbeafe", StringComparison.OrdinalIgnoreCase)) arrRightFill = "transparent";
                    var arrRightStroke = StyleString(element, "borderColor", StyleString(element, "color", "#000"));
                    var arrRightWidth = StyleNumber(element, "borderWidth", 1.5).ToString(CultureInfo.InvariantCulture);
                    html.Append($"<div class=\"el\" style=\"{baseStyle}background:transparent;border:none;\"><svg viewBox=\"0 0 100 60\" preserveAspectRatio=\"none\" style=\"width:100%;height:100%;display:block;\"><polygon points=\"0,20 60,20 60,0 100,30 60,60 60,40 0,40\" fill=\"{arrRightFill}\" stroke=\"{arrRightStroke}\" stroke-width=\"{arrRightWidth}\" stroke-linejoin=\"round\"/></svg></div>");
                    break;
                case "arrow_down":
                    var arrDownFill = StyleString(element, "backgroundColor", "transparent");
                    if (arrDownFill.Equals("#dbeafe", StringComparison.OrdinalIgnoreCase)) arrDownFill = "transparent";
                    var arrDownStroke = StyleString(element, "borderColor", StyleString(element, "color", "#000"));
                    var arrDownWidth = StyleNumber(element, "borderWidth", 1.5).ToString(CultureInfo.InvariantCulture);
                    html.Append($"<div class=\"el\" style=\"{baseStyle}background:transparent;border:none;\"><svg viewBox=\"0 0 60 100\" preserveAspectRatio=\"none\" style=\"width:100%;height:100%;display:block;\"><polygon points=\"20,0 40,0 40,60 60,60 30,100 0,60 20,60\" fill=\"{arrDownFill}\" stroke=\"{arrDownStroke}\" stroke-width=\"{arrDownWidth}\" stroke-linejoin=\"round\"/></svg></div>");
                    break;
                case "pageBreak": html.Append("<div style=\"break-before:page\"></div>"); break;
                case "image":
                    var imageBinding = Binding(element);
                    var source = imageBinding.Equals("ulbLogo", StringComparison.OrdinalIgnoreCase)
                        ? ResolveDirectValue(data, "ulbLogo") : Value(data, imageBinding);
                    var isLogoImage = imageBinding.Equals("ulbLogo", StringComparison.OrdinalIgnoreCase)
                        || imageBinding.Equals("logo", StringComparison.OrdinalIgnoreCase)
                        || imageBinding.Equals("CouncilLogo", StringComparison.OrdinalIgnoreCase)
                        || imageBinding.Equals("municipal_logo", StringComparison.OrdinalIgnoreCase)
                        || (element.TryGetProperty("id", out var imgIdProp) && (imgIdProp.GetString()?.Equals("municipal_logo", StringComparison.OrdinalIgnoreCase) == true || imgIdProp.GetString()?.Equals("logo", StringComparison.OrdinalIgnoreCase) == true));
                    var isPlanImage = imageBinding.Equals("buildingPlanPhoto", StringComparison.OrdinalIgnoreCase)
                        || imageBinding.Equals("planPhoto", StringComparison.OrdinalIgnoreCase)
                        || imageBinding.Equals("photoPlan", StringComparison.OrdinalIgnoreCase)
                        || String(element, "id") == "picture9";
                    if (string.IsNullOrEmpty(source) && isPlanImage)
                    {
                        source = Value(data, "planPhoto");
                        if (string.IsNullOrEmpty(source)) source = Value(data, "buildingPlanPhoto");
                        if (string.IsNullOrEmpty(source)) source = Value(data, "photoPlan");
                    }
                    if (string.IsNullOrEmpty(source) && !isPlanImage && (imageBinding.Equals("propertyPhoto", StringComparison.OrdinalIgnoreCase) || imageBinding.Contains("photo", StringComparison.OrdinalIgnoreCase) || String(element, "id") == "picture10"))
                    {
                        source = Value(data, "propertyPhoto");
                        if (string.IsNullOrEmpty(source)) source = Value(data, "photo");
                        if (string.IsNullOrEmpty(source)) source = Value(data, "PropertyPhotoA11");
                    }
                    if (string.IsNullOrEmpty(source) && isLogoImage)
                    {
                        source = ResolveDirectValue(data, "ulbLogo");
                    }
                    if (string.IsNullOrEmpty(source) && !isLogoImage) source = String(element, "src") ?? string.Empty;
                    if (source.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)
                        || source.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                        || source.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        var objectFit = SafeCssValue(StyleString(element, "objectFit", "contain"), "contain", "cover", "fill") ?? "contain";
                        html.Append($"<img class=\"el\" alt=\"\" src=\"{WebUtility.HtmlEncode(source)}\" style=\"{baseStyle}object-fit:{objectFit};border:none;outline:none;z-index:2;\" onerror=\"this.style.display='none'\">");
                    }
                    else if (imageBinding.Contains("photo", StringComparison.OrdinalIgnoreCase) || String(element, "id")?.Contains("photo", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        var borderWidth = StyleNumber(element, "borderWidth", 1);
                        var borderColor = StyleString(element, "borderColor", "#94a3b8");
                        html.Append($"<div class=\"el\" style=\"{baseStyle}border:{borderWidth}px dashed {borderColor};display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:7.5pt;text-align:center;box-sizing:border-box;background:#f8fafc;\">फोटो उपलब्ध नाही</div>");
                    }
                    break;
                case "qr":
                case "barcode":
                    break;
                case "table": RenderTable(element, data, html, baseStyle); break;
                case "signature":
                    var signature = Value(data, Binding(element));
                    if (signature.Length == 0) signature = String(element, "text") ?? "Authorized Signatory";
                    var signatureLabel = String(element, "label") ?? "Digitally Verified";
                    html.Append($"<div class=\"el\" style=\"{baseStyle}display:flex;flex-direction:column;justify-content:flex-end;text-align:center;\"><span>{WebUtility.HtmlEncode(signature)}</span><span style=\"border-top:.2mm solid #64748b;font-size:7pt\">{WebUtility.HtmlEncode(signatureLabel)}</span></div>");
                    break;
                case "watermark":
                    var watermarkBinding = Binding(element);
                    var watermarkValue = watermarkBinding.Equals("ulbLogo", StringComparison.OrdinalIgnoreCase)
                        ? ResolveDirectValue(data, "ulbLogo") : Value(data, watermarkBinding);
                    var watermarkType = String(element, "watermarkType");
                    var watermarkOpacity = StyleNumber(element, "opacity", .12).ToString(CultureInfo.InvariantCulture);
                    if (watermarkType == "image" || (string.IsNullOrEmpty(watermarkType)
                        && watermarkValue.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)))
                    {
                        if (!watermarkValue.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)) break;
                        html.Append($"<div class=\"el\" style=\"{baseStyle}display:flex;align-items:center;justify-content:center;opacity:{watermarkOpacity};pointer-events:none;user-select:none;\"><img alt=\"\" src=\"{WebUtility.HtmlEncode(watermarkValue)}\" style=\"max-width:100%;max-height:100%;object-fit:contain;filter:grayscale(25%)\"></div>");
                    }
                    else
                    {
                        var watermarkText = watermarkValue.Length > 0
                            ? watermarkValue
                            : String(element, "text") ?? (watermarkType == "text" ? "WATERMARK" : string.Empty);
                        if (watermarkText.Length == 0) break;
                        html.Append($"<div class=\"el\" style=\"{baseStyle}display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;opacity:{watermarkOpacity};pointer-events:none;user-select:none;\">{WebUtility.HtmlEncode(watermarkText)}</div>");
                    }
                    break;
                case "container":
                    html.Append($"<div class=\"el\" style=\"{baseStyle}\">");
                    if (element.TryGetProperty("children", out var children)) RenderElements(children, data, html);
                    html.Append("</div>"); break;
                default:
                    var raw = type == "field"
                        ? Value(data, Binding(element))
                        : ResolveStaticCellContent(String(element, "text") ?? string.Empty, data);
                    var label = String(element, "label");
                    var content = string.IsNullOrWhiteSpace(label) ? raw : $"{label}: {raw}";
                    var formatted = Format(content, String(element, "format"));
                    if (string.IsNullOrWhiteSpace(formatted))
                    {
                        var hasVisualBox = element.TryGetProperty("style", out var s)
                            && (s.TryGetProperty("background", out _) || s.TryGetProperty("borderColor", out _) || s.TryGetProperty("borderWidth", out _));
                        if (!hasVisualBox) break;
                    }
                    var verticalAlign = element.TryGetProperty("style", out var textStyle)
                        ? SafeCssValue(String(textStyle, "verticalAlign"), "top", "middle", "bottom")
                        : null;
                    var alignItems = verticalAlign switch
                    {
                        "top" => "flex-start",
                        "bottom" => "flex-end",
                        _ => "center"
                    };
                    var isHtml = (element.TryGetProperty("isHtml", out var h) && h.GetBoolean())
                        || (element.TryGetProperty("renderMode", out var rm) && rm.GetString() == "html")
                        || formatted.Contains("<span", StringComparison.OrdinalIgnoreCase)
                        || formatted.Contains("<strong>", StringComparison.OrdinalIgnoreCase);
                    var renderedText = isHtml ? formatted : WebUtility.HtmlEncode(formatted);
                    var spanWrap = "width:100%;display:block;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;";
                    html.Append($"<div class=\"el\" style=\"{baseStyle}display:flex;align-items:{alignItems};\"><span style=\"{spanWrap}\">{renderedText}</span></div>");
                    break;
            }
        }
    }

    private static void RenderTable(JsonElement element, JsonElement data, StringBuilder html, string style)
    {
        if (element.TryGetProperty("table", out var staticTable) && staticTable.ValueKind == JsonValueKind.Object)
        {
            RenderStaticTable(staticTable, element, data, html, style);
            return;
        }

        var rows = ResolveCollection(data, Binding(element));
        JsonElement columns = default;
        var hasColumns = element.TryGetProperty("columns", out columns) && columns.ValueKind == JsonValueKind.Array;
        if (!hasColumns && element.TryGetProperty("properties", out var propWrapper))
            hasColumns = propWrapper.TryGetProperty("columns", out columns) && columns.ValueKind == JsonValueKind.Array;
        if (!hasColumns) return;

        var showHeader = !element.TryGetProperty("showHeader", out var showHeaderNode)
                         || showHeaderNode.ValueKind != JsonValueKind.False;
        if (rows.Count == 0 && !showHeader) return;

        var properties = element.TryGetProperty("properties", out var propertyNode)
                         && propertyNode.ValueKind == JsonValueKind.Object
            ? propertyNode
            : default;
        var cellBorderColor = properties.ValueKind == JsonValueKind.Object
            ? SafeColor(String(properties, "cellBorderColor"))
            : null;
        var cellBorderWidth = properties.ValueKind == JsonValueKind.Object
            ? Math.Clamp(Number(properties, "cellBorderWidth", .2), 0, 10)
            : .2;
        var cellPadding = properties.ValueKind == JsonValueKind.Object
            ? Math.Clamp(Number(properties, "cellPaddingMm", 1), 0, 20)
            : 1;
        var cellFontSize = properties.ValueKind == JsonValueKind.Object
            ? Math.Clamp(Number(properties, "cellFontSize", 0), 0, 96)
            : 0;
        var rowHeight = properties.ValueKind == JsonValueKind.Object
            ? Math.Clamp(Number(properties, "rowHeightMm", 0), 0, 100)
            : 0;
        var cellColor = properties.ValueKind == JsonValueKind.Object
            ? SafeColor(String(properties, "cellColor"))
            : null;
        var cellCss = new StringBuilder();
        if (cellBorderColor is not null)
            cellCss.Append("border:").Append(cellBorderWidth.ToString("0.###", CultureInfo.InvariantCulture))
                .Append("px solid ").Append(cellBorderColor).Append(';');
        if (properties.ValueKind == JsonValueKind.Object)
            cellCss.Append("padding:").Append(cellPadding.ToString("0.###", CultureInfo.InvariantCulture)).Append("mm;");
        if (cellFontSize > 0)
            cellCss.Append("font-size:").Append(cellFontSize.ToString("0.###", CultureInfo.InvariantCulture)).Append("px;");
        if (cellColor is not null) cellCss.Append("color:").Append(cellColor).Append(';');
        var cellStyleAttribute = cellCss.Length > 0 ? $" style=\"{cellCss}\"" : string.Empty;
        var rowStyleAttribute = rowHeight > 0
            ? $" style=\"height:{Mm(rowHeight)}\""
            : string.Empty;

        html.Append($"<div class=\"el\" style=\"{style}\"><table style=\"height:100%;table-layout:fixed\">");
        if (showHeader)
        {
            html.Append("<thead><tr>");
            foreach (var column in columns.EnumerateArray())
            {
                var width = Number(column, "width", 0);
                var headerStyleAttribute = width > 0
                    ? cellCss.Length > 0
                        ? $" style=\"width:{Mm(width)};{cellCss}\""
                        : $" style=\"width:{Mm(width)}\""
                    : cellStyleAttribute;
                html.Append($"<th{headerStyleAttribute}>{WebUtility.HtmlEncode(String(column, "label") ?? string.Empty)}</th>");
            }
            html.Append("</tr></thead>");
        }
        if (rows.Count > 0)
        {
            html.Append("<tbody>");
            foreach (var row in rows)
            {
                html.Append($"<tr{rowStyleAttribute}>");
                foreach (var column in columns.EnumerateArray())
                    html.Append($"<td{cellStyleAttribute}>{WebUtility.HtmlEncode(Value(row, String(column, "binding") ?? String(column, "path")))}</td>");
                html.Append("</tr>");
            }
            html.Append("</tbody>");
        }
        html.Append("</table></div>");
    }

    private static void RenderStaticTable(JsonElement table, JsonElement element, JsonElement data, StringBuilder html, string style)
    {
        var rowCount = Math.Clamp((int)Number(table, "rows", 1), 1, 200);
        var columnCount = Math.Clamp((int)Number(table, "cols", 1), 1, 100);
        var cells = table.TryGetProperty("cells", out var cellNode) && cellNode.ValueKind == JsonValueKind.Object
            ? cellNode
            : default;
        var columnWidths = ReadNumberArray(table, "columnWidths", columnCount, 1);
        var rowHeights = ReadNumberArray(table, "rowHeights", rowCount, 24);
        var totalWidth = columnWidths.Sum(width => Math.Max(1, width));
        var defaultBorder = StyleString(element, "borderColor", "#000000");
        var defaultText = StyleString(element, "color", "#000000");

        html.Append($"<div class=\"el\" style=\"{style}\"><table style=\"height:100%;table-layout:fixed\"><colgroup>");
        foreach (var width in columnWidths)
        {
            var percentage = Math.Max(1, width) / totalWidth * 100;
            html.Append($"<col style=\"width:{percentage.ToString("0.###", CultureInfo.InvariantCulture)}%\">");
        }
        html.Append("</colgroup><tbody>");

        for (var row = 0; row < rowCount; row++)
        {
            html.Append($"<tr style=\"height:{Math.Max(1, rowHeights[row]).ToString("0.###", CultureInfo.InvariantCulture)}px\">");
            for (var column = 0; column < columnCount; column++)
            {
                var key = $"{row}_{column}";
                JsonElement cell = default;
                var hasCell = cells.ValueKind == JsonValueKind.Object && cells.TryGetProperty(key, out cell);
                if (hasCell && cell.TryGetProperty("hidden", out var hidden) && hidden.ValueKind == JsonValueKind.True) continue;

                var rowSpan = hasCell ? Math.Clamp((int)Number(cell, "rowSpan", 1), 1, rowCount - row) : 1;
                var colSpan = hasCell ? Math.Clamp((int)Number(cell, "colSpan", 1), 1, columnCount - column) : 1;
                var cellStyle = hasCell && cell.TryGetProperty("style", out var cellStyleNode) && cellStyleNode.ValueKind == JsonValueKind.Object
                    ? cellStyleNode
                    : default;
                var borderWidth = cellStyle.ValueKind == JsonValueKind.Object ? Math.Clamp(Number(cellStyle, "borderWidth", 1), 0, 20) : 1;
                var borderColor = cellStyle.ValueKind == JsonValueKind.Object ? SafeColor(String(cellStyle, "borderColor")) ?? defaultBorder : defaultBorder;
                var background = cellStyle.ValueKind == JsonValueKind.Object
                    ? SafeColor(String(cellStyle, "backgroundColor")) ?? (row == 0 ? "#f1f5f9" : "#ffffff")
                    : row == 0 ? "#f1f5f9" : "#ffffff";
                var color = cellStyle.ValueKind == JsonValueKind.Object ? SafeColor(String(cellStyle, "color")) ?? defaultText : defaultText;
                var padding = cellStyle.ValueKind == JsonValueKind.Object ? Math.Clamp(Number(cellStyle, "padding", 4), 0, 40) : 4;
                var fontSize = cellStyle.ValueKind == JsonValueKind.Object ? Math.Clamp(Number(cellStyle, "fontSize", 9), 4, 96) : 9;
                var fontWeight = cellStyle.ValueKind == JsonValueKind.Object ? Math.Clamp((int)Number(cellStyle, "fontWeight", row == 0 ? 700 : 400), 100, 900) : row == 0 ? 700 : 400;
                var textAlign = cellStyle.ValueKind == JsonValueKind.Object ? SafeCssValue(String(cellStyle, "textAlign"), "left", "center", "right") ?? "left" : "left";
                var verticalAlign = cellStyle.ValueKind == JsonValueKind.Object ? SafeCssValue(String(cellStyle, "verticalAlign"), "top", "middle", "bottom") ?? "middle" : "middle";
                var wrap = cellStyle.ValueKind != JsonValueKind.Object || !cellStyle.TryGetProperty("wrap", out var wrapNode) || wrapNode.ValueKind != JsonValueKind.False;
                var content = hasCell ? String(cell, "content") ?? string.Empty : string.Empty;
                content = ResolveStaticCellContent(content, data);

                html.Append("<td");
                if (rowSpan > 1) html.Append($" rowspan=\"{rowSpan}\"");
                if (colSpan > 1) html.Append($" colspan=\"{colSpan}\"");
                html.Append($" style=\"border:{borderWidth.ToString("0.###", CultureInfo.InvariantCulture)}px solid {borderColor};background:{background};color:{color};padding:{padding.ToString("0.###", CultureInfo.InvariantCulture)}px;font-size:{fontSize.ToString("0.###", CultureInfo.InvariantCulture)}pt;font-weight:{fontWeight};line-height:1.15;text-align:{textAlign};vertical-align:{verticalAlign};white-space:{(wrap ? "pre-wrap" : "nowrap")};overflow-wrap:{(wrap ? "anywhere" : "normal")};overflow:hidden\">{WebUtility.HtmlEncode(content)}</td>");
            }
            html.Append("</tr>");
        }
        html.Append("</tbody></table></div>");
    }

    private static double[] ReadNumberArray(JsonElement owner, string name, int count, double fallback)
    {
        var result = Enumerable.Repeat(fallback, count).ToArray();
        if (!owner.TryGetProperty(name, out var values) || values.ValueKind != JsonValueKind.Array) return result;
        var index = 0;
        foreach (var value in values.EnumerateArray())
        {
            if (index >= result.Length) break;
            if (value.TryGetDouble(out var number) && number > 0) result[index] = number;
            index++;
        }
        return result;
    }

    private static string ResolveStaticCellContent(string content, JsonElement data) =>
        Regex.Replace(content, @"\{\{\s*([^{}]+?)\s*\}\}|\{\s*([^{}]+?)\s*\}", match =>
        {
            var path = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
            if (path.StartsWith('@') || path.StartsWith('?')) return match.Value;
            return Value(data, path.Trim());
        });

    private static string Css(JsonElement style, string elementType = "")
    {
        var css = new StringBuilder();
        var suppressLegacyDesignerBorder = IsLegacyDesignerChrome(style, elementType);
        Add("font-family", String(style, "fontFamily")); Add("font-size", Unit(style, "fontSize", "px")); Add("line-height", String(style, "lineHeight")); Add("font-weight", String(style, "fontWeight"));
        Add("font-style", SafeCssValue(String(style, "fontStyle"), "normal", "italic"));
        Add("text-decoration", SafeCssValue(String(style, "textDecoration"), "none", "underline"));
        Add("text-align", String(style, "textAlign")); Add("color", SafeColor(String(style, "color"))); Add("background", SafeColor(String(style, "background")));

        var rawBorder = String(style, "border")?.Trim();
        var hasExplicitBorder = !string.IsNullOrWhiteSpace(rawBorder) && !rawBorder.Equals("none", StringComparison.OrdinalIgnoreCase);

        var rawBorderColor = String(style, "borderColor")?.Trim();
        var isBorderColorNone = string.IsNullOrWhiteSpace(rawBorderColor)
            || rawBorderColor.Equals("none", StringComparison.OrdinalIgnoreCase)
            || rawBorderColor.Equals("transparent", StringComparison.OrdinalIgnoreCase);
        var safeBorderColor = SafeColor(rawBorderColor);
        var borderWidth = Number(style, "borderWidth", 0);

        if (!suppressLegacyDesignerBorder && elementType != "line")
        {
            if (hasExplicitBorder && SafeBorder(rawBorder!) is { } safeBorder)
            {
                Add("border", safeBorder);
            }
            else if (!isBorderColorNone && safeBorderColor is not null && borderWidth > 0)
            {
                Add("border-color", safeBorderColor);
                Add("border-width", Unit(style, "borderWidth", "px"));
                Add("border-style", "solid");
            }
        }

        Add("border-radius", Unit(style, "borderRadius", "px")); Add("padding", Unit(style, "padding", "px")); Add("line-height", String(style, "lineHeight"));
        if (style.TryGetProperty("opacity", out var opacity) && opacity.TryGetDouble(out var opacityValue)) Add("opacity", Math.Clamp(opacityValue, 0, 1).ToString(CultureInfo.InvariantCulture));
        if (style.TryGetProperty("rotation", out var rotation) && rotation.TryGetDouble(out var degrees))
        {
            Add("transform", $"rotate({Math.Clamp(degrees, -3600, 3600).ToString(CultureInfo.InvariantCulture)}deg)");
            Add("transform-origin", "center");
        }
        if (style.TryGetProperty("zIndex", out var zIndex) && zIndex.TryGetInt32(out var layer)) Add("z-index", Math.Clamp(layer, -1000, 1000).ToString(CultureInfo.InvariantCulture));
        return css.ToString();
        void Add(string name, string? value) { if (!string.IsNullOrWhiteSpace(value)) css.Append(name).Append(':').Append(WebUtility.HtmlEncode(value)).Append(';'); }
    }

    private static bool IsLegacyDesignerChrome(JsonElement style, string elementType)
    {
        var borderWidth = Number(style, "borderWidth", 0);
        var borderColor = String(style, "borderColor")?.Trim().ToLowerInvariant();
        var background = String(style, "background")?.Trim().ToLowerInvariant();
        var padding = Number(style, "padding", 0);
        var isWhite = background is "#fff" or "#ffffff" or "white";

        if (elementType == "field" && borderWidth == 1 && borderColor is "#000" or "#000000" or "black")
            return isWhite && padding is >= 1.9 and <= 2.1;
        if (elementType == "text" && borderWidth == 1 && borderColor == "#1e293b")
            return isWhite && padding is >= 3.9 and <= 4.1;
        return false;
    }

    private static string? SafeColor(string? value) => value is not null && (value.StartsWith('#') || value is "transparent" or "white" or "black") ? value : null;
    private static string? SafeCssValue(string? value, params string[] allowed) => value is not null && allowed.Contains(value, StringComparer.Ordinal) ? value : null;
    private static string? Unit(JsonElement owner, string name, string unit)
    {
        if (!owner.TryGetProperty(name, out var value)) return null;
        if (value.ValueKind == JsonValueKind.String)
        {
            var str = value.GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(str)) return null;
            return char.IsDigit(str[^1]) ? str + unit : str;
        }
        if (value.TryGetDouble(out var number))
            return number.ToString(CultureInfo.InvariantCulture) + unit;
        return null;
    }
    private static double StyleNumber(JsonElement element, string name, double fallback) => element.TryGetProperty("style", out var style) ? Number(style, name, fallback) : fallback;
    private static string StyleString(JsonElement element, string name, string fallback) => element.TryGetProperty("style", out var style) ? String(style, name) ?? fallback : fallback;
    private static string Binding(JsonElement element)
    {
        var binding = String(element, "binding") ?? String(element, "path") ?? String(element, "fieldName") ?? string.Empty;
        return binding.Trim('{', '}').Trim();
    }
    private static string Format(string value, string? format)
    {
        if (format == "date" && DateTime.TryParse(value, out var date)) return date.ToString("dd/MM/yyyy");
        if (format is "number" or "0" or "0.00" or "0.##" && decimal.TryParse(value, NumberStyles.Number,
                CultureInfo.InvariantCulture, out var number))
            return number.ToString(format == "number" ? "0.00" : format, CultureInfo.InvariantCulture);
        return value;
    }
    private static string Mm(double value) => value.ToString("0.###", CultureInfo.InvariantCulture) + "mm";
    private static string PageBorderCss(JsonElement template)
    {
        if (!template.TryGetProperty("page", out var page)
            || !page.TryGetProperty("border", out var border)
            || border.ValueKind != JsonValueKind.Object) return string.Empty;

        var css = new StringBuilder();
        Append("top", "border-top");
        Append("right", "border-right");
        Append("bottom", "border-bottom");
        Append("left", "border-left");
        return css.ToString();

        void Append(string jsonName, string cssName)
        {
            var value = String(border, jsonName);
            if (value is not null && SafeBorder(value) is { } safeValue)
                css.Append(cssName).Append(':').Append(safeValue).Append(';');
        }
    }

    private static string PageBorderInsetCss(JsonElement template)
    {
        if (!template.TryGetProperty("page", out var page)
            || !page.TryGetProperty("borderInsetMm", out var inset)
            || inset.ValueKind != JsonValueKind.Object) return string.Empty;

        var values = new[] { ("top", "top"), ("right", "right"), ("bottom", "bottom"), ("left", "left") }
            .Select(pair => (pair.Item2, Value: Math.Clamp(Number(inset, pair.Item1, 0), 0, 50)))
            .ToArray();
        return values.Any(value => value.Value > 0)
            ? string.Concat(values.Select(value => $"{value.Item1}:{Mm(value.Value)};"))
            : string.Empty;
    }

    // Page-border values are saved from the fixed designer controls. Keep the
    // generated PDF safe even if an older template contains arbitrary CSS.
    private static string? SafeBorder(string value)
    {
        var match = System.Text.RegularExpressions.Regex.Match(value,
            @"^\s*(\d+(?:\.\d+)?(?:px|pt|mm)?)\s+(solid|dashed|dotted|double|groove|ridge|inset|outset)\s+(#[0-9a-fA-F]{3,8}|black|white)\s*$",
            System.Text.RegularExpressions.RegexOptions.CultureInvariant);
        return match.Success ? $"{match.Groups[1].Value} {match.Groups[2].Value} {match.Groups[3].Value}" : null;
    }
    private static double Number(JsonElement owner, string name, double fallback) => owner.ValueKind == JsonValueKind.Object && owner.TryGetProperty(name, out var value) && value.TryGetDouble(out var number) ? number : fallback;
    private static string? String(JsonElement owner, string name) => owner.ValueKind == JsonValueKind.Object && owner.TryGetProperty(name, out var value) ? value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString() : null;
    private static bool TryGetPropertyIgnoreCase(JsonElement owner, string name, out JsonElement value)
    {
        if (owner.ValueKind == JsonValueKind.Object)
        {
            if (owner.TryGetProperty(name, out value)) return true;
            foreach (var property in owner.EnumerateObject())
            {
                if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }
        }

        value = default;
        return false;
    }

    private static readonly Dictionary<string, string[]> FieldAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["MarathiOwnerName"] = ["ownerFullName", "ownerName"],
        ["ownerFullName"] = ["MarathiOwnerName", "ownerName"],
        ["ownerName"] = ["MarathiOwnerName", "ownerFullName"],
        ["MarathiOwnerAddress"] = ["address", "societyAddress", "addressEnglish", "propertyAddress", "MarathiOwnerPatta"],
        ["address"] = ["MarathiOwnerAddress", "societyAddress", "addressEnglish", "propertyAddress", "MarathiOwnerPatta"],
        ["MarathiOwnerPatta"] = ["addressEnglish", "propertyAddress", "address", "MarathiOwnerAddress"],
        ["propertyAddress"] = ["addressEnglish", "address", "MarathiOwnerAddress", "MarathiOwnerPatta"],
        ["addressEnglish"] = ["propertyAddress", "address", "MarathiOwnerAddress", "MarathiOwnerPatta"],
        ["Description English"] = ["propertyDescription", "PropertyDescription", "descriptionEnglish"],
        ["descriptionEnglish"] = ["propertyDescription", "PropertyDescription", "Description English"],
        ["propertyDescription"] = ["Description English", "descriptionEnglish", "PropertyDescription"],
        ["PropertyDescription"] = ["propertyDescription", "Description English", "descriptionEnglish"],
        ["OccupierNameMarathi"] = ["occupierFullName", "occupierName"],
        ["occupierFullName"] = ["OccupierNameMarathi", "occupierName"],
        ["occupierName"] = ["OccupierNameMarathi", "occupierFullName"],
        ["NewWardNo"] = ["wardNo", "wardId"],
        ["wardNo"] = ["NewWardNo", "wardId"],
        ["NewPropertyNo"] = ["propertyNo"],
        ["propertyNo"] = ["NewPropertyNo"],
        ["NewPartitionNo"] = ["partitionNo"],
        ["partitionNo"] = ["NewPartitionNo"],
        ["OldNo"] = ["oldPropertyNo"],
        ["oldPropertyNo"] = ["OldNo"],
        ["OldWardNo"] = ["oldWardNo"],
        ["OldCityServeyNo"] = ["computerNo", "csn", "upicId", "oldCSN", "OldCitySurveyNo"],
        ["OldCitySurveyNo"] = ["computerNo", "csn", "upicId", "oldCSN", "OldCityServeyNo"],
        ["CouncilHeader"] = ["councilHeader", "councilNameWithDistrict", "councilName", "ulbNameLocal", "ulbName"],
        ["CouncilName"] = ["councilName", "ulbNameLocal", "ulbName", "councilHeader"],
        ["CouncilLogo"] = ["councilLogo", "ulbLogo", "logo"],
        ["councilLogo"] = ["CouncilLogo", "ulbLogo", "logo"],
        ["logo"] = ["CouncilLogo", "councilLogo", "ulbLogo"],
        ["NoticeDateLocal"] = ["noticeDate", "NoticeDate"],
        ["ObjectionLastDateLocal"] = ["objectionLastDate", "ObjectionLastDate", "objectionDate"],
        ["PropertyTax"] = ["GEN_TAX", "gen_tax", "propertyTax", "generalTax"],
        ["TreeCess"] = ["TREE_TAX", "tree_tax", "treeCess"],
        ["SpEducationTax"] = ["SP_EDU_TAX", "sp_edu_tax", "spEducationTax"],
        ["FireCess"] = ["FIRE_TAX", "fire_tax", "fireCess"],
        ["Sanitation"] = ["SEWAGE_TAX", "sewage_tax", "sanitation", "swacchataTax"],
        ["LightCess"] = ["LIGHT_TAX", "light_tax", "lightCess"],
        ["EducationTax"] = ["STATE_EDU_TAX", "state_edu_tax", "educationTax"],
        ["EmploymentTax"] = ["STATE_EMP_TAX", "state_emp_tax", "employmentTax"],
        ["TotalTax"] = ["totalTax", "total_tax", "TOTAL_TAX"],
        ["RV"] = ["rateableValue", "RateableValue"],
        ["RateableValue"] = ["RV", "rateableValue"],
        ["OldRV"] = ["oldRV", "oldRateableValue"],
        ["OldTotalTax"] = ["oldTotalTax"],
    };

    private static string Value(JsonElement data, string? path)
    {
        var result = ResolveDirectValue(data, path);
        if (!string.IsNullOrWhiteSpace(result) || string.IsNullOrWhiteSpace(path))
            return result;

        var cleanPath = path.Trim('{', '}').Trim();
        if (!cleanPath.Equals(path, StringComparison.OrdinalIgnoreCase))
        {
            result = ResolveDirectValue(data, cleanPath);
            if (!string.IsNullOrWhiteSpace(result)) return result;
        }

        if (FieldAliases.TryGetValue(cleanPath, out var aliases))
        {
            foreach (var alias in aliases)
            {
                result = ResolveDirectValue(data, alias);
                if (!string.IsNullOrWhiteSpace(result)) return result;
            }
        }

        return string.Empty;
    }

    private static string ResolveDirectValue(JsonElement data, string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return string.Empty;
        if (TryResolvePath(data, path, out var current))
            return current.ValueKind switch { JsonValueKind.String => current.GetString() ?? "", JsonValueKind.Null => "", _ => current.ToString() };

        // Paged single-property reports keep the printable row inside `records`,
        // while their group/footer bands are rendered against the page envelope.
        // Resolve those bands against the sole page record before falling back to
        // auxiliary sections so owner, totals, tax and media bindings remain live.
        if (TryGetSingleRecord(data, out var record)
            && TryResolvePath(record, path, out current))
        {
            return current.ValueKind switch { JsonValueKind.String => current.GetString() ?? "", JsonValueKind.Null => "", _ => current.ToString() };
        }

        if (TryGetPropertyIgnoreCase(data, "sections", out var sec) && sec.ValueKind == JsonValueKind.Object)
        {
            foreach (var sProp in sec.EnumerateObject())
            {
                if (sProp.Value.ValueKind == JsonValueKind.Array && sProp.Value.GetArrayLength() > 0)
                {
                    var first = sProp.Value[0];
                    if (TryGetPropertyIgnoreCase(first, path, out var val))
                        return val.ValueKind switch { JsonValueKind.String => val.GetString() ?? "", JsonValueKind.Null => "", _ => val.ToString() };
                }
            }
        }
        return string.Empty;
    }

    private static IReadOnlyList<JsonElement> ResolveCollection(JsonElement data, string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return [data];
        if (TryResolvePath(data, path, out var current))
            return current.ValueKind == JsonValueKind.Array ? current.EnumerateArray().Select(x => x.Clone()).ToList() : [current];

        if (TryGetSingleRecord(data, out var record)
            && TryResolvePath(record, path, out current))
        {
            return current.ValueKind == JsonValueKind.Array ? current.EnumerateArray().Select(x => x.Clone()).ToList() : [current];
        }

        if (TryGetPropertyIgnoreCase(data, "sections", out var sec) && sec.ValueKind == JsonValueKind.Object)
        {
            if (TryGetPropertyIgnoreCase(sec, path, out var secArr))
                return secArr.ValueKind == JsonValueKind.Array ? secArr.EnumerateArray().Select(x => x.Clone()).ToList() : [secArr];
            foreach (var prop in sec.EnumerateObject())
            {
                if (prop.Name.Equals(path, StringComparison.OrdinalIgnoreCase) && prop.Value.ValueKind == JsonValueKind.Array)
                    return prop.Value.EnumerateArray().Select(x => x.Clone()).ToList();
            }
        }
        return [];
    }

    private static bool TryResolvePath(JsonElement data, string path, out JsonElement value)
    {
        value = data;
        foreach (var part in path.Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            if (!TryGetPropertyIgnoreCase(value, part, out value))
                return false;
        }
        return true;
    }

    private static bool TryGetSingleRecord(JsonElement data, out JsonElement record)
    {
        record = default;
        if (data.ValueKind != JsonValueKind.Object
            || !TryGetPropertyIgnoreCase(data, "records", out var records)
            || records.ValueKind != JsonValueKind.Array
            || records.GetArrayLength() != 1)
        {
            return false;
        }

        record = records[0];
        return record.ValueKind == JsonValueKind.Object;
    }

    private static IReadOnlyList<JsonElement> ResolveSubreportCollection(JsonElement data, string? path)
    {
        var rows = ResolveCollection(data, path);
        if (rows.Count > 0 || string.IsNullOrWhiteSpace(path)
            || data.ValueKind != JsonValueKind.Object
            || !TryGetPropertyIgnoreCase(data, "records", out var records)
            || records.ValueKind != JsonValueKind.Array)
            return rows;

        return records.EnumerateArray()
            .Where(record => record.ValueKind == JsonValueKind.Object)
            .SelectMany(record => ResolveCollection(record, path))
            .ToList();
    }

    private static class SpecialNoticeThanePagination
    {
        private sealed record Part(JsonObject Band, double Height);

        public static IEnumerable<(JsonElement Template, JsonElement Data)> Pages(
            JsonElement template, JsonElement data, double pageHeight)
        {
            var renderedHeight = pageHeight > 1 ? pageHeight - .5 : pageHeight;
            var reportCode = template.TryGetProperty("reportCode", out var code) ? code.GetString() : null;
            var normalizedCode = string.Concat((reportCode ?? string.Empty).Where(char.IsLetterOrDigit));
            if ((!string.IsNullOrEmpty(reportCode)
                    && !normalizedCode.Equals("SpecialNoticeThane", StringComparison.OrdinalIgnoreCase))
                || data.ValueKind != JsonValueKind.Object
                || !template.TryGetProperty("bands", out var bands) || bands.ValueKind != JsonValueKind.Array)
            {
                yield return (template, data);
                yield break;
            }

            var originals = JsonNode.Parse(bands.GetRawText())!.AsArray().OfType<JsonObject>().ToList();
            var taxIndex = originals.FindIndex(b => Text(b, "type") == "subreport"
                && string.Equals(Text(b, "dataPath"), "taxRows", StringComparison.OrdinalIgnoreCase)
                && string.IsNullOrEmpty(Text(b, "fragmentCode")));
            if (taxIndex < 0)
            {
                yield return (template, data);
                yield break;
            }

            if (!TryGetPropertyIgnoreCase(data, "taxRows", out var taxes) || taxes.ValueKind != JsonValueKind.Array)
            {
                if (data.TryGetProperty("records", out var records) && records.ValueKind == JsonValueKind.Array
                    && records.GetArrayLength() > 0)
                {
                    // Keep batches that already fit exactly as designed. For an overflowing notice
                    // batch, bind each property's collections and following text to its own pages.
                    var pageNode = JsonNode.Parse(template.GetRawText())!["page"]!;
                    var batchBottom = Math.Max(Number(pageNode["borderInsetMm"], "bottom"),
                        Number(pageNode["margin"], "bottomMm"));
                    var totalHeight = originals.Sum(band => Height(band) * (Text(band, "type") switch
                    {
                        "detail" => ResolveCollection(data, Text(band, "dataPath")).Count,
                        "subreport" => ResolveSubreportCollection(data, Text(band, "dataPath")).Count,
                        _ => 1
                    }));
                    if (totalHeight <= renderedHeight - Math.Max(0, batchBottom))
                        yield return (template, data);
                    else
                        foreach (var recordData in records.EnumerateArray())
                        {
                            if (recordData.ValueKind != JsonValueKind.Object)
                            {
                                yield return (template, WithRecords(data, [recordData]));
                                continue;
                            }
                            var context = JsonNode.Parse(data.GetRawText())!.AsObject();
                            foreach (var property in recordData.EnumerateObject())
                                context[property.Name] = JsonNode.Parse(property.Value.GetRawText());
                            context["records"] = new JsonArray(JsonNode.Parse(recordData.GetRawText()));
                            if (!context.Any(property => property.Key.Equals("taxRows", StringComparison.OrdinalIgnoreCase)
                                && property.Value is JsonArray)) context["taxRows"] = new JsonArray();
                            foreach (var result in Pages(template, JsonSerializer.SerializeToElement(context), pageHeight))
                                yield return result;
                        }
                }
                else yield return (template, data);
                yield break;
            }

            var record = JsonNode.Parse(data.GetRawText())!.AsObject();
            var parts = new List<Part>();
            foreach (var band in originals)
            {
                var height = Height(band);
                band["heightMm"] = height;
                var path = Text(band, "dataPath");
                if (Text(band, "type") is "detail" or "subreport" && !string.IsNullOrEmpty(path))
                {
                    // Share the renderer's case-insensitive paths, single-record fallback and sections lookup.
                    var rows = Text(band, "type") == "subreport"
                        ? ResolveSubreportCollection(data, path) : ResolveCollection(data, path);
                    if (Text(band, "type") == "detail" && path == "records" && rows.Count == 0) rows = [data];
                    foreach (var row in rows)
                    {
                        // Each rendered instance gets its original row context. The saved template and
                        // tax data are never edited; only this render's page bands are expanded.
                        var key = "__noticePagination" + parts.Count;
                        record[key] = new JsonArray(JsonNode.Parse(row.GetRawText()));
                        var instance = band.DeepClone().AsObject();
                        instance["dataPath"] = key;
                        parts.Add(new(instance, height));
                    }
                }
                else parts.Add(new(band, height));
            }

            var page = JsonNode.Parse(template.GetRawText())!["page"]!;
            var bottom = Math.Max(Number(page["borderInsetMm"], "bottom"), Number(page["margin"], "bottomMm"));
            var limit = renderedHeight - Math.Max(0, bottom);
            if (parts.Sum(p => p.Height) <= limit)
            {
                yield return (template, data);
                yield break;
            }

            var current = new List<Part>();
            double used = 0;
            var contentStart = 0;
            var continuation = false;
            for (var i = 0; i < parts.Count; i++)
            {
                var part = parts[i];
                part = FitFooter(part, limit - used);
                // Keep everything that fits on this page; continue only the remaining bands/rows.
                if (used + part.Height > limit + .001 && current.Count > contentStart)
                {
                    yield return MakePage(template, record, current, continuation);
                    continuation = true;
                    current = [];
                    used = 0;
                    var top = Math.Max(Number(page["borderInsetMm"], "top"), Number(page["margin"], "topMm"));
                    if (top > 0) { current.Add(Spacer(top)); used += top; }
                    contentStart = current.Count;
                }
                current.Add(part);
                used += part.Height;
            }
            if (current.Count > 0) yield return MakePage(template, record, current, continuation);
        }

        private static Part FitFooter(Part part, double availableHeight)
        {
            var overflow = part.Height - availableHeight;
            if (overflow <= 0 || Text(part.Band, "type") != "reportFooter"
                || part.Band["elements"] is not JsonArray elements)
                return part;

            var content = elements.OfType<JsonObject>().ToArray();
            // A whole footer can miss the page by a fraction of a millimetre. Reclaim
            // only its leading blank space, preserving every element's size and spacing.
            if (content.Length == 0 || content.Min(el => Number(el, "y")) < overflow)
                return part;

            var band = part.Band.DeepClone().AsObject();
            foreach (var element in band["elements"]!.AsArray().OfType<JsonObject>())
                element["y"] = Number(element, "y") - overflow;
            band["heightMm"] = availableHeight;
            return new Part(band, availableHeight);
        }

        private static (JsonElement, JsonElement) MakePage(JsonElement template, JsonObject data,
            List<Part> parts, bool continuation)
        {
            var design = JsonNode.Parse(template.GetRawText())!.AsObject();
            var bands = new JsonArray(parts.Select(p => (JsonNode)p.Band.DeepClone()).ToArray());
            if (continuation) design.Remove("elements");
            design["bands"] = bands;
            return (JsonSerializer.SerializeToElement(design), JsonSerializer.SerializeToElement(data));
        }

        private static Part Spacer(double height) => new(new JsonObject
            { ["type"] = "detail", ["heightMm"] = height, ["elements"] = new JsonArray() }, height);

        private static double Height(JsonObject band)
        {
            var height = Number(band, "heightMm", 10);
            if (band["elements"] is JsonArray elements)
                foreach (var el in elements.OfType<JsonObject>())
                    height = Math.Max(height, Number(el, "y") + Number(el, "height", Number(el, "h", 5)));
            return height;
        }

        private static string? Text(JsonObject node, string name) => node[name]?.GetValue<string>();
        private static double Number(JsonNode? node, string name, double fallback = 0) =>
            node is JsonObject obj && obj[name] is JsonValue value && value.TryGetValue<double>(out var result) ? result : fallback;
    }
}
