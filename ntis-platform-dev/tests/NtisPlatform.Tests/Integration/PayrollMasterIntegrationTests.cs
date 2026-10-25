using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.DepartmentMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.DesignationMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeStatusMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeTypeMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.GenderMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.MaritalStatusMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.QualificationMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.RelationshipMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.StateMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.DistrictMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.TalukaMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Services;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Integration tests for Municipal Payroll Masters (Batch 1 & Batch 2):
/// Batch 1: Department, Designation, EmployeeClass, EmployeeStatus, EmployeeType.
/// Batch 2: BloodGroup, Gender, MaritalStatus, Qualification, Relationship.
/// </summary>
public class PayrollMasterIntegrationTests : IAsyncLifetime
{
    private ApplicationDbContext _context = null!;
    private IMapper _mapper = null!;
    private Mock<ICurrentUserService> _mockCurrentUser = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"PayrollTests_{System.Guid.NewGuid()}")
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ApplicationDbContext(options);
        await _context.Database.EnsureCreatedAsync();

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            // Batch 1 Profiles
            cfg.AddProfile<PayrollDepartmentMasterProfile>();
            cfg.AddProfile<PayrollDesignationMasterProfile>();
            cfg.AddProfile<PayrollEmployeeClassMasterProfile>();
            cfg.AddProfile<PayrollEmployeeStatusMasterProfile>();
            cfg.AddProfile<PayrollEmployeeTypeMasterProfile>();

            // Batch 2 Profiles
            cfg.AddProfile<PayrollBloodGroupMasterProfile>();
            cfg.AddProfile<PayrollGenderMasterProfile>();
            cfg.AddProfile<PayrollMaritalStatusMasterProfile>();
            cfg.AddProfile<PayrollQualificationMasterProfile>();
            cfg.AddProfile<PayrollRelationshipMasterProfile>();

            // Geographic Masters Profiles
            cfg.AddProfile<PayrollStateMasterProfile>();
            cfg.AddProfile<PayrollDistrictMasterProfile>();
            cfg.AddProfile<PayrollTalukaMasterProfile>();
            cfg.AddProfile<PayrollVillageMasterProfile>();
            cfg.AddProfile<PayrollZoneDivisionMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _mockCurrentUser = new Mock<ICurrentUserService>();
        _mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(777);
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.DisposeAsync();
        }
    }

    #region EF Core Model Metadata & Constraint Verification - Batch 1

    [Fact]
    public void EFMapping_DepartmentMaster_ConfiguresUniqueIndexOnDepartmentCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollDepartmentMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollDepartmentMasterEntity.DepartmentCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    [Fact]
    public void EFMapping_DesignationMaster_ConfiguresUniqueIndexOnDesignationCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollDesignationMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollDesignationMasterEntity.DesignationCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    [Fact]
    public void EFMapping_EmployeeClassMaster_ConfiguresUniqueIndexOnClassCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollEmployeeClassMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollEmployeeClassMasterEntity.ClassCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    [Fact]
    public void EFMapping_EmployeeStatusMaster_ConfiguresUniqueIndexOnEmployeeStatusCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollEmployeeStatusMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollEmployeeStatusMasterEntity.EmployeeStatusCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    [Fact]
    public void EFMapping_EmployeeTypeMaster_ConfiguresUniqueIndexOnEmployeeTypeCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollEmployeeTypeMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollEmployeeTypeMasterEntity.EmployeeTypeCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    #endregion

    #region EF Core Model Metadata & Constraint Verification - Batch 2

    [Fact]
    public void EFMapping_BloodGroupMaster_ConfiguresUniqueIndexesOnCodeAndName()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollBloodGroupMasterEntity));
        Assert.NotNull(entityType);

        var codeIndex = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollBloodGroupMasterEntity.BloodGroupCode)));
        Assert.NotNull(codeIndex);
        Assert.True(codeIndex!.IsUnique);
        Assert.Null(codeIndex.GetFilter());

        var nameIndex = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollBloodGroupMasterEntity.BloodGroupName)));
        Assert.NotNull(nameIndex);
        Assert.True(nameIndex!.IsUnique);
        Assert.Null(nameIndex.GetFilter());
    }

    [Fact]
    public void EFMapping_GenderMaster_ConfiguresUniqueIndexOnGenderCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollGenderMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollGenderMasterEntity.GenderCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    [Fact]
    public void EFMapping_MaritalStatusMaster_ConfiguresUniqueIndexOnMaritalStatusCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollMaritalStatusMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollMaritalStatusMasterEntity.MaritalStatusCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    [Fact]
    public void EFMapping_QualificationMaster_ConfiguresUniqueIndexOnQualificationCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollQualificationMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollQualificationMasterEntity.QualificationCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    [Fact]
    public void EFMapping_RelationshipMaster_ConfiguresUniqueIndexOnRelationshipCode()
    {
        var entityType = _context.Model.FindEntityType(typeof(PayrollRelationshipMasterEntity));
        Assert.NotNull(entityType);

        var index = entityType!.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(PayrollRelationshipMasterEntity.RelationshipCode)));
        Assert.NotNull(index);
        Assert.True(index!.IsUnique);
        Assert.Null(index.GetFilter());
    }

    #endregion

    #region ReferenceValidationService Purge Protection

    [Fact]
    public async Task ReferenceValidationService_AllowsHardDelete_WhenNoReferences()
    {
        // Batch 1 entity
        var dept = new PayrollDepartmentMasterEntity
        {
            DepartmentCode = "HR",
            DepartmentName = "Human Resources",
            DepartmentNameMarathi = "मानव संसाधन"
        };
        _context.PayrollDepartmentMaster.Add(dept);

        // Batch 2 entity
        var bloodGroup = new PayrollBloodGroupMasterEntity
        {
            BloodGroupCode = "AB+",
            BloodGroupName = "AB+"
        };
        _context.PayrollBloodGroupMaster.Add(bloodGroup);

        await _context.SaveChangesAsync();

        var refValService = new ReferenceValidationService(_context);
        var deptResult = await refValService.ValidateReferencesAsync<PayrollDepartmentMasterEntity>(dept.Id);
        var bloodResult = await refValService.ValidateReferencesAsync<PayrollBloodGroupMasterEntity>(bloodGroup.Id);

        Assert.True(deptResult.IsValid);
        Assert.True(bloodResult.IsValid);
    }

    #endregion

    #region Audit Identity Overwrite

    [Fact]
    public async Task DepartmentService_CreateAsync_OverwritesCreatedByWithCurrentUserId()
    {
        var repo = new Repository<PayrollDepartmentMasterEntity, int>(_context);
        var uow = new UnitOfWork(_context);
        var service = new PayrollDepartmentMasterService(repo, uow, _mapper, _mockCurrentUser.Object);

        var dto = new CreatePayrollDepartmentMasterDto
        {
            DepartmentCode = "FIN",
            DepartmentName = "Finance",
            DepartmentNameMarathi = "वित्त",
            CreatedBy = 999 // spoofed value
        };

        var result = await service.CreateAsync(dto);

        var saved = await _context.PayrollDepartmentMaster.FindAsync(result.Id);
        Assert.NotNull(saved);
        Assert.Equal(777, saved!.CreatedBy);
    }

    [Fact]
    public async Task DepartmentService_UpdateAsync_OverwritesUpdatedByWithCurrentUserId()
    {
        var dept = new PayrollDepartmentMasterEntity
        {
            DepartmentCode = "ACC",
            DepartmentName = "Accounts",
            DepartmentNameMarathi = "लेखा",
            CreatedBy = 100
        };
        _context.PayrollDepartmentMaster.Add(dept);
        await _context.SaveChangesAsync();

        var repo = new Repository<PayrollDepartmentMasterEntity, int>(_context);
        var uow = new UnitOfWork(_context);
        var service = new PayrollDepartmentMasterService(repo, uow, _mapper, _mockCurrentUser.Object);

        var updateDto = new UpdatePayrollDepartmentMasterDto
        {
            DepartmentCode = "ACC",
            DepartmentName = "Accounts & Audit",
            DepartmentNameMarathi = "लेखा व लेखापरीक्षण",
            UpdatedBy = 9999 // spoofed value
        };

        var result = await service.UpdateAsync(dept.Id, updateDto);

        Assert.NotNull(result);
        var saved = await _context.PayrollDepartmentMaster.FindAsync(dept.Id);
        Assert.NotNull(saved);
        Assert.Equal(777, saved!.UpdatedBy);
    }

    [Fact]
    public async Task BloodGroupService_CreateAsync_OverwritesCreatedByWithCurrentUserId()
    {
        var repo = new Repository<PayrollBloodGroupMasterEntity, int>(_context);
        var uow = new UnitOfWork(_context);
        var service = new PayrollBloodGroupMasterService(repo, uow, _mapper, _mockCurrentUser.Object);

        var dto = new CreatePayrollBloodGroupMasterDto
        {
            BloodGroupCode = "O-",
            BloodGroupName = "O-",
            CreatedBy = 123 // spoofed value
        };

        var result = await service.CreateAsync(dto);

        var saved = await _context.PayrollBloodGroupMaster.FindAsync(result.Id);
        Assert.NotNull(saved);
        Assert.Equal(777, saved!.CreatedBy);
    }

    [Fact]
    public async Task QualificationService_UpdateAsync_OverwritesUpdatedByWithCurrentUserId()
    {
        var qual = new PayrollQualificationMasterEntity
        {
            QualificationCode = "BSC",
            QualificationName = "B.Sc.",
            QualificationNameRegional = "बी.एस्सी.",
            CreatedBy = 100
        };
        _context.PayrollQualificationMaster.Add(qual);
        await _context.SaveChangesAsync();

        var repo = new Repository<PayrollQualificationMasterEntity, int>(_context);
        var uow = new UnitOfWork(_context);
        var service = new PayrollQualificationMasterService(repo, uow, _mapper, _mockCurrentUser.Object);

        var updateDto = new UpdatePayrollQualificationMasterDto
        {
            QualificationCode = "BSC",
            QualificationName = "Bachelor of Science",
            QualificationNameRegional = "बॅचलर ऑफ सायन्स",
            UpdatedBy = 9999 // spoofed value
        };

        var result = await service.UpdateAsync(qual.Id, updateDto);

        Assert.NotNull(result);
        var saved = await _context.PayrollQualificationMaster.FindAsync(qual.Id);
        Assert.NotNull(saved);
        Assert.Equal(777, saved!.UpdatedBy);
    }

    #endregion

    #region Direct Delete Functionality

    [Fact]
    public async Task DepartmentService_DeleteAsync_DirectlyDeletesFromDatabase()
    {
        var dept = new PayrollDepartmentMasterEntity
        {
            DepartmentCode = "TEMP",
            DepartmentName = "Temporary Dept",
            DepartmentNameMarathi = "तात्पुरता विभाग"
        };
        _context.PayrollDepartmentMaster.Add(dept);
        await _context.SaveChangesAsync();

        var repo = new Repository<PayrollDepartmentMasterEntity, int>(_context);
        var uow = new UnitOfWork(_context);
        var service = new PayrollDepartmentMasterService(repo, uow, _mapper, _mockCurrentUser.Object);

        var result = await service.DeleteAsync(dept.Id);

        Assert.True(result);
        var inDb = await _context.PayrollDepartmentMaster.FindAsync(dept.Id);
        Assert.Null(inDb);
    }

    #endregion

    #region Geographic Masters Integration

    [Fact]
    public async Task GeographicHierarchy_CRUD_And_Validation_Flow()
    {
        var stateRepo = new Repository<PayrollStateMasterEntity, int>(_context);
        var distRepo = new Repository<PayrollDistrictMasterEntity, int>(_context);
        var talukaRepo = new Repository<PayrollTalukaMasterEntity, int>(_context);
        var villageRepo = new Repository<PayrollVillageMasterEntity, int>(_context);
        var zoneRepo = new Repository<PayrollZoneDivisionMasterEntity, int>(_context);
        var uow = new UnitOfWork(_context);

        var stateService = new PayrollStateMasterService(stateRepo, distRepo, uow, _mapper, _mockCurrentUser.Object);
        var distService = new PayrollDistrictMasterService(distRepo, stateRepo, talukaRepo, uow, _mapper, _mockCurrentUser.Object);
        var talukaService = new PayrollTalukaMasterService(talukaRepo, distRepo, villageRepo, uow, _mapper, _mockCurrentUser.Object);
        var villageService = new PayrollVillageMasterService(villageRepo, talukaRepo, uow, _mapper, _mockCurrentUser.Object);
        var zoneService = new PayrollZoneDivisionMasterService(zoneRepo, uow, _mapper, _mockCurrentUser.Object);

        // 1. Create State
        var stateDto = await stateService.CreateAsync(new CreatePayrollStateMasterDto
        {
            StateCode = "MH",
            StateName = "Maharashtra",
            StateNameRegional = "महाराष्ट्र",
            IsActive = true
        });
        Assert.NotNull(stateDto);
        Assert.True(stateDto.Id > 0);
        var stateEntity = await _context.PayrollStateMaster.FindAsync(stateDto.Id);
        Assert.NotNull(stateEntity);
        Assert.Equal(777, stateEntity!.CreatedBy);

        // 2. Create District
        var distDto = await distService.CreateAsync(new CreatePayrollDistrictMasterDto
        {
            StateId = stateDto.Id,
            DistrictCode = "PUN",
            DistrictName = "Pune",
            DistrictNameRegional = "पुणे",
            IsActive = true
        });
        Assert.NotNull(distDto);
        Assert.True(distDto.Id > 0);

        // 3. Create Taluka
        var talukaDto = await talukaService.CreateAsync(new CreatePayrollTalukaMasterDto
        {
            DistrictId = distDto.Id,
            TalukaCode = "HAV",
            TalukaName = "Haveli",
            TalukaNameRegional = "हवेली",
            IsCity = true,
            IsActive = true
        });
        Assert.NotNull(talukaDto);
        Assert.True(talukaDto.Id > 0);

        // 4. Create Village
        var villageDto = await villageService.CreateAsync(new CreatePayrollVillageMasterDto
        {
            TalukaId = talukaDto.Id,
            VillageCode = "SHI",
            VillageName = "Shivane",
            VillageNameRegional = "शिवणे",
            PINCode = "411023",
            IsActive = true
        });
        Assert.NotNull(villageDto);
        Assert.True(villageDto.Id > 0);

        // 5. Create Zone Division
        var zoneDto = await zoneService.CreateAsync(new CreatePayrollZoneDivisionMasterDto
        {
            ZoneDivisionCode = "HQ",
            ZoneDivisionName = "Headquarters",
            ZoneDivisionNameRegional = "मुख्यालय",
            Address = "Central Building",
            IsActive = true
        });
        Assert.NotNull(zoneDto);
        Assert.True(zoneDto.Id > 0);

        // 6. Hierarchy constraint validation: State cannot be deleted while district exists
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => stateService.DeleteAsync(stateDto.Id));

        // 7. Hierarchy constraint validation: District cannot be deleted while taluka exists
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => distService.DeleteAsync(distDto.Id));

        // 8. Hierarchy constraint validation: Taluka cannot be deleted while village exists
        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(() => talukaService.DeleteAsync(talukaDto.Id));

        // 9. Delete leaf Village
        var villageDeleted = await villageService.DeleteAsync(villageDto.Id);
        Assert.True(villageDeleted);
        Assert.Null(await _context.PayrollVillageMaster.FindAsync(villageDto.Id));

        // 10. Delete Taluka
        var talukaDeleted = await talukaService.DeleteAsync(talukaDto.Id);
        Assert.True(talukaDeleted);
        Assert.Null(await _context.PayrollTalukaMaster.FindAsync(talukaDto.Id));

        // 11. Delete District
        var distDeleted = await distService.DeleteAsync(distDto.Id);
        Assert.True(distDeleted);
        Assert.Null(await _context.PayrollDistrictMaster.FindAsync(distDto.Id));

        // 12. Delete State
        var stateDeleted = await stateService.DeleteAsync(stateDto.Id);
        Assert.True(stateDeleted);
        Assert.Null(await _context.PayrollStateMaster.FindAsync(stateDto.Id));

        // 13. Delete Zone Division
        var zoneDeleted = await zoneService.DeleteAsync(zoneDto.Id);
        Assert.True(zoneDeleted);
        Assert.Null(await _context.PayrollZoneDivisionMaster.FindAsync(zoneDto.Id));
    }

    #endregion
}