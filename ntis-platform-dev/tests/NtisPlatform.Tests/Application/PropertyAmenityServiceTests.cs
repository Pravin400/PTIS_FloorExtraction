using System.Linq.Expressions;
using System.Reflection;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.Logging;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.PropertyAmenity;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Services.Property;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;
using NtisPlatform.Core.Constants;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Comprehensive unit tests for <see cref="PropertyAmenityService"/>.
/// Covers all methods, edge cases, error conditions, and success scenarios.
/// </summary>
public class PropertyAmenityServiceTests
{
    private readonly Mock<IRepository<PropertyEntity, int>> _mockPropertyRepository;
    private readonly Mock<IRepository<PropertyDetailsEntity, int>> _mockPropertyDetailsRepository;
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _mockPropertyTypeRepository;
    private readonly Mock<IRepository<PropertyPhotoEntity, int>> _mockPropertyPhotoRepository;
    private readonly Mock<IRepository<DocumentBindingEntity, int>> _mockDocumentBindingRepository;
    private readonly Mock<IRepository<DocumentEntity, int>> _mockDocumentRepository;
    private readonly Mock<IRepository<GlobalSurveyWardAllocationEntity, int>> _mockWardAllocationRepository;
    private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _mockAssessmentRepository;
    private readonly Mock<IRepository<PropertyWorkflowStageMasterEntity, int>> _mockWorkflowStageRepository;
    private readonly Mock<IRepository<SocietyWingDetailsEntity, int>> _mockSocietyWingRepository;
    private readonly Mock<IRepository<PropertyWorkflowDetailsEntity, int>> _mockPropertyWorkflowDetailsRepository;
    private readonly Mock<IRepository<PropertySurveyVisitEntity, int>> _mockPropertySurveyVisitRepository;
    private readonly Mock<IRepository<PropertyMapDetailEntity, int>> _mockPropertyMapDetailRepository;
    private readonly Mock<IRepository<WingDetailsMastEntity, int>> _mockWingDetailsRepository;
    private readonly Mock<IRepository<SocietyDetailsEntity, int>> _mockSocietyDetailsRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ILogger<PropertyAmenityService>> _mockLogger;
    private readonly IMapper _mapper;

    private static bool SqlLike(string? match, string? pattern)
    {
        if (match == null || pattern == null) return false;
        var regexPattern = "^" + System.Text.RegularExpressions.Regex.Escape(pattern)
            .Replace("%", ".*")
            .Replace("_", ".")
            .Replace(@"\[", "[")
            .Replace(@"\]", "]") + "$";
        return System.Text.RegularExpressions.Regex.IsMatch(match, regexPattern, System.Text.RegularExpressions.RegexOptions.Singleline | System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    private static IQueryable<T> BuildLikeSupportedMock<T>(List<T> data) where T : class
    {
        var mock = data.BuildMock();
        return new LikeQueryable<T>(mock, new LikeRewriteQueryProvider(mock.Provider));
    }

    private class LikeQueryable<T> : IOrderedQueryable<T>, IAsyncEnumerable<T>
    {
        private readonly IQueryable<T> _source;
        public LikeQueryable(IQueryable<T> source, IQueryProvider provider)
        {
            _source = source;
            Provider = provider;
        }
        public Type ElementType => _source.ElementType;
        public Expression Expression => _source.Expression;
        public IQueryProvider Provider { get; }
        public IEnumerator<T> GetEnumerator() => _source.GetEnumerator();
        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => _source.GetEnumerator();
        public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        {
            if (_source is IAsyncEnumerable<T> asyncEnumerable)
                return asyncEnumerable.GetAsyncEnumerator(cancellationToken);
            return new AsyncEnumeratorWrapper(_source.GetEnumerator());
        }
        private class AsyncEnumeratorWrapper : IAsyncEnumerator<T>
        {
            private readonly IEnumerator<T> _inner;
            public AsyncEnumeratorWrapper(IEnumerator<T> inner) => _inner = inner;
            public T Current => _inner.Current;
            public ValueTask<bool> MoveNextAsync() => ValueTask.FromResult(_inner.MoveNext());
            public ValueTask DisposeAsync() => ValueTask.CompletedTask;
        }
    }

    private class LikeRewriteQueryProvider : IAsyncQueryProvider
    {
        private readonly IQueryProvider _inner;
        public LikeRewriteQueryProvider(IQueryProvider inner) => _inner = inner;

        public IQueryable CreateQuery(Expression expression)
        {
            var elementType = expression.Type.GetGenericArguments().FirstOrDefault() ?? typeof(object);
            var innerQuery = _inner.CreateQuery(Rewrite(expression));
            var likeQueryableType = typeof(LikeQueryable<>).MakeGenericType(elementType);
            return (IQueryable)Activator.CreateInstance(likeQueryableType, innerQuery, this)!;
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression) =>
            new LikeQueryable<TElement>(_inner.CreateQuery<TElement>(Rewrite(expression)), this);

        public object? Execute(Expression expression) =>
            _inner.Execute(Rewrite(expression));

        public TResult Execute<TResult>(Expression expression) =>
            _inner.Execute<TResult>(Rewrite(expression));

        public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
        {
            if (_inner is IAsyncQueryProvider asyncProvider)
                return asyncProvider.ExecuteAsync<TResult>(Rewrite(expression), cancellationToken);
            return _inner.Execute<TResult>(Rewrite(expression));
        }

        private static Expression Rewrite(Expression expression) => new LikeVisitor().Visit(expression);

        private class LikeVisitor : ExpressionVisitor
        {
            private static readonly MethodInfo SqlLikeMethod = typeof(PropertyAmenityServiceTests).GetMethod(nameof(SqlLike), BindingFlags.NonPublic | BindingFlags.Static)!;

            protected override Expression VisitMethodCall(MethodCallExpression node)
            {
                if (node.Method.DeclaringType == typeof(DbFunctionsExtensions) && node.Method.Name == nameof(DbFunctionsExtensions.Like))
                {
                    var matchExpr = Visit(node.Arguments[1]);
                    var patternExpr = Visit(node.Arguments[2]);
                    return Expression.Call(SqlLikeMethod, matchExpr, patternExpr);
                }
                return base.VisitMethodCall(node);
            }
        }
    }

    public PropertyAmenityServiceTests()
    {
        _mockPropertyRepository = new Mock<IRepository<PropertyEntity, int>>();
        _mockPropertyDetailsRepository = new Mock<IRepository<PropertyDetailsEntity, int>>();
        _mockPropertyTypeRepository = new Mock<IRepository<PropertyTypeMasterEntity, int>>();
        _mockPropertyPhotoRepository = new Mock<IRepository<PropertyPhotoEntity, int>>();
        _mockDocumentBindingRepository = new Mock<IRepository<DocumentBindingEntity, int>>();
        _mockDocumentRepository = new Mock<IRepository<DocumentEntity, int>>();
        _mockWardAllocationRepository = new Mock<IRepository<GlobalSurveyWardAllocationEntity, int>>();
        _mockAssessmentRepository = new Mock<IRepository<PropertyAssessmentEntity, int>>();
        _mockWorkflowStageRepository = new Mock<IRepository<PropertyWorkflowStageMasterEntity, int>>();
        _mockSocietyWingRepository = new Mock<IRepository<SocietyWingDetailsEntity, int>>();
        _mockPropertyWorkflowDetailsRepository = new Mock<IRepository<PropertyWorkflowDetailsEntity, int>>();
        _mockPropertySurveyVisitRepository = new Mock<IRepository<PropertySurveyVisitEntity, int>>();
        _mockPropertyMapDetailRepository = new Mock<IRepository<PropertyMapDetailEntity, int>>();
        _mockWingDetailsRepository = new Mock<IRepository<WingDetailsMastEntity, int>>();
        _mockSocietyDetailsRepository = new Mock<IRepository<SocietyDetailsEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockLogger = new Mock<ILogger<PropertyAmenityService>>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PropertyMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyTypeMasterEntity>().BuildMock());
        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(new List<GlobalSurveyWardAllocationEntity>().BuildMock());
        _mockAssessmentRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());
        _mockWorkflowStageRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyWorkflowStageMasterEntity>().BuildMock());
        _mockSocietyWingRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());
        _mockPropertyWorkflowDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyWorkflowDetailsEntity>().BuildMock());
        _mockPropertySurveyVisitRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertySurveyVisitEntity>().BuildMock());
        _mockPropertyMapDetailRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _mockSocietyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
    }

    private PropertyAmenityService CreateService(bool includeWingRepo = true, bool includeSocietyRepo = true, IRepository<BHKMasterEntity, int>? bhkMasterRepository = null)
    {
        return new PropertyAmenityService(
            _mockPropertyRepository.Object,
            _mockPropertyDetailsRepository.Object,
            _mockPropertyTypeRepository.Object,
            _mockPropertyPhotoRepository.Object,
            _mockDocumentBindingRepository.Object,
            _mockDocumentRepository.Object,
            _mockWardAllocationRepository.Object,
            _mockAssessmentRepository.Object,
            _mockWorkflowStageRepository.Object,
            _mockSocietyWingRepository.Object,
            _mockPropertyWorkflowDetailsRepository.Object,
            _mockPropertySurveyVisitRepository.Object,
            _mockPropertyMapDetailRepository.Object,
            bhkMasterRepository ?? new Mock<IRepository<BHKMasterEntity, int>>().Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockLogger.Object,
            includeWingRepo ? _mockWingDetailsRepository.Object : null,
            includeSocietyRepo ? _mockSocietyDetailsRepository.Object : null);
    }

    #region GetAllAmenitiesAsync Tests

    [Fact]
    public async Task GetAllAmenitiesAsync_WardNotAllocated_ReturnsEmptyPagedResult()
    {
        // Arrange
        var request = new AmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PageNumber = 1,
            PageSize = 10
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>().BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var service = CreateService();

        // Act
        var result = await service.GetAllAmenitiesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.TotalCount);
        Assert.Empty(result.Items);
    }

    [Fact]
    public async Task GetAllAmenitiesAsync_WardAllocated_ReturnsMatchingAmenities()
    {
        // Arrange
        var request = new AmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PageNumber = 1,
            PageSize = 10
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 100, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-001", PartitionNo = "AM1", IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var propertyDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1000, PropertyId = 100, FloorId = 1, CarpetAreaSqMeter = 50.555, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(propertyDetails);

        var photos = new List<PropertyPhotoEntity>().BuildMock();
        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(photos);

        var bindings = new List<DocumentBindingEntity>().BuildMock();
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(bindings);

        var documents = new List<DocumentEntity>().BuildMock();
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(documents);

        var workflowDetails = new List<PropertyWorkflowDetailsEntity>().BuildMock();
        _mockPropertyWorkflowDetailsRepository.Setup(r => r.GetQueryable()).Returns(workflowDetails);

        var visits = new List<PropertySurveyVisitEntity>().BuildMock();
        _mockPropertySurveyVisitRepository.Setup(r => r.GetQueryable()).Returns(visits);

        var mapDetails = new List<PropertyMapDetailEntity>().BuildMock();
        _mockPropertyMapDetailRepository.Setup(r => r.GetQueryable()).Returns(mapDetails);

        var service = CreateService();

        // Act
        var result = await service.GetAllAmenitiesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);

        var item = result.Items.First();
        Assert.Equal(100, item.Id);
        Assert.Equal(1000, item.PropertyDetailsId);
        Assert.Equal("P-001", item.PropertyNo);
        Assert.Equal("AM1", item.PartitionNo);
        Assert.Equal(50.56, item.CarpetAreaSqMeter);
        Assert.False(item.IsVerified);
        Assert.False(item.IsMerged);
    }

    [Fact]
    public async Task GetAllAmenitiesAsync_WithPagination_AppliesPageSizeAndPageNumber()
    {
        // Arrange
        var request = new AmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PageNumber = 2,
            PageSize = 1
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 100, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-001", PartitionNo = "AM1", IsActive = true, MarkedForDeletion = false },
            new() { Id = 101, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-002", PartitionNo = "AM2", IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var propertyDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1000, PropertyId = 100, IsActive = true, MarkedForDeletion = false },
            new() { Id = 1001, PropertyId = 101, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(propertyDetails);

        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());
        _mockPropertyWorkflowDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyWorkflowDetailsEntity>().BuildMock());
        _mockPropertySurveyVisitRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertySurveyVisitEntity>().BuildMock());
        _mockPropertyMapDetailRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetAllAmenitiesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal(101, result.Items.First().Id);
    }

    [Fact]
    public async Task GetAllAmenitiesAsync_WithPropertyNoAndPartitionNoFilter_FiltersResults()
    {
        // Arrange
        var request = new AmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-001",
            PartitionNo = "AM1",
            PageNumber = 1,
            PageSize = 10
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 100, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-001", PartitionNo = "AM1", IsActive = true, MarkedForDeletion = false },
            new() { Id = 101, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-002", PartitionNo = "AM2", IsActive = true, MarkedForDeletion = false }
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(BuildLikeSupportedMock(properties));

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var propertyDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1000, PropertyId = 100, IsActive = true, MarkedForDeletion = false },
            new() { Id = 1001, PropertyId = 101, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(propertyDetails);

        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());
        _mockPropertyWorkflowDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyWorkflowDetailsEntity>().BuildMock());
        _mockPropertySurveyVisitRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertySurveyVisitEntity>().BuildMock());
        _mockPropertyMapDetailRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetAllAmenitiesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal(100, result.Items.First().Id);
    }

    [Fact]
    public async Task GetAllAmenitiesAsync_WithVerifiedAndMergedData_SetsVerifiedAndMergedFlagsTrue()
    {
        // Arrange
        var request = new AmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PageNumber = 1,
            PageSize = 10
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 100, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-001", PartitionNo = "AM1", IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var propertyDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1000, PropertyId = 100, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(propertyDetails);

        var photos = new List<PropertyPhotoEntity>
        {
            new PropertyPhotoEntity(propertyId: 100, photoTypeId: 1, documentBindingId: 10, markedForDeletion: false) { Id = 1, IsActive = true }
        }.BuildMock();
        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(photos);

        var bindings = new List<DocumentBindingEntity>
        {
            new() { Id = 10, DocumentId = 20, IsActive = true, MarkedForDeletion = false, IsReferenceValid = true }
        }.BuildMock();
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(bindings);

        var documents = new List<DocumentEntity>
        {
            new() { Id = 20, DocumentType = "PhotoDoc", DocumentGuid = Guid.NewGuid(), IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(documents);

        var workflowDetails = new List<PropertyWorkflowDetailsEntity>
        {
            new() { Id = 50, PropertyId = 100, IsActive = true }
        }.BuildMock();
        _mockPropertyWorkflowDetailsRepository.Setup(r => r.GetQueryable()).Returns(workflowDetails);

        var visits = new List<PropertySurveyVisitEntity>
        {
            new() { Id = 500, PropertyWorkflowDetailsId = 50, InternalSurveyVerified = true, IsActive = true }
        }.BuildMock();
        _mockPropertySurveyVisitRepository.Setup(r => r.GetQueryable()).Returns(visits);

        var mapDetails = new List<PropertyMapDetailEntity>
        {
            new() { Id = 70, PropertyIdNew = 100, IsActive = true, Status = "ACTIVE" }
        }.BuildMock();
        _mockPropertyMapDetailRepository.Setup(r => r.GetQueryable()).Returns(mapDetails);

        var service = CreateService();

        // Act
        var result = await service.GetAllAmenitiesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Items);
        var item = result.Items.First();
        Assert.True(item.IsVerified);
        Assert.True(item.IsMerged);
        Assert.Equal("PhotoDoc", item.DocumentType);
        Assert.Equal(10, item.DocumentBindingId);
    }

    [Fact]
    public async Task GetAllAmenitiesAsync_PageSizeMinusOne_ReturnsAllItemsWithoutPagination()
    {
        // Arrange
        var request = new AmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PageNumber = 1,
            PageSize = -1
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 100, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-001", PartitionNo = "AM1", IsActive = true, MarkedForDeletion = false },
            new() { Id = 101, WardId = 10, PropertyTypeId = 5, PropertyNo = "P-002", PartitionNo = "AM2", IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var propertyDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1000, PropertyId = 100, IsActive = true, MarkedForDeletion = false },
            new() { Id = 1001, PropertyId = 101, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(propertyDetails);

        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());
        _mockPropertyWorkflowDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyWorkflowDetailsEntity>().BuildMock());
        _mockPropertySurveyVisitRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertySurveyVisitEntity>().BuildMock());
        _mockPropertyMapDetailRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetAllAmenitiesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count());
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_PropertyNotFound_ReturnsFalse()
    {
        // Arrange
        var propertyDetails = new List<PropertyDetailsEntity>().BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(propertyDetails);

        _mockPropertyRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertyEntity?)null);

        var service = CreateService();

        // Act
        var result = await service.DeleteAsync(999);

        // Assert
        Assert.False(result);
        _mockPropertyRepository.Verify(r => r.DeleteAsync(It.IsAny<PropertyEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_PropertyFound_DeletesPropertyAndDetails_ReturnsTrue()
    {
        // Arrange
        int propertyId = 10;
        var existingDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = propertyId, IsActive = true, MarkedForDeletion = false },
            new() { Id = 2, PropertyId = propertyId, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(existingDetails);

        var propertyEntity = new PropertyEntity { Id = propertyId, IsActive = true, MarkedForDeletion = false };
        _mockPropertyRepository.Setup(r => r.GetByIdAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(propertyEntity);

        var service = CreateService();

        // Act
        var result = await service.DeleteAsync(propertyId);

        // Assert
        Assert.True(result);
        _mockPropertyDetailsRepository.Verify(r => r.DeleteAsync(It.IsAny<PropertyDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _mockPropertyRepository.Verify(r => r.DeleteAsync(propertyEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region UpdateAmenityAsync Tests

    [Fact]
    public async Task UpdateAmenityAsync_PropertyNotFound_ReturnsErrorResponse()
    {
        // Arrange
        var properties = new List<PropertyEntity>().BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var service = CreateService();
        var dto = new UpdateAmenityDto();

        // Act
        var response = await service.UpdateAmenityAsync(99, dto);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Equal("Property not found.", response.Message);
    }

    [Fact]
    public async Task UpdateAmenityAsync_InvalidWorkflowStageId_RollsBackAndReturnsError()
    {
        // Arrange
        int propertyId = 1;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 5,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };

        var properties = new List<PropertyEntity> { property }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        // Setup property type as Amenity for validation
        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = property.PropertyTypeId ?? 0, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var details = new List<PropertyDetailsEntity>().BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(details);

        var workflowStages = new List<PropertyWorkflowStageMasterEntity>().BuildMock();
        _mockWorkflowStageRepository.Setup(r => r.GetQueryable()).Returns(workflowStages);

        var dto = new UpdateAmenityDto
        {
            WorkflowStageId = 999
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Equal("Invalid WorkflowStageId.", response.Message);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_UnknownBHKId_ReturnsErrorAndRollsBack()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());

        var mockBhkRepository = new Mock<IRepository<BHKMasterEntity, int>>();
        mockBhkRepository.Setup(r => r.GetQueryable()).Returns(new List<BHKMasterEntity>().BuildMock());

        var service = CreateService(bhkMasterRepository: mockBhkRepository.Object);

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, new UpdateAmenityDto { BHKId = 999 });

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Equal("Invalid BHKId.", response.Message);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_InactiveBHKId_ReturnsErrorAndRollsBack()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());

        var mockBhkRepository = new Mock<IRepository<BHKMasterEntity, int>>();
        mockBhkRepository.Setup(r => r.GetQueryable()).Returns(
            new List<BHKMasterEntity> { new() { Id = 3, BHKCode = "OLD", BHKName = "Retired", IsActive = false } }.BuildMock());

        var service = CreateService(bhkMasterRepository: mockBhkRepository.Object);

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, new UpdateAmenityDto { BHKId = 3 });

        // Assert
        Assert.False(response.Success);
        Assert.Equal("Invalid BHKId.", response.Message);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_ValidInput_UpdatesEntitiesAndCommitsTransaction()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };

        var properties = new List<PropertyEntity> { property }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        // Setup property type as Amenity for validation
        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        var propertyDetailsEntity = new PropertyDetailsEntity
        {
            Id = 100,
            PropertyId = propertyId,
            IsActive = true,
            MarkedForDeletion = false
        };

        var details = new List<PropertyDetailsEntity> { propertyDetailsEntity }.BuildMock();
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(details);

        var assessment = new PropertyAssessmentEntity
        {
            Id = 50,
            PropertyId = propertyId,
            BHKId = 1,
            IsActive = true,
            MarkedForDeletion = false
        };

        var assessments = new List<PropertyAssessmentEntity> { assessment }.BuildMock();
        _mockAssessmentRepository.Setup(r => r.GetQueryable()).Returns(assessments);

        var workflowStages = new List<PropertyWorkflowStageMasterEntity>
        {
            new() { Id = 5, IsActive = true }
        }.BuildMock();
        _mockWorkflowStageRepository.Setup(r => r.GetQueryable()).Returns(workflowStages);

        var societyWings = new List<SocietyWingDetailsEntity>
        {
            new() { Id = 1, PropertyId = propertyId, NoOfFlat = 10, NoOfShop = 2, IsActive = true }
        }.BuildMock();
        _mockSocietyWingRepository.Setup(r => r.GetQueryable()).Returns(societyWings);

        // Setup requested PropertyTypeId as a valid amenity type
        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var dto = new UpdateAmenityDto
        {
            TaxZoneId = 3,
            PropertyTypeId = 2,
            PartitionNo = "AM2",
            CategoryId = 1,
            OpenPlot = false,
            PropertySeqNo = 123,
            UpdatedBy = 77,
            BHKId = 2,
            WorkflowStageId = 5,
            PropertyFloorId = 4
        };

        var bhkMasters = new List<BHKMasterEntity>
        {
            new() { Id = 2, BHKCode = "2BHK", BHKName = "2 BHK", IsActive = true }
        }.BuildMock();
        var mockBhkRepository = new Mock<IRepository<BHKMasterEntity, int>>();
        mockBhkRepository.Setup(r => r.GetQueryable()).Returns(bhkMasters);

        var service = CreateService(bhkMasterRepository: mockBhkRepository.Object);

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal("Amenity updated successfully.", response.Message);
        Assert.NotNull(response.Items);
        Assert.Equal(3, property.TaxZoneId);
        Assert.Equal(2, property.PropertyTypeId);
        Assert.Equal("AM2", property.PartitionNo);
        Assert.Equal(123, property.PropertySeqNo);
        Assert.Equal(2, assessment.BHKId);
        Assert.Single(property.WorkflowHistory);
        Assert.Equal(5, property.WorkflowHistory.First().WorkflowStageId);

        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_ExceptionOccurs_RollsBackTransactionAndRethrows()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 5,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };

        var properties = new List<PropertyEntity> { property }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateAmenityAsync(propertyId, new UpdateAmenityDto()));
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_PropertyDetailsNull_UpdatesPropertySuccessfully()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 5,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };

        var properties = new List<PropertyEntity> { property }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _mockAssessmentRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());
        _mockWorkflowStageRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyWorkflowStageMasterEntity>().BuildMock());
        _mockSocietyWingRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());

        // Setup property type as Amenity for validation
        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = property.PropertyTypeId ?? 0, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        var dto = new UpdateAmenityDto
        {
            TaxZoneId = 5,
            PartitionNo = "AM5"
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal(5, property.TaxZoneId);
        Assert.Equal("AM5", property.PartitionNo);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_PhotoWithInvalidBindingOrDeletedDoc_PicksEarlierValidPhoto()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };

        var properties = new List<PropertyEntity> { property }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        var validGuid = Guid.NewGuid();
        var photos = new List<PropertyPhotoEntity>
        {
            // Earlier photo with valid binding and valid document
            new PropertyPhotoEntity(propertyId: propertyId, photoTypeId: 1, documentBindingId: 101, markedForDeletion: false) { Id = 1, IsActive = true },
            // Later photo (higher ID) with invalid binding / deleted document
            new PropertyPhotoEntity(propertyId: propertyId, photoTypeId: 1, documentBindingId: 102, markedForDeletion: false) { Id = 2, IsActive = true }
        }.BuildMock();
        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(photos);

        var bindings = new List<DocumentBindingEntity>
        {
            new() { Id = 101, DocumentId = 201, IsActive = true, MarkedForDeletion = false, IsReferenceValid = true },
            new() { Id = 102, DocumentId = 202, IsActive = false, MarkedForDeletion = true, IsReferenceValid = false }
        }.BuildMock();
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(bindings);

        var documents = new List<DocumentEntity>
        {
            new() { Id = 201, DocumentType = "ValidPhotoType", DocumentGuid = validGuid, IsActive = true, MarkedForDeletion = false },
            new() { Id = 202, DocumentType = "InvalidPhotoType", DocumentGuid = Guid.NewGuid(), IsActive = false, MarkedForDeletion = true }
        }.BuildMock();
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(documents);

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, new UpdateAmenityDto());

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(101, response.Items.DocumentBindingId);
        Assert.Equal("ValidPhotoType", response.Items.DocumentType);
        Assert.Equal(validGuid, response.Items.DocumentGuid);
    }

    [Fact]
    public async Task UpdateAmenityAsync_AllPhotosHaveInvalidBindings_ReturnsNullDocumentMetadata()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };

        var properties = new List<PropertyEntity> { property }.BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        var photos = new List<PropertyPhotoEntity>
        {
            new PropertyPhotoEntity(propertyId: propertyId, photoTypeId: 1, documentBindingId: 101, markedForDeletion: false) { Id = 1, IsActive = true }
        }.BuildMock();
        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable()).Returns(photos);

        var bindings = new List<DocumentBindingEntity>
        {
            new() { Id = 101, DocumentId = 201, IsActive = true, MarkedForDeletion = false, IsReferenceValid = false } // Invalid reference
        }.BuildMock();
        _mockDocumentBindingRepository.Setup(r => r.GetQueryable()).Returns(bindings);

        var documents = new List<DocumentEntity>
        {
            new() { Id = 201, DocumentType = "SomePhotoType", DocumentGuid = Guid.NewGuid(), IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockDocumentRepository.Setup(r => r.GetQueryable()).Returns(documents);

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, new UpdateAmenityDto());

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Null(response.Items.DocumentBindingId);
        Assert.Null(response.Items.DocumentType);
        Assert.Null(response.Items.DocumentGuid);
    }

    [Fact]
    public async Task UpdateAmenityAsync_InvalidSocietyDetailId_RollsBackAndReturnsError()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        // Society 999 does not exist in master repository
        _mockSocietyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());

        var dto = new UpdateAmenityDto
        {
            SocietyDetailId = 999
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Contains("Invalid SocietyDetailId", response.Message);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_InvalidWingDetailId_RollsBackAndReturnsError()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        // Wing 888 does not exist in WingDetailsMast
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());

        var dto = new UpdateAmenityDto
        {
            WingDetailId = 888
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Contains("Invalid WingDetailId", response.Message);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_WingBelongsToDifferentSociety_RollsBackAndReturnsError()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        // Existing society for property is 10
        var societyWings = new List<SocietyWingDetailsEntity>
        {
            new() { Id = 1, PropertyId = propertyId, SocietyDetailId = 10, IsActive = true }
        }.BuildMock();
        _mockSocietyWingRepository.Setup(r => r.GetQueryable()).Returns(societyWings);

        // Wing 50 exists but belongs to Society 20 (not 10!)
        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 50, SocietyDetailsMastId = 20, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(wings);

        var dto = new UpdateAmenityDto
        {
            WingDetailId = 50
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Contains("does not belong to Society", response.Message);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_ValidSocietyAndWing_SuccessfullyUpdatesAndPersists()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        // Society 10 exists
        var societies = new List<SocietyDetailsEntity>
        {
            new() { Id = 10, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockSocietyDetailsRepository.Setup(r => r.GetQueryable()).Returns(societies);

        // Wing 50 belongs to Society 10
        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 50, SocietyDetailsMastId = 10, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(wings);

        var existingSocietyWing = new SocietyWingDetailsEntity
        {
            Id = 1,
            PropertyId = propertyId,
            SocietyDetailId = 10,
            IsActive = true
        };
        _mockSocietyWingRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyWingDetailsEntity> { existingSocietyWing }.BuildMock());

        var dto = new UpdateAmenityDto
        {
            SocietyDetailId = 10,
            WingDetailId = 50,
            NoOfFlat = 12
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal(50, property.WingDetailId);
        Assert.Equal(10, existingSocietyWing.SocietyDetailId);
        Assert.Equal(50, existingSocietyWing.WingDetailsMastId);
        Assert.Equal(12, existingSocietyWing.NoOfFlat);
        _mockSocietyWingRepository.Verify(r => r.UpdateAsync(existingSocietyWing, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_NoExistingSocietyWing_CreatesNewSocietyWingRow()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        var societies = new List<SocietyDetailsEntity>
        {
            new() { Id = 10, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockSocietyDetailsRepository.Setup(r => r.GetQueryable()).Returns(societies);

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 50, SocietyDetailsMastId = 10, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(wings);

        // No existing SocietyWingDetails rows
        _mockSocietyWingRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyWingDetailsEntity>().BuildMock());

        var dto = new UpdateAmenityDto
        {
            SocietyDetailId = 10,
            WingDetailId = 50,
            NoOfFlat = 15
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        _mockSocietyWingRepository.Verify(r => r.AddAsync(It.Is<SocietyWingDetailsEntity>(sw =>
            sw.PropertyId == propertyId &&
            sw.SocietyDetailId == 10 &&
            sw.WingDetailsMastId == 50 &&
            sw.NoOfFlat == 15), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAmenityAsync_ClearWing_ClearsWingAcrossAllActiveDuplicateSocietyWingsAndProperty()
    {
        // Arrange
        int propertyId = 10;
        var property = new PropertyEntity
        {
            Id = propertyId,
            PropertyTypeId = 2,
            WingDetailId = 50,
            IsActive = true,
            MarkedForDeletion = false,
            WorkflowHistory = new List<PropertyWorkflowDetailsEntity>()
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity> { property }.BuildMock());

        var amenityType = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 2, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(amenityType);

        var swRow1 = new SocietyWingDetailsEntity { Id = 1, PropertyId = propertyId, WingDetailsMastId = 50, IsActive = true };
        var swRow2 = new SocietyWingDetailsEntity { Id = 2, PropertyId = propertyId, WingDetailsMastId = 50, IsActive = true };
        _mockSocietyWingRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyWingDetailsEntity> { swRow1, swRow2 }.BuildMock());

        var dto = new UpdateAmenityDto
        {
            WingDetailId = 0 // Clear Wing
        };

        var service = CreateService();

        // Act
        var response = await service.UpdateAmenityAsync(propertyId, dto);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Null(property.WingDetailId);
        Assert.Null(swRow1.WingDetailsMastId);
        Assert.Null(swRow2.WingDetailsMastId);
        _mockSocietyWingRepository.Verify(r => r.UpdateAsync(It.Is<SocietyWingDetailsEntity>(sw => sw.WingDetailsMastId == null), It.IsAny<CancellationToken>()), Times.AtLeast(2));
    }

    #endregion

    #region GetMaxPropertyAmenityAsync Tests

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_WardNotAllocated_ReturnsErrorResponse()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-100"
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>().BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var service = CreateService();

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Equal("Given ward is not allocated to this user.", response.Message);
        Assert.NotNull(response.Items);
    }

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_WingRepositoryNull_ReturnsErrorResponse()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-100",
            WingDetailsId = 5
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        // Service created without wing repository (includeWingRepo = false)
        var service = CreateService(includeWingRepo: false);

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Equal("Wing repository is not available.", response.Message);
        Assert.Null(response.Items);
    }

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_WingDetailsIdInvalid_ReturnsErrorResponse()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-100",
            WingDetailsId = 5
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var wings = new List<WingDetailsMastEntity>().BuildMock();
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(wings);

        var service = CreateService();

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.False(response.Success);
        Assert.Equal("WingDetailsId is Invalid.", response.Message);
    }

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_NoAmenityPartitionsFound_MainProperty_ReturnsDefaultStarting1()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-100"
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var properties = new List<PropertyEntity>().BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var propertyTypes = new List<PropertyTypeMasterEntity>().BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var service = CreateService();

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal("No amenity partitions found. Starting with AM1.", response.Message);
        Assert.NotNull(response.Items);
        Assert.Equal("AM", response.Items.Prefix);
        Assert.Equal(0, response.Items.LastPartitionNumber);
        Assert.Null(response.Items.LastAmenityPartition);
        Assert.Equal(1, response.Items.NextPartitionNumber);
        Assert.Equal("AM1", response.Items.NextAmenityPartition);
    }

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_NoAmenityPartitionsFound_WingProperty_ReturnsDefaultStartingAM1()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-100",
            WingDetailsId = 2
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 2, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(wings);

        var properties = new List<PropertyEntity>().BuildMock();
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(properties);

        var propertyTypes = new List<PropertyTypeMasterEntity>().BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var service = CreateService();

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal("No amenity partitions found. Starting with AM1.", response.Message);
        Assert.NotNull(response.Items);
        Assert.Equal("AM", response.Items.Prefix);
        Assert.Equal(0, response.Items.LastPartitionNumber);
        Assert.Null(response.Items.LastAmenityPartition);
        Assert.Equal(1, response.Items.NextPartitionNumber);
        Assert.Equal("AM1", response.Items.NextAmenityPartition);
    }

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_MainProperty_PartitionsFound_CalculatesNextPartitionNumber()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-100"
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = 10, PropertyNo = "P-100", PropertyTypeId = 5, PartitionNo = "AM1", IsActive = true, MarkedForDeletion = false },
            new() { Id = 2, WardId = 10, PropertyNo = "P-100", PropertyTypeId = 5, PartitionNo = "AM2", IsActive = true, MarkedForDeletion = false }
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(BuildLikeSupportedMock(properties));

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, PropertyDescription = "अॅमिनीटी", IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var service = CreateService();

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal("Max amenity partition fetched successfully.", response.Message);
        Assert.NotNull(response.Items);
        Assert.Equal(2, response.Items.PropertyId);
        Assert.Equal("AM", response.Items.Prefix);
        Assert.Equal(2, response.Items.LastPartitionNumber);
        Assert.Equal("AM2", response.Items.LastAmenityPartition);
        Assert.Equal(3, response.Items.NextPartitionNumber);
        Assert.Equal("AM3", response.Items.NextAmenityPartition);
    }

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_WithValidWingDetailsId_AppliesWingFilter()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "P-100",
            WingDetailsId = 2
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 2, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(wings);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, WardId = 10, PropertyNo = "P-100", WingDetailId = 2, PropertyTypeId = 5, PartitionNo = "AM10", IsActive = true, MarkedForDeletion = false },
            new() { Id = 2, WardId = 10, PropertyNo = "P-100", WingDetailId = 3, PropertyTypeId = 5, PartitionNo = "AM20", IsActive = true, MarkedForDeletion = false }
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(BuildLikeSupportedMock(properties));

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, PropertyDescription = "अॅमिनीटी", IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var service = CreateService();

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(1, response.Items.PropertyId);
        Assert.Equal(10, response.Items.LastPartitionNumber);
        Assert.Equal("AM10", response.Items.LastAmenityPartition);
        Assert.Equal(11, response.Items.NextPartitionNumber);
        Assert.Equal("AM11", response.Items.NextAmenityPartition);
    }

    [Fact]
    public async Task GetMaxPropertyAmenityAsync_WithWingPrefixedPartitions_ReturnsCorrectNextPartition()
    {
        // Arrange
        var request = new MaxPropertyAmenityQueryParameters
        {
            UserId = 1,
            WardId = 10,
            PropertyNo = "186",
            WingDetailsId = 1524008
        };

        var wardAllocations = new List<GlobalSurveyWardAllocationEntity>
        {
            new() { UserId = 1, WardId = 10, IsActive = true }
        }.BuildMock();
        _mockWardAllocationRepository.Setup(r => r.GetQueryable()).Returns(wardAllocations);

        var wings = new List<WingDetailsMastEntity>
        {
            new() { Id = 1524008, IsActive = true, MarkedForDeletion = false }
        }.BuildMock();
        _mockWingDetailsRepository.Setup(r => r.GetQueryable()).Returns(wings);

        var properties = new List<PropertyEntity>
        {
            new() { Id = 2243482, WardId = 10, PropertyNo = "186", WingDetailId = 1524008, PropertyTypeId = 5, PartitionNo = "B-AM1", IsActive = true, MarkedForDeletion = false }
        };
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(BuildLikeSupportedMock(properties));

        var propertyTypes = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 5, PartType = PartTypeConstants.Amenity, Type = PartTypeConstants.Residential, PropertyDescription = "अॅमिनीटी", IsActive = true }
        }.BuildMock();
        _mockPropertyTypeRepository.Setup(r => r.GetQueryable()).Returns(propertyTypes);

        var service = CreateService();

        // Act
        var response = await service.GetMaxPropertyAmenityAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(2243482, response.Items.PropertyId);
        Assert.Equal("B-AM", response.Items.Prefix);
        Assert.Equal(1, response.Items.LastPartitionNumber);
        Assert.Equal("B-AM1", response.Items.LastAmenityPartition);
        Assert.Equal(2, response.Items.NextPartitionNumber);
        Assert.Equal("B-AM2", response.Items.NextAmenityPartition);
    }

    #endregion
}
