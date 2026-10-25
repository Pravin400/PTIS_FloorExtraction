using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Master.ScreenFieldValidation;
using NtisPlatform.Application.Services.Master;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

public class ScreenFieldValidationServiceTests
{
    private readonly Mock<IRepository<ScreenFieldValidationEntity>> _fieldRepo = new();
    private readonly Mock<IRepository<ScreenButtonPermissionEntity>> _buttonRepo = new();

    private ScreenFieldValidationService CreateService()
        => new(_fieldRepo.Object, _buttonRepo.Object);

    [Fact]
    public async Task GetAllAsync_ReturnsMergedFieldAndButtonData()
    {
        // Arrange
        var screen = new ScreenMasterEntity
        {
            Id = 1,
            ScreenGroupId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            ScreenName = "Data Analytics",
            ScreenNameLocal = "Data Analytics"
        };

        var fieldType = new FieldTypeMasterEntity { Id = 10, FieldTypeName = "Text" };
        var fieldMaster = new ScreenFieldMasterEntity
        {
            Id = 100,
            FieldCode = "F_NAME",
            FieldName = "Name",
            FieldType = fieldType
        };

        var fieldRows = new List<ScreenFieldValidationEntity>
        {
            new()
            {
                Id = 1,
                ScreenId = 1,
                ScreenMaster = screen,
                ScreenFieldMaster = fieldMaster,
                MinLength = 2,
                MaxLength = 50,
                ValidationExpression = "^[A-Za-z ]+$",
                ErrorMessage = "Invalid",
                IsVisible = true,
                IsMandatory = true,
                IsReadonly = false
            }
        };

        var buttonType = new ButtonTypeMasterEntity { Id = 20, ButtonTypeName = "Save" };
        var buttonMaster = new ScreenButtonMasterEntity
        {
            Id = 200,
            ButtonCode = "BTN_SAVE",
            ButtonName = "Save",
            ButtonTypeMaster = buttonType
        };

        var buttonRows = new List<ScreenButtonPermissionEntity>
        {
            new()
            {
                Id = 1,
                ScreenId = 1,
                ScreenMaster = screen,
                ScreenButtonMaster = buttonMaster,
                IsVisible = true,
                IsEnabled = true
            }
        };

        _fieldRepo.Setup(r => r.GetQueryable()).Returns(fieldRows.BuildMock());
        _buttonRepo.Setup(r => r.GetQueryable()).Returns(buttonRows.BuildMock());

        var service = CreateService();
        var query = new ScreenFieldValidationQueryParameters { DepartmentId = 1, ModuleId = 1, ScreenId = 0 };

        // Act
        var result = await service.GetAllAsync(query, CancellationToken.None);

        // Assert
        var item = Assert.Single(result);
        Assert.Equal(1, item.ScreenId);
        Assert.Equal("Data Analytics", item.ScreenName);

        var field = Assert.Single(item.FieldValidationDetails);
        Assert.Equal("F_NAME", field.FieldCode);
        Assert.Equal("Text", field.FieldTypeName);

        var button = Assert.Single(item.ButtonPermissionDetails);
        Assert.Equal("BTN_SAVE", button.ButtonCode);
        Assert.True(button.IsVisible);
        Assert.True(button.IsEnabled);
    }

    [Fact]
    public async Task GetAllAsync_ScreenIdFilter_ReturnsOnlyRequestedScreen()
    {
        // Arrange
        var s1 = new ScreenMasterEntity { Id = 1, ScreenGroupId = 1, DepartmentId = 1, ModuleId = 1, ScreenName = "S1" };
        var s2 = new ScreenMasterEntity { Id = 2, ScreenGroupId = 1, DepartmentId = 1, ModuleId = 1, ScreenName = "S2" };

        var ft = new FieldTypeMasterEntity { Id = 1, FieldTypeName = "Text" };

        var fieldRows = new List<ScreenFieldValidationEntity>
        {
            new() { Id = 1, ScreenId = 1, ScreenMaster = s1, ScreenFieldMaster = new ScreenFieldMasterEntity { Id = 1, FieldCode = "A", FieldName = "A", FieldType = ft } },
            new() { Id = 2, ScreenId = 2, ScreenMaster = s2, ScreenFieldMaster = new ScreenFieldMasterEntity { Id = 2, FieldCode = "B", FieldName = "B", FieldType = ft } }
        };

        var bt = new ButtonTypeMasterEntity { Id = 1, ButtonTypeName = "Save" };
        var buttonRows = new List<ScreenButtonPermissionEntity>
        {
            new() { Id = 1, ScreenId = 1, ScreenMaster = s1, ScreenButtonMaster = new ScreenButtonMasterEntity { Id = 1, ButtonCode = "BTN_A", ButtonName = "A", ButtonTypeMaster = bt } },
            new() { Id = 2, ScreenId = 2, ScreenMaster = s2, ScreenButtonMaster = new ScreenButtonMasterEntity { Id = 2, ButtonCode = "BTN_B", ButtonName = "B", ButtonTypeMaster = bt } }
        };

        _fieldRepo.Setup(r => r.GetQueryable()).Returns(fieldRows.BuildMock());
        _buttonRepo.Setup(r => r.GetQueryable()).Returns(buttonRows.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetAllAsync(
            new ScreenFieldValidationQueryParameters { DepartmentId = 1, ModuleId = 1, ScreenId = 2 },
            CancellationToken.None);

        // Assert
        var item = Assert.Single(result);
        Assert.Equal(2, item.ScreenId);
        Assert.Equal("S2", item.ScreenName);
        Assert.Single(item.FieldValidationDetails);
        Assert.Single(item.ButtonPermissionDetails);
    }
}