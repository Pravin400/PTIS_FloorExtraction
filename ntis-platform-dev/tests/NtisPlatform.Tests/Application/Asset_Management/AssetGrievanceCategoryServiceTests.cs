using System.ComponentModel.DataAnnotations;
using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using MockQueryable;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;
using Xunit;
using ValidationException = NtisPlatform.Application.Exceptions.ValidationException;
using ValidationResult = NtisPlatform.Application.Models.ValidationResult;

namespace NtisPlatform.Tests.Application.Asset_Management;

public class AssetGrievanceCategoryServiceTests
{
    private static string CodeDuplicateMessage(string code) => $"Grievance Type Code '{code}' already exists.";
    private static string NameDuplicateMessage(string name) => $"Grievance Type Name '{name}' already exists.";

    private readonly Mock<IRepository<AssetGrievanceCategoryEntity, int>> _mockRepository = new();
    private readonly Mock<IUnitOfWork> _mockUnitOfWork = new();
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator = new();
    private readonly IMapper _mapper = CreateMapper();

    public AssetGrievanceCategoryServiceTests()
    {
        _mockReferenceValidator
            .Setup(r => r.ValidateReferencesAsync<AssetGrievanceCategoryEntity>(It.IsAny<int>(), It.IsAny<ReferenceValidationOperation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
    }

    private static IMapper CreateMapper()
        => new MapperConfiguration(cfg => cfg.AddProfile<AssetGrievanceCategoryMappingProfile>(), NullLoggerFactory.Instance)
            .CreateMapper();

    /// <summary>Builds the service over an in-memory table; GetById and the duplicate checks both read <paramref name="rows"/>.</summary>
    private AssetGrievanceCategoryService CreateService(List<AssetGrievanceCategoryEntity> rows)
    {
        _mockRepository.Setup(r => r.GetQueryable()).Returns(() => rows.BuildMock());
        _mockRepository
            .Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int id, CancellationToken _) => rows.FirstOrDefault(x => x.Id == id));

        return new AssetGrievanceCategoryService(_mockRepository.Object, _mockUnitOfWork.Object, _mapper, _mockReferenceValidator.Object);
    }

    private static AssetGrievanceCategoryEntity NewEntity(
        int id,
        string code,
        string name,
        bool isActive = true,
        bool markedForDeletion = false,
        string? targetTableName = "AMS.AssetMaster",
        int displaySequence = 1) => new()
    {
        Id = id,
        GrievanceTypeCode = code,
        GrievanceTypeName = name,
        GrievanceTypeNameLocal = $"{name} (local)",
        Description = $"{name} description",
        TargetTableName = targetTableName,
        SLADays = 7,
        CodeFormat = "GRV-{YYYY}-{####}",
        DisplaySequence = displaySequence,
        IsActive = isActive,
        MarkedForDeletion = markedForDeletion,
        MarkedForDeletionDate = markedForDeletion ? DateTime.Now : null,
        CreatedBy = 1,
        CreatedDate = new DateTime(2026, 1, 1)
    };

    private static CreateAssetGrievanceCategoryDto NewCreateDto(string code = "NAME_CORR", string name = "Owner Name Correction") => new()
    {
        GrievanceTypeCode = code,
        GrievanceTypeName = name,
        GrievanceTypeNameLocal = "मालकाचे नाव दुरुस्ती",
        Description = "Correction of the owner name on an asset",
        TargetTableName = "AMS.AssetMaster",
        SLADays = 5,
        CodeFormat = "GRV-{YYYY}-{####}",
        DisplaySequence = 3,
        IsActive = true,
        CreatedBy = 10
    };

    private static UpdateAssetGrievanceCategoryDto NewUpdateDto(string code = "NAME_CORR", string name = "Owner Name Correction", bool isActive = true) => new()
    {
        GrievanceTypeCode = code,
        GrievanceTypeName = name,
        GrievanceTypeNameLocal = "मालकाचे नाव दुरुस्ती",
        Description = "Updated description",
        TargetTableName = "AMS.AssetMaster",
        SLADays = 2,
        CodeFormat = "GRV-{YY}-{#####}",
        DisplaySequence = 4,
        IsActive = isActive,
        UpdatedBy = 20
    };

    private static List<System.ComponentModel.DataAnnotations.ValidationResult> Validate(object dto)
    {
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);
        return results;
    }

    #region GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsAllColumns()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction", displaySequence: 2) });

        var result = await service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("NAME_CORR", result.GrievanceTypeCode);
        Assert.Equal("Owner Name Correction", result.GrievanceTypeName);
        Assert.Equal("Owner Name Correction (local)", result.GrievanceTypeNameLocal);
        Assert.Equal("Owner Name Correction description", result.Description);
        Assert.Equal("AMS.AssetMaster", result.TargetTableName);
        Assert.Equal(7, result.SLADays);
        Assert.Equal("GRV-{YYYY}-{####}", result.CodeFormat);
        Assert.Equal(2, result.DisplaySequence);
        Assert.True(result.IsActive);
        Assert.False(result.MarkedForDeletion);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        var service = CreateService(new());

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync

    [Fact]
    public void QueryParameters_DefaultToActiveAndNotMarkedForDeletion()
    {
        // The list endpoint relies on these defaults (not on service logic) to hide inactive/deleted rows.
        var queryParameters = new AssetGrievanceCategoryQueryParameters();

        Assert.True(queryParameters.IsActive);
        Assert.False(queryParameters.MarkedForDeletion);
    }

    private List<AssetGrievanceCategoryEntity> ActiveInactiveAndDeletedRows() => new()
    {
        NewEntity(1, "NAME_CORR", "Owner Name Correction"),
        NewEntity(2, "AREA_CORR", "Area Correction"),
        NewEntity(3, "INACTIVE", "Inactive Type", isActive: false),
        NewEntity(4, "DELETED", "Deleted Type", isActive: false, markedForDeletion: true)
    };

    [Fact]
    public async Task GetAllAsync_WithDefaultQueryParameters_ReturnsOnlyActiveAndNotMarkedForDeletion()
    {
        var service = CreateService(ActiveInactiveAndDeletedRows());

        // IsActive/MarkedForDeletion are left at their defaults (true/false), which ApplyFilters turns into predicates.
        var result = await service.GetAllAsync(new AssetGrievanceCategoryQueryParameters { PageNumber = 1, PageSize = 10 });

        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, x => Assert.True(x.IsActive));
        Assert.DoesNotContain(result.Items, x => x.MarkedForDeletion);
    }

    [Fact]
    public async Task GetAllAsync_WithActiveAndDeletionFiltersCleared_ReturnsAllRows()
    {
        var service = CreateService(ActiveInactiveAndDeletedRows());

        var result = await service.GetAllAsync(new AssetGrievanceCategoryQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            IsActive = null,
            MarkedForDeletion = null
        });

        Assert.Equal(4, result.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_WithMarkedForDeletionTrue_ReturnsOnlyDeletedRows()
    {
        var service = CreateService(ActiveInactiveAndDeletedRows());

        var result = await service.GetAllAsync(new AssetGrievanceCategoryQueryParameters { IsActive = null, MarkedForDeletion = true });

        Assert.Equal("DELETED", Assert.Single(result.Items).GrievanceTypeCode);
    }

    [Fact]
    public async Task GetAllAsync_FilterByGrievanceTypeCode_UsesContains()
    {
        var service = CreateService(new()
        {
            NewEntity(1, "NAME_CORR", "Owner Name Correction"),
            NewEntity(2, "AREA_CORR", "Area Correction"),
            NewEntity(3, "GENERAL", "General Complaint")
        });

        var result = await service.GetAllAsync(new AssetGrievanceCategoryQueryParameters { GrievanceTypeCode = "CORR" });

        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_SearchTerm_MatchesGrievanceTypeName()
    {
        var service = CreateService(new()
        {
            NewEntity(1, "NAME_CORR", "Owner Name Correction"),
            NewEntity(2, "GENERAL", "General Complaint")
        });

        var result = await service.GetAllAsync(new AssetGrievanceCategoryQueryParameters { SearchTerm = "complaint" });

        var item = Assert.Single(result.Items);
        Assert.Equal("GENERAL", item.GrievanceTypeCode);
    }

    [Fact]
    public async Task GetAllAsync_SortByDisplaySequence_OrdersRows()
    {
        var service = CreateService(new()
        {
            NewEntity(1, "C", "Third", displaySequence: 3),
            NewEntity(2, "A", "First", displaySequence: 1),
            NewEntity(3, "B", "Second", displaySequence: 2)
        });

        var result = await service.GetAllAsync(new AssetGrievanceCategoryQueryParameters { SortBy = "DisplaySequence" });

        Assert.Equal(new[] { 1, 2, 3 }, result.Items.Select(x => x.DisplaySequence));
    }

    [Theory]
    [InlineData("CategoryName")]
    [InlineData("ResolutionSlaDays")]
    public async Task GetAllAsync_SortByRemovedColumn_ThrowsFilterValidationException(string sortBy)
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });

        await Assert.ThrowsAsync<FilterValidationException>(
            () => service.GetAllAsync(new AssetGrievanceCategoryQueryParameters { SortBy = sortBy }));
    }

    #endregion

    #region CreateAsync

    [Fact]
    public async Task CreateAsync_ValidDto_PersistsAllColumns()
    {
        var service = CreateService(new());
        AssetGrievanceCategoryEntity? added = null;
        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetGrievanceCategoryEntity>(), It.IsAny<CancellationToken>()))
            .Callback((AssetGrievanceCategoryEntity e, CancellationToken _) => { e.Id = 1; added = e; })
            .ReturnsAsync((AssetGrievanceCategoryEntity e, CancellationToken _) => e);

        var result = await service.CreateAsync(NewCreateDto());

        Assert.NotNull(added);
        Assert.Equal("NAME_CORR", added.GrievanceTypeCode);
        Assert.Equal("Owner Name Correction", added.GrievanceTypeName);
        Assert.Equal("मालकाचे नाव दुरुस्ती", added.GrievanceTypeNameLocal);
        Assert.Equal("AMS.AssetMaster", added.TargetTableName);
        Assert.Equal(5, added.SLADays);
        Assert.Equal("GRV-{YYYY}-{####}", added.CodeFormat);
        Assert.Equal(3, added.DisplaySequence);
        Assert.Equal(10, added.CreatedBy);
        Assert.False(added.MarkedForDeletion);

        Assert.Equal(1, result.Id);
        Assert.Equal("NAME_CORR", result.GrievanceTypeCode);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCodeAndName_ReportsBothFields()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(NewCreateDto()));

        Assert.Equal(CodeDuplicateMessage("NAME_CORR"), ex.Errors["GrievanceTypeCode"]);
        Assert.Equal(NameDuplicateMessage("Owner Name Correction"), ex.Errors["GrievanceTypeName"]);
        // The top-level message names both clashing fields, not just "Validation failed".
        Assert.Equal($"{CodeDuplicateMessage("NAME_CORR")} {NameDuplicateMessage("Owner Name Correction")}", ex.Message);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<AssetGrievanceCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCodeWithDifferentName_ThrowsCodeDuplicate()
    {
        // GrievanceCategoryMaster is a top-level master: the code must be unique on its own.
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(NewCreateDto("NAME_CORR", "A Different Name")));

        Assert.Equal(CodeDuplicateMessage("NAME_CORR"), ex.Errors["GrievanceTypeCode"]);
        Assert.False(ex.Errors.ContainsKey("GrievanceTypeName"));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<AssetGrievanceCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DuplicateNameWithDifferentCode_ThrowsNameDuplicate()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(NewCreateDto("OTHER_CODE", "Owner Name Correction")));

        Assert.Equal(NameDuplicateMessage("Owner Name Correction"), ex.Errors["GrievanceTypeName"]);
        Assert.False(ex.Errors.ContainsKey("GrievanceTypeCode"));
    }

    [Fact]
    public async Task CreateAsync_DuplicateOfRowMarkedForDeletion_ThrowsValidationException()
    {
        // UQ_GrievanceCategoryMaster_GrievanceTypeCode / _GrievanceTypeName cover soft-deleted rows too,
        // so the service must reject the value instead of letting the insert fail in SQL.
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction", isActive: false, markedForDeletion: true) });

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(NewCreateDto("NAME_CORR", "A Different Name")));
    }

    [Fact]
    public async Task CreateAsync_UniqueCodeAndName_Succeeds()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });
        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetGrievanceCategoryEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetGrievanceCategoryEntity e, CancellationToken _) => e);

        var result = await service.CreateAsync(NewCreateDto("AREA_CORR", "Area Correction"));

        Assert.Equal("AREA_CORR", result.GrievanceTypeCode);
        Assert.Equal("Area Correction", result.GrievanceTypeName);
    }

    #endregion

    #region UpdateAsync

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesColumnsAndKeepsAuditFields()
    {
        var existing = NewEntity(1, "NAME_CORR", "Owner Name Correction");
        var service = CreateService(new() { existing });

        var result = await service.UpdateAsync(1, NewUpdateDto(name: "Owner Name Correction - Updated"));

        Assert.NotNull(result);
        Assert.Equal("Owner Name Correction - Updated", result.GrievanceTypeName);
        Assert.Equal("GRV-{YY}-{#####}", result.CodeFormat);
        Assert.Equal(2, result.SLADays);
        Assert.Equal(4, result.DisplaySequence);
        Assert.Equal(20, existing.UpdatedBy);
        Assert.Equal(1, existing.CreatedBy);
        Assert.Equal(new DateTime(2026, 1, 1), existing.CreatedDate);
        _mockRepository.Verify(r => r.UpdateAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_KeepingOwnCodeAndName_IsNotTreatedAsDuplicate()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });

        var result = await service.UpdateAsync(1, NewUpdateDto());

        Assert.NotNull(result);
    }

    [Fact]
    public async Task UpdateAsync_CodeAndNameOfAnotherRecord_ReportsBothFields()
    {
        var service = CreateService(new()
        {
            NewEntity(1, "NAME_CORR", "Owner Name Correction"),
            NewEntity(2, "AREA_CORR", "Area Correction")
        });

        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => service.UpdateAsync(1, NewUpdateDto("AREA_CORR", "Area Correction")));

        Assert.Equal(CodeDuplicateMessage("AREA_CORR"), ex.Errors["GrievanceTypeCode"]);
        Assert.Equal(NameDuplicateMessage("Area Correction"), ex.Errors["GrievanceTypeName"]);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetGrievanceCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("AREA_CORR", "Owner Name Correction", "GrievanceTypeCode", "Grievance Type Code 'AREA_CORR' already exists.")]
    [InlineData("NAME_CORR", "Area Correction", "GrievanceTypeName", "Grievance Type Name 'Area Correction' already exists.")]
    public async Task UpdateAsync_OneFieldTakenByAnotherRecord_ThrowsForThatField(string code, string name, string field, string key)
    {
        var service = CreateService(new()
        {
            NewEntity(1, "NAME_CORR", "Owner Name Correction"),
            NewEntity(2, "AREA_CORR", "Area Correction")
        });

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(1, NewUpdateDto(code, name)));

        Assert.Equal(key, Assert.Single(ex.Errors).Value);
        Assert.True(ex.Errors.ContainsKey(field));
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsNull()
    {
        var service = CreateService(new());

        var result = await service.UpdateAsync(999, NewUpdateDto());

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_DeactivationWithRemarks_ThrowsValidationException()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });
        _mockReferenceValidator
            .Setup(r => r.ValidateReferencesAsync<AssetGrievanceCategoryEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("ReferenceError", "Category is referenced by remarks"));

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(1, NewUpdateDto(isActive: false)));
    }

    [Fact]
    public async Task UpdateAsync_DeactivationWithoutRemarks_Succeeds()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });

        var result = await service.UpdateAsync(1, NewUpdateDto(isActive: false));

        Assert.NotNull(result);
        Assert.False(result.IsActive);
        _mockReferenceValidator.Verify(r => r.ValidateReferencesAsync<AssetGrievanceCategoryEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_StayingActive_DoesNotCheckReferences()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });

        await service.UpdateAsync(1, NewUpdateDto());

        _mockReferenceValidator.Verify(r => r.ValidateReferencesAsync<AssetGrievanceCategoryEntity>(It.IsAny<int>(), It.IsAny<ReferenceValidationOperation>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region DeleteAsync

    [Fact]
    public async Task DeleteAsync_ExistingEntity_SoftDeletesAndSaves()
    {
        var existing = NewEntity(1, "NAME_CORR", "Owner Name Correction");
        var service = CreateService(new() { existing });

        var result = await service.DeleteAsync(1);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingId_ReturnsFalse()
    {
        var service = CreateService(new());

        var result = await service.DeleteAsync(999);

        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<AssetGrievanceCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ReferencedByRemarks_ThrowsValidationException()
    {
        var service = CreateService(new() { NewEntity(1, "NAME_CORR", "Owner Name Correction") });
        _mockReferenceValidator
            .Setup(r => r.ValidateReferencesAsync<AssetGrievanceCategoryEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("ReferenceError", "Category has remarks"));

        await Assert.ThrowsAsync<ValidationException>(() => service.DeleteAsync(1));
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<AssetGrievanceCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region Mapping

    [Fact]
    public void MappingConfiguration_IsValid()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<AssetGrievanceCategoryMappingProfile>(), NullLoggerFactory.Instance);

        config.AssertConfigurationIsValid();
    }

    [Fact]
    public void CreateDto_To_Entity_IgnoresIdAndClearsDeletionFlag()
    {
        var entity = _mapper.Map<AssetGrievanceCategoryEntity>(NewCreateDto());

        Assert.Equal(0, entity.Id);
        Assert.False(entity.MarkedForDeletion);
        Assert.Null(entity.MarkedForDeletionDate);
        Assert.Null(entity.UpdatedBy);
        Assert.Equal(10, entity.CreatedBy);
    }

    [Fact]
    public void UpdateDto_OntoExistingEntity_PreservesIdentityAndDeletionState()
    {
        var existing = NewEntity(5, "NAME_CORR", "Owner Name Correction");

        _mapper.Map(NewUpdateDto(name: "Renamed"), existing);

        Assert.Equal(5, existing.Id);
        Assert.Equal("Renamed", existing.GrievanceTypeName);
        Assert.Equal(1, existing.CreatedBy);
        Assert.False(existing.MarkedForDeletion);
        Assert.Equal(20, existing.UpdatedBy);
    }

    #endregion

    #region DTO validation

    [Fact]
    public void CreateDto_ValidSample_PassesValidation()
    {
        Assert.Empty(Validate(NewCreateDto()));
    }

    [Fact]
    public void UpdateDto_ValidSample_PassesValidation()
    {
        Assert.Empty(Validate(NewUpdateDto()));
    }

    [Fact]
    public void CreateDto_OptionalColumnsOmitted_PassesValidation()
    {
        var dto = NewCreateDto();
        dto.GrievanceTypeNameLocal = null;
        dto.Description = null;
        dto.TargetTableName = null;
        dto.SLADays = null;

        Assert.Empty(Validate(dto));
    }

    public static TheoryData<Action<CreateAssetGrievanceCategoryDto>, string, string> InvalidCreateDtos => new()
    {
        { d => d.GrievanceTypeCode = null!, nameof(CreateAssetGrievanceCategoryDto.GrievanceTypeCode), "AssetGrievanceCategory_GrievanceTypeCode_Required" },
        { d => d.GrievanceTypeCode = new string('A', 51), nameof(CreateAssetGrievanceCategoryDto.GrievanceTypeCode), "AssetGrievanceCategory_GrievanceTypeCode_MaxLen_50" },
        { d => d.GrievanceTypeCode = "NAME CORR", nameof(CreateAssetGrievanceCategoryDto.GrievanceTypeCode), "AssetGrievanceCategory_GrievanceTypeCode_Invalid" },
        { d => d.GrievanceTypeCode = "नाव", nameof(CreateAssetGrievanceCategoryDto.GrievanceTypeCode), "AssetGrievanceCategory_GrievanceTypeCode_Invalid" },
        { d => d.GrievanceTypeName = "  ", nameof(CreateAssetGrievanceCategoryDto.GrievanceTypeName), "AssetGrievanceCategory_GrievanceTypeName_Required" },
        { d => d.GrievanceTypeName = new string('N', 201), nameof(CreateAssetGrievanceCategoryDto.GrievanceTypeName), "AssetGrievanceCategory_GrievanceTypeName_MaxLen_200" },
        { d => d.GrievanceTypeNameLocal = new string('L', 201), nameof(CreateAssetGrievanceCategoryDto.GrievanceTypeNameLocal), "AssetGrievanceCategory_GrievanceTypeNameLocal_MaxLen_200" },
        { d => d.Description = new string('D', 501), nameof(CreateAssetGrievanceCategoryDto.Description), "AssetGrievanceCategory_Description_MaxLen_500" },
        { d => d.TargetTableName = new string('T', 201), nameof(CreateAssetGrievanceCategoryDto.TargetTableName), "AssetGrievanceCategory_TargetTableName_MaxLen_200" },
        { d => d.TargetTableName = "AMS.Asset Master; DROP", nameof(CreateAssetGrievanceCategoryDto.TargetTableName), "AssetGrievanceCategory_TargetTableName_Invalid" },
        { d => d.SLADays = -1, nameof(CreateAssetGrievanceCategoryDto.SLADays), "AssetGrievanceCategory_SLADays_MustBeNonNegative" },
        { d => d.CodeFormat = null!, nameof(CreateAssetGrievanceCategoryDto.CodeFormat), "AssetGrievanceCategory_CodeFormat_Required" },
        { d => d.CodeFormat = new string('C', 101), nameof(CreateAssetGrievanceCategoryDto.CodeFormat), "AssetGrievanceCategory_CodeFormat_MaxLen_100" },
        { d => d.CodeFormat = "GRV {YYYY}", nameof(CreateAssetGrievanceCategoryDto.CodeFormat), "AssetGrievanceCategory_CodeFormat_Invalid" },
        { d => d.DisplaySequence = -1, nameof(CreateAssetGrievanceCategoryDto.DisplaySequence), "AssetGrievanceCategory_DisplaySequence_Invalid" }
    };

    [Theory]
    [MemberData(nameof(InvalidCreateDtos))]
    public void CreateDto_InvalidValue_FailsWithExpectedMessage(Action<CreateAssetGrievanceCategoryDto> mutate, string member, string message)
    {
        var dto = NewCreateDto();
        mutate(dto);

        var results = Validate(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(member) && r.ErrorMessage == message);
    }

    [Theory]
    [InlineData("AMS.AssetMaster")]
    [InlineData("AssetMaster")]
    [InlineData("Asset_Master_2")]
    public void CreateDto_TargetTableName_AcceptsTableOrSchemaQualifiedName(string tableName)
    {
        var dto = NewCreateDto();
        dto.TargetTableName = tableName;

        Assert.Empty(Validate(dto));
    }

    [Theory]
    [InlineData("GRV-{YYYY}-{####}")]
    [InlineData("GRV/{YY}/{0000}")]
    [InlineData("ALPHANUMERIC")]
    public void CreateDto_CodeFormat_AcceptsFormatTokens(string codeFormat)
    {
        var dto = NewCreateDto();
        dto.CodeFormat = codeFormat;

        Assert.Empty(Validate(dto));
    }

    [Fact]
    public void UpdateDto_MissingRequiredColumns_FailsValidation()
    {
        var dto = NewUpdateDto();
        dto.GrievanceTypeCode = null!;
        dto.GrievanceTypeName = null!;
        dto.CodeFormat = null!;

        var members = Validate(dto).SelectMany(r => r.MemberNames).ToList();

        Assert.Contains(nameof(UpdateAssetGrievanceCategoryDto.GrievanceTypeCode), members);
        Assert.Contains(nameof(UpdateAssetGrievanceCategoryDto.GrievanceTypeName), members);
        Assert.Contains(nameof(UpdateAssetGrievanceCategoryDto.CodeFormat), members);
    }

    [Fact]
    public void UpdateDto_NegativeNumbers_FailValidation()
    {
        var dto = NewUpdateDto();
        dto.SLADays = -5;
        dto.DisplaySequence = -1;

        var members = Validate(dto).SelectMany(r => r.MemberNames).ToList();

        Assert.Contains(nameof(UpdateAssetGrievanceCategoryDto.SLADays), members);
        Assert.Contains(nameof(UpdateAssetGrievanceCategoryDto.DisplaySequence), members);
    }

    #endregion
}
