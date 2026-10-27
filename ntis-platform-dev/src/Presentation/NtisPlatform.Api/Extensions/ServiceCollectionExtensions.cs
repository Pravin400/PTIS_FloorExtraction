using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Api.Filters;
using NtisPlatform.Api.Hubs;
using NtisPlatform.Api.Localization;
using NtisPlatform.Api.Middleware;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.Events;
using NtisPlatform.Application.EventHandlers;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Interfaces.AutomationDashboard;
using NtisPlatform.Application.Interfaces.FieldConfiguration;
using NtisPlatform.Application.Interfaces.ICapitalValueService;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.Calculation;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.Data;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService.Persistence;
using NtisPlatform.Application.Interfaces.FireAudit;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Interfaces.Section129;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Application.Interfaces.Master.WaterBill;
using NtisPlatform.Application.Interfaces.WaterBill;
using NtisPlatform.Application.Interfaces.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Application.Interfaces.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Application.Interfaces.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Application.Interfaces.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Interfaces.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Options;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.WaterBill.Master;
using NtisPlatform.Application.Services.Master.WaterBill;
using NtisPlatform.Application.Services.WaterBill;
using NtisPlatform.Application.Services.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Application.Services.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Application.Services.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Application.Services.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Application.Services.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Services.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Services.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Application.Services.FireAudit;
using NtisPlatform.Application.Services.Property;
using NtisPlatform.Application.Services.PropertyMedia;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Section129;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Application.Services.Master;
using NtisPlatform.Application.Services.Rules;
using NtisPlatform.Application.Services.Rules.Effects;
using NtisPlatform.Application.Services.FieldConfiguration;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Application.Services.PropertyTaxOperations;
using NtisPlatform.Application.Services.CapitalValue;
using NtisPlatform.Application.Services.CapitalValue.CVCalculator;
using NtisPlatform.Application.Services.CapitalValue.CVPersistenceService;
using NtisPlatform.Application.Services.CapitalValue.DataLoader;
using NtisPlatform.Application.Services.CapitalValue.MasterDataProviders;
using NtisPlatform.Application.Services.CapitalValueService;
using NtisPlatform.Application.Services.FieldConfiguration;
using NtisPlatform.Application.Services.Master;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Application.Services.Section129;
using NtisPlatform.Application.Services.AutomationDashboard;
using NtisPlatform.Core.Interfaces.IAutomationDashboard;
using NtisPlatform.Core.Interfaces.Property;
using NtisPlatform.Core.Interfaces.Rules;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Repositories.AutomationDashboard;
using NtisPlatform.Infrastructure.Repositories.Property;
using NtisPlatform.Infrastructure.Repositories.Rules;
using NtisPlatform.Infrastructure.Repositories.Section129;
using NtisPlatform.Infrastructure.Services;
using NtisPlatform.Infrastructure.Services.Handlers;
using NtisPlatform.Infrastructure.Services.Localization;
using System.Text;
using NtisPlatform.Core.Interfaces.Asset_Management;
using NtisPlatform.Infrastructure.Services.Asset_Management;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Infrastructure.DependencyInjection;
using NtisPlatform.Infrastructure.Reporting.Html;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Infrastructure.Services.WhatsApp;
using NtisPlatform.Infrastructure.Services.WhatsApp.Formatting;
using NtisPlatform.Infrastructure.Services.WhatsApp.Templates;
using NtisPlatform.Infrastructure.Services.WhatsApp.NotificationHandlers;
using NtisPlatform.Application.Services.GrievanceService;
namespace NtisPlatform.Api.Extensions;

/// <summary>
/// Centralized dependency injection configuration for all layers
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers all application services
    /// </summary>
    public static IServiceCollection AddAllServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Infrastructure Layer - Database (Single deployment per organization)
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ICurrentTenantService, CurrentTenantService>();

        // AutoMapper - scan Application assembly for all mapping profiles in NtisPlatform.Application.Mappings
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddMaps(typeof(FloorMappingProfile).Assembly);
        }, NullLoggerFactory.Instance);


        // Shared configuration for DbContext
        Action<DbContextOptionsBuilder> configureDbContext = options =>
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? configuration["DefaultConnection"];
            options.UseSqlServer(connectionString, sql => sql.UseNetTopologySuite());
            // Add interceptors, logging, etc. here if needed
        };

        // Register pooled DbContextFactory (singleton)
        services.AddPooledDbContextFactory<ApplicationDbContext>(configureDbContext);

        // Register scoped DbContext for DI (created from factory)
        services.AddScoped(sp =>
        {
            var factory = sp.GetRequiredService<IDbContextFactory<ApplicationDbContext>>();
            return factory.CreateDbContext();
        });

        // Report queue DB (separate database; schema owned by the ntis DB project mapping only)
        services.AddPooledDbContextFactory<ReportingDbContext>(options =>
        {
            var reportingConnection = configuration.GetConnectionString("ReportingConnection")
                ?? configuration["ReportingConnection"];
            if (string.IsNullOrWhiteSpace(reportingConnection))
            {
                reportingConnection = configuration.GetConnectionString("DefaultConnection")
                    ?? configuration["DefaultConnection"]
                    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
            }
            options.UseSqlServer(reportingConnection);
        });
        services.AddScoped(sp =>
        {
            var factory = sp.GetRequiredService<IDbContextFactory<ReportingDbContext>>();
            return factory.CreateDbContext();
        });

        // Read-only report DATA context (replica / read-only login) for heavy provider reads.
        // A generous CommandTimeout (default 300s) lets a large report's per-page query finish instead
        // of dying at SQL Server's 30s default — the common cause of large reports failing.
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

        // Localization service (singleton dictionary cache for both validation messages and field localization)
        services.AddSingleton<ILocalizationService, LocalizationService>();
        // Preload on startup
        services.AddHostedService<LocalizationWarmupHostedService>();

        // Department ID cache - eliminates sync DB queries in DI setup
        services.AddSingleton<IDepartmentIdCache, DepartmentIdCache>();
        services.AddHostedService<DepartmentIdCacheInitializer>();

        // Document orphan cleanup service (disabled by default until enabled/configured)
        // services.AddHostedService<DocumentOrphanCleanupService>();
        // Replace RESX localizer with service-backed factory
        services.AddSingleton<IStringLocalizerFactory, DbServiceStringLocalizerFactory>();
        // Configure localization options from appsettings
        services.Configure<NtisPlatform.Application.Options.LocalizationOptions>(configuration.GetSection("Localization"));
        // Configure feature flags from appsettings
        services.Configure<NtisPlatform.Application.Options.FeatureFlagsOptions>(configuration.GetSection("FeatureFlags"));
        // model data fill culture wise.
        services.AddScoped<LocalizationProcessor>();

        // Field-level localization (uses ILocalizationService for caching)
        services.AddScoped<ILocalization, LocalizationRepoService>();
        services.AddScoped<ILocalizedQueryService, LocalizedQueryService>();

        // Configure file upload limits from the strongly-typed FileStorage options (single source of truth)
        var fileStorageOptions = configuration.GetSection(NtisPlatform.Application.Options.FileStorageOptions.Section)
            .Get<NtisPlatform.Application.Options.FileStorageOptions>() ?? new NtisPlatform.Application.Options.FileStorageOptions();
        services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = fileStorageOptions.MaxFileSizeBytes;
        });

        // API Layer - Controllers with DataAnnotations localization
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            })
            .AddDataAnnotationsLocalization(options =>
            {
                // Route all validation messages through a single "ValidationMessages" resource
                // Keys in DB: Resource = "ValidationMessages", Key = "RequiredField", etc.
                options.DataAnnotationLocalizerProvider = (type, factory) =>
                    factory.Create("ValidationMessages", string.Empty);
            });


        // Infrastructure Layer - Repositories
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped(typeof(IRepository<,>), typeof(Repository<,>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Property Revision (Phase 1 - see revision_api_rules.txt)
        services.AddScoped<IRevisionRepository,
                           NtisPlatform.Infrastructure.Repositories.PropertyRevision.RevisionRepository>();

        // Property Revision (Phase 2a - core property snapshot group)
        services.AddScoped<NtisPlatform.Core.Interfaces.IRevisionPropertySnapshotRepository,
                           NtisPlatform.Infrastructure.Repositories.PropertyRevision.RevisionPropertySnapshotRepository>();
        services.AddScoped<NtisPlatform.Core.Interfaces.IRevisionCalculationCleanupHandler,
                           NtisPlatform.Infrastructure.Repositories.PropertyRevision.RevisionCalculationCleanupHandler>();
        services.AddScoped<NtisPlatform.Core.Interfaces.IRevisionDraftGuardService,
                           NtisPlatform.Application.Services.PropertyRevision.RevisionDraftGuardService>();
        services.AddScoped<IPropertyRevisionSnapshotService,
                           NtisPlatform.Application.Services.PropertyRevision.PropertyRevisionSnapshotService>();

        // Report catalogue (definitions + parameters) lives in the report database. Bind their
        // IRepository<T,int> to ReportingDbContext these closed-generic registrations override the
        // open-generic ApplicationDbContext binding above for these two entity types, so every
        // consumer (CRUD services, cache warmup, ReportService, ReportWorkerService) reads from the
        // report DB. The matching write-side IUnitOfWork is injected per CRUD service below.
        services.AddScoped<IRepository<NtisPlatform.Core.Entities.Master.ReportDefinitionEntity, int>>(
            sp => new ReportDbRepository<NtisPlatform.Core.Entities.Master.ReportDefinitionEntity, int>(
                sp.GetRequiredService<ReportingDbContext>()));
        services.AddScoped<IRepository<NtisPlatform.Core.Entities.Master.ReportParameterDefinitionEntity, int>>(
            sp => new ReportDbRepository<NtisPlatform.Core.Entities.Master.ReportParameterDefinitionEntity, int>(
                sp.GetRequiredService<ReportingDbContext>()));
        // Read-only from this app's perspective — modules are managed by the report-admin tool.
        services.AddScoped<IRepository<NtisPlatform.Core.Entities.Master.ReportModuleEntity, int>>(
            sp => new ReportDbRepository<NtisPlatform.Core.Entities.Master.ReportModuleEntity, int>(
                sp.GetRequiredService<ReportingDbContext>()));

        // Reporting repositories/UoW bound to ReportingDbContext (report queue DB)
        services.AddScoped(typeof(IReportingRepository<,>), typeof(ReportingRepository<,>));
        services.AddScoped<IReportingUnitOfWork, ReportingUnitOfWork>();
        // Read-only data repository bound to ReportDataDbContext (report data replica)
        services.AddScoped(typeof(IReportDataRepository<>), typeof(ReportDataRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserAccessRepository, UserAccessRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<ITwoFactorRecoveryCodeRepository, TwoFactorRecoveryCodeRepository>();
        services.AddScoped<IMfaChallengeRepository, MfaChallengeRepository>();
        services.AddScoped<ISecurityAuditLogRepository, SecurityAuditLogRepository>();
        services.AddScoped<IPropertyRepository, PropertyRepository>();
        services.AddScoped<ITypeOfUseByPropertyTypeRepository, TypeOfUseByPropertyTypeRepository>();


        // Per-tab Clean Architecture split (Basic Details): shared master checks + feature repository
        services.AddScoped<IMasterRepository, MasterRepository>();
        services.AddScoped<IPropertyBasicDetailsRepository, PropertyBasicDetailsRepository>();
        services.AddScoped<IPropertyKycRepository, PropertyKycRepository>();
        services.AddScoped<IPropertySocietyRepository, PropertySocietyRepository>();
        services.AddScoped<IPropertyDiscountRepository, PropertyDiscountRepository>();
        services.AddScoped<IPropertyOldDetailsRepository, PropertyOldDetailsRepository>();
        services.AddScoped<IPropertySocialDetailsRepository, PropertySocialDetailsRepository>();
        services.AddScoped<IPropertySearchRepository, PropertySearchRepository>();
        services.AddScoped<ISection129Repository, Section129Repository>();
        services.AddScoped<IPropertyWorkflowDetailsRepository, PropertyWorkflowDetailsRepository>();
        services.AddScoped<IRuleFieldsRepository, RuleFieldsRepository>();
        services.AddScoped<IApartmentQCRepository, ApartmentQCRepository>();
        services.AddScoped<IApartmentQcTopSectionRepository, ApartmentQcTopSectionRepository>();
        services.AddScoped<IPropertyIndividualSupplementaryRepository, PropertyIndividualSupplementaryRepository>();
        services.AddScoped<IApartmentTaxDetailsRepository, ApartmentTaxDetailsRepository>();
        services.AddScoped<IApartmentQcTopSectionBelowFlexRepository, ApartmentQcTopSectionBelowFlexRepository>();
        services.AddScoped<IApartmentQcCertificateGridRepository, ApartmentQcCertificateGridRepository>();
        services.AddScoped<IApartmentQcSearchRepository, ApartmentQcSearchRepository>();

        // Automation Dashboard Repositories (separate per stage)
        services.AddScoped<IAutomationDashboardRepository, AutomationDashboardRepository>();
        services.AddScoped<IGeoSequencingStageRepository, GeoSequencingStageRepository>();
        services.AddScoped<IInternalSurveyStageRepository, InternalSurveyStageRepository>();
        services.AddScoped<IDataEntryStageRepository, DataEntryStageRepository>();
        services.AddScoped<IAssessmentStageRepository, AssessmentStageRepository>();
        services.AddScoped<IMissingDetailsRepository, MissingDetailsRepository>();

        // Property Sign-off Module
        services.AddScoped<IPropertySignatureRepository, PropertySignatureRepository>();
        services.AddScoped<IWardAllocationBuilder, WardAllocationBuilder>();
        services.AddScoped<IWardAllocationValidator, WardAllocationValidator>();
        services.AddScoped<IWardAllocationService, WardAllocationService>();
        services.AddScoped<IPropertyWiseAllocationBuilder, PropertyWiseAllocationBuilder>();
        services.AddScoped<IPropertyWiseValidator, PropertyWiseValidator>();
        services.AddScoped<IPropertyWiseService, PropertyWiseService>();

        // GIS Engine Repositories
        services.AddScoped<NtisPlatform.Core.Interfaces.GIS.IGisAssetRepository, NtisPlatform.Infrastructure.Repositories.GIS.GisAssetRepository>();

        // Infrastructure Layer - Services
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ISecuritySettingsService, SecuritySettingsService>();

        // Property Media & Document Center
        services.AddScoped<IPropertyMediaDashboardService, PropertyMediaDashboardService>();
        services.AddScoped<IPropertyMediaExportService, PropertyMediaExportService>();
        services.AddScoped<IPropertyMediaUploadService, PropertyMediaUploadService>();
        services.AddScoped<IPropertyMediaOperationsService, PropertyMediaOperationsService>();
        services.AddScoped<IPropertyMediaDownloadService, PropertyMediaDownloadService>();
        services.AddScoped<IPropertyMediaFileMatchResolver, PropertyMediaFileMatchResolver>();
        services.AddSingleton<IPropertyMediaBrowseSessionStorage, PropertyMediaBrowseSessionStorage>();
        services.AddHostedService<PropertyMediaBrowseSessionCleanupService>();
        services.Configure<PropertyMediaDevToolsOptions>(
            configuration.GetSection(PropertyMediaDevToolsOptions.Section));
        services.Configure<PropertyMediaBrowseSessionOptions>(
            configuration.GetSection(PropertyMediaBrowseSessionOptions.Section));

         
        // Two-factor authentication (authenticator app / TOTP)
        services.AddScoped<ITotpService, TotpService>();
        services.AddScoped<ITwoFactorSecretProtector, TwoFactorSecretProtector>();
        services.AddScoped<ITwoFactorAuthenticationService, TwoFactorAuthenticationService>();
        services.AddScoped<IMfaChallengeService, MfaChallengeService>();

        // Config-driven OTP (email/SMS) challenges for login and forgot password
        services.AddScoped<IOtpChallengeService, OtpChallengeService>();
        services.AddScoped<ISmsService, SmsService>();

        services.AddScoped<IAuthTokenIssuerService, AuthTokenIssuerService>();
        services.AddScoped<ISecurityAuditService, SecurityAuditService>();
        services.AddScoped<IHardDeleteCleanupService, HardDeleteCleanupService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IDocumentAuthorizationService, DocumentAuthorizationService>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IModuleLookupService, ModuleLookupService>();
        services.AddScoped<NtisPlatform.Infrastructure.Reporting.Import.PdfReportImporter>();
        services.AddScoped<NtisPlatform.Infrastructure.Reporting.Import.RptReportImporter>();
        services.AddScoped<NtisPlatform.Application.Interfaces.IUniversalReportImportService, NtisPlatform.Infrastructure.Reporting.Import.UniversalReportImportService>();

        // Wing details services
        services.AddScoped<IWingDetailsMastService, WingDetailsMastService>();

        // Document Authorization Handlers (per-department entity-level authorization)
        // Register handlers for document access based on parent entity (Property, WaterConnection, etc.)
        services.AddScoped<IDocumentAuthorizationHandler>(sp =>
        {
            // PTIS department ID - resolved from startup cache (no sync DB queries)
            var deptCache = sp.GetRequiredService<IDepartmentIdCache>();
            var logger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<NtisPlatform.Infrastructure.Services.Handlers.PtisDocumentAuthorizationHandler>>();

            var ptisDepartmentId = deptCache.GetPtisdepartmentId();

            return new NtisPlatform.Infrastructure.Services.Handlers.PtisDocumentAuthorizationHandler(
                ptisDepartmentId,
                logger);
        });
        services.AddScoped<IPropertyCertificateService, PropertyCertificateService>();
        services.AddScoped<IPropertyPhotoService, PropertyPhotoService>();
        services.AddScoped<IDynamicEntityLoader, DynamicEntityLoader>();
        services.AddScoped<IDynamicBindingService, DynamicBindingService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IEmailSettingsProvider, EmailSettingsProvider>();
        services.AddScoped<IFieldRegistryService, FieldRegistryService>();
        services.AddScoped<IExcelUploadService, ExcelUploadService>();
        services.AddScoped<IAssetPhotoService, AssetPhotoService>();
        services.AddScoped<IAssetDocumentService, AssetDocumentService>();
        services.AddScoped<IInventoryDocumentService, InventoryDocumentService>();

        // Translation Management
        services.AddScoped<IMultilingualTranslation, MultilingualTranslationService>();

        // Google Translate Service
        services.AddHttpClient<ITranslationService, TranslationService>();
        services.Configure<TranslationServiceOptions>(configuration.GetSection("GoogleTranslate"));
        services.Configure<NtisPlatform.Application.Options.ApartmentQCOptions>(configuration.GetSection(NtisPlatform.Application.Options.ApartmentQCOptions.Section));
        services.Configure<NtisPlatform.Application.Options.FileStorageOptions>(configuration.GetSection(NtisPlatform.Application.Options.FileStorageOptions.Section));

        // Two-factor authentication options — validated eagerly so a misconfigured Issuer/lifetime fails fast at startup
        services
            .AddOptions<NtisPlatform.Application.Options.TwoFactorAuthenticationOptions>()
            .BindConfiguration(NtisPlatform.Application.Options.TwoFactorAuthenticationOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // OTP (email/SMS) challenge options — login OTP and forgot-password OTP
        services
            .AddOptions<NtisPlatform.Application.Options.OtpChallengeOptions>()
            .BindConfiguration(NtisPlatform.Application.Options.OtpChallengeOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Application Layer - Helpers
        services.AddSingleton<NtisPlatform.Application.Helpers.FileValidationHelper>();

        // Application Layer - Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();
        services.AddScoped<IUlbConfigService, UlbConfigService>();
        services.AddScoped<IDocumentApplicationService, DocumentApplicationService>();
        services.AddScoped<IPropertyCertificateApplicationService, PropertyCertificateApplicationService>();
        services.AddScoped<IPropertyPhotoApplicationService, PropertyPhotoApplicationService>();
        services.AddScoped<ICommonDetailsService, CommonDetailsService>();
        services.AddScoped<IPropertyLockExcelService, PropertyLockExcelService>();
        services.AddScoped<IAssetPhotoApplicationService, AssetPhotoApplicationService>();
        services.AddScoped<IAssetDocumentApplicationService, AssetDocumentApplicationService>();
        services.AddScoped<IInventoryDocumentApplicationService, InventoryDocumentApplicationService>();
        services.AddSingleton<ITaxCalculationJobCoordinator, TaxCalculationJobCoordinator>();
        services.AddScoped<ITaxRecalculationBackgroundService, TaxRecalculationBackgroundService>();
        services.AddScoped<ITaxCalculationNotifier, SignalRTaxCalculationNotifier>();

        // Global Document Binding Handlers (OCP extension points).
        // Each module registers its own handler — DocumentApplicationService dispatches to them
        // by reference table name, with zero if/else branching on entity names.
        // Pattern: For each new module, create a handler implementing IDocumentBindingHandler
        // and register it here. DocumentApplicationService will auto-discover via DI.
        services.AddScoped<IDocumentBindingHandler, PropertyPhotoDocumentBindingHandler>();
        services.AddScoped<IDocumentBindingHandler, PropertyCertificateDocumentBindingHandler>();
        services.AddScoped<IDocumentBindingHandler, RenterMastDocumentBindingHandler>();
        services.AddScoped<IDocumentBindingHandler, AssetPhotoDocumentBindingHandler>();
        services.AddScoped<IDocumentBindingHandler, AssetDocumentBindingHandler>();
        services.AddScoped<IDocumentBindingHandler, InventoryDocumentBindingHandler>();
        services.AddScoped<IDocumentBindingHandler, ULBDocumentBindingHandler>();
        services.AddScoped<IDocumentBindingHandler, PropertySocialDocumentHandler>();
        // Future modules: Add handlers following this pattern:
        // services.AddScoped<IDocumentBindingHandler, WaterConnectionDocumentBindingHandler>();
        // services.AddScoped<IDocumentBindingHandler, AssetDocumentBindingHandler>();

        // TODO: Add other providers when implemented
        // services.AddScoped<IAuthenticationProvider, AzureAdAuthProvider>();
        // services.AddScoped<IAuthenticationProvider, GoogleAuthProvider>();


        // CRUD Services
        services.AddScoped<IULBMasterService, ULBMasterService>();
        services.AddScoped<IPaymentModeService, PaymentModeService>();
        services.AddScoped<ICapitalValueService, CapitalValueService>();
        services.AddScoped<IPropertyTaxCalculationCVResultsService, PropertyTaxCalculationCVResultsService>();
        services.AddScoped<IPolicyTaxDetailsCVService, PolicyTaxDetailsCVService>();
        services.AddScoped<ITransMastService, TransMastService>();
        // Capital Value Supporting Services - Data Loaders
        services.AddScoped<IPropertyDataLoader, PropertyDataLoader>();
        services.AddScoped<ICapitalValueMasterDataProvider, CapitalValueMasterDataProvider>();
        // Capital Value Supporting Services - Calculators
        services.AddScoped<ICapitalValueCalculator, CapitalValueCalculatorService>();
        // Capital Value Supporting Services - Persistence
        services.AddScoped<ICapitalValuePersistenceService, CapitalValuePersistenceService>();
        // Capital Value Configuration Options 
        services.Configure<CapitalValueOptions>(configuration.GetSection(CapitalValueOptions.SectionName));
        services.AddScoped<IDualMethodService, DualMethodService>();
        services.AddScoped<IRateableValueService, NtisPlatform.Application.Services.TaxEngine.RateableValueService>();
        services.AddScoped<IPropertyTaxOperationsService, PropertyTaxOperationsService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.ITaxMasterDataService,
                       NtisPlatform.Application.Services.TaxEngine.TaxMasterDataService>();

        services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.IRVPersistenceService,
                           NtisPlatform.Application.Services.TaxEngine.RVPersistenceService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.IRVCalculationSignatureService,
                           NtisPlatform.Application.Services.TaxEngine.RVCalculationSignatureService>();
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<NtisPlatform.Application.Interfaces.IFinanceYearProvider, NtisPlatform.Application.Services.SystemFinanceYearProvider>();
        services.AddScoped<NtisPlatform.Application.Interfaces.IPolicyCodeLookupService, NtisPlatform.Application.Services.PolicyCodeLookupService>();

        // In-process fire-and-forget queue -- lets PropertyCertificateChangedEventHandler enqueue
        // the RV-refresh-then-Retrospective-Tax-Engine pipeline instead of running it inline within
        // the certificate-save HTTP request. Singleton queue (one Channel for the whole process) +
        // one long-running hosted service draining it in its own DI scope per item.
        services.AddSingleton<NtisPlatform.Application.Interfaces.IBackgroundTaskQueue, NtisPlatform.Api.BackgroundTasks.BackgroundTaskQueue>();
        services.AddHostedService<NtisPlatform.Api.BackgroundTasks.QueuedHostedService>();
        services.AddHostedService<NtisPlatform.Api.BackgroundTasks.PropertyTaxSummaryWarmupHostedService>();

        // MediatR for event publishing pipeline
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<PropertyCertificateChangedEvent>());

        // PropertyCertificateChangedEventHandler is registered via AddMediatR assembly scanning.
        services.AddScoped<ITaxZoningService, TaxZoningService>();
        services.AddScoped<IPolicyConfigurationService, PolicyConfigurationService>();
        services.AddScoped<ICombinePropertyService, CombinePropertyService>();
        services.AddScoped<ICombinePropertyValidator, CombinePropertyValidator>();
        services.AddScoped<IPropertyDataCopier, PropertyDataCopier>();
        services.AddScoped<IPropertyDeactivator, PropertyDeactivator>();
        services.AddScoped<ICombinePropertyTaxService, CombinePropertyTaxService>();
        services.AddScoped<IPropertyComparisonService, PropertyComparisonService>();
        services.AddScoped<ILockUnlockService, LockUnlockService>();
        services.AddScoped<ICdcMasterProcessorTrigger, CdcMasterProcessorTrigger>();
        services.AddScoped<IFloorService, FloorService>();
        services.AddScoped<IConstructionTypeService, ConstructionTypeService>();
        services.AddScoped<ISubFloorService, SubFloorService>();
        services.AddScoped<IRateService, RateService>();
        services.AddScoped<IRateMasterForCVService, RateMasterForCVService>();
        services.AddScoped<IRetentionFactWiseService, RetentionFactWiseService>();
        services.AddScoped<IUserRoleService, UserRoleService>();
        services.AddScoped<IRetentionYearWiseService, RetentionYearWiseService>();
        services.AddScoped<IYearMasterService, YearMasterService>();
        services.AddScoped<ITaxZoneService, TaxZoneService>();
        services.AddScoped<IMoujaService, MoujaService>();
        services.AddScoped<IOfficeService, OfficeService>();
        services.AddScoped<ISubTypeOfUseService, SubTypeOfUseService>();
        services.AddScoped<ITypeOfUseService, TypeOfUseService>();
        services.AddScoped<ITypeOfUseCategoryService, TypeOfUseCategoryService>();
        services.AddScoped<ITypeOfUseByPropertyTypeService, TypeOfUseByPropertyTypeService>();
        services.AddScoped<ITypeOfUseGroupService, TypeOfUseGroupService>();
        services.AddScoped<IDepreciationService, DepreciationService>();
        services.AddScoped<IWardService, WardService>();
        services.AddScoped<IOldWardMasterService, OldWardMasterService>();
        services.AddScoped<IOldZoneMasterService, OldZoneMasterService>();
        services.AddScoped<IPropertyDashboardService, PropertyDashboardService>();

        // GIS Engine Master Services
        services.AddScoped<IGisCorporationConfigService, GisCorporationConfigService>();
        services.AddScoped<IGisDepartmentUserAccessService, GisDepartmentUserAccessService>();
        services.AddScoped<IGisLayerMasterService, GisLayerMasterService>();
        services.AddScoped<IGisKpiMasterService, GisKpiMasterService>();
        services.AddScoped<IGisDepartmentKpiMappingService, GisDepartmentKpiMappingService>();
        services.AddScoped<IGisFilterMasterService, GisFilterMasterService>();
        services.AddScoped<IGisDepartmentFilterMappingService, GisDepartmentFilterMappingService>();
        services.AddScoped<IGisUploadHistoryService, GisUploadHistoryService>();

        // GIS Engine Core & Asset Services
        services.AddScoped<NtisPlatform.Application.Interfaces.GIS.IGisStyleConfigService, NtisPlatform.Application.Services.GIS.GisStyleConfigService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.GIS.IGisAssetTileService, NtisPlatform.Application.Services.GIS.GisAssetTileService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.GIS.IGisAssetUploadService, NtisPlatform.Application.Services.GIS.Asset.GisAssetUploadService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.GIS.IGisAssetKpiService, NtisPlatform.Application.Services.GIS.Asset.GisAssetKpiService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.GIS.IGisAssetFilterService, NtisPlatform.Application.Services.GIS.Asset.GisAssetFilterService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.GIS.IGisAssetPopupService, NtisPlatform.Application.Services.GIS.Asset.GisAssetPopupService>();

        // Retrospective Tax Rule Engine
        services.AddScoped<IEvidenceTypeMasterService, EvidenceTypeMasterService>();
        services.AddScoped<IRetrospectiveRuleMasterService, RetrospectiveRuleMasterService>();
        services.AddScoped<IRetrospectiveTaxPolicyService, RetrospectiveTaxPolicyService>();
        services.AddScoped<IRetrospectiveRuleEvidenceConditionService, RetrospectiveRuleEvidenceConditionService>();
        services.AddScoped<IRetrospectiveRuleDateConditionService, RetrospectiveRuleDateConditionService>();
        services.AddScoped<IRetrospectiveRuleActionService, RetrospectiveRuleActionService>();
        services.AddScoped<IRetrospectivePenaltyRuleService, RetrospectivePenaltyRuleService>();
        services.AddScoped<IRetrospectiveRuleSummaryService, RetrospectiveRuleSummaryService>();
        services.AddScoped<IRetrospectiveTaxCalculationService, RetrospectiveTaxCalculationService>();
        services.AddScoped<IRetrospectiveCalculationEvidenceService, RetrospectiveCalculationEvidenceService>();
        services.AddScoped<IRetrospectiveTaxCalculationDetailService, RetrospectiveTaxCalculationDetailService>();
        services.AddScoped<IRetrospectiveRuleAuditLogService, RetrospectiveRuleAuditLogService>();
        services.AddScoped<IRuleLibraryService, RuleLibraryService>();
        // The engine, the refresher every RV recalculation goes through (the RV endpoint, the certificate pipelines, the
        // apartment room sync, combine, the Add Tax job: RV, then the engine, under the property's retrospective lock), the
        // policy-code lookup the engine needs and the cross-process database lock that keeps two hosts from calculating one
        // property at once. The lock is mandatory: a host without the connection string it needs fails here, at start-up.
        // The Worker registers the same set (AddRetrospectiveTaxEngine), so the hosts cannot drift apart.
        services.AddRetrospectiveTaxEngine(configuration);
        services.AddScoped<ITaxZoningRangeService, TaxZoningRangeService>();
        services.AddScoped<IULBDocumentService, ULBDocumentService>();
        services.AddScoped<IULBDocumentQueryService, ULBDocumentQueryService>();
        services.AddScoped<IULBDocumentTypeService, ULBDocumentTypeService>();
        services.AddScoped<IAliasMasterService, AliasMasterService>();
        services.AddScoped<IBankMasterService, BankMasterService>();
        services.AddScoped<IPropertyWorkflowStageMasterService, PropertyWorkflowStageMasterService>();
        services.AddScoped<IPropertyRuleEvaluationMasterService, PropertyRuleEvaluationMasterService>();
        services.AddScoped<IZoneService, ZoneService>();
        services.AddScoped<IRateSectionService, RateSectionService>();
        services.AddScoped<IRateSectionDetailsService, RateSectionDetailsService>();
        services.AddScoped<IAssessmentYearRangeService, AssessmentYearRangeService>();
        services.AddScoped<IScreenMasterService, ScreenMasterService>();
        services.AddScoped<IAssessmentYearRangeCVService, AssessmentYearRangeCVService>();
        services.AddScoped<IActiveTaxesService, ActiveTaxesService>();
        services.AddScoped<IUlbImageMasterService, UlbImageMasterService>();
        services.AddScoped<IFloorFactorCVMasterService, FloorFactorCVMasterService>();
        services.AddScoped<INatureFactorCVMasterService, NatureFactorCVMasterService>();
        services.AddScoped<IUseFactorCVMasterService, UseFactorCVMasterService>();
        services.AddScoped<IAgeFactorCVMasterService, AgeFactorCVMasterService>();
        services.AddScoped<IDepartmentLicenceDetailsService, DepartmentLicenceDetailsService>();
        services.AddScoped<IDepartmentPortalConfigurationService, DepartmentPortalConfigurationService>();
        services.AddScoped<IScreenGroupMasterService, ScreenGroupMasterService>();
        services.AddScoped<IRoleWiseScreenAccessMasterService, RoleWiseScreenAccessMasterService>();
        services.AddScoped<IDesignationMasterService, DesignationMasterService>();
        services.AddScoped<IPropertyAggregateRepository, PropertyAggregateRepository>();
        services.AddScoped<IPropertyMutationInvariantPolicy, PropertyMutationInvariantPolicy>();
        services.AddScoped<PropertyApiExceptionFilter>();
        services.AddScoped<IPropertyService, PropertyService>();
        services.AddScoped<IBuilding3DViewService, Building3DViewService>();
        services.AddScoped<IPropertySurveyService, PropertySurveyService>();
        services.AddScoped<IPropertyVisitTrackerService, PropertySurveyService>();
        services.AddScoped<IPropertyBasicDetailsService, PropertyBasicDetailsService>();
        services.AddScoped<IPropertyKycService, PropertyKycService>();
        services.AddScoped<IPropertyIndividualService, PropertyIndividualService>();
        services.AddScoped<IPropertyBulkUpdateService, PropertyBulkUpdateService>();
        services.AddScoped<IPropertySocietyService, PropertySocietyService>();
        services.AddScoped<IPropertyDiscountService, PropertyDiscountService>();
        services.AddScoped<IPropertyOldDetailsService, PropertyOldDetailsService>();
        services.AddScoped<IPropertySearchService, PropertySearchService>();
        services.AddScoped<ISection129Service, Section129Service>();
        services.AddScoped<IPropertyAmenityService, PropertyAmenityService>();
        services.AddScoped<IPropertyWorkflowDetailsService, PropertyWorkflowDetailsService>();
        services.AddScoped<IApartmentQCService, ApartmentQCService>();
        services.AddScoped<ApartmentQcTopSectionPerformanceCalculator>();
        services.AddScoped<IApartmentQcTopSectionService, ApartmentQcTopSectionService>();
        services.AddScoped<IApartmentTaxDetailsService, ApartmentTaxDetailsService>();
        services.AddScoped<IApartmentQcTopSectionBelowFlexService, ApartmentQcTopSectionBelowFlexService>();
        services.AddScoped<IApartmentQcCertificateGridService, ApartmentQcCertificateGridService>();
        services.AddScoped<IApartmentQcSearchService, ApartmentQcSearchService>();
        services.AddSingleton<IApartmentSortOrderCache, ApartmentSortOrderCache>();
        services.AddScoped<IGetApartmentDetailsWingWiseService, GetApartmentDetailsWingWiseService>();
        services.AddScoped<IOwnerTypeService, OwnerTypeService>();
        services.AddScoped<IOwnerTitleService, OwnerTitleService>();
        services.AddScoped<ISocialAttributeService, SocialAttributeService>();
        services.AddScoped<IPropertySocialDetailsService, PropertySocialDetailsService>();
        services.AddScoped<IPolicyMastService, PolicyMastService>();
        services.AddScoped<IAutomationDashboardService, AutomationDashboardService>();
        services.AddScoped<IGeoSequencingStageService, GeoSequencingStageService>();
        services.AddScoped<IInternalSurveyStageService, InternalSurveyStageService>();
        services.AddScoped<IDataEntryStageService, DataEntryStageService>();
        services.AddScoped<IAssessmentStageService, AssessmentStageService>();
        services.AddScoped<IMissingDetailsService, MissingDetailsService>();
        services.AddScoped<IWingWiseDetailsService, WingWiseDetailsService>();

        // Property Sign-off Module
        services.AddScoped<IPropertySignatureService, PropertySignatureService>();


        // Application Settings (GSMS)
        services.AddScoped<IApplicationSettingService, ApplicationSettingService>();

        // Localization (DB-backed)
        services.AddScoped<IModuleMasterService, ModuleMasterService>();
        services.AddScoped<IDepartmentMasterService, DepartmentMasterService>();
        // Municipal Payroll (PRMS) - Batch 1 Masters
        services.AddScoped<IPayrollDepartmentMasterService, PayrollDepartmentMasterService>();
        services.AddScoped<IPayrollDesignationMasterService, PayrollDesignationMasterService>();
        services.AddScoped<IPayrollEmployeeClassMasterService, PayrollEmployeeClassMasterService>();
        services.AddScoped<IPayrollEmployeeStatusMasterService, PayrollEmployeeStatusMasterService>();
        services.AddScoped<IPayrollEmployeeTypeMasterService, PayrollEmployeeTypeMasterService>();

        // Municipal Payroll (PRMS) - Batch 2 Masters
        services.AddScoped<IPayrollBloodGroupMasterService, PayrollBloodGroupMasterService>();
        services.AddScoped<IPayrollGenderMasterService, PayrollGenderMasterService>();
        services.AddScoped<IPayrollMaritalStatusMasterService, PayrollMaritalStatusMasterService>();
        services.AddScoped<IPayrollQualificationMasterService, PayrollQualificationMasterService>();
        services.AddScoped<IPayrollRelationshipMasterService, PayrollRelationshipMasterService>();

        // Municipal Payroll (PRMS) - Geographic Masters
        services.AddScoped<IPayrollStateMasterService, PayrollStateMasterService>();
        services.AddScoped<IPayrollDistrictMasterService, PayrollDistrictMasterService>();
        services.AddScoped<IPayrollTalukaMasterService, PayrollTalukaMasterService>();
        services.AddScoped<IPayrollVillageMasterService, PayrollVillageMasterService>();
        services.AddScoped<IPayrollZoneDivisionMasterService, PayrollZoneDivisionMasterService>();
        services.AddScoped<IGrievanceCategoryService, GrievanceCategoryService>();
        services.AddScoped<IPropertyCategoryService, PropertyCategoryService>();
        services.AddScoped<IConfigCategoryMasterService, ConfigCategoryMasterService>();
        services.AddScoped<IPropertyTypeCategoryService, PropertyTypeCategoryService>();
        services.AddScoped<IPropertyTypeMasterService, PropertyTypeMasterService>();
        services.AddScoped<IPropertyPhotoTypeService, PropertyPhotoTypeService>();
        services.AddScoped<IBHKMasterService, BHKMasterService>();
        services.AddScoped<IPropertyCertificateTypeService, PropertyCertificateTypeService>();
        services.AddScoped<IConfigKeyMasterService, ConfigKeyMasterService>();
        services.AddScoped<IConfigValueMasterService, ConfigValueMasterService>();
        services.AddScoped<IWingService, WingService>();
        services.AddScoped<IFloorGroupService, FloorGroupService>();
        services.AddScoped<IFLatGenerationGroupMasterService, FLatGenerationGroupMasterService>();
        services.AddScoped<ITypeOfUseGroupCVService, TypeOfUseGroupCVService>();
        services.AddScoped<ISubZoneDetailsForCVService, SubZoneDetailsForCVService>();
        services.AddScoped<IBulkUpdateFieldConfigService, BulkUpdateFieldConfigService>();
        services.AddScoped<IBulkUpdateMasterService, BulkUpdateMasterService>();
        services.AddScoped<IPropertyWorkflowStageMasterService, PropertyWorkflowStageMasterService>();

        services.AddScoped<IDataEntryService, DataEntryService>();
        services.AddScoped<IDataEntrySameAsService, DataEntrySameAsService>();
        services.AddScoped<IVirtualPropertyTransferHistoryService, VirtualPropertyTransferHistoryService>();
        services.AddScoped<IPropertyReassessmentService, PropertyReassessmentService>();
        services.AddScoped<IPropertyRevisionService,
                           NtisPlatform.Application.Services.PropertyRevision.PropertyRevisionService>();
        services.AddScoped<IRetrospectiveTaxService, RetrospectiveTaxService>();
        services.AddScoped<IRenterDetailService, RenterDetailService>();
        services.AddScoped<IRenterMastService, RenterMastService>();
        services.AddScoped<IRoomWiseMinusService, RoomWiseMinusService>();

        services.AddScoped<IRoomWiseSubmissionDetailsService, RoomWiseSubmissionDetailsService>();



        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUserScreenAccessService, UserScreenAccessService>();
        services.AddScoped<IUserDepartmentAllocationService, UserDepartmentAllocationService>();
        services.AddScoped<IEmployeeType, EmployeeTypeService>();
        services.AddScoped<IPasswordGeneratorService, PasswordGeneratorService>();

        services.AddScoped<IPropertyDescriptionAndTypeOfUseValidationService, PropertyDescriptionAndTypeOfUseValidationService>();
        services.AddScoped<IBlockMasterService, BlockMasterService>();
        services.AddScoped<IReferenceValidationService, ReferenceValidationService>();
        services.AddScoped<IRuleScopeService, RuleScopeService>();
        services.AddScoped<IRuleCategoryService, RuleCategoryService>();
        services.AddScoped<IRuleEffectTypeService, RuleEffectTypeService>();
        services.AddScoped<IRuleOperatorService, RuleOperatorService>();

        services.AddScoped<IGenderMasterService, GenderMasterService>();
        services.AddScoped<IVillageMasterService, VillageMasterService>();
        services.AddScoped<ISocietyDetailsService, SocietyDetailsService>();
        services.AddScoped<ISocietyWingDetailsService, SocietyWingDetailsService>();
        services.AddScoped<IFlatService, FlatService>();
        services.AddScoped<ICommonRemarkTypeMasterService, CommonRemarkTypeMasterService>();
        services.AddScoped<ICommonRemarkDetailsService, CommonRemarkDetailsService>();
        services.AddScoped<IPropertyMapMasterService, PropertyMapMasterService>();

        // Water Connection Services
        services.AddScoped<IWaterConnectionTypeService, WaterConnectionTypeService>();
        services.AddScoped<IWaterConnectionSizeService, WaterConnectionSizeService>();
        services.AddScoped<IWaterConnectionStatusService, WaterConnectionStatusService>();
        services.AddScoped<IWaterRateMasterService, WaterRateMasterService>();
        services.AddScoped<IWaterConnectionService, WaterConnectionService>();
        services.AddScoped<IWaterConnectionDetailsService, WaterConnectionDetailsService>();

        // Water Bill Services

        services.AddScoped<IBillingFrequencyMasterService, BillingFrequencyMasterService>();
        services.AddScoped<IBillingPeriodService, BillingPeriodService>();
        services.AddScoped<IConnectionTypeMasterService, ConnectionTypeMasterService>();
        services.AddScoped<ICitizenServiceService, CitizenServiceService>();
        services.AddScoped<IPortalContentService, PortalContentService>();
        services.AddScoped<ITariffMasterService, TariffMasterService>();
        services.AddScoped<ITariffSlabDetailService, TariffSlabDetailService>();
        services.AddScoped<ITariffChargeDetailService, TariffChargeDetailService>();
        services.AddScoped<IChargeHeadMasterService, ChargeHeadMasterService>();
        services.AddScoped<IConnectionCategoryMasterService, ConnectionCategoryMasterService>();
        services.AddScoped<ITapSizeMasterService, TapSizeMasterService>();
        services.AddScoped<IMeterTypeMasterService, MeterTypeMasterService>();
        services.AddScoped<IReadingSourceMasterService, ReadingSourceMasterService>();
        services.AddScoped<IMeterTestStatusMasterService, MeterTestStatusMasterService>();
        services.AddScoped<IGeographyTypeMasterService, GeographyTypeMasterService>();
        services.AddScoped<IGeographyUnitService, GeographyUnitService>();
        services.AddScoped<IWaterPenaltyRuleValidationService, WaterPenaltyRuleValidationService>();
        services.AddScoped<IWaterPenaltyRuleService, WaterPenaltyRuleService>();

        services.AddScoped<IPropertyAssessmentStatusService, PropertyAssessmentStatusService>();
        services.AddScoped<IRoomTypeMasterService, RoomTypeMasterService>();
        services.AddScoped<IAssetCategoryService, AssetCategoryService>();
        services.AddScoped<IAssetTypeService, AssetTypeService>();
        services.AddScoped<IOwnershipTypeService, OwnershipTypeService>();
        services.AddScoped<IOwningDepartmentService, OwningDepartmentService>();
        //Asset Start
        services.AddScoped<IAssetMasterService, AssetMasterService>();
        services.AddScoped<IAssetCapitalValueService, AssetCapitalValueService>();
        services.AddScoped<IInventoryItemCategoryService, InventoryItemCategoryService>();
        services.AddScoped<IInventoryItemNameService, InventoryItemNameService>();
        services.AddScoped<IInventoryItemModelService, InventoryItemModelService>();
        services.AddScoped<IScreenService, ScreenService>();
        services.AddScoped<IScreenFormSectionMasterService, ScreenFormSectionMasterService>();
        services.AddScoped<IScreenFormFieldMasterService, ScreenFormFieldMasterService>();
        services.AddScoped<IAssetAgeFactorCVService, AssetAgeFactorCVService>();
        services.AddScoped<IAssetNatureFactorCVService, AssetNatureFactorCVService>();
        services.AddScoped<IAssetUseFactorCVService, AssetUseFactorCVService>();
        services.AddScoped<IAssetAssessmentYearRangeCVService, AssetAssessmentYearRangeCVService>();
        services.AddScoped<IAssetDesignationService, AssetDesignationService>();
        services.AddScoped<IAssetApplicationTypeService, AssetApplicationTypeService>();
        services.AddScoped<IAssetConditionMasterService, AssetConditionMasterService>();
        services.AddScoped<IAssetRoomTypeMasterService, AssetRoomTypeService>();
        services.AddScoped<IManageSubUnitsService, ManageSubUnitsService>();
        services.AddScoped<IAssetUserAllocationService, AssetUserAllocationService>();
        services.AddScoped<ISubUnitsDetailsService, SubUnitsDetailsService>();
        services.AddScoped<IAssetLeaseRentDetailsService, AssetLeaseRentDetailsService>();
        services.AddScoped<IAssetCounterPaymentService, AssetCounterPaymentService>();
        services.AddScoped<ILeaseRentBillingService, LeaseRentBillingService>();
        services.AddScoped<ILeaseRentNumberGenerator, LeaseRentNumberGenerator>();



        // Rules namespace registrations
        services.AddScoped<IRuleFieldsService, RuleFieldsService>();
        services.AddScoped<IRuleEngineService, RuleEngineService>();
        services.AddScoped<IPropertyRuleApplicationLogService, PropertyRuleApplicationLogService>();
        services.AddScoped<IFieldConfigurationService, FieldConfigurationService>();
        services.AddScoped<IRuleApplierService, RuleApplierService>();
        services.AddScoped<IPropertyFieldFlattenerService, PropertyFieldFlattenerService>();
        services.AddScoped<IPropertyContextLoaderService, PropertyContextLoaderService>();
        services.AddScoped<IAssetDocumentDefinitionService, AssetDocumentDefinitionService>();
        services.AddScoped<IAssetFieldDefinitionService, AssetFieldDefinitionService>();
        services.AddScoped<IAssetAuthorityMasterService, AssetAuthorityMasterService>();
        services.AddScoped<IAssetOrganizationMasterService, AssetOrganizationMasterService>();
        services.AddScoped<IGSTService, GSTService>();
        services.AddScoped<IPenaltyRuleService, PenaltyRuleService>();
        services.AddScoped<IAssetMoujaService, AssetMoujaService>();
        services.AddScoped<IAssetSubZoneDetailsForCVService, AssetSubZoneDetailsForCVService>();
        services.AddScoped<IAssetTypeOfUseGroupService, AssetTypeOfUseGroupService>();
        services.AddScoped<IAssetTypeOfUseService, AssetTypeOfUseService>();
        services.AddScoped<IAssetSubTypeOfUseService, AssetSubTypeOfUseService>();
        services.AddScoped<IAssetFloorFactorCVService, AssetFloorFactorCVService>();
        services.AddScoped<IAssetPhotoTypeService, AssetPhotoTypeService>();
        services.AddScoped<IAssetRentDocumentTypeService, AssetRentDocumentTypeService>();
        services.AddScoped<IInventoryDocumentTypeService, InventoryDocumentTypeService>();
        services.AddScoped<IAssetGrievanceCategoryService, AssetGrievanceCategoryService>();
        services.AddScoped<IAssetGrievanceRemarkService, AssetGrievanceRemarkService>();
        services.AddScoped<IDocumentBindingHandler, AssetGrievanceDocumentBindingHandler>();
        services.AddScoped<IAssetGrievanceDocumentTypeService, AssetGrievanceDocumentTypeService>();
        services.AddScoped<IAssetGrievanceDocumentApplicationService, AssetGrievanceDocumentApplicationService>();
        services.AddScoped<IAssetGrievanceDetailsService, AssetGrievanceDetailsService>();
        services.AddScoped<IGrievanceWorkflowStageMasterService, GrievanceWorkflowStageMasterService>();
        services.AddScoped<IGrievanceStageAccessControlService, GrievanceStageAccessControlService>();
        services.AddScoped<IAssetGrievanceCorrectionApplier, AssetLeaseRentDetailsGrievanceCorrectionApplier>();
        services.AddScoped<IAssetGrievanceCorrectionApplier, AssetSubUnitsDetailsGrievanceCorrectionApplier>();
        services.AddScoped<IAssetGrievanceMediaCorrectionApplier, AssetPhotoGrievanceMediaCorrectionApplier>();
        services.AddScoped<IAssetGrievanceMediaCorrectionApplier, AssetDocumentGrievanceMediaCorrectionApplier>();
        // Rule Execution Service - Scoped to match IRepository lifetime (DbContext safety)
        // IMemoryCache is singleton and thread-safe, so cache is still shared across all requests
        // Effect applicators are stateless, safe as singleton for better performance
        services.AddScoped<IRuleExecutionService, RuleExecutionService>();
        services.AddSingleton<IRuleEffectApplicator, DecreasePercentApplicator>();
        services.AddSingleton<IRuleEffectApplicator, IncreasePercentApplicator>();
        services.AddSingleton<IRuleEffectApplicator, MultiplyApplicator>();
        services.AddSingleton<IRuleEffectApplicator, OverrideApplicator>();
        services.AddSingleton<IRuleEffectApplicator, ExemptionApplicator>();
        // RateLookupApplicator is Scoped because it depends on IRepository (DbContext-bound)
        services.AddScoped<IRuleEffectApplicator, RateLookupApplicator>();
        // Stateless, dependency-free — safe as singleton, matching the effect applicators above.
        services.AddSingleton<IConditionRuleEvaluator, ConditionRuleEvaluator>();
        services.AddScoped<ITaxMasterService, TaxMasterService>();
        services.AddScoped<IDynamicTaxRuleService, DynamicTaxRuleService>();
        services.AddScoped<IMasterBasedTaxService, MasterBasedTaxService>();
        services.AddScoped<ITaxConditionRuleService, TaxConditionRuleService>();
        services.AddScoped<IDynamicTaxRegisterService, DynamicTaxRegisterService>();
        services.AddScoped<ITaxCalculationModeService, TaxCalculationModeService>();
        services.AddScoped<IValueBasedTaxService, ValueBasedTaxService>();
        services.AddScoped<IHybridTaxService, HybridTaxService>();
        // Bridges the Dynamic Tax Register's configuration into the live RV calculation pipeline.
        services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.IDynamicTaxConfigReader,
            NtisPlatform.Application.Services.TaxEngine.DynamicTax.DynamicTaxConfigReader>();
        services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.IDynamicTaxAmountResolver,
            NtisPlatform.Application.Services.TaxEngine.DynamicTax.DynamicTaxAmountResolver>();
        services.AddScoped<IRateableValueCalculatorService, RateableValueCalculatorService>();
        services.AddScoped<IRVCalculationCleanupService, RVCalculationCleanupService>();
        services.AddScoped<ITaxApplicabilityService, TaxApplicabilityService>();
        services.AddScoped<NtisPlatform.Application.Interfaces.TaxEngine.IHistoricalNetTaxBaselineService, NtisPlatform.Application.Services.TaxEngine.HistoricalNetTaxBaselineService>();

        // Report Services
        // Singleton cache + hosted warmup (same instance used for both DI injection and startup warmup)
        services.AddSingleton<ReportDefinitionCacheService>();
        services.AddSingleton<ReportDefinitionCacheWarmupService>();
        services.AddHostedService(sp => sp.GetRequiredService<ReportDefinitionCacheWarmupService>());
        // Report catalogue CRUD services write to the report database, so they receive a
        // ReportingDbContext-backed IUnitOfWork (the same scoped context their repository resolves,
        // so tracked changes are persisted). The repository comes from the closed-generic
        // registrations above.
        services.AddScoped<IReportDefinitionService>(sp => new ReportDefinitionService(
            sp.GetRequiredService<IRepository<NtisPlatform.Core.Entities.Master.ReportDefinitionEntity, int>>(),
            new ReportDbUnitOfWork(sp.GetRequiredService<ReportingDbContext>()),
            sp.GetRequiredService<IMapper>(),
            sp.GetRequiredService<ICurrentTenantService>()));
        services.AddScoped<IReportParameterDefinitionService>(sp => new ReportParameterDefinitionService(
            sp.GetRequiredService<IRepository<NtisPlatform.Core.Entities.Master.ReportParameterDefinitionEntity, int>>(),
            new ReportDbUnitOfWork(sp.GetRequiredService<ReportingDbContext>()),
            sp.GetRequiredService<IMapper>(),
            sp.GetRequiredService<IRepository<NtisPlatform.Core.Entities.Master.ReportDefinitionEntity, int>>(),
            sp.GetRequiredService<ICurrentTenantService>()));
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
        services.AddSingleton<Ntis.Reporting.Rendering.Html.IHtmlTemplateRenderer, Ntis.Reporting.Rendering.Html.HtmlTemplateRenderer>();
        services.AddSingleton<Ntis.Reporting.Rendering.Pdf.IPdfRenderer>(sp => new Ntis.Reporting.Rendering.Pdf.PlaywrightPdfRenderer(maximumConcurrency: 2));
        services.AddScoped<IHtmlReportService, HtmlReportService>();
        // Read-only lookup for report module name/logo (GetAll/GetById only — modules are
        // managed exclusively through the report-admin tool). Same ReportingDbContext-backed
        // IUnitOfWork wiring as ReportDefinitionService/ReportParameterDefinitionService above.
        services.AddScoped<IReportModuleService>(sp => new ReportModuleService(
            sp.GetRequiredService<IRepository<NtisPlatform.Core.Entities.Master.ReportModuleEntity, int>>(),
            new ReportDbUnitOfWork(sp.GetRequiredService<ReportingDbContext>()),
            sp.GetRequiredService<IMapper>()));
        // No job-enqueuer here: the platform only inserts Pending rows into dbo.ReportRequest. The
        // ntis-report worker polls for them and enqueues/renders itself, so the two repos share only
        // the database (no cross-repo Hangfire job-contract assembly).
        // Async reporting options (token lifetimes, page sizes, lease, retries)
        services.Configure<NtisPlatform.Application.Options.ReportingOptions>(
            configuration.GetSection(NtisPlatform.Application.Options.ReportingOptions.Section));
        // Data providers — one per report type; add new reports here
        services.AddScoped<IReportDataProvider, NoticeNewDataProvider>();
        services.AddScoped<IReportDataProvider, NoDueCertificateDataProvider>();
        services.AddScoped<IReportDataProvider, KarakarniDataProvider>();
        services.AddScoped<IReportDataProvider, SpecialNoticeThaneDataProvider>();
        services.AddScoped<IReportDataProvider, FrontpageThaneDataProvider>();
        services.AddScoped<IReportDataProvider, SignpageThaneDataProvider>();
        services.AddScoped<IReportDataProvider, JaptiNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, WarrentNoticeDataProvider>();
        services.AddScoped<IReportDataProvider, SpotSurveyFormDataProvider>();
        services.AddScoped<IReportDataProvider, SpecialNoticeDataProvider>();
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
        services.AddScoped<IPropertyMappingService, PropertyMappingService>();
        services.AddScoped<IPropertyMergeService, PropertyMergeService>();
        services.AddScoped<IPropertyMergeSingleService, PropertyMergeSingleService>();
        services.AddScoped<IPropertySplitService, PropertySplitService>();
        services.AddScoped<IPropertyBulkMergeService, PropertyBulkMergeService>();
        services.AddScoped<IPropertyChangeCategoryService, PropertyChangeCategoryService>();
        services.AddScoped<IPropertyNumberDetailsService, PropertyNumberDetailsService>();
        services.AddScoped<IApartmentDashboardService, ApartmentDashboardService>();
        services.AddScoped<IPropertySocialDetailsBulkService, PropertySocialDetailsBulkService>();
        services.AddScoped<IScreenFieldValidationService, ScreenFieldValidationService>();
        services.AddScoped<IDeleteFlatService, DeleteFlatService>();

        // Fire Audit Services
        services.AddScoped<IJurisdictionOverlayMasterService, JurisdictionOverlayMasterService>();

        // Grievance Services
        services.AddScoped<IGrievanceApplicationService, GrievanceApplicationService>();
        services.AddScoped<IGrievanceDepartmentService, GrievanceDepartmentService>();
        services.AddScoped<IGrievanceTypeService, GrievanceTypeService>();
        services.AddScoped<IGrievanceWorkflowService, GrievanceWorkflowService>();
        services.AddScoped<IGrievanceWorkflowStateService, GrievanceWorkflowStateService>();
        services.AddScoped<IGrievanceWorkflowTransitionService, GrievanceWorkflowTransitionService>();
        services.AddScoped<IGrievanceDeptForwardingService, GrievanceDeptForwardingService>();
        services.AddScoped<IGrievanceActivityLogService, GrievanceActivityLogService>();
        services.AddScoped<ICitizenMasterService, CitizenMasterService>();
        services.AddScoped<ICitizenAuthService, CitizenAuthService>();
        services.AddScoped<IGrievancePhotoTypeService, GrievancePhotoTypeService>();
        services.AddScoped<IGrievancePhotoService, GrievancePhotoService>();
        services.AddScoped<IPublicDashboardService, PublicDashboardService>();
        services.AddHttpClient<IGeminiAiService, GeminiAiService>();
        services.AddScoped<IGrievanceEscalationService, GrievanceEscalationService>();
		services.AddScoped<IDocumentBindingHandler, GrievancePhotoDocumentBindingHandler>();
		services.AddScoped<IPropertySurveyDashboardService, PropertySurveyDashboardService>();

        // Universal WhatsApp Subsystem (Transport Client, Payload Formatter, Template Builders & Grievance Notification Service)
        services.Configure<WhatsAppSettings>(configuration.GetSection(WhatsAppSettings.SectionName));
        services.AddSingleton<IWhatsAppPayloadFormatter, CrmWabaPayloadFormatter>();
        services.AddSingleton<IWhatsAppTemplateBuilder<NtisPlatform.Core.Entities.GrievanceEntities.GrievanceApplicationEntity>, GrievanceSubmissionTemplate>();
        services.AddHttpClient<IWhatsAppClient, WhatsAppClient>((sp, client) =>
        {
            var wpSettings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<WhatsAppSettings>>().Value;
            var timeoutSec = wpSettings.TimeoutSeconds > 0 ? wpSettings.TimeoutSeconds : 15;
            client.Timeout = TimeSpan.FromSeconds(timeoutSec);
        });
        services.AddScoped<IGrievanceWhatsAppNotificationService>(sp =>
            new GrievanceWhatsAppNotificationService(
                sp.GetRequiredService<IWhatsAppClient>(),
                sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<WhatsAppSettings>>(),
                sp.GetRequiredService<IWhatsAppTemplateBuilder<NtisPlatform.Core.Entities.GrievanceEntities.GrievanceApplicationEntity>>(),
                sp.GetRequiredService<ILogger<GrievanceWhatsAppNotificationService>>(),
                sp.GetRequiredService<ApplicationDbContext>(),
                sp.GetService<Microsoft.Extensions.Caching.Memory.IMemoryCache>()
            ));
        
		
        // AutoMapper
        services.AddSingleton<IMapper>(mapperConfig.CreateMapper());
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "NTIS Platform API",
                Version = "v1",
                Description = "Enterprise-grade .NET API with clean architecture\n\n" +
                              "**To test authorized endpoints:**\n" +
                              "1. Use /api/auth/login endpoint to get JWT token\n" +
                              "2. Click the 'Authorize' button (??) at top right\n" +
                              "3. Enter: Bearer YOUR_JWT_TOKEN\n" +
                              "4. Click 'Authorize' then 'Close'\n" +
                              "5. Test your protected endpoints",
                Contact = new OpenApiContact { Name = "NTIS Platform Team" }
            });

            // Enable Swagger schema support for C# non-nullable reference types
            options.SupportNonNullableReferenceTypes();

            // Enable JWT Bearer authentication in Swagger UI - Adds "Authorize" button
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and your token. Example: \"Bearer eyJhbGc...\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
            // Fixes Swagger UI showing multi-file parameters (List<IFormFile> etc.) as repeated
            // single-file pickers with an "Add string item" button, instead of one native
            // multi-select file input.
            options.OperationFilter<MultiFileUploadOperationFilter>();

        });

        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.SetIsOriginAllowed(_ => true)
                      .AllowAnyMethod()
                      .AllowAnyHeader();
                // Note: AllowCredentials removed - tokens are sent in Authorization header only
            });

            // SignalR hub CORS: needs AllowCredentials for the HTTP negotiation handshake.
            options.AddPolicy("HubCors", policy =>
            {
                policy.SetIsOriginAllowed(_ => true)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        services.AddSignalR();

        // Data Protection - used to encrypt TOTP shared secrets at rest (never hashed, since they
        // must remain decryptable to validate future authenticator codes).
        var dataProtectionKeysFolder = configuration.GetValue<string>("DataProtection:KeyDirectory")
            ?? Path.Combine(AppContext.BaseDirectory, "DataProtection-Keys");

        if (!Directory.Exists(dataProtectionKeysFolder))
        {
            Directory.CreateDirectory(dataProtectionKeysFolder);
        }

        services.AddDataProtection()
            .SetApplicationName("NtisPlatform")
            .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysFolder));

        // JWT Authentication - Validate JWT Key
        var jwtKey = configuration.GetValue<string>("Jwt:Key");

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException(
                "JWT Key is not configured or is empty. " +
                "Please configure Jwt:Key in user-secrets (development), " +
                "environment variables (production), or Azure Key Vault. " +
                "Example: dotnet user-secrets set 'Jwt:Key' 'your-secret-key-min-32-bytes'");
        }

        // Reject known insecure placeholder values
        var insecurePlaceholders = new[]
        {
            "MUST_BE_SET_IN_SECURE_CONFIG_SOURCE",
            "YourSuperSecretKeyHere_ChangeThisInProduction_MustBeAtLeast32Characters",
            "your-secret-key-here",
            "change-me-in-production",
            "placeholder",
            "secret",
            "supersecret"
        };

        var jwtKeyNormalized = jwtKey.Trim();
        if (insecurePlaceholders.Any(p => string.Equals(jwtKeyNormalized, p, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException(
                "JWT Key appears to be a placeholder value and is not secure. " +
                "Do not use placeholder or example keys in any environment. " +
                "Generate a cryptographically secure random key using: " +
                "dotnet user-secrets set 'Jwt:Key' '$(openssl rand -base64 32)' or similar.");
        }

        // Enforce minimum key length for security (32 bytes = 256 bits) using the normalized key
        var keyBytes = Encoding.UTF8.GetBytes(jwtKeyNormalized);
        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException(
                $"JWT Key is too short ({keyBytes.Length} bytes). " +
                "Minimum 32 bytes (256 bits) required for secure HMAC-SHA256 signing. " +
                "Current key length is insufficient to prevent brute-force attacks.");
        }

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                ValidateIssuer = true,
                ValidIssuer = configuration.GetValue<string>("Jwt:Issuer"),
                ValidateAudience = true,
                ValidAudience = configuration.GetValue<string>("Jwt:Audience"),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            // Allow SignalR WebSocket connections to pass the JWT via query string.
            // WebSocket protocol doesn't support custom headers, so SignalR clients send
            // the token as ?access_token=... on the /hubs/* path only.
            options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    var token = ctx.Request.Query["access_token"];
                    if (!Microsoft.Extensions.Primitives.StringValues.IsNullOrEmpty(token) &&
                        ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    {
                        ctx.Token = token;
                    }
                    return Task.CompletedTask;
                },
                // Immediately invalidates access tokens issued before a sensitive security change
                // (2FA disable/reset rotates the user's SecurityStamp) instead of waiting for the
                // token's natural expiry. Tokens with no "sst" claim (issued before this feature
                // existed) skip the check. The current stamp is cached briefly per user to avoid
                // a database round trip on every authenticated request.
                OnTokenValidated = async ctx =>
                {
                    // Citizen tokens do not have a staff SecurityStamp in UserEntity; bypass staff stamp validation
                    if (ctx.Principal?.FindFirst("userType")?.Value == "Citizen" 
                        || ctx.Principal?.FindFirst("user_type")?.Value == "citizen" 
                        || ctx.Principal?.IsInRole("Citizen") == true)
                    {
                        return;
                    }

                    var stampClaim = ctx.Principal?.FindFirst("sst")?.Value;
                    if (string.IsNullOrEmpty(stampClaim))
                    {
                        return;
                    }

                    var userIdClaim = ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    if (!int.TryParse(userIdClaim, out var userId))
                    {
                        ctx.Fail("Token is missing a valid user identifier.");
                        return;
                    }

                    var cache = ctx.HttpContext.RequestServices.GetRequiredService<IMemoryCache>();
                    var cacheKey = $"sst:{userId}";

                    if (!cache.TryGetValue(cacheKey, out string? currentStamp))
                    {
                        var userRepository = ctx.HttpContext.RequestServices.GetRequiredService<IUserRepository>();
                        currentStamp = await userRepository.GetSecurityStampAsync(userId, ctx.HttpContext.RequestAborted);
                        // This IMemoryCache is configured with a SizeLimit (see AddMemoryCache below),
                        // which requires every entry to declare a Size — the plain Set(key, value, TimeSpan)
                        // overload omits it and throws "Cache entry must specify a value for Size...".
                        cache.Set(cacheKey, currentStamp ?? string.Empty, new Microsoft.Extensions.Caching.Memory.MemoryCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30),
                            Size = 1
                        });
                    }

                    if (string.IsNullOrEmpty(currentStamp) || !string.Equals(currentStamp, stampClaim, StringComparison.Ordinal))
                    {
                        ctx.Fail("Session has been invalidated by a security change. Please sign in again.");
                    }
                }
            };
        });

        // Authorization with fallback policy - all endpoints require authentication by default
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            // Worker data/upload/notify endpoints: valid JWT + scope=report-worker.
            options.AddPolicy("ReportWorker", policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireClaim("scope", "report-worker");
            });

            // SignalR hub: valid JWT + scope=report-hub (hub tokens carry this claim).
            options.AddPolicy("ReportHub", policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireClaim("scope", "report-hub");
            });
        });

        // Rate Limiting (ASP.NET Core 7+)
        // Only enabled if RateLimiting:Enabled is true (for production)
        var rateLimitingEnabled = configuration.GetValue<bool>("RateLimiting:Enabled", false);
        if (rateLimitingEnabled)
        {
            services.AddRateLimiter(options =>
            {
                // Read rate limiting configuration
                var globalPermitLimit = configuration.GetValue<int>("RateLimiting:Global:PermitLimit", 100);
                var globalWindowMinutes = configuration.GetValue<int>("RateLimiting:Global:WindowMinutes", 1);
                var loginPermitLimit = configuration.GetValue<int>("RateLimiting:Login:PermitLimit", 5);
                var loginWindowMinutes = configuration.GetValue<int>("RateLimiting:Login:WindowMinutes", 15);
                var uploadPermitLimit = configuration.GetValue<int>("RateLimiting:FileUpload:PermitLimit", 10);
                var uploadWindowMinutes = configuration.GetValue<int>("RateLimiting:FileUpload:WindowMinutes", 5);
                var uploadQueueLimit = configuration.GetValue<int>("RateLimiting:FileUpload:QueueLimit", 2);
                var mfaVerifyPermitLimit = configuration.GetValue<int>("RateLimiting:MfaVerify:PermitLimit", 10);
                var mfaVerifyWindowMinutes = configuration.GetValue<int>("RateLimiting:MfaVerify:WindowMinutes", 15);
                var mfaEnablePermitLimit = configuration.GetValue<int>("RateLimiting:MfaEnable:PermitLimit", 10);
                var mfaEnableWindowMinutes = configuration.GetValue<int>("RateLimiting:MfaEnable:WindowMinutes", 15);
                var forgotPasswordPermitLimit = configuration.GetValue<int>("RateLimiting:ForgotPassword:PermitLimit", 5);
                var forgotPasswordWindowMinutes = configuration.GetValue<int>("RateLimiting:ForgotPassword:WindowMinutes", 15);
                var captchaPermitLimit = configuration.GetValue<int>("RateLimiting:Captcha:PermitLimit", 15);
                var captchaWindowMinutes = configuration.GetValue<int>("RateLimiting:Captcha:WindowMinutes", 1);

                // Global default policy for all endpoints (unless overridden)
                options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    System.Threading.RateLimiting.RateLimitPartition.GetSlidingWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new System.Threading.RateLimiting.SlidingWindowRateLimiterOptions
                        {
                            PermitLimit = globalPermitLimit,
                            Window = TimeSpan.FromMinutes(globalWindowMinutes),
                            SegmentsPerWindow = 6,
                            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Stricter fixed window rate limiter for login endpoint
                options.AddPolicy("login", context =>
                    System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                        {
                            PermitLimit = loginPermitLimit,
                            Window = TimeSpan.FromMinutes(loginWindowMinutes),
                            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Forgot-password request/reset — same shape as "login": prevents both OTP-request
                // spam (which would also spam the user's inbox/phone) and reset-token brute forcing.
                options.AddPolicy("forgot-password", context =>
                    System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                        {
                            PermitLimit = forgotPasswordPermitLimit,
                            Window = TimeSpan.FromMinutes(forgotPasswordWindowMinutes),
                            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // MFA login-verification: brute forcing a 6-digit TOTP is 1-in-1,000,000 per
                // guess, so this must be tight in addition to the per-challenge attempt-count
                // lockout enforced in IMfaChallengeService itself. Partitioned by IP, same as
                // "login" — the challenge id lives in the request body, which is not available
                // to the rate limiter's partition-key resolver without buffering the request.
                options.AddPolicy("mfa-verify", context =>
                    System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                        {
                            PermitLimit = mfaVerifyPermitLimit,
                            Window = TimeSpan.FromMinutes(mfaVerifyWindowMinutes),
                            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Authenticator enable/disable/reset/regenerate — all accept a verification code,
                // so they need the same brute-force protection as login verification.
                options.AddPolicy("mfa-enable", context =>
                    System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                        factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                        {
                            PermitLimit = mfaEnablePermitLimit,
                            Window = TimeSpan.FromMinutes(mfaEnableWindowMinutes),
                            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Dedicated rate limiter for file upload endpoints
                // Prevents abuse and resource exhaustion from excessive file uploads
                options.AddPolicy("fileupload", context =>
                    System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                        factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                        {
                            PermitLimit = uploadPermitLimit,
                            Window = TimeSpan.FromMinutes(uploadWindowMinutes),
                            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                            QueueLimit = uploadQueueLimit
                        }));

                // Dedicated rate limiter for captcha generation endpoint
                // Prevents cache exhaustion and brute-force via automated requests
                options.AddPolicy("captcha", context =>
                    System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                        {
                            PermitLimit = captchaPermitLimit,
                            Window = TimeSpan.FromMinutes(captchaWindowMinutes),
                            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // On rejection, return 429 Too Many Requests
                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                    var retryAfterSeconds = context.Lease.TryGetMetadata(System.Threading.RateLimiting.MetadataName.RetryAfter, out var retryAfter)
                        ? (double?)retryAfter.TotalSeconds
                        : null;

                    await context.HttpContext.Response.WriteAsJsonAsync(new
                    {
                        error = "Too Many Requests",
                        message = "Rate limit exceeded. Please try again later.",
                        retryAfter = retryAfterSeconds
                    }, cancellationToken);
                };
            });
        }

        // P0: Caching with size limits to prevent memory leaks.
        // This IMemoryCache instance is shared app-wide (every feature that injects IMemoryCache
        // gets this same singleton) — every current consumer sets Size = 1 per entry, so SizeLimit
        // is effectively "max distinct cache keys held at once across the whole app", not a byte
        // budget. Verified consumers as of this change: the JWT security-stamp cache (one entry
        // per active user, 30s TTL — ServiceCollectionExtensions.cs), SecuritySettingsService (one
        // entry), ModuleLookupService (one entry per module-lookup key), and EmailSettingsProvider
        // (one entry). The previous limit of 100 was sized assuming a "rule category" cache that
        // does not exist anywhere in the current codebase, and it was also being shared by
        // ApartmentQcSearchRepository/PropertySearchRepository's per-ward search-suggestion caches
        // — those two now have their own isolated ISearchSuggestionCache (registered below) sized
        // for their own, much higher-cardinality key volume, so this shared cache no longer needs
        // to absorb that load. 500 gives headroom for a few hundred concurrently active users'
        // security-stamp entries plus the handful of settings/module-lookup keys, without letting
        // any single consumer's growth silently starve the others again.
        services.AddMemoryCache(options =>
        {
            options.SizeLimit = 500;
            options.CompactionPercentage = 0.25; // Remove 25% of entries when size limit reached
        });

        // Isolated cache for search-suggestion/unified-search data (see SearchSuggestionCache for
        // sizing rationale) — deliberately NOT the shared IMemoryCache above, so this feature's
        // higher-volume, per-ward/per-query keys can never compete with or evict security-stamp,
        // settings, or module-lookup entries (and vice versa).
        services.AddSingleton<NtisPlatform.Infrastructure.Caching.ISearchSuggestionCache, NtisPlatform.Infrastructure.Caching.SearchSuggestionCache>();

        services.AddResponseCaching();

        // Distributed Cache configuration: Redis if connection string configured, otherwise in-memory distributed cache
        services.AddDistributedMemoryCache();

#pragma warning disable EXTEXP0018
        services.AddHybridCache(options =>
        {
            options.MaximumPayloadBytes = 10 * 1024 * 1024; // 10MB limit per entry
            options.DefaultEntryOptions = new Microsoft.Extensions.Caching.Hybrid.HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(60),
                LocalCacheExpiration = TimeSpan.FromMinutes(15)
            };
        });
#pragma warning restore EXTEXP0018

        // Health checks
        services.AddHealthChecks();

        return services;
    }
}
