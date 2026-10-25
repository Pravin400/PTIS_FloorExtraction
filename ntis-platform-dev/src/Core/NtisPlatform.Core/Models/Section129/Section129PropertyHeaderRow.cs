namespace NtisPlatform.Core.Models.Section129;

/// <summary>Raw header fields read straight off PropertyMast/PropertyDetails/Ward/Zone/Mouja/TypeOfUseGroup.</summary>
public record Section129PropertyHeaderRow(
    string Upic,
    string OwnerName,
    string Address,
    string? MoujaName,
    string WardNo,
    string? ZoneDescription,
    string? UseTypeGroupName,
    string? AssessmentYear,
    int? PropertyDetailsId,
    int? TypeOfUseId,
    int WardId);
