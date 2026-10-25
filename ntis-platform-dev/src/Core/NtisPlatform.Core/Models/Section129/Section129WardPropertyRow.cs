namespace NtisPlatform.Core.Models.Section129;

/// <summary>One property/partition row for the single-assessment screen's combined "Property No" dropdown.</summary>
public record Section129WardPropertyRow(int PropertyId, string PropertyNo, string? PartitionNo, string? Upic);
