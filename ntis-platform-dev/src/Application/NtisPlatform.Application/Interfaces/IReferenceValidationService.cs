using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Centralized service for validating entity references before deactivation or deletion.
/// Provides generic, configurable logic for checking if an entity is referenced in other tables.
/// </summary>
public interface IReferenceValidationService
{
    /// <summary>
    /// Validates if an entity can be deactivated or deleted based on configured references.
    /// </summary>
    /// <typeparam name="TEntity">The entity type to validate</typeparam>
    /// <param name="entityId">The entity ID to validate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>ValidationResult indicating success or failure with detailed error message listing all referencing tables</returns>
    Task<ValidationResult> ValidateReferencesAsync<TEntity>(int entityId, CancellationToken cancellationToken = default)
        where TEntity : BaseEntity;

    /// <summary>
    /// Same check as <see cref="ValidateReferencesAsync{TEntity}(int, CancellationToken)"/>, for the given operation,
    /// used by the AMS master services. Entities configured with a readable message (the AMS masters) say "cannot be
    /// deleted" or "cannot be deactivated" and name only their child masters; any other entity gets the same result
    /// as the overload without an operation.
    /// </summary>
    /// <typeparam name="TEntity">The entity type to validate</typeparam>
    /// <param name="entityId">The entity ID to validate</param>
    /// <param name="operation">The operation being validated</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task<ValidationResult> ValidateReferencesAsync<TEntity>(int entityId, ReferenceValidationOperation operation, CancellationToken cancellationToken = default)
        where TEntity : BaseEntity;

    /// <summary>
    /// Retrieves the names of all tables that reference the specified entity and contain data.
    /// </summary>
    /// <typeparam name="TEntity">The entity type to check.</typeparam>
    /// <typeparam name="TKey">The type of the referenced entity's key.</typeparam>
    /// <param name="referencedId">The ID of the referenced entity.</param>
    /// <param name="referencedColumnName">The name of the referenced column (default is "Id").</param>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of table names that reference the specified entity and contain data.</returns>
    Task<List<string>> GetReferencingTablesWithDataAsync<TEntity, TKey>(
    TKey referencedId,
    string referencedColumnName = "Id",
    CancellationToken cancellationToken = default)
    where TEntity : class;
}
