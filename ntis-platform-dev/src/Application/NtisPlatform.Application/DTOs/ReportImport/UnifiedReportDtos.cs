using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace NtisPlatform.Application.DTOs.ReportImport;

public class ReportImportFormDto
{
    [Required]
    public IFormFile? File { get; set; }
}

public class ReportImportResultDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("sourceType")]
    public string SourceType { get; set; } = string.Empty; // "PDF" or "RPT"

    [JsonPropertyName("report")]
    public UnifiedReportDto? Report { get; set; }

    [JsonPropertyName("warnings")]
    public List<string> Warnings { get; set; } = new();

    [JsonPropertyName("partialImport")]
    public bool PartialImport { get; set; }
}

public class UnifiedReportDto
{
    [JsonPropertyName("page")]
    public UnifiedPageDto Page { get; set; } = new();

    [JsonPropertyName("sections")]
    public List<UnifiedSectionDto> Sections { get; set; } = new();
}

public class UnifiedPageDto
{
    [JsonPropertyName("width")]
    public double Width { get; set; } = 794; // A4 standard 96 DPI px

    [JsonPropertyName("height")]
    public double Height { get; set; } = 1123;

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait"; // "portrait" or "landscape"

    [JsonPropertyName("paperSize")]
    public string PaperSize { get; set; } = "A4";

    [JsonPropertyName("marginTop")]
    public double MarginTop { get; set; } = 20;

    [JsonPropertyName("marginBottom")]
    public double MarginBottom { get; set; } = 20;

    [JsonPropertyName("marginLeft")]
    public double MarginLeft { get; set; } = 20;

    [JsonPropertyName("marginRight")]
    public double MarginRight { get; set; } = 20;
}

public class UnifiedSectionDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "Details"; // ReportHeader, PageHeader, GroupHeader, Details, GroupFooter, ReportFooter, PageFooter

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("height")]
    public double Height { get; set; } = 100;

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("objects")]
    public List<UnifiedReportObjectDto> Objects { get; set; } = new();
}

public class UnifiedReportObjectDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "text"; // text, field, formula, image, line, rectangle, table, barcode, checkbox, section, group

    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("width")]
    public double Width { get; set; }

    [JsonPropertyName("height")]
    public double Height { get; set; }

    [JsonPropertyName("rotation")]
    public double Rotation { get; set; } = 0;

    [JsonPropertyName("zIndex")]
    public int ZIndex { get; set; } = 1;

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("text")]
    public string? Text { get; set; }

    [JsonPropertyName("fieldName")]
    public string? FieldName { get; set; }

    [JsonPropertyName("formula")]
    public string? Formula { get; set; }

    [JsonPropertyName("fontFamily")]
    public string FontFamily { get; set; } = "Arial";

    [JsonPropertyName("fontSize")]
    public double FontSize { get; set; } = 10;

    [JsonPropertyName("bold")]
    public bool Bold { get; set; }

    [JsonPropertyName("italic")]
    public bool Italic { get; set; }

    [JsonPropertyName("underline")]
    public bool Underline { get; set; }

    [JsonPropertyName("textColor")]
    public string TextColor { get; set; } = "#000000";

    [JsonPropertyName("backgroundColor")]
    public string BackgroundColor { get; set; } = "transparent";

    [JsonPropertyName("border")]
    public string Border { get; set; } = "none";

    [JsonPropertyName("borderWidth")]
    public double BorderWidth { get; set; } = 0;

    [JsonPropertyName("borderStyle")]
    public string BorderStyle { get; set; } = "solid";

    [JsonPropertyName("borderColor")]
    public string BorderColor { get; set; } = "#000000";

    [JsonPropertyName("borderRadius")]
    public double BorderRadius { get; set; } = 0;

    [JsonPropertyName("alignment")]
    public string Alignment { get; set; } = "left"; // left, center, right, justify

    [JsonPropertyName("verticalAlignment")]
    public string VerticalAlignment { get; set; } = "middle"; // top, middle, bottom

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("dataUrl")]
    public string? DataUrl { get; set; }

    [JsonPropertyName("barcodeFormat")]
    public string? BarcodeFormat { get; set; }

    [JsonPropertyName("isChecked")]
    public bool? IsChecked { get; set; }

    [JsonPropertyName("isEditable")]
    public bool IsEditable { get; set; } = true;

    [JsonPropertyName("metadata")]
    public Dictionary<string, object?>? Metadata { get; set; }
}
