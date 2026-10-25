using AutoMapper;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Tests.Application.Mappings;

public class PropertySocialDetailsMappingProfileTests
{
    private readonly IMapper _mapper;

    public PropertySocialDetailsMappingProfileTests()
    {
        var configuration = new MapperConfiguration(
            cfg => cfg.AddProfile<PropertySocialDetailsMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

        _mapper = configuration.CreateMapper();
    }

    [Fact]
    public void CreateAndResponseMappings_PreserveEntityType()
    {
        var createDto = new CreatePropertySocialDetailsDto
        {
            PropertyId = 101,
            SocialAttributeId = 5,
            EntityType = "W"
        };

        var entity = _mapper.Map<PropertySocialDetailsEntity>(createDto);
        var response = _mapper.Map<PropertySocialDetailsDto>(entity);

        Assert.Equal("W", entity.EntityType);
        Assert.Equal("W", response.EntityType);
    }
}
