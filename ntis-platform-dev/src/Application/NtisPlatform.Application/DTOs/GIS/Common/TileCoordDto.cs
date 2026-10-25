using System;
using NetTopologySuite.Geometries;

namespace NtisPlatform.Application.DTOs.GIS;

/// <summary>
/// Model representing Mapbox tile grid coordinates (Zoom Z, Column X, Row Y).
/// Encapsulates Web Mercator (EPSG:4326 WGS84) bounding envelope math and validations.
/// </summary>
public class TileCoordDto
{
    public int Z { get; set; }
    public int X { get; set; }
    public int Y { get; set; }

    public TileCoordDto() { }

    public TileCoordDto(int z, int x, int y)
    {
        if (z < 0 || z > 22)
            throw new ArgumentOutOfRangeException(nameof(z), "Zoom level must be between 0 and 22.");

        int maxCoord = (1 << z) - 1;
        if (x < 0 || x > maxCoord)
            throw new ArgumentOutOfRangeException(nameof(x), $"Tile X must be between 0 and {maxCoord} for zoom level {z}.");

        if (y < 0 || y > maxCoord)
            throw new ArgumentOutOfRangeException(nameof(y), $"Tile Y must be between 0 and {maxCoord} for zoom level {z}.");

        Z = z;
        X = x;
        Y = y;
    }

    /// <summary>
    /// Calculates the geographical bounding envelope (minLon, maxLon, minLat, maxLat) in EPSG:4326
    /// </summary>
    public Envelope ToEnvelope()
    {
        double n = Math.Pow(2, Z);
        double minLon = X / n * 360.0 - 180.0;
        double maxLon = (X + 1) / n * 360.0 - 180.0;
        double minLat = TileYToLat(Y + 1, Z);
        double maxLat = TileYToLat(Y, Z);
        return new Envelope(minLon, maxLon, minLat, maxLat);
    }

    private static double TileYToLat(int y, int z)
    {
        double n = Math.PI - 2.0 * Math.PI * y / Math.Pow(2, z);
        return 180.0 / Math.PI * Math.Atan(0.5 * (Math.Exp(n) - Math.Exp(-n)));
    }
}
