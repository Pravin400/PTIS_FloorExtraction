using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.EventHandlers;
using NtisPlatform.Application.Events;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using Xunit;

namespace NtisPlatform.Tests.Application.EventHandlers;

/// <summary>
/// Covers the fire-and-forget conversion: Handle must enqueue the RV-refresh-then-retro-engine
/// pipeline and return immediately, never refresh inline within the same call stack -- and the
/// queued work item itself, once invoked by the background hosted service, must run the pipeline
/// through <see cref="IRetrospectiveTaxRefresher"/>, which recalculates RV and then runs the engine
/// under the property's lock, and let a failure of either step fail the work item.
/// </summary>
public class PropertyCertificateChangedEventHandlerTests
{
    private static RetrospectiveTaxRefreshResult Refreshed() => new(new RateableValueResponseDto(), null);

    [Fact]
    public async Task Handle_EnqueuesWorkItem_NeverRefreshesInline()
    {
        var mockQueue = new Mock<IBackgroundTaskQueue>();
        Func<IServiceProvider, CancellationToken, Task>? capturedWorkItem = null;
        mockQueue.Setup(q => q.QueueWorkItem(It.IsAny<Func<IServiceProvider, CancellationToken, Task>>()))
            .Callback<Func<IServiceProvider, CancellationToken, Task>>(w => capturedWorkItem = w);

        var mockRefresher = new Mock<IRetrospectiveTaxRefresher>();

        var services = new ServiceCollection();
        services.AddSingleton(mockRefresher.Object);
        services.AddSingleton<Microsoft.Extensions.Logging.ILogger<PropertyCertificateChangedEventHandler>>(
            NullLogger<PropertyCertificateChangedEventHandler>.Instance);
        // A handler built from THIS provider is never used to call Handle -- it exists only so
        // the captured work item (below) has real services to resolve when invoked manually.
        var serviceProvider = services.BuildServiceProvider();

        var handler = new PropertyCertificateChangedEventHandler(mockQueue.Object, NullLogger<PropertyCertificateChangedEventHandler>.Instance);

        await handler.Handle(new PropertyCertificateChangedEvent(PropertyId: 500, UserId: 7), CancellationToken.None);

        mockQueue.Verify(q => q.QueueWorkItem(It.IsAny<Func<IServiceProvider, CancellationToken, Task>>()), Times.Once);
        mockRefresher.Verify(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.NotNull(capturedWorkItem);

        serviceProvider.Dispose();
    }

    [Fact]
    public async Task Handle_QueuedWorkItem_RefreshesTheProperty_UsingBackgroundScopeServices()
    {
        const int propertyId = 500;
        const int userId = 7;

        var mockRefresher = new Mock<IRetrospectiveTaxRefresher>();
        mockRefresher.Setup(r => r.RefreshAsync(propertyId, userId, It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Refreshed());

        var capturedWorkItem = await HandleAndCaptureWorkItemAsync(propertyId, userId);

        // Simulate QueuedHostedService invoking the captured work item in a fresh scope.
        using var cts = new CancellationTokenSource();
        await capturedWorkItem(BuildBackgroundScope(mockRefresher), cts.Token);

        // RV, then the engine, as one step of the pipeline under the property's lock; a failure of either fails the work
        // item (the queue logs it), and the background token is the one that is passed on
        mockRefresher.Verify(r => r.RefreshAsync(
                propertyId, userId,
                It.Is<RetrospectiveTaxRefreshOptions?>(o => o == null || !o.ForceRecalculate),
                cts.Token),
            Times.Once);
    }

    [Fact]
    public async Task Handle_QueuedWorkItem_WhenTheRefreshFails_TheWorkItemFails()
    {
        var mockRefresher = new Mock<IRetrospectiveTaxRefresher>();
        mockRefresher.Setup(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("rv failed"));

        var capturedWorkItem = await HandleAndCaptureWorkItemAsync(500, 7);

        await Assert.ThrowsAsync<InvalidOperationException>(() => capturedWorkItem(BuildBackgroundScope(mockRefresher), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_QueuedWorkItem_WhenTheRefreshFails_LogsThePropertyAndTheUser_AndTheWorkItemStillFails()
    {
        // the queue logs a failed work item without saying which property it was for: this is the entry to search by
        const int propertyId = 500;
        const int userId = 7;
        var cause = new InvalidOperationException("rv failed");
        var mockRefresher = new Mock<IRetrospectiveTaxRefresher>();
        mockRefresher.Setup(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(cause);
        var logger = new Mock<Microsoft.Extensions.Logging.ILogger<PropertyCertificateChangedEventHandler>>();
        logger.Setup(l => l.IsEnabled(It.IsAny<Microsoft.Extensions.Logging.LogLevel>())).Returns(true);

        var capturedWorkItem = await HandleAndCaptureWorkItemAsync(propertyId, userId);

        var thrown = await Assert.ThrowsAsync<InvalidOperationException>(() => capturedWorkItem(BuildBackgroundScope(mockRefresher, logger.Object), CancellationToken.None));

        Assert.Same(cause, thrown);
        logger.Verify(l => l.Log(
                Microsoft.Extensions.Logging.LogLevel.Error,
                It.IsAny<Microsoft.Extensions.Logging.EventId>(),
                It.Is<It.IsAnyType>((state, _) => state.ToString()!.Contains("500") && state.ToString()!.Contains("7")),
                cause,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_QueuedWorkItem_WhenCancelled_DoesNotLogAFailure()
    {
        var mockRefresher = new Mock<IRetrospectiveTaxRefresher>();
        mockRefresher.Setup(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());
        var logger = new Mock<Microsoft.Extensions.Logging.ILogger<PropertyCertificateChangedEventHandler>>();
        logger.Setup(l => l.IsEnabled(It.IsAny<Microsoft.Extensions.Logging.LogLevel>())).Returns(true);

        var capturedWorkItem = await HandleAndCaptureWorkItemAsync(500, 7);

        await Assert.ThrowsAsync<OperationCanceledException>(() => capturedWorkItem(BuildBackgroundScope(mockRefresher, logger.Object), CancellationToken.None));

        logger.Verify(l => l.Log(
                Microsoft.Extensions.Logging.LogLevel.Error,
                It.IsAny<Microsoft.Extensions.Logging.EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    private static async Task<Func<IServiceProvider, CancellationToken, Task>> HandleAndCaptureWorkItemAsync(int propertyId, int userId)
    {
        var mockQueue = new Mock<IBackgroundTaskQueue>();
        Func<IServiceProvider, CancellationToken, Task>? capturedWorkItem = null;
        mockQueue.Setup(q => q.QueueWorkItem(It.IsAny<Func<IServiceProvider, CancellationToken, Task>>()))
            .Callback<Func<IServiceProvider, CancellationToken, Task>>(w => capturedWorkItem = w);

        var handler = new PropertyCertificateChangedEventHandler(mockQueue.Object, NullLogger<PropertyCertificateChangedEventHandler>.Instance);
        await handler.Handle(new PropertyCertificateChangedEvent(propertyId, userId), CancellationToken.None);

        Assert.NotNull(capturedWorkItem);
        return capturedWorkItem!;
    }

    private static IServiceProvider BuildBackgroundScope(
        Mock<IRetrospectiveTaxRefresher> refresher, Microsoft.Extensions.Logging.ILogger<PropertyCertificateChangedEventHandler>? logger = null)
    {
        var services = new ServiceCollection();
        services.AddSingleton(refresher.Object);
        services.AddSingleton<Microsoft.Extensions.Logging.ILogger<PropertyCertificateChangedEventHandler>>(
            logger ?? NullLogger<PropertyCertificateChangedEventHandler>.Instance);
        return services.BuildServiceProvider();
    }
}
