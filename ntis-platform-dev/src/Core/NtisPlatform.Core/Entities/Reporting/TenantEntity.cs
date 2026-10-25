namespace NtisPlatform.Core.Entities.Reporting;

/// <summary>
/// Mirrors dbo.Tenant in NtisReportDb (the reporting engine database).
/// Foreign key anchor for OrganizationId in HtmlReportTemplate, HtmlReportJob, and ReportDefinitions.
/// </summary>
public class TenantEntity
{
    public int OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedDate { get; set; }
}
