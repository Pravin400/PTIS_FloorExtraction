using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;
using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.VirtualPropertyTransferHistory;

/// <summary>
/// Data transfer object representing virtual property transfer history details.
/// </summary>
public class VirtualPropertyTransferHistoryDto : BaseDtos
{
    public int PropertyId { get; set; }
    public int WardId { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int TransferredWardId { get; set; }
    public string? TransferredPropertyNo { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public List<int>? WingDetailIds { get; set; }
    public List<int>? SocityDetailMastIds { get; set; }
}

/// <summary>
/// Request DTO for transferring a virtual property and its sub-properties.
/// </summary>
public class CreateVirtualPropertyTransferHistoryDto : CreateBaseDtos
{
    [Required(ErrorMessage = "PropertyId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyId must be greater than 0.")]
    public int PropertyId { get; set; }

    [Required(ErrorMessage = "WardId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "WardId must be greater than 0.")]
    public int WardId { get; set; }

    [Required(ErrorMessage = "PropertyNo is required.")]
    public string PropertyNo { get; set; } = string.Empty;

    public string? PartitionNo { get; set; }

    [Required(ErrorMessage = "TransferredWardId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "TransferredWardId must be greater than 0.")]
    public int TransferredWardId { get; set; }

    [Required(ErrorMessage = "TransferredPropertyNo is required.")]
    public string TransferredPropertyNo { get; set; } = string.Empty;

    /// <summary>
    /// Optional list of wing detail IDs (WingDetailsMast.Id / PropertyMast.WingDetailId) to filter which sub-properties/wings to transfer.
    /// </summary>
    public List<int>? WingDetailIds { get; set; }

    /// <summary>
    /// Optional list of society detail IDs (SocietyDetailsMast.Id) to filter which sub-properties/wings to transfer.
    /// </summary>
    public List<int>? SocityDetailMastIds { get; set; }
}

/// <summary>
/// DTO for updating virtual property transfer history.
/// </summary>
public class UpdateVirtualPropertyTransferHistoryDto : UpdateBaseDtos
{
    public int PropertyId { get; set; }
    public int WardId { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int TransferredWardId { get; set; }
    public string? TransferredPropertyNo { get; set; }
}

/// <summary>
/// Query parameters for filtering and paging virtual property transfer history records.
/// </summary>
public class VirtualPropertyTransferHistoryQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    public int? PropertyId { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? WardId { get; set; }

    [Filterable(FilterOperator.Equals)]
    public string? PropertyNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    public string? PartitionNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? TransferredWardId { get; set; }

    [Filterable(FilterOperator.Equals)]
    public string? TransferredPropertyNo { get; set; }
}

/// <summary>
/// Request parameters for querying virtual property transfer history.
/// </summary>
public class GetVirtualPropertyTransferHistoryRequestDto
{
    public int? WardId { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int? PageNumber { get; set; }
    public int? PageSize { get; set; }
}

/// <summary>
/// Request DTO for batch virtual property transfer.
/// </summary>
public class BatchTransferRequestDto
{
    [Required(ErrorMessage = "Items are required.")]
    [MinLength(1, ErrorMessage = "At least one item is required for batch transfer.")]
    public List<CreateVirtualPropertyTransferHistoryDto> Items { get; set; } = new();
}
