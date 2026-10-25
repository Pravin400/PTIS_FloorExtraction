namespace NtisPlatform.Application.Enums;

/// <summary>The bulk media operation a job performs.</summary>
public enum PropertyMediaJobOperation
{
    BulkImportLocalFolder,
    BulkImportBrowsedFiles
}

/// <summary>Lifecycle status of a <c>PropertyMediaJob</c> (matches CK_PropertyMediaJob_Status constraint).</summary>
public enum PropertyMediaJobStatus
{
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled
}

/// <summary>Per-file execution status within a media job (matches CK_PropertyMediaJobDetail_Status constraint).</summary>
public enum PropertyMediaJobDetailStatus
{
    Pending,
    Matched,
    NoMatch,
    Invalid,
    Failed
}

/// <summary>Reason a file was excluded from upload (set alongside <see cref="PropertyMediaJobDetailStatus.NoMatch"/> or <see cref="PropertyMediaJobDetailStatus.Invalid"/>).</summary>
public enum PropertyMediaSkipReason
{
    InvalidFileNameFormat,
    WardNotFound,
    PropertyNotFound,
    SuffixMismatch
}
