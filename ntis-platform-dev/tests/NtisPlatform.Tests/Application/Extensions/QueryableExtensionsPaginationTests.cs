using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using MockQueryable;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Application.Extensions;

public class QueryableExtensionsPaginationTests
{
    private class TestItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    private static IQueryable<TestItem> CreateTestData(int count)
    {
        var items = Enumerable.Range(1, count)
            .Select(i => new TestItem { Id = i, Name = $"Item {i}" })
            .ToList();
        return items.BuildMock();
    }

    [Fact]
    public async Task ToPagedResultAsync_FirstPage_ReturnsCorrectPagedResult()
    {
        var query = CreateTestData(25);

        var result = await query.ToPagedResultAsync(pageNumber: 1, pageSize: 10);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(10);
        result.Items.First().Id.Should().Be(1);
        result.Items.Last().Id.Should().Be(10);
        result.TotalCount.Should().Be(25);
        result.PageNumber.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalPages.Should().Be(3);
        result.HasNext.Should().BeTrue();
        result.HasPrevious.Should().BeFalse();
    }

    [Fact]
    public async Task ToPagedResultAsync_SecondPage_ReturnsCorrectPageAndNavigationFlags()
    {
        var query = CreateTestData(25);

        var result = await query.ToPagedResultAsync(pageNumber: 2, pageSize: 10);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(10);
        result.Items.First().Id.Should().Be(11);
        result.Items.Last().Id.Should().Be(20);
        result.TotalCount.Should().Be(25);
        result.PageNumber.Should().Be(2);
        result.HasNext.Should().BeTrue();
        result.HasPrevious.Should().BeTrue();
    }

    [Fact]
    public async Task ToPagedResultAsync_LastPage_ReturnsRemainingItems()
    {
        var query = CreateTestData(25);

        var result = await query.ToPagedResultAsync(pageNumber: 3, pageSize: 10);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(5);
        result.Items.First().Id.Should().Be(21);
        result.Items.Last().Id.Should().Be(25);
        result.TotalCount.Should().Be(25);
        result.PageNumber.Should().Be(3);
        result.HasNext.Should().BeFalse();
        result.HasPrevious.Should().BeTrue();
    }

    [Fact]
    public async Task ToPagedResultAsync_PageSizeMinusOne_ReturnsAllRecords()
    {
        var query = CreateTestData(25);

        var result = await query.ToPagedResultAsync(pageNumber: 1, pageSize: -1);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(25);
        result.TotalCount.Should().Be(25);
        result.PageNumber.Should().Be(1);
        result.PageSize.Should().Be(25);
        result.TotalPages.Should().Be(1);
        result.HasNext.Should().BeFalse();
        result.HasPrevious.Should().BeFalse();
    }

    [Fact]
    public async Task ToPagedResultAsync_EmptySource_ReturnsEmptyPagedResult()
    {
        var query = CreateTestData(0);

        var result = await query.ToPagedResultAsync(pageNumber: 1, pageSize: 10);

        result.Should().NotBeNull();
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
        result.TotalPages.Should().Be(0);
        result.HasNext.Should().BeFalse();
        result.HasPrevious.Should().BeFalse();
    }

    [Fact]
    public async Task ApplyPaginationAsync_WithQueryParameters_AppliesPaginationHelperCalculations()
    {
        var query = CreateTestData(35);
        var queryParams = new PropertyWiseQueryParameters
        {
            PageNumber = 2,
            PageSize = 10
        };

        var result = await query.ApplyPaginationAsync(queryParams);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(10);
        result.Items.First().Id.Should().Be(11);
        result.Items.Last().Id.Should().Be(20);
        result.TotalCount.Should().Be(35);
        result.PageNumber.Should().Be(2);
        result.PageSize.Should().Be(10);
        result.TotalPages.Should().Be(4);
    }
}