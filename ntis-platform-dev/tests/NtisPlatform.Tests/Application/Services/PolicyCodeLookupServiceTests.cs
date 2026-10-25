using MockQueryable;
using Moq;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services;

public class PolicyCodeLookupServiceTests
{
    private readonly Mock<IRepository<PolicyCodeMasterEntity, int>> _mockRepository = new();
    private readonly PolicyCodeLookupService _service;

    public PolicyCodeLookupServiceTests()
    {
        _service = new PolicyCodeLookupService(_mockRepository.Object);
    }

    [Fact]
    public async Task GetIdAsync_ExactMatchPreferredOverFallback_WhenBothExist()
    {
        // Arrange: DB contains both CC and PARTIAL_CC, with CC returned first
        var policies = new List<PolicyCodeMasterEntity>
        {
            new() { Id = 1, PolicyCode = "CC", PolicyName = "Completion Certificate", IsActive = true },
            new() { Id = 2, PolicyCode = "PARTIAL_CC", PolicyName = "Partial CC", IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(policies.BuildMock());

        // Act: Request PARTIAL_CC
        var id = await _service.GetIdAsync("PARTIAL_CC");

        // Assert: Must match exact PARTIAL_CC (Id 2), not fallback CC (Id 1)
        Assert.Equal(2, id);
    }

    [Fact]
    public async Task GetIdAsync_FallbackMatch_WhenNoExactMatch()
    {
        // Arrange: DB contains only CC
        var policies = new List<PolicyCodeMasterEntity>
        {
            new() { Id = 1, PolicyCode = "CC", PolicyName = "Completion Certificate", IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(policies.BuildMock());

        // Act: Request PARTIAL_CC
        var id = await _service.GetIdAsync("PARTIAL_CC");

        // Assert: Falls back to CC (Id 1)
        Assert.Equal(1, id);
    }

    [Fact]
    public async Task GetIdAsync_MissingCode_ThrowsInvalidOperationException()
    {
        var policies = new List<PolicyCodeMasterEntity>
        {
            new() { Id = 1, PolicyCode = "ELECTRIC_BILL", PolicyName = "Electricity Bill", IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(policies.BuildMock());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.GetIdAsync("UNKNOWN_CODE"));
        Assert.Contains("UNKNOWN_CODE", ex.Message);
    }

    [Fact]
    public async Task GetExistingIdsAsync_TwoPassLookup_ResolvesCorrectIds()
    {
        var policies = new List<PolicyCodeMasterEntity>
        {
            new() { Id = 10, PolicyCode = "CC", PolicyName = "CC", IsActive = true },
            new() { Id = 20, PolicyCode = "OC", PolicyName = "OC", IsActive = true },
            new() { Id = 30, PolicyCode = "PARTIAL_CC", PolicyName = "Partial CC", IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(policies.BuildMock());

        var result = await _service.GetExistingIdsAsync(new[] { "PARTIAL_CC", "PARTIAL_OC" });

        Assert.Equal(30, result["PARTIAL_CC"]); // Exact match
        Assert.Equal(20, result["PARTIAL_OC"]); // Fallback to OC
    }
}
