namespace NtisPlatform.Application.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Items { get; set; }
    public int? TotalCount { get; set; }
    public List<string>? Errors { get; set; }

    /// <summary>
    /// Correlation ID for tracking errors and diagnostic purposes
    /// </summary>
    public string? CorrelationId { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string message = "")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Items = data,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string> { message }
        };
    }
}
