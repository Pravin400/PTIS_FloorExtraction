using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.RelationshipMaster;

/// <summary>
/// Response DTO for Municipal Payroll Relationship Master
/// </summary>
public class PayrollRelationshipMasterDto : BaseDtos
{
    public string RelationshipCode { get; set; } = string.Empty;
    public string RelationshipName { get; set; } = string.Empty;
    public string? RelationshipNameRegional { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Relationship Master
/// </summary>
public class CreatePayrollRelationshipMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "RelationshipCode is required")]
    [MaxLength(30, ErrorMessage = "RelationshipCode cannot exceed 30 characters")]
    public string RelationshipCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "RelationshipName is required")]
    [MaxLength(100, ErrorMessage = "RelationshipName cannot exceed 100 characters")]
    public string RelationshipName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "RelationshipNameRegional cannot exceed 150 characters")]
    public string? RelationshipNameRegional { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Relationship Master
/// </summary>
public class UpdatePayrollRelationshipMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "RelationshipCode is required")]
    [MaxLength(30, ErrorMessage = "RelationshipCode cannot exceed 30 characters")]
    public string RelationshipCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "RelationshipName is required")]
    [MaxLength(100, ErrorMessage = "RelationshipName cannot exceed 100 characters")]
    public string RelationshipName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "RelationshipNameRegional cannot exceed 150 characters")]
    public string? RelationshipNameRegional { get; set; }
}
