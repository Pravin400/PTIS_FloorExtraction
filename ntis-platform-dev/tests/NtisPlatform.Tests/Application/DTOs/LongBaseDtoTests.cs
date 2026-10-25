using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Tests.Application.DTOs;

/// <summary>
/// Unit tests for LongBaseDto and LongBaseDtos to ensure proper functionality and coverage
/// </summary>
public class LongBaseDtoTests
{
    [Fact]
    public void LongBaseDto_AllProperties_GetSet_WorksCorrectly()
    {
        var now = DateTime.Now;
        var dto = new LongBaseDto
        {
            Id = 5000000000L,
            IsActive = true,
            CreatedDate = now,
            UpdatedDate = now.AddHours(1)
        };

        Assert.Equal(5000000000L, dto.Id);
        Assert.True(dto.IsActive);
        Assert.Equal(now, dto.CreatedDate);
        Assert.Equal(now.AddHours(1), dto.UpdatedDate);
    }

    [Fact]
    public void LongBaseDto_DefaultValues_SetCorrectly()
    {
        var dto = new LongBaseDto();

        Assert.Equal(0L, dto.Id);
        Assert.False(dto.IsActive);
        Assert.Null(dto.CreatedDate);
        Assert.Null(dto.UpdatedDate);
    }

    [Fact]
    public void LongBaseDto_DateProperties_CanBeNull()
    {
        var dto = new LongBaseDto
        {
            Id = 1L,
            IsActive = true,
            CreatedDate = null,
            UpdatedDate = null
        };

        Assert.Null(dto.CreatedDate);
        Assert.Null(dto.UpdatedDate);
    }

    [Fact]
    public void LongBaseDto_IsActive_BothValues_WorkCorrectly()
    {
        var dto1 = new LongBaseDto { IsActive = true };
        var dto2 = new LongBaseDto { IsActive = false };

        Assert.True(dto1.IsActive);
        Assert.False(dto2.IsActive);
    }
}
