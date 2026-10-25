using ClosedXML.Excel;
using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using MigraDoc.Rendering;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Core.Enums;
using PdfSharp.Fonts;

namespace NtisPlatform.Application.Services.PropertyMedia;

/// <summary>
/// Combined export service providing Excel (.xlsx) and PDF export functionality for Property Media.
/// </summary>
public class PropertyMediaExportService : IPropertyMediaExportService
{
    private readonly IPropertyMediaDashboardService _dashboardService;
    private readonly IPropertyMediaDownloadService _downloadService;

    public PropertyMediaExportService(
        IPropertyMediaDashboardService dashboardService,
        IPropertyMediaDownloadService downloadService)
    {
        _dashboardService = dashboardService;
        _downloadService = downloadService;
    }

    #region Excel Exports

    public async Task<byte[]> ExportDetailedCoverageToExcelAsync(
        PropertyMediaCoverageQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var rows = await _dashboardService.GetDetailedCoverageAsync(queryParameters, cancellationToken);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Detailed Coverage");

        var headers = new[] { "Category", "Photo Type Code", "Photo Type Name", "Requirement", "Applicable", "Available", "Missing", "Coverage %" };
        const int headerRow = 3;
        AddTitle(worksheet, "Property Media - Detailed Coverage", headers.Length);

        for (var c = 0; c < headers.Length; c++)
            worksheet.Cell(headerRow, c + 1).Value = headers[c];

        for (var r = 0; r < rows.Count; r++)
        {
            var row = rows[r];
            var excelRow = headerRow + 1 + r;
            worksheet.Cell(excelRow, 1).Value = row.Category;
            worksheet.Cell(excelRow, 2).Value = row.PhotoTypeCode;
            worksheet.Cell(excelRow, 3).Value = row.PhotoTypeName;
            worksheet.Cell(excelRow, 4).Value = row.Requirement;
            worksheet.Cell(excelRow, 5).Value = row.Applicable;
            worksheet.Cell(excelRow, 6).Value = row.Available;
            worksheet.Cell(excelRow, 7).Value = row.Missing;

            var coverageCell = worksheet.Cell(excelRow, 8);
            if (decimal.TryParse(row.CoveragePercentage.TrimEnd('%'), out var percent))
            {
                coverageCell.Value = percent / 100m;
                coverageCell.Style.NumberFormat.Format = "0.##%";
            }
            else
            {
                coverageCell.Value = row.CoveragePercentage;
            }
        }

        FormatAsTable(worksheet, headerRow, headers.Length, rows.Count, "DetailedCoverageTable");
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportMissingPropertiesToExcelAsync(
        int? photoTypeId, PropertyMediaGapQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        queryParameters.PageSize = -1;
        queryParameters.PageNumber = 1;

        var result = await _dashboardService.GetMissingPropertiesByPhotoTypeAsync(photoTypeId, queryParameters, cancellationToken);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Missing Properties");

        var headers = new[] { "Property No", "Zone No", "Ward No", "Owner Name", "Property Type", "Stage Name", "Missing Type", "Updated Date" };
        const int headerRow = 3;
        AddTitle(worksheet, $"Property Media - Missing Properties ({result.PhotoTypeName})", headers.Length);

        for (var c = 0; c < headers.Length; c++)
            worksheet.Cell(headerRow, c + 1).Value = headers[c];

        var items = result.Items;
        for (var r = 0; r < items.Count; r++)
        {
            var item = items[r];
            var excelRow = headerRow + 1 + r;
            worksheet.Cell(excelRow, 1).Value = item.PropertyNo ?? string.Empty;
            worksheet.Cell(excelRow, 2).Value = item.ZoneNo ?? string.Empty;
            worksheet.Cell(excelRow, 3).Value = item.WardNo ?? string.Empty;
            worksheet.Cell(excelRow, 4).Value = item.OwnerName ?? string.Empty;
            worksheet.Cell(excelRow, 5).Value = item.PropertyType ?? string.Empty;
            worksheet.Cell(excelRow, 6).Value = item.StageName ?? string.Empty;
            worksheet.Cell(excelRow, 7).Value = item.MissingType;
            worksheet.Cell(excelRow, 8).Value = item.UpdatedDate;
        }

        FormatAsTable(worksheet, headerRow, headers.Length, items.Count, "MissingPropertiesTable");
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportMatchedFilesToExcelAsync(
        PropertyMediaCategory? category, int? photoTypeId, CancellationToken cancellationToken = default)
    {
        var items = await _downloadService.GetMatchedFilesAsync(category, photoTypeId, cancellationToken);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Matched Files");

        var headers = new[] { "Property No", "Photo Type", "File Name" };
        const int headerRow = 3;
        AddTitle(worksheet, "Property Media - Matched Files", headers.Length);

        for (var c = 0; c < headers.Length; c++)
            worksheet.Cell(headerRow, c + 1).Value = headers[c];

        for (var r = 0; r < items.Count; r++)
        {
            var item = items[r];
            var excelRow = headerRow + 1 + r;
            worksheet.Cell(excelRow, 1).Value = item.PropertyNo ?? string.Empty;
            worksheet.Cell(excelRow, 2).Value = item.PhotoTypeName;
            worksheet.Cell(excelRow, 3).Value = item.FileName;
        }

        FormatAsTable(worksheet, headerRow, headers.Length, items.Count, "MatchedFilesTable");
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportMediaJobsToExcelAsync(
        PropertyMediaJobQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        queryParameters.PageSize = -1;
        queryParameters.PageNumber = 1;

        var result = await _dashboardService.GetMediaJobsAsync(queryParameters, cancellationToken);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Media Jobs");

        var headers = new[] { "Created Date", "Started By", "Operation", "Photo Type", "Matched Count" };
        const int headerRow = 3;
        AddTitle(worksheet, "Property Media - Job History", headers.Length);

        for (var c = 0; c < headers.Length; c++)
            worksheet.Cell(headerRow, c + 1).Value = headers[c];

        var items = result.Items;
        for (var r = 0; r < items.Count; r++)
        {
            var item = items[r];
            var excelRow = headerRow + 1 + r;
            worksheet.Cell(excelRow, 1).Value = item.CreatedDate;
            worksheet.Cell(excelRow, 2).Value = item.StartedByUserName;
            worksheet.Cell(excelRow, 3).Value = item.Operation;
            worksheet.Cell(excelRow, 4).Value = item.PhotoTypeName;
            worksheet.Cell(excelRow, 5).Value = item.MatchedCount;
        }

        FormatAsTable(worksheet, headerRow, headers.Length, items.Count, "MediaJobsTable");
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void AddTitle(IXLWorksheet worksheet, string title, int columnCount)
    {
        worksheet.Range(1, 1, 1, columnCount).Merge();
        var titleCell = worksheet.Cell(1, 1);
        titleCell.Value = title;
        titleCell.Style.Font.Bold = true;
        titleCell.Style.Font.FontSize = 14;
    }

    private static void FormatAsTable(IXLWorksheet worksheet, int headerRow, int columnCount, int dataRowCount, string tableName)
    {
        if (dataRowCount == 0)
        {
            worksheet.Range(headerRow, 1, headerRow, columnCount).Style.Font.Bold = true;
            return;
        }

        var table = worksheet.Range(headerRow, 1, headerRow + dataRowCount, columnCount).CreateTable(tableName);
        table.Theme = XLTableTheme.TableStyleMedium2;
    }

    #endregion

    #region PDF Exports

    public async Task<byte[]> ExportDetailedCoverageToPdfAsync(
        PropertyMediaCoverageQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var rows = await _dashboardService.GetDetailedCoverageAsync(queryParameters, cancellationToken);

        var headers = new[] { "Category", "Photo Type Code", "Photo Type Name", "Requirement", "Applicable", "Available", "Missing", "Coverage %" };
        var table = BuildTable(headers, rows.Count, r => new[]
        {
            rows[r].Category,
            rows[r].PhotoTypeCode,
            rows[r].PhotoTypeName,
            rows[r].Requirement,
            rows[r].Applicable.ToString(),
            rows[r].Available.ToString(),
            rows[r].Missing.ToString(),
            rows[r].CoveragePercentage
        });

        return RenderTableToPdf("Property Media - Detailed Coverage", table);
    }

    public async Task<byte[]> ExportMissingPropertiesToPdfAsync(
        int? photoTypeId, PropertyMediaGapQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        queryParameters.PageSize = -1;
        queryParameters.PageNumber = 1;

        var result = await _dashboardService.GetMissingPropertiesByPhotoTypeAsync(photoTypeId, queryParameters, cancellationToken);
        var items = result.Items;

        var headers = new[] { "Property No", "Zone No", "Ward No", "Owner Name", "Property Type", "Stage Name", "Missing Type", "Updated Date" };
        var table = BuildTable(headers, items.Count, r => new[]
        {
            items[r].PropertyNo ?? string.Empty,
            items[r].ZoneNo ?? string.Empty,
            items[r].WardNo ?? string.Empty,
            items[r].OwnerName ?? string.Empty,
            items[r].PropertyType ?? string.Empty,
            items[r].StageName ?? string.Empty,
            items[r].MissingType,
            items[r].UpdatedDate
        });

        return RenderTableToPdf($"Property Media - Missing Properties ({result.PhotoTypeName})", table);
    }

    public async Task<byte[]> ExportMatchedFilesToPdfAsync(
        PropertyMediaCategory? category, int? photoTypeId, CancellationToken cancellationToken = default)
    {
        var items = await _downloadService.GetMatchedFilesAsync(category, photoTypeId, cancellationToken);

        var headers = new[] { "Property No", "Photo Type", "File Name" };
        var table = BuildTable(headers, items.Count, r => new[]
        {
            items[r].PropertyNo ?? string.Empty,
            items[r].PhotoTypeName,
            items[r].FileName
        });

        return RenderTableToPdf("Property Media - Matched Files", table);
    }

    public async Task<byte[]> ExportMediaJobsToPdfAsync(
        PropertyMediaJobQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        queryParameters.PageSize = -1;
        queryParameters.PageNumber = 1;

        var result = await _dashboardService.GetMediaJobsAsync(queryParameters, cancellationToken);
        var items = result.Items;

        var headers = new[] { "Created Date", "Started By", "Operation", "Photo Type", "Matched Count" };
        var table = BuildTable(headers, items.Count, r => new[]
        {
            items[r].CreatedDate,
            items[r].StartedByUserName,
            items[r].Operation,
            items[r].PhotoTypeName,
            items[r].MatchedCount.ToString()
        });

        return RenderTableToPdf("Property Media - Job History", table);
    }

    private static Table BuildTable(string[] headers, int rowCount, Func<int, string[]> rowValues)
    {
        var table = new Table();
        table.Borders.Width = 0.5;
        table.Format.Font.Size = 9;

        var columnWidth = Unit.FromCentimeter(25.7 / headers.Length);
        foreach (var _ in headers)
            table.AddColumn(columnWidth);

        var headerRow = table.AddRow();
        headerRow.Shading.Color = Colors.LightGray;
        headerRow.Format.Font.Bold = true;
        for (var c = 0; c < headers.Length; c++)
            headerRow.Cells[c].AddParagraph(headers[c]);

        for (var r = 0; r < rowCount; r++)
        {
            var values = rowValues(r);
            var row = table.AddRow();
            for (var c = 0; c < values.Length; c++)
                row.Cells[c].AddParagraph(values[c]);
        }

        return table;
    }

    private static byte[] RenderTableToPdf(string title, Table table)
    {
        EnsurePdfFontResolver();

        var document = new Document();
        var section = document.AddSection();
        section.PageSetup.Orientation = Orientation.Landscape;
        section.PageSetup.PageFormat = PageFormat.A4;

        var titleParagraph = section.AddParagraph(title);
        titleParagraph.Format.Font.Size = 14;
        titleParagraph.Format.Font.Bold = true;
        titleParagraph.Format.SpaceAfter = "0.5cm";

        section.Add(table);

        var renderer = new PdfDocumentRenderer { Document = document };
        renderer.RenderDocument();

        using var stream = new MemoryStream();
        renderer.PdfDocument.Save(stream, false);
        return stream.ToArray();
    }

    private static bool _pdfFontResolverInitialized;

    private static void EnsurePdfFontResolver()
    {
        if (_pdfFontResolverInitialized) return;
        GlobalFontSettings.FontResolver = new PdfFontResolver();
        _pdfFontResolverInitialized = true;
    }

    private sealed class PdfFontResolver : IFontResolver
    {
        private static readonly string[] FontSearchDirectories =
        [
            Path.Combine(AppContext.BaseDirectory, "Fonts"),
            Environment.GetFolderPath(Environment.SpecialFolder.Fonts),
            "/usr/share/fonts",
            "/usr/local/share/fonts",
            "/usr/share/fonts/truetype",
            "/usr/share/fonts/dejavu"
        ];

        private static readonly string[] BoldCandidates =
        [
            "mangalb.ttf",
            "arialbd.ttf",
            "calibrib.ttf",
            "segoeuib.ttf",
            "tahomabd.ttf",
            "DejaVuSans-Bold.ttf",
            "LiberationSans-Bold.ttf",
            "FreeSansBold.ttf"
        ];

        private static readonly string[] RegularCandidates =
        [
            "arialuni.ttf",
            "mangal.ttf",
            "arial.ttf",
            "calibri.ttf",
            "segoeui.ttf",
            "tahoma.ttf",
            "DejaVuSans.ttf",
            "LiberationSans-Regular.ttf",
            "FreeSans.ttf"
        ];

        public byte[] GetFont(string faceName)
        {
            var candidates = faceName.Contains("Bold", StringComparison.OrdinalIgnoreCase)
                ? BoldCandidates
                : RegularCandidates;

            foreach (var dir in FontSearchDirectories)
            {
                if (string.IsNullOrWhiteSpace(dir) || !Directory.Exists(dir))
                    continue;

                foreach (var fontFile in candidates)
                {
                    var fullPath = Path.Combine(dir, fontFile);
                    if (File.Exists(fullPath))
                    {
                        return File.ReadAllBytes(fullPath);
                    }
                }
            }

            // Fallback: search for any available TrueType font in the configured directories
            foreach (var dir in FontSearchDirectories)
            {
                if (string.IsNullOrWhiteSpace(dir) || !Directory.Exists(dir))
                    continue;

                try
                {
                    var anyTtf = Directory.EnumerateFiles(dir, "*.ttf", SearchOption.AllDirectories).FirstOrDefault();
                    if (anyTtf != null && File.Exists(anyTtf))
                    {
                        return File.ReadAllBytes(anyTtf);
                    }
                }
                catch
                {
                    // Ignore directory access permission issues and continue checking remaining search paths
                }
            }

            throw new FileNotFoundException($"Unable to resolve a valid TrueType font for '{faceName}'. Ensure system fonts are installed or place font files in the application's Fonts folder.");
        }

        public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic) =>
            new(isBold ? "ArialUnicode-Bold" : "ArialUnicode");
    }

    #endregion
}
