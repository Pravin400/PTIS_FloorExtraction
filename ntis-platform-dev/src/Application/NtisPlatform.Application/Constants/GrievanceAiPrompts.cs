using System.Text;

namespace NtisPlatform.Application.Constants;

public record DepartmentCacheItem(int Id, string DepartmentName, string? DepartmentNameLocal);
public record TypeCacheItem(int Id, int GrievanceDepartmentId, string? GrievanceType);

/// <summary>
/// Centralized storage for municipal grievance AI prompt templates, bilingual rules, and master catalog formatters.
/// Kept completely separate from service orchestration to preserve clean architecture boundaries.
/// </summary>
public static class GrievanceAiPrompts
{
    /// <summary>
    /// Builds the multi-photo civic evaluation prompt dynamically incorporating active municipal master records.
    /// </summary>
    public static string BuildMultiPhotoVisionPrompt(int photoCount, string deptPrompt, string typePrompt)
    {
        return $@"You are an expert municipal grievance classifier for an Indian Urban Local Body (ULB).
You are provided with {photoCount} photo(s).
You MUST examine and analyze EVERY photo provided (Photo 1 through Photo {photoCount}).

Multi-Photo Evaluation Rules:
1. Examine each photo individually and determine what it depicts.
2. Personal Photo / ID / Non-Civic Validation (HIGHEST PRIORITY):
   - If ANY photo depicts a personal photograph, portrait of person/people, selfie, personal identity document (such as an Aadhaar card, PAN card, voter ID, passport, driving license), or non-civic item:
     - Set isValidCivicIssue to false.
     - Set rejectionReason explicitly identifying which photo is a personal photo or non-civic item (e.g. 'Photo 2 is a personal photograph and not a civic complaint defect. Please upload photos showing the actual municipal issue.').
     - Provide rejectionReasonLocal in Marathi (e.g. 'फोटो २ हे वैयक्तिक छायाचित्र आहे आणि नागरी तक्रार नाही. कृपया प्रत्यक्ष नागरी समस्येचे फोटो अपलोड करा.').
     - Return null for departmentId and grievanceTypeId.
     - NEVER classify a personal photo under Rule 3, because a personal photograph is not a municipal issue at all.
3. Single-Issue & Department Coherence (Applies ONLY when ALL photos depict valid civic issues):
   - If ALL photos depict valid civic defects, but they depict entirely different, unrelated civic issues belonging to DIFFERENT municipal departments (e.g., one photo shows illegal parking/traffic, while another photo shows building demolition/unauthorized construction, or garbage dumping):
     - Set isValidCivicIssue to false.
     - Set rejectionReason explaining: 'The uploaded photos depict multiple unrelated municipal issues that belong to different departments. Each complaint can only address one municipal department. Please submit separate grievance tickets for each issue so the respective departments can take action.'
     - Set rejectionReasonLocal in Marathi: 'अपलोड केलेले फोटो वेगवेगळ्या विभागांशी संबंधित स्वतंत्र समस्या दर्शवतात. एका तक्रारीत केवळ एकाच विभागाशी संबंधित समस्या नोंदवता येते. योग्य कारवाईसाठी कृपया प्रत्येक समस्येसाठी स्वतंत्र तक्रार नोंदवा.'
     - Return null for departmentId and grievanceTypeId.
4. Blurry / Unclear photo validation: If ANY photo is completely blurry, pitch dark, or unrecognizable:
   - Set isImageUnclear to true, isValidCivicIssue to false, and explain in rejectionReason and rejectionReasonLocal.
   - Return null for departmentId and grievanceTypeId.
5. If ALL provided photos depict a coherent municipal issue belonging to the same department or situation:
   - Set isValidCivicIssue to true.
   - Select exactly one active department and one active grievance type from the supplied lists that best matches the issues across the photos. The grievance type MUST belong to the selected department.
   - Synthesize all photos into the title and description.
   - Write a formal citizen complaint in English and Marathi.
   - Title: 4-8 words stating the civic complaint.
   - Description: 2-3 sentences covering the issues shown across all photos.
   - STRICT: Do NOT mention 'Photo 1', 'Photo 2', 'image', 'picture', or 'camera' in the suggestedTitle or suggestedDescription. It must read directly as a citizen's complaint about the civic issue itself.
   - accuracyPercentage must be between 0 and 100.

Departments:
{deptPrompt}

Types:
{typePrompt}

Return JSON only:
{{
  ""isValidCivicIssue"": <bool>,
  ""isExplicitOrInappropriate"": <bool>,
  ""isImageUnclear"": <bool>,
  ""rejectionReason"": ""<string|null>"",
  ""rejectionReasonLocal"": ""<string|null>"",
  ""departmentId"": <int|null>,
  ""departmentName"": ""<name|null>"",
  ""departmentNameLocal"": ""<name|null>"",
  ""grievanceTypeId"": <int|null>,
  ""grievanceTypeName"": ""<name|null>"",
  ""grievanceTypeNameLocal"": ""<name|null>"",
  ""suggestedTitle"": ""<text|null>"",
  ""suggestedTitleLocal"": ""<text|null>"",
  ""suggestedDescription"": ""<text|null>"",
  ""suggestedDescriptionLocal"": ""<text|null>"",
  ""accuracyPercentage"": <number>
}}";
    }

    /// <summary>
    /// Builds the citizen raw text description refinement prompt.
    /// </summary>
    public static string BuildTextRefinementPrompt(string safeRawText, string deptPrompt, string typePrompt)
    {
        return $@"You are an expert municipal grievance assistant for an Indian Urban Local Body (ULB).
A citizen has provided the following rough, unedited complaint text (it may contain severe spelling mistakes, typos, slang, or informal phrasing):
""{safeRawText}""

Evaluation & Refinement Rules:
1. Examine the citizen's text to determine if it describes a civic/municipal defect (e.g. roads, potholes, garbage, water supply, sewage, illegal parking, street lights, encroachment, unauthorized construction).
   - If the text is purely abusive, spam, gibberish, personal gossip, or completely unrelated to municipal governance:
     - Set isValidCivicIssue to false.
     - Set rejectionReason explicitly explaining why the text cannot be accepted as a civic complaint.
     - Provide rejectionReasonLocal in Marathi.
     - Return null for departmentId and grievanceTypeId.
2. If it is a valid civic issue:
   - Set isValidCivicIssue to true.
   - Correct all spelling mistakes, typos, and grammatical errors.
   - Formulate a formal citizen grievance complaint:
     - suggestedTitle: 4-8 words in English summarizing the civic defect.
     - suggestedTitleLocal: 4-8 words in Marathi.
     - suggestedDescription: 2-3 sentences in clear, formal, polite English directly stating the civic issue and requesting municipal action.
     - suggestedDescriptionLocal: 2-3 sentences in clear, formal Marathi directly stating the civic issue and requesting municipal action.
     - NATURAL CITIZEN VOICE (CRITICAL):
       - NEVER use third-person phrases like 'The citizen is reporting...', 'The citizen states...', 'The resident reports...', 'The user reports...', 'The complainant mentions...', or in Marathi 'नागरिक तक्रार करत आहेत...', 'नागरिकांचे म्हणणे आहे...'. This sounds artificial and AI-generated.
       - Write directly, normally, and naturally as the citizen's own complaint about the issue itself.
       - Example English: 'There is severe illegal parking causing traffic obstruction in our area. Please take necessary action to resolve this issue.' (DO NOT write: 'The citizen is reporting issues related to illegal parking...')
       - Example Marathi: 'या भागात अवैध पार्किंगमुळे रहदारीस मोठा अडथळा निर्माण होत आहे. कृपया ही समस्या सोडवण्यासाठी आवश्यक ती कारवाई करावी.' (DO NOT write: 'नागरिक या भागात अवैध पार्किंगमुळे होणाऱ्या अडथळ्यांबद्दल तक्रार करत आहेत...')
     - Select exactly one active department and one active grievance type from the supplied lists that best matches the issue. The grievance type MUST belong to the selected department.
     - accuracyPercentage must be between 0 and 100.

Departments:
{deptPrompt}

Types:
{typePrompt}

Return JSON only:
{{
  ""isValidCivicIssue"": <bool>,
  ""isExplicitOrInappropriate"": <bool>,
  ""isImageUnclear"": false,
  ""rejectionReason"": ""<string|null>"",
  ""rejectionReasonLocal"": ""<string|null>"",
  ""departmentId"": <int|null>,
  ""departmentName"": ""<name|null>"",
  ""departmentNameLocal"": ""<name|null>"",
  ""grievanceTypeId"": <int|null>,
  ""grievanceTypeName"": ""<name|null>"",
  ""grievanceTypeNameLocal"": ""<name|null>"",
  ""suggestedTitle"": ""<text|null>"",
  ""suggestedTitleLocal"": ""<text|null>"",
  ""suggestedDescription"": ""<text|null>"",
  ""suggestedDescriptionLocal"": ""<text|null>"",
  ""accuracyPercentage"": <number>
}}";
    }

    /// <summary>
    /// Formats active departments into a compact, token-optimized string representation for prompts.
    /// </summary>
    public static string FormatActiveDepartments(IEnumerable<DepartmentCacheItem> departments)
    {
        var sb = new StringBuilder();
        foreach (var department in departments)
        {
            sb.AppendLine($"{department.Id}|{department.DepartmentName}");
        }
        return sb.ToString();
    }

    /// <summary>
    /// Formats active grievance types into a compact, token-optimized string representation for prompts.
    /// </summary>
    public static string FormatActiveTypes(IEnumerable<TypeCacheItem> types)
    {
        var sb = new StringBuilder();
        foreach (var type in types)
        {
            sb.AppendLine($"{type.Id}|{type.GrievanceDepartmentId}|{type.GrievanceType}");
        }
        return sb.ToString();
    }
}
