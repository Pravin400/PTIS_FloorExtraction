using System.Linq.Expressions;
using System.Reflection;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using System.ComponentModel.DataAnnotations;
using Xunit;
using MockQueryable;
using MockQueryable.Moq;
using NtisPlatform.Application.DTOs.Master.SocietyWingDetails;
using NtisPlatform.Application.Models;
using ValidationResult = NtisPlatform.Application.Models.ValidationResult;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Comprehensive tests for SocietyWingDetailsService 
/// Coverage: Service layer CRUD operations, validation, transactional behavior, and DTO validation
/// </summary>
public class SocietyWingDetailsServiceTests
{
    private static bool SqlLike(string? match, string? pattern)
    {
        if (match == null || pattern == null) return false;
        var regexPattern = "^" + System.Text.RegularExpressions.Regex.Escape(pattern)
            .Replace("%", ".*")
            .Replace("_", ".")
            .Replace(@"\[", "[")
            .Replace(@"\]", "]")
            .Replace(@"\^", "^") + "$";
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
            private static readonly MethodInfo SqlLikeMethod = typeof(SocietyWingDetailsServiceTests).GetMethod(nameof(SqlLike), BindingFlags.NonPublic | BindingFlags.Static)!;

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

    private readonly Mock<IRepository<SocietyWingDetailsEntity, int>> _mockRepository;
    private readonly Mock<IRepository<SocietyDetailsEntity, int>> _mockSocietyDetailsRepo;
    private readonly Mock<IRepository<PropertyEntity, int>> _mockPropertyRepo;
    private readonly Mock<IRepository<WingEntity, int>> _mockWingRepo;
    private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _mockAssessmentRepo;
    private readonly Mock<IRepository<PropertyPhotoEntity, int>> _mockPropertyPhotoRepo;
    private readonly Mock<IRepository<DocumentBindingEntity, int>> _mockDocumentBindingRepo;
    private readonly Mock<IRepository<DocumentEntity, int>> _mockDocumentRepo;
    private readonly Mock<IRepository<PropertyMapDetailEntity, int>> _mockPropertyMapDetailRepo;
    private readonly Mock<IRepository<PropertyMastOldEntity, int>> _mockPropertyMastOldRepo;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly SocietyWingDetailsService _service;

    public SocietyWingDetailsServiceTests()
    {
        _mockRepository = new Mock<IRepository<SocietyWingDetailsEntity, int>>();
        _mockSocietyDetailsRepo = new Mock<IRepository<SocietyDetailsEntity, int>>();
        _mockPropertyRepo = new Mock<IRepository<PropertyEntity, int>>();
        _mockWingRepo = new Mock<IRepository<WingEntity, int>>();
        _mockAssessmentRepo = new Mock<IRepository<PropertyAssessmentEntity, int>>();
        _mockPropertyPhotoRepo = new Mock<IRepository<PropertyPhotoEntity, int>>();
        _mockDocumentBindingRepo = new Mock<IRepository<DocumentBindingEntity, int>>();
        _mockDocumentRepo = new Mock<IRepository<DocumentEntity, int>>();
        _mockPropertyMapDetailRepo = new Mock<IRepository<PropertyMapDetailEntity, int>>();
        _mockPropertyMastOldRepo = new Mock<IRepository<PropertyMastOldEntity, int>>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockUnitOfWork
            .Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockUnitOfWork
            .Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockUnitOfWork
            .Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _service = new SocietyWingDetailsService(
            _mockRepository.Object,
            _mockPropertyRepo.Object,
            _mockWingRepo.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockReferenceValidator.Object,
            _mockSocietyDetailsRepo.Object,
            null,
            _mockAssessmentRepo.Object,
            _mockPropertyPhotoRepo.Object,
            _mockDocumentBindingRepo.Object,
            _mockDocumentRepo.Object,
            _mockPropertyMapDetailRepo.Object,
            _mockPropertyMastOldRepo.Object);
    }

    #region Create Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateSocietyWingDetailsDto
        {
            WingId = 1,
            PropertyId = 100,
            NewWingName = "A Wing",
            FromFloor = "1",
            ToFloor = "5",
            NoOfFlat = 10,
            NoOfShop = 2,
            CreatedBy = 1
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        var societyData = new List<SocietyDetailsEntity>();
        _mockSocietyDetailsRepo.Setup(r => r.GetQueryable())
            .Returns(societyData.BuildMock());

        var entity = new SocietyWingDetailsEntity
        {
            Id = 1,
            WingId = 1,
            PropertyId = 100,
            NewWingName = "A Wing",
            FromFloor = "1",
            ToFloor = "5",
            NoOfFlat = 10,
            NoOfShop = 2,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<SocietyWingDetailsEntity>(It.IsAny<CreateSocietyWingDetailsDto>())).Returns(entity);
        _mockMapper.Setup(m => m.Map<SocietyDetailsEntity>(It.IsAny<CreateSocietyWingDetailsDto>())).Returns(new SocietyDetailsEntity());
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<SocietyWingDetailsEntity>(), It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockSocietyDetailsRepo.Setup(r => r.AddAsync(It.IsAny<SocietyDetailsEntity>(), It.IsAny<CancellationToken>())).ReturnsAsync(new SocietyDetailsEntity());
        _mockMapper.Setup(m => m.Map<SocietyWingDetailsDto>(It.IsAny<SocietyWingDetailsEntity>())).Returns(new SocietyWingDetailsDto
        {
            Id = 1,
            WingId = 1,
            PropertyId = 100,
            NewWingName = "A Wing"
        });

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100, result.PropertyId);
        Assert.Equal("A Wing", result.NewWingName);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<SocietyWingDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_InvalidPropertyId_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateSocietyWingDetailsDto
        {
            WingId = 1,
            PropertyId = 999,
            NewWingName = "A Wing"
        };

        var propertyData = new List<PropertyEntity>();
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("PropertyId", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_InvalidWingId_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateSocietyWingDetailsDto
        {
            WingId = 999,
            PropertyId = 100,
            NewWingName = "A Wing"
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>();
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("WingId", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_FromFloorGreaterThanToFloor_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateSocietyWingDetailsDto
        {
            WingId = 1,
            PropertyId = 100,
            FromFloor = "10",
            ToFloor = "5",
            NewWingName = "A Wing"
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        var societyData = new List<SocietyDetailsEntity>();
        _mockSocietyDetailsRepo.Setup(r => r.GetQueryable())
            .Returns(societyData.BuildMock());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("FromFloor cannot be greater than ToFloor", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_NonNumericFloors_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateSocietyWingDetailsDto
        {
            WingId = 1,
            PropertyId = 100,
            FromFloor = "abc",
            ToFloor = "xyz",
            NewWingName = "A Wing"
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        var societyData = new List<SocietyDetailsEntity>();
        _mockSocietyDetailsRepo.Setup(r => r.GetQueryable())
            .Returns(societyData.BuildMock());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("valid numeric values", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_DuplicateWingDetails_ThrowsValidationException()
    {
        // Arrange
        var createDto = new CreateSocietyWingDetailsDto
        {
            WingId = 1,
            PropertyId = 100,
            NewWingName = "A Wing"
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        // Duplicate exists
        var societyData = new List<SocietyDetailsEntity>
        {
            new SocietyDetailsEntity { PropertyId = 100, IsActive = true }
        };
        _mockSocietyDetailsRepo.Setup(r => r.GetQueryable())
            .Returns(societyData.BuildMock());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("already exists", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_TransactionRollsBackOnFailure()
    {
        // Arrange
        var createDto = new CreateSocietyWingDetailsDto
        {
            WingId = 1,
            PropertyId = 100,
            NewWingName = "A Wing"
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        var societyData = new List<SocietyDetailsEntity>();
        _mockSocietyDetailsRepo.Setup(r => r.GetQueryable())
            .Returns(societyData.BuildMock());

        _mockMapper.Setup(m => m.Map<SocietyWingDetailsEntity>(It.IsAny<CreateSocietyWingDetailsDto>()))
            .Returns(new SocietyWingDetailsEntity());
        _mockMapper.Setup(m => m.Map<SocietyDetailsEntity>(It.IsAny<CreateSocietyWingDetailsDto>()))
            .Returns(new SocietyDetailsEntity());
        _mockSocietyDetailsRepo.Setup(r => r.AddAsync(It.IsAny<SocietyDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SocietyDetailsEntity());

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<SocietyWingDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("DB error"));

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(
            () => _service.CreateAsync(createDto, CancellationToken.None));

        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Update Tests

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateSocietyWingDetailsDto
        {
            NewWingName = "Updated Wing",
            FromFloor = "1",
            ToFloor = "10",
            UpdatedBy = 2
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        var societyData = new List<SocietyDetailsEntity>
        {
            new SocietyDetailsEntity { Id = 5, PropertyId = 100, IsActive = true }
        };
        _mockSocietyDetailsRepo.Setup(r => r.GetQueryable())
            .Returns(societyData.BuildMock());

        var entity = new SocietyWingDetailsEntity
        {
            Id = 1,
            SocietyDetailId = 5,
            WingId = 1,
            PropertyId = 100,
            NewWingName = "Original Wing",
            IsActive = true
        };
        var wingQueryData = new List<SocietyWingDetailsEntity> { entity };
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(wingQueryData.BuildMock());

        var existingSocietyDetails = new SocietyDetailsEntity { Id = 5, PropertyId = 100, IsActive = true };
        _mockSocietyDetailsRepo.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingSocietyDetails);

        _mockMapper.Setup(m => m.Map(It.IsAny<UpdateSocietyWingDetailsDto>(), It.IsAny<SocietyWingDetailsEntity>()));
        _mockMapper.Setup(m => m.Map(It.IsAny<UpdateSocietyWingDetailsDto>(), It.IsAny<SocietyDetailsEntity>()));
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<SocietyWingDetailsEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockSocietyDetailsRepo.Setup(r => r.UpdateAsync(It.IsAny<SocietyDetailsEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockMapper.Setup(m => m.Map<SocietyWingDetailsDto>(It.IsAny<SocietyWingDetailsEntity>())).Returns(new SocietyWingDetailsDto
        {
            Id = 1,
            WingId = 1,
            PropertyId = 100,
            NewWingName = "Updated Wing"
        });

        // Act
        var result = await _service.UpdateAsync(5, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Wing", result.NewWingName);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<SocietyWingDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }


    [Fact]
    public async Task UpdateAsync_FromFloorGreaterThanToFloor_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateSocietyWingDetailsDto
        {
            FromFloor = "10",
            ToFloor = "3"
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.UpdateAsync(5, updateDto, CancellationToken.None));

        Assert.Contains("FromFloor cannot be greater than ToFloor", exception.Message);
    }

    [Fact]
    public async Task UpdateAsync_EntityNotFound_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateSocietyWingDetailsDto
        {
            NewWingName = "Updated Wing"
        };

        var propertyData = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 100, IsActive = true }
        };
        _mockPropertyRepo.Setup(r => r.GetQueryable())
            .Returns(propertyData.BuildMock());

        var wingData = new List<WingEntity>
        {
            new WingEntity { Id = 1, IsActive = true, WingNo = "A" }
        };
        _mockWingRepo.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        var societyData = new List<SocietyDetailsEntity>
        {
            new SocietyDetailsEntity { Id = 5, PropertyId = 100, IsActive = true }
        };
        _mockSocietyDetailsRepo.Setup(r => r.GetQueryable())
            .Returns(societyData.BuildMock());

        // No entity found
        var emptyWingData = new List<SocietyWingDetailsEntity>();
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(emptyWingData.BuildMock());

        // Act
        var result = await _service.UpdateAsync(5, updateDto, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public async Task DeleteAsync_ExistingId_SoftDeletesBothRecords()
    {
        // Arrange
        var entity = new SocietyWingDetailsEntity
        {
            Id = 1,
            SocietyDetailId = 5,
            PropertyId = 100,
            IsActive = true
        };

        var wingData = new List<SocietyWingDetailsEntity> { entity };
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        _mockReferenceValidator
            .Setup(r => r.ValidateReferencesAsync<SocietyWingDetailsEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<SocietyWingDetailsEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var societyDetails = new SocietyDetailsEntity { Id = 5, IsActive = true };
        _mockSocietyDetailsRepo.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(societyDetails);
        _mockSocietyDetailsRepo.Setup(r => r.UpdateAsync(It.IsAny<SocietyDetailsEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(5, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.False(entity.IsActive);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<SocietyWingDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockSocietyDetailsRepo.Verify(r => r.UpdateAsync(It.IsAny<SocietyDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingId_ReturnsFalse()
    {
        // Arrange
        var emptyData = new List<SocietyWingDetailsEntity>();
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(emptyData.BuildMock());

        // Act
        var result = await _service.DeleteAsync(99, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        // Arrange
        var entity = new SocietyWingDetailsEntity
        {
            Id = 1,
            SocietyDetailId = 5,
            PropertyId = 100,
            IsActive = true
        };

        var wingData = new List<SocietyWingDetailsEntity> { entity };
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        _mockReferenceValidator
            .Setup(r => r.ValidateReferencesAsync<SocietyWingDetailsEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete this record because it is referenced"));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.DeleteAsync(5, CancellationToken.None));

        Assert.Contains(exception.Errors, error => error.Value != null && error.Value.Contains("Cannot delete"));
    }

    [Fact]
    public async Task DeleteAsync_InactiveEntity_ReturnsFalse()
    {
        // Arrange
        var entity = new SocietyWingDetailsEntity
        {
            Id = 1,
            SocietyDetailId = 5,
            PropertyId = 100,
            IsActive = false
        };

        var wingData = new List<SocietyWingDetailsEntity> { entity };
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(wingData.BuildMock());

        // Act
        var result = await _service.DeleteAsync(5, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    #endregion

    #region GetAllAsync (WingPropertyDetails) Tests

    [Fact]
    public async Task GetAllAsync_WithValidQuery_ReturnsPagedResultWithAllDetails()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            WingDetailId = 10,
            PageNumber = 1,
            PageSize = 10
        };

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity
            {
                Id = 1,
                WingDetailId = 10,
                PropertyNo = "101",
                PartitionNo = "A1",
                WardId = 5,
                OwnerName = "John Doe",
                OccupierName = "Jane Doe",
                FlatOrShopNo = "101",
                FlatOrShopName = "Flat 101",
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        var assessments = new List<PropertyAssessmentEntity>
        {
            new PropertyAssessmentEntity
            {
                Id = 100,
                PropertyId = 1,
                BHKId = 2,
                BHKMaster = new BHKMasterEntity { Id = 2, BHKCode = "2BHK", BHKName = "2BHK" },
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        var photos = new List<PropertyPhotoEntity>
        {
            PropertyPhotoEntity.CreateWithDocument(1, 1, 50)
        };

        var documentBindings = new List<DocumentBindingEntity>
        {
            new DocumentBindingEntity
            {
                Id = 50,
                DocumentId = 500,
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        var docGuid = Guid.NewGuid();
        var documents = new List<DocumentEntity>
        {
            new DocumentEntity
            {
                Id = 500,
                DocumentGuid = docGuid,
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(BuildLikeSupportedMock(properties));
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(assessments.BuildMock());
        _mockPropertyPhotoRepo.Setup(r => r.GetQueryable()).Returns(photos.BuildMock());
        _mockDocumentBindingRepo.Setup(r => r.GetQueryable()).Returns(documentBindings.BuildMock());
        _mockDocumentRepo.Setup(r => r.GetQueryable()).Returns(documents.BuildMock());

        // Act
        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        var item = result.Items.First();
        Assert.Equal(1, item.PropertyId);
        Assert.Equal(10, item.WingDetailId);
        Assert.Equal("101", item.PropertyNo);
        Assert.Equal("A1", item.PartitionNo);
        Assert.Equal("John Doe", item.OwnerName);
        Assert.Equal("Jane Doe", item.OccupierName);
        Assert.Equal("Flat 101", item.FlatOrShopName);
        Assert.Equal("2BHK", item.BHK);
        Assert.Equal(50, item.DocumentBindingId);
        Assert.Equal(docGuid, item.DocumentGuid);
    }

    [Fact]
    public async Task GetAllAsync_NewerPhotoWithoutDocument_DoesNotFallbackToOlderPhotoDocument()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            WingDetailId = 10,
            PageNumber = 1,
            PageSize = 10
        };

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity
            {
                Id = 1,
                WingDetailId = 10,
                PropertyNo = "101",
                IsActive = true,
                MarkedForDeletion = false
            }
        };

        // Older photo (Id = 10) with valid binding and document
        var olderPhoto = PropertyPhotoEntity.CreateWithDocument(1, 1, 50);
        olderPhoto.Id = 10;

        // Newer photo (Id = 20) with NO document binding
        var newerPhoto = PropertyPhotoEntity.Create(1, 1);
        newerPhoto.Id = 20;

        var photos = new List<PropertyPhotoEntity> { olderPhoto, newerPhoto };

        var olderDocGuid = Guid.NewGuid();
        var documentBindings = new List<DocumentBindingEntity>
        {
            new DocumentBindingEntity { Id = 50, DocumentId = 500, IsActive = true, MarkedForDeletion = false }
        };
        var documents = new List<DocumentEntity>
        {
            new DocumentEntity { Id = 500, DocumentGuid = olderDocGuid, IsActive = true, MarkedForDeletion = false }
        };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(BuildLikeSupportedMock(properties));
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());
        _mockPropertyPhotoRepo.Setup(r => r.GetQueryable()).Returns(photos.BuildMock());
        _mockDocumentBindingRepo.Setup(r => r.GetQueryable()).Returns(documentBindings.BuildMock());
        _mockDocumentRepo.Setup(r => r.GetQueryable()).Returns(documents.BuildMock());

        // Act
        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Items);
        var item = result.Items.First();
        Assert.Equal(1, item.PropertyId);
        Assert.Null(item.DocumentBindingId); // Comes from newest photo (Id = 20)
        Assert.Null(item.DocumentGuid);      // Must be null, must NOT fall back to older photo's document
    }

    [Fact]
    public async Task GetAllAsync_PartitionRange_FiltersCorrectly()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            FromPartitionNo = "P1",
            ToPartitionNo = "P5",
            PageNumber = 1,
            PageSize = 10
        };

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PartitionNo = "P3", IsActive = true, MarkedForDeletion = false },
            new PropertyEntity { Id = 2, PartitionNo = "P8", IsActive = true, MarkedForDeletion = false }
        };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(BuildLikeSupportedMock(properties));
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());
        _mockPropertyPhotoRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _mockDocumentBindingRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _mockDocumentRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());

        // Act
        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.Items.First().PropertyId);
    }

    [Fact]
    public async Task GetAllAsync_FlagNew_ExcludesMappedProperties()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            Flag = "New",
            PageNumber = 1,
            PageSize = 10
        };

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false },
            new PropertyEntity { Id = 2, IsActive = true, MarkedForDeletion = false }
        };

        var mapDetails = new List<PropertyMapDetailEntity>
        {
            new PropertyMapDetailEntity { PropertyIdNew = 1, IsActive = true }
        };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _mockPropertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mapDetails.BuildMock());
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());
        _mockPropertyPhotoRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _mockDocumentBindingRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _mockDocumentRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());

        // Act
        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(2, result.Items.First().PropertyId);
    }

    [Fact]
    public async Task GetAllAsync_FlagOld_IncludesOnlyMappedProperties()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            Flag = "Old",
            PageNumber = 1,
            PageSize = 10
        };

        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, IsActive = true, MarkedForDeletion = false },
            new PropertyEntity { Id = 2, IsActive = true, MarkedForDeletion = false }
        };

        var mapDetails = new List<PropertyMapDetailEntity>
        {
            new PropertyMapDetailEntity { PropertyIdNew = 1, IsActive = true }
        };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _mockPropertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mapDetails.BuildMock());
        _mockAssessmentRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());
        _mockPropertyPhotoRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _mockDocumentBindingRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _mockDocumentRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());

        // Act
        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.Items.First().PropertyId);
    }

    [Fact]
    public async Task GetAllAsync_InvalidPartitionFormat_ThrowsFilterValidationException()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            FromPartitionNo = "invalid@#$",
            PageNumber = 1,
            PageSize = 10
        };

        // Act & Assert
        await Assert.ThrowsAsync<FilterValidationException>(
            () => _service.GetAllAsync(queryParams, CancellationToken.None));
    }

    [Fact]
    public async Task GetAllAsync_MismatchedPrefix_ThrowsFilterValidationException()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            FromPartitionNo = "A1",
            ToPartitionNo = "B10",
            PageNumber = 1,
            PageSize = 10
        };

        // Act & Assert
        await Assert.ThrowsAsync<FilterValidationException>(
            () => _service.GetAllAsync(queryParams, CancellationToken.None));
    }

    [Fact]
    public async Task GetAllAsync_InvalidFlag_ThrowsFilterValidationException()
    {
        // Arrange
        var queryParams = new WingPropertyDetailsQueryParameters
        {
            Flag = "InvalidFlag",
            PageNumber = 1,
            PageSize = 10
        };

        _mockPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());

        // Act & Assert
        await Assert.ThrowsAsync<FilterValidationException>(
            () => _service.GetAllAsync(queryParams, CancellationToken.None));
    }

    #endregion
}

/// <summary>
/// Tests for SocietyWingDetailsDto validation attributes
/// </summary>
public class SocietyWingDetailsDtoTests
{
    [Fact]
    public void SocietyWingDetailsDto_AllProperties_GetSet_WorksCorrectly()
    {
        // Arrange & Act
        var dto = new SocietyWingDetailsDto
        {
            Id = 1,
            WingId = 5,
            PropertyId = 100,
            SocietyDetailId = 10,
            FromFloor = "1",
            ToFloor = "5",
            OldWingName = "Old A",
            NewWingName = "New A",
            NoOfFlat = 20,
            NoOfShop = 5,
            NoOfRowHouse = 3,
            CreatedBy = 1,
            UpdatedBy = 2,
            IsActive = true
        };

        // Assert
        Assert.Equal(1, dto.Id);
        Assert.Equal(5, dto.WingId);
        Assert.Equal(100, dto.PropertyId);
        Assert.Equal(10, dto.SocietyDetailId);
        Assert.Equal("1", dto.FromFloor);
        Assert.Equal("5", dto.ToFloor);
        Assert.Equal("Old A", dto.OldWingName);
        Assert.Equal("New A", dto.NewWingName);
        Assert.Equal(20, dto.NoOfFlat);
        Assert.Equal(5, dto.NoOfShop);
        Assert.Equal(3, dto.NoOfRowHouse);
        Assert.Equal(1, dto.CreatedBy);
        Assert.Equal(2, dto.UpdatedBy);
        Assert.True(dto.IsActive);
    }

    #region CreateDto Validation Tests

    [Fact]
    public void CreateDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            WingId = 1,
            PropertyId = 100,
            FromFloor = "1",
            ToFloor = "5",
            NewWingName = "A Wing",
            NoOfFlat = 10,
            NoOfShop = 2,
            NoOfRowHouse = 0
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.True(isValid);
        Assert.Empty(results);
    }

    [Fact]
    public void CreateDto_FromFloorExceedsMaxLength_FailsValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            FromFloor = new string('1', 51) // Exceeds max length of 50
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_FromFloor_MaxLen_50");
    }

    [Fact]
    public void CreateDto_ToFloorExceedsMaxLength_FailsValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            ToFloor = new string('1', 51) // Exceeds max length of 50
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_ToFloor_MaxLen_50");
    }

    [Fact]
    public void CreateDto_NewWingNameExceedsMaxLength_FailsValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            NewWingName = new string('a', 501) // Exceeds max length of 500
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_NewWingName_MaxLen_500");
    }

    [Fact]
    public void CreateDto_InvalidCharactersInFromFloor_FailsValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            FromFloor = "<script>alert('xss')</script>"
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_FromFloor_InvalidCharacters");
    }

    [Fact]
    public void CreateDto_NegativeNoOfFlat_FailsValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            NoOfFlat = -1
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_NoOfFlat_NonNegative");
    }

    [Fact]
    public void CreateDto_NegativeNoOfShop_FailsValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            NoOfShop = -5
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_NoOfShop_NonNegative");
    }

    [Fact]
    public void CreateDto_NegativeNoOfRowHouse_FailsValidation()
    {
        // Arrange
        var dto = new CreateSocietyWingDetailsDto
        {
            NoOfRowHouse = -10
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_NoOfRowHouse_NonNegative");
    }

    #endregion

    #region UpdateDto Validation Tests

    [Fact]
    public void UpdateDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new UpdateSocietyWingDetailsDto
        {
            FromFloor = "1",
            ToFloor = "10",
            NewWingName = "Updated Wing",
            NoOfFlat = 20
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.True(isValid);
        Assert.Empty(results);
    }

    [Fact]
    public void UpdateDto_InvalidCharactersInNewWingName_FailsValidation()
    {
        // Arrange
        var dto = new UpdateSocietyWingDetailsDto
        {
            NewWingName = "Wing{Test}&$%"
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_NewWingName_InvalidCharacters");
    }

    [Fact]
    public void UpdateDto_NewWingNameExceedsMaxLength_FailsValidation()
    {
        // Arrange
        var dto = new UpdateSocietyWingDetailsDto
        {
            NewWingName = new string('a', 501)
        };

        // Act
        var validationContext = new ValidationContext(dto);
        var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, validationContext, results, true);

        // Assert
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage == "SocietyWingDetails_NewWingName_MaxLen_500");
    }

    #endregion
}
