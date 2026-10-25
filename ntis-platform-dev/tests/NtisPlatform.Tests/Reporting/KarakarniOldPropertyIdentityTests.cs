using System.Reflection;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class KarakarniOldPropertyIdentityTests
{
    [Fact]
    public async Task CurrentMappingsOverrideDirectLinkAndAggregateDistinctTrimmedNumbers()
    {
        var provider = Provider([
            Old(10, " 126 ", " 12 ", "2"), Old(11, "125", "10", "1"),
            Old(12, "126", "12", "2"), Old(99, "DIRECT", "DIRECT", "DIRECT")
        ], [Map(10), Map(11), Map(12)]);

        var rows = await provider.LoadOldPropertyIdentitiesAsync(new Dictionary<int, int?> { [1] = 99 }, default);
        Assert.Equal(new("125, 126", "10, 12", "1, 2"), rows[1]);
    }

    [Fact]
    public async Task InvalidMappingsAndOldRecordsAreIgnoredBeforeDirectLinkFallback()
    {
        var inactive = Map(10); inactive.IsActive = false;
        var historical = Map(10); historical.IsCurrent = false;
        var cancelled = Map(10); cancelled.Status = "CANCELLED";
        var deletedOld = Old(11, "BAD", "BAD", "BAD"); deletedOld.MarkedForDeletion = true;
        var inactiveOld = Old(12, "BAD", "BAD", "BAD"); inactiveOld.IsActive = false;
        var provider = Provider([
            Old(10, "BAD", "BAD", "BAD"), deletedOld, inactiveOld, Old(99, " 126 ", " 12 ", " 2 ")
        ], [inactive, historical, cancelled, Map(11), Map(12), Map(404)]);

        var rows = await provider.LoadOldPropertyIdentitiesAsync(new Dictionary<int, int?> { [1] = 99 }, default);
        Assert.Equal(new("126", "12", "2"), rows[1]);
    }

    [Fact]
    public async Task MissingOrInactiveDirectLinksLeaveIdentityEmptyAndDoNotBorrowAnotherPropertysMapping()
    {
        var inactive = Old(99, "BAD", "BAD", "BAD"); inactive.IsActive = false;
        var provider = Provider([Old(10, "126", "12", "2"), inactive], [Map(10)]);
        var rows = await provider.LoadOldPropertyIdentitiesAsync(
            new Dictionary<int, int?> { [1] = null, [2] = 99, [3] = null }, default);
        Assert.Equal(new("126", "12", "2"), rows[1]);
        Assert.Equal(new("", "", ""), rows[2]);
        Assert.Equal(new("", "", ""), rows[3]);
    }

    [Theory]
    [InlineData(" OWNER ", "Regional", "OWNER")]
    [InlineData(null, " Regional ", "Regional")]
    [InlineData(" ", "Regional", "Regional")]
    [InlineData(" - ", "Regional", "Regional")]
    [InlineData(null, "-", "-")]
    public async Task MainRowUsesPropertyOwnerAndMappedIdentityWhilePreservingOtherFields(
        string? english, string? regional, string expectedBuilder)
    {
        var property = new PropertyEntity
        {
            Id = 1, IsActive = true, PropertyNo = "NEW-12", PropertyMastOldId = 99,
            OwnerNameEnglish = english, OwnerName = regional, Address = "UNCHANGED ADDRESS",
            OccupierNameEnglish = "PROPERTY OCCUPIER", OccupierName = "REGIONAL OCCUPIER"
        };
        var society = new SocietyDetailsEntity
        {
            Id = 1, PropertyId = 1, IsActive = true, BuilderNameEnglish = "UNRELATED BUILDER",
            LandOwnerNameEnglish = "LAND OWNER"
        };
        var direct = Old(99, "OLD", "DIRECT", "9"); direct.OldRV = 250;
        var provider = Provider([Old(10, "126", "12", "2"), direct], [Map(10)], property, society);
        var method = typeof(KarakarniDataProvider).GetMethod("BuildMainRowsAsync", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var rows = await (Task<List<object>>)method.Invoke(provider, [new List<int> { 1 }, 0, 0, "", CancellationToken.None])!;
        var row = Assert.IsType<Dictionary<string, object?>>(Assert.Single(rows));
        Assert.Equal("126", row["oldWardNo"]);
        Assert.Equal("12", row["oldPropertyNo"]);
        Assert.Equal("2", row["oldPartitionNo"]);
        Assert.Equal(expectedBuilder, row["builderName"]);
        Assert.Equal("PROPERTY OCCUPIER", row["occupierNameEnglish"]);
        Assert.Equal("REGIONAL OCCUPIER", row["occupierName"]);
        Assert.Equal("LAND OWNER", row["landOwnerName"]);
        Assert.Equal("NEW-12", row["propertyNo"]);
        Assert.Equal("UNCHANGED ADDRESS", row["address"]);
        Assert.Equal("OLD-DIRECT-9", row["oldBuildingNo"]);
        Assert.Equal(250m, row["oldRV"]);
    }

    private static PropertyMastOldEntity Old(int id, string ward, string number, string partition) =>
        new() { Id = id, IsActive = true, OldWardNo = ward, OldPropertyNo = number, OldPartitionNo = partition };

    private static PropertyMapDetailEntity Map(int oldId) =>
        new() { PropertyIdNew = 1, PropertyIdOld = oldId, IsActive = true, IsCurrent = true, Status = "ACTIVE" };

    private static KarakarniDataProvider Provider(PropertyMastOldEntity[] oldProperties,
        PropertyMapDetailEntity[] mappings, PropertyEntity? property = null, SocietyDetailsEntity? society = null)
    {
        var constructor = typeof(KarakarniDataProvider).GetConstructors().Single();
        return (KarakarniDataProvider)constructor.Invoke(constructor.GetParameters().Select(p =>
        {
            if (p.ParameterType.IsGenericType && p.ParameterType.GetGenericTypeDefinition() == typeof(IReportDataRepository<>))
            {
                var entity = p.ParameterType.GetGenericArguments()[0];
                object[] rows = entity == typeof(PropertyMastOldEntity) ? oldProperties
                    : entity == typeof(PropertyMapDetailEntity) ? mappings
                    : entity == typeof(PropertyEntity) && property is not null ? [property]
                    : entity == typeof(SocietyDetailsEntity) && society is not null ? [society] : [];
                return typeof(KarakarniOldPropertyIdentityTests).GetMethod(nameof(Repository), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entity).Invoke(null, [rows]);
            }
            if (p.ParameterType == typeof(IUlbConfigService)) return Mock.Of<IUlbConfigService>();
            if (p.ParameterType == typeof(IDocumentApplicationService)) return Mock.Of<IDocumentApplicationService>();
            if (p.Name == "logger") return NullLogger<KarakarniDataProvider>.Instance;
            return null;
        }).ToArray());
    }

    private static object Repository<T>(object[] rows) where T : class
    {
        var mock = new Mock<IReportDataRepository<T>>();
        mock.Setup(r => r.GetQueryable()).Returns(rows.Cast<T>().ToArray().BuildMock());
        return mock.Object;
    }
}
