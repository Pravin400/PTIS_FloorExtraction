using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.DTOs.WhatsApp;
using NtisPlatform.Infrastructure.Services.WhatsApp;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.WhatsApp;

public class WhatsAppClientTests
{
    private readonly Mock<ILogger<WhatsAppClient>> _mockLogger;
    private readonly WhatsAppSettings _settings;

    public WhatsAppClientTests()
    {
        _mockLogger = new Mock<ILogger<WhatsAppClient>>();
        _settings = new WhatsAppSettings
        {
            IsEnabled = true,
            ApiUrl = "https://crmwhatsapp.scipl.info.in/wrapper/waba/message",
            ApiKey = "wacrm_test_key_123",
            WabaNumber = "919690208040",
            DefaultCountryCode = 91,
            DefaultLanguage = "mr"
        };
    }

    [Theory]
    [InlineData("9876543210", 91, "919876543210")]
    [InlineData("09876543210", 91, "919876543210")]
    [InlineData("919876543210", 91, "919876543210")]
    [InlineData("+91 9876543210", 91, "919876543210")]
    [InlineData("98765-43210", 91, "919876543210")]
    [InlineData("", 91, "")]
    [InlineData(null, 91, "")]
    public void NormalizePhoneNumber_SanitizesCorrectly(string? input, int countryCode, string expected)
    {
        var result = WhatsAppClient.NormalizePhoneNumber(input, countryCode);
        Assert.Equal(expected, result);
    }

    [Fact]
    public async Task SendTemplateMessageAsync_WhenDisabled_ReturnsFailureWithoutCallingHttp()
    {
        _settings.IsEnabled = false;

        var handlerMock = new Mock<HttpMessageHandler>();
        var httpClient = new HttpClient(handlerMock.Object);
        var formatter = new NtisPlatform.Infrastructure.Services.WhatsApp.Formatting.CrmWabaPayloadFormatter();
        var client = new WhatsAppClient(httpClient, Options.Create(_settings), formatter, _mockLogger.Object);

        var request = new WhatsAppMessageRequest
        {
            MobileNo = "9876543210",
            TemplateName = "grievance_submissions"
        };

        var result = await client.SendTemplateMessageAsync(request);

        Assert.False(result.IsSuccess);
        handlerMock.Protected().Verify(
            "SendAsync",
            Times.Never(),
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task SendTemplateMessageAsync_BuildsValidPayloadAndDispatchesSuccessfully()
    {
        HttpRequestMessage? capturedRequest = null;
        string? capturedBody = null;

        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
            {
                capturedRequest = req;
                capturedBody = req.Content?.ReadAsStringAsync().Result;
            })
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"success\":true,\"message\":\"Message sent successfully\",\"data\":{\"message_id\":\"msg-999\",\"whatsapp_message_id\":\"wamid-123\"}}")
            });

        var httpClient = new HttpClient(handlerMock.Object);
        var formatter = new NtisPlatform.Infrastructure.Services.WhatsApp.Formatting.CrmWabaPayloadFormatter();
        var client = new WhatsAppClient(httpClient, Options.Create(_settings), formatter, _mockLogger.Object);

        var request = new WhatsAppMessageRequest
        {
            CountryCode = 91,
            MobileNo = "9876543210",
            TemplateName = "grievance_submissions",
            Language = "mr",
            BodyParameters = new[] { "प्रथमेश", "GRV-001", "पाणी पुरवठा", "08/10/2026", "नोंदणीकृत", "https://track.url" },
            ButtonParameters = new[] { "https://track.url" }
        };

        var result = await client.SendTemplateMessageAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal("msg-999", result.MessageId);
        Assert.Equal("wamid-123", result.WhatsAppMessageId);
        Assert.NotNull(capturedRequest);
        Assert.NotNull(capturedBody);
        Assert.Equal("Bearer", capturedRequest.Headers.Authorization?.Scheme);
        Assert.Equal(_settings.ApiKey, capturedRequest.Headers.Authorization?.Parameter);

        using var doc = JsonDocument.Parse(capturedBody);
        var root = doc.RootElement;
        Assert.Equal("919876543210", root.GetProperty("to").GetString());
        Assert.Equal("919876543210", root.GetProperty("number").GetString());
        Assert.Equal("grievance_submissions", root.GetProperty("template_name").GetString());
        Assert.Equal("mr", root.GetProperty("language").GetString());

        var paramsArray = root.GetProperty("params");
        Assert.Equal(6, paramsArray.GetArrayLength());
        Assert.Equal("प्रथमेश", paramsArray[0].GetString());
        Assert.Equal("https://track.url", paramsArray[5].GetString());
    }

    [Fact]
    public async Task SendTemplateMessageAsync_WhenHttpError_ReturnsFailureGracefully()
    {
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.BadRequest,
                Content = new StringContent("{\"success\":false,\"message\":\"Invalid request\"}")
            });

        var httpClient = new HttpClient(handlerMock.Object);
        var formatter = new NtisPlatform.Infrastructure.Services.WhatsApp.Formatting.CrmWabaPayloadFormatter();
        var client = new WhatsAppClient(httpClient, Options.Create(_settings), formatter, _mockLogger.Object);

        var request = new WhatsAppMessageRequest
        {
            MobileNo = "9876543210",
            TemplateName = "grievance_submissions"
        };

        var result = await client.SendTemplateMessageAsync(request);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
