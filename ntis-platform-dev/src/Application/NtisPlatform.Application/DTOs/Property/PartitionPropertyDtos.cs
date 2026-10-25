using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Property;

public class GenerateMissingPartitionRequestDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "GenerateMissingPartition_WardId_is_Invalid.")]
    public int WardId { get; set; }

    [Required]
    public string MainPropertyNo { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "GenerateMissingPartition_UserId_is_required.")]
    public int UserId { get; set; }

    public bool IsMainPropertyDataAttach { get; set; }

    /// <summary>
    /// Optional Module identifier for module-based ward allocation check and workflow tracking.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "GenerateMissingPartition_ModuleId_is_Invalid.")]
    public int? ModuleId { get; set; }
}

public class GenerateMissingPartitionResponseDto
{
    public string MainPropertyNo { get; set; } = string.Empty;
    public int MissingFoundCount { get; set; }
    public int CreatedCount { get; set; }
    public List<string> CreatedList { get; set; } = new();
    public List<string> SkippedList { get; set; } = new();
}

public class CreateNewPartitionRequestDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "CreateNewPartition_WardId_is_Invalid.")]
    public int WardId { get; set; }

    [Required]
    public string MainPropertyNo { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "CreateNewPartition_UserId_is_required.")]
    public int UserId { get; set; }

    [Required]
    [Range(1, 1000, ErrorMessage = "CreateNewPartition_Nopartition_must_be_between_1_and_1000.")]
    public int Nopartition { get; set; }

    public bool IsMainPropertyDataAttach { get; set; }

    /// <summary>
    /// Optional Module identifier for module-based ward allocation check and workflow tracking.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "CreateNewPartition_ModuleId_is_Invalid.")]
    public int? ModuleId { get; set; }
}

public class CreateNewPartitionResponseDto
{
    public string MainPropertyNo { get; set; } = string.Empty;
    public int CreatedCount { get; set; }
    public List<CreatedPartitionDetailDto> CreatedList { get; set; } = new();
}

public class CreatedPartitionDetailDto
{
    public int PropertyId { get; set; }
    public string PropertyNo { get; set; } = string.Empty;
    public string PartitionNo { get; set; } = string.Empty;
    public string UPICId { get; set; } = string.Empty;
}
