namespace NtisPlatform.Core.Constants;

public static class PropertySocialDetailsConstants
{
    public const string TextValidationRegex = @"^[^<>]*$";

    public static class EntityTypes
    {
        public const string Property = "P";
        public const string Wing = "W";
        public const string Society = "S";

        public static readonly IReadOnlySet<string> Allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Property,
            Wing,
            Society
        };

        public static bool IsValid(string? entityType) =>
            !string.IsNullOrWhiteSpace(entityType) && Allowed.Contains(entityType.Trim());

        public static string Normalize(string? entityType, string defaultType = Property)
        {
            if (string.IsNullOrWhiteSpace(entityType))
                return defaultType;

            var trimmed = entityType.Trim().ToUpperInvariant();
            return Allowed.Contains(trimmed) ? trimmed : defaultType;
        }
    }

    public static class HierarchyLevels
    {
        public const string Apartment = "Apartment";
        public const string Wing = "Wing";
        public const string Unit = "Unit";
        public const string Property = "Property";
    }

    public static class UnitEvaluationScopes
    {
        public const string AllUnits = "AllUnits";
        public const string SingleUnit = "SingleUnit";
        public const string None = "None";
    }
}
