using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.PolicyMast;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

public class PolicyMastServiceTests
{
    private readonly Mock<IRepository<PolicyMastEntity, int>> _mockRepository = new();
    private readonly Mock<IUnitOfWork> _mockUnitOfWork = new();
    private readonly IMapper _mapper;
    private readonly PolicyMastService _service;

    public PolicyMastServiceTests()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<PolicyMastMappingProfile>(),
            NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
        _service = new PolicyMastService(_mockRepository.Object, _mockUnitOfWork.Object, _mapper);
    }

    private static PolicyMastEntity CreatePolicy(int id, params PolicyConditionDetailsEntity[] conditions) => new()
    {
        Id = id,
        PolicyCode = "RETENTION",
        PolicyName = "Policy " + id,
        Description = "Description " + id,
        IsActive = true,
        PolicyConditionDetails = conditions.ToList()
    };

    private static PolicyConditionDetailsEntity CreateCondition(int id, int policyId, int sequenceNo, string op = "IF") => new()
    {
        Id = id,
        PolicyId = policyId,
        SequenceNo = sequenceNo,
        LogicalOperator = op,
        ParameterName = "Existing Assessment",
        ComparisonOperator = "Equals",
        Value1 = "YES",
        MultiplierValue = 1.20m,
        IsActive = true
    };

    [Fact]
    public void Mapping_PolicyToDto_MapsConditionsAndFields()
    {
        var entity = CreatePolicy(1, CreateCondition(10, 1, 1), CreateCondition(11, 1, 2, "AND"));

        var dto = _mapper.Map<PolicyMastDto>(entity);

        Assert.Equal("RETENTION", dto.PolicyCode);
        Assert.NotNull(dto.PolicyConditionDetails);
        Assert.Equal(2, dto.PolicyConditionDetails!.Count);
        var first = dto.PolicyConditionDetails.First(c => c.Id == 10);
        Assert.Equal(1, first.PolicyId);
        Assert.Equal("IF", first.LogicalOperator);
        Assert.Equal("Existing Assessment", first.ParameterName);
        Assert.Equal("Equals", first.ComparisonOperator);
        Assert.Equal("YES", first.Value1);
        Assert.Null(first.Value2);
        Assert.Equal(1.20m, first.MultiplierValue);
    }

    [Fact]
    public void Mapping_PolicyWithoutConditions_ReturnsEmptyList()
    {
        var dto = _mapper.Map<PolicyMastDto>(CreatePolicy(1));

        Assert.NotNull(dto.PolicyConditionDetails);
        Assert.Empty(dto.PolicyConditionDetails);
    }

    [Fact]
    public void Mapping_CreateDto_IgnoresConditionsAndId()
    {
        var entity = _mapper.Map<PolicyMastEntity>(new CreatePolicyMastDto
        {
            PolicyCode = "HEARING",
            PolicyName = "Hearing",
            Description = "Desc"
        });

        Assert.Equal("HEARING", entity.PolicyCode);
        Assert.Equal(0, entity.Id);
        Assert.Empty(entity.PolicyConditionDetails);
    }

    [Fact]
    public void Entity_NewCondition_DefaultsToActive()
    {
        Assert.True(new PolicyConditionDetailsEntity().IsActive);
        Assert.NotNull(new PolicyMastEntity().PolicyConditionDetails);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsPolicyWithConditionsOrderedBySequence()
    {
        var policy = CreatePolicy(1, CreateCondition(11, 1, 2, "AND"), CreateCondition(10, 1, 1));
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PolicyMastEntity> { policy }.BuildMock());

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(new[] { 1, 2 }, result!.PolicyConditionDetails!.Select(c => c.SequenceNo));
    }

    [Fact]
    public async Task GetByIdAsync_WhenNoConditions_ReturnsEmptyList()
    {
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PolicyMastEntity> { CreatePolicy(1) }.BuildMock());

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Empty(result!.PolicyConditionDetails!);
    }

    [Fact]
    public async Task GetByIdAsync_WhenNotFound_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PolicyMastEntity>().BuildMock());

        var result = await _service.GetByIdAsync(99);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsPoliciesWithTheirOwnConditions()
    {
        var policies = new List<PolicyMastEntity>
        {
            CreatePolicy(1, CreateCondition(10, 1, 1)),
            CreatePolicy(2)
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(policies.BuildMock());

        var result = await _service.GetAllAsync(new PolicyMastQueryParameters { PageNumber = 1, PageSize = 10 });

        Assert.Equal(2, result.TotalCount);
        var withConditions = result.Items.First(p => p.Id == 1);
        var withoutConditions = result.Items.First(p => p.Id == 2);
        Assert.Single(withConditions.PolicyConditionDetails!);
        Assert.Empty(withoutConditions.PolicyConditionDetails!);
    }
}
