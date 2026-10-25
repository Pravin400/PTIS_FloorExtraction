using NtisPlatform.Application.DTOs.Queries;
using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Flat;

/// <summary>
/// Request DTO for updating Flat details including validation of Property, Society, Wing, and duplicate FlatShopNumber check.
/// </summary>
public class UpdateFlatDto : UpdateBaseDtos
{
    private string? _flatShopNumber;
    private string? _flatOrShopNo;
    private string? _flatOrShopName;
    private string? _flatOrShopNoEnglish;
    private string? _flatOrShopNameEnglish;

    /// <summary>
    /// The Property ID (PropertyMast.Id).
    /// </summary>
    [Required(ErrorMessage = "Flat_PropertyId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Flat_PropertyId_Invalid")]
    public int PropertyId { get; set; }

    /// <summary>
    /// The Society Details ID (SocietyDetailsMast.Id).
    /// </summary>
    [Required(ErrorMessage = "Flat_SocietyDetailsId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Flat_SocietyDetailsId_Invalid")]
    public int SocietyDetailsId { get; set; }

    /// <summary>
    /// The Wing Details ID (WingDetailsMast.Id).
    /// </summary>
    [Required(ErrorMessage = "Flat_WingDetailsId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Flat_WingDetailsId_Invalid")]
    public int WingDetailsId { get; set; }

    /// <summary>
    /// The Flat or Shop number to update.
    /// </summary>
    [Required(ErrorMessage = "Flat_FlatShopNumber_Required")]
    [StringLength(100, ErrorMessage = "Flat_FlatShopNumber_MaxLen_100")]
    public string FlatShopNumber
    {
        get => _flatShopNumber ?? _flatOrShopNo ?? string.Empty;
        set
        {
            _flatShopNumber = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
            if (_flatOrShopNo == null)
            {
                _flatOrShopNo = _flatShopNumber;
            }
        }
    }

    /// <summary>
    /// Optional alias for FlatShopNumber.
    /// </summary>
    [StringLength(100, ErrorMessage = "Flat_FlatOrShopNo_MaxLen_100")]
    public string? FlatOrShopNo
    {
        get => _flatOrShopNo ?? _flatShopNumber;
        set
        {
            _flatOrShopNo = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
            if (_flatShopNumber == null)
            {
                _flatShopNumber = _flatOrShopNo;
            }
        }
    }

    [StringLength(200, ErrorMessage = "Flat_FlatOrShopName_MaxLen_200")]
    public string? FlatOrShopName
    {
        get => _flatOrShopName;
        set => _flatOrShopName = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [StringLength(100, ErrorMessage = "Flat_FlatOrShopNoEnglish_MaxLen_100")]
    public string? FlatOrShopNoEnglish
    {
        get => _flatOrShopNoEnglish;
        set => _flatOrShopNoEnglish = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [StringLength(200, ErrorMessage = "Flat_FlatOrShopNameEnglish_MaxLen_200")]
    public string? FlatOrShopNameEnglish
    {
        get => _flatOrShopNameEnglish;
        set => _flatOrShopNameEnglish = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}

/// <summary>
/// DTO representing flat response details.
/// </summary>
public class FlatDto
{
    public int PropertyId { get; set; }
    public int? SocietyDetailsId { get; set; }
    public int? WingDetailsId { get; set; }
    public string? FlatShopNumber { get; set; }
    public string? FlatOrShopNo { get; set; }
    public string? FlatOrShopName { get; set; }
    public string? FlatOrShopNoEnglish { get; set; }
    public string? FlatOrShopNameEnglish { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int WardId { get; set; }
    public bool IsActive { get; set; }
    public bool MarkedForDeletion { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

/// <summary>
/// DTO for creating Flat records.
/// </summary>
public class CreateFlatDto : CreateBaseDtos
{
    [Required(ErrorMessage = "Flat_PropertyId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Flat_PropertyId_Invalid")]
    public int PropertyId { get; set; }

    [Required(ErrorMessage = "Flat_SocietyDetailsId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Flat_SocietyDetailsId_Invalid")]
    public int SocietyDetailsId { get; set; }

    [Required(ErrorMessage = "Flat_WingDetailsId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Flat_WingDetailsId_Invalid")]
    public int WingDetailsId { get; set; }

    [Required(ErrorMessage = "Flat_FlatShopNumber_Required")]
    [StringLength(100, ErrorMessage = "Flat_FlatShopNumber_MaxLen_100")]
    public string FlatShopNumber { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "Flat_FlatOrShopName_MaxLen_200")]
    public string? FlatOrShopName { get; set; }

    [StringLength(100, ErrorMessage = "Flat_FlatOrShopNoEnglish_MaxLen_100")]
    public string? FlatOrShopNoEnglish { get; set; }

    [StringLength(200, ErrorMessage = "Flat_FlatOrShopNameEnglish_MaxLen_200")]
    public string? FlatOrShopNameEnglish { get; set; }
}

/// <summary>
/// Query parameters for querying Flat records.
/// </summary>
public class FlatQueryParameters : BaseQueryParameters
{
    public int? PropertyId { get; set; }
    public int? SocietyDetailsId { get; set; }
    public int? WingDetailsId { get; set; }
    public string? FlatShopNumber { get; set; }
}
