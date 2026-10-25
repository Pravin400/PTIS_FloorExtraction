using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Ntis.Reporting.Rendering.Html;
using Ntis.Reporting.Rendering.Pdf;

namespace NtisPlatform.Infrastructure.Reporting.Html;

public static class ReportingServiceExtensions
{
    public static IServiceCollection AddHtmlReporting(this IServiceCollection services, IConfiguration configuration)
    {
        // Read-only report DATA context (replica / read-only login) for heavy provider reads
        var reportDataCommandTimeout = configuration.GetValue<int>("ReportData:CommandTimeoutSeconds", 300);
        services.AddPooledDbContextFactory<ReportDataDbContext>(options =>
        {
            var readOnlyConnection = configuration.GetConnectionString("ReportDataReadOnlyConnection")
                ?? configuration["ReportDataReadOnlyConnection"]
                ?? configuration.GetConnectionString("DefaultConnection")
                ?? configuration["DefaultConnection"];
            options.UseSqlServer(readOnlyConnection,
                sql => sql.CommandTimeout(reportDataCommandTimeout).UseNetTopologySuite());
        });
        services.AddScoped(sp =>
        {
            var factory = sp.GetRequiredService<IDbContextFactory<ReportDataDbContext>>();
            return factory.CreateDbContext();
        });

        // Repositories
        services.AddScoped(typeof(IReportingRepository<,>), typeof(ReportingRepository<,>));
        services.AddScoped<IReportingUnitOfWork, ReportingUnitOfWork>();
        services.AddScoped(typeof(IReportDataRepository<>), typeof(ReportDataRepository<>));

        // Options
        services.Configure<NtisPlatform.Application.Options.ReportingOptions>(
            configuration.GetSection(NtisPlatform.Application.Options.ReportingOptions.Section));

        // Core reporting services
        // Both the API and worker resolve header branding for report images.
        services.TryAddScoped<IUlbConfigService, UlbConfigService>();
        services.AddHttpClient();
        services.AddScoped<IReportDataProviderResolver, ReportDataProviderResolver>();
        services.AddScoped<IReportDataExecutor, ReportDataExecutor>();
        services.AddScoped<IHtmlReportDataAdapter, DefaultHtmlReportDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapter, SpecialNoticeThaneHtmlDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapter, FrontpageThaneHtmlDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapter, SignpageThaneHtmlDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapter, PermissionNoticeHtmlDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapter, KarakarniHtmlDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapter, PrarupYadiHtmlDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapter, Notice119HtmlDataAdapter>();
        services.AddScoped<IHtmlReportDataAdapterRegistry, HtmlReportDataAdapterRegistry>();
        services.AddSingleton<IHtmlReportTemplateValidator, HtmlReportTemplateValidator>();
        services.AddSingleton<IHtmlTemplateRenderer, HtmlTemplateRenderer>();
        services.AddSingleton<IPdfRenderer>(sp => new PlaywrightPdfRenderer(maximumConcurrency: 2));
        services.AddSingleton<IPdfMerger, PdfSharpPdfMerger>();
        services.AddScoped<IHtmlReportService, HtmlReportService>();

        // Data providers
        services.AddScoped<IReportDataProvider, NoticeNewDataProvider>();
        services.AddScoped<IReportDataProvider, NoDueCertificateDataProvider>();
        services.AddScoped<IReportDataProvider, KarakarniDataProvider>();
        services.AddScoped<IReportDataProvider, JaptiNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, WarrentNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, SpotSurveyFormDataProvider>();
        services.AddScoped<IReportDataProvider, SpecialNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, SpecialNoticeThaneDataProvider>();
        services.AddScoped<IReportDataProvider, FrontpageThaneDataProvider>();
        services.AddScoped<IReportDataProvider, SignpageThaneDataProvider>();
        services.AddScoped<IReportDataProvider, RentedNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, TransferCertificateDataProvider>();
        services.AddScoped<IReportDataProvider, Notice120DataProvider>();
        services.AddScoped<IReportDataProvider, SocietyOutstandingReportDataProvider>();
        services.AddScoped<IReportDataProvider, PrarupYadiDataProvider>();
        services.AddScoped<IReportDataProvider, BlankHearingFormatDataProvider>();
        services.AddScoped<IReportDataProvider, DocumentNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, PermissionNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, TypeWiseSurveyFormDataProvider>();
        services.AddScoped<IReportDataProvider, SurveyFormDataProvider>();
        services.AddScoped<IReportDataProvider, Notice119DataProvider>();

        return services;
    }
}
