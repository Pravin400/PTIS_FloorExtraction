using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;

public class ChargeHeadMasterDto : BaseDtos
{
    public new int Id { get; set; }
    public string ChargeHeadCode { get; set; } = string.Empty;
    public string ChargeHeadName { get; set; } = string.Empty;
    public string? ChargeHeadNameLocal { get; set; }
    public string ChargeType { get; set; } = string.Empty;
    public bool IsRefundable { get; set; }
    public int SequenceNo { get; set; } = 1;
    public string? Description { get; set; }
    public bool IsRegularPay { get; set; }
    public new bool IsActive { get; set; }
    public int? CreatedBy { get; set; }
    public new DateTime? CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public new DateTime? UpdatedDate { get; set; }
}

public class CreateChargeHeadMasterDto : CreateBaseDtos
{
    private string _chargeHeadCode = string.Empty;
    [Required]
    [MaxLength(40)]
    public string ChargeHeadCode
    {
        get => _chargeHeadCode;
        set => _chargeHeadCode = value?.Trim() ?? string.Empty;
    }

    private string _chargeHeadName = string.Empty;
    [Required]
    [MaxLength(150)]
    public string ChargeHeadName
    {
        get => _chargeHeadName;
        set => _chargeHeadName = value?.Trim() ?? string.Empty;
    }

    private string? _chargeHeadNameLocal;
    [MaxLength(150)]
    public string? ChargeHeadNameLocal
    {
        get => _chargeHeadNameLocal;
        set => _chargeHeadNameLocal = value?.Trim();
    }

    private string _chargeType = string.Empty;
    [Required]
    [MaxLength(30)]
    public string ChargeType
    {
        get => _chargeType;
        set => _chargeType = value?.Trim() ?? string.Empty;
    }

    public bool IsRefundable { get; set; }
    public int SequenceNo { get; set; } = 1;

    private string? _description;
    [MaxLength(500)]
    public string? Description
    {
        get => _description;
        set => _description = value?.Trim();
    }

    public bool IsRegularPay { get; set; }
    public new bool IsActive { get; set; } = true;
}

public class UpdateChargeHeadMasterDto : UpdateBaseDtos
{
    private string _chargeHeadCode = string.Empty;
    [Required]
    [MaxLength(40)]
    public string ChargeHeadCode
    {
        get => _chargeHeadCode;
        set => _chargeHeadCode = value?.Trim() ?? string.Empty;
    }

    private string _chargeHeadName = string.Empty;
    [Required]
    [MaxLength(150)]
    public string ChargeHeadName
    {
        get => _chargeHeadName;
        set => _chargeHeadName = value?.Trim() ?? string.Empty;
    }

    private string? _chargeHeadNameLocal;
    [MaxLength(150)]
    public string? ChargeHeadNameLocal
    {
        get => _chargeHeadNameLocal;
        set => _chargeHeadNameLocal = value?.Trim();
    }

    private string _chargeType = string.Empty;
    [Required]
    [MaxLength(30)]
    public string ChargeType
    {
        get => _chargeType;
        set => _chargeType = value?.Trim() ?? string.Empty;
    }

    public bool IsRefundable { get; set; }
    public int SequenceNo { get; set; } = 1;

    private string? _description;
    [MaxLength(500)]
    public string? Description
    {
        get => _description;
        set => _description = value?.Trim();
    }

    public bool IsRegularPay { get; set; }
    public new bool IsActive { get; set; }
}
