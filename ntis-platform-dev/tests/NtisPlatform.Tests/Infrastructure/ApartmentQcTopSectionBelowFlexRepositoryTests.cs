using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure;

public class ApartmentQcTopSectionBelowFlexRepositoryTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_NoDetailRow_ReturnsNotCompletedWithNullAudit()
    {
        using var context = CreateContext();
        context.PropertyWorkflowStageMaster.Add(new PropertyWorkflowStageMasterEntity
        {
            Id = 1,
            StageName = "GIS Verification",
            Description = "Verify GIS mapping",
            DisplayOrder = 1,
            IsActive = true,
            CreatedDate = DateTime.Now
        });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetWorkflowStagesAsync(propertyId: 100);

        var stage = Assert.Single(result);
        Assert.Equal("GIS Verification", stage.StageName);
        Assert.False(stage.IsCompleted);
        Assert.Null(stage.CreatedBy);
        Assert.Null(stage.CreatedDate);
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_LatestDetailRowWins_WhenMultipleRowsExist()
    {
        using var context = CreateContext();
        context.PropertyWorkflowStageMaster.Add(new PropertyWorkflowStageMasterEntity
        {
            Id = 1,
            StageName = "Assessment",
            DisplayOrder = 1,
            IsActive = true,
            CreatedDate = DateTime.Now
        });
        context.PropertyWorkflowDetails.AddRange(
            new PropertyWorkflowDetailsEntity
            {
                Id = 1,
                PropertyId = 100,
                WorkflowStageId = 1,
                CurrentStatus = false,
                IsActive = true,
                CreatedBy = 10,
                CreatedDate = new DateTime(2026, 1, 1)
            },
            new PropertyWorkflowDetailsEntity
            {
                Id = 2,
                PropertyId = 100,
                WorkflowStageId = 1,
                CurrentStatus = true,
                IsActive = true,
                CreatedBy = 20,
                CreatedDate = new DateTime(2026, 2, 1),
                UpdatedBy = 21,
                UpdatedDate = new DateTime(2026, 2, 2)
            });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetWorkflowStagesAsync(propertyId: 100);

        // Latest row (Id=2) is the current one and is the audit source; the stage was submitted, so it shows completed.
        var stage = Assert.Single(result);
        Assert.True(stage.IsCompleted);
        Assert.Equal(20, stage.CreatedBy);
        Assert.Equal(21, stage.UpdatedBy);
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_CurrentStatusFalse_IsCompleted()
    {
        using var context = CreateContext();
        context.PropertyWorkflowStageMaster.Add(new PropertyWorkflowStageMasterEntity
        {
            Id = 1,
            StageName = "GeoSequencing",
            DisplayOrder = 1,
            IsActive = true,
            CreatedDate = DateTime.Now
        });
        context.PropertyWorkflowDetails.Add(new PropertyWorkflowDetailsEntity
        {
            Id = 1,
            PropertyId = 100,
            WorkflowStageId = 1,
            CurrentStatus = false,
            IsActive = true,
            CreatedBy = 10,
            CreatedDate = new DateTime(2026, 1, 1)
        });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetWorkflowStagesAsync(propertyId: 100);

        var stage = Assert.Single(result);
        Assert.True(stage.IsCompleted);
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_CurrentStatusNull_IsCompleted()
    {
        using var context = CreateContext();
        context.PropertyWorkflowStageMaster.Add(new PropertyWorkflowStageMasterEntity
        {
            Id = 1,
            StageName = "InternalSurvey",
            DisplayOrder = 1,
            IsActive = true,
            CreatedDate = DateTime.Now
        });
        context.PropertyWorkflowDetails.Add(new PropertyWorkflowDetailsEntity
        {
            Id = 1,
            PropertyId = 100,
            WorkflowStageId = 1,
            CurrentStatus = null,
            IsActive = true,
            CreatedBy = 10,
            CreatedDate = new DateTime(2026, 1, 1)
        });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetWorkflowStagesAsync(propertyId: 100);

        var stage = Assert.Single(result);
        Assert.True(stage.IsCompleted);
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_CurrentStatusTrue_IsCompletedOnceSubmitted()
    {
        using var context = CreateContext();
        context.PropertyWorkflowStageMaster.Add(new PropertyWorkflowStageMasterEntity
        {
            Id = 1,
            StageName = "DataEntry",
            DisplayOrder = 1,
            IsActive = true,
            CreatedDate = DateTime.Now
        });
        context.PropertyWorkflowDetails.Add(new PropertyWorkflowDetailsEntity
        {
            Id = 1,
            PropertyId = 100,
            WorkflowStageId = 1,
            CurrentStatus = true,
            IsActive = true,
            CreatedBy = 10,
            CreatedDate = new DateTime(2026, 1, 1)
        });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetWorkflowStagesAsync(propertyId: 100);

        // The stage row exists because the stage was submitted; CurrentStatus = 1 only marks it as the current stage.
        var stage = Assert.Single(result);
        Assert.True(stage.IsCompleted);
    }

    private static async Task SeedStagesAsync(ApplicationDbContext context, int count)
    {
        for (var i = 1; i <= count; i++)
        {
            context.PropertyWorkflowStageMaster.Add(new PropertyWorkflowStageMasterEntity
            {
                Id = i, StageName = $"Stage {i}", DisplayOrder = i, IsActive = true, CreatedDate = DateTime.Now
            });
        }
        await context.SaveChangesAsync();
    }

    private static PropertyWorkflowDetailsEntity Row(int id, int stageId, bool? currentStatus) => new()
    {
        Id = id,
        PropertyId = 100,
        WorkflowStageId = stageId,
        CurrentStatus = currentStatus,
        IsActive = true,
        CreatedDate = new DateTime(2026, 10, 7, 11, 0, 0).AddMinutes(id)
    };

    [Fact]
    public async Task GetWorkflowStagesAsync_ForwardOnly_CurrentAndEarlierStagesAreCompleted()
    {
        using var context = CreateContext();
        await SeedStagesAsync(context, 4);
        context.PropertyWorkflowDetails.AddRange(Row(1, 1, false), Row(2, 2, false), Row(3, 3, true));
        await context.SaveChangesAsync();

        var result = await new ApartmentQcTopSectionBelowFlexRepository(context).GetWorkflowStagesAsync(100);

        Assert.Equal(new[] { true, true, true, false }, result.Select(s => s.IsCompleted));
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_SentBackToEarlierStage_LaterStagesAreNotCompleted()
    {
        // The property went forward through all 4 stages, then was sent back to stage 2 (current).
        // Stages 3 and 4 still have their old CurrentStatus = 0 rows but are past the current stage, so they must not show Completed.
        using var context = CreateContext();
        await SeedStagesAsync(context, 4);
        context.PropertyWorkflowDetails.AddRange(
            Row(1, 1, false), Row(2, 2, false), Row(3, 3, false), Row(4, 4, false),
            Row(5, 3, false), Row(6, 2, true));
        await context.SaveChangesAsync();

        var result = await new ApartmentQcTopSectionBelowFlexRepository(context).GetWorkflowStagesAsync(100);

        Assert.Equal(new[] { true, true, false, false }, result.Select(s => s.IsCompleted));
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_RowsWrittenAtTheSameTime_LatestStageIsTheCurrentOne()
    {
        // Property 1485263: stages 1, 2, 4 and 9 were written in one go (same CreatedDate), and the Ids are in no stage order
        // (the highest Id belongs to stage 2). The property is at its highest stage (9), not at the stage with the highest Id.
        using var context = CreateContext();
        await SeedStagesAsync(context, 9);
        var sameTime = new DateTime(2026, 7, 9, 17, 38, 57, 170);
        PropertyWorkflowDetailsEntity SameTimeRow(int id, int stageId) => new()
        {
            Id = id, PropertyId = 100, WorkflowStageId = stageId, CurrentStatus = false, IsActive = true, CreatedDate = sameTime
        };
        context.PropertyWorkflowDetails.AddRange(
            SameTimeRow(483847, 9), SameTimeRow(503720, 1), SameTimeRow(482606, 4), SameTimeRow(511952, 2));
        await context.SaveChangesAsync();

        var result = await new ApartmentQcTopSectionBelowFlexRepository(context).GetWorkflowStagesAsync(100);

        // 1, 2, 4, 9 have a row and the property is at 9: completed. 3 has no row at all, so it stays pending (as do 5-8).
        Assert.Equal(
            new[] { true, true, false, true, false, false, false, false, true },
            result.Select(s => s.IsCompleted));
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_FinishedAtLastStage_AllStagesCompleted()
    {
        using var context = CreateContext();
        await SeedStagesAsync(context, 3);
        context.PropertyWorkflowDetails.AddRange(Row(1, 1, false), Row(2, 2, false), Row(3, 3, false));
        await context.SaveChangesAsync();

        var result = await new ApartmentQcTopSectionBelowFlexRepository(context).GetWorkflowStagesAsync(100);

        Assert.All(result, s => Assert.True(s.IsCompleted));
    }

    [Fact]
    public async Task GetWorkflowStagesAsync_InactiveStage_Excluded()
    {
        using var context = CreateContext();
        context.PropertyWorkflowStageMaster.AddRange(
            new PropertyWorkflowStageMasterEntity { Id = 1, StageName = "Active Stage", DisplayOrder = 1, IsActive = true, CreatedDate = DateTime.Now },
            new PropertyWorkflowStageMasterEntity { Id = 2, StageName = "Inactive Stage", DisplayOrder = 2, IsActive = false, CreatedDate = DateTime.Now });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetWorkflowStagesAsync(propertyId: 100);

        var stage = Assert.Single(result);
        Assert.Equal("Active Stage", stage.StageName);
    }

    [Fact]
    public async Task GetCertificateTypesAsync_NoCertificate_ReturnsNotIssued()
    {
        using var context = CreateContext();
        context.PropertyCertificateTypeMasters.Add(new PropertyCertificateTypeMasterEntity
        {
            Id = 1,
            CertificateTypeCode = "CC",
            CertificateTypeName = "Completion Certificate",
            DisplayOrder = 1,
            IsActive = true
        });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetCertificateTypesAsync(propertyId: 100);

        var type = Assert.Single(result);
        Assert.Equal("CC", type.CertificateTypeCode);
        Assert.False(type.IsIssued);
        Assert.Null(type.CertificateNo);
    }

    [Fact]
    public async Task GetCertificateTypesAsync_ActivePropertyLevelCertificate_ReturnsIssuedWithAudit()
    {
        using var context = CreateContext();
        context.PropertyCertificateTypeMasters.Add(new PropertyCertificateTypeMasterEntity
        {
            Id = 1,
            CertificateTypeCode = "OC",
            CertificateTypeName = "Occupancy Certificate",
            DisplayOrder = 1,
            IsActive = true
        });
        var cert = PropertyCertificateEntity.Create(propertyId: 100, certificateTypeId: 1, certificateNo: "OC-2026-001", issueDate: new DateTime(2026, 3, 1));
        cert.CreatedBy = 30;
        cert.CreatedDate = new DateTime(2026, 3, 1);
        context.PropertyCertificates.Add(cert);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetCertificateTypesAsync(propertyId: 100);

        var type = Assert.Single(result);
        Assert.True(type.IsIssued);
        Assert.Equal("OC-2026-001", type.CertificateNo);
        Assert.Equal(30, type.CreatedBy);
    }

    [Fact]
    public async Task GetCertificateTypesAsync_FloorLevelCertificate_ExcludedFromPropertyLevelPanel()
    {
        using var context = CreateContext();
        context.PropertyCertificateTypeMasters.Add(new PropertyCertificateTypeMasterEntity
        {
            Id = 1,
            CertificateTypeCode = "CC",
            CertificateTypeName = "Completion Certificate",
            DisplayOrder = 1,
            IsActive = true
        });
        // No PropertyDetails row is seeded for propertyId 100, so the active-row count is 0
        // (not exactly 1) — a PropertyDetailsId-scoped certificate stays ambiguous/excluded.
        var floorCert = PropertyCertificateEntity.Create(propertyId: 100, certificateTypeId: 1, certificateNo: "CC-FLOOR-1", issueDate: DateTime.Now, propertyDetailsId: 55);
        context.PropertyCertificates.Add(floorCert);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetCertificateTypesAsync(propertyId: 100);

        var type = Assert.Single(result);
        Assert.False(type.IsIssued);
    }

    [Fact]
    public async Task GetCertificateTypesAsync_FloorLevelCertificate_IncludedWhenPropertyHasSingleDetailsRow()
    {
        using var context = CreateContext();
        context.PropertyCertificateTypeMasters.Add(new PropertyCertificateTypeMasterEntity
        {
            Id = 1,
            CertificateTypeCode = "CC",
            CertificateTypeName = "Completion Certificate",
            DisplayOrder = 1,
            IsActive = true
        });
        // A single-unit individual property has exactly one active PropertyDetails row, so a
        // certificate scoped to that one row IS effectively the property's certificate — this
        // reproduces the real bug found against PropertyId 1488616, where the only active CC
        // certificate had PropertyDetailsId set and was being hidden from the status panel.
        context.PropertyDetails.Add(new PropertyDetailsEntity
        {
            Id = 55,
            PropertyId = 100,
            TypeOfUseId = 1,
            IsActive = true,
            MarkedForDeletion = false
        });
        var floorCert = PropertyCertificateEntity.Create(propertyId: 100, certificateTypeId: 1, certificateNo: "CC-FLOOR-1", issueDate: DateTime.Now, propertyDetailsId: 55);
        context.PropertyCertificates.Add(floorCert);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetCertificateTypesAsync(propertyId: 100);

        var type = Assert.Single(result);
        Assert.True(type.IsIssued);
        Assert.Equal("CC-FLOOR-1", type.CertificateNo);
    }

    [Fact]
    public async Task GetCertificateTypesAsync_FloorLevelCertificate_ExcludedWhenPropertyHasMultipleDetailsRows()
    {
        using var context = CreateContext();
        context.PropertyCertificateTypeMasters.Add(new PropertyCertificateTypeMasterEntity
        {
            Id = 1,
            CertificateTypeCode = "CC",
            CertificateTypeName = "Completion Certificate",
            DisplayOrder = 1,
            IsActive = true
        });
        // Two active PropertyDetails rows (e.g. ground floor + first floor under one property) —
        // a certificate scoped to only one of them must not be reported as covering the whole
        // property, preserving the original multi-floor/mixed-use exclusion behavior.
        context.PropertyDetails.AddRange(
            new PropertyDetailsEntity { Id = 55, PropertyId = 100, TypeOfUseId = 1, IsActive = true, MarkedForDeletion = false },
            new PropertyDetailsEntity { Id = 56, PropertyId = 100, TypeOfUseId = 1, IsActive = true, MarkedForDeletion = false });
        var floorCert = PropertyCertificateEntity.Create(propertyId: 100, certificateTypeId: 1, certificateNo: "CC-FLOOR-1", issueDate: DateTime.Now, propertyDetailsId: 55);
        context.PropertyCertificates.Add(floorCert);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetCertificateTypesAsync(propertyId: 100);

        var type = Assert.Single(result);
        Assert.False(type.IsIssued);
    }

    [Fact]
    public async Task GetCertificateTypesAsync_CertificateFromAnotherProperty_NotIncluded()
    {
        using var context = CreateContext();
        context.PropertyCertificateTypeMasters.Add(new PropertyCertificateTypeMasterEntity
        {
            Id = 1,
            CertificateTypeCode = "OC",
            CertificateTypeName = "Occupancy Certificate",
            DisplayOrder = 1,
            IsActive = true
        });
        var otherPropertyCert = PropertyCertificateEntity.Create(propertyId: 999, certificateTypeId: 1, certificateNo: "OC-OTHER-PROPERTY", issueDate: DateTime.Now);
        context.PropertyCertificates.Add(otherPropertyCert);
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetCertificateTypesAsync(propertyId: 100);

        var type = Assert.Single(result);
        Assert.False(type.IsIssued);
        Assert.Null(type.CertificateNo);
    }

    [Fact]
    public async Task GetCertificateTypesAsync_InactiveCertificateType_Excluded()
    {
        using var context = CreateContext();
        context.PropertyCertificateTypeMasters.AddRange(
            new PropertyCertificateTypeMasterEntity { Id = 1, CertificateTypeCode = "CC", CertificateTypeName = "Completion Certificate", DisplayOrder = 1, IsActive = true },
            new PropertyCertificateTypeMasterEntity { Id = 2, CertificateTypeCode = "OLD", CertificateTypeName = "Retired Type", DisplayOrder = 2, IsActive = false });
        await context.SaveChangesAsync();

        var repository = new ApartmentQcTopSectionBelowFlexRepository(context);
        var result = await repository.GetCertificateTypesAsync(propertyId: 100);

        var type = Assert.Single(result);
        Assert.Equal("CC", type.CertificateTypeCode);
    }
}
