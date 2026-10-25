using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill;

public class CitizenServiceDto : BaseDtos
{
    public int DepartmentId { get; set; }
    public string? IconName { get; set; }
    public string? Badge { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TitleLocal { get; set; }
    public string? DescriptionLocal { get; set; }
    public string? ReferenceLink { get; set; }
    public string? Category { get; set; }
    public int DisplayOrder { get; set; }
    public bool OpenInNewTab { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
}

public class CreateCitizenServiceDto : CreateBaseDtos
{
    public CreateCitizenServiceDto()
    {
        IsActive = true;
    }

    [Required(ErrorMessage = "DepartmentId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "DepartmentId must be greater than zero.")]
    public int DepartmentId { get; set; }

    private string? _iconName;
    [MaxLength(30)]
    public string? IconName 
    { 
        get => _iconName; 
        set => _iconName = value?.Trim(); 
    }

    private string? _badge;
    [MaxLength(10)]
    public string? Badge 
    { 
        get => _badge; 
        set => _badge = value?.Trim(); 
    }

    private string _title = string.Empty;
    [Required]
    [MaxLength(50)]
    public string Title 
    { 
        get => _title; 
        set => _title = value?.Trim() ?? string.Empty; 
    }

    private string? _description;
    [MaxLength(100)]
    public string? Description 
    { 
        get => _description; 
        set => _description = value?.Trim(); 
    }

    private string? _titleLocal;
    [MaxLength(50)]
    public string? TitleLocal 
    { 
        get => _titleLocal; 
        set => _titleLocal = value?.Trim(); 
    }

    private string? _descriptionLocal;
    [MaxLength(100)]
    public string? DescriptionLocal 
    { 
        get => _descriptionLocal; 
        set => _descriptionLocal = value?.Trim(); 
    }

    private string? _referenceLink;
    [MaxLength(100)]
    public string? ReferenceLink 
    { 
        get => _referenceLink; 
        set => _referenceLink = value?.Trim(); 
    }

    private string? _category;
    [MaxLength(50)]
    public string? Category 
    { 
        get => _category; 
        set => _category = value?.Trim(); 
    }

    public int DisplayOrder { get; set; }
    public bool OpenInNewTab { get; set; }
}

public class UpdateCitizenServiceDto : UpdateBaseDtos
{
    public UpdateCitizenServiceDto()
    {
        IsActive = true;
    }

    [Required(ErrorMessage = "DepartmentId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "DepartmentId must be greater than zero.")]
    public int DepartmentId { get; set; }

    private string? _iconName;
    [MaxLength(30)]
    public string? IconName 
    { 
        get => _iconName; 
        set => _iconName = value?.Trim(); 
    }

    private string? _badge;
    [MaxLength(10)]
    public string? Badge 
    { 
        get => _badge; 
        set => _badge = value?.Trim(); 
    }

    private string _title = string.Empty;
    [Required]
    [MaxLength(50)]
    public string Title 
    { 
        get => _title; 
        set => _title = value?.Trim() ?? string.Empty; 
    }

    private string? _description;
    [MaxLength(100)]
    public string? Description 
    { 
        get => _description; 
        set => _description = value?.Trim(); 
    }

    private string? _titleLocal;
    [MaxLength(50)]
    public string? TitleLocal 
    { 
        get => _titleLocal; 
        set => _titleLocal = value?.Trim(); 
    }

    private string? _descriptionLocal;
    [MaxLength(100)]
    public string? DescriptionLocal 
    { 
        get => _descriptionLocal; 
        set => _descriptionLocal = value?.Trim(); 
    }

    private string? _referenceLink;
    [MaxLength(100)]
    public string? ReferenceLink 
    { 
        get => _referenceLink; 
        set => _referenceLink = value?.Trim(); 
    }

    private string? _category;
    [MaxLength(50)]
    public string? Category 
    { 
        get => _category; 
        set => _category = value?.Trim(); 
    }

    public int DisplayOrder { get; set; }
    public bool OpenInNewTab { get; set; }
}

public class CitizenServiceQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? DepartmentId { get; set; }

    [Filterable(FilterOperator.Equals)]
    public bool? IsActive { get; set; }
    
    [Filterable(FilterOperator.Contains)]
    public string? Title { get; set; }
    
    [Filterable(FilterOperator.Equals)]
    public string? Category { get; set; }
}
