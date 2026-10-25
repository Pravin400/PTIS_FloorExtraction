using Microsoft.Data.SqlClient;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Infrastructure.Services;
using NtisPlatform.Tests.Application.Services.Asset_Management;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.Services;

/// <summary>
/// The cross-process retrospective calculation lock against a real SQL Server (the <see cref="SqlServerFactAttribute"/>
/// tests are skipped unless NTIS_TEST_SQLSERVER is set; the tests of the lock's connection string always run).
/// Each <see cref="SqlServerRetrospectiveCalculationLock"/> opens connections of its own, so two of them stand in for
/// two API processes talking to the same database. Every test uses its own property id: the lock is shared server state.
/// </summary>
public class SqlServerRetrospectiveCalculationLockTests
{
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(15);

    private static SqlServerRetrospectiveCalculationLock NewProcess(TimeSpan? timeout = null) =>
        new(SqlServerFactAttribute.ConnectionString!, timeout);

    private static int UniquePropertyId() => 1_000_000_000 + Random.Shared.Next(0, 900_000_000);

    [SqlServerFact]
    public async Task AnotherProcessAskingForTheSameProperty_WaitsUntilTheLockIsReleased()
    {
        var propertyId = UniquePropertyId();
        await using var held = await NewProcess().AcquireAsync(propertyId);

        var waiting = NewProcess().AcquireAsync(propertyId);
        await Task.Delay(500);
        Assert.False(waiting.IsCompleted);

        await held.DisposeAsync();
        await using var granted = await waiting.WaitAsync(Patience);
    }

    [SqlServerFact]
    public async Task DifferentProperties_NeverWaitForEachOther()
    {
        var firstProperty = UniquePropertyId();
        var secondProperty = firstProperty + 256; // ids that differ by a power of two: a lock keyed by a hash of the id could share one
        await using var held = await NewProcess().AcquireAsync(firstProperty);

        await using var other = await NewProcess().AcquireAsync(secondProperty).WaitAsync(Patience);
    }

    [SqlServerFact]
    public async Task TheLockIsFreeAgainAfterTheHandleIsDisposed_EvenWhenTheRunInsideItFailed()
    {
        var propertyId = UniquePropertyId();
        try
        {
            await using var held = await NewProcess().AcquireAsync(propertyId);
            throw new InvalidOperationException("the calculation failed");
        }
        catch (InvalidOperationException)
        {
            // expected: the handle was disposed on the way out
        }

        await using var again = await NewProcess().AcquireAsync(propertyId).WaitAsync(Patience);
    }

    [SqlServerFact]
    public async Task WhenTheLockStaysHeld_TheWaiterGivesUpWithAClearMessageAndLeavesNothingBehind()
    {
        var propertyId = UniquePropertyId();
        await using var held = await NewProcess().AcquireAsync(propertyId);

        var impatient = NewProcess(TimeSpan.FromMilliseconds(700));
        // a dedicated type, so a caller that recalculates under the lock can tell "try again later" from its own failures
        var failure = await Assert.ThrowsAsync<RetrospectiveCalculationInProgressException>(() => impatient.AcquireAsync(propertyId));
        Assert.Equal(propertyId, failure.PropertyId);
        Assert.Contains(propertyId.ToString(), failure.Message);

        // the failed attempt must not have taken or kept anything: once the holder lets go the property is free
        await held.DisposeAsync();
        await using var granted = await NewProcess().AcquireAsync(propertyId).WaitAsync(Patience);
    }

    [SqlServerFact]
    public async Task ACancelledWaiterLeavesNothingBehind()
    {
        var propertyId = UniquePropertyId();
        await using var held = await NewProcess().AcquireAsync(propertyId);

        using var cancellation = new CancellationTokenSource();
        var waiting = NewProcess().AcquireAsync(propertyId, cancellation.Token);
        await Task.Delay(500);
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<Exception>(() => waiting); // the exact type is the driver's (cancelled / SqlException)

        await held.DisposeAsync();
        await using var granted = await NewProcess().AcquireAsync(propertyId).WaitAsync(Patience);
    }

    [SqlServerFact]
    public async Task DisposingTheHandleTwiceIsHarmless()
    {
        var propertyId = UniquePropertyId();
        var held = await NewProcess().AcquireAsync(propertyId);

        await held.DisposeAsync();
        await held.DisposeAsync();

        await using var again = await NewProcess().AcquireAsync(propertyId).WaitAsync(Patience);
    }

    [SqlServerFact]
    public async Task TheLockConnections_NeverUseUpThePoolTheCalculationsOwnConnectionsComeFrom()
    {
        // The plain connection string is what EF connects with. Its pool holds two connections here, and its own
        // pool is private to this test (the Application Name), so no other test is affected by the small size.
        var builder = new SqlConnectionStringBuilder(SqlServerFactAttribute.ConnectionString!)
        {
            MaxPoolSize = 2,
            ConnectTimeout = 3,
            ApplicationName = $"NTIS.PoolTest.{Guid.NewGuid():N}",
        };
        var efConnectionString = builder.ConnectionString;
        var calculationLock = new SqlServerRetrospectiveCalculationLock(efConnectionString);

        var propertyId = UniquePropertyId();
        await using var first = await calculationLock.AcquireAsync(propertyId);
        await using var second = await calculationLock.AcquireAsync(propertyId + 1);

        // Two calculations are running, each holding a lock connection. The connection each of them needs to read and
        // save must still be there: with one shared pool of two it would wait for the pool's timeout and fail.
        await using var efConnection = new SqlConnection(efConnectionString);
        await efConnection.OpenAsync().WaitAsync(Patience);
        await using var command = efConnection.CreateCommand();
        command.CommandText = "SELECT 1";
        Assert.Equal(1, await command.ExecuteScalarAsync());
    }

    [Fact]
    public void TheLockConnectsThroughAPoolOfItsOwn_WithEverythingElseKept()
    {
        const string efConnectionString = "Server=db.example;Database=NTIS;Integrated Security=true;TrustServerCertificate=true;Max Pool Size=7;Application Name=NTIS API";

        var ef = new SqlConnectionStringBuilder(efConnectionString);
        var own = new SqlConnectionStringBuilder(SqlServerRetrospectiveCalculationLock.WithOwnPool(efConnectionString));

        // a pool is keyed by the whole connection string, so a different name is a different pool
        Assert.NotEqual(ef.ConnectionString, own.ConnectionString);
        Assert.NotEqual(ef.ApplicationName, own.ApplicationName);
        Assert.StartsWith(ef.ApplicationName, own.ApplicationName); // still recognisable as this application's session
        Assert.Equal(ef.DataSource, own.DataSource);
        Assert.Equal(ef.InitialCatalog, own.InitialCatalog);
        Assert.Equal(ef.IntegratedSecurity, own.IntegratedSecurity);
        Assert.Equal(ef.TrustServerCertificate, own.TrustServerCertificate);
        Assert.Equal(ef.MaxPoolSize, own.MaxPoolSize);
    }

    [Fact]
    public void WithoutAnApplicationName_TheLockStillGetsAPoolOfItsOwn()
    {
        const string efConnectionString = "Server=db.example;Database=NTIS;Integrated Security=true";

        var ef = new SqlConnectionStringBuilder(efConnectionString);
        var own = new SqlConnectionStringBuilder(SqlServerRetrospectiveCalculationLock.WithOwnPool(efConnectionString));

        Assert.NotEqual(ef.ApplicationName, own.ApplicationName);
        Assert.NotEqual(ef.ConnectionString, own.ConnectionString);
    }

    [Fact]
    public void AVeryLongApplicationName_IsShortenedToWhatSqlServerAccepts()
    {
        var efConnectionString = $"Server=db.example;Database=NTIS;Integrated Security=true;Application Name={new string('A', 128)}";

        var lockConnectionString = SqlServerRetrospectiveCalculationLock.WithOwnPool(efConnectionString);

        var own = new SqlConnectionStringBuilder(lockConnectionString);
        Assert.Equal(128, own.ApplicationName.Length);
        Assert.EndsWith(".RetroLock", own.ApplicationName);
        using var connection = new SqlConnection(lockConnectionString); // the driver rejects an Application Name over 128 characters
    }
    public static IEnumerable<object[]> TimeoutsThatAreNotARealFiniteWait() => new[]
    {
        new object[] { TimeSpan.FromTicks(1) },                       // below a millisecond: the int cast would send 0 = "do not wait"
        new object[] { TimeSpan.FromTicks(TimeSpan.TicksPerMillisecond - 1) },
        new object[] { TimeSpan.Zero },                               // "do not wait": every contended calculation would fail at once
        new object[] { TimeSpan.FromMilliseconds(-1) },               // sp_getapplock reads -1 as "wait for ever"
        new object[] { Timeout.InfiniteTimeSpan },                    // the same value, spelled the .NET way
        new object[] { TimeSpan.FromSeconds(-5) },                    // not a wait at all
        new object[] { TimeSpan.FromMilliseconds(int.MaxValue + 1L) },// does not fit sp_getapplock's int of milliseconds
        new object[] { TimeSpan.MaxValue },                           // would overflow the cast to int
    };

    public static IEnumerable<object[]> TimeoutsThatAreARealFiniteWait() => new[]
    {
        new object[] { TimeSpan.FromMilliseconds(1) },
        new object[] { TimeSpan.FromSeconds(30) },
        new object[] { SqlServerRetrospectiveCalculationLock.DefaultTimeout },
        new object[] { SqlServerRetrospectiveCalculationLock.MaxTimeout },     // the largest wait sp_getapplock accepts
    };

    [Theory]
    [MemberData(nameof(TimeoutsThatAreNotARealFiniteWait))]
    public void ATimeoutThatIsNotARealFiniteWait_IsRefusedWhenTheLockIsBuilt_NotAtTheFirstContendedCalculation(TimeSpan timeout)
    {
        var failure = Assert.Throws<ArgumentOutOfRangeException>(
            () => new SqlServerRetrospectiveCalculationLock("Server=db.example;Database=NTIS;Integrated Security=true", timeout));

        Assert.Equal("timeout", failure.ParamName);
    }

    [Theory]
    [MemberData(nameof(TimeoutsThatAreARealFiniteWait))]
    public void ARealFiniteTimeout_IsAccepted(TimeSpan timeout)
    {
        var calculationLock = new SqlServerRetrospectiveCalculationLock("Server=db.example;Database=NTIS;Integrated Security=true", timeout);

        Assert.NotNull(calculationLock);
    }

    [Fact]
    public void WithoutATimeout_TheDefaultIsUsed_AndItIsAValidOne()
    {
        // the default (two minutes) must itself pass the validation that every other timeout has to pass
        var calculationLock = new SqlServerRetrospectiveCalculationLock("Server=db.example;Database=NTIS;Integrated Security=true");

        Assert.NotNull(calculationLock);
        Assert.Equal(SqlServerRetrospectiveCalculationLock.DefaultTimeout, SqlServerRetrospectiveCalculationLock.ValidateTimeout(SqlServerRetrospectiveCalculationLock.DefaultTimeout));
    }
}
