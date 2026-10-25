namespace NtisPlatform.Application.DTOs.Property.PropertySurveyDashboard;

public class SurveyDashboardResponseDto
{
    /// <summary>
    /// Gets or sets the total number of active old properties
    /// across the corporation, regardless of the requested WardId
    /// or dashboard FilterType.
    /// </summary>
    public int TotalOldProperties { get; set; }
    public int TotalProperties { get; set; }
    public int TotalWings { get; set; }
    public int Assessed { get; set; }
    public int Unassessed { get; set; }
    public int TotalAmenities { get; set; }
    public SurveyVerifiedDto SurveyVerifiedDetails { get; set; } = new();
    public SubmissionDto SubmissionDetails { get; set; } = new();
    public IndividualDto IndividualDetails { get; set; } = new();
    public ApartmentDto ApartmentDetails { get; set; } = new();
    public IndustryDto IndustryDetails { get; set; } = new();
    public PlotDto PlotDetails { get; set; } = new();
}

public class SurveyVerifiedDto
{
    public int InternalSurveyVerified { get; set; }
    public int InternalSurveyVerifiedAssessed { get; set; }
    public int InternalSurveyVerifiedUnassessed { get; set; }
    public int InternalSurveyPending { get; set; }
    public int InternalSurveyPendingAssessed { get; set; }
    public int InternalSurveyPendingUnassessed { get; set; }
}

public class SubmissionDto
{
    public int SubmissionComplete { get; set; }
    public int SubmissionCompleteAssessed { get; set; }
    public int SubmissionCompleteUnassessed { get; set; }
    public int SubmissionPending { get; set; }
    public int SubmissionPendingAssessed { get; set; }
    public int SubmissionPendingUnassessed { get; set; }
}

public class IndividualDto
{
    public int TotalIndividualProperties { get; set; }
    public int IndividualMainProperty { get; set; }
    public int IndividualPartitionProperty { get; set; }
    public int IndividualAssessed { get; set; }
    public int IndividualUnassessed { get; set; }
}

/// <summary>
/// Breakdown of apartment category properties.
/// Note on reconciliation:
/// <list type="bullet">
///   <item><description><see cref="TotalApartmentProperties"/> is the total count of all apartment units (including amenities).</description></item>
///   <item><description><see cref="ApartmentAmenity"/> is the count of apartment units flagged as amenities.</description></item>
///   <item><description><see cref="ApartmentMainProperty"/> counts main non-amenity apartment properties.</description></item>
///   <item><description><see cref="ApartmentPartitionProperty"/> counts partition non-amenity apartment properties.</description></item>
///   <item><description>Reconciliation: <c>ApartmentMainProperty + ApartmentPartitionProperty + ApartmentAmenity == TotalApartmentProperties</c>.</description></item>
/// </list>
/// </summary>
public class ApartmentDto
{
    public int TotalApartmentProperties { get; set; }
    public int ApartmentMainProperty { get; set; }
    public int ApartmentPartitionProperty { get; set; }
    public int ApartmentAmenity { get; set; }
    public int ApartmentAssessed { get; set; }
    public int ApartmentUnassessed { get; set; }
}

public class IndustryDto
{
    public int TotalIndustryProperties { get; set; }
    public int IndustryMainProperty { get; set; }
    public int IndustryPartitionProperty { get; set; }
    public int IndustryAssessed { get; set; }
    public int IndustryUnassessed { get; set; }
}

public class PlotDto
{
    public int TotalPlotProperties { get; set; }
    public int PlotMainProperty { get; set; }
    public int PlotPartitionProperty { get; set; }
    public int PlotAssessed { get; set; }
    public int PlotUnassessed { get; set; }
}