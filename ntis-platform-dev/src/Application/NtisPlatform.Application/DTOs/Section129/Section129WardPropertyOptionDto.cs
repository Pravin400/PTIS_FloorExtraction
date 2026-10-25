namespace NtisPlatform.Application.DTOs.Section129;

/// <summary>One property/partition row for the single-assessment screen's combined "Property No" dropdown.</summary>
public class Section129WardPropertyOptionDto
{
    public int PropertyId { get; set; }
    public string PropertyNo { get; set; } = string.Empty;
    public string? PartitionNo { get; set; }
    public string? Upic { get; set; }
}
