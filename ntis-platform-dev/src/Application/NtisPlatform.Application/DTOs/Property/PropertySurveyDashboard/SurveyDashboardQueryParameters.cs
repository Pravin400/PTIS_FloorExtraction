using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Property.PropertySurveyDashboard;

public class SurveyDashboardQueryParameters : IValidatableObject
{
    public int? WardId { get; set; }
    public string? FilterType { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var filter = FilterType?.Trim();

        if (!string.IsNullOrEmpty(filter) &&
            !string.Equals(filter, "All", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(filter, "Ward", StringComparison.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                "Invalid filter type. Supported values are 'All' and 'Ward'.",
                new[] { nameof(FilterType) });
        }

        if (!string.Equals(filter, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!WardId.HasValue || WardId.Value <= 0)
            {
                yield return new ValidationResult(
                    "SurveyDashboard_WardId_Required",
                    new[] { nameof(WardId) });
            }
        }
    }
}
