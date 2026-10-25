using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Options;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Reporting;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Reporting.Html;

namespace NtisPlatform.Tests.Reporting;

public sealed class HtmlReportServiceDraftTests
{
    private const string OriginalJson =
        """{"schemaVersion":3,"page":{"size":"A4","orientation":"portrait","widthMm":210,"heightMm":297},"elements":[],"bands":[]}""";
    private const string UpdatedJson =
        """{"schemaVersion":3,"page":{"size":"A4","orientation":"portrait","widthMm":210,"heightMm":297},"elements":[{"id":"title","type":"text","x":1,"y":1,"w":40,"h":8,"text":"Transfer"}],"bands":[]}""";

    [Theory]
    [InlineData("name")]
    [InlineData("path")]
    public async Task Designer_repairs_the_saved_logo_label_without_modifying_stored_template_versions(string key)
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var template = JsonNode.Parse(OriginalJson)!.AsObject();
        template["fieldCatalog"] = new JsonArray(
            new JsonObject { [key] = "ulbLogo", ["label"] = "\u00e0\u00a4\u00ae", ["elementType"] = "image" },
            new JsonObject { [key] = "ownerName", ["label"] = "Custom owner label", ["elementType"] = "field" });
        var storedJson = template.ToJsonString();
        var version = await db.HtmlReportTemplateVersions.SingleAsync();
        version.TemplateJson = storedJson;
        version.ContentHash = SHA256.HashData(Encoding.UTF8.GetBytes(storedJson));
        await db.SaveChangesAsync();
        var service = CreateService(db);

        foreach (var detail in new[] { await service.GetTemplateAsync(10), await service.GetCurrentTemplateAsync(10) })
        {
            Assert.NotNull(detail);
            using var returned = JsonDocument.Parse(Assert.Single(detail.Versions).TemplateJson);
            var fields = returned.RootElement.GetProperty("fieldCatalog");
            Assert.Equal("ULB Logo", fields[0].GetProperty("label").GetString());
            Assert.Equal("image", fields[0].GetProperty("elementType").GetString());
            Assert.Equal("ULB", fields[0].GetProperty("group").GetString());
            Assert.Equal("Custom owner label", fields[1].GetProperty("label").GetString());
        }
        Assert.Equal(storedJson, await db.HtmlReportTemplateVersions.Select(value => value.TemplateJson).SingleAsync());
    }

    [Fact]
    public async Task Saving_a_branded_report_removes_static_images_and_is_idempotent()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        const string json = """
        {"schemaVersion":3,"reportCode":"SPECIAL_NOTICE_THANE",
         "page":{"size":"A4","orientation":"portrait","widthMm":210,"heightMm":297},
         "elements":[{"id":"old-logo","type":"image","src":"data:image/png;base64,T0xE",
                      "x":10,"y":10,"w":22,"h":22}],"bands":[]}
        """;
        var service = CreateService(db);

        await service.SaveDraftAsync(10, new(json));
        await service.SaveDraftAsync(10, new(json));

        var stored = await db.HtmlReportTemplateVersions.SingleAsync();
        Assert.Equal(1, db.ServiceSaveAttempts);
        Assert.DoesNotContain("data:image/", stored.TemplateJson);
        Assert.Equal(SHA256.HashData(Encoding.UTF8.GetBytes(stored.TemplateJson)), stored.ContentHash);
        using var template = JsonDocument.Parse(stored.TemplateJson);
        var elements = template.RootElement.GetProperty("elements");
        Assert.Equal(2, elements.GetArrayLength());
        Assert.All(elements.EnumerateArray(), element => Assert.Equal("ulbLogo", element.GetProperty("path").GetString()));
        Assert.Single(elements.EnumerateArray(), element => element.GetProperty("type").GetString() == "watermark");
    }

    [Fact]
    public async Task SaveDraftAsync_retries_after_an_optimistic_concurrency_conflict()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var service = CreateService(db);
        db.ThrowConcurrencyOnNextSave = true;

        var result = await service.SaveDraftAsync(10, new(UpdatedJson));

        Assert.Equal(20, result.VersionId);
        Assert.Equal(2, db.ServiceSaveAttempts);
        Assert.Equal(UpdatedJson, await db.HtmlReportTemplateVersions
            .Where(x => x.Id == 20).Select(x => x.TemplateJson).SingleAsync());
    }

    [Fact]
    public async Task SaveDraftAsync_treats_identical_content_as_an_idempotent_save()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var originalUpdatedDate = await db.HtmlReportTemplates
            .Where(x => x.Id == 10).Select(x => x.UpdatedDate).SingleAsync();
        var service = CreateService(db);

        var result = await service.SaveDraftAsync(10, new(OriginalJson));

        Assert.Equal(20, result.VersionId);
        Assert.Equal(0, db.ServiceSaveAttempts);
        Assert.Equal(originalUpdatedDate, await db.HtmlReportTemplates
            .Where(x => x.Id == 10).Select(x => x.UpdatedDate).SingleAsync());
    }

    [Fact]
    public async Task GetTemplatesAsync_excludes_inactive_definitions_and_templates()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        db.ReportDefinitions.AddRange(
            Definition(6, "RETIRED_DEFINITION", isActive: false),
            Definition(7, "RETIRED_TEMPLATE", isActive: true));
        db.HtmlReportTemplates.AddRange(
            Template(11, 6, "RETIRED_DEFINITION", isActive: true),
            Template(12, 7, "RETIRED_TEMPLATE", isActive: false));
        await db.SaveChangesAsync();
        var service = CreateService(db);

        var templates = await service.GetTemplatesAsync();

        var template = Assert.Single(templates);
        Assert.Equal(10, template.Id);
        Assert.Equal("TRANSFER_CERTIFICATE", template.ReportCode);
    }

    [Fact]
    public async Task GetCurrentTemplateAsync_returns_only_the_editable_versions()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        db.HtmlReportTemplateVersions.Add(new HtmlReportTemplateVersionEntity
        {
            Id = 21,
            TemplateId = 10,
            VersionNo = 2,
            SchemaVersion = 3,
            Status = "Archived",
            TemplateJson = UpdatedJson,
            ContentHash = SHA256.HashData(Encoding.UTF8.GetBytes(UpdatedJson)),
            CreatedBy = 7,
            CreatedDate = DateTime.UtcNow.AddDays(-1),
            RowVersion = [3]
        });
        await db.SaveChangesAsync();
        var service = CreateService(db);

        var current = await service.GetCurrentTemplateAsync(10);
        var history = await service.GetTemplateAsync(10);

        Assert.NotNull(current);
        Assert.Single(current.Versions);
        Assert.Equal("Draft", current.Versions[0].Status);
        Assert.NotNull(history);
        Assert.Equal(2, history.Versions.Count);
    }

    [Fact]
    public async Task GetTemplatesAsync_returns_execution_provider_and_delete_permission()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var service = CreateService(db);

        var template = Assert.Single(await service.GetTemplatesAsync());

        Assert.Equal("TransferCertificateDataProvider", template.DataProviderCode);
        Assert.Equal("TRANSFER_CERTIFICATE", template.DataSourceCode);
        Assert.True(template.CanDelete);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Built_in_reports_cannot_be_archived_even_by_admins(bool isAdmin)
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var definition = await db.ReportDefinitions.SingleAsync(x => x.Id == 5);
        definition.IsBuiltIn = true;
        await db.SaveChangesAsync();
        var service = CreateService(db, isAdmin);

        Assert.False(Assert.Single(await service.GetTemplatesAsync()).CanDelete);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.ArchiveTemplateAsync(10));
        Assert.True(definition.IsActive);
        Assert.True(await db.HtmlReportTemplates.Where(x => x.Id == 10).Select(x => x.IsActive).SingleAsync());
    }

    [Fact]
    public async Task Catalogue_orders_by_database_sort_order_and_hides_other_tenants()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var first = Definition(6, "Z_FIRST", true);
        first.SortOrder = -1;
        var otherTenant = Definition(7, "OTHER_TENANT", true);
        otherTenant.TenantId = 2;
        db.ReportDefinitions.AddRange(first, otherTenant);
        db.HtmlReportTemplates.AddRange(Template(11, 6, "Z_FIRST", true), Template(12, 7, "OTHER_TENANT", true));
        await db.SaveChangesAsync();

        var templates = await CreateService(db).GetTemplatesAsync();

        Assert.Equal(new[] { "Z_FIRST", "TRANSFER_CERTIFICATE" }, templates.Select(x => x.ReportCode));
    }

    [Fact]
    public async Task ArchiveTemplateAsync_hides_a_tenant_owned_custom_report()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var service = CreateService(db);

        await service.ArchiveTemplateAsync(10);

        Assert.False(await db.HtmlReportTemplates.Where(x => x.Id == 10).Select(x => x.IsActive).SingleAsync());
        Assert.False(await db.ReportDefinitions.Where(x => x.Id == 5).Select(x => x.IsActive).SingleAsync());
        Assert.Empty(await service.GetTemplatesAsync());
    }

    [Fact]
    public async Task CreateTemplateAsync_reactivates_an_archived_report_code_with_a_new_draft()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var service = CreateService(db);
        await service.ArchiveTemplateAsync(10);

        var result = await service.CreateTemplateAsync(new CreateHtmlTemplateRequest(
            "TRANSFER_CERTIFICATE",
            "Redesigned Transfer Certificate",
            "Approval",
            "TRANSFER_CERTIFICATE",
            UpdatedJson,
            DataProviderCode: "TransferCertificateDataProvider"));

        Assert.Equal(10, result.Id);
        Assert.True(result.IsActive);
        Assert.Equal("Redesigned Transfer Certificate", result.ReportName);
        var latest = Assert.Single(result.Versions, x => x.VersionNo == 4);
        Assert.Equal("Draft", latest.Status);
        Assert.Equal(UpdatedJson, latest.TemplateJson);
        Assert.Equal(2, await db.HtmlReportTemplateVersions.CountAsync(x => x.TemplateId == 10));
    }

    [Fact]
    public async Task ArchiveTemplateAsync_does_not_archive_a_global_report()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var template = await db.HtmlReportTemplates.SingleAsync(x => x.Id == 10);
        var definition = await db.ReportDefinitions.SingleAsync(x => x.Id == 5);
        template.OrganizationId = null;
        definition.TenantId = null;
        await db.SaveChangesAsync();
        var service = CreateService(db);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.ArchiveTemplateAsync(10));

        Assert.True(template.IsActive);
        Assert.True(definition.IsActive);
    }

    private static FaultingReportingDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ReportingDbContext>()
            .UseInMemoryDatabase($"html-draft-{Guid.NewGuid():N}")
            .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new FaultingReportingDbContext(options);
    }

    private static async Task SeedAsync(FaultingReportingDbContext db)
    {
        db.ReportDefinitions.Add(new ReportDefinitionEntity
        {
            Id = 5,
            ReportCode = "TRANSFER_CERTIFICATE",
            ReportName = "Transfer Certificate",
            TenantId = 1,
            TemplateFile = "transfer.html",
            DataProviderCode = "TransferCertificateDataProvider",
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        });
        db.HtmlReportTemplates.Add(new HtmlReportTemplateEntity
        {
            Id = 10,
            ReportDefinitionId = 5,
            OrganizationId = 1,
            TemplateCode = "TRANSFER_CERTIFICATE",
            TemplateName = "Transfer Certificate",
            DataSourceCode = "TRANSFER_CERTIFICATE",
            CreatedBy = 7,
            CreatedDate = DateTime.UtcNow,
            UpdatedDate = new DateTime(2026, 9, 21, 7, 42, 56, DateTimeKind.Utc),
            RowVersion = [1]
        });
        db.HtmlReportTemplateVersions.Add(new HtmlReportTemplateVersionEntity
        {
            Id = 20,
            TemplateId = 10,
            VersionNo = 3,
            SchemaVersion = 3,
            Status = "Draft",
            TemplateJson = OriginalJson,
            ContentHash = SHA256.HashData(Encoding.UTF8.GetBytes(OriginalJson)),
            ValidationJson = "{}",
            CreatedBy = 7,
            CreatedDate = DateTime.UtcNow,
            RowVersion = [2]
        });
        await db.SaveChangesAsync();
        db.ServiceSaveAttempts = 0;
    }

    private static ReportDefinitionEntity Definition(int id, string code, bool isActive) => new()
    {
        Id = id,
        ReportCode = code,
        ReportName = code,
        TenantId = 1,
        TemplateFile = $"{code}.html",
        DataProviderCode = "UnassignedReportDataProvider",
        IsActive = isActive,
        CreatedDate = DateTime.UtcNow
    };

    private static HtmlReportTemplateEntity Template(long id, int definitionId, string code, bool isActive) => new()
    {
        Id = id,
        ReportDefinitionId = definitionId,
        OrganizationId = 1,
        TemplateCode = code,
        TemplateName = code,
        DataSourceCode = "UNASSIGNED",
        IsActive = isActive,
        CreatedBy = 7,
        CreatedDate = DateTime.UtcNow,
        RowVersion = [(byte)id]
    };

    [Fact]
    public async Task ProcessQueuedJobAsync_renders_and_completes_queued_job()
    {
        await using var db = CreateContext();
        await SeedAsync(db);
        var def = Definition(10, "T1", true);
        var tpl = Template(20, 10, "T1", true);
        var ver = new HtmlReportTemplateVersionEntity
        {
            Id = 30,
            TemplateId = 20,
            Template = tpl,
            VersionNo = 1,
            SchemaVersion = 3,
            Status = "Published",
            TemplateJson = OriginalJson,
            ContentHash = SHA256.HashData(Encoding.UTF8.GetBytes(OriginalJson)),
            ValidationJson = "{}",
            CreatedBy = 7,
            CreatedDate = DateTime.UtcNow,
            RowVersion = [1]
        };
        db.ReportDefinitions.Add(def);
        db.HtmlReportTemplates.Add(tpl);
        db.HtmlReportTemplateVersions.Add(ver);

        var jobId = Guid.NewGuid();
        db.HtmlReportJobs.Add(new HtmlReportJobEntity
        {
            Id = jobId,
            OrganizationId = 1,
            ReportDefinitionId = 10,
            TemplateVersionId = 30,
            ReportCode = "T1",
            DataProviderCode = "TestProvider",
            ParametersJson = """{"userId":"7","propertyId":"101"}""",
            JobType = "Single",
            OutputMode = "Merged",
            Status = "Queued",
            Stage = "Queued",
            TotalRecords = 1,
            RequestedByUserId = 7,
            CreatedDate = DateTime.UtcNow,
            ExpiryDate = DateTime.UtcNow.AddDays(7)
        });
        await db.SaveChangesAsync();

        var executor = new Mock<IReportDataExecutor>();
        executor.Setup(x => x.ExecuteAsync(jobId, "TestProvider", It.IsAny<Dictionary<string, string>>(), 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HtmlReportDataEnvelope(
                Array.Empty<JsonElement>(),
                new Dictionary<string, IReadOnlyList<JsonElement>>(),
                Guid.NewGuid()));

        var adapters = new Mock<IHtmlReportDataAdapterRegistry>();
        adapters.Setup(x => x.Adapt(It.IsAny<string>(), It.IsAny<HtmlReportDataEnvelope>()))
            .Returns(new { propertyId = "101" });

        var documents = new Mock<IDocumentApplicationService>();
        documents.Setup(x => x.UploadDocumentAsync(It.IsAny<Stream>(), It.IsAny<string>(), "application/pdf", It.IsAny<long>(), It.IsAny<NtisPlatform.Application.DTOs.Document.DocumentUploadDto>(), 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NtisPlatform.Application.DTOs.Document.DocumentUploadResponseDto { DocumentGuid = Guid.NewGuid() });

        var htmlRenderer = new Mock<Ntis.Reporting.Rendering.Html.IHtmlTemplateRenderer>();
        htmlRenderer.Setup(x => x.Render(It.IsAny<string>(), It.IsAny<System.Text.Json.JsonElement>(), It.IsAny<IReadOnlyDictionary<string, string>>()))
            .Returns("<html><body>Report</body></html>");

        var pdfRenderer = new Mock<Ntis.Reporting.Rendering.Pdf.IPdfRenderer>();
        pdfRenderer.Setup(x => x.RenderAsync(It.IsAny<string>(), It.IsAny<CancellationToken>(), true))
            .ReturnsAsync(new byte[] { 1, 2, 3, 4 });

        var currentUser = new Mock<ICurrentUserService>();
        currentUser.Setup(x => x.GetCurrentUserId()).Returns(7);
        var currentTenant = new Mock<ICurrentTenantService>();
        currentTenant.Setup(x => x.GetCurrentTenantId()).Returns(1);

        var service = new HtmlReportService(
            db,
            currentUser.Object,
            currentTenant.Object,
            Options.Create(new ReportingOptions()),
            new HtmlReportTemplateValidator(),
            executor.Object,
            adapters.Object,
            Mock.Of<ITokenService>(),
            documents.Object,
            pdfRenderer.Object,
            htmlRenderer.Object);

        await service.ProcessQueuedJobAsync(jobId);

        var completedJob = await db.HtmlReportJobs.SingleAsync(x => x.Id == jobId);
        Assert.Equal("Completed", completedJob.Status);
        Assert.Equal("Completed", completedJob.Stage);
        Assert.True(await db.HtmlReportFiles.AnyAsync(x => x.JobId == jobId));
    }

    private static HtmlReportService CreateService(ReportingDbContext db, bool isAdmin = false)
    {
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.Setup(x => x.GetCurrentUserId()).Returns(7);
        var currentTenant = new Mock<ICurrentTenantService>();
        currentTenant.Setup(x => x.GetCurrentTenantId()).Returns(1);

        return new HtmlReportService(
            db,
            currentUser.Object,
            currentTenant.Object,
            Options.Create(new ReportingOptions()),
            new HtmlReportTemplateValidator(),
            Mock.Of<IReportDataExecutor>(),
            Mock.Of<IHtmlReportDataAdapterRegistry>(),
            Mock.Of<ITokenService>(),
            Mock.Of<IDocumentApplicationService>(),
            httpContextAccessor: new Microsoft.AspNetCore.Http.HttpContextAccessor
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(
                        isAdmin ? new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "Admin") }
                            : Array.Empty<System.Security.Claims.Claim>(), "test"))
                }
            });
    }

    private sealed class FaultingReportingDbContext(DbContextOptions<ReportingDbContext> options)
        : ReportingDbContext(options)
    {
        public bool ThrowConcurrencyOnNextSave { get; set; }
        public int ServiceSaveAttempts { get; set; }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ServiceSaveAttempts++;
            if (ThrowConcurrencyOnNextSave)
            {
                ThrowConcurrencyOnNextSave = false;
                throw new DbUpdateConcurrencyException("Simulated concurrent draft save.");
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
