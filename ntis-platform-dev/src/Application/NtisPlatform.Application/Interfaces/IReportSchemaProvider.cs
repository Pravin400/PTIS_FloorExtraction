using NtisPlatform.Application.DTOs.HtmlReport;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Implemented by report data providers that can describe their schema/fields
/// dynamically to the visual report designer and catalog.
/// </summary>
public interface IReportSchemaProvider
{
    IReadOnlyList<HtmlReportDataSourceFieldDto> GetSchemaFields();
}
