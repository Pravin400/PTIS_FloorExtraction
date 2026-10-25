using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Master.WaterBill;

public class ConnectionCategoryMasterDto : BaseDtos
{
    public new int Id { get; set; }
    public string ConnectionCategoryCode { get; set; } = string.Empty;
    public string ConnectionCategory { get; set; } = string.Empty;
    public int? BillingFrequencyId { get; set; }
    public string? BillingFrequencyCode { get; set; }
    public string? BillingFrequency { get; set; }
    public bool IsMetered { get; set; }
    public string BillingMethod { get; set; } = string.Empty;
    public string? Description { get; set; }
    public new bool IsActive { get; set; }
    public int? CreatedBy { get; set; }
    public new DateTime? CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public new DateTime? UpdatedDate { get; set; }
}

public static class ConnectionCategoryBillingRules
{
    public static readonly HashSet<string> MeteredBillingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "Metered", "Slab", "Telescopic", "Hybrid"
    };

    public static readonly HashSet<string> NonMeteredBillingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "Flat", "Fixed", "Annual"
    };

    public static IEnumerable<ValidationResult> ValidateMeteredConsistency(bool isMetered, string? billingMethod)
    {
        if (string.IsNullOrWhiteSpace(billingMethod))
        {
            yield break;
        }

        if (isMetered && NonMeteredBillingMethods.Contains(billingMethod))
        {
            yield return new ValidationResult(
                $"BillingMethod '{billingMethod}' is not valid for metered connections (IsMetered = true). Valid metered billing methods are: {string.Join(", ", MeteredBillingMethods)}.",
                new[] { nameof(CreateConnectionCategoryMasterDto.BillingMethod), nameof(CreateConnectionCategoryMasterDto.IsMetered) });
        }
        else if (!isMetered && MeteredBillingMethods.Contains(billingMethod))
        {
            yield return new ValidationResult(
                $"BillingMethod '{billingMethod}' is not valid for non-metered connections (IsMetered = false). Valid non-metered billing methods are: {string.Join(", ", NonMeteredBillingMethods)}.",
                new[] { nameof(CreateConnectionCategoryMasterDto.BillingMethod), nameof(CreateConnectionCategoryMasterDto.IsMetered) });
        }
    }
}

public class CreateConnectionCategoryMasterDto : CreateBaseDtos, IValidatableObject
{
    private string _connectionCategoryCode = string.Empty;
    [Required]
    [MaxLength(30)]
    public string ConnectionCategoryCode
    {
        get => _connectionCategoryCode;
        set => _connectionCategoryCode = value?.Trim() ?? string.Empty;
    }

    private string _connectionCategory = string.Empty;
    [Required]
    [MaxLength(150)]
    public string ConnectionCategory
    {
        get => _connectionCategory;
        set => _connectionCategory = value?.Trim() ?? string.Empty;
    }

    public int? BillingFrequencyId { get; set; }

    public bool IsMetered { get; set; } = true;

    private string _billingMethod = "Metered";
    [Required]
    [MaxLength(30)]
    [RegularExpression("^(Hybrid|Fixed|Annual|Telescopic|Slab|Flat|Metered)$", ErrorMessage = "BillingMethod must be one of: Hybrid, Fixed, Annual, Telescopic, Slab, Flat, Metered.")]
    public string BillingMethod
    {
        get => _billingMethod;
        set => _billingMethod = value?.Trim() ?? "Metered";
    }

    [MaxLength(300)]
    public string? Description { get; set; }

    public new bool IsActive { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        return ConnectionCategoryBillingRules.ValidateMeteredConsistency(IsMetered, BillingMethod);
    }
}

public class UpdateConnectionCategoryMasterDto : UpdateBaseDtos, IValidatableObject
{
    private string _connectionCategoryCode = string.Empty;
    [Required]
    [MaxLength(30)]
    public string ConnectionCategoryCode
    {
        get => _connectionCategoryCode;
        set => _connectionCategoryCode = value?.Trim() ?? string.Empty;
    }

    private string _connectionCategory = string.Empty;
    [Required]
    [MaxLength(150)]
    public string ConnectionCategory
    {
        get => _connectionCategory;
        set => _connectionCategory = value?.Trim() ?? string.Empty;
    }

    public int? BillingFrequencyId { get; set; }

    public bool IsMetered { get; set; } = true;

    private string _billingMethod = "Metered";
    [Required]
    [MaxLength(30)]
    [RegularExpression("^(Hybrid|Fixed|Annual|Telescopic|Slab|Flat|Metered)$", ErrorMessage = "BillingMethod must be one of: Hybrid, Fixed, Annual, Telescopic, Slab, Flat, Metered.")]
    public string BillingMethod
    {
        get => _billingMethod;
        set => _billingMethod = value?.Trim() ?? "Metered";
    }

    [MaxLength(300)]
    public string? Description { get; set; }

    public new bool IsActive { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        return ConnectionCategoryBillingRules.ValidateMeteredConsistency(IsMetered, BillingMethod);
    }
}

public class ConnectionCategoryMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    public string? ConnectionCategoryCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    public string? ConnectionCategory { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? BillingFrequencyId { get; set; }

    [Filterable(FilterOperator.Equals)]
    public bool? IsMetered { get; set; }

    [Filterable(FilterOperator.Contains)]
    public string? BillingMethod { get; set; }

    [Filterable(FilterOperator.Equals)]
    public bool? IsActive { get; set; }
}
