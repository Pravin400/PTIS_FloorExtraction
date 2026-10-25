using Microsoft.EntityFrameworkCore;

namespace NtisPlatform.Infrastructure.Data;

/// <summary>
/// Read-only context for report DATA queries (the heavy provider reads / paginated data pulls).
///
/// Inherits the full entity model from <see cref="ApplicationDbContext"/> but is configured with
/// the read-only connection (replica / read-only login) so reporting load stays off the main
/// transactional database. Treat as strictly read-only — never call SaveChanges on it.
/// </summary>
public class ReportDataDbContext : ApplicationDbContext
{
    public ReportDataDbContext(DbContextOptions<ReportDataDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<NtisPlatform.Core.Entities.GIS.GisAssetGeometryEntity>().Ignore(e => e.PolygonGeometry);
    }
}

