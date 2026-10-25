using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Master.WaterBill;

public class TapSizeMasterDto : BaseDtos
{
    public new int Id { get; set; }
    public string TapSizeCode { get; set; } = string.Empty;
    public string TapSize { get; set; } = string.Empty;
    public decimal? NominalSizeValue { get; set; }
    public string? SizeUnit { get; set; }
    public new bool IsActive { get; set; }
    public int? CreatedBy { get; set; }
    public new DateTime? CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public new DateTime? UpdatedDate { get; set; }
}

public class CreateTapSizeMasterDto : CreateBaseDtos
{
    private string _tapSizeCode = string.Empty;
    [Required]
    [MaxLength(30)]
    public string TapSizeCode
    {
        get => _tapSizeCode;
        set => _tapSizeCode = value?.Trim() ?? string.Empty;
    }

    private string _tapSize = string.Empty;
    [Required]
    [MaxLength(100)]
    public string TapSize
    {
        get => _tapSize;
        set => _tapSize = value?.Trim() ?? string.Empty;
    }
    [Range(typeof(decimal), "0.001", "9999999.999")]
    public decimal? NominalSizeValue { get; set; }
    [MaxLength(20)]
    public string? SizeUnit { get; set; }
    public new bool IsActive { get; set; } = true;
}

public class UpdateTapSizeMasterDto : UpdateBaseDtos
{
    private string _tapSizeCode = string.Empty;
    [Required]
    [MaxLength(30)]
    public string TapSizeCode
    {
        get => _tapSizeCode;
        set => _tapSizeCode = value?.Trim() ?? string.Empty;
    }

    private string _tapSize = string.Empty;
    [Required]
    [MaxLength(100)]
    public string TapSize
    {
        get => _tapSize;
        set => _tapSize = value?.Trim() ?? string.Empty;
    }
    [Range(typeof(decimal), "0.001", "9999999.999")]
    public decimal? NominalSizeValue { get; set; }
    [MaxLength(20)]
    public string? SizeUnit { get; set; }
    public new bool IsActive { get; set; }
}

public class TapSizeMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    public int? Id { get; set; }
    [Filterable(FilterOperator.Contains)]
    public string? TapSizeCode { get; set; }
    [Filterable(FilterOperator.Contains)]
    public string? TapSize { get; set; }
    [Filterable(FilterOperator.Equals)]
    public bool? IsActive { get; set; }
}
