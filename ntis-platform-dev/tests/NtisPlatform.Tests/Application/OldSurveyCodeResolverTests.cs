using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class OldSurveyCodeResolverTests
{
    private readonly Mock<IRepository<PropertyDetailsOldEntity, int>> _details = new();
    private readonly Mock<IRepository<FloorEntity, int>> _floors = new();
    private readonly Mock<IRepository<ConstructionTypeEntity, int>> _constructionTypes = new();
    private readonly Mock<IRepository<TypeOfUseEntity, int>> _typesOfUse = new();
    private readonly Mock<IRepository<SubTypeOfUseEntity, int>> _subTypesOfUse = new();
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _propertyTypes = new();

    public OldSurveyCodeResolverTests()
    {
        _floors.Setup(r => r.GetQueryable()).Returns(new List<FloorEntity>
        {
            new() { Id = 1, FloorCode = "G", Description = "Ground Floor" }
        }.BuildMock());
        _constructionTypes.Setup(r => r.GetQueryable()).Returns(new List<ConstructionTypeEntity>
        {
            new() { Id = 2, ConstructionCode = "AB", Description = "RCC" }
        }.BuildMock());
        _typesOfUse.Setup(r => r.GetQueryable()).Returns(new List<TypeOfUseEntity>
        {
            new() { Id = 3, TypeOfUseCode = "R", Description = "Residential" }
        }.BuildMock());
        _subTypesOfUse.Setup(r => r.GetQueryable()).Returns(new List<SubTypeOfUseEntity>
        {
            new() { Id = 4, Description = "Flat" }
        }.BuildMock());
        _propertyTypes.Setup(r => r.GetQueryable()).Returns(new List<PropertyTypeMasterEntity>
        {
            new() { Id = 12, PropertyDescription = "निवासी", PartType = "R" }
        }.BuildMock());
    }

    private void SetDetails(params PropertyDetailsOldEntity[] rows)
        => _details.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsOldEntity>(rows).BuildMock());

    private Task ApplyAsync(params OldSurveyPropertyDto[] surveys)
        => OldSurveyCodeResolver.ApplyAsync(surveys, _details.Object, _floors.Object, _constructionTypes.Object, _typesOfUse.Object,
            CancellationToken.None, _subTypesOfUse.Object, _propertyTypes.Object);

    private static PropertyDetailsOldEntity Detail(int id, int oldId, string? constructionYear = "1995", string? assessmentYear = "2012") => new()
    {
        Id = id, PropertyMastOldId = oldId, OldFloorId = 1, OldConstructionTypeId = 2, OldTypeOfUseId = 3, OldSubTypeOfUseId = 4,
        OldConstructionYear = constructionYear, OldAssessmentYear = assessmentYear, IsActive = true
    };

    [Fact]
    public async Task Apply_FillsCodesDescriptionsAndYearsFromTheLatestOldDetail()
    {
        SetDetails(Detail(10, 500, "1990", "2010"), Detail(11, 500, "1995", "2012"));
        var dto = new OldSurveyPropertyDto { Id = 500 };

        await ApplyAsync(dto);

        Assert.Equal("G", dto.FloorCode);
        Assert.Equal("Ground Floor", dto.Floor);
        Assert.Equal("AB", dto.ConstructionCode);
        Assert.Equal("RCC", dto.ConstructionType);
        Assert.Equal("R", dto.TypeOfUseCode);
        Assert.Equal("Residential", dto.TypeOfUse);
        Assert.Equal("Flat", dto.SubTypeOfUse);
        Assert.Equal("1995", dto.ConstructionYear);      // PropertyMastOld has none: the latest detail row (Id 11) fills it
        Assert.Equal(2012, dto.OldAssessmentYear);
    }

    [Fact]
    public async Task Apply_NeverOverwritesWhatPropertyMastOldAlreadyHas()
    {
        SetDetails(Detail(10, 500));
        var dto = new OldSurveyPropertyDto
        {
            Id = 500, Floor = "पहिला मजला", ConstructionType = "आर सी सी", TypeOfUse = "निवासी वापर", ConstructionYear = "1980", OldAssessmentYear = 2001
        };

        await ApplyAsync(dto);

        Assert.Equal("पहिला मजला", dto.Floor);
        Assert.Equal("आर सी सी", dto.ConstructionType);
        Assert.Equal("निवासी वापर", dto.TypeOfUse);
        Assert.Equal("1980", dto.ConstructionYear);
        Assert.Equal(2001, dto.OldAssessmentYear);
        Assert.Equal("G", dto.FloorCode); // codes always come from the master
    }

    [Fact]
    public async Task Apply_AssessmentYear_FallsBackFromDetailToTheYearOfTheAssessmentDate()
    {
        SetDetails(Detail(10, 500, assessmentYear: null));
        var withDate = new OldSurveyPropertyDto { Id = 500, OldAssessmentDate = new DateTime(2008, 4, 1) };

        await ApplyAsync(withDate);

        Assert.Equal(2008, withDate.OldAssessmentYear);
    }

    [Fact]
    public async Task Apply_AssessmentYear_IsTakenFromTheAssessmentDateEvenWithoutAnyOldDetail()
    {
        SetDetails();
        var dto = new OldSurveyPropertyDto { Id = 501, OldAssessmentDate = new DateTime(2015, 12, 31) };

        await ApplyAsync(dto);

        Assert.Equal(2015, dto.OldAssessmentYear);
    }

    [Fact]
    public async Task Apply_FillsThePropertyTypeNameAndCode()
    {
        SetDetails();
        var dto = new OldSurveyPropertyDto { Id = 502, OldPropertyTypeId = 12 };
        var unknown = new OldSurveyPropertyDto { Id = 503, OldPropertyTypeId = 999 };

        await ApplyAsync(dto, unknown);

        Assert.Equal("निवासी", dto.OldPropertyTypeName);
        Assert.Equal("R", dto.OldPropertyTypeCode);
        Assert.Null(unknown.OldPropertyTypeName);
    }

    [Fact]
    public async Task Apply_WithoutTheDetailMasters_StillFillsPropertyTypeAndAssessmentDateYear()
    {
        var dto = new OldSurveyPropertyDto { Id = 504, OldPropertyTypeId = 12, OldAssessmentDate = new DateTime(2019, 1, 1) };

        await OldSurveyCodeResolver.ApplyAsync(new[] { dto }, null, null, null, null, CancellationToken.None, null, _propertyTypes.Object);

        Assert.Equal("निवासी", dto.OldPropertyTypeName);
        Assert.Equal(2019, dto.OldAssessmentYear);
        Assert.Null(dto.FloorCode);
    }

    [Fact]
    public async Task Apply_IgnoresRowsWithoutAnOldProperty()
    {
        SetDetails(Detail(10, 0));
        var empty = new OldSurveyPropertyDto { Id = 0, OldPropertyTypeId = 12, OldAssessmentDate = new DateTime(2019, 1, 1) };

        await ApplyAsync(empty);

        Assert.Null(empty.OldPropertyTypeName);
        Assert.Null(empty.OldAssessmentYear);
    }
}
