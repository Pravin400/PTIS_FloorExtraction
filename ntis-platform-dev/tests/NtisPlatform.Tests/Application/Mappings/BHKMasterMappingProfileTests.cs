using System.ComponentModel.DataAnnotations;
using AutoMapper;
using NtisPlatform.Application.DTOs.Master.BHKMaster;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Tests.Application.Mappings;

public class BHKMasterMappingProfileTests
{
    private readonly MapperConfiguration _configuration = new(
        cfg => cfg.AddProfile<BHKMasterMappingProfile>(),
        Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

    [Fact]
    public void MappingProfile_Configuration_IsValid() => _configuration.AssertConfigurationIsValid();

    [Fact]
    public void Entity_To_Dto_MapsAllFields()
    {
        var entity = new BHKMasterEntity
        {
            Id = 4, BHKCode = "2BHK", BHKName = "2 BHK", Description = "Two Bedroom Hall Kitchen",
            DisplayOrder = 4, RoomCount = 4m, IsActive = true, CreatedDate = new DateTime(2026, 1, 1)
        };

        var dto = _configuration.CreateMapper().Map<BHKMasterDto>(entity);

        Assert.Equal(4, dto.Id);
        Assert.Equal("2BHK", dto.BHKCode);
        Assert.Equal("2 BHK", dto.BHKName);
        Assert.Equal("Two Bedroom Hall Kitchen", dto.Description);
        Assert.Equal(4, dto.DisplayOrder);
        Assert.Equal(4m, dto.RoomCount);
        Assert.True(dto.IsActive);
    }

    [Fact]
    public void CreateDto_To_Entity_SetsCreatedBy()
    {
        var entity = _configuration.CreateMapper().Map<BHKMasterEntity>(
            new CreateBHKMasterDto { BHKCode = "1.5BHK", BHKName = "1.5 BHK", DisplayOrder = 3, RoomCount = 3.5m, IsActive = true, CreatedBy = 7 });

        Assert.Equal("1.5BHK", entity.BHKCode);
        Assert.Equal(3.5m, entity.RoomCount);
        Assert.Equal(7, entity.CreatedBy);
        Assert.Equal(0, entity.Id);
    }

    [Fact]
    public void UpdateDto_To_Entity_DoesNotOverwriteCreatedBy()
    {
        var entity = new BHKMasterEntity { Id = 3, CreatedBy = 1 };

        _configuration.CreateMapper().Map(
            new UpdateBHKMasterDto { BHKCode = "1BHK", BHKName = "1 BHK", RoomCount = 3m, IsActive = false, UpdatedBy = 9 }, entity);

        Assert.Equal(3, entity.Id);
        Assert.Equal(1, entity.CreatedBy);
        Assert.Equal(9, entity.UpdatedBy);
        Assert.Equal(3m, entity.RoomCount);
        Assert.False(entity.IsActive);
    }

    private static IList<ValidationResult> Validate(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, true);
        return results;
    }

    [Fact]
    public void CreateDto_Valid_PassesValidation()
        => Assert.Empty(Validate(new CreateBHKMasterDto { BHKCode = "1BHK", BHKName = "1 BHK", Description = "One Bedroom Hall Kitchen" }));

    [Theory]
    [InlineData("", "1 BHK")]
    [InlineData("1BHK", "")]
    public void CreateDto_MissingRequiredField_FailsValidation(string code, string name)
        => Assert.NotEmpty(Validate(new CreateBHKMasterDto { BHKCode = code, BHKName = name }));

    [Theory]
    [InlineData(null)]   // no standard count (Other)
    [InlineData(1.0)]
    [InlineData(3.5)]
    [InlineData(99.9)]
    public void RoomCount_InRangeOrNull_PassesValidation(double? roomCount)
    {
        decimal? value = roomCount.HasValue ? (decimal)roomCount.Value : null;

        Assert.Empty(Validate(new CreateBHKMasterDto { BHKCode = "X", BHKName = "X", RoomCount = value }));
        Assert.Empty(Validate(new UpdateBHKMasterDto { BHKCode = "X", BHKName = "X", RoomCount = value }));
    }

    [Theory]
    [InlineData(0.0)]
    [InlineData(0.4)]
    [InlineData(-1.0)]
    [InlineData(100.0)]
    public void RoomCount_OutOfRange_FailsValidation(double roomCount)
    {
        var value = (decimal)roomCount;

        Assert.Single(Validate(new CreateBHKMasterDto { BHKCode = "X", BHKName = "X", RoomCount = value }));
        Assert.Single(Validate(new UpdateBHKMasterDto { BHKCode = "X", BHKName = "X", RoomCount = value }));
    }

    [Fact]
    public void CreateDto_FieldsExceedingMaxLength_FailValidation()
    {
        var results = Validate(new CreateBHKMasterDto
        {
            BHKCode = new string('a', 21),
            BHKName = new string('b', 51),
            Description = new string('c', 201)
        });

        Assert.Equal(3, results.Count);
    }

    [Fact]
    public void UpdateDto_FieldsExceedingMaxLength_FailValidation()
    {
        var results = Validate(new UpdateBHKMasterDto
        {
            BHKCode = new string('a', 21),
            BHKName = new string('b', 51),
            Description = new string('c', 201)
        });

        Assert.Equal(3, results.Count);
    }
}
