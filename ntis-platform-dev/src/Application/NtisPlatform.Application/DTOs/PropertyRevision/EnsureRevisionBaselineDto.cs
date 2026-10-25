using System.ComponentModel.DataAnnotations;
using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Request body for <c>POST api/properties/{propertyId}/revisions/baseline</c>: saves the
/// property's CURRENT (pre-change) details and tax as the initial assessment for a finance year.
/// </summary>
public class EnsureRevisionBaselineDto
{
    [Required]
    public int FinanceYearId { get; set; }

    public RevisionCalculationType CalculationType { get; set; } = RevisionCalculationType.RV;
}
