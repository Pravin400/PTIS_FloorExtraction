using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.DTOs.WhatsApp;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Infrastructure.Services.WhatsApp.NotificationHandlers;
using NtisPlatform.Infrastructure.Services.WhatsApp.Templates;
using Xunit;

namespace NtisPlatform.Tests.Application.Grievance;

public class GrievanceWhatsAppNotificationServiceTests
{
    private readonly Mock<IWhatsAppClient> _mockWhatsAppClient;
    private readonly Mock<ILogger<GrievanceWhatsAppNotificationService>> _mockLogger;
    private readonly GrievanceSubmissionTemplate _submissionTemplate;
    private readonly WhatsAppSettings _settings;

    public GrievanceWhatsAppNotificationServiceTests()
    {
        _mockWhatsAppClient = new Mock<IWhatsAppClient>();
        _mockLogger = new Mock<ILogger<GrievanceWhatsAppNotificationService>>();
        _submissionTemplate = new GrievanceSubmissionTemplate();
        _settings = new WhatsAppSettings
        {
            IsEnabled = true,
            ApiUrl = "https://crmwhatsapp.scipl.info.in/wrapper/waba/message",
            ApiKey = "wacrm_live_AVMcM_euSP50QysBeqAJ-CvEhvxJ7h6EZDiXuqMh4oQ",
            WabaNumber = "919690208040",
            DefaultCountryCode = 91,
            DefaultLanguage = "mr",
            TrackingBaseUrl = "https://grievance.scipl.info.in/en/grievance/track",
            Defaults = new WhatsAppDefaultsSettings
            {
                DefaultCitizenName = "नागरिक",
                DefaultDepartmentName = "संबंधित विभाग",
                DefaultGrievanceType = "नागरी तक्रार",
                DefaultStatus = "प्रलंबित",
                GrievancePrefix = "AMC-GRV"
            },
            Templates = new Dictionary<string, string>
            {
                ["Submission"] = "grievance_3"
            }
        };
    }

    [Fact]
    public async Task SendSubmissionNotification_WhenCitizenHasNoMobile_ReturnsFalseWithoutCallingClient()
    {
        var service = new GrievanceWhatsAppNotificationService(
            _mockWhatsAppClient.Object,
            Options.Create(_settings),
            _submissionTemplate,
            _mockLogger.Object);

        var app = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceNo = "AMC-GRV-2026-0001",
            Citizen = new CitizenMasterEntity { Id = 10, Name = "प्रथमेश", MobileNo = "" }
        };

        var result = await service.SendGrievanceSubmissionWhatsAppNotificationAsync(app);

        Assert.False(result);
        _mockWhatsAppClient.Verify(
            x => x.SendTemplateMessageAsync(It.IsAny<WhatsAppMessageRequest>(), It.IsAny<CancellationToken>()),
            Times.Never());
    }

    [Fact]
    public async Task SendSubmissionNotification_BuildsValidRequest_AndDelegatesToWhatsAppClient()
    {
        WhatsAppMessageRequest? capturedRequest = null;

        _mockWhatsAppClient
            .Setup(x => x.SendTemplateMessageAsync(It.IsAny<WhatsAppMessageRequest>(), It.IsAny<CancellationToken>()))
            .Callback<WhatsAppMessageRequest, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(WhatsAppSendResult.Success("msg-123", "wamid-456", "{}"));

        var service = new GrievanceWhatsAppNotificationService(
            _mockWhatsAppClient.Object,
            Options.Create(_settings),
            _submissionTemplate,
            _mockLogger.Object);

        var app = new GrievanceApplicationEntity
        {
            Id = 1,
            GrievanceNo = "AMC-GRV-2026-08492",
            Citizen = new CitizenMasterEntity { Id = 10, Name = "प्रथमेश", MobileNo = "9876543210" },
            GrievanceDepartment = new GrievanceDepartmentMasterEntity { Id = 2, DepartmentName = "Road Department", DepartmentNameLocal = "रस्ते व वाहतूक विभाग" },
            GrievanceType = new GrievanceTypeMasterEntity { Id = 5, GrievanceType = "रस्त्यावरील खड्डे दुरुस्ती" },
            CurrentState = new GrievanceWorkflowStateEntity { Id = 1, StateName = "Registered", StateNameLocal = "नोंदणीकृत" },
            SubmittedDate = new DateTime(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc)
        };

        var result = await service.SendGrievanceSubmissionWhatsAppNotificationAsync(app);

        Assert.True(result);
        Assert.NotNull(capturedRequest);
        Assert.Equal("9876543210", capturedRequest.MobileNo);
        Assert.Equal("grievance_3", capturedRequest.TemplateName);
        Assert.Equal("mr", capturedRequest.Language);
        Assert.Equal(6, capturedRequest.BodyParameters.Count);
        Assert.Equal("प्रथमेश", capturedRequest.BodyParameters[0]);
        Assert.Equal("AMC-GRV-2026-08492", capturedRequest.BodyParameters[1]);
        Assert.Equal("रस्ते व वाहतूक विभाग", capturedRequest.BodyParameters[2]);
        Assert.Equal("रस्त्यावरील खड्डे दुरुस्ती", capturedRequest.BodyParameters[3]);
        Assert.Equal("05 October 2026", capturedRequest.BodyParameters[4]);
        Assert.Equal(" प्रलंबित", capturedRequest.BodyParameters[5]);
        Assert.NotNull(capturedRequest.ButtonParameters);
        Assert.Single(capturedRequest.ButtonParameters);
        Assert.Equal("AMC-GRV-2026-08492", capturedRequest.ButtonParameters[0]);
    }

    [Fact]
    public async Task SendSubmissionNotification_WhenCurrentStateNull_DefaultsStatusToPralambit()
    {
        WhatsAppMessageRequest? capturedRequest = null;

        _mockWhatsAppClient
            .Setup(x => x.SendTemplateMessageAsync(It.IsAny<WhatsAppMessageRequest>(), It.IsAny<CancellationToken>()))
            .Callback<WhatsAppMessageRequest, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(WhatsAppSendResult.Success("msg-123", "wamid-456", "{}"));

        var service = new GrievanceWhatsAppNotificationService(
            _mockWhatsAppClient.Object,
            Options.Create(_settings),
            _submissionTemplate,
            _mockLogger.Object);

        var app = new GrievanceApplicationEntity
        {
            Id = 6,
            GrievanceNo = "GRV-2026-000006",
            Citizen = new CitizenMasterEntity { Id = 10, Name = "नागरिक", MobileNo = "9763709303" },
            CurrentState = null,
            SubmittedDate = new DateTime(2026, 10, 10, 8, 30, 0, DateTimeKind.Utc)
        };

        var result = await service.SendGrievanceSubmissionWhatsAppNotificationAsync(app);

        Assert.True(result);
        Assert.NotNull(capturedRequest);
        Assert.Equal("grievance_3", capturedRequest.TemplateName);
        Assert.Equal(" प्रलंबित", capturedRequest.BodyParameters[5]);
        Assert.NotNull(capturedRequest.ButtonParameters);
        Assert.Equal("GRV-2026-000006", capturedRequest.ButtonParameters[0]);
    }
}
