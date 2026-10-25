using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.ReportImport;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Infrastructure.Reporting.Import;

public class UniversalReportImportService : IUniversalReportImportService
{
    private readonly PdfReportImporter _pdfImporter;
    private readonly RptReportImporter _rptImporter;
    private readonly ILogger<UniversalReportImportService> _logger;
    private const long MaxFileSizeBytes = 30 * 1024 * 1024; // 30 MB

    public UniversalReportImportService(
        PdfReportImporter pdfImporter,
        RptReportImporter rptImporter,
        ILogger<UniversalReportImportService> logger)
    {
        _pdfImporter = pdfImporter;
        _rptImporter = rptImporter;
        _logger = logger;
    }

    public async Task<ReportImportResultDto> ImportReportAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return new ReportImportResultDto
            {
                Success = false,
                Warnings = new List<string> { "No file was uploaded." }
            };
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return new ReportImportResultDto
            {
                Success = false,
                Warnings = new List<string> { "Uploaded file exceeds the maximum allowed size of 30 MB." }
            };
        }

        string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".rpt" && extension != ".pdf")
        {
            return new ReportImportResultDto
            {
                Success = false,
                Warnings = new List<string> { "Unsupported file format. Please upload a .rpt (Crystal Reports) or .pdf file." }
            };
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        // Auto-detect actual file type using header magic bytes
        byte[] headerBytes = new byte[8];
        int readBytes = await memoryStream.ReadAsync(headerBytes.AsMemory(0, 8), cancellationToken);
        memoryStream.Position = 0;

        string detectedType = DetectFileType(headerBytes);

        _logger.LogInformation("Processing report import for {FileName} detected as {DetectedType}", file.FileName, detectedType);

        if (detectedType == "PDF")
        {
            return _pdfImporter.Import(memoryStream, file.FileName);
        }
        else if (detectedType == "RPT")
        {
            return _rptImporter.Import(memoryStream, file.FileName);
        }
        else
        {
            return new ReportImportResultDto
            {
                Success = false,
                Warnings = new List<string> { "File header does not match a valid PDF or Crystal Reports document." }
            };
        }
    }

    private static string DetectFileType(byte[] header)
    {
        // %PDF-
        if (header.Length >= 4 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46)
        {
            return "PDF";
        }

        // OLE CFBF: D0 CF 11 E0 A1 B1 1A E1
        if (header.Length >= 8 &&
            header[0] == 0xD0 && header[1] == 0xCF && header[2] == 0x11 && header[3] == 0xE0 &&
            header[4] == 0xA1 && header[5] == 0xB1 && header[6] == 0x1A && header[7] == 0xE1)
        {
            return "RPT";
        }

        return "UNKNOWN";
    }
}
