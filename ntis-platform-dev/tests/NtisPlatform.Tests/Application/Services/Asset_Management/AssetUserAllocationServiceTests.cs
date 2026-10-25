using System.Data.Common;
using System.Linq.Expressions;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Api.Controllers.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetUserAllocation;
using NtisPlatform.Application.DTOs.Master.UserMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Covers <see cref="AssetUserAllocationService"/> against a real SQLite in-memory database whose
/// [AMS].[UserOwningDepartmentAllocation] / [AMS].[UserZoneAllocation] have the same FKs and the same
/// unfiltered unique constraints (UserId + OwningDepartmentId / UserId + ZoneId + WardId) as SQL Server — a
/// save that inserted a second row for a re-selected department or ward would fail here, which a mocked
/// repository would never catch. Saves run in a real SQLite transaction, and <see cref="CommandLog"/> records the
/// SQL each one sends (to show the user's row is locked inside that transaction before any allocation is read).
/// The audit user comes from a fake ICurrentUserService (the token's user id), as in production.
/// </summary>
public sealed class AssetUserAllocationServiceTests : IDisposable
{
    private const int UserId = 10;              // active, in Asset Management
    private const int LockedUserId = 11;        // inactive, in Asset Management
    private const int DeletedUserId = 12;       // marked for deletion, in Asset Management
    private const int PropertyTaxUserId = 13;   // only in Property Tax
    private const int FormerAssetUserId = 14;   // Asset Management allocation deactivated
    private const int SecondAssetUserId = 15;   // active, in Asset Management — seeded only by list tests that need two
    private const int AuditUserId = 1;          // authenticated caller of POST
    private const int EditorUserId = 42;        // authenticated caller of PUT

    private const int PropertyTaxDepartment = 1;
    private const int AssetDepartment = 3;
    private const int AssetAdminRole = 1;
    private const int PropertyTaxClerkRole = 2;

    private const int PublicWorks = 1;
    private const int Revenue = 2;
    private const int Housing = 3;
    private const int InactiveDept = 4;
    private const int DeletedDept = 5;

    private const int ExecutiveEngineer = 1;    // Public Works
    private const int TaxInspector = 2;         // Revenue
    private const int InactiveDesignation = 3;  // Public Works
    private const int DeletedDesignation = 4;   // Public Works

    private const int ZoneA = 1;
    private const int ZoneB = 2;
    private const int ZoneWithoutWards = 3;     // active, no active ward
    private const int InactiveZone = 4;

    private const int Ward1 = 1;                // Zone A
    private const int Ward2 = 2;                // Zone B
    private const int InactiveWard = 3;         // Zone A
    private const int Ward4 = 4;                // Zone A

    private const int Stage1 = 1;               // grievance workflow stage, order 1
    private const int Stage2 = 2;               // order 2
    private const int InactiveStage = 3;
    private const int DeletedStage = 4;

    private readonly SqliteConnection _connection;
    private readonly AllocationDbContext _context;
    private readonly SqliteUnitOfWork _unitOfWork;
    private readonly CommandLog _commands = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private int _actingUserId = AuditUserId;    // the authenticated caller (token user id) of the next call
    private readonly AssetUserAllocationService _service;

    public AssetUserAllocationServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        _context = new AllocationDbContext(new DbContextOptionsBuilder<AllocationDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(_commands)
            .Options);
        _context.Database.EnsureCreated();

        _context.AddRange(
            new UserEntity { Id = UserId, UserName = "asset.user", FirstName = "Asha", Email = "asha@example.com" },
            new UserEntity { Id = LockedUserId, UserName = "locked.user", IsActive = false },
            new UserEntity { Id = DeletedUserId, UserName = "deleted.user", IsActive = false, MarkedForDeletion = true },
            new UserEntity { Id = PropertyTaxUserId, UserName = "pt.user" },
            new UserEntity { Id = FormerAssetUserId, UserName = "former.asset.user" },
            new DepartmentMasterEntity { Id = PropertyTaxDepartment, DepartmentCode = "PT", DepartmentName = "Property Tax" },
            new DepartmentMasterEntity { Id = AssetDepartment, DepartmentCode = "AM", DepartmentName = AssetUserAllocationService.AssetDepartmentName },
            new UserRoleMasterEntity { Id = AssetAdminRole, UserRoleName = "Asset Admin", DepartmentId = AssetDepartment },
            new UserRoleMasterEntity { Id = PropertyTaxClerkRole, UserRoleName = "PT Clerk", DepartmentId = PropertyTaxDepartment },
            DepartmentAllocation(UserId, AssetDepartment),
            DepartmentAllocation(UserId, PropertyTaxDepartment),
            DepartmentAllocation(LockedUserId, AssetDepartment),
            DepartmentAllocation(DeletedUserId, AssetDepartment),
            DepartmentAllocation(PropertyTaxUserId, PropertyTaxDepartment),
            DepartmentAllocation(FormerAssetUserId, AssetDepartment, isActive: false),
            new UserRoleAllocationEntity { UserId = UserId, DepartmentId = AssetDepartment, UserRoleId = AssetAdminRole },
            new UserRoleAllocationEntity { UserId = UserId, DepartmentId = PropertyTaxDepartment, UserRoleId = PropertyTaxClerkRole },
            new OwningDepartmentEntity { Id = PublicWorks, OwningDepartmentName = "Public Works Department" },
            new OwningDepartmentEntity { Id = Revenue, OwningDepartmentName = "Revenue Department" },
            new OwningDepartmentEntity { Id = Housing, OwningDepartmentName = "Housing Department" },
            new OwningDepartmentEntity { Id = InactiveDept, OwningDepartmentName = "Inactive Department", IsActive = false },
            new OwningDepartmentEntity { Id = DeletedDept, OwningDepartmentName = "Deleted Department", MarkedForDeletion = true },
            Designation(ExecutiveEngineer, "Executive Engineer", PublicWorks),
            Designation(TaxInspector, "Tax Inspector", Revenue),
            Designation(InactiveDesignation, "Inactive Designation", PublicWorks, isActive: false),
            Designation(DeletedDesignation, "Deleted Designation", PublicWorks, markedForDeletion: true),
            new ZoneEntity { Id = ZoneA, ZoneNo = "A", Description = "Zone A", SequenceNo = 1 },
            new ZoneEntity { Id = ZoneB, ZoneNo = "B", Description = "Zone B", SequenceNo = 2 },
            new ZoneEntity { Id = ZoneWithoutWards, ZoneNo = "C", Description = "Zone C", SequenceNo = 3 },
            new ZoneEntity { Id = InactiveZone, ZoneNo = "X", Description = "Zone X", IsActive = false },
            new WardEntity { Id = Ward1, WardNo = "W1", Description = "Ward 1", ZoneId = ZoneA },
            new WardEntity { Id = Ward2, WardNo = "W2", Description = "Ward 2", ZoneId = ZoneB },
            new WardEntity { Id = InactiveWard, WardNo = "W9", Description = "Ward 9", ZoneId = ZoneA, IsActive = false },
            new WardEntity { Id = Ward4, WardNo = "W4", Description = "Ward 4", ZoneId = ZoneA },
            WorkflowStage(Stage2, "VER", "Verification", 2),
            WorkflowStage(Stage1, "COR", "Correction", 1),
            WorkflowStage(InactiveStage, "APP", "Approval", 3, isActive: false),
            WorkflowStage(DeletedStage, "CLS", "Closure", 4, markedForDeletion: true));
        _context.SaveChanges();
        _context.ChangeTracker.Clear();

        _unitOfWork = new SqliteUnitOfWork(_context);
        _currentUser.Setup(u => u.GetCurrentUserId()).Returns(() => _actingUserId);

        _service = new AssetUserAllocationService(
            new SqliteRepository<UserEntity>(_context),
            new SqliteRepository<DepartmentMasterEntity>(_context),
            new SqliteRepository<UserDepartmentAllocationEntity>(_context),
            new SqliteRepository<UserRoleAllocationEntity>(_context),
            new SqliteRepository<UserOwningDepartmentAllocationEntity>(_context),
            new SqliteRepository<UserZoneAllocationEntity>(_context),
            new SqliteRepository<OwningDepartmentEntity>(_context),
            new SqliteRepository<AssetDesignationEntity>(_context),
            new SqliteRepository<ZoneEntity>(_context),
            new SqliteRepository<WardEntity>(_context),
            new SqliteRepository<GrievanceStageAccessControlEntity>(_context),
            new SqliteRepository<GrievanceWorkflowStageMasterEntity>(_context),
            _currentUser.Object,
            _unitOfWork,
            NullLogger<AssetUserAllocationService>.Instance);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    // SaveAsync (POST)

    [Fact]
    public async Task SaveAsync_NewUser_InsertsOneRowPerDepartmentAndZoneWithNames()
    {
        var result = await SaveAsync(UserId,
            [Dept(Revenue, TaxInspector), Dept(PublicWorks)],
            [Zone(ZoneB, Ward2), Zone(ZoneA, Ward1)]);

        var departmentRows = await DepartmentRowsAsync(UserId);
        departmentRows.Select(r => (r.OwningDepartmentId, r.DesignationId)).Should().BeEquivalentTo(new (int, int?)[]
        {
            (PublicWorks, null),
            (Revenue, TaxInspector)
        });
        departmentRows.Should().OnlyContain(r => r.IsActive && !r.MarkedForDeletion && r.CreatedBy == AuditUserId && r.CreatedDate != null);

        var zoneRows = await ZoneRowsAsync(UserId);
        zoneRows.Select(r => (r.ZoneId, r.WardId)).Should().BeEquivalentTo(new[] { (ZoneA, Ward1), (ZoneB, Ward2) });
        zoneRows.Should().OnlyContain(r => r.IsActive && r.CreatedBy == AuditUserId);

        result.UserId.Should().Be(UserId);
        result.OwningDepartments.Select(d => (d.OwningDepartmentName, d.DesignationName)).Should().Equal(
            ("Public Works Department", (string?)null),
            ("Revenue Department", "Tax Inspector"));
        result.ZoneAllocations.Select(z => (z.ZoneNo, z.ZoneDescription, z.WardNo, z.WardDescription)).Should().Equal(
            ("A", "Zone A", "W1", "Ward 1"),
            ("B", "Zone B", "W2", "Ward 2"));
        result.OwningDepartments[0].Id.Should().Be(departmentRows.Single(r => r.OwningDepartmentId == PublicWorks).Id);
    }

    [Fact]
    public async Task SaveAsync_ChangedSelection_DeactivatesRemovedInsertsNewAndLeavesKeptRowsUntouched()
    {
        await SaveAsync(UserId, [Dept(PublicWorks), Dept(Revenue)], [Zone(ZoneA, Ward1)]);
        var revenueRowId = (await DepartmentRowsAsync(UserId)).Single(r => r.OwningDepartmentId == Revenue).Id;

        await SaveAsync(UserId, [Dept(Revenue), Dept(Housing)], [Zone(ZoneA, Ward1)]);

        var rows = await DepartmentRowsAsync(UserId);
        rows.Should().HaveCount(3);
        rows.Single(r => r.OwningDepartmentId == PublicWorks).Should()
            .Match<UserOwningDepartmentAllocationEntity>(r => !r.IsActive && r.UpdatedBy == AuditUserId && r.UpdatedDate != null);
        rows.Single(r => r.OwningDepartmentId == Revenue).Should()
            .Match<UserOwningDepartmentAllocationEntity>(r => r.Id == revenueRowId && r.IsActive && r.UpdatedDate == null);
        rows.Single(r => r.OwningDepartmentId == Housing).IsActive.Should().BeTrue();
        (await ZoneRowsAsync(UserId)).Should().ContainSingle().Which.UpdatedDate.Should().BeNull();
    }

    [Fact]
    public async Task SaveAsync_ReselectedDepartmentAndZone_ReuseTheirRows()
    {
        // The unique constraints include inactive rows, so inserting again would fail.
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);
        var departmentRowId = (await DepartmentRowsAsync(UserId)).Single().Id;
        var zoneRowId = (await ZoneRowsAsync(UserId)).Single().Id;
        await SaveAsync(UserId, [Dept(Revenue)], [Zone(ZoneB, Ward2)]);

        await SaveAsync(UserId, [Dept(PublicWorks), Dept(Revenue)], [Zone(ZoneA, Ward1), Zone(ZoneB, Ward2)]);

        var departmentRows = await DepartmentRowsAsync(UserId);
        departmentRows.Should().HaveCount(2).And.OnlyContain(r => r.IsActive);
        departmentRows.Single(r => r.OwningDepartmentId == PublicWorks).Id.Should().Be(departmentRowId);
        var zoneRows = await ZoneRowsAsync(UserId);
        zoneRows.Should().HaveCount(2).And.OnlyContain(r => r.IsActive);
        zoneRows.Single(r => r.ZoneId == ZoneA).Id.Should().Be(zoneRowId);
    }

    [Fact]
    public async Task SaveAsync_ChangedDesignation_UpdatesTheSameRow()
    {
        await SaveAsync(UserId, [Dept(PublicWorks, ExecutiveEngineer)], null);
        var rowId = (await DepartmentRowsAsync(UserId)).Single().Id;

        var result = await SaveAsync(UserId, [Dept(PublicWorks)], null);

        var row = (await DepartmentRowsAsync(UserId)).Should().ContainSingle().Subject;
        (row.Id, row.DesignationId, row.IsActive, row.UpdatedBy).Should().Be((rowId, (int?)null, true, (int?)AuditUserId));
        result.OwningDepartments.Single().DesignationName.Should().BeNull();
    }

    [Fact]
    public async Task SaveAsync_ChangedWard_RetiresOldWardRowAndAddsTheNewWard()
    {
        await SaveAsync(UserId, null, [Zone(ZoneA, Ward1)]);
        var ward1RowId = (await ZoneRowsAsync(UserId)).Single().Id;

        var result = await SaveAsync(UserId, null, [Zone(ZoneA, Ward4)]);

        var rows = await ZoneRowsAsync(UserId);
        rows.Should().HaveCount(2);
        rows.Single(r => r.WardId == Ward1).Should()
            .Match<UserZoneAllocationEntity>(r => r.Id == ward1RowId && !r.IsActive && r.UpdatedBy == AuditUserId);
        rows.Single(r => r.WardId == Ward4).Should()
            .Match<UserZoneAllocationEntity>(r => r.ZoneId == ZoneA && r.IsActive && r.CreatedBy == AuditUserId);
        result.ZoneAllocations.Should().ContainSingle().Which.WardNo.Should().Be("W4");
    }

    [Fact]
    public async Task SaveAsync_ZoneWithoutWards_AllocatesEveryActiveWardOfTheZone()
    {
        var result = await SaveAsync(UserId, null, [Zone(ZoneA)]);

        (await ZoneRowsAsync(UserId)).Select(r => (r.ZoneId, r.WardId)).Should()
            .BeEquivalentTo(new[] { (ZoneA, Ward1), (ZoneA, Ward4) });   // InactiveWard is not allocated
        result.ZoneAllocations.Select(z => (z.ZoneNo, z.WardNo)).Should().Equal(("A", "W1"), ("A", "W4"));
    }

    [Fact]
    public async Task SaveAsync_EmptyWardIds_MeansTheWholeZone()
    {
        await _service.SaveAsync(new SaveAssetUserAllocationDto
        {
            UserId = UserId,
            ZoneAllocations = [new ZoneAllocationItemDto { ZoneId = ZoneA, WardIds = [] }]
        });
        _context.ChangeTracker.Clear();

        (await ZoneRowsAsync(UserId)).Select(r => r.WardId).Should().BeEquivalentTo(new[] { Ward1, Ward4 });
    }

    [Fact]
    public async Task SaveAsync_SelectedWards_AllocatesOnlyThoseWards()
    {
        var result = await SaveAsync(UserId, null, [Zone(ZoneA, Ward4), Zone(ZoneB)]);

        (await ZoneRowsAsync(UserId)).Select(r => (r.ZoneId, r.WardId)).Should()
            .BeEquivalentTo(new[] { (ZoneA, Ward4), (ZoneB, Ward2) });
        result.ZoneAllocations.Select(z => z.WardNo).Should().Equal("W4", "W2");
    }

    [Fact]
    public async Task SaveAsync_WholeZoneThenSelectedWard_RetiresTheOtherWardsAndKeepsTheSelectedRow()
    {
        await SaveAsync(UserId, null, [Zone(ZoneA)]);
        var ward4RowId = (await ZoneRowsAsync(UserId)).Single(r => r.WardId == Ward4).Id;

        await SaveAsync(UserId, null, [Zone(ZoneA, Ward4)]);

        var rows = await ZoneRowsAsync(UserId);
        rows.Should().HaveCount(2);
        rows.Single(r => r.WardId == Ward1).IsActive.Should().BeFalse();
        rows.Single(r => r.WardId == Ward4).Should()
            .Match<UserZoneAllocationEntity>(r => r.Id == ward4RowId && r.IsActive && r.UpdatedDate == null);
    }

    [Fact]
    public async Task SaveAsync_SelectedWardThenWholeZone_RevivesAndAddsWards()
    {
        await SaveAsync(UserId, null, [Zone(ZoneA, Ward1)]);
        await SaveAsync(UserId, null, [Zone(ZoneB, Ward2)]);                 // Ward1 row retired
        var ward1RowId = (await ZoneRowsAsync(UserId)).Single(r => r.WardId == Ward1).Id;

        await SaveAsync(UserId, null, [Zone(ZoneA)]);

        var rows = await ZoneRowsAsync(UserId);
        rows.Where(r => r.IsActive).Select(r => r.WardId).Should().BeEquivalentTo(new[] { Ward1, Ward4 });
        rows.Single(r => r.WardId == Ward1).Id.Should().Be(ward1RowId);
        rows.Single(r => r.WardId == Ward2).IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task SaveAsync_ZoneWithoutActiveWards_Throws()
    {
        var act = () => SaveAsync(UserId, null, [Zone(ZoneWithoutWards)]);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should()
            .Contain($"Zone {ZoneWithoutWards} has no active wards");
        (await ZoneRowsAsync(UserId)).Should().BeEmpty();
    }

    [Fact]
    public async Task SaveAsync_UnchangedSelection_DoesNotTouchAnyRow()
    {
        await SaveAsync(UserId, [Dept(PublicWorks, ExecutiveEngineer), Dept(Revenue)], [Zone(ZoneA, Ward1)]);

        await SaveAsync(UserId, [Dept(Revenue), Dept(PublicWorks, ExecutiveEngineer)], [Zone(ZoneA, Ward1)]);

        (await DepartmentRowsAsync(UserId)).Should().OnlyContain(r => r.UpdatedDate == null);
        (await ZoneRowsAsync(UserId)).Should().OnlyContain(r => r.UpdatedDate == null);
    }

    [Fact]
    public async Task SaveAsync_AllListsEmpty_DeactivatesEveryRow()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);

        var result = await SaveAsync(UserId, [], []);

        result.OwningDepartments.Should().BeEmpty();
        result.ZoneAllocations.Should().BeEmpty();
        (await DepartmentRowsAsync(UserId)).Should().ContainSingle().Which.Should()
            .Match<UserOwningDepartmentAllocationEntity>(r => !r.IsActive && r.UpdatedBy == AuditUserId);
        (await ZoneRowsAsync(UserId)).Should().ContainSingle().Which.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task SaveAsync_NothingAllocatedAndNoRows_SavesNothing()
    {
        var result = await SaveAsync(UserId, [], []);

        result.OwningDepartments.Should().BeEmpty();
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
        (await ZoneRowsAsync(UserId)).Should().BeEmpty();
    }

    [Fact]
    public async Task SaveAsync_OmittedDepartments_KeepsThemAndSyncsZones()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);

        var result = await SaveAsync(UserId, null, [Zone(ZoneB, Ward2)]);

        (await DepartmentRowsAsync(UserId)).Should().ContainSingle().Which.Should()
            .Match<UserOwningDepartmentAllocationEntity>(r => r.OwningDepartmentId == PublicWorks && r.IsActive && r.UpdatedDate == null);
        (await ZoneRowsAsync(UserId)).Where(r => r.IsActive).Select(r => r.WardId).Should().Equal(Ward2);
        result.OwningDepartments.Should().ContainSingle();
    }

    [Fact]
    public async Task SaveAsync_OmittedZones_KeepsThemAndSyncsDepartments()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA)]);

        await SaveAsync(UserId, [Dept(Revenue)], null);

        (await DepartmentRowsAsync(UserId)).Where(r => r.IsActive).Select(r => r.OwningDepartmentId).Should().Equal(Revenue);
        (await ZoneRowsAsync(UserId)).Should().HaveCount(2).And.OnlyContain(r => r.IsActive && r.UpdatedDate == null);
    }

    [Fact]
    public async Task SaveAsync_IdenticalDuplicateItems_StoredOnce()
    {
        await SaveAsync(UserId, [Dept(PublicWorks, ExecutiveEngineer), Dept(PublicWorks, ExecutiveEngineer)], [Zone(ZoneA, Ward1), Zone(ZoneA, Ward1)]);

        (await DepartmentRowsAsync(UserId)).Should().ContainSingle();
        (await ZoneRowsAsync(UserId)).Should().ContainSingle();
    }

    [Fact]
    public async Task SaveAsync_DepartmentListedWithDifferentDesignations_Throws()
    {
        var act = () => SaveAsync(UserId, [Dept(PublicWorks, ExecutiveEngineer), Dept(PublicWorks)], null);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Contain("one designation per department");
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
    }

    [Fact]
    public async Task SaveAsync_ZoneListedTwiceWithDifferentWards_AllocatesBothWards()
    {
        await SaveAsync(UserId, null, [Zone(ZoneA, Ward1), Zone(ZoneA, Ward4)]);

        (await ZoneRowsAsync(UserId)).Select(r => r.WardId).Should().BeEquivalentTo(new[] { Ward1, Ward4 });
    }

    [Fact]
    public async Task SaveAsync_ZoneListedWithWardsAndAsWholeZone_AllocatesTheWholeZone()
    {
        await SaveAsync(UserId, null, [Zone(ZoneA, Ward1), Zone(ZoneA)]);

        (await ZoneRowsAsync(UserId)).Select(r => r.WardId).Should().BeEquivalentTo(new[] { Ward1, Ward4 });
    }

    [Theory]
    [InlineData(0, null, null, null)]
    [InlineData(PublicWorks, -1, null, null)]
    [InlineData(null, null, 0, Ward1)]
    [InlineData(null, null, ZoneA, 0)]
    public async Task SaveAsync_NonPositiveId_ThrowsAndSavesNothing(int? dept, int? designation, int? zone, int? ward)
    {
        var act = () => SaveAsync(UserId, Depts(dept, designation), Zones(zone, ward));

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Contain("positive");
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
        (await ZoneRowsAsync(UserId)).Should().BeEmpty();
    }

    [Theory]
    [InlineData(InactiveDept, null, null, null, InactiveDept)]
    [InlineData(DeletedDept, null, null, null, DeletedDept)]
    [InlineData(999, null, null, null, 999)]
    [InlineData(PublicWorks, InactiveDesignation, null, null, InactiveDesignation)]
    [InlineData(PublicWorks, DeletedDesignation, null, null, DeletedDesignation)]
    [InlineData(PublicWorks, 999, null, null, 999)]
    [InlineData(null, null, InactiveZone, Ward1, InactiveZone)]
    [InlineData(null, null, 999, Ward1, 999)]
    [InlineData(null, null, ZoneA, InactiveWard, InactiveWard)]
    [InlineData(null, null, ZoneA, 999, 999)]
    public async Task SaveAsync_UnassignableMaster_ThrowsAndSavesNothing(int? dept, int? designation, int? zone, int? ward, int badId)
    {
        var act = () => SaveAsync(UserId, Depts(dept, designation), Zones(zone, ward));

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Contain("not found or inactive")
            .And.Contain(badId.ToString());
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
        (await ZoneRowsAsync(UserId)).Should().BeEmpty();
    }

    [Fact]
    public async Task SaveAsync_DesignationOfAnotherDepartment_Throws()
    {
        var act = () => SaveAsync(UserId, [Dept(PublicWorks, TaxInspector)], null);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should()
            .Contain($"Designation {TaxInspector} does not belong to owning department {PublicWorks}");
    }

    [Fact]
    public async Task SaveAsync_WardOfAnotherZone_Throws()
    {
        var act = () => SaveAsync(UserId, null, [Zone(ZoneA, Ward2)]);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Contain($"Ward {Ward2} does not belong to zone {ZoneA}");
    }

    [Fact]
    public async Task SaveAsync_AlreadyAllocatedMasterLaterDeactivated_DoesNotBlockSave()
    {
        await SaveAsync(UserId, [Dept(Revenue, TaxInspector)], [Zone(ZoneA, Ward1)]);
        var zone = await _context.Set<ZoneEntity>().SingleAsync(z => z.Id == ZoneA);
        zone.IsActive = false;
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var result = await SaveAsync(UserId, [Dept(Revenue, TaxInspector), Dept(Housing)], [Zone(ZoneA, Ward1)]);

        result.OwningDepartments.Should().HaveCount(2);
        result.ZoneAllocations.Single().ZoneId.Should().Be(ZoneA);
    }

    // Only what the user currently has skips the active check: re-adding a removed (retired) value is a new grant.
    [Fact]
    public async Task SaveAsync_RemovedDepartmentReaddedAfterItsMasterWasDeactivated_IsRejectedAsANewGrant()
    {
        await SaveAsync(UserId, [Dept(PublicWorks), Dept(Revenue)], null);
        await SaveAsync(UserId, [Dept(Revenue)], null);                         // Public Works row retired
        await DeactivateAsync<OwningDepartmentEntity>(PublicWorks);

        var act = () => SaveAsync(UserId, [Dept(Revenue), Dept(PublicWorks)], null);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Contain($"not found or inactive: {PublicWorks}");
        (await DepartmentRowsAsync(UserId)).Single(r => r.OwningDepartmentId == PublicWorks).IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task SaveAsync_RemovedWardReaddedAfterItWasDeactivated_IsRejectedAsANewGrant()
    {
        await SaveAsync(UserId, null, [Zone(ZoneA, Ward1, Ward4)]);
        await SaveAsync(UserId, null, [Zone(ZoneA, Ward4)]);                    // Ward1 row retired, zone A still live
        await DeactivateAsync<WardEntity>(Ward1);

        var act = () => SaveAsync(UserId, null, [Zone(ZoneA, Ward4, Ward1)]);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Contain($"Ward(s) not found or inactive: {Ward1}");
        (await ZoneRowsAsync(UserId)).Single(r => r.WardId == Ward1).IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task SaveAsync_RowMarkedForDeletion_IsRevived()
    {
        await SeedAsync(new UserOwningDepartmentAllocationEntity
        {
            Id = 100, UserId = UserId, OwningDepartmentId = PublicWorks, IsActive = false,
            MarkedForDeletion = true, MarkedForDeletionDate = DateTime.Now, CreatedDate = DateTime.Now
        });

        var result = await SaveAsync(UserId, [Dept(PublicWorks)], null);

        var row = (await DepartmentRowsAsync(UserId)).Should().ContainSingle().Subject;
        (row.Id, row.IsActive, row.MarkedForDeletion, row.MarkedForDeletionDate).Should().Be((100, true, false, (DateTime?)null));
        result.OwningDepartments.Single().Id.Should().Be(100);
    }

    [Fact]
    public async Task SaveAsync_LockedUser_IsAllowed()
    {
        var result = await SaveAsync(LockedUserId, [Dept(PublicWorks)], null);

        result.OwningDepartments.Should().ContainSingle();
    }

    [Theory]
    [InlineData(999)]
    [InlineData(DeletedUserId)]
    public async Task SaveAsync_UnknownOrDeletedUser_ThrowsKeyNotFound(int userId)
    {
        var act = () => SaveAsync(userId, [Dept(PublicWorks)], null);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // Concurrency — one transaction that first locks the user's row; only allocation conflicts become a conflict

    [Fact]
    public async Task SaveAsync_LocksTheUserRowInsideTheTransactionBeforeReadingTheRows()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);
        _commands.Clear();

        await UpdateAsync(UserId, [Dept(Revenue)], [Zone(ZoneB, Ward2)]);

        var inTransaction = _commands.Executed.Where(c => c.InTransaction).Select(c => c.Sql).ToList();
        inTransaction[0].Should().StartWith("UPDATE").And.Contain("UserMaster").And.Contain("UpdatedDate");
        inTransaction.FindIndex(sql => sql.Contains("UserOwningDepartmentAllocation")).Should().BePositive();
        inTransaction.FindIndex(sql => sql.Contains("UserZoneAllocation")).Should().BePositive();
        _context.Database.CurrentTransaction.Should().BeNull();
    }

    [Fact]
    public async Task SaveAsync_UserRowLock_ChangesNothingOnTheUser()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);

        var user = await _context.Set<UserEntity>().AsNoTracking().SingleAsync(u => u.Id == UserId);
        (user.UpdatedDate, user.UpdatedBy).Should().Be(((DateTime?)null, (int?)null));
    }

    // The user is checked by the locking statement itself (Id and not marked for deletion), so a user soft-deleted
    // after the request started is a 404 and nothing is written — there is no earlier check that could go stale.
    [Fact]
    public async Task SaveAsync_UserMarkedForDeletion_IsRejectedByTheLockAndNothingIsSaved()
    {
        _commands.Clear();

        var act = () => SaveAsync(DeletedUserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        _commands.Executed.Where(c => c.InTransaction).Select(c => c.Sql).First()
            .Should().StartWith("UPDATE").And.Contain("UserMaster").And.Contain("MarkedForDeletion");
        (await DepartmentRowsAsync(DeletedUserId)).Should().BeEmpty();
        (await ZoneRowsAsync(DeletedUserId)).Should().BeEmpty();
        _context.Database.CurrentTransaction.Should().BeNull();
    }

    [Fact]
    public async Task SaveAsync_UserDeletedAfterAnEarlierSave_GetsA404OnTheNextSave()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);
        var user = await _context.Set<UserEntity>().SingleAsync(u => u.Id == UserId);
        user.MarkedForDeletion = true;
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var act = () => SaveAsync(UserId, [Dept(Revenue)], []);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        (await DepartmentRowsAsync(UserId)).Should().ContainSingle().Which.Should()
            .Match<UserOwningDepartmentAllocationEntity>(r => r.OwningDepartmentId == PublicWorks && r.IsActive);
        (await ZoneRowsAsync(UserId)).Should().ContainSingle().Which.IsActive.Should().BeTrue();
    }

    // Audit identity — always the authenticated caller, never a request field

    [Fact]
    public async Task SaveAsync_WithoutAnAuthenticatedStaffUser_ThrowsUnauthorizedAndSavesNothing()
    {
        _currentUser.Setup(u => u.GetCurrentUserId()).Throws(new UnauthorizedAccessException("Valid user identification is required."));

        var act = () => _service.SaveAsync(new SaveAssetUserAllocationDto { UserId = UserId, OwningDepartments = [Dept(PublicWorks)] });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
        _context.Database.CurrentTransaction.Should().BeNull();
    }

    [Fact]
    public async Task SaveAsync_InvalidRequest_RollsBackTheTransaction()
    {
        var act = () => SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward2)]);   // Ward2 is in Zone B

        await act.Should().ThrowAsync<ArgumentException>();
        _context.Database.CurrentTransaction.Should().BeNull();
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
    }

    [Theory]
    [InlineData(2627, "Violation of UNIQUE KEY constraint 'UQ_UserZoneAllocation_User_Zone_Ward'. Cannot insert duplicate key in object 'AMS.UserZoneAllocation'.")]
    [InlineData(2601, "Cannot insert duplicate key row in object 'AMS.UserOwningDepartmentAllocation' with unique index 'UQ_UserOwningDepartmentAllocation_User_OwningDepartment'.")]
    public async Task SaveAsync_AllocationUniqueKeyViolation_ThrowsConflictAndSavesNothing(int sqlErrorNumber, string message)
    {
        _unitOfWork.SaveFailure = SaveFailure(sqlErrorNumber, message);

        var act = () => SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);

        // DbUpdateConcurrencyException is what the controller returns as 409
        var conflict = (await act.Should().ThrowExactlyAsync<DbUpdateConcurrencyException>()).Which;
        conflict.Message.Should().Contain("changed by another request");
        conflict.InnerException.Should().BeOfType<DbUpdateException>();
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
        _context.Database.CurrentTransaction.Should().BeNull();
    }

    [Theory]
    [InlineData(547, "The INSERT statement conflicted with the FOREIGN KEY constraint 'FK_UserZoneAllocation_WardMaster'.")]
    [InlineData(2627, "Violation of UNIQUE KEY constraint 'UQ_SomeOtherTable_Code'. Cannot insert duplicate key in object 'AMS.SomeOtherTable'.")]
    public async Task SaveAsync_OtherDatabaseError_IsNotReportedAsAConflict(int sqlErrorNumber, string message)
    {
        _unitOfWork.SaveFailure = SaveFailure(sqlErrorNumber, message);

        var act = () => SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);

        await act.Should().ThrowExactlyAsync<DbUpdateException>();
        _context.Database.CurrentTransaction.Should().BeNull();
    }

    // UpdateAsync (PUT) — same save, user from the route, UpdatedBy as the audit user

    [Fact]
    public async Task UpdateAsync_SyncsRowsAndStampsUpdatedBy()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneA, Ward1)]);

        var result = await UpdateAsync(UserId, [Dept(Revenue)], [Zone(ZoneA, Ward4)]);

        var departmentRows = await DepartmentRowsAsync(UserId);
        departmentRows.Single(r => r.OwningDepartmentId == PublicWorks).Should()
            .Match<UserOwningDepartmentAllocationEntity>(r => !r.IsActive && r.UpdatedBy == EditorUserId);
        departmentRows.Single(r => r.OwningDepartmentId == Revenue).Should()
            .Match<UserOwningDepartmentAllocationEntity>(r => r.IsActive && r.CreatedBy == EditorUserId);
        var zoneRows = await ZoneRowsAsync(UserId);
        zoneRows.Single(r => r.WardId == Ward1).Should()
            .Match<UserZoneAllocationEntity>(r => !r.IsActive && r.CreatedBy == AuditUserId && r.UpdatedBy == EditorUserId);
        zoneRows.Single(r => r.WardId == Ward4).Should()
            .Match<UserZoneAllocationEntity>(r => r.IsActive && r.CreatedBy == EditorUserId);
        result.UserId.Should().Be(UserId);
    }

    [Fact]
    public async Task UpdateAsync_UserWithoutRows_InsertsThemWithUpdatedByAsCreatedBy()
    {
        await UpdateAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneB, Ward2)]);

        (await DepartmentRowsAsync(UserId)).Should().ContainSingle().Which.CreatedBy.Should().Be(EditorUserId);
        (await ZoneRowsAsync(UserId)).Should().ContainSingle().Which.CreatedBy.Should().Be(EditorUserId);
    }

    [Fact]
    public async Task UpdateAsync_AllListsEmpty_DeactivatesEveryRow()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneB, Ward2)]);

        var result = await UpdateAsync(UserId, [], []);

        result.OwningDepartments.Should().BeEmpty();
        (await DepartmentRowsAsync(UserId)).Should().OnlyContain(r => !r.IsActive && r.UpdatedBy == EditorUserId);
        (await ZoneRowsAsync(UserId)).Should().OnlyContain(r => !r.IsActive && r.UpdatedBy == EditorUserId);
    }

    [Fact]
    public async Task UpdateAsync_BothListsOmitted_ChangesNothing()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneB, Ward2)]);

        var result = await UpdateAsync(UserId, null, null);

        result.OwningDepartments.Should().ContainSingle();
        result.ZoneAllocations.Should().ContainSingle();
        (await DepartmentRowsAsync(UserId)).Should().OnlyContain(r => r.IsActive && r.UpdatedDate == null);
        (await ZoneRowsAsync(UserId)).Should().OnlyContain(r => r.IsActive && r.UpdatedDate == null);
    }

    [Fact]
    public async Task UpdateAsync_InvalidRequest_ThrowsLikeSave()
    {
        var act = () => UpdateAsync(UserId, [Dept(PublicWorks, TaxInspector)], null);

        await act.Should().ThrowAsync<ArgumentException>();
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
    }

    [Theory]
    [InlineData(999)]
    [InlineData(DeletedUserId)]
    public async Task UpdateAsync_UnknownOrDeletedUser_ThrowsKeyNotFound(int userId)
    {
        var act = () => UpdateAsync(userId, [Dept(PublicWorks)], null);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // GetByUserIdAsync

    [Fact]
    public async Task GetByUserIdAsync_ReturnsActiveRowsWithNames()
    {
        await SaveAsync(UserId, [Dept(PublicWorks, ExecutiveEngineer), Dept(Revenue)], [Zone(ZoneB, Ward2)], [Stage(Stage1), Stage(Stage2)]);
        await SaveAsync(UserId, [Dept(PublicWorks, ExecutiveEngineer)], [Zone(ZoneB, Ward2)], [Stage(Stage2)]);

        var result = await _service.GetByUserIdAsync(UserId);

        result.UserId.Should().Be(UserId);
        result.OwningDepartments.Should().ContainSingle().Which.Should().Match<UserOwningDepartmentAllocationDto>(d =>
            d.OwningDepartmentId == PublicWorks && d.OwningDepartmentName == "Public Works Department"
            && d.DesignationId == ExecutiveEngineer && d.DesignationName == "Executive Engineer");
        result.ZoneAllocations.Should().ContainSingle().Which.Should().Match<UserZoneAllocationDto>(z =>
            z.ZoneId == ZoneB && z.ZoneNo == "B" && z.WardId == Ward2 && z.WardNo == "W2");
        result.StageAccess.Should().ContainSingle().Which.Should().Match<UserStageAccessAllocationDto>(s =>
            s.UserId == UserId && s.StageId == Stage2 && s.StageCode == "VER" && s.StageName == "Verification" && s.IsActive);
    }

    [Fact]
    public async Task GetByUserIdAsync_ExcludesRowsMarkedForDeletion()
    {
        await SeedAsync(
            new UserOwningDepartmentAllocationEntity { UserId = UserId, OwningDepartmentId = PublicWorks, IsActive = true, MarkedForDeletion = true, CreatedDate = DateTime.Now },
            new UserZoneAllocationEntity { UserId = UserId, ZoneId = ZoneA, WardId = Ward1, IsActive = true, MarkedForDeletion = true, CreatedDate = DateTime.Now },
            new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = UserId, MarkedForDeletion = true });

        var result = await _service.GetByUserIdAsync(UserId);

        result.OwningDepartments.Should().BeEmpty();
        result.ZoneAllocations.Should().BeEmpty();
        result.StageAccess.Should().BeEmpty();
    }

    [Fact]
    public async Task GetByUserIdAsync_StageAccess_OneEntryPerStage_FromTheUsersOwnActiveRows()
    {
        await SeedAsync(
            new GrievanceStageAccessControlEntity { StageId = Stage2, UserId = UserId },                                          // oldest row of stage 2
            new GrievanceStageAccessControlEntity { StageId = Stage2, UserId = UserId },                                          // second active row (no unique key)
            new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = UserId },
            new GrievanceStageAccessControlEntity { StageId = InactiveStage, UserId = UserId, IsActive = false },               // removed
            new GrievanceStageAccessControlEntity { StageId = InactiveStage, UserId = UserId, DesignationId = ExecutiveEngineer }, // user + designation rule
            new GrievanceStageAccessControlEntity { StageId = InactiveStage, DesignationId = ExecutiveEngineer },                 // designation rule
            new GrievanceStageAccessControlEntity { StageId = InactiveStage, UserId = LockedUserId });                            // another user
        var oldestStage2RowId = (await StageRowsAsync(UserId)).First(r => r.StageId == Stage2).Id;

        var result = await _service.GetByUserIdAsync(UserId);

        result.StageAccess.Select(s => (s.StageId, s.StageCode, s.StageName)).Should().Equal(
            (Stage1, "COR", "Correction"),
            (Stage2, "VER", "Verification"));
        result.StageAccess.Single(s => s.StageId == Stage2).Id.Should().Be(oldestStage2RowId);

        // An unchanged save keeps that same row for stage 2, so the edit screen and the table agree
        var saved = await SaveAsync(UserId, null, null, [Stage(Stage1), Stage(Stage2)]);
        saved.StageAccess.Select(s => s.Id).Should().Equal(result.StageAccess.Select(s => s.Id));
    }

    [Fact]
    public async Task GetByUserIdAsync_NoRows_ReturnsEmptyLists()
    {
        var result = await _service.GetByUserIdAsync(UserId);

        result.UserId.Should().Be(UserId);
        result.OwningDepartments.Should().BeEmpty();
        result.ZoneAllocations.Should().BeEmpty();
        result.StageAccess.Should().BeEmpty();
    }

    [Fact]
    public async Task GetByUserIdAsync_UnknownUser_ThrowsKeyNotFound()
    {
        var act = () => _service.GetByUserIdAsync(999);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // Stage access — the user's own [AMS].[StageAccessControl] rows (UserId = the user, no designation)

    [Fact]
    public async Task SaveAsync_StageAccess_InsertsOneUserRowPerStage()
    {
        var result = await SaveAsync(UserId, null, null, [Stage(Stage2), Stage(Stage1), Stage(Stage2)]);

        var rows = await StageRowsAsync(UserId);
        rows.Select(r => r.StageId).Should().BeEquivalentTo(new[] { Stage1, Stage2 });
        rows.Should().OnlyContain(r =>
            r.DesignationId == null && r.CanTakeAction && r.IsActive && !r.MarkedForDeletion && r.CreatedBy == AuditUserId);

        // In workflow order (StageOrder), not request order
        result.StageAccess.Select(s => (s.StageId, s.StageCode, s.StageName)).Should().Equal(
            (Stage1, "COR", "Correction"),
            (Stage2, "VER", "Verification"));
        result.StageAccess[0].Id.Should().Be(rows.Single(r => r.StageId == Stage1).Id);
    }

    [Fact]
    public async Task SaveAsync_StageAccess_RetiresARemovedStageAndRevivesItsRowWhenReselected()
    {
        await SaveAsync(UserId, null, null, [Stage(Stage1), Stage(Stage2)]);
        var stage1RowId = (await StageRowsAsync(UserId)).Single(r => r.StageId == Stage1).Id;

        var result = await SaveAsync(UserId, null, null, [Stage(Stage2)]);

        (await StageRowsAsync(UserId)).Single(r => r.StageId == Stage1).Should()
            .Match<GrievanceStageAccessControlEntity>(r => r.Id == stage1RowId && !r.IsActive && r.UpdatedBy == AuditUserId && r.UpdatedDate != null);
        result.StageAccess.Select(s => s.StageId).Should().Equal(Stage2);

        await UpdateAsync(UserId, null, null, [Stage(Stage1), Stage(Stage2)]);

        var rows = await StageRowsAsync(UserId);
        rows.Should().HaveCount(2).And.OnlyContain(r => r.IsActive);
        rows.Single(r => r.StageId == Stage1).Should()
            .Match<GrievanceStageAccessControlEntity>(r => r.Id == stage1RowId && r.UpdatedBy == EditorUserId);
    }

    [Fact]
    public async Task SaveAsync_StageAccessOmitted_KeepsTheStages_EmptyList_RemovesThemAll()
    {
        await SaveAsync(UserId, null, null, [Stage(Stage1)]);

        await SaveAsync(UserId, [Dept(PublicWorks)], null);   // stageAccess left out

        (await StageRowsAsync(UserId)).Should().ContainSingle().Which.IsActive.Should().BeTrue();

        var result = await SaveAsync(UserId, null, null, []);

        (await StageRowsAsync(UserId)).Should().ContainSingle().Which.IsActive.Should().BeFalse();
        result.StageAccess.Should().BeEmpty();
    }

    [Fact]
    public async Task SaveAsync_StageAccess_LeavesDesignationRowsAndRowsMarkedForDeletionAlone()
    {
        await SeedAsync(
            new GrievanceStageAccessControlEntity { StageId = Stage1, DesignationId = ExecutiveEngineer },                    // designation rule
            new GrievanceStageAccessControlEntity { StageId = Stage1, DesignationId = ExecutiveEngineer, UserId = UserId },   // user + designation rule
            new GrievanceStageAccessControlEntity { StageId = Stage2, UserId = UserId, MarkedForDeletion = true });          // deleted on the stage access screen

        var result = await SaveAsync(UserId, null, null, [Stage(Stage2)]);

        var rows = await _context.Set<GrievanceStageAccessControlEntity>().AsNoTracking().OrderBy(r => r.Id).ToListAsync();
        rows.Should().HaveCount(4);
        rows.Take(3).Should().OnlyContain(r => r.IsActive && r.UpdatedBy == null);
        rows[2].MarkedForDeletion.Should().BeTrue();
        rows[3].Should().Match<GrievanceStageAccessControlEntity>(r =>
            r.StageId == Stage2 && r.UserId == UserId && r.DesignationId == null && r.IsActive && !r.MarkedForDeletion);
        result.StageAccess.Should().ContainSingle().Which.Id.Should().Be(rows[3].Id);
    }

    [Fact]
    public async Task SaveAsync_StageAccess_KeepsCanTakeActionOfAnExistingRow()
    {
        await SeedAsync(new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = UserId, CanTakeAction = false });

        var result = await SaveAsync(UserId, null, null, [Stage(Stage1)]);

        var row = (await StageRowsAsync(UserId)).Should().ContainSingle().Subject;
        (row.CanTakeAction, row.IsActive, row.UpdatedBy).Should().Be((false, true, (int?)null));
        result.StageAccess.Should().ContainSingle().Which.StageId.Should().Be(Stage1);
    }

    [Fact]
    public async Task SaveAsync_StageAccess_StageOnSeveralRows_KeepsOneLiveRow()
    {
        // StageAccessControl has no unique key: extra rows for a stage can come from the stage access screen
        await SeedAsync(
            new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = UserId, IsActive = false },
            new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = UserId },
            new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = UserId });

        var result = await SaveAsync(UserId, null, null, [Stage(Stage1)]);

        // The oldest active row is kept; the other active one is retired
        (await StageRowsAsync(UserId)).Select(r => r.IsActive).Should().Equal(false, true, false);
        result.StageAccess.Should().ContainSingle();
    }

    [Theory]
    [InlineData(InactiveStage)]
    [InlineData(DeletedStage)]
    [InlineData(999)]
    public async Task SaveAsync_StageAccess_NewStageMissingOrInactive_IsRejectedAndNothingIsSaved(int stageId)
    {
        var act = () => SaveAsync(UserId, [Dept(PublicWorks)], null, [Stage(Stage1), Stage(stageId)]);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Be($"Stage(s) not found or inactive: {stageId}");
        (await DepartmentRowsAsync(UserId)).Should().BeEmpty();
        (await StageRowsAsync(UserId)).Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task SaveAsync_StageAccess_NonPositiveId_IsRejected(int stageId)
    {
        var act = () => SaveAsync(UserId, null, null, [Stage(stageId)]);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Be("StageAccess must contain only positive ids.");
    }

    [Fact]
    public async Task SaveAsync_StageAccess_StageDeactivatedAfterAllocation_StaysButCannotBeReAdded()
    {
        await SaveAsync(UserId, null, null, [Stage(Stage1)]);
        await DeactivateAsync<GrievanceWorkflowStageMasterEntity>(Stage1);

        // Still allocated: not re-checked, so the rest of the form saves
        var result = await SaveAsync(UserId, null, null, [Stage(Stage1), Stage(Stage2)]);
        result.StageAccess.Select(s => s.StageId).Should().Equal(Stage1, Stage2);

        // Removed, then re-added: a new grant, checked like one
        await SaveAsync(UserId, null, null, [Stage(Stage2)]);
        var act = () => SaveAsync(UserId, null, null, [Stage(Stage1), Stage(Stage2)]);

        (await act.Should().ThrowAsync<ArgumentException>()).Which.Message.Should().Be($"Stage(s) not found or inactive: {Stage1}");
    }

    // GetAllUserListAsync

    [Fact]
    public async Task GetAllUserListAsync_ReturnsOnlyActiveAssetManagementUsers()
    {
        // Not listed: LockedUserId (inactive), DeletedUserId (marked for deletion), PropertyTaxUserId (other
        // department), FormerAssetUserId (Asset Management allocation deactivated)
        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters());

        result.Items.Select(u => u.Id).Should().Equal(UserId);
        result.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAllUserListAsync_LockedUser_IsNotListedEvenWithAllocations()
    {
        // Saving a locked user's scope is allowed, but the list still leaves the user out
        await SaveAsync(LockedUserId, [Dept(PublicWorks)], [Zone(ZoneB, Ward2)]);

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters { SearchTerm = "locked" });

        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task GetAllUserListAsync_IncludesUserDetailsAssetDepartmentRoleAndAllocations()
    {
        await SaveAsync(UserId, [Dept(PublicWorks, ExecutiveEngineer), Dept(Revenue)], [Zone(ZoneB, Ward2)], [Stage(Stage2), Stage(Stage1)]);

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters());

        var user = result.Items.Single(u => u.Id == UserId);
        user.UserName.Should().Be("asset.user");
        user.FirstName.Should().Be("Asha");
        user.Email.Should().Be("asha@example.com");
        user.IsActive.Should().BeTrue();
        user.Departments.Should().ContainSingle().Which.DepartmentName.Should().Be(AssetUserAllocationService.AssetDepartmentName);
        // Only the Asset Management role: the user's Property Tax role is left out
        user.RoleAllocations.Select(r => (r.UserRoleId, r.UserRoleName)).Should().Equal((AssetAdminRole, "Asset Admin"));
        user.OwningDepartments.Select(d => (d.OwningDepartmentId, d.OwningDepartmentName, d.DesignationId, d.DesignationName)).Should().Equal(
            (PublicWorks, "Public Works Department", (int?)ExecutiveEngineer, "Executive Engineer"),
            (Revenue, "Revenue Department", (int?)null, (string?)null));
        user.ZoneAllocations.Select(z => (z.ZoneId, z.ZoneNo, z.ZoneDescription, z.AllocatedWardCount)).Should().Equal((ZoneB, "B", "Zone B", 1));
        user.StageAccess.Select(s => (s.StageId, s.StageCode, s.StageName)).Should().Equal(
            (Stage1, "COR", "Correction"),
            (Stage2, "VER", "Verification"));
    }

    [Fact]
    public async Task GetAllUserListAsync_ListsEachStageOnce_FromTheUsersOwnActiveRows()
    {
        await SeedSecondAssetUserAsync();
        await SeedAsync(
            new GrievanceStageAccessControlEntity { StageId = Stage2, UserId = UserId },
            new GrievanceStageAccessControlEntity { StageId = Stage2, UserId = UserId },                                          // same stage on a second row
            new GrievanceStageAccessControlEntity { StageId = InactiveStage, UserId = UserId, IsActive = false },               // removed
            new GrievanceStageAccessControlEntity { StageId = DeletedStage, UserId = UserId, MarkedForDeletion = true },        // deleted
            new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = UserId, DesignationId = ExecutiveEngineer },     // user + designation rule
            new GrievanceStageAccessControlEntity { StageId = Stage1, UserId = SecondAssetUserId });

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters());

        result.Items.Single(u => u.Id == UserId).StageAccess.Select(s => s.StageId).Should().Equal(Stage2);
        result.Items.Single(u => u.Id == SecondAssetUserId).StageAccess.Select(s => s.StageId).Should().Equal(Stage1);
    }

    [Fact]
    public async Task GetAllUserListAsync_OmitsRevokedAllocations()
    {
        await SaveAsync(UserId, [Dept(PublicWorks)], [Zone(ZoneB, Ward2)]);
        await SaveAsync(UserId, [], [Zone(ZoneB, Ward2)]);

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters());

        var user = result.Items.Single(u => u.Id == UserId);
        user.OwningDepartments.Should().BeEmpty();
        user.ZoneAllocations.Select(z => z.ZoneId).Should().Equal(ZoneB);
    }

    [Fact]
    public async Task GetAllUserListAsync_ListsEachRoleOnce()
    {
        // CORE.UserRoleAllocation has no unique key: the same role on a second row must not show twice
        await SeedAsync(new UserRoleAllocationEntity { UserId = UserId, DepartmentId = AssetDepartment, UserRoleId = AssetAdminRole });

        var user = (await _service.GetAllUserListAsync(new AssetUserListQueryParameters())).Items.Single(u => u.Id == UserId);

        user.RoleAllocations.Select(r => (r.UserRoleId, r.UserRoleName)).Should().Equal((AssetAdminRole, "Asset Admin"));
    }

    [Fact]
    public async Task GetAllUserListAsync_ListsEachZoneOnce_WithItsAllocatedWardCount()
    {
        // Zone B is listed before zone A to show the list is ordered by zone SequenceNo, not by request order.
        await SaveAsync(UserId, null, [Zone(ZoneB, Ward2), Zone(ZoneA)]);   // zone A whole = W1 + W4 (W9 is inactive)

        var user = (await _service.GetAllUserListAsync(new AssetUserListQueryParameters())).Items.Single(u => u.Id == UserId);

        user.ZoneAllocations.Select(z => (z.ZoneId, z.ZoneNo, z.ZoneDescription, z.AllocatedWardCount)).Should().Equal(
            (ZoneA, "A", "Zone A", 2),
            (ZoneB, "B", "Zone B", 1));
        // GET /{userId} still returns one entry per ward for the edit screen
        (await _service.GetByUserIdAsync(UserId)).ZoneAllocations.Select(z => (z.ZoneId, z.WardId)).Should().Equal(
            (ZoneA, Ward1), (ZoneA, Ward4), (ZoneB, Ward2));

        // Removing one ward lowers the count (retired rows are not counted)
        await SaveAsync(UserId, null, [Zone(ZoneA, Ward4), Zone(ZoneB, Ward2)]);

        user = (await _service.GetAllUserListAsync(new AssetUserListQueryParameters())).Items.Single(u => u.Id == UserId);
        user.ZoneAllocations.Select(z => (z.ZoneId, z.AllocatedWardCount)).Should().Equal((ZoneA, 1), (ZoneB, 1));

        // A zone whose wards are all removed drops out of the list
        await SaveAsync(UserId, null, [Zone(ZoneB, Ward2)]);

        user = (await _service.GetAllUserListAsync(new AssetUserListQueryParameters())).Items.Single(u => u.Id == UserId);
        user.ZoneAllocations.Select(z => z.ZoneId).Should().Equal(ZoneB);
    }

    [Fact]
    public async Task GetAllUserListAsync_SearchTerm_MatchesUserFields()
    {
        await SeedSecondAssetUserAsync();

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters { SearchTerm = "ASHA" });

        result.Items.Select(u => u.Id).Should().Equal(UserId);
        result.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAllUserListAsync_SortAndPage()
    {
        await SeedSecondAssetUserAsync();

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters
        {
            SortBy = "UserName",
            SortOrder = "desc",
            PageNumber = 2,
            PageSize = 1
        });

        // desc by UserName: zeta.user, asset.user -> page 2 is asset.user
        result.Items.Select(u => u.Id).Should().Equal(UserId);
        result.TotalCount.Should().Be(2);
        result.TotalPages.Should().Be(2);
    }

    [Fact]
    public async Task GetAllUserListAsync_PageSizeMinusOne_ReturnsAllOnOnePage()
    {
        await SeedSecondAssetUserAsync();

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters { PageSize = -1, PageNumber = 3 });

        result.Items.Should().HaveCount(2);
        result.PageNumber.Should().Be(1);
        result.TotalPages.Should().Be(1);
    }

    [Fact]
    public async Task GetAllUserListAsync_PageSizeMinusOne_IsCappedAt5000()
    {
        // 5,000 more active Asset Management users + UserId = 5,001, one above PagingGuard's ceiling (5,000) for -1
        const int extra = 5_000;
        _context.AddRange(Enumerable.Range(1, extra).SelectMany(i => new object[]
        {
            new UserEntity { Id = 1_000 + i, UserName = $"bulk.user.{i:D5}" },
            DepartmentAllocation(1_000 + i, AssetDepartment)
        }));
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters { PageSize = -1 });

        // One bounded page; the real total and hasNext tell the caller there is more to page through
        result.Items.Should().HaveCount(5_000);
        (result.TotalCount, result.PageNumber, result.PageSize, result.TotalPages, result.HasNext)
            .Should().Be((extra + 1, 1, 5_000, 2, true));
    }

    [Fact]
    public async Task GetAllUserListAsync_HugePageNumber_ReturnsAnEmptyPage()
    {
        // (int.MaxValue - 1) * 10 overflows int; the offset is computed in long and clamped to the row count
        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters { PageNumber = int.MaxValue, PageSize = 10 });

        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(1);
        result.PageNumber.Should().Be(int.MaxValue);
    }

    [Fact]
    public async Task GetAllUserListAsync_UnsortableField_Throws()
    {
        var act = () => _service.GetAllUserListAsync(new AssetUserListQueryParameters { SortBy = "PasswordHash" });

        await act.Should().ThrowAsync<FilterValidationException>();
    }

    [Fact]
    public async Task GetAllUserListAsync_AssetDepartmentMissing_ReturnsEmpty()
    {
        var department = await _context.Set<DepartmentMasterEntity>().SingleAsync(d => d.Id == AssetDepartment);
        department.DepartmentName = "Assets";
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var result = await _service.GetAllUserListAsync(new AssetUserListQueryParameters());

        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
    }

    // Helpers

    private static OwningDepartmentAllocationItemDto Dept(int id, int? designationId = null)
        => new() { OwningDepartmentId = id, DesignationId = designationId };

    // No wards = the whole zone
    private static ZoneAllocationItemDto Zone(int zoneId, params int[] wardIds)
        => new() { ZoneId = zoneId, WardIds = wardIds.Length == 0 ? null : wardIds.ToList() };

    private static StageAccessAllocationItemDto Stage(int stageId) => new() { StageId = stageId };

    private static GrievanceWorkflowStageMasterEntity WorkflowStage(
        int id, string code, string name, int order, bool isActive = true, bool markedForDeletion = false)
        => new()
        {
            Id = id,
            UlbTypeId = 1,
            StageCode = code,
            StageName = name,
            StageOrder = order,
            Status = "Active",
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion
        };

    private static OwningDepartmentAllocationItemDto[]? Depts(int? dept, int? designation)
        => dept is { } id ? [Dept(id, designation)] : null;

    private static ZoneAllocationItemDto[]? Zones(int? zone, int? ward)
        => zone is { } zoneId ? [Zone(zoneId, ward ?? 0)] : null;

    private static UserDepartmentAllocationEntity DepartmentAllocation(int userId, int departmentId, bool isActive = true)
        => new() { UserId = userId, DepartmentId = departmentId, IsActive = isActive };

    private Task SeedSecondAssetUserAsync()
        => SeedAsync(
            new UserEntity { Id = SecondAssetUserId, UserName = "zeta.user" },
            DepartmentAllocation(SecondAssetUserId, AssetDepartment));

    private static AssetDesignationEntity Designation(int id, string name, int owningDepartmentId, bool isActive = true, bool markedForDeletion = false)
        => new()
        {
            Id = id,
            DesignationCode = $"D{id}",
            DesignationName = name,
            OwningDepartmentId = owningDepartmentId,
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion
        };

    private async Task DeactivateAsync<T>(int id) where T : BaseEntity
    {
        var row = await _context.Set<T>().SingleAsync(e => e.Id == id);
        row.IsActive = false;
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
    }

    private async Task SeedAsync(params object[] rows)
    {
        _context.AddRange(rows);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
    }

    // Each call runs as its own "request": the change tracker is cleared afterwards so the
    // next call reads rows from the database, like a fresh scoped DbContext would. POST runs as
    // AuditUserId and PUT as EditorUserId (the authenticated caller; the DTOs carry no audit field).
    private async Task<AssetUserAllocationDto> SaveAsync(
        int userId, OwningDepartmentAllocationItemDto[]? departments, ZoneAllocationItemDto[]? zones,
        StageAccessAllocationItemDto[]? stages = null)
    {
        try
        {
            _actingUserId = AuditUserId;
            return await _service.SaveAsync(new SaveAssetUserAllocationDto
            {
                UserId = userId,
                OwningDepartments = departments?.ToList(),
                ZoneAllocations = zones?.ToList(),
                StageAccess = stages?.ToList()
            });
        }
        finally
        {
            _context.ChangeTracker.Clear();
        }
    }

    private async Task<AssetUserAllocationDto> UpdateAsync(
        int userId, OwningDepartmentAllocationItemDto[]? departments, ZoneAllocationItemDto[]? zones,
        StageAccessAllocationItemDto[]? stages = null)
    {
        try
        {
            _actingUserId = EditorUserId;
            return await _service.UpdateAsync(userId, new UpdateAssetUserAllocationDto
            {
                OwningDepartments = departments?.ToList(),
                ZoneAllocations = zones?.ToList(),
                StageAccess = stages?.ToList()
            });
        }
        finally
        {
            _context.ChangeTracker.Clear();
        }
    }

    private static DbUpdateException SaveFailure(int sqlErrorNumber, string message)
        => new("An error occurred while saving the entity changes.", new FakeSqlException(sqlErrorNumber, message));

    private Task<List<UserOwningDepartmentAllocationEntity>> DepartmentRowsAsync(int userId)
        => _context.Set<UserOwningDepartmentAllocationEntity>().AsNoTracking().Where(r => r.UserId == userId).OrderBy(r => r.Id).ToListAsync();

    private Task<List<UserZoneAllocationEntity>> ZoneRowsAsync(int userId)
        => _context.Set<UserZoneAllocationEntity>().AsNoTracking().Where(r => r.UserId == userId).OrderBy(r => r.Id).ToListAsync();

    private Task<List<GrievanceStageAccessControlEntity>> StageRowsAsync(int userId)
        => _context.Set<GrievanceStageAccessControlEntity>().AsNoTracking().Where(r => r.UserId == userId).OrderBy(r => r.Id).ToListAsync();

    /// <summary>
    /// Portable model of only the tables the service touches, with the same keys, FKs and unique
    /// constraints as ApplicationDbContext (whose SQL-Server-only configuration does not run on SQLite).
    /// </summary>
    private sealed class AllocationDbContext(DbContextOptions<AllocationDbContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // WardEntity's other navigations reach most of the PTIS model (incl. SQL-Server-only
            // column types), so drop those types; Zone <-> Ward stays.
            modelBuilder.Ignore<PropertyEntity>();
            modelBuilder.Ignore<BlockMasterEntity>();
            modelBuilder.Ignore<RateSectionDetailsEntity>();

            modelBuilder.Entity<UserEntity>(b =>
            {
                b.ToTable("UserMaster");
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
            });
            HasManualKey<OwningDepartmentEntity>(modelBuilder);
            HasManualKey<AssetDesignationEntity>(modelBuilder);
            HasManualKey<ZoneEntity>(modelBuilder);
            HasManualKey<WardEntity>(modelBuilder);
            HasManualKey<DepartmentMasterEntity>(modelBuilder);
            HasManualKey<UserRoleMasterEntity>(modelBuilder);
            modelBuilder.Entity<UserDepartmentAllocationEntity>(b => b.HasKey(x => x.Id));
            modelBuilder.Entity<UserRoleAllocationEntity>(b => b.HasKey(x => x.Id));

            modelBuilder.Entity<UserOwningDepartmentAllocationEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasIndex(x => new { x.UserId, x.OwningDepartmentId }).IsUnique();
                b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<OwningDepartmentEntity>().WithMany().HasForeignKey(x => x.OwningDepartmentId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<AssetDesignationEntity>().WithMany().HasForeignKey(x => x.DesignationId).OnDelete(DeleteBehavior.Restrict);
            });
            modelBuilder.Entity<UserZoneAllocationEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasIndex(x => new { x.UserId, x.ZoneId, x.WardId }).IsUnique();
                b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<ZoneEntity>().WithMany().HasForeignKey(x => x.ZoneId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<WardEntity>().WithMany().HasForeignKey(x => x.WardId).OnDelete(DeleteBehavior.Restrict);
            });

            // [AMS].[StageAccessControl]: as in SQL Server, no unique key — only FKs to the stage, user and designation
            HasManualKey<GrievanceWorkflowStageMasterEntity>(modelBuilder);
            modelBuilder.Entity<GrievanceStageAccessControlEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasOne(x => x.Stage).WithMany().HasForeignKey(x => x.StageId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<AssetDesignationEntity>().WithMany().HasForeignKey(x => x.DesignationId).OnDelete(DeleteBehavior.Restrict);
            });
        }

        private static void HasManualKey<T>(ModelBuilder modelBuilder) where T : BaseEntity
            => modelBuilder.Entity<T>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
            });
    }

    /// <summary>
    /// <see cref="IUnitOfWork"/> over the test context with the real UnitOfWork's commit / rollback behaviour
    /// (SQLite has transactions). <see cref="SaveFailure"/>, when set, is thrown by the next save instead of saving.
    /// </summary>
    private sealed class SqliteUnitOfWork(DbContext context) : IUnitOfWork
    {
        private IDbContextTransaction? _transaction;

        public Exception? SaveFailure { get; set; }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            if (SaveFailure is { } failure)
            {
                SaveFailure = null;
                return Task.FromException<int>(failure);
            }

            return context.SaveChangesAsync(cancellationToken);
        }

        public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
            => _transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                await SaveChangesAsync(cancellationToken);
                await _transaction!.CommitAsync(cancellationToken);
            }
            catch
            {
                await RollbackTransactionAsync(cancellationToken);
                throw;
            }
            finally
            {
                if (_transaction != null)
                {
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction == null)
                return;

            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }

        public void DiscardChanges() => context.ChangeTracker.Clear();

        public void Dispose()
        {
        }
    }

    /// <summary>Records every SQL command the test context sends, and whether it ran inside a transaction.</summary>
    private sealed class CommandLog : DbCommandInterceptor
    {
        public List<(string Sql, bool InTransaction)> Executed { get; } = [];

        public void Clear() => Executed.Clear();

        private void Record(DbCommand command) => Executed.Add((command.CommandText, command.Transaction != null));

        public override InterceptionResult<DbDataReader> ReaderExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result)
        {
            Record(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result, CancellationToken cancellationToken = default)
        {
            Record(command);
            return ValueTask.FromResult(result);
        }

        public override InterceptionResult<int> NonQueryExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<int> result)
        {
            Record(command);
            return result;
        }

        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(DbCommand command, CommandEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            Record(command);
            return ValueTask.FromResult(result);
        }

        public override InterceptionResult<object> ScalarExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<object> result)
        {
            Record(command);
            return result;
        }

        public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(DbCommand command, CommandEventData eventData, InterceptionResult<object> result, CancellationToken cancellationToken = default)
        {
            Record(command);
            return ValueTask.FromResult(result);
        }
    }

    /// <summary>Stands in for SqlException: the service reads the provider's error number by name.</summary>
    private sealed class FakeSqlException(int number, string message) : Exception(message)
    {
        public int Number { get; } = number;
    }

    /// <summary>
    /// <see cref="IRepository{T,TKey}"/> over the test context with the same audit-date stamping as
    /// the real Infrastructure Repository; only the members the service uses are implemented.
    /// </summary>
    private sealed class SqliteRepository<T>(DbContext context) : IRepository<T, int> where T : BaseEntity
    {
        public IQueryable<T> GetQueryable() => context.Set<T>();

        public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
        {
            entity.CreatedDate = DateTime.Now;
            await context.Set<T>().AddAsync(entity, cancellationToken);
            return entity;
        }

        public Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
        {
            entity.UpdatedDate = DateTime.Now;
            context.Set<T>().Update(entity);
            return Task.CompletedTask;
        }

        public Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task DeleteAsync(int id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task DeleteAsync(T entity, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task HardDeleteAsync(T entity, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IEnumerable<T>> GetAsync(Expression<Func<T, bool>>? filter = null, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}

/// <summary>
/// The POST / PUT bodies of /api/AssetUserAllocation as ASP.NET binds them (System.Text.Json, web defaults):
/// the documented shape binds, an omitted list stays null (= unchanged) and unknown properties are rejected
/// (400) instead of being ignored — an ignored list would otherwise read as "unchanged" or a whole zone.
/// </summary>
public class AssetUserAllocationRequestJsonTests
{
    private static readonly JsonSerializerOptions Web = new(JsonSerializerDefaults.Web);

    [Fact]
    public void SaveRequest_DocumentedShape_Binds()
    {
        const string json = """
            {
                "userId": 7,
                "owningDepartments": [ { "owningDepartmentId": 1, "designationId": 4 }, { "owningDepartmentId": 3 } ],
                "zoneAllocations": [ { "zoneId": 2 }, { "zoneId": 5, "wardIds": [27, 28] } ],
                "stageAccess": [ { "stageId": 1 }, { "stageId": 2 } ]
            }
            """;

        var dto = JsonSerializer.Deserialize<SaveAssetUserAllocationDto>(json, Web)!;

        dto.UserId.Should().Be(7);
        dto.OwningDepartments!.Select(d => (d.OwningDepartmentId, d.DesignationId)).Should().Equal((1, (int?)4), (3, (int?)null));
        dto.ZoneAllocations!.Select(z => z.ZoneId).Should().Equal(2, 5);
        dto.ZoneAllocations![0].WardIds.Should().BeNull();
        dto.ZoneAllocations![1].WardIds.Should().Equal(27, 28);
        dto.StageAccess!.Select(s => s.StageId).Should().Equal(1, 2);
    }

    [Fact]
    public void SaveRequest_OmittedListStaysNull_EmptyListStaysEmpty()
    {
        var dto = JsonSerializer.Deserialize<SaveAssetUserAllocationDto>("""{ "userId": 7, "owningDepartments": [] }""", Web)!;

        dto.OwningDepartments.Should().NotBeNull().And.BeEmpty();
        dto.ZoneAllocations.Should().BeNull();
        dto.StageAccess.Should().BeNull();
    }

    [Theory]
    [InlineData("""{ "userId": 7, "owningDepartmentIds": [1], "designationIds": [4], "zoneIds": [2], "wardIds": [27] }""")]   // the old flat contract
    [InlineData("""{ "userId": 7, "zoneAllocations": [ { "zoneId": 2, "wardId": 27 } ] }""")]                               // singular wardId
    [InlineData("""{ "userId": 7, "createdBy": 99, "owningDepartments": [] }""")]                                            // audit identity comes from the token
    [InlineData("""{ "userId": 7, "owningDepartments": [ { "owningDepartmentId": 1, "designationIds": [4] } ] }""")]
    [InlineData("""{ "userId": 7, "stageAccess": [ { "stageId": 1, "canTakeAction": false } ] }""")]                       // not part of this API
    [InlineData("""{ "userId": 7, "stageAccess": [ { "stageId": 1, "designationId": 4 } ] }""")]                           // not part of this API
    [InlineData("""{ "userId": 7, "stageIds": [1] }""")]
    public void SaveRequest_UnknownProperty_IsRejected(string json)
    {
        var act = () => JsonSerializer.Deserialize<SaveAssetUserAllocationDto>(json, Web);

        act.Should().Throw<JsonException>();
    }

    [Theory]
    [InlineData("""{ "zoneIds": [2] }""")]
    [InlineData("""{ "updatedBy": 99, "zoneAllocations": [] }""")]   // audit identity comes from the token
    public void UpdateRequest_UnknownProperty_IsRejected(string json)
    {
        var act = () => JsonSerializer.Deserialize<UpdateAssetUserAllocationDto>(json, Web);

        act.Should().Throw<JsonException>();
    }
}

/// <summary>
/// How <see cref="AssetUserAllocationController"/> turns the service's outcomes into responses: only an allocation
/// conflict (DbUpdateConcurrencyException, raised by the service for the allocation unique keys alone) is 409; any
/// other database error is left to GlobalExceptionHandlerMiddleware. A user without allocations is 200 with empty lists.
/// </summary>
public class AssetUserAllocationControllerTests
{
    private const int UserId = 7;

    private readonly Mock<IAssetUserAllocationService> _service = new();
    private readonly AssetUserAllocationController _controller;

    public AssetUserAllocationControllerTests()
    {
        _controller = new AssetUserAllocationController(_service.Object, NullLogger<AssetUserAllocationController>.Instance);
    }

    [Fact]
    public async Task GetByUserId_UserWithoutAllocations_Returns200WithEmptyLists()
    {
        _service.Setup(s => s.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetUserAllocationDto { UserId = UserId });

        var result = await _controller.GetByUserId(UserId, CancellationToken.None);

        var items = result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeOfType<ApiResponse<AssetUserAllocationDto>>().Which.Items!;
        items.OwningDepartments.Should().NotBeNull().And.BeEmpty();
        items.ZoneAllocations.Should().NotBeNull().And.BeEmpty();
        items.StageAccess.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task Save_AllocationConflict_Returns409WithTheServiceMessage()
    {
        _service.Setup(s => s.SaveAsync(It.IsAny<SaveAssetUserAllocationDto>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException("Allocations were changed by another request. Reload and try again."));

        var result = await _controller.Save(new SaveAssetUserAllocationDto { UserId = UserId }, CancellationToken.None);

        var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflict.StatusCode.Should().Be(409);
        conflict.Value.Should().BeOfType<ApiResponse<object>>().Which.Should().Match<ApiResponse<object>>(r =>
            !r.Success && r.Message == "Allocations were changed by another request. Reload and try again.");
    }

    [Fact]
    public async Task Save_OtherDatabaseError_IsNotTurnedIntoA409()
    {
        // e.g. a foreign-key failure because a master was removed mid-save: a real error, not "changed by another request"
        var failure = new DbUpdateException("An error occurred while saving the entity changes.");
        _service.Setup(s => s.SaveAsync(It.IsAny<SaveAssetUserAllocationDto>(), It.IsAny<CancellationToken>())).ThrowsAsync(failure);

        var act = () => _controller.Save(new SaveAssetUserAllocationDto { UserId = UserId }, CancellationToken.None);

        (await act.Should().ThrowExactlyAsync<DbUpdateException>()).Which.Should().BeSameAs(failure);
    }

    [Fact]
    public async Task Update_InvalidRequest_Returns400()
    {
        _service.Setup(s => s.UpdateAsync(UserId, It.IsAny<UpdateAssetUserAllocationDto>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Ward 2 does not belong to zone 1."));

        var result = await _controller.Update(UserId, new UpdateAssetUserAllocationDto(), CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>().Which.Value.Should().BeOfType<ApiResponse<object>>()
            .Which.Message.Should().Be("Ward 2 does not belong to zone 1.");
    }

    [Fact]
    public void Controller_RequiresAnAuthenticatedUser()
    {
        typeof(AssetUserAllocationController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true).Should().NotBeEmpty();
    }


    [Fact]
    public async Task Save_WithoutAValidUserClaim_IsLeftToTheGlobalHandlerAs401()
    {
        // the service takes the audit user from the token; a token without one must not become a 400/409 here
        var failure = new UnauthorizedAccessException("Valid user identification is required.");
        _service.Setup(s => s.SaveAsync(It.IsAny<SaveAssetUserAllocationDto>(), It.IsAny<CancellationToken>())).ThrowsAsync(failure);

        var act = () => _controller.Save(new SaveAssetUserAllocationDto { UserId = UserId }, CancellationToken.None);

        (await act.Should().ThrowExactlyAsync<UnauthorizedAccessException>()).Which.Should().BeSameAs(failure);
    }

    [Fact]
    public async Task Update_UnknownUser_Returns404()
    {
        _service.Setup(s => s.UpdateAsync(UserId, It.IsAny<UpdateAssetUserAllocationDto>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException($"User with ID {UserId} was not found."));

        var result = await _controller.Update(UserId, new UpdateAssetUserAllocationDto(), CancellationToken.None);

        result.Should().BeOfType<NotFoundObjectResult>();
    }
}
