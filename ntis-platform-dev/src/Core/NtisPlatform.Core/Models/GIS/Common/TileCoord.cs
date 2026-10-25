namespace NtisPlatform.Core.Models.GIS;

public class TileCoord
{
    public int X { get; set; }
    public int Y { get; set; }
    public int Z { get; set; }

    public TileCoord() { }

    public TileCoord(int z, int x, int y)
    {
        Z = z;
        X = x;
        Y = y;
    }
}
