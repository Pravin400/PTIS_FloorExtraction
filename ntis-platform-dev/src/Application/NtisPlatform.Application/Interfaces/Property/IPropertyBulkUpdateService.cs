using NtisPlatform.Application.DTOs.PropertyBulkUpdate;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Interfaces.Property;

/// <summary>
/// Service interface for bulk-updating property data across multiple properties by their IDs.
/// Single method handles all concerns (owner, assessment, photos) in one transaction.
/// </summary>
public interface IPropertyBulkUpdateService
{
    /// <summary>
    /// Updates owner/occupier/contact, assessment, and photo details
    /// across all specified property IDs in a single transaction.
    /// Only non-null fields in the DTO are applied.
    /// </summary>
    /// <param name="dto">Payload containing property IDs and fields to update.</param>
    /// <param name="updatedBy">Actor user ID extracted from JWT claims.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<ApiResponse<bool>> UpdateIdWiseDetailsAsync(UpdatePropertyIdWiseDetailsDto dto, int updatedBy, CancellationToken cancellationToken = default);
}
