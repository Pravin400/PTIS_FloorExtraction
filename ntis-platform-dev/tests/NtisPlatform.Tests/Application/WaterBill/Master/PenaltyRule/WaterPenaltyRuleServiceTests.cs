using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Services.WaterBill.Master.PenaltyRule;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using ChargeHeadMasterEntity = NtisPlatform.Core.Entities.WaterBill.Master.ChargeHeadMasterEntity;

namespace NtisPlatform.Tests.Application.WaterBill.Master.PenaltyRule;

public class WaterPenaltyRuleServiceTests
{
    private readonly Mock<IRepository<WaterPenaltyRuleMasterEntity, long>> _mockRepo;
    private readonly Mock<IRepository<YearMasterEntity, int>> _mockYearRepo;
    private readonly Mock<IRepository<ConnectionCategoryMasterEntity, int>> _mockConnectionCategoryRepo;
    private readonly Mock<IRepository<GeographyUnitEntity, int>> _mockGeographyUnitRepo;
    private readonly Mock<IRepository<ChargeHeadMasterEntity, int>> _mockChargeHeadRepo;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<ILogger<WaterPenaltyRuleService>> _mockLogger;
    private readonly WaterPenaltyRuleValidationService _validationService;
    private readonly WaterPenaltyRuleService _service;

    public WaterPenaltyRuleServiceTests()
    {
        _mockRepo = new Mock<IRepository<WaterPenaltyRuleMasterEntity, long>>();
        _mockYearRepo = new Mock<IRepository<YearMasterEntity, int>>();
        _mockConnectionCategoryRepo = new Mock<IRepository<ConnectionCategoryMasterEntity, int>>();
        _mockGeographyUnitRepo = new Mock<IRepository<GeographyUnitEntity, int>>();
        _mockChargeHeadRepo = new Mock<IRepository<ChargeHeadMasterEntity, int>>();
        _mockUow = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockLogger = new Mock<ILogger<WaterPenaltyRuleService>>();

        _mockUow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockUow.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUow.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUow.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockRepo.Setup(r => r.GetQueryable()).Returns(new List<WaterPenaltyRuleMasterEntity>().BuildMock());

        _mockYearRepo.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity>
        {
            new() { Id = 1, IsActive = true },
            new() { Id = 10, IsActive = true }
        }.BuildMock());

        _mockConnectionCategoryRepo.Setup(r => r.GetQueryable()).Returns(new List<ConnectionCategoryMasterEntity>
        {
            new() { Id = 1, IsActive = true }
        }.BuildMock());

        _mockGeographyUnitRepo.Setup(r => r.GetQueryable()).Returns(new List<GeographyUnitEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false }
        }.BuildMock());

        _mockChargeHeadRepo.Setup(r => r.GetQueryable()).Returns(new List<ChargeHeadMasterEntity>
        {
            new() { Id = 1, IsActive = true }
        }.BuildMock());

        _validationService = new WaterPenaltyRuleValidationService(
            _mockRepo.Object,
            _mockYearRepo.Object,
            _mockConnectionCategoryRepo.Object,
            _mockGeographyUnitRepo.Object,
            _mockChargeHeadRepo.Object);

        _service = new WaterPenaltyRuleService(_mockRepo.Object, _mockUow.Object, _mockMapper.Object, _validationService, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidPercentageRule_Succeeds()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsPendingBill = false
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsPendingBill = false,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ValidFlatRule_Succeeds()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Flat",
            FlatAmount = 250m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsPendingBill = false
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Flat",
            FlatAmount = 250m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsPendingBill = false,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 2 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateAsync_ValidMonthlyPercentageRule_Succeeds()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "MonthlyPercentage",
            PercentageRate = 2.0m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = false,
            IsPendingBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "MonthlyPercentage",
            PercentageRate = 2.0m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = false,
            IsPendingBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 3 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateAsync_ConcurrentConflictingRules_ExactlyOneSucceeds()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>();

        // Return a fresh MockQueryable every time so it sees the latest items
        _mockRepo.Setup(r => r.GetQueryable()).Returns(() => existing.BuildMock());

        var semaphore = new SemaphoreSlim(1, 1);
        _mockUow.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(async (CancellationToken ct) =>
            {
                await semaphore.WaitAsync(ct);
            });

        _mockUow.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) =>
            {
                semaphore.Release();
                return Task.CompletedTask;
            });

        _mockUow.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) =>
            {
                semaphore.Release();
                return Task.CompletedTask;
            });

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(async (WaterPenaltyRuleMasterEntity entity, CancellationToken ct) =>
            {
                existing.Add(entity); // Simulate insert
                await Task.Delay(50, ct); // Simulate DB delay
                return entity;
            });

        var createDto1 = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            FromDay = 1,
            ToDay = 30,
            EffectiveFrom = new DateTime(2026, 4, 1),
            EffectiveTo = new DateTime(2027, 3, 31),
            IsCurrentBill = true,
            IsPendingBill = false
        };
        var entity1 = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            FromDay = 1,
            ToDay = 30,
            EffectiveFrom = new DateTime(2026, 4, 1),
            EffectiveTo = new DateTime(2027, 3, 31),
            IsCurrentBill = true,
            IsPendingBill = false,
            IsActive = true
        };

        var createDto2 = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 15,
            ToDay = 45,
            EffectiveFrom = new DateTime(2026, 6, 1),
            EffectiveTo = new DateTime(2026, 12, 31),
            IsCurrentBill = true,
            IsPendingBill = false
        };
        var entity2 = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 2,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 15,
            ToDay = 45,
            EffectiveFrom = new DateTime(2026, 6, 1),
            EffectiveTo = new DateTime(2026, 12, 31),
            IsCurrentBill = true,
            IsPendingBill = false,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(createDto1)).Returns(entity1);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity1)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1 });
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(createDto2)).Returns(entity2);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity2)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 2 });

        var task1 = _service.CreateAsync(createDto1, CancellationToken.None);
        var task2 = _service.CreateAsync(createDto2, CancellationToken.None);

        var allTasks = Task.WhenAll(task1, task2);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => allTasks);
        Assert.Contains(ex.Errors.Keys, k => k == nameof(WaterPenaltyRuleMasterEntity.FromDay));

        // Wait for both to finish completely
        var completedCount = 0;
        if (task1.Status == TaskStatus.RanToCompletion) completedCount++;
        if (task2.Status == TaskStatus.RanToCompletion) completedCount++;

        Assert.Equal(1, completedCount);
        Assert.Single(existing);
    }

    [Fact]
    public async Task CreateAsync_ConcurrentNonConflictingRules_BothSucceed()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>();

        _mockRepo.Setup(r => r.GetQueryable()).Returns(() => existing.BuildMock());

        var semaphore = new SemaphoreSlim(1, 1);
        _mockUow.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(async (CancellationToken ct) =>
            {
                await semaphore.WaitAsync(ct);
            });

        _mockUow.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) =>
            {
                semaphore.Release();
                return Task.CompletedTask;
            });

        _mockUow.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) =>
            {
                semaphore.Release();
                return Task.CompletedTask;
            });

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(async (WaterPenaltyRuleMasterEntity entity, CancellationToken ct) =>
            {
                existing.Add(entity); // Simulate insert
                await Task.Delay(50, ct); // Simulate DB delay
                return entity;
            });

        var createDto1 = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            FromDay = 1,
            ToDay = 30,
            EffectiveFrom = new DateTime(2026, 4, 1),
            EffectiveTo = new DateTime(2027, 3, 31),
            IsCurrentBill = true,
            IsPendingBill = false
        };
        var entity1 = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            FromDay = 1,
            ToDay = 30,
            EffectiveFrom = new DateTime(2026, 4, 1),
            EffectiveTo = new DateTime(2027, 3, 31),
            IsCurrentBill = true,
            IsPendingBill = false,
            IsActive = true
        };

        var createDto2 = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 31,
            ToDay = 60,
            EffectiveFrom = new DateTime(2026, 4, 1),
            EffectiveTo = new DateTime(2027, 3, 31),
            IsCurrentBill = true,
            IsPendingBill = false
        };
        var entity2 = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 2,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 31,
            ToDay = 60,
            EffectiveFrom = new DateTime(2026, 4, 1),
            EffectiveTo = new DateTime(2027, 3, 31),
            IsCurrentBill = true,
            IsPendingBill = false,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(createDto1)).Returns(entity1);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity1)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1 });
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(createDto2)).Returns(entity2);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity2)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 2 });

        var task1 = _service.CreateAsync(createDto1, CancellationToken.None);
        var task2 = _service.CreateAsync(createDto2, CancellationToken.None);

        await Task.WhenAll(task1, task2);

        Assert.Equal(TaskStatus.RanToCompletion, task1.Status);
        Assert.Equal(TaskStatus.RanToCompletion, task2.Status);
        Assert.Equal(2, existing.Count);
    }

    [Fact]
    public async Task CreateAsync_InvalidForeignKey_ThrowsValidationException()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 0,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 0,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_BothBillFlagsFalse_ThrowsValidationException()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = false,
            IsPendingBill = false
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = false,
            IsPendingBill = false
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvertedDayRange_ThrowsValidationException()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Flat",
            FlatAmount = 100,
            FromDay = 30,
            ToDay = 10,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Flat",
            FlatAmount = 100,
            FromDay = 30,
            ToDay = 10,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvertedEffectiveDates_ThrowsValidationException()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5,
            EffectiveFrom = new DateTime(2026, 12, 31),
            EffectiveTo = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5,
            EffectiveFrom = new DateTime(2026, 12, 31),
            EffectiveTo = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_OverlappingDayAndDateRange_ThrowsValidationException()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                PenaltyType = "Percentage",
                FromDay = 1,
                ToDay = 30,
                EffectiveFrom = new DateTime(2026, 4, 1),
                EffectiveTo = new DateTime(2027, 3, 31),
                IsCurrentBill = true,
                IsActive = true
            }
        }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5,
            FromDay = 15,
            ToDay = 45,
            EffectiveFrom = new DateTime(2026, 6, 1),
            EffectiveTo = new DateTime(2026, 12, 31),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5,
            FromDay = 15,
            ToDay = 45,
            EffectiveFrom = new DateTime(2026, 6, 1),
            EffectiveTo = new DateTime(2026, 12, 31),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ValidRule_Succeeds()
    {
        var existingEntity = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        var otherRules = new List<WaterPenaltyRuleMasterEntity> { existingEntity }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(otherRules);

        var updateDto = new UpdateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 3.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map(updateDto, existingEntity)).Callback<UpdateWaterPenaltyRuleDto, WaterPenaltyRuleMasterEntity>((dto, ent) =>
        {
            ent.PercentageRate = dto.PercentageRate;
        });
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(existingEntity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1, PercentageRate = 3.5m });

        var result = await _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(3.5m, result.PercentageRate);
        _mockRepo.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_Found_ReturnsDto()
    {
        var entity = new WaterPenaltyRuleMasterEntity { PenaltyRuleId = 10, FinancialYearId = 1, PenaltyType = "Percentage", IsActive = true };
        _mockRepo.Setup(r => r.GetQueryable()).Returns(new List<WaterPenaltyRuleMasterEntity> { entity }.BuildMock());
        _mockRepo.Setup(r => r.GetByIdAsync(10L, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 10, FinancialYearId = 1 });

        var result = await _service.GetByIdAsync(10L, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(10, result.PenaltyRuleId);
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        _mockRepo.Setup(r => r.GetQueryable()).Returns(new List<WaterPenaltyRuleMasterEntity>().BuildMock());
        _mockRepo.Setup(r => r.GetByIdAsync(999L, It.IsAny<CancellationToken>())).ReturnsAsync((WaterPenaltyRuleMasterEntity?)null);

        var result = await _service.GetByIdAsync(999L, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllAsync_FilteredAndPaged_ReturnsPagedResult()
    {
        var data = new List<WaterPenaltyRuleMasterEntity>
        {
            new() { PenaltyRuleId = 1, FinancialYearId = 1, PenaltyType = "Percentage", IsCurrentBill = true, IsActive = true, EffectiveFrom = new DateTime(2026, 4, 1) },
            new() { PenaltyRuleId = 2, FinancialYearId = 1, PenaltyType = "Percentage", IsCurrentBill = false, IsActive = true, EffectiveFrom = new DateTime(2026, 4, 1) },
            new() { PenaltyRuleId = 3, FinancialYearId = 2, PenaltyType = "Flat", IsCurrentBill = true, IsActive = false, EffectiveFrom = new DateTime(2026, 4, 1) }
        }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(data);

        var qp = new WaterPenaltyRuleQueryParameters { FinancialYearId = 1, IsCurrentBill = true, PageNumber = 1, PageSize = 10 };

        _mockMapper.Setup(m => m.Map<List<WaterPenaltyRuleDto>>(It.IsAny<List<WaterPenaltyRuleMasterEntity>>()))
            .Returns<List<WaterPenaltyRuleMasterEntity>>(list => list.Select(e => new WaterPenaltyRuleDto { PenaltyRuleId = e.PenaltyRuleId, FinancialYearId = e.FinancialYearId }).ToList());

        var result = await _service.GetAllAsync(qp, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
    }

    [Fact]
    public async Task GetAllAsync_WithSortByEffectiveFrom_AscendingAndDescending_HonorsSort()
    {
        var data = new List<WaterPenaltyRuleMasterEntity>
        {
            new() { PenaltyRuleId = 1, EffectiveFrom = new DateTime(2026, 4, 1), PenaltyType = "Percentage" },
            new() { PenaltyRuleId = 2, EffectiveFrom = new DateTime(2025, 4, 1), PenaltyType = "Flat" },
            new() { PenaltyRuleId = 3, EffectiveFrom = new DateTime(2027, 4, 1), PenaltyType = "Percentage" }
        }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(data);
        _mockMapper.Setup(m => m.Map<List<WaterPenaltyRuleDto>>(It.IsAny<List<WaterPenaltyRuleMasterEntity>>()))
            .Returns<List<WaterPenaltyRuleMasterEntity>>(list => list.Select(e => new WaterPenaltyRuleDto { PenaltyRuleId = e.PenaltyRuleId, EffectiveFrom = e.EffectiveFrom }).ToList());

        // Ascending
        var qpAsc = new WaterPenaltyRuleQueryParameters { SortBy = "effectivefrom", SortOrder = "asc", PageSize = -1 };
        var resultAsc = await _service.GetAllAsync(qpAsc, CancellationToken.None);
        var itemsAsc = resultAsc.Items.ToList();
        Assert.Equal(3, itemsAsc.Count);
        Assert.Equal(2, itemsAsc[0].PenaltyRuleId);
        Assert.Equal(1, itemsAsc[1].PenaltyRuleId);
        Assert.Equal(3, itemsAsc[2].PenaltyRuleId);

        // Descending
        var qpDesc = new WaterPenaltyRuleQueryParameters { SortBy = "EffectiveFrom", SortOrder = "desc", PageSize = -1 };
        var resultDesc = await _service.GetAllAsync(qpDesc, CancellationToken.None);
        var itemsDesc = resultDesc.Items.ToList();
        Assert.Equal(3, itemsDesc.Count);
        Assert.Equal(3, itemsDesc[0].PenaltyRuleId);
        Assert.Equal(1, itemsDesc[1].PenaltyRuleId);
        Assert.Equal(2, itemsDesc[2].PenaltyRuleId);
    }

    [Fact]
    public async Task GetAllAsync_WithSortByUnknownField_FallsBackToPenaltyRuleId()
    {
        var data = new List<WaterPenaltyRuleMasterEntity>
        {
            new() { PenaltyRuleId = 10, PenaltyType = "Percentage" },
            new() { PenaltyRuleId = 30, PenaltyType = "Flat" },
            new() { PenaltyRuleId = 20, PenaltyType = "Percentage" }
        }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(data);
        _mockMapper.Setup(m => m.Map<List<WaterPenaltyRuleDto>>(It.IsAny<List<WaterPenaltyRuleMasterEntity>>()))
            .Returns<List<WaterPenaltyRuleMasterEntity>>(list => list.Select(e => new WaterPenaltyRuleDto { PenaltyRuleId = e.PenaltyRuleId }).ToList());

        var qp = new WaterPenaltyRuleQueryParameters { SortBy = "non_existent_column", SortOrder = "asc", PageSize = -1 };
        var result = await _service.GetAllAsync(qp, CancellationToken.None);
        var items = result.Items.ToList();
        Assert.Equal(10, items[0].PenaltyRuleId);
        Assert.Equal(20, items[1].PenaltyRuleId);
        Assert.Equal(30, items[2].PenaltyRuleId);
    }

    [Fact]
    public async Task UpdateStatusAsync_TogglesIsActive()
    {
        var entity = new WaterPenaltyRuleMasterEntity { PenaltyRuleId = 1, IsActive = true };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var success = await _service.UpdateStatusAsync(1, false, 42);

        Assert.True(success);
        Assert.False(entity.IsActive);
        Assert.Equal(42, entity.UpdatedBy);
        Assert.NotEqual(99, entity.UpdatedBy);
        _mockRepo.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_Reactivate_WhenConflictingActiveRuleExists_ThrowsValidationExceptionAndRemainsInactive()
    {
        // 1. Existing active rule in database
        var existingActiveRules = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                ConnectionCategoryId = 1,
                GeographyUnitId = 1,
                ChargeHeadId = 1,
                PenaltyType = "Percentage",
                PercentageRate = 5,
                FromDay = 1,
                ToDay = 30,
                EffectiveFrom = new DateTime(2026, 4, 1),
                EffectiveTo = new DateTime(2027, 3, 31),
                IsCurrentBill = true,
                IsActive = true
            }
        }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existingActiveRules);

        // 2. Inactive rule with conflicting day range (10-25) and overlapping effective dates
        var inactiveRule = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 2,
            FinancialYearId = 1,
            ConnectionCategoryId = 1,
            GeographyUnitId = 1,
            ChargeHeadId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 10,
            FromDay = 10,
            ToDay = 25,
            EffectiveFrom = new DateTime(2026, 5, 1),
            EffectiveTo = new DateTime(2026, 6, 1),
            IsCurrentBill = true,
            IsActive = false
        };
        _mockRepo.Setup(r => r.GetByIdAsync(2L, It.IsAny<CancellationToken>())).ReturnsAsync(inactiveRule);

        // 3. Reactivation attempt with isActive = true
        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateStatusAsync(2, true, 42));

        // 4. Conflict detected and reactivation rejected
        Assert.NotNull(exception);
        Assert.True(exception.Errors.ContainsKey(nameof(WaterPenaltyRuleMasterEntity.FromDay)));

        // 5. Verify entity remains inactive and nothing saved
        Assert.False(inactiveRule.IsActive);
        _mockRepo.Verify(r => r.UpdateAsync(inactiveRule, It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_Reactivate_WhenNoConflict_SucceedsAndSetsActiveTrue()
    {
        // 1. Existing active rule in database
        var existingActiveRules = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                ConnectionCategoryId = 1,
                GeographyUnitId = 1,
                ChargeHeadId = 1,
                PenaltyType = "Percentage",
                PercentageRate = 5,
                FromDay = 1,
                ToDay = 30,
                EffectiveFrom = new DateTime(2026, 4, 1),
                EffectiveTo = new DateTime(2027, 3, 31),
                IsCurrentBill = true,
                IsActive = true
            }
        }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existingActiveRules);

        // 2. Inactive rule with non-conflicting day range (31-60)
        var inactiveRule = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 2,
            FinancialYearId = 1,
            ConnectionCategoryId = 1,
            GeographyUnitId = 1,
            ChargeHeadId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 10,
            FromDay = 31,
            ToDay = 60,
            EffectiveFrom = new DateTime(2026, 4, 1),
            EffectiveTo = new DateTime(2027, 3, 31),
            IsCurrentBill = true,
            IsActive = false
        };
        _mockRepo.Setup(r => r.GetByIdAsync(2L, It.IsAny<CancellationToken>())).ReturnsAsync(inactiveRule);

        // 3. Reactivation attempt with isActive = true
        var success = await _service.UpdateStatusAsync(2, true, 42);

        // 4. Reactivation succeeds
        Assert.True(success);
        Assert.True(inactiveRule.IsActive);
        Assert.Equal(42, inactiveRule.UpdatedBy);
        _mockRepo.Verify(r => r.UpdateAsync(inactiveRule, It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_Deactivate_SucceedsWithoutRequiringConflictValidation()
    {
        var entity = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var success = await _service.UpdateStatusAsync(1, false, 42);

        Assert.True(success);
        Assert.False(entity.IsActive);
        Assert.Equal(42, entity.UpdatedBy);
        _mockRepo.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ValidateConflictAsync_ReturnsConflict_WhenOverlapping()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                PenaltyType = "Percentage",
                FromDay = 1,
                ToDay = 30,
                EffectiveFrom = new DateTime(2026, 4, 1),
                EffectiveTo = new DateTime(2027, 3, 31),
                IsCurrentBill = true,
                IsActive = true
            }
        }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var request = new WaterPenaltyRuleValidationRequestDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5,
            FromDay = 10,
            ToDay = 25,
            EffectiveFrom = new DateTime(2026, 5, 1),
            EffectiveTo = new DateTime(2026, 6, 1),
            IsCurrentBill = true
        };

        var result = await _service.ValidateConflictAsync(request);

        Assert.False(result.IsValid);
        Assert.True(result.HasConflict);
        Assert.Single(result.Conflicts);
    }

    #region Master Reference Validation Tests

    [Fact]
    public async Task CreateAsync_NonExistingFinancialYearId_ThrowsValidationException_PreventsPersistence()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Financial year does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_InactiveFinancialYearId_ThrowsValidationException_PreventsPersistence()
    {
        _mockYearRepo.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity>
        {
            new() { Id = 1, IsActive = false }
        }.BuildMock());

        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Financial year does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateAsync_NegativeOrZeroFinancialYearId_ThrowsValidationException(int yearId)
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = yearId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = yearId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Financial year does not exist or is inactive."));
    }

    [Fact]
    public async Task CreateAsync_ValidConnectionCategoryId_Succeeds()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ConnectionCategoryId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ConnectionCategoryId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1, FinancialYearId = 1, ConnectionCategoryId = 1 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NonExistingConnectionCategoryId_ThrowsValidationException_PreventsPersistence()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ConnectionCategoryId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ConnectionCategoryId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Connection category does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_InactiveConnectionCategoryId_ThrowsValidationException_PreventsPersistence()
    {
        _mockConnectionCategoryRepo.Setup(r => r.GetQueryable()).Returns(new List<ConnectionCategoryMasterEntity>
        {
            new() { Id = 1, IsActive = false }
        }.BuildMock());

        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ConnectionCategoryId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ConnectionCategoryId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Connection category does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateAsync_NegativeOrZeroConnectionCategoryId_ThrowsValidationException(int catId)
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ConnectionCategoryId = catId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ConnectionCategoryId = catId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Connection category does not exist or is inactive."));
    }

    [Fact]
    public async Task CreateAsync_NullConnectionCategoryId_PassesWhenAllowed()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ConnectionCategoryId = null,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ConnectionCategoryId = null,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1, FinancialYearId = 1 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ValidGeographyUnitId_Succeeds()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            GeographyUnitId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            GeographyUnitId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1, FinancialYearId = 1, GeographyUnitId = 1 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NonExistingGeographyUnitId_ThrowsValidationException_PreventsPersistence()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            GeographyUnitId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            GeographyUnitId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Geography unit does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_InactiveGeographyUnitId_ThrowsValidationException_PreventsPersistence()
    {
        _mockGeographyUnitRepo.Setup(r => r.GetQueryable()).Returns(new List<GeographyUnitEntity>
        {
            new() { Id = 1, IsActive = false, MarkedForDeletion = false }
        }.BuildMock());

        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            GeographyUnitId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            GeographyUnitId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Geography unit does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DeletedGeographyUnitId_ThrowsValidationException_PreventsPersistence()
    {
        _mockGeographyUnitRepo.Setup(r => r.GetQueryable()).Returns(new List<GeographyUnitEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = true }
        }.BuildMock());

        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            GeographyUnitId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            GeographyUnitId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Geography unit does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateAsync_NegativeOrZeroGeographyUnitId_ThrowsValidationException(int geoId)
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            GeographyUnitId = geoId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            GeographyUnitId = geoId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Geography unit does not exist or is inactive."));
    }

    [Fact]
    public async Task CreateAsync_NullGeographyUnitId_PassesWhenAllowed()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            GeographyUnitId = null,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            GeographyUnitId = null,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1, FinancialYearId = 1 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ValidChargeHeadId_Succeeds()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ChargeHeadId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ChargeHeadId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1, FinancialYearId = 1, ChargeHeadId = 1 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NonExistingChargeHeadId_ThrowsValidationException_PreventsPersistence()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ChargeHeadId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ChargeHeadId = 999,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Charge head does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_InactiveChargeHeadId_ThrowsValidationException_PreventsPersistence()
    {
        _mockChargeHeadRepo.Setup(r => r.GetQueryable()).Returns(new List<ChargeHeadMasterEntity>
        {
            new() { Id = 1, IsActive = false }
        }.BuildMock());

        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ChargeHeadId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ChargeHeadId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Charge head does not exist or is inactive."));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateAsync_NegativeOrZeroChargeHeadId_ThrowsValidationException(int headId)
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ChargeHeadId = headId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ChargeHeadId = headId,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Charge head does not exist or is inactive."));
    }

    [Fact]
    public async Task CreateAsync_NullChargeHeadId_PassesWhenAllowed()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>().BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing);

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            ChargeHeadId = null,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ChargeHeadId = null,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 1, FinancialYearId = 1 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_InactiveFinancialYearId_ThrowsValidationException_PreventsPersistence()
    {
        var existingRule = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 5,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetByIdAsync(5L, It.IsAny<CancellationToken>())).ReturnsAsync(existingRule);

        _mockYearRepo.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity>
        {
            new() { Id = 1, IsActive = false }
        }.BuildMock());

        var updateDto = new UpdateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 3.0m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(5L, updateDto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Value.Contains("Financial year does not exist or is inactive."));

        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateConflictAsync_InvalidMasterReferences_ReturnsErrors()
    {
        var request = new WaterPenaltyRuleValidationRequestDto
        {
            FinancialYearId = 999, // non-existing
            ConnectionCategoryId = 999, // non-existing
            GeographyUnitId = 999, // non-existing
            ChargeHeadId = 999, // non-existing
            PenaltyType = "Percentage",
            PercentageRate = 5,
            EffectiveFrom = new DateTime(2026, 5, 1),
            IsCurrentBill = true
        };

        var result = await _service.ValidateConflictAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Contains("Financial year does not exist or is inactive."));
        Assert.Contains(result.Errors, e => e.Contains("Connection category does not exist or is inactive."));
        Assert.Contains(result.Errors, e => e.Contains("Geography unit does not exist or is inactive."));
        Assert.Contains(result.Errors, e => e.Contains("Charge head does not exist or is inactive."));
    }

    #endregion

    #region Related Master Names Population Tests

    private WaterPenaltyRuleService CreateServiceWithRealMapper()
    {
        var realMapper = NtisPlatform.Tests.Helpers.AutoMapperTestHelper.CreateMapper();
        return new WaterPenaltyRuleService(_mockRepo.Object, _mockUow.Object, realMapper, _validationService, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAllAsync_PopulatesRelatedNames_WhenMastersExist()
    {
        var service = CreateServiceWithRealMapper();
        var rules = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                ConnectionCategoryId = 1,
                GeographyUnitId = 1,
                ChargeHeadId = 1,
                PenaltyType = "Percentage",
                PercentageRate = 2.5m,
                EffectiveFrom = new DateTime(2026, 4, 1),
                IsCurrentBill = true,
                IsActive = true,
                FinancialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "2026-2027" },
                ConnectionCategory = new ConnectionCategoryMasterEntity { Id = 1, ConnectionCategory = "Commercial" },
                GeographyUnit = new GeographyUnitEntity { Id = 1, GeographyUnitName = "North Zone" },
                ChargeHead = new ChargeHeadMasterEntity { Id = 1, Name = "Water Tax" }
            }
        }.BuildMock();

        _mockRepo.Setup(r => r.GetQueryable()).Returns(rules);

        var result = await service.GetAllAsync(new WaterPenaltyRuleQueryParameters(), CancellationToken.None);

        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.Equal("2026-2027", item.FinancialYearName);
        Assert.Equal("Commercial", item.ConnectionCategoryName);
        Assert.Equal("North Zone", item.GeographyName);
        Assert.Equal("Water Tax", item.ChargeHeadName);
    }

    [Fact]
    public async Task GetAllAsync_NullOptionalReferences_SafelyReturnsNullNames()
    {
        var service = CreateServiceWithRealMapper();
        var rules = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                ConnectionCategoryId = null,
                GeographyUnitId = null,
                ChargeHeadId = null,
                PenaltyType = "Percentage",
                PercentageRate = 2.5m,
                EffectiveFrom = new DateTime(2026, 4, 1),
                IsCurrentBill = true,
                IsActive = true,
                FinancialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "2026-2027" },
                ConnectionCategory = null,
                GeographyUnit = null,
                ChargeHead = null
            }
        }.BuildMock();

        _mockRepo.Setup(r => r.GetQueryable()).Returns(rules);

        var result = await service.GetAllAsync(new WaterPenaltyRuleQueryParameters(), CancellationToken.None);

        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.Equal("2026-2027", item.FinancialYearName);
        Assert.Null(item.ConnectionCategoryName);
        Assert.Null(item.GeographyName);
        Assert.Null(item.ChargeHeadName);
    }

    [Fact]
    public async Task GetAllAsync_MissingNavigationReferences_SafelyReturnsNullNames()
    {
        var service = CreateServiceWithRealMapper();
        var rules = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                ConnectionCategoryId = 1,
                GeographyUnitId = 1,
                ChargeHeadId = 1,
                PenaltyType = "Percentage",
                PercentageRate = 2.5m,
                EffectiveFrom = new DateTime(2026, 4, 1),
                IsCurrentBill = true,
                IsActive = true,
                FinancialYear = null,
                ConnectionCategory = null,
                GeographyUnit = null,
                ChargeHead = null
            }
        }.BuildMock();

        _mockRepo.Setup(r => r.GetQueryable()).Returns(rules);

        var result = await service.GetAllAsync(new WaterPenaltyRuleQueryParameters(), CancellationToken.None);

        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.Null(item.FinancialYearName);
        Assert.Null(item.ConnectionCategoryName);
        Assert.Null(item.GeographyName);
        Assert.Null(item.ChargeHeadName);
    }

    [Fact]
    public async Task GetByIdAsync_PopulatesRelatedNames_WhenMastersExist()
    {
        var service = CreateServiceWithRealMapper();
        var rule = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 10,
            FinancialYearId = 1,
            ConnectionCategoryId = 1,
            GeographyUnitId = 1,
            ChargeHeadId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true,
            FinancialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "2026-2027" },
            ConnectionCategory = new ConnectionCategoryMasterEntity { Id = 1, ConnectionCategory = "Domestic" },
            GeographyUnit = new GeographyUnitEntity { Id = 1, GeographyUnitName = "South Zone" },
            ChargeHead = new ChargeHeadMasterEntity { Id = 1, Name = "Sewerage Tax" }
        };

        var queryable = new List<WaterPenaltyRuleMasterEntity> { rule }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(queryable);
        _mockRepo.Setup(r => r.GetByIdAsync(10L, It.IsAny<CancellationToken>())).ReturnsAsync(rule);

        var result = await service.GetByIdAsync(10L, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(10, result.PenaltyRuleId);
        Assert.Equal("2026-2027", result.FinancialYearName);
        Assert.Equal("Domestic", result.ConnectionCategoryName);
        Assert.Equal("South Zone", result.GeographyName);
        Assert.Equal("Sewerage Tax", result.ChargeHeadName);
    }

    [Fact]
    public async Task GetByIdAsync_NullOptionalReferences_SafelyReturnsNullNames()
    {
        var service = CreateServiceWithRealMapper();
        var rule = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 10,
            FinancialYearId = 1,
            ConnectionCategoryId = null,
            GeographyUnitId = null,
            ChargeHeadId = null,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true,
            FinancialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "2026-2027" },
            ConnectionCategory = null,
            GeographyUnit = null,
            ChargeHead = null
        };

        var queryable = new List<WaterPenaltyRuleMasterEntity> { rule }.BuildMock();
        _mockRepo.Setup(r => r.GetQueryable()).Returns(queryable);
        _mockRepo.Setup(r => r.GetByIdAsync(10L, It.IsAny<CancellationToken>())).ReturnsAsync(rule);

        var result = await service.GetByIdAsync(10L, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(10, result.PenaltyRuleId);
        Assert.Equal("2026-2027", result.FinancialYearName);
        Assert.Null(result.ConnectionCategoryName);
        Assert.Null(result.GeographyName);
        Assert.Null(result.ChargeHeadName);
    }

    #endregion

    #region PR #934 Copilot Findings 2, 3, and 7 Tests

    [Fact]
    public void CreateWaterPenaltyRuleDto_MissingEffectiveFrom_FailsValidationAttribute()
    {
        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = null,
            IsCurrentBill = true
        };

        var validationResults = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var context = new System.ComponentModel.DataAnnotations.ValidationContext(dto);
        var isValid = System.ComponentModel.DataAnnotations.Validator.TryValidateObject(dto, context, validationResults, validateAllProperties: true);

        Assert.False(isValid);
        Assert.Contains(validationResults, r => r.MemberNames.Contains(nameof(CreateWaterPenaltyRuleDto.EffectiveFrom)));
    }

    [Fact]
    public void CreateWaterPenaltyRuleDto_ValidEffectiveFrom_PassesValidationAttribute()
    {
        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true
        };

        var validationResults = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var context = new System.ComponentModel.DataAnnotations.ValidationContext(dto);
        var isValid = System.ComponentModel.DataAnnotations.Validator.TryValidateObject(dto, context, validationResults, validateAllProperties: true);

        Assert.True(isValid);
    }

    [Fact]
    public async Task CreateAsync_MissingEffectiveFrom_ThrowsValidationException()
    {
        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = null,
            IsCurrentBill = true
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Key == nameof(CreateWaterPenaltyRuleDto.EffectiveFrom));
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DefaultEffectiveFrom_ThrowsValidationException()
    {
        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = DateTime.MinValue,
            IsCurrentBill = true
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Key == nameof(CreateWaterPenaltyRuleDto.EffectiveFrom));
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_MissingEffectiveFrom_PreservesExistingDate()
    {
        var service = CreateServiceWithRealMapper();
        var originalDate = new DateTime(2026, 4, 1);
        var existingEntity = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = originalDate,
            IsCurrentBill = true,
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepo.Setup(r => r.GetQueryable()).Returns(new List<WaterPenaltyRuleMasterEntity> { existingEntity }.BuildMock());

        var updateDto = new UpdateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 4.0m,
            EffectiveFrom = null, // Omitted - must preserve existing date
            IsCurrentBill = true,
            IsActive = true
        };

        var result = await service.UpdateAsync(1L, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(originalDate, existingEntity.EffectiveFrom);
        Assert.Equal(4.0m, existingEntity.PercentageRate);
        _mockRepo.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidEffectiveFrom_UpdatesDate()
    {
        var service = CreateServiceWithRealMapper();
        var originalDate = new DateTime(2026, 4, 1);
        var newDate = new DateTime(2026, 7, 1);
        var existingEntity = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = originalDate,
            IsCurrentBill = true,
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepo.Setup(r => r.GetQueryable()).Returns(new List<WaterPenaltyRuleMasterEntity> { existingEntity }.BuildMock());

        var updateDto = new UpdateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            EffectiveFrom = newDate,
            IsCurrentBill = true,
            IsActive = true
        };

        var result = await service.UpdateAsync(1L, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(newDate, existingEntity.EffectiveFrom);
        _mockRepo.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DefaultEffectiveFrom_ThrowsValidationException()
    {
        var existingEntity = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        var updateDto = new UpdateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            EffectiveFrom = DateTime.MinValue
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1L, updateDto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Key == nameof(UpdateWaterPenaltyRuleDto.EffectiveFrom));
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_InactiveOverlappingRule_SucceedsWithoutConflictError()
    {
        var existingActiveRule = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            FromDay = 1,
            ToDay = 30,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetQueryable()).Returns(new List<WaterPenaltyRuleMasterEntity> { existingActiveRule }.BuildMock());

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 10,
            ToDay = 25,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = false // Inactive draft allowed
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 10,
            ToDay = 25,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = false
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleDto>(entity)).Returns(new WaterPenaltyRuleDto { PenaltyRuleId = 2 });
        _mockRepo.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepo.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ActiveOverlappingRule_ThrowsValidationException()
    {
        var existingActiveRule = new WaterPenaltyRuleMasterEntity
        {
            PenaltyRuleId = 1,
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m,
            FromDay = 1,
            ToDay = 30,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };
        _mockRepo.Setup(r => r.GetQueryable()).Returns(new List<WaterPenaltyRuleMasterEntity> { existingActiveRule }.BuildMock());

        var dto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 10,
            ToDay = 25,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true // Active conflict disallowed
        };
        var entity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 5.0m,
            FromDay = 10,
            ToDay = 25,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<WaterPenaltyRuleMasterEntity>(dto)).Returns(entity);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto, CancellationToken.None));
        Assert.Contains(ex.Errors, err => err.Key == nameof(WaterPenaltyRuleMasterEntity.FromDay));
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingRule_DeactivatesRuleAndDoesNotPhysicallyDelete()
    {
        var entity = new WaterPenaltyRuleMasterEntity { PenaltyRuleId = 1, IsActive = true };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var success = await _service.DeleteAsync(1L, CancellationToken.None);

        Assert.True(success);
        Assert.False(entity.IsActive);
        _mockRepo.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_WithExplicitUserId_DeactivatesAndSetsUpdatedBy()
    {
        var entity = new WaterPenaltyRuleMasterEntity { PenaltyRuleId = 1, IsActive = true, UpdatedBy = 0 };
        _mockRepo.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var success = await _service.DeleteAsync(1L, 42, CancellationToken.None);

        Assert.True(success);
        Assert.False(entity.IsActive);
        Assert.Equal(42, entity.UpdatedBy);
        _mockRepo.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_RuleNotFound_ReturnsFalse()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(999L, It.IsAny<CancellationToken>())).ReturnsAsync((WaterPenaltyRuleMasterEntity?)null);

        var success = await _service.DeleteAsync(999L, CancellationToken.None);

        Assert.False(success);
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<WaterPenaltyRuleMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateRuleAsync_WhenRuleCategoryIsNull_AndExistingHasSpecificCategory_DetectsConflict()
    {
        var existing = new List<WaterPenaltyRuleMasterEntity>
        {
            new()
            {
                PenaltyRuleId = 1,
                FinancialYearId = 1,
                ConnectionCategoryId = 1,
                PenaltyType = "Percentage",
                PercentageRate = 2.0m,
                FromDay = 1,
                ToDay = 30,
                EffectiveFrom = new DateTime(2026, 4, 1),
                EffectiveTo = new DateTime(2027, 3, 31),
                IsCurrentBill = true,
                IsPendingBill = false,
                IsActive = true
            }
        };
        _mockRepo.Setup(r => r.GetQueryable()).Returns(existing.BuildMock());

        var newRule = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ConnectionCategoryId = null, // Applies to ALL categories -> should conflict with specific category rule
            PenaltyType = "Percentage",
            PercentageRate = 3.0m,
            FromDay = 10,
            ToDay = 25,
            EffectiveFrom = new DateTime(2026, 6, 1),
            EffectiveTo = new DateTime(2026, 12, 31),
            IsCurrentBill = true,
            IsPendingBill = false,
            IsActive = true
        };

        var result = await _validationService.ValidateRuleAsync(newRule, null, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("conflicts with existing active rule", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ValidateRuleAsync_WhenChargeHeadIsRefundable_ReturnsValidationError()
    {
        _mockChargeHeadRepo.Setup(r => r.GetQueryable()).Returns(new List<ChargeHeadMasterEntity>
        {
            new() { Id = 2, IsActive = true, IsRefundable = true }
        }.BuildMock());

        var rule = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            ChargeHeadId = 2,
            PenaltyType = "Percentage",
            PercentageRate = 2.0m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        var result = await _validationService.ValidateRuleAsync(rule, null, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(WaterPenaltyRuleMasterEntity.ChargeHeadId) && e.ErrorMessage.Contains("refundable", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ValidateRuleAsync_WhenFlatPenaltyMaximumAmountIsLessThanFlatAmount_ReturnsValidationError()
    {
        var rule = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = 1,
            PenaltyType = "Flat",
            FlatAmount = 500m,
            MaximumAmount = 200m,
            EffectiveFrom = new DateTime(2026, 4, 1),
            IsCurrentBill = true,
            IsActive = true
        };

        var result = await _validationService.ValidateRuleAsync(rule, null, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(WaterPenaltyRuleMasterEntity.MaximumAmount) && e.ErrorMessage.Contains("cannot be less than FlatAmount", StringComparison.OrdinalIgnoreCase));
    }

    #endregion
}
