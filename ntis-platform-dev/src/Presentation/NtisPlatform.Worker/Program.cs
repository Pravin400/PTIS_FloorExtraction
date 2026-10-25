using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Application.Services.Rules;
using NtisPlatform.Application.Services.Rules.Effects;
using NtisPlatform.Application.Services.Property;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.Options;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.DependencyInjection;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Reporting.Html;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Services.PropertyMedia;
using NtisPlatform.Infrastructure.Services.Handlers;

using NtisPlatform.Infrastructure.Services;
using NtisPlatform.Core.Interfaces.Section129;
using NtisPlatform.Infrastructure.Repositories.Section129;
using NtisPlatform.Application.Interfaces.Section129;
using NtisPlatform.Application.Services.Section129;
using NtisPlatform.Worker;
using NtisPlatform.Worker.Services;
using Microsoft.AspNetCore.Http;

var builder = Host.CreateApplicationBuilder(args);

// Add Windows Service support
builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "NTIS Platform Worker Service";
});

// Infrastructure Layer - Database
builder.Services.AddPooledDbContextFactory<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b =>
        {
            b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
            // Configures NetTopologySuite spatial mappings for SQL Server geometry columns (e.g. GisAssetGeometryEntity.PolygonGeometry)
            // required when initializing ApplicationDbContext model metadata in background workers.
            b.UseNetTopologySuite();
        }));

// Register scoped DbContext for DI (created from factory)
builder.Services.AddScoped(sp =>
{
    var factory = sp.GetRequiredService<IDbContextFactory<ApplicationDbContext>>();
    return factory.CreateDbContext();
});

// Add Memory Cache & AutoMapper Configuration
builder.Services.AddMemoryCache();
var mapperConfig = new AutoMapper.MapperConfiguration(cfg =>
{
    cfg.AddMaps(typeof(NtisPlatform.Application.Mappings.FloorMappingProfile).Assembly);
}, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
builder.Services.AddSingleton<AutoMapper.IMapper>(mapperConfig.CreateMapper());
// Report queue DB (separate database) used by the retention sweep worker
builder.Services.AddPooledDbContextFactory<ReportingDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ReportingConnection")));
builder.Services.AddScoped(sp =>
{
    var factory = sp.GetRequiredService<IDbContextFactory<ReportingDbContext>>();
    return factory.CreateDbContext();
});

// Infrastructure Layer - Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped(typeof(IRepository<,>), typeof(Repository<,>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<ICdcMasterProcessorTrigger, CdcMasterProcessorTrigger>();

// Property Media bulk-import job — reuses the same Document/PropertyPhoto upload pipeline the
// Api project uses for manual uploads (see Api/Extensions/ServiceCollectionExtensions.cs).
builder.Services.AddScoped<IModuleLookupService, ModuleLookupService>();
builder.Services.AddScoped<IPropertyPhotoService, PropertyPhotoService>();
builder.Services.AddScoped<IDynamicBindingService, DynamicBindingService>();
builder.Services.AddScoped<IDocumentApplicationService, DocumentApplicationService>();
builder.Services.AddScoped<IPropertyPhotoApplicationService, PropertyPhotoApplicationService>();
builder.Services.AddScoped<IDocumentBindingHandler, PropertyPhotoDocumentBindingHandler>();
builder.Services.AddScoped<IPropertyMediaOperationsService, PropertyMediaOperationsService>();
builder.Services.AddScoped<IPropertyMediaFileMatchResolver, PropertyMediaFileMatchResolver>();
builder.Services.AddSingleton<FileValidationHelper>();
// Browse-upload session storage: read here too, since ProcessJobAsync (this Worker) needs
// PropertyMediaOperationsService fully resolvable - the cleanup sweep itself only runs in the
// Api process (see Api/Extensions/ServiceCollectionExtensions.cs) since both processes share the
// same local disk.
builder.Services.AddSingleton<IPropertyMediaBrowseSessionStorage, PropertyMediaBrowseSessionStorage>();
builder.Services.Configure<PropertyMediaDevToolsOptions>(
    builder.Configuration.GetSection(PropertyMediaDevToolsOptions.Section));
builder.Services.Configure<PropertyMediaBrowseSessionOptions>(
    builder.Configuration.GetSection(PropertyMediaBrowseSessionOptions.Section));


// Async reporting options (SLT/LLT lifetimes, retention sweep)
builder.Services.Configure<ReportingOptions>(builder.Configuration.GetSection(ReportingOptions.Section));

// Infrastructure Layer - Localization
builder.Services.Configure<LocalizationOptions>(builder.Configuration.GetSection("Localization"));
builder.Services.AddSingleton<ILocalizationService, NtisPlatform.Infrastructure.Services.Localization.LocalizationService>();

// Application Layer - Services
builder.Services.Configure<NtisPlatform.Application.Options.FileStorageOptions>(
    builder.Configuration.GetSection(NtisPlatform.Application.Options.FileStorageOptions.Section));
builder.Services.AddScoped<IHardDeleteCleanupService, HardDeleteCleanupService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();

// Tax Engine & Property Tax Operations Services
builder.Services.AddScoped<IRateableValueService, RateableValueService>();
// Section 129A: registered here so RateableValueService's post-save auto-recalculation hook
// (which resolves ISection129Service via IServiceProvider.GetService, returning null and silently
// no-op'ing if unregistered) actually fires when RV calculations run inside this Worker process —
// e.g. the bulk "Add Taxes" job (PropertyTaxJobProcessorWorker) — matching NtisPlatform.Api's own
// registration of the same two services.
builder.Services.AddScoped<ISection129Repository, Section129Repository>();
builder.Services.AddScoped<ISection129Service, Section129Service>();
builder.Services.AddScoped<ITaxMasterDataService, TaxMasterDataService>();
builder.Services.AddScoped<IRVPersistenceService, RVPersistenceService>();
builder.Services.AddScoped<IPolicyConfigurationService, PolicyConfigurationService>();
builder.Services.AddScoped<IRateableValueCalculatorService, RateableValueCalculatorService>();
builder.Services.AddSingleton<IFinanceYearProvider, SystemFinanceYearProvider>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IPropertyContextLoaderService, PropertyContextLoaderService>();
builder.Services.AddScoped<IRuleApplierService, RuleApplierService>();
builder.Services.AddScoped<IRVCalculationCleanupService, RVCalculationCleanupService>();
builder.Services.AddScoped<IRVCalculationSignatureService, RVCalculationSignatureService>();
builder.Services.AddScoped<IRuleExecutionService, RuleExecutionService>();
builder.Services.AddScoped<IPropertyFieldFlattenerService, PropertyFieldFlattenerService>();
// Stateless, dependency-free — safe as singleton, matching the API host's registration.
builder.Services.AddSingleton<IConditionRuleEvaluator, ConditionRuleEvaluator>();
// Bridges the Dynamic Tax Register's configuration into the live RV calculation pipeline.
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.IDynamicTaxConfigReader,
    NtisPlatform.Application.Services.TaxEngine.DynamicTax.DynamicTaxConfigReader>();
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.IDynamicTaxAmountResolver,
    NtisPlatform.Application.Services.TaxEngine.DynamicTax.DynamicTaxAmountResolver>();
builder.Services.AddSingleton<IRuleEffectApplicator, DecreasePercentApplicator>();
builder.Services.AddSingleton<IRuleEffectApplicator, IncreasePercentApplicator>();
builder.Services.AddSingleton<IRuleEffectApplicator, MultiplyApplicator>();
builder.Services.AddSingleton<IRuleEffectApplicator, OverrideApplicator>();
builder.Services.AddSingleton<IRuleEffectApplicator, ExemptionApplicator>();
builder.Services.AddScoped<IRuleEffectApplicator, RateLookupApplicator>();
builder.Services.AddScoped<ITaxMasterService, TaxMasterService>();
builder.Services.AddScoped<ITaxApplicabilityService, TaxApplicabilityService>();
builder.Services.AddScoped<IPropertyMutationInvariantPolicy, PropertyMutationInvariantPolicy>();
builder.Services.AddScoped<IUserScreenAccessService, UserScreenAccessService>();
builder.Services.AddScoped<IReferenceValidationService, ReferenceValidationService>();

// Retrospective Rule Engine: PropertyTaxOperationsService recalculates RV and re-runs the engine for every property of
// an "Add Tax" job through IRetrospectiveTaxRefresher (the recalculation replaces the current-year TransMast rows of a
// certificate with NETTAX rows, which only the engine puts back). One call registers the engine, the refresher, the
// policy-code lookup and the cross-process database lock, and it is the call the API host makes: the Worker and every API
// instance exclude each other per property, and neither can drift from the other. The lock is mandatory, so without a
// DefaultConnection the Worker fails here, at start-up, instead of calculating without it.
builder.Services.AddRetrospectiveTaxEngine(builder.Configuration);

// Capital Value (CV) calculation services required for PropertyTaxOperationsService
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.ICapitalValueService, NtisPlatform.Application.Services.CapitalValue.CapitalValueService>();
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.IPropertyTaxCalculationCVResultsService, NtisPlatform.Application.Services.CapitalValueService.PropertyTaxCalculationCVResultsService>();
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.IPolicyTaxDetailsCVService, NtisPlatform.Application.Services.CapitalValueService.PolicyTaxDetailsCVService>();
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.ITransMastService, NtisPlatform.Application.Services.CapitalValueService.TransMastService>();

// Capital Value supporting services (Data Loaders, Master Data Providers, Calculators, and Persistence)
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.Data.IPropertyDataLoader, NtisPlatform.Application.Services.CapitalValue.DataLoader.PropertyDataLoader>();
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.Data.ICapitalValueMasterDataProvider, NtisPlatform.Application.Services.CapitalValue.MasterDataProviders.CapitalValueMasterDataProvider>();
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.Calculation.ICapitalValueCalculator, NtisPlatform.Application.Services.CapitalValue.CVCalculator.CapitalValueCalculatorService>();
builder.Services.AddScoped<NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.Persistence.ICapitalValuePersistenceService, NtisPlatform.Application.Services.CapitalValue.CVPersistenceService.CapitalValuePersistenceService>();

// Dual Method tax calculation service
builder.Services.AddScoped<IDualMethodService, DualMethodService>();

builder.Services.AddScoped<IPropertyTaxOperationsService, NtisPlatform.Application.Services.PropertyTaxOperations.PropertyTaxOperationsService>();
builder.Services.Configure<CapitalValueOptions>(
    builder.Configuration.GetSection(CapitalValueOptions.SectionName));

// In-process HTML Reporting Pipeline & Rendering
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();
builder.Services.AddHtmlReporting(builder.Configuration);

// Add background workers
builder.Services.AddHostedService<Worker>();
builder.Services.AddHostedService<HardDeleteCleanupWorker>();
builder.Services.AddHostedService<PropertyTaxJobProcessorWorker>();
builder.Services.AddHostedService<PropertyTaxJobRecoveryWorker>();
builder.Services.AddHostedService<PropertyMediaJobProcessorWorker>();
builder.Services.AddHostedService<CdcMasterProcessorWorker>();
builder.Services.AddHostedService<MasterDataChangeResolverWorker>();
builder.Services.AddHostedService<ReportJobProcessorWorker>();

var host = builder.Build();
host.Run();
