using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Duplicate-value validation shared by the Asset Management master services, so every AMS master reports a
/// clash the same way: the errors dictionary is keyed by the property that clashed, and the message names the
/// field and value the user typed, e.g. <c>Category Code 'BLDG' already exists.</c>
/// </summary>
internal static class AssetMasterValidation
{
    /// <summary>
    /// Creates a duplicate-value error that names the field the way the user sees it, e.g.
    /// <c>Category Code 'BLDG' already exists.</c> When the value only has to be unique within a parent
    /// record, pass <paramref name="scope"/> (e.g. "Asset Type") to get
    /// <c>Room Type Name 'Hall' already exists for the selected Asset Type.</c>
    /// </summary>
    /// <param name="propertyName">The DTO/entity property that clashed (the key in the errors dictionary)</param>
    /// <param name="fieldLabel">The field's display label, e.g. "Category Code"</param>
    /// <param name="value">The value that already exists</param>
    /// <param name="scope">The parent the value must be unique within, or null when it is unique across the master</param>
    public static ValidationError Duplicate(string propertyName, string fieldLabel, object? value, string? scope = null)
        => new(propertyName, scope is null
            ? $"{fieldLabel} '{value}' already exists."
            : $"{fieldLabel} '{value}' already exists for the selected {scope}.");

    /// <summary>
    /// Returns the collected errors as a validation result (success when there are none).
    /// </summary>
    /// <remarks>
    /// The validation hooks must return — never throw — their failures: AssetMasterCrudService's bulk create
    /// and bulk update loops collect a failed result per item, skip that item and still save the valid ones.
    /// A thrown exception would escape the loop and roll back the whole batch.
    /// </remarks>
    public static ValidationResult ToResult(IReadOnlyCollection<ValidationError> errors)
        => errors.Count > 0 ? ValidationResult.Failure(errors) : ValidationResult.Success();

    /// <summary>
    /// Rebuilds a single-item create/update <see cref="ValidationException"/> so its top-level message joins every
    /// field message (e.g. "Category Code 'X' already exists. Category Name 'Y' already exists.") instead of the base
    /// service's generic "Validation failed for create operation" (create) or only the first error (update).
    /// The errors dictionary and operation type are kept as they are.
    /// </summary>
    public static ValidationException WithFieldMessages(ValidationException exception)
    {
        var messages = exception.Errors.Values
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Distinct()
            .ToList();

        return messages.Count == 0
            ? exception
            : new ValidationException(string.Join(" ", messages), exception.Errors, exception.OperationType);
    }

    /// <summary>
    /// Error for a field whose value other records store as text (not by Id), e.g.
    /// <c>Ownership Type Name cannot be changed because this Ownership Type is in use.</c> Changing it would leave
    /// those records holding a value the master no longer has, and the reference check could no longer find them.
    /// </summary>
    /// <param name="propertyName">The DTO/entity property being changed (the key in the errors dictionary)</param>
    /// <param name="fieldLabel">The field's display label, e.g. "Ownership Type Name"</param>
    /// <param name="masterName">The master's display name, e.g. "Ownership Type"</param>
    public static ValidationError CannotChangeWhileInUse(string propertyName, string fieldLabel, string masterName)
        => new(propertyName, $"{fieldLabel} cannot be changed because this {masterName} is in use.");

    /// <summary>
    /// Bulk item failure when the database rejects a duplicate the validation did not see: another request saved
    /// the same unique value between this item's check and its save.
    /// </summary>
    public const string DuplicateRecordMessage = "A record with the same details already exists.";

    /// <summary>
    /// True when the save failed on a unique index or a unique/primary-key constraint (SQL Server errors 2601 and
    /// 2627). The error number is read from the provider exception by name, so the Application layer needs no SQL
    /// Server package; other failures (a foreign key, a value too long) are not treated as duplicates.
    /// </summary>
    public static bool IsDuplicateKey(DbUpdateException exception)
    {
        for (var inner = exception.InnerException; inner != null; inner = inner.InnerException)
        {
            if (inner.GetType().GetProperty("Number")?.GetValue(inner) is int number && (number == 2601 || number == 2627))
                return true;
        }

        return false;
    }
}
