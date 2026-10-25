namespace NtisPlatform.Core.Models.Section129;

/// <summary>Full old tax/area/use values summed across every currently mapped PropertyMastOld row; mapping share percentages are not applied.</summary>
public record Section129OldSnapshot(decimal OldTaxTotal, decimal OldAreaTotal, HashSet<string> OldUseTypes);
