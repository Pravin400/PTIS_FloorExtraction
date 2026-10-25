namespace NtisPlatform.Core.Models.Section129;

/// <summary>Current total built-up area and distinct current use-type-group names across the property's active PropertyDetails rows.</summary>
public record Section129CurrentSnapshot(decimal CurrentAreaTotal, HashSet<string> CurrentUseTypeGroupNames);
