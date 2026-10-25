namespace NtisPlatform.Application.DTOs;

/// <summary>
/// Base DTO with common audit and status properties for all DTOs
/// using a 64-bit BIGINT identity key (long Id).
/// </summary>
public class LongBaseDto
{
    public long Id { get; set; }
    public bool IsActive { get; set; }

    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
