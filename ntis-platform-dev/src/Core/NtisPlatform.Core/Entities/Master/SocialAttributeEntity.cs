using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.Master
{
    [Table("SocialAttributeMaster", Schema = "PTIS")]
    public class SocialAttributeEntity : BaseEntity
    {
        public string SocialAttributeCode { get; set; } = null!;
        public string SocialAttributeName { get; set; } = null!;
        public string DataType { get; set; } = null!;
        public string? Unit { get; set; }
        public int? DisplayOrder { get; set; }
        public int? ParentAttributeId { get; set; }
        public bool IsRequiredWhenParentTrue { get; set; } = false;
        public bool IsDiscountApplicable { get; set; } = false;
        public int? PhotoTypeId { get; set; }
        public string? AttributeCategory { get; set; }
        public bool IsPhotoRequired { get; set; } = false;
        public bool IsDocumentRequired { get; set; } = false;
        public bool IsCommonAreaAttribute { get; set; } = false;
    }
}
