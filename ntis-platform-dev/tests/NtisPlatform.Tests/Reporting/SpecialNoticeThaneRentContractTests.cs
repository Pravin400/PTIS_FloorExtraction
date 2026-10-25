using System.Reflection;
using System.Text.Json;
using MockQueryable;
using Microsoft.EntityFrameworkCore;
using Moq;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Tests.Reporting;

public class SpecialNoticeThaneRentContractTests
{
    [Fact]
    public void RentQueryUsesRenamedColumnsAndResolvesConstructionCodeThroughId()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=model-only;Database=model-only;Integrated Security=true;TrustServerCertificate=true",
                sql => sql.UseNetTopologySuite()).Options;
        using var context = new ApplicationDbContext(options);
        var sql = context.Set<OldWardWiseRateEntity>()
            .Select(r => new
            {
                Code = r.ConstructionType != null ? r.ConstructionType.ConstructionCode : null,
                r.Residential, r.NonResidential
            }).ToQueryString();
        Assert.Contains("[ConstructionID]", sql);
        Assert.Contains("[ConstructionCode]", sql);
        Assert.Contains("[Residential]", sql);
        Assert.Contains("[Commercial]", sql);
        Assert.DoesNotMatch(@"\]\.\[Resi\]", sql);
        Assert.DoesNotMatch(@"\]\.\[NonResi\]", sql);
    }

    [Theory]
    [InlineData(0, null, null)]
    [InlineData(1, "2.65", "8.75")]
    [InlineData(2, "126/A: 2.65; 126/C: 1.60", "126/A: 8.75; 126/C: 5.25")]
    [InlineData(3, "0.00", "0.00")]
    public async Task SchemaAndActualJsonUseTextForSingleMultipleAndZeroRates(int scenario, string? residential, string? commercial)
    {
        var ward = new OldWardMasterEntity { Id = 1, OldWardNo = "126", IsActive = true };
        var rows = new Dictionary<Type, object[]>
        {
            [typeof(PropertyEntity)] = [new PropertyEntity { Id = 104, IsActive = true, Type = "C", PropertyMastOldId = 10 }],
            [typeof(PropertyMastOldEntity)] = [new PropertyMastOldEntity { Id = 10, IsActive = true, OldWardNo = "126" }],
            [typeof(PropertyDetailsEntity)] = (scenario == 2 ? new[] { "A", "C" } : ["A"])
                .Select((code, index) => (object)new PropertyDetailsEntity
                {
                    Id = index + 1, PropertyId = 104, IsActive = true,
                    ConstructionType = new ConstructionTypeEntity { IsActive = true, ConstructionCode = code }
                }).ToArray(),
            [typeof(OldWardWiseRateEntity)] = scenario == 0 ? [] :
            [
                new OldWardWiseRateEntity { OldWard = ward, ConstructionType = new ConstructionTypeEntity { ConstructionCode = "A" }, Residential = scenario == 3 ? "0" : "2.65", NonResidential = scenario == 3 ? "0" : "8.75" },
                new OldWardWiseRateEntity { OldWard = ward, ConstructionType = new ConstructionTypeEntity { ConstructionCode = "C" }, Residential = "1.60", NonResidential = "5.25" }
            ]
        };
        var policy = new Mock<IPolicyConfigurationService>();
        policy.Setup(p => p.GetPolicyValuesAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, string>());
        var constructor = typeof(SpecialNoticeThaneDataProvider).GetConstructors().Single();
        var provider = (SpecialNoticeThaneDataProvider)constructor.Invoke(constructor.GetParameters().Select(p =>
        {
            if (p.ParameterType.IsGenericType && p.ParameterType.GetGenericTypeDefinition() == typeof(IReportDataRepository<>))
            {
                var entity = p.ParameterType.GetGenericArguments()[0];
                return typeof(SpecialNoticeThaneRentContractTests).GetMethod(nameof(Repository), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entity).Invoke(null, [rows.GetValueOrDefault(entity) ?? []]);
            }
            if (p.ParameterType == typeof(IPolicyConfigurationService)) return policy.Object;
            if (p.ParameterType == typeof(IUlbConfigService)) return Mock.Of<IUlbConfigService>();
            if (p.ParameterType == typeof(IDocumentApplicationService)) return Mock.Of<IDocumentApplicationService>();
            if (p.ParameterType == typeof(IHttpClientFactory)) return Mock.Of<IHttpClientFactory>();
            return null;
        }).ToArray());

        using var result = JsonSerializer.SerializeToDocument(await provider.GetDataAsync(new() { ["propertyId"] = "104" }));
        var record = result.RootElement[0];
        foreach (var (field, expected) in new[] { ("RRate", residential), ("CRate", commercial) })
        {
            Assert.Equal("string", Assert.Single(provider.GetSchemaFields(), f => f.Path == field).ValueType);
            Assert.Equal(expected is null ? JsonValueKind.Null : JsonValueKind.String, record.GetProperty(field).ValueKind);
            Assert.Equal(expected, record.GetProperty(field).GetString());
        }

        // Existing stored templates with numeric display formats continue to render both cases.
        const string template = """
            {"page":{"widthMm":210,"heightMm":297},"elements":[
              {"type":"field","path":"RRate","format":"number","x":0,"y":0,"w":90,"h":5},
              {"type":"field","path":"CRate","format":"number","x":0,"y":6,"w":90,"h":5}]}
            """;
        var html = new HtmlTemplateRenderer().Render(template, record);
        if (residential is not null) Assert.Contains(residential, html);
        if (commercial is not null) Assert.Contains(commercial, html);
    }

    private static object Repository<T>(object[] rows) where T : class
    {
        var mock = new Mock<IReportDataRepository<T>>();
        mock.Setup(r => r.GetQueryable()).Returns(rows.Cast<T>().ToArray().BuildMock());
        return mock.Object;
    }
}
