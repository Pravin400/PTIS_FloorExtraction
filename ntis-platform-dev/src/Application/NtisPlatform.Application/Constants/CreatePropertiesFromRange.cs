using System;

namespace NtisPlatform.Application.Constants
{
    public static class CreatePropertiesFromRange
    {
        public static class Numeric
        {
            public const int InitialSuccessCount = 0;
            public const int InitialFailedCount = 0;
            public const int IndexOffset = 1;
            public const int WorkflowStageMinId = 1;
        }

        public static class Messages
        {
            public const string TemplateCannotBeNull = "Template cannot be null.";
            public const string PropertyAlreadyExists = "Property already exists.";
            public const string DuplicateCheckFailedTemplate = "Row {0} : Property already exists";
            public const string UnknownErrorOccurred = "Unknown error occurred";
            public const string PropertyCreationFailedTemplate = "Row {0} ({1}): {2}";
            public const string DatabaseErrorTemplate = "Database error: {0}";
            public const string OperationCancelled = "Operation cancelled.";
            public const string InvalidArgumentTemplate = "Invalid argument: {0}";
            public const string RollbackErrorTemplate = "Rollback error: {0}";
            public const string UnexpectedTransactionErrorTemplate = "Unexpected transaction error: {0}: {1}";
            public const string PropertyCreatedSuccessfully = "Property created successfully.";
            public const string WardNotFoundOrInactiveTemplate = "The selected ward is invalid or inactive. Please select a valid ward.";
            public const string TaxZoneNotFoundOrInactiveTemplate = "The selected tax zone is invalid or inactive. Please select a valid tax zone.";
            public const string CategoryNotFoundOrInactiveTemplate = "The selected property category is invalid or inactive. Please select a valid category.";
            public const string PropertyTypeNotFoundOrInactiveTemplate = "The selected property type is invalid or inactive. Please select a valid property type.";
            public const string AssessmentStatusNotFoundOrInactiveTemplate = "The selected assessment status is invalid or inactive. Please select a valid assessment status.";
            public const string OwnerTypeNotFoundOrInactiveTemplate = "The selected owner type is invalid or inactive. Please select a valid owner type.";
            public const string CommonRemarkTypeNotFoundOrInactiveTemplate = "The selected remark is invalid or inactive. Please select a valid remark.";
            public const string CommonRemarkDetailsNotFoundOrInactiveTemplate = "The selected remark is invalid or inactive. Please select a valid remark.";
            public const string FloorNotFoundOrInactiveTemplate = "The selected floor is invalid or inactive. Please select a valid floor.";
            public const string ConstructionTypeNotFoundOrInactiveTemplate = "The selected construction type is invalid or inactive. Please select a valid construction type.";
            public const string TypeOfUseNotFoundOrInactiveTemplate = "The selected usage type is invalid or inactive. Please select a valid usage type.";
            public const string RoomTypeNotFoundOrInactiveTemplate = "The selected room type is invalid or inactive. Please select a valid room type.";
            public const string WorkflowStageNotFoundOrInactiveTemplate = "The selected workflow stage is invalid or inactive. Please select a valid workflow stage.";
        }

        public static class CategoryNames
        {
            public const string Apartment = "Apartment";
            public const string Plot = "Plot";
        }

        public static class ComparisonOptions
        {
            public const StringComparison CategoryNameComparison = StringComparison.OrdinalIgnoreCase;
        }
    }
}
