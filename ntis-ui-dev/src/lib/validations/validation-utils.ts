import { z } from "zod";

type SafeParseResult =
  | { success: true; data?: unknown }
  | { success: false; error: z.ZodError };

export function zodErrorsToRecord(
  result: SafeParseResult
): Record<string, string[]> {
  if (result.success) {
    return {};
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "form";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }

  return errors;
}
