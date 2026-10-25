using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Master.WaterBill;

public class ConnectionTypeMasterDto : BaseDtos
{
    public new int Id { get; set; }
    public string ConnectionTypeCode { get; set; } = string.Empty;
    public string ConnectionType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public new bool IsActive { get; set; }
    public int? CreatedBy { get; set; }
    public new DateTime? CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public new DateTime? UpdatedDate { get; set; }
}

public class CreateConnectionTypeMasterDto : CreateBaseDtos
{
    private string _connectionTypeCode = string.Empty;
    [Required]
    [MaxLength(30)]
    [RegularExpression(@"^[A-Z0-9_-]+$", ErrorMessage = "Connection Type Code can only contain uppercase alphanumeric characters, hyphen (-), and underscore (_).")]
    public string ConnectionTypeCode
    {
        get => _connectionTypeCode;
        set => _connectionTypeCode = value?.Trim() ?? string.Empty;
    }

    private string _connectionType = string.Empty;
    [Required]
    [MaxLength(100)]
    public string ConnectionType
    {
        get => _connectionType;
        set => _connectionType = value?.Trim() ?? string.Empty;
    }
    [MaxLength(300)]
    public string? Description { get; set; }
    public new bool IsActive { get; set; } = true;
}

public class UpdateConnectionTypeMasterDto : UpdateBaseDtos
{
    private string _connectionTypeCode = string.Empty;
    [Required]
    [MaxLength(30)]
    [RegularExpression(@"^[A-Z0-9_-]+$", ErrorMessage = "Connection Type Code can only contain uppercase alphanumeric characters, hyphen (-), and underscore (_).")]
    public string ConnectionTypeCode
    {
        get => _connectionTypeCode;
        set => _connectionTypeCode = value?.Trim() ?? string.Empty;
    }

    private string _connectionType = string.Empty;
    [Required]
    [MaxLength(100)]
    public string ConnectionType
    {
        get => _connectionType;
        set => _connectionType = value?.Trim() ?? string.Empty;
    }
    [MaxLength(300)]
    public string? Description { get; set; }
    public new bool IsActive { get; set; }
}

public class ConnectionTypeMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ConnectionTypeCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ConnectionType { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
