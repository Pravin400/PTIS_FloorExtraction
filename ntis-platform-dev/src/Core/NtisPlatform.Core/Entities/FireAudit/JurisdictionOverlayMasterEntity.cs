using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.FireAudit;

/// <summary>
/// Legal and operational overlay for Fire Audit (FAS.JurisdictionOverlayMaster).
/// A ULB row beats a state row, which beats the national row.
/// </summary>
[Table("JurisdictionOverlayMaster", Schema = "FAS")]
public class JurisdictionOverlayMasterEntity : BaseEntity
{
    public int? UlbId { get; set; }

    [Column(TypeName = "varchar(10)")]
    public string? StateCode { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string? StateName { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string? ActTitle { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string? RulesTitle { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string? MunicipalActTitle { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string? ByeLawTitle { get; set; }

    [Column(TypeName = "nvarchar(400)")]
    public string? SectionRefs { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string IssuingAuthorityLabel { get; set; } = string.Empty;

    [Column(TypeName = "varchar(40)")]
    public string? CertificateFormCode { get; set; }

    [Column(TypeName = "varchar(40)")]
    public string? AuditReportFormCode { get; set; }

    public bool HasOwnFireBrigade { get; set; } = true;

    public int ValidityMonths { get; set; }

    [Column(TypeName = "varchar(40)")]
    public string? ReminderOffsetsCsv { get; set; }

    [Column(TypeName = "date")]
    public DateTime? EffectiveFrom { get; set; }

    [Column(TypeName = "date")]
    public DateTime? EffectiveTo { get; set; }
}
