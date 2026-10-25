namespace NtisPlatform.Core.Entities.WaterBill.Master;

public class GeographyUnitEntity : BaseEntity
{
    public int GeographyTypeId { get; set; }
    public int? ParentGeographyUnitId { get; set; }
    public string GeographyUnitCode { get; set; } = string.Empty;
    public string GeographyUnitName { get; set; } = string.Empty;
    public int? SearchSequence { get; set; }
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    public GeographyTypeMasterEntity? GeographyType { get; set; }
    public GeographyUnitEntity? ParentGeographyUnit { get; set; }
}
