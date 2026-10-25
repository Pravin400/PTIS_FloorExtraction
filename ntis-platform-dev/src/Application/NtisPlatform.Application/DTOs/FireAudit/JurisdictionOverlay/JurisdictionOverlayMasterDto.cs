using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.FireAudit.JurisdictionOverlay;

public class JurisdictionOverlayMasterDto : BaseDtos
{
    public int? UlbId { get; set; }
    public string? StateCode { get; set; }
    public string? StateName { get; set; }
    public string? ActTitle { get; set; }
    public string? RulesTitle { get; set; }
    public string? MunicipalActTitle { get; set; }
    public string? ByeLawTitle { get; set; }
    public string? SectionRefs { get; set; }
    public string IssuingAuthorityLabel { get; set; } = string.Empty;
    public string? CertificateFormCode { get; set; }
    public string? AuditReportFormCode { get; set; }
    public bool HasOwnFireBrigade { get; set; }
    public int ValidityMonths { get; set; }
    public string? ReminderOffsetsCsv { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class CreateJurisdictionOverlayMasterDto : CreateBaseDtos
{
    public int? UlbId { get; set; }

    [StringLength(10, ErrorMessage = "StateCode_MaxLen_10")]
    public string? StateCode { get; set; }

    [StringLength(100, ErrorMessage = "StateName_MaxLen_100")]
    public string? StateName { get; set; }

    [StringLength(300, ErrorMessage = "ActTitle_MaxLen_300")]
    public string? ActTitle { get; set; }

    [StringLength(300, ErrorMessage = "RulesTitle_MaxLen_300")]
    public string? RulesTitle { get; set; }

    [StringLength(300, ErrorMessage = "MunicipalActTitle_MaxLen_300")]
    public string? MunicipalActTitle { get; set; }

    [StringLength(300, ErrorMessage = "ByeLawTitle_MaxLen_300")]
    public string? ByeLawTitle { get; set; }

    [StringLength(400, ErrorMessage = "SectionRefs_MaxLen_400")]
    public string? SectionRefs { get; set; }

    [Required(ErrorMessage = "IssuingAuthorityLabel_Required")]
    [StringLength(200, ErrorMessage = "IssuingAuthorityLabel_MaxLen_200")]
    public string IssuingAuthorityLabel { get; set; } = string.Empty;

    [StringLength(40, ErrorMessage = "CertificateFormCode_MaxLen_40")]
    public string? CertificateFormCode { get; set; }

    [StringLength(40, ErrorMessage = "AuditReportFormCode_MaxLen_40")]
    public string? AuditReportFormCode { get; set; }

    public bool HasOwnFireBrigade { get; set; } = true;

    [Range(1, 120, ErrorMessage = "ValidityMonths_Range")]
    public int ValidityMonths { get; set; }

    [StringLength(40, ErrorMessage = "ReminderOffsetsCsv_MaxLen_40")]
    public string? ReminderOffsetsCsv { get; set; }

    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class UpdateJurisdictionOverlayMasterDto : UpdateBaseDtos
{
    public int? UlbId { get; set; }

    [StringLength(10, ErrorMessage = "StateCode_MaxLen_10")]
    public string? StateCode { get; set; }

    [StringLength(100, ErrorMessage = "StateName_MaxLen_100")]
    public string? StateName { get; set; }

    [StringLength(300, ErrorMessage = "ActTitle_MaxLen_300")]
    public string? ActTitle { get; set; }

    [StringLength(300, ErrorMessage = "RulesTitle_MaxLen_300")]
    public string? RulesTitle { get; set; }

    [StringLength(300, ErrorMessage = "MunicipalActTitle_MaxLen_300")]
    public string? MunicipalActTitle { get; set; }

    [StringLength(300, ErrorMessage = "ByeLawTitle_MaxLen_300")]
    public string? ByeLawTitle { get; set; }

    [StringLength(400, ErrorMessage = "SectionRefs_MaxLen_400")]
    public string? SectionRefs { get; set; }

    [Required(ErrorMessage = "IssuingAuthorityLabel_Required")]
    [StringLength(200, ErrorMessage = "IssuingAuthorityLabel_MaxLen_200")]
    public string IssuingAuthorityLabel { get; set; } = string.Empty;

    [StringLength(40, ErrorMessage = "CertificateFormCode_MaxLen_40")]
    public string? CertificateFormCode { get; set; }

    [StringLength(40, ErrorMessage = "AuditReportFormCode_MaxLen_40")]
    public string? AuditReportFormCode { get; set; }

    public bool HasOwnFireBrigade { get; set; } = true;

    [Range(1, 120, ErrorMessage = "ValidityMonths_Range")]
    public int ValidityMonths { get; set; }

    [StringLength(40, ErrorMessage = "ReminderOffsetsCsv_MaxLen_40")]
    public string? ReminderOffsetsCsv { get; set; }

    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}
