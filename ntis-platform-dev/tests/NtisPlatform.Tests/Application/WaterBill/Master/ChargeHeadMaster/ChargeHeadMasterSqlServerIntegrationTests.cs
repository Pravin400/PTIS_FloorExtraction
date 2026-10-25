using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Tests.Application.Services.Asset_Management;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master.ChargeHeadMaster;

public class ChargeHeadMasterSqlServerIntegrationTests
{
    private static readonly string ConnectionString =
        SqlServerFactAttribute.ConnectionString
        ?? "Server=(localdb)\\MSSQLLocalDB;Database=WTIS;Integrated Security=True;TrustServerCertificate=True;";

    [SqlServerFact]
    public async Task InsertChargeHeadMaster_ToRealDatabase_SucceedsWithoutIsTaxIsPenaltyError()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString, x => x.UseNetTopologySuite())
            .Options;

        using var context = new ApplicationDbContext(options);

        if (!await context.Database.CanConnectAsync())
        {
            return;
        }

        var testCode = "TEST_CHG_" + Guid.NewGuid().ToString("N")[..8];
        var entity = new ChargeHeadMasterEntity
        {
            Code = testCode,
            Name = "Integration Test Charge Head",
            ChargeHeadNameLocal = "चाचणी शुल्क",
            ChargeType = "Fee",
            IsRefundable = false,
            SequenceNo = 999,
            Description = "Inserted via integration test",
            IsRegularPay = true,
            IsActive = true,
            CreatedDate = DateTime.Now
        };

        context.ChargeHeadMaster.Add(entity);
        await context.SaveChangesAsync();

        Assert.True(entity.Id > 0);

        var retrieved = await context.ChargeHeadMaster.AsNoTracking().FirstOrDefaultAsync(x => x.Id == entity.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(testCode, retrieved.Code);
        Assert.Equal("Integration Test Charge Head", retrieved.Name);
        Assert.Equal("Fee", retrieved.ChargeType);

        // Cleanup test record
        context.Entry(entity).State = EntityState.Deleted;
        await context.SaveChangesAsync();
    }
}
