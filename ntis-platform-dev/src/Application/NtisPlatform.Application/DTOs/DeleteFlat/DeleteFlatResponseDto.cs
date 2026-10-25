namespace NtisPlatform.Application.DTOs.DeleteFlat;

public class DeleteFlatResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string FilterType { get; set; } = string.Empty;
    public int FilterValue { get; set; }
    public int DeletedCount { get; set; }
    public List<int> AffectedPropertyIds { get; set; } = new();
}
