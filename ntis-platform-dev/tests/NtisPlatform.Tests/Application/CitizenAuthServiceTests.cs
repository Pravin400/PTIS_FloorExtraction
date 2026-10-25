using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using System.Security.Cryptography;
using System.Text;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class CitizenAuthServiceTests
{
    private readonly Mock<IRepository<CitizenMasterEntity, int>> _mockCitizenRepository;
    private readonly Mock<IRepository<CitizenOtpLogEntity, int>> _mockOtpLogRepository;
    private readonly Mock<IRepository<GrievanceApplicationEntity, int>> _mockApplicationRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly Mock<ISmsService> _mockSmsService;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<IHostEnvironment> _mockEnvironment;
    private readonly CitizenAuthService _service;

    public CitizenAuthServiceTests()
    {
        _mockCitizenRepository = new Mock<IRepository<CitizenMasterEntity, int>>();
        _mockOtpLogRepository = new Mock<IRepository<CitizenOtpLogEntity, int>>();
        _mockApplicationRepository = new Mock<IRepository<GrievanceApplicationEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockTokenService = new Mock<ITokenService>();
        _mockSmsService = new Mock<ISmsService>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockEnvironment = new Mock<IHostEnvironment>();

        _mockConfiguration.Setup(c => c["Jwt:ExpiresInMinutes"]).Returns("60");
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _mockTokenService.Setup(t => t.GenerateToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns("mock-jwt-token-xyz");

        _mockTokenService.Setup(t => t.GenerateCitizenToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns("mock-citizen-jwt-token-xyz");

        _mockTokenService.Setup(t => t.GenerateRefreshToken())
            .Returns("mock-refresh-token-xyz");

        _mockSmsService.Setup(s => s.SendSmsAsync(It.IsAny<NtisPlatform.Application.DTOs.Sms.SmsRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockCitizenRepository.Setup(r => r.GetQueryable()).Returns(new List<CitizenMasterEntity>().BuildMock());
        _mockOtpLogRepository.Setup(r => r.GetQueryable()).Returns(new List<CitizenOtpLogEntity>().BuildMock());
        _mockApplicationRepository.Setup(r => r.GetQueryable()).Returns(new List<GrievanceApplicationEntity>().BuildMock());

        _service = new CitizenAuthService(
            _mockCitizenRepository.Object,
            _mockOtpLogRepository.Object,
            _mockApplicationRepository.Object,
            _mockUnitOfWork.Object,
            _mockTokenService.Object,
            _mockSmsService.Object,
            _mockConfiguration.Object,
            _mockEnvironment.Object,
            NullLogger<CitizenAuthService>.Instance);
    }

    private static string HashOtp(string mobileNo, string otp)
    {
        using var sha256 = SHA256.Create();
        var salt = "ntis-citizen-otp-salt-v1";
        var bytes = Encoding.UTF8.GetBytes($"{mobileNo}:{otp}:{salt}");
        return Convert.ToHexString(sha256.ComputeHash(bytes));
    }

    #region SendOtp Tests

    [Fact]
    public async Task SendOtpAsync_ValidMobile_IssuesOtpAndSendsSmsSuccessfully()
    {
        // Arrange
        var request = new SendCitizenOtpRequestDto
        {
            MobileNo = "9876543210"
        };

        // Act
        var result = await _service.SendOtpAsync(request, "127.0.0.1");

        // Assert
        Assert.True(result.Success);
        Assert.Contains("9876543210"[^4..], result.MaskedMobileNo);
        Assert.Equal(600, result.ExpiresInSeconds);
        Assert.Equal(10, result.OtpExpiryMinutes);
        Assert.Equal(30, result.ResendInSeconds);
        Assert.NotNull(result.DebugOtp);
        _mockSmsService.Verify(s => s.SendSmsAsync(It.Is<NtisPlatform.Application.DTOs.Sms.SmsRequest>(r => r.PhoneNumber == "9876543210"), It.IsAny<CancellationToken>()), Times.Once);
        _mockOtpLogRepository.Verify(r => r.AddAsync(It.IsAny<CitizenOtpLogEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendOtpAsync_Exceeds15MinuteQuota_ThrowsValidationException()
    {
        // Arrange: 5 OTPs sent starting 5 minutes ago (oldest expires in 10 - 5 = 5 min, window clears in 10 min)
        var recentLogs = Enumerable.Range(1, 5).Select(i => new CitizenOtpLogEntity
        {
            Id = i,
            MobileNo = "9876543210",
            ExpiresAt = DateTime.Now.AddMinutes(10).AddMinutes(-5),
            CreatedDate = DateTime.Now.AddMinutes(-5)
        }).ToList();

        _mockOtpLogRepository.Setup(r => r.GetQueryable()).Returns(recentLogs.BuildMock());

        var request = new SendCitizenOtpRequestDto { MobileNo = "9876543210" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.SendOtpAsync(request, "127.0.0.1"));
        Assert.Contains("Too many OTP requests", ex.Message);
        Assert.Contains("10 minute(s) before requesting another OTP", ex.Message);
    }

    [Fact]
    public async Task SendOtpAsync_Within30SecondsCooldown_ThrowsValidationException()
    {
        // Arrange: Last OTP issued 10 seconds ago (expires in 10m - 10s = 590s)
        var recentLogs = new List<CitizenOtpLogEntity>
        {
            new()
            {
                Id = 1,
                MobileNo = "9876543210",
                ExpiresAt = DateTime.Now.AddMinutes(10).AddSeconds(-10),
                IsActive = true
            }
        };

        _mockOtpLogRepository.Setup(r => r.GetQueryable()).Returns(recentLogs.BuildMock());

        var request = new SendCitizenOtpRequestDto { MobileNo = "9876543210" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.SendOtpAsync(request, "127.0.0.1"));
        Assert.Contains("Please wait", ex.Message);
        Assert.Contains("second(s) before requesting another OTP", ex.Message);
    }

    [Fact]
    public async Task SendOtpAsync_LockedCitizen_ThrowsValidationException()
    {
        // Arrange
        var lockedCitizen = new CitizenMasterEntity
        {
            Id = 1,
            MobileNo = "9876543210",
            IsActive = true,
            LockedUntilAt = DateTime.Now.AddMinutes(10)
        };
        _mockCitizenRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenMasterEntity> { lockedCitizen }.BuildMock());

        var request = new SendCitizenOtpRequestDto
        {
            MobileNo = "9876543210"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.SendOtpAsync(request, "127.0.0.1"));
        Assert.Contains("temporarily locked", ex.Message);
    }

    #endregion

    #region VerifyOtp Tests

    [Fact]
    public async Task VerifyOtpAsync_ValidOtp_ExistingCitizen_LogsInSuccessfully()
    {
        // Arrange
        var mobile = "9876543210";
        var rawOtp = "123456";
        var existingCitizen = new CitizenMasterEntity
        {
            Id = 10,
            Name = "Aarav Patil",
            MobileNo = mobile,
            IsVerified = false,
            IsActive = true
        };

        var activeOtpLog = new CitizenOtpLogEntity
        {
            Id = 1,
            MobileNo = mobile,
            CitizenId = 10,
            OtpHash = HashOtp(mobile, rawOtp),
            ExpiresAt = DateTime.Now.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            IsActive = true
        };

        _mockCitizenRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenMasterEntity> { existingCitizen }.BuildMock());
        _mockOtpLogRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenOtpLogEntity> { activeOtpLog }.BuildMock());

        var request = new VerifyCitizenOtpRequestDto
        {
            MobileNo = mobile,
            Otp = rawOtp
        };

        // Act
        var result = await _service.VerifyOtpAsync(request, "127.0.0.1");

        // Assert
        Assert.True(result.Success);
        Assert.Equal("mock-citizen-jwt-token-xyz", result.Token);
        Assert.False(result.IsNewUser);
        Assert.Equal(10, result.CitizenId);
        Assert.True(existingCitizen.IsVerified);
        Assert.True(activeOtpLog.IsUsed);
        _mockCitizenRepository.Verify(r => r.UpdateAsync(existingCitizen, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpAsync_ValidOtp_NewCitizen_AutoRegistersAndLogsIn()
    {
        // Arrange
        var mobile = "9988776655";
        var rawOtp = "654321";

        var activeOtpLog = new CitizenOtpLogEntity
        {
            Id = 1,
            MobileNo = mobile,
            CitizenId = null,
            OtpHash = HashOtp(mobile, rawOtp),
            ExpiresAt = DateTime.Now.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            IsActive = true
        };

        _mockCitizenRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenMasterEntity>().BuildMock());
        _mockOtpLogRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenOtpLogEntity> { activeOtpLog }.BuildMock());

        var request = new VerifyCitizenOtpRequestDto
        {
            MobileNo = mobile,
            Otp = rawOtp,
            Name = "New Citizen"
        };

        // Act
        var result = await _service.VerifyOtpAsync(request, "127.0.0.1");

        // Assert
        Assert.True(result.Success);
        Assert.True(result.IsNewUser);
        Assert.Equal("New Citizen", result.Name);
        _mockCitizenRepository.Verify(r => r.AddAsync(It.Is<CitizenMasterEntity>(c => c.MobileNo == mobile && c.Name == "New Citizen"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpAsync_InvalidOtp_IncrementsAttemptCount()
    {
        // Arrange
        var mobile = "9876543210";
        var activeOtpLog = new CitizenOtpLogEntity
        {
            Id = 1,
            MobileNo = mobile,
            OtpHash = HashOtp(mobile, "123456"),
            ExpiresAt = DateTime.Now.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            IsActive = true
        };

        _mockOtpLogRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenOtpLogEntity> { activeOtpLog }.BuildMock());

        var request = new VerifyCitizenOtpRequestDto
        {
            MobileNo = mobile,
            Otp = "999999" // Wrong OTP
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.VerifyOtpAsync(request, "127.0.0.1"));
        Assert.Contains("Invalid OTP", ex.Message);
        Assert.Equal(1, activeOtpLog.AttemptCount);
    }

    [Fact]
    public async Task SendOtpAsync_WithCustomPurposeAndModuleCode_SetsFieldsCorrectly()
    {
        // Arrange
        var request = new SendCitizenOtpRequestDto
        {
            MobileNo = "9876543210",
            Purpose = "SUBMIT_GRIEVANCE",
            ModuleCode = "GRV",
            ReferenceId = "REF-12345"
        };

        // Act
        var result = await _service.SendOtpAsync(request, "127.0.0.1");

        // Assert
        Assert.True(result.Success);
        _mockOtpLogRepository.Verify(r => r.AddAsync(It.Is<CitizenOtpLogEntity>(o =>
            o.MobileNo == "9876543210" &&
            o.Purpose == "SUBMIT_GRIEVANCE" &&
            o.ModuleCode == "GRV" &&
            o.ReferenceId == "REF-12345"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpAsync_MismatchedPurpose_ThrowsValidationException()
    {
        // Arrange
        var mobile = "9876543210";
        var rawOtp = "123456";
        var activeOtpLog = new CitizenOtpLogEntity
        {
            Id = 1,
            MobileNo = mobile,
            Purpose = "SUBMIT_GRIEVANCE",
            OtpHash = HashOtp(mobile, rawOtp),
            ExpiresAt = DateTime.Now.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            IsActive = true
        };

        _mockOtpLogRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenOtpLogEntity> { activeOtpLog }.BuildMock());

        var request = new VerifyCitizenOtpRequestDto
        {
            MobileNo = mobile,
            Otp = rawOtp,
            Purpose = "LOGIN" // Mismatched purpose
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.VerifyOtpAsync(request, "127.0.0.1"));
        Assert.Contains("OTP has expired or is invalid", ex.Message);
    }

    [Fact]
    public async Task VerifyOtpAsync_MatchingModuleAndReference_VerifiesSuccessfully()
    {
        // Arrange
        var mobile = "9876543210";
        var rawOtp = "123456";
        var existingCitizen = new CitizenMasterEntity
        {
            Id = 10,
            Name = "Aarav Patil",
            MobileNo = mobile,
            IsVerified = true,
            IsActive = true
        };

        var activeOtpLog = new CitizenOtpLogEntity
        {
            Id = 1,
            MobileNo = mobile,
            CitizenId = 10,
            Purpose = "SUBMIT_GRIEVANCE",
            ModuleCode = "GRV",
            ReferenceId = "GRV-2026-001",
            OtpHash = HashOtp(mobile, rawOtp),
            ExpiresAt = DateTime.Now.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            IsActive = true
        };

        _mockCitizenRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenMasterEntity> { existingCitizen }.BuildMock());
        _mockOtpLogRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenOtpLogEntity> { activeOtpLog }.BuildMock());

        var request = new VerifyCitizenOtpRequestDto
        {
            MobileNo = mobile,
            Otp = rawOtp,
            Purpose = "SUBMIT_GRIEVANCE",
            ModuleCode = "GRV",
            ReferenceId = "GRV-2026-001"
        };

        // Act
        var result = await _service.VerifyOtpAsync(request, "127.0.0.1");

        // Assert
        Assert.True(result.Success);
        Assert.True(activeOtpLog.IsUsed);
    }

    [Fact]
    public async Task VerifyOtpAsync_MismatchedReferenceId_ThrowsValidationException()
    {
        // Arrange
        var mobile = "9876543210";
        var rawOtp = "123456";
        var activeOtpLog = new CitizenOtpLogEntity
        {
            Id = 1,
            MobileNo = mobile,
            Purpose = "SUBMIT_GRIEVANCE",
            ModuleCode = "GRV",
            ReferenceId = "GRV-2026-001",
            OtpHash = HashOtp(mobile, rawOtp),
            ExpiresAt = DateTime.Now.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            IsActive = true
        };

        _mockOtpLogRepository.Setup(r => r.GetQueryable())
            .Returns(new List<CitizenOtpLogEntity> { activeOtpLog }.BuildMock());

        var request = new VerifyCitizenOtpRequestDto
        {
            MobileNo = mobile,
            Otp = rawOtp,
            Purpose = "SUBMIT_GRIEVANCE",
            ModuleCode = "GRV",
            ReferenceId = "DIFFERENT-REF-999" // Mismatched Reference
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.VerifyOtpAsync(request, "127.0.0.1"));
        Assert.Contains("OTP has expired or is invalid", ex.Message);
    }

    #endregion

    #region Profile Tests

    [Fact]
    public async Task GetProfileAsync_ExistingCitizen_ReturnsProfileWithGrievanceCounts()
    {
        // Arrange
        var citizen = new CitizenMasterEntity
        {
            Id = 5,
            Name = "Priya Deshmukh",
            MobileNo = "9123456780",
            IsVerified = true,
            IsActive = true
        };

        var grievances = new List<GrievanceApplicationEntity>
        {
            new() { Id = 1, CitizenId = 5, IsActive = true, ClosedDate = null },
            new() { Id = 2, CitizenId = 5, IsActive = true, ClosedDate = DateTime.Now }
        };

        _mockCitizenRepository.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(citizen);
        _mockApplicationRepository.Setup(r => r.GetQueryable())
            .Returns(grievances.BuildMock());

        // Act
        var result = await _service.GetProfileAsync(5);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Priya Deshmukh", result.Name);
        Assert.Equal(2, result.TotalGrievancesCount);
        Assert.Equal(1, result.ActiveGrievancesCount);
    }

    #endregion
}
