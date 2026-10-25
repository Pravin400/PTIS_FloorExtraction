using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace NtisPlatform.Api.Extensions;

/// <summary>
/// Swashbuckle schemas an action parameter typed IEnumerable&lt;IFormFile&gt; (List&lt;IFormFile&gt;,
/// IFormFile[], IFormFileCollection) as a plain array of strings, which makes Swagger UI render a
/// separate single-file picker per array slot (with an "Add string item" button) instead of one
/// native multi-select file input. This corrects that parameter's schema to array-of-binary, which
/// Swagger UI renders as a proper multi-file picker (e.g. PropertyMediaController's browse-upload
/// "files" parameter).
/// </summary>
public class MultiFileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var fileArrayParamNames = context.MethodInfo.GetParameters()
            .Where(p => typeof(IEnumerable<IFormFile>).IsAssignableFrom(p.ParameterType))
            .Select(p => p.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (fileArrayParamNames.Count == 0)
            return;

        var multipartContent = operation.RequestBody?.Content
            .FirstOrDefault(c => c.Key.Contains("multipart", StringComparison.OrdinalIgnoreCase)).Value;

        if (multipartContent?.Schema?.Properties is null)
            return;

        foreach (var (propertyName, schema) in multipartContent.Schema.Properties)
        {
            if (fileArrayParamNames.Contains(propertyName))
            {
                schema.Type = "array";
                schema.Items = new OpenApiSchema { Type = "string", Format = "binary" };
            }
        }
    }
}
