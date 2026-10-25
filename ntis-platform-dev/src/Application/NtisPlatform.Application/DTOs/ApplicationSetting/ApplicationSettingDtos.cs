using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace NtisPlatform.Application.DTOs.ApplicationSetting;

/// <summary>
/// DTO representing grouped application settings by module
/// </summary>
public class ApplicationSettingModuleDto
{
    public int? ModuleId { get; set; }
    public string? ModuleName { get; set; }

    [JsonExtensionData]
    public Dictionary<string, object?> Settings { get; set; } = new();
}

/// <summary>
/// DTO for retrieving ApplicationSetting
/// </summary>
public class ApplicationSettingDto : BaseDtos
{
    public string? FlagName { get; set; }
    public string? DataType { get; set; }
    public bool? DefaultValue_Bit { get; set; }
    public int? DefaultValue_INT { get; set; }
    public double? DefaultValue_FLOAT { get; set; }
    public DateTime? DefaultValue_DateTime { get; set; }
    public string? DefaultValue_NVARCHAR { get; set; }
    public int? ModuleId { get; set; }
    public string? ModuleName { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO for creating an ApplicationSetting
/// </summary>
public class CreateApplicationSettingDto : CreateBaseDtos
{
    [Required(ErrorMessage = "FlagName_Required")]
    [MaxLength(100, ErrorMessage = "FlagName_MaxLen_100")]
    public string FlagName { get; set; } = string.Empty;

    [Required(ErrorMessage = "DataType_Required")]
    [MaxLength(50, ErrorMessage = "DataType_MaxLen_50")]
    public string DataType { get; set; } = string.Empty;

    public bool? DefaultValue_Bit { get; set; }

    public int? DefaultValue_INT { get; set; }

    public double? DefaultValue_FLOAT { get; set; }

    public DateTime? DefaultValue_DateTime { get; set; }

    [MaxLength(500, ErrorMessage = "DefaultValue_NVARCHAR_MaxLen_500")]
    public string? DefaultValue_NVARCHAR { get; set; }

    public int? ModuleId { get; set; }

    [MaxLength(200, ErrorMessage = "Description_MaxLen_200")]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating an ApplicationSetting
/// </summary>
public class UpdateApplicationSettingDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Id_Required")]
    public int Id { get; set; }

    [Required(ErrorMessage = "FlagName_Required")]
    [MaxLength(100, ErrorMessage = "FlagName_MaxLen_100")]
    public string FlagName { get; set; } = string.Empty;

    [Required(ErrorMessage = "DataType_Required")]
    [MaxLength(50, ErrorMessage = "DataType_MaxLen_50")]
    public string DataType { get; set; } = string.Empty;

    public bool? DefaultValue_Bit { get; set; }

    public int? DefaultValue_INT { get; set; }

    public double? DefaultValue_FLOAT { get; set; }

    public DateTime? DefaultValue_DateTime { get; set; }

    [MaxLength(500, ErrorMessage = "DefaultValue_NVARCHAR_MaxLen_500")]
    public string? DefaultValue_NVARCHAR { get; set; }

    public int? ModuleId { get; set; }

    [MaxLength(200, ErrorMessage = "Description_MaxLen_200")]
    public string? Description { get; set; }
}
