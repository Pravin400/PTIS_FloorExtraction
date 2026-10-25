using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Property;

public class NearestPropertiesQueryParameters
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>
    /// Search radius in kilometers (default: 2.0 km, max: 50.0 km).
    /// </summary>
    [Range(0.01, 50.0, ErrorMessage = "RadiusInKm must be between 0.01 and 50.0 km.")]
    public double RadiusInKm { get; set; } = 2.0;

    /// <summary>
    /// Maximum number of nearest properties to return (default: 10, max: 100).
    /// </summary>
    [Range(1, 100, ErrorMessage = "Limit must be between 1 and 100.")]
    public int Limit { get; set; } = 10;

    public int? WardId { get; set; }
    public string? WardNo { get; set; }
    public string? Flag { get; set; } = "ALL";
}

public class NearestPropertyDto : GetPropertiesItemDto
{
    public double DistanceInKm { get; set; }
    public double DistanceInMeters { get; set; }
}

