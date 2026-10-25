using Microsoft.AspNetCore.Http;
using NtisPlatform.Application.DTOs.ReportImport;

namespace NtisPlatform.Application.Interfaces;

public interface IUniversalReportImportService
{
    Task<ReportImportResultDto> ImportReportAsync(IFormFile file, CancellationToken cancellationToken = default);
}
