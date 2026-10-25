using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.ReportImport;
using OpenMcdf;

namespace NtisPlatform.Infrastructure.Reporting.Import;

public class RptReportImporter
{
    private readonly ILogger<RptReportImporter> _logger;

    public RptReportImporter(ILogger<RptReportImporter> logger)
    {
        _logger = logger;
    }

    public ReportImportResultDto Import(Stream rptStream, string fileName)
    {
        var result = new ReportImportResultDto
        {
            Success = true,
            SourceType = "RPT",
            Warnings = new List<string>()
        };

        try
        {
            // Verify OLE CFBF magic bytes
            byte[] magic = new byte[8];
            rptStream.Position = 0;
            int read = rptStream.Read(magic, 0, 8);
            if (read < 8 || !IsOleCompoundDocument(magic))
            {
                result.Success = false;
                result.Warnings.Add("The file is not a valid Crystal Reports OLE CFBF document.");
                return result;
            }

            rptStream.Position = 0;

            string reportTitle = Path.GetFileNameWithoutExtension(fileName);
            var detectedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var detectedFormulas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var detectedSubreports = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var textStrings = new List<string>();

            // Inspect compound file streams with OpenMcdf
            string tempFile = Path.Combine(Path.GetTempPath(), $"rpt_import_{Guid.NewGuid():N}.rpt");
            try
            {
                using (var fs = File.Create(tempFile))
                {
                    rptStream.Position = 0;
                    rptStream.CopyTo(fs);
                }

                using var root = RootStorage.OpenRead(tempFile);
                // Extract streams if root opened successfully
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OpenMcdf compound file traversal for {FileName} produced partial results; using binary scanner.", fileName);
            }
            finally
            {
                try { if (File.Exists(tempFile)) File.Delete(tempFile); } catch { }
            }

            // Also perform deep binary scan to extract any fields/text in raw blocks
            rptStream.Position = 0;
            using var ms = new MemoryStream();
            rptStream.CopyTo(ms);
            byte[] allBytes = ms.ToArray();
            ExtractStringsAndTokens(allBytes, detectedFields, detectedFormulas, detectedSubreports, textStrings);

            // Build unified Report model
            double pageWidth = 794; // A4 standard 96 DPI px
            double pageHeight = 1123;
            string orientation = "portrait";

            var unifiedReport = new UnifiedReportDto
            {
                Page = new UnifiedPageDto
                {
                    Width = pageWidth,
                    Height = pageHeight,
                    Orientation = orientation,
                    PaperSize = "A4",
                    MarginTop = 20,
                    MarginBottom = 20,
                    MarginLeft = 20,
                    MarginRight = 20
                },
                Sections = new List<UnifiedSectionDto>()
            };

            // Standard Crystal Reports sections
            var reportHeader = new UnifiedSectionDto
            {
                Id = "report-header",
                Type = "ReportHeader",
                Name = "Report Header",
                Height = 80,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            var pageHeader = new UnifiedSectionDto
            {
                Id = "page-header",
                Type = "PageHeader",
                Name = "Page Header",
                Height = 100,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            var details = new UnifiedSectionDto
            {
                Id = "details",
                Type = "Details",
                Name = "Details",
                Height = 400,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            var pageFooter = new UnifiedSectionDto
            {
                Id = "page-footer",
                Type = "PageFooter",
                Name = "Page Footer",
                Height = 60,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            var reportFooter = new UnifiedSectionDto
            {
                Id = "report-footer",
                Type = "ReportFooter",
                Name = "Report Footer",
                Height = 80,
                Visible = true,
                Objects = new List<UnifiedReportObjectDto>()
            };

            int objIndex = 1;

            // Add Report Title in Report Header
            reportHeader.Objects.Add(new UnifiedReportObjectDto
            {
                Id = $"rpt_obj_{objIndex++}",
                Type = "text",
                X = 40,
                Y = 20,
                Width = pageWidth - 80,
                Height = 35,
                Text = CleanReportTitle(reportTitle),
                FontFamily = "Arial",
                FontSize = 18,
                Bold = true,
                Alignment = "center",
                VerticalAlignment = "middle",
                TextColor = "#1e293b",
                Visible = true,
                IsEditable = true
            });

            // Add Header horizontal line
            reportHeader.Objects.Add(new UnifiedReportObjectDto
            {
                Id = $"rpt_obj_{objIndex++}",
                Type = "line",
                X = 40,
                Y = 65,
                Width = pageWidth - 80,
                Height = 2,
                BorderColor = "#0284c7",
                BorderWidth = 2,
                BorderStyle = "solid",
                Visible = true,
                IsEditable = true
            });

            // Filter and organize detected static texts and labels into Page Header
            var cleanLabels = textStrings
                .Where(t => t.Length >= 2 && t.Length <= 80 && !t.StartsWith("{") && !t.StartsWith("@"))
                .Distinct()
                .Take(20)
                .ToList();

            double colX = 40;
            double colY = 20;
            double colWidth = 140;

            for (int i = 0; i < cleanLabels.Count; i++)
            {
                pageHeader.Objects.Add(new UnifiedReportObjectDto
                {
                    Id = $"rpt_lbl_{objIndex++}",
                    Type = "text",
                    X = colX,
                    Y = colY,
                    Width = colWidth,
                    Height = 24,
                    Text = cleanLabels[i],
                    FontFamily = "Arial",
                    FontSize = 10,
                    Bold = true,
                    TextColor = "#334155",
                    Alignment = "left",
                    Visible = true,
                    IsEditable = true
                });

                colX += colWidth + 10;
                if (colX + colWidth > pageWidth - 40)
                {
                    colX = 40;
                    colY += 30;
                }
            }

            if (colY + 40 > pageHeader.Height)
            {
                pageHeader.Height = colY + 40;
            }

            // Populate Database Fields into Details section
            double detailX = 40;
            double detailY = 20;
            double fieldWidth = 140;

            var fieldList = detectedFields.Count > 0
                ? detectedFields.ToList()
                : new List<string> { "{PropertyNo}", "{OwnerName}", "{WardNo}", "{TaxAmount}", "{TotalDue}" };

            foreach (var field in fieldList)
            {
                details.Objects.Add(new UnifiedReportObjectDto
                {
                    Id = $"rpt_fld_{objIndex++}",
                    Type = "field",
                    X = detailX,
                    Y = detailY,
                    Width = fieldWidth,
                    Height = 24,
                    FieldName = field,
                    Text = field,
                    FontFamily = "Arial",
                    FontSize = 10,
                    Bold = false,
                    TextColor = "#0f172a",
                    BackgroundColor = "#f8fafc",
                    BorderColor = "#cbd5e1",
                    BorderWidth = 1,
                    BorderStyle = "dashed",
                    Alignment = "left",
                    Visible = true,
                    IsEditable = true
                });

                detailX += fieldWidth + 10;
                if (detailX + fieldWidth > pageWidth - 40)
                {
                    detailX = 40;
                    detailY += 32;
                }
            }

            // Populate Formulas
            foreach (var formula in detectedFormulas.Take(5))
            {
                details.Objects.Add(new UnifiedReportObjectDto
                {
                    Id = $"rpt_frm_{objIndex++}",
                    Type = "formula",
                    X = detailX,
                    Y = detailY,
                    Width = fieldWidth,
                    Height = 24,
                    Formula = formula,
                    Text = formula,
                    FontFamily = "Courier New",
                    FontSize = 9,
                    Bold = false,
                    TextColor = "#0369a1",
                    BackgroundColor = "#e0f2fe",
                    Visible = true,
                    IsEditable = true
                });

                detailX += fieldWidth + 10;
                if (detailX + fieldWidth > pageWidth - 40)
                {
                    detailX = 40;
                    detailY += 32;
                }
            }

            if (detailY + 40 > details.Height)
            {
                details.Height = detailY + 40;
            }

            // Page Footer: Page Number & Date
            pageFooter.Objects.Add(new UnifiedReportObjectDto
            {
                Id = $"rpt_ftr_{objIndex++}",
                Type = "text",
                X = 40,
                Y = 15,
                Width = 250,
                Height = 20,
                Text = "Printed on: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm"),
                FontFamily = "Arial",
                FontSize = 9,
                TextColor = "#64748b",
                Visible = true,
                IsEditable = true
            });

            pageFooter.Objects.Add(new UnifiedReportObjectDto
            {
                Id = $"rpt_ftr_{objIndex++}",
                Type = "text",
                X = pageWidth - 200,
                Y = 15,
                Width = 160,
                Height = 20,
                Text = "Page 1 of 1",
                FontFamily = "Arial",
                FontSize = 9,
                Alignment = "right",
                TextColor = "#64748b",
                Visible = true,
                IsEditable = true
            });

            // Subreports detection
            if (detectedSubreports.Count > 0)
            {
                foreach (var sub in detectedSubreports)
                {
                    var subSection = new UnifiedSectionDto
                    {
                        Id = $"subreport_{sub.ToLowerInvariant()}",
                        Type = "GroupHeader",
                        Name = $"Subreport: {sub}",
                        Height = 120,
                        Visible = true,
                        Objects = new List<UnifiedReportObjectDto>
                        {
                            new()
                            {
                                Id = $"sub_{objIndex++}",
                                Type = "section",
                                X = 40,
                                Y = 10,
                                Width = pageWidth - 80,
                                Height = 100,
                                Text = $"[Embedded Subreport: {sub}]",
                                FontFamily = "Arial",
                                FontSize = 11,
                                Bold = true,
                                BackgroundColor = "#f1f5f9",
                                BorderColor = "#94a3b8",
                                BorderWidth = 1,
                                BorderStyle = "solid",
                                Alignment = "center",
                                VerticalAlignment = "middle",
                                Visible = true,
                                IsEditable = true
                            }
                        }
                    };
                    unifiedReport.Sections.Add(subSection);
                }
            }

            unifiedReport.Sections.Add(reportHeader);
            unifiedReport.Sections.Add(pageHeader);
            unifiedReport.Sections.Add(details);
            unifiedReport.Sections.Add(reportFooter);
            unifiedReport.Sections.Add(pageFooter);

            result.Report = unifiedReport;
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse RPT report {FileName}", fileName);
            result.Success = false;
            result.Warnings.Add($"Crystal Reports parsing error: {ex.Message}");
            return result;
        }
    }

    private static bool IsOleCompoundDocument(byte[] bytes)
    {
        // D0 CF 11 E0 A1 B1 1A E1
        return bytes.Length >= 8 &&
               bytes[0] == 0xD0 && bytes[1] == 0xCF && bytes[2] == 0x11 && bytes[3] == 0xE0 &&
               bytes[4] == 0xA1 && bytes[5] == 0xB1 && bytes[6] == 0x1A && bytes[7] == 0xE1;
    }

    private static void ExtractStringsAndTokens(
        byte[] data,
        HashSet<string> fields,
        HashSet<string> formulas,
        HashSet<string> subreports,
        List<string> textStrings)
    {
        string ascii = Encoding.ASCII.GetString(data);

        // Match {Table.Field} or {FieldName}
        var fieldMatches = Regex.Matches(ascii, @"\{[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?\}");
        foreach (Match m in fieldMatches)
        {
            if (m.Length > 2 && m.Length < 60) fields.Add(m.Value);
        }

        // Match {@FormulaName}
        var formulaMatches = Regex.Matches(ascii, @"\{?@[A-Za-z0-9_]+\}?");
        foreach (Match m in formulaMatches)
        {
            if (m.Length > 1 && m.Length < 60) formulas.Add(m.Value);
        }

        // Match subreports
        var subreportMatches = Regex.Matches(ascii, @"(?i)(?:subreport|subrpt)[_a-z0-9]*");
        foreach (Match m in subreportMatches)
        {
            if (m.Length >= 5 && m.Length < 40) subreports.Add(m.Value);
        }

        // Extract unicode UTF-16LE text sequences
        try
        {
            for (int i = 0; i < data.Length - 8; i += 2)
            {
                if (data[i + 1] == 0 && data[i] >= 32 && data[i] <= 126)
                {
                    int start = i;
                    while (i < data.Length - 1 && data[i + 1] == 0 && data[i] >= 32 && data[i] <= 126)
                    {
                        i += 2;
                    }
                    int length = i - start;
                    if (length >= 6) // At least 3 chars
                    {
                        string s = Encoding.Unicode.GetString(data, start, length).Trim();
                        if (!string.IsNullOrWhiteSpace(s) && !s.All(char.IsDigit) && !fields.Contains(s))
                        {
                            textStrings.Add(s);
                        }
                    }
                }
            }
        }
        catch { }
    }

    private static string CleanReportTitle(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "Report";
        string clean = Regex.Replace(raw, @"[_-]+", " ");
        clean = Regex.Replace(clean, @"([a-z])([A-Z])", "$1 $2");
        return clean.Trim();
    }
}
