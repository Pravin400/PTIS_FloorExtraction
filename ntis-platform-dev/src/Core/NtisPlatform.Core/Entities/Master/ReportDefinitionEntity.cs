namespace NtisPlatform.Core.Entities.Master;

public class ReportDefinitionEntity : BaseEntity
{
    public string ReportCode { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public int? ModuleId { get; set; }
    public string? Description { get; set; }
    public string TemplateFile { get; set; } = string.Empty;
    public int TemplateVersion { get; set; } = 1;
    public string DataProviderCode { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsBuiltIn { get; set; }
    public string? SupportedPageSizesJson { get; set; }
    public long? DefaultHtmlTemplateVersionId { get; set; }
}
