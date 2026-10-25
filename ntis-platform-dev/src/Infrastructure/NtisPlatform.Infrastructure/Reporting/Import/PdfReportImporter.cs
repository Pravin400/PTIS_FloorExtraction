using System.Text;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.ReportImport;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using UglyToad.PdfPig.Core;

namespace NtisPlatform.Infrastructure.Reporting.Import;

public class PdfReportImporter
{
    private readonly ILogger<PdfReportImporter> _logger;
    private const double PointsToPixels = 96.0 / 72.0; // 1 pt = 1.3333 px

    public PdfReportImporter(ILogger<PdfReportImporter> logger)
    {
        _logger = logger;
    }

    public ReportImportResultDto Import(Stream pdfStream, string fileName)
    {
        var result = new ReportImportResultDto
        {
            Success = true,
            SourceType = "PDF",
            Warnings = new List<string>()
        };

        try
        {
            using var document = PdfDocument.Open(pdfStream);
            if (document.NumberOfPages == 0)
            {
                result.Success = false;
                result.Warnings.Add("The PDF file does not contain any pages.");
                return result;
            }

            var firstPage = document.GetPage(1);
            double pagePtWidth = firstPage.Width;
            double pagePtHeight = firstPage.Height;

            double pageWidth = Math.Round(pagePtWidth * PointsToPixels);
            double pageHeight = Math.Round(pagePtHeight * PointsToPixels);
            string orientation = pageWidth > pageHeight ? "landscape" : "portrait";

            var unifiedReport = new UnifiedReportDto
            {
                Page = new UnifiedPageDto
                {
                    Width = pageWidth,
                    Height = pageHeight,
                    Orientation = orientation,
                    PaperSize = DetectPaperSize(pagePtWidth, pagePtHeight),
                    MarginTop = 20,
                    MarginBottom = 20,
                    MarginLeft = 20,
                    MarginRight = 20
                },
                Sections = new List<UnifiedSectionDto>()
            };

            // Define standard bands based on page proportions
            double headerHeight = Math.Round(pageHeight * 0.18);
            double footerHeight = Math.Round(pageHeight * 0.10);
            double detailsHeight = pageHeight - headerHeight - footerHeight;

            var pageHeaderSection = new UnifiedSectionDto
            {
                Id = "page-header",
                Type = "PageHeader",
                Name = "Page Header",
                Height = headerHeight,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            var detailsSection = new UnifiedSectionDto
            {
                Id = "details",
                Type = "Details",
                Name = "Details",
                Height = detailsHeight,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            var pageFooterSection = new UnifiedSectionDto
            {
                Id = "page-footer",
                Type = "PageFooter",
                Name = "Page Footer",
                Height = footerHeight,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            int objectIndex = 1;

            // 1. Extract Words & Lines
            var words = firstPage.GetWords().ToList();
            var lines = ClusterWordsIntoLines(words, firstPage.Height);

            foreach (var line in lines)
            {
                double pxX = Math.Round(line.BoundingBox.Left * PointsToPixels);
                double pxWidth = Math.Max(10, Math.Round(line.BoundingBox.Width * PointsToPixels));
                double pxHeight = Math.Max(8, Math.Round(line.BoundingBox.Height * PointsToPixels));
                // Convert bottom-left PDF coordinate to top-left screen coordinate
                double pxY = Math.Round((pagePtHeight - line.BoundingBox.Top) * PointsToPixels);

                if (pxX < 0) pxX = 0;
                if (pxY < 0) pxY = 0;

                string text = line.Text.Trim();
                if (string.IsNullOrEmpty(text)) continue;

                // Determine font properties
                string fontFamily = line.FontName ?? "Arial";
                double fontSize = Math.Max(8, Math.Round(line.FontSize * PointsToPixels * 0.75));
                bool isBold = line.IsBold;
                bool isItalic = line.IsItalic;

                var obj = new UnifiedReportObjectDto
                {
                    Id = $"pdf_txt_{objectIndex++}",
                    Type = "text",
                    X = pxX,
                    Y = pxY,
                    Width = pxWidth,
                    Height = pxHeight,
                    Text = text,
                    FontFamily = fontFamily,
                    FontSize = fontSize,
                    Bold = isBold,
                    Italic = isItalic,
                    TextColor = line.ColorHex ?? "#000000",
                    Alignment = line.Alignment,
                    VerticalAlignment = "middle",
                    Visible = true,
                    IsEditable = true
                };

                AssignToSection(obj, pageHeaderSection, detailsSection, pageFooterSection, headerHeight, detailsHeight);
            }

            // 2. Synthesize Standard Report Dividers if text exists
            if (words.Count > 0)
            {
                var headerLine = new UnifiedReportObjectDto
                {
                    Id = $"pdf_line_{objectIndex++}",
                    Type = "line",
                    X = 30,
                    Y = headerHeight - 5,
                    Width = pageWidth - 60,
                    Height = 2,
                    BorderColor = "#0284c7",
                    BorderWidth = 2,
                    BorderStyle = "solid",
                    Visible = true,
                    IsEditable = true
                };
                pageHeaderSection.Objects.Add(headerLine);
            }

            // 3. Extract Embedded Images
            try
            {
                var images = firstPage.GetImages().ToList();
                foreach (var img in images)
                {
                    var bbox = img.BoundingBox;
                    double pxX = Math.Round(bbox.Left * PointsToPixels);
                    double pxWidth = Math.Round(bbox.Width * PointsToPixels);
                    double pxHeight = Math.Round(bbox.Height * PointsToPixels);
                    double pxY = Math.Round((pagePtHeight - bbox.Top) * PointsToPixels);

                    if (pxWidth <= 5 || pxHeight <= 5) continue;

                    string? dataUrl = null;
                    if (img.TryGetPng(out var pngBytes))
                    {
                        dataUrl = $"data:image/png;base64,{Convert.ToBase64String(pngBytes)}";
                    }
                    else if (img.RawBytes.Length > 0)
                    {
                        dataUrl = $"data:image/jpeg;base64,{Convert.ToBase64String(img.RawBytes.ToArray())}";
                    }

                    var imgObj = new UnifiedReportObjectDto
                    {
                        Id = $"pdf_img_{objectIndex++}",
                        Type = "image",
                        X = Math.Max(0, pxX),
                        Y = Math.Max(0, pxY),
                        Width = pxWidth,
                        Height = pxHeight,
                        DataUrl = dataUrl,
                        Visible = true,
                        IsEditable = true
                    };

                    AssignToSection(imgObj, pageHeaderSection, detailsSection, pageFooterSection, headerHeight, detailsHeight);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Embedded image extraction encountered an issue in PDF {FileName}", fileName);
                result.Warnings.Add("One or more embedded images could not be converted.");
            }

            unifiedReport.Sections.Add(pageHeaderSection);
            unifiedReport.Sections.Add(detailsSection);
            unifiedReport.Sections.Add(pageFooterSection);

            result.Report = unifiedReport;
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse PDF report {FileName}", fileName);
            result.Success = false;
            result.Warnings.Add($"PDF parsing error: {ex.Message}");
            return result;
        }
    }

    private static void AssignToSection(
        UnifiedReportObjectDto obj,
        UnifiedSectionDto header,
        UnifiedSectionDto details,
        UnifiedSectionDto footer,
        double headerHeight,
        double detailsHeight)
    {
        // Adjust Y coordinates relative to section bounds
        if (obj.Y < headerHeight)
        {
            header.Objects.Add(obj);
        }
        else if (obj.Y < headerHeight + detailsHeight)
        {
            obj.Y -= headerHeight;
            details.Objects.Add(obj);
        }
        else
        {
            obj.Y -= (headerHeight + detailsHeight);
            footer.Objects.Add(obj);
        }
    }

    private static string DetectPaperSize(double widthPt, double heightPt)
    {
        double w = Math.Min(widthPt, heightPt);
        double h = Math.Max(widthPt, heightPt);

        if (Math.Abs(w - 595.28) < 15 && Math.Abs(h - 841.89) < 15) return "A4";
        if (Math.Abs(w - 612) < 15 && Math.Abs(h - 792) < 15) return "Letter";
        if (Math.Abs(w - 612) < 15 && Math.Abs(h - 1008) < 15) return "Legal";
        if (Math.Abs(w - 841.89) < 15 && Math.Abs(h - 1190.55) < 15) return "A3";
        if (Math.Abs(w - 419.53) < 15 && Math.Abs(h - 595.28) < 15) return "A5";

        return "Custom";
    }

    private static List<ExtractedLine> ClusterWordsIntoLines(List<Word> words, double pageHeight)
    {
        var lines = new List<ExtractedLine>();
        if (words.Count == 0) return lines;

        // Sort words by Y top descending (higher Y = higher on page), then X ascending
        var sorted = words.OrderByDescending(w => w.BoundingBox.Top).ThenBy(w => w.BoundingBox.Left).ToList();

        var currentLineWords = new List<Word> { sorted[0] };
        double currentTop = sorted[0].BoundingBox.Top;
        double currentHeight = sorted[0].BoundingBox.Height;

        for (int i = 1; i < sorted.Count; i++)
        {
            var word = sorted[i];
            double tolerance = Math.Max(4, currentHeight * 0.4);

            if (Math.Abs(word.BoundingBox.Top - currentTop) <= tolerance)
            {
                currentLineWords.Add(word);
            }
            else
            {
                lines.Add(CreateLine(currentLineWords));
                currentLineWords = new List<Word> { word };
                currentTop = word.BoundingBox.Top;
                currentHeight = word.BoundingBox.Height;
            }
        }

        if (currentLineWords.Count > 0)
        {
            lines.Add(CreateLine(currentLineWords));
        }

        return lines;
    }

    private static ExtractedLine CreateLine(List<Word> words)
    {
        words = words.OrderBy(w => w.BoundingBox.Left).ToList();
        var sb = new StringBuilder();
        double minLeft = double.MaxValue;
        double maxRight = double.MinValue;
        double maxTop = double.MinValue;
        double minBottom = double.MaxValue;

        string? fontName = null;
        double maxFontSize = 10;
        bool isBold = false;
        bool isItalic = false;

        for (int i = 0; i < words.Count; i++)
        {
            var w = words[i];
            if (i > 0) sb.Append(' ');
            sb.Append(w.Text);

            if (w.BoundingBox.Left < minLeft) minLeft = w.BoundingBox.Left;
            if (w.BoundingBox.Right > maxRight) maxRight = w.BoundingBox.Right;
            if (w.BoundingBox.Top > maxTop) maxTop = w.BoundingBox.Top;
            if (w.BoundingBox.Bottom < minBottom) minBottom = w.BoundingBox.Bottom;

            if (w.Letters.Count > 0)
            {
                var firstLetter = w.Letters[0];
                fontName ??= firstLetter.FontName;
                if (firstLetter.PointSize > maxFontSize) maxFontSize = firstLetter.PointSize;
                if (firstLetter.FontDetails?.IsBold == true || (firstLetter.FontName?.Contains("Bold", StringComparison.OrdinalIgnoreCase) == true)) isBold = true;
                if (firstLetter.FontDetails?.IsItalic == true || (firstLetter.FontName?.Contains("Italic", StringComparison.OrdinalIgnoreCase) == true)) isItalic = true;
            }
        }

        var bbox = new PdfRectangle(minLeft, minBottom, maxRight, maxTop);
        return new ExtractedLine
        {
            Text = sb.ToString(),
            BoundingBox = bbox,
            FontName = CleanFontName(fontName),
            FontSize = maxFontSize,
            IsBold = isBold,
            IsItalic = isItalic,
            Alignment = "left",
            ColorHex = "#000000"
        };
    }

    private static string CleanFontName(string? rawFont)
    {
        if (string.IsNullOrWhiteSpace(rawFont)) return "Arial";
        int plusIndex = rawFont.IndexOf('+');
        string name = plusIndex >= 0 ? rawFont[(plusIndex + 1)..] : rawFont;
        if (name.Contains("Times", StringComparison.OrdinalIgnoreCase)) return "Times New Roman";
        if (name.Contains("Courier", StringComparison.OrdinalIgnoreCase)) return "Courier New";
        if (name.Contains("Noto", StringComparison.OrdinalIgnoreCase)) return "Noto Sans Devanagari";
        if (name.Contains("Arial", StringComparison.OrdinalIgnoreCase)) return "Arial";
        if (name.Contains("Calibri", StringComparison.OrdinalIgnoreCase)) return "Calibri";
        if (name.Contains("Segoe", StringComparison.OrdinalIgnoreCase)) return "Segoe UI";
        return name.Split('-')[0];
    }

    private class ExtractedLine
    {
        public string Text { get; set; } = string.Empty;
        public PdfRectangle BoundingBox { get; set; }
        public string? FontName { get; set; }
        public double FontSize { get; set; }
        public bool IsBold { get; set; }
        public bool IsItalic { get; set; }
        public string Alignment { get; set; } = "left";
        public string ColorHex { get; set; } = "#000000";
    }
}
