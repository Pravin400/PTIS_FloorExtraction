using AutoMapper;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Core.Entities.Master;
using Xunit;

namespace NtisPlatform.Tests.Application.Mappings;

/// <summary>
/// Comprehensive mapping tests for FLatGenerationGroupMasterMappingProfile.
/// </summary>
public class FLatGenerationGroupMasterMappingProfileTests
{
    private readonly IMapper _mapper;
    private readonly MapperConfiguration _configuration;

    public FLatGenerationGroupMasterMappingProfileTests()
    {
        _configuration = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<FLatGenerationGroupMasterMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

        _mapper = _configuration.CreateMapper();
    }

    #region Configuration Tests

    [Fact]
    public void MappingProfile_Configuration_IsValid()
    {
        _configuration.AssertConfigurationIsValid();
    }

    [Fact]
    public void MappingProfile_CanCreateMapper()
    {
        var mapper = _configuration.CreateMapper();
        Assert.NotNull(mapper);
    }

    #endregion

    #region Entity to Dto Mapping Tests

    [Fact]
    public void Map_EntityToDto_MapsAllProperties()
    {
        var entity = new FLatGenerationGroupMasterEntity
        {
            Id = 1,
            FLatGenerationGroup = "UPPER",
            IsActive = true,
            CreatedBy = 100,
            CreatedDate = DateTime.Now,
            UpdatedBy = 200,
            UpdatedDate = DateTime.Now.AddHours(1)
        };

        var dto = _mapper.Map<FLatGenerationGroupMasterDto>(entity);

        Assert.NotNull(dto);
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.FLatGenerationGroup, dto.FLatGenerationGroup);
        Assert.Equal(entity.IsActive, dto.IsActive);
        Assert.Equal(entity.CreatedDate, dto.CreatedDate);
        Assert.Equal(entity.UpdatedDate, dto.UpdatedDate);
    }

    [Fact]
    public void Map_EntityToDto_MultipleEntities_MapsAllCorrectly()
    {
        var entities = new List<FLatGenerationGroupMasterEntity>
        {
            new() { Id = 1, FLatGenerationGroup = "UPPER", IsActive = true },
            new() { Id = 2, FLatGenerationGroup = "GROUND", IsActive = true },
            new() { Id = 3, FLatGenerationGroup = "PODIUM", IsActive = false }
        };

        var dtos = _mapper.Map<List<FLatGenerationGroupMasterDto>>(entities);

        Assert.NotNull(dtos);
        Assert.Equal(3, dtos.Count);
        Assert.Equal("UPPER", dtos[0].FLatGenerationGroup);
        Assert.Equal("GROUND", dtos[1].FLatGenerationGroup);
        Assert.Equal("PODIUM", dtos[2].FLatGenerationGroup);
        Assert.False(dtos[2].IsActive);
    }

    #endregion

    #region CreateDto to Entity Mapping Tests

    [Fact]
    public void Map_CreateDtoToEntity_MapsAllowedProperties()
    {
        var createDto = new CreateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = "UPPER",
            CreatedBy = 100
        };

        var entity = _mapper.Map<FLatGenerationGroupMasterEntity>(createDto);

        Assert.NotNull(entity);
        Assert.Equal("UPPER", entity.FLatGenerationGroup);
        Assert.Equal(100, entity.CreatedBy);
        Assert.Equal(0, entity.Id);
        Assert.Null(entity.CreatedDate);
        Assert.Null(entity.UpdatedDate);
        Assert.Null(entity.UpdatedBy);
        Assert.Empty(entity.Floors);
    }

    #endregion

    #region UpdateDto to Entity Mapping Tests

    [Fact]
    public void Map_UpdateDtoToEntity_MapsAllowedProperties()
    {
        var updateDto = new UpdateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = "GROUND",
            IsActive = false,
            UpdatedBy = 200
        };

        var existingEntity = new FLatGenerationGroupMasterEntity
        {
            Id = 5,
            FLatGenerationGroup = "UPPER",
            IsActive = true,
            CreatedBy = 100,
            CreatedDate = DateTime.Now.AddDays(-1)
        };

        var result = _mapper.Map(updateDto, existingEntity);

        Assert.NotNull(result);
        Assert.Equal("GROUND", existingEntity.FLatGenerationGroup);
        Assert.False(existingEntity.IsActive);
        Assert.Equal(200, existingEntity.UpdatedBy);
        Assert.Equal(5, existingEntity.Id);
        Assert.Equal(100, existingEntity.CreatedBy);
    }

    #endregion

    #region Null Handling Tests

    [Fact]
    public void Map_NullEntity_ReturnsNull()
    {
        FLatGenerationGroupMasterEntity? entity = null;
        var dto = _mapper.Map<FLatGenerationGroupMasterDto>(entity);
        Assert.Null(dto);
    }

    [Fact]
    public void Map_NullCreateDto_ReturnsNull()
    {
        CreateFLatGenerationGroupMasterDto? createDto = null;
        var entity = _mapper.Map<FLatGenerationGroupMasterEntity>(createDto);
        Assert.Null(entity);
    }

    #endregion
}
