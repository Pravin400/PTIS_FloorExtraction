using FluentAssertions;
using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.PropertyBulkUpdate;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Services.Property;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class PropertyBulkUpdateServiceTests
{
    private readonly Mock<IRepository<PropertyEntity, int>> _mockPropertyRepository;
    private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _mockAssessmentRepository;
    private readonly Mock<IRepository<PropertyPhotoEntity, int>> _mockPropertyPhotoRepository;
    private readonly Mock<IRepository<PropertyPhotoTypeEntity, int>> _mockPhotoTypeRepository;
    private readonly Mock<IRepository<DocumentBindingEntity, int>> _mockDocumentBindingRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ILogger<PropertyBulkUpdateService>> _mockLogger;
    private readonly PropertyBulkUpdateService _service;

    public PropertyBulkUpdateServiceTests()
    {
        _mockPropertyRepository = new Mock<IRepository<PropertyEntity, int>>();
        _mockAssessmentRepository = new Mock<IRepository<PropertyAssessmentEntity, int>>();
        _mockPropertyPhotoRepository = new Mock<IRepository<PropertyPhotoEntity, int>>();
        _mockPhotoTypeRepository = new Mock<IRepository<PropertyPhotoTypeEntity, int>>();
        _mockDocumentBindingRepository = new Mock<IRepository<DocumentBindingEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockLogger = new Mock<ILogger<PropertyBulkUpdateService>>();

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _service = new PropertyBulkUpdateService(
            _mockPropertyRepository.Object,
            _mockAssessmentRepository.Object,
            _mockPropertyPhotoRepository.Object,
            _mockPhotoTypeRepository.Object,
            _mockDocumentBindingRepository.Object,
            _mockUnitOfWork.Object,
            _mockLogger.Object);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Validation – no active properties found
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_NoActiveProperties_ThrowsValidationException()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 999 },
            OwnerName = "Test Owner"
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1));

        ex.Message.Should().Contain("None of the specified properties were found or are active");
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_InactiveProperties_ThrowsValidationException()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Test Owner"
        };

        var inactiveProperty = new PropertyEntity { Id = 1, IsActive = false, WardId = 1, TaxZoneId = 1 };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { inactiveProperty }.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1));

        ex.Message.Should().Contain("None of the specified properties were found or are active");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Owner / Occupier / Contact fields
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_OwnerFields_UpdatesPropertiesSuccessfully()
    {
        // Arrange
        var property1 = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };
        var property2 = new PropertyEntity { Id = 2, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1, 2 },
            OwnerTitle = "Mr.",
            OwnerName = "John Doe",
            OwnerTitleEnglish = "Mr.",
            OwnerNameEnglish = "John Doe",
            OccupierTitle = "Mrs.",
            OccupierName = "Jane Doe",
            OccupierTitleEnglish = "Mrs.",
            OccupierNameEnglish = "Jane Doe",
            MobileNo = "9876543210"
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property1, property2 }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 5);

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("2 properties updated successfully");
        result.Items.Should().BeTrue();

        property1.OwnerTitle.Should().Be("Mr.");
        property1.OwnerName.Should().Be("John Doe");
        property1.OccupierName.Should().Be("Jane Doe");
        property1.MobileNo.Should().Be("9876543210");
        property1.UpdatedBy.Should().Be(5);
        property1.UpdatedDate.Should().NotBeNull();

        property2.OwnerTitle.Should().Be("Mr.");
        property2.OwnerName.Should().Be("John Doe");

        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_PartialOwnerFields_OnlyUpdatesProvidedFields()
    {
        // Arrange
        var property = new PropertyEntity
        {
            Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1,
            OwnerTitle = "Dr.", OwnerName = "Existing Name", MobileNo = "1111111111"
        };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Updated Name"
            // OwnerTitle is null, MobileNo is null — should NOT overwrite
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();
        property.OwnerName.Should().Be("Updated Name");
        property.OwnerTitle.Should().Be("Dr.", "null fields should be skipped");
        property.MobileNo.Should().Be("1111111111", "null fields should be skipped");
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_WhitespaceOwnerFields_SkipsWhitespaceValues()
    {
        // Arrange
        var property = new PropertyEntity
        {
            Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1,
            OwnerName = "Original"
        };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "   " // whitespace-only — should be skipped
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();
        property.OwnerName.Should().Be("Original", "whitespace-only values are skipped");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Assessment fields
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_AssessmentFields_UpdatesAssessmentsSuccessfully()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };
        var assessment = new PropertyAssessmentEntity { Id = 10, PropertyId = 1, IsActive = true };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerTypeId = 5,
            NoOfResidentialToilets = 3,
            NoOfCommercialToilets = 2
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockAssessmentRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyAssessmentEntity> { assessment }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();
        assessment.OwnerTypeId.Should().Be(5);
        assessment.NoOfResidentialToilets.Should().Be(3);
        assessment.NoOfCommercialToilets.Should().Be(2);
        assessment.UpdatedBy.Should().Be(1);

        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_AssessmentFields_NoActiveAssessments_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerTypeId = 5
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockAssessmentRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyAssessmentEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1));

        ex.Message.Should().Contain("No active assessment records found");
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_PartialAssessmentFields_OnlyUpdatesProvidedFields()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };
        var assessment = new PropertyAssessmentEntity
        {
            Id = 10, PropertyId = 1, IsActive = true,
            OwnerTypeId = 3, NoOfResidentialToilets = 1, NoOfCommercialToilets = 1
        };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            NoOfResidentialToilets = 5
            // OwnerTypeId and NoOfCommercialToilets are null — should not change
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockAssessmentRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyAssessmentEntity> { assessment }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();
        assessment.NoOfResidentialToilets.Should().Be(5);
        assessment.OwnerTypeId.Should().Be(3, "null fields should be skipped");
        assessment.NoOfCommercialToilets.Should().Be(1, "null fields should be skipped");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Photo fields – validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_PhotoTypeIdWithoutDocumentBindingId_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 5
            // DocumentBindingId is null
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1));

        ex.Message.Should().Contain("DocumentBindingId is required");
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_DocumentBindingIdWithoutPhotoTypeId_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            DocumentBindingId = 10
            // PhotoTypeId is null
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1));

        ex.Message.Should().Contain("PhotoTypeId is required");
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_InvalidPhotoTypeId_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 999,
            DocumentBindingId = 10
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockPhotoTypeRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoTypeEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1));

        ex.Message.Should().Contain("Invalid PhotoTypeId");
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_InvalidDocumentBindingId_ThrowsValidationException()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 5,
            DocumentBindingId = 999
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockPhotoTypeRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoTypeEntity> { new() { Id = 5, IsActive = true } }.BuildMock());

        _mockDocumentBindingRepository.Setup(r => r.GetQueryable())
            .Returns(new List<DocumentBindingEntity>().BuildMock());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1));

        ex.Message.Should().Contain("Invalid DocumentBindingId");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4b. Photo fields – create new photo
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_PhotoFields_NoExistingPhoto_CreatesNewPhoto()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 5,
            DocumentBindingId = 10
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockPhotoTypeRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoTypeEntity> { new() { Id = 5, IsActive = true } }.BuildMock());

        _mockDocumentBindingRepository.Setup(r => r.GetQueryable())
            .Returns(new List<DocumentBindingEntity> { new() { Id = 10, IsActive = true } }.BuildMock());

        // No existing photos for this property
        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoEntity>().BuildMock());

        _mockPropertyPhotoRepository.Setup(r => r.AddRangeAsync(
            It.IsAny<IEnumerable<PropertyPhotoEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();

        _mockPropertyPhotoRepository.Verify(
            r => r.AddRangeAsync(It.Is<List<PropertyPhotoEntity>>(list => list.Count == 1), It.IsAny<CancellationToken>()),
            Times.Once);

        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_PhotoFields_ExistingPhoto_UpdatesExistingPhoto()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var existingPhoto = new PropertyPhotoEntity(
            propertyId: 1,
            photoTypeId: 5,
            documentBindingId: 8,
            isLatest: true);
        existingPhoto.IsActive = true;

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 5,
            DocumentBindingId = 20
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockPhotoTypeRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoTypeEntity> { new() { Id = 5, IsActive = true } }.BuildMock());

        _mockDocumentBindingRepository.Setup(r => r.GetQueryable())
            .Returns(new List<DocumentBindingEntity> { new() { Id = 20, IsActive = true } }.BuildMock());

        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoEntity> { existingPhoto }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();

        // Should NOT call AddRangeAsync since existing photo was updated in-place
        _mockPropertyPhotoRepository.Verify(
            r => r.AddRangeAsync(It.IsAny<IEnumerable<PropertyPhotoEntity>>(), It.IsAny<CancellationToken>()),
            Times.Never);

        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Multiple properties – mixed create/update photos
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_MultipleProperties_MixedPhotoCreateAndUpdate()
    {
        // Arrange
        var property1 = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };
        var property2 = new PropertyEntity { Id = 2, IsActive = true, WardId = 1, TaxZoneId = 1 };

        // Property 1 has existing photo, property 2 does not
        var existingPhoto = new PropertyPhotoEntity(
            propertyId: 1,
            photoTypeId: 5,
            documentBindingId: 8,
            isLatest: true);
        existingPhoto.IsActive = true;

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1, 2 },
            PhotoTypeId = 5,
            DocumentBindingId = 20
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property1, property2 }.BuildMock());

        _mockPhotoTypeRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoTypeEntity> { new() { Id = 5, IsActive = true } }.BuildMock());

        _mockDocumentBindingRepository.Setup(r => r.GetQueryable())
            .Returns(new List<DocumentBindingEntity> { new() { Id = 20, IsActive = true } }.BuildMock());

        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoEntity> { existingPhoto }.BuildMock());

        _mockPropertyPhotoRepository.Setup(r => r.AddRangeAsync(
            It.IsAny<IEnumerable<PropertyPhotoEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("2 properties updated successfully");

        // Only property 2 needs a new photo
        _mockPropertyPhotoRepository.Verify(
            r => r.AddRangeAsync(It.Is<List<PropertyPhotoEntity>>(list => list.Count == 1), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Combined update — owner + assessment + photo
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_AllFieldTypes_UpdatesEverythingInSingleTransaction()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };
        var assessment = new PropertyAssessmentEntity { Id = 10, PropertyId = 1, IsActive = true };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            // Owner fields
            OwnerName = "Combined Owner",
            MobileNo = "1234567890",
            // Assessment fields
            OwnerTypeId = 2,
            NoOfResidentialToilets = 4,
            // Photo fields
            PhotoTypeId = 5,
            DocumentBindingId = 10
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockAssessmentRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyAssessmentEntity> { assessment }.BuildMock());

        _mockPhotoTypeRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoTypeEntity> { new() { Id = 5, IsActive = true } }.BuildMock());

        _mockDocumentBindingRepository.Setup(r => r.GetQueryable())
            .Returns(new List<DocumentBindingEntity> { new() { Id = 10, IsActive = true } }.BuildMock());

        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoEntity>().BuildMock());

        _mockPropertyPhotoRepository.Setup(r => r.AddRangeAsync(
            It.IsAny<IEnumerable<PropertyPhotoEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 7);

        // Assert
        result.Success.Should().BeTrue();
        result.Items.Should().BeTrue();

        // Owner fields updated
        property.OwnerName.Should().Be("Combined Owner");
        property.MobileNo.Should().Be("1234567890");
        property.UpdatedBy.Should().Be(7);

        // Assessment fields updated
        assessment.OwnerTypeId.Should().Be(2);
        assessment.NoOfResidentialToilets.Should().Be(4);
        assessment.UpdatedBy.Should().Be(7);

        // Photo created
        _mockPropertyPhotoRepository.Verify(
            r => r.AddRangeAsync(It.Is<List<PropertyPhotoEntity>>(list => list.Count == 1), It.IsAny<CancellationToken>()),
            Times.Once);

        // Only one SaveChanges for the entire transaction
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. Audit – UpdatedBy resolution
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_UpdatedByFromParameter_UsesParameterValue()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Test",
            UpdatedBy = 99 // DTO has UpdatedBy but parameter takes precedence
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 5);

        // Assert
        property.UpdatedBy.Should().Be(5, "parameter updatedBy takes precedence when > 0");
    }

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_UpdatedByZero_FallsBackToDtoUpdatedBy()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Test",
            UpdatedBy = 42
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 0);

        // Assert
        property.UpdatedBy.Should().Be(42, "when parameter is 0, DTO UpdatedBy is used as fallback");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. Cancellation token
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_CancelledToken_ThrowsOperationCancelledException()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Test"
        };

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act & Assert
        await Assert.ThrowsAsync<OperationCanceledException>(
            () => _service.UpdateIdWiseDetailsAsync(dto, 1, cts.Token));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. No-op sections — only owner provided, no assessment/photo
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_OnlyOwnerFields_DoesNotQueryAssessmentOrPhoto()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Only Owner"
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();

        // Assessment and Photo repos should NOT be queried
        _mockAssessmentRepository.Verify(r => r.GetQueryable(), Times.Never);
        _mockPhotoTypeRepository.Verify(r => r.GetQueryable(), Times.Never);
        _mockPropertyPhotoRepository.Verify(r => r.GetQueryable(), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. Photo display order calculation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateIdWiseDetailsAsync_NewPhoto_DisplayOrderIsMaxPlusOne()
    {
        // Arrange
        var property = new PropertyEntity { Id = 1, IsActive = true, WardId = 1, TaxZoneId = 1 };

        // Existing photos for property 1 with DisplayOrder 1 and 3
        var existingPhotoA = new PropertyPhotoEntity(propertyId: 1, photoTypeId: 2, displayOrder: 1);
        existingPhotoA.IsActive = true;
        var existingPhotoB = new PropertyPhotoEntity(propertyId: 1, photoTypeId: 3, displayOrder: 3);
        existingPhotoB.IsActive = true;

        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 5,   // Different photo type — no existing match
            DocumentBindingId = 10
        };

        _mockPropertyRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyEntity> { property }.BuildMock());

        _mockPhotoTypeRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoTypeEntity> { new() { Id = 5, IsActive = true } }.BuildMock());

        _mockDocumentBindingRepository.Setup(r => r.GetQueryable())
            .Returns(new List<DocumentBindingEntity> { new() { Id = 10, IsActive = true } }.BuildMock());

        _mockPropertyPhotoRepository.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyPhotoEntity> { existingPhotoA, existingPhotoB }.BuildMock());

        List<PropertyPhotoEntity> capturedPhotos = null!;
        _mockPropertyPhotoRepository.Setup(r => r.AddRangeAsync(
            It.IsAny<IEnumerable<PropertyPhotoEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<PropertyPhotoEntity>, CancellationToken>((photos, _) => capturedPhotos = photos.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateIdWiseDetailsAsync(dto, 1);

        // Assert
        result.Success.Should().BeTrue();
        capturedPhotos.Should().NotBeNull();
        capturedPhotos.Should().HaveCount(1);
    }
}
