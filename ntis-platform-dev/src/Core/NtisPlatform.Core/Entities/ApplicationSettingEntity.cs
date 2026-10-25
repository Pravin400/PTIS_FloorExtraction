using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Entity representing an application setting in the GSMS system.
/// Maps to [GSMS].[ApplicationSetting] table.
/// </summary>
[Table("ApplicationSetting", Schema = "GSMS")]
public class ApplicationSettingEntity : BaseEntity
{
    public string FlagName { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public bool? DefaultValue_Bit { get; set; }
    public int? DefaultValue_INT { get; set; }
    public double? DefaultValue_FLOAT { get; set; }
    public DateTime? DefaultValue_DateTime { get; set; }
    public string? DefaultValue_NVARCHAR { get; set; }
    public int? ModuleId { get; set; }
    public string? Description { get; set; }

    // Navigation property
    [ForeignKey(nameof(ModuleId))]
    public virtual ModuleMasterEntity? Module { get; set; }
}
