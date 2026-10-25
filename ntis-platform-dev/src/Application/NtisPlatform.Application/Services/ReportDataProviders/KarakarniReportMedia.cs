namespace NtisPlatform.Application.Services.ReportDataProviders;

public sealed record KarakarniMediaScope(
    int PropertyId, int? SocietyId, int? WingId, string? UnitType, bool AllowSharedPlan);

public sealed record KarakarniMediaBinding(
    int Id, int? PropertyId, int? SocietyId, int? WingId, string? UnitType,
    string? PhotoTypeCode, int? DisplayOrder, int BindingId);

/// <summary>Matches report images to the property and its shared apartment base plan.</summary>
public static class KarakarniReportMedia
{
    public static int SelectPropertyPhoto(KarakarniMediaScope scope, IEnumerable<KarakarniMediaBinding> images) =>
        images.Where(image => image.PropertyId == scope.PropertyId &&
                (image.PhotoTypeCode == null || image.PhotoTypeCode.Equals("PROPERTY_FRONT", StringComparison.OrdinalIgnoreCase)
                    || image.PhotoTypeCode.Equals("PROPERTY_PHOTO", StringComparison.OrdinalIgnoreCase)))
            .OrderBy(image => image.DisplayOrder ?? 1).ThenByDescending(image => image.Id)
            .Select(image => image.BindingId).FirstOrDefault();

    public static int SelectPlan(KarakarniMediaScope scope, IEnumerable<KarakarniMediaBinding> images) =>
        images.Where(image => image.PhotoTypeCode?.Contains("PLAN", StringComparison.OrdinalIgnoreCase) == true
                && ((image.PropertyId == scope.PropertyId
                        && (string.IsNullOrWhiteSpace(image.UnitType) || image.UnitType == scope.UnitType))
                    || (scope.AllowSharedPlan && image.PropertyId == null
                        && !string.IsNullOrWhiteSpace(scope.UnitType) && image.UnitType == scope.UnitType
                        && (image.DisplayOrder ?? 1) <= 1
                        && ((scope.WingId.HasValue && image.WingId == scope.WingId)
                            || (scope.SocietyId.HasValue && image.SocietyId == scope.SocietyId)))))
            .OrderBy(image => image.DisplayOrder ?? 1)
            .ThenByDescending(image => image.PropertyId == scope.PropertyId)
            .ThenByDescending(image => image.Id)
            .Select(image => image.BindingId).FirstOrDefault();
}
