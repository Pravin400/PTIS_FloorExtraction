/**
 * Utility for parsing bulk property creation errors from the backend
 * and converting them to user-friendly localized messages.
 */

export interface ParsedBulkPropertyError {
  title: string;
  messages: string[];
  severity: "error" | "warning";
}

export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Parse a single error message and return the appropriate translation key and params
 * Backend error formats from swagger:
 * - "101 this property flat already exits in this wing" (single flat)
 * - "101,102 this property flat already exits in this wing" (multiple flats)
 * - "1-A11 this property Partition already exits in this wing" (single partition)
 * - "Building Not Found"
 * - "Invalid CategoryId - category not found."
 * - "Society Wing Details is not Found"
 * - "Transaction failed: ..."
 * - "5: Invalid floor configuration" (row error)
 */
function parseErrorMessage(
  error: string,
  t: TranslationFunction
): { message: string; type: "critical" | "duplicate" | "other" } {
  const trimmedError = error.trim();
  
  // Building Not Found
  if (/^Building Not Found$/i.test(trimmedError)) {
    return {
      message: t("partitionForm.wing.generate.errors.buildingNotFound"),
      type: "critical"
    };
  }
  
  // Invalid Category
  if (/^Invalid CategoryId/i.test(trimmedError)) {
    return {
      message: t("partitionForm.wing.generate.errors.invalidCategory"),
      type: "critical"
    };
  }
  
  // Society Wing Details Missing
  if (/^Society Wing Details is not Found$/i.test(trimmedError)) {
    return {
      message: t("partitionForm.wing.generate.errors.societyWingMissing"),
      type: "critical"
    };
  }
  
  // Transaction Failure
  if (/^Transaction failed/i.test(trimmedError)) {
    return {
      message: t("partitionForm.wing.generate.errors.transactionFailure"),
      type: "critical"
    };
  }
  
  // Duplicate Partition: "1-A11 this property Partition already exits in this wing"
  // Pattern: propertyNo-partitions + " this property Partition already exits/exists in this wing"
  const partitionMatch = trimmedError.match(/^(.+?)\s+this property Partition already (?:exits|exists) in this wing$/i);
  if (partitionMatch) {
    const partitionsPart = partitionMatch[1];
    // Extract partitions - could be "1-A11" or "1-A11,A12,A13"
    const dashIndex = partitionsPart.lastIndexOf("-");
    let partitions: string[];
    
    if (dashIndex !== -1) {
      // Extract everything after the last dash (e.g., "1-A11" -> "A11", "1-A11,A12" -> "A11,A12")
      partitions = partitionsPart.substring(dashIndex + 1).split(",").map(p => p.trim()).filter(Boolean);
    } else {
      // No dash, split by comma
      partitions = partitionsPart.split(",").map(p => p.trim()).filter(Boolean);
    }
    
    if (partitions.length === 1) {
      return {
        message: t("partitionForm.wing.generate.errors.duplicatePartitionSingle", { partition: partitions[0] }),
        type: "duplicate"
      };
    } else {
      return {
        message: t("partitionForm.wing.generate.errors.duplicatePartitionMultiple", { partitions: partitions.join(", ") }),
        type: "duplicate"
      };
    }
  }
  
  // Duplicate Flat: "101 this property flat already exits in this wing" or "101,102 this property flat..."
  const flatMatch = trimmedError.match(/^(.+?)\s+this property flat already (?:exits|exists) in this wing$/i);
  if (flatMatch) {
    const flatsPart = flatMatch[1];
    const flats = flatsPart.split(",").map(f => f.trim()).filter(Boolean);
    
    if (flats.length === 1) {
      return {
        message: t("partitionForm.wing.generate.errors.duplicateFlatSingle", { flat: flats[0] }),
        type: "duplicate"
      };
    } else {
      return {
        message: t("partitionForm.wing.generate.errors.duplicateFlatNumbers", { flats: flats.join(", ") }),
        type: "duplicate"
      };
    }
  }
  
  // Unknown Error with row number (e.g., "3: Unknown error")
  const unknownMatch = trimmedError.match(/^(\d+):\s*Unknown error$/i);
  if (unknownMatch) {
    return {
      message: t("partitionForm.wing.generate.errors.unknownErrorAtRow", { row: unknownMatch[1] }),
      type: "other"
    };
  }
  
  // Repository Error with row number (e.g., "5: Invalid floor configuration")
  const repoMatch = trimmedError.match(/^(\d+):\s*(.+)$/);
  if (repoMatch) {
    return {
      message: t("partitionForm.wing.generate.errors.repositoryError", { row: repoMatch[1], message: repoMatch[2] }),
      type: "other"
    };
  }
  
  // If no pattern matches, return the original error
  return {
    message: trimmedError,
    type: "other"
  };
}

/**
 * Parse an array of bulk property errors and return user-friendly messages
 * 
 * @param errors - Array of error strings from the backend
 * @param t - Translation function from next-intl
 * @param failedCount - Optional failed count for additional context
 * @returns ParsedBulkPropertyError object with title, messages, and severity
 */
export function parseBulkPropertyErrors(
  errors: string[],
  t: TranslationFunction,
  failedCount?: number
): ParsedBulkPropertyError {
  if (!errors || errors.length === 0) {
    // No errors array, use failed count if available
    if (failedCount && failedCount > 0) {
      return {
        title: t("partitionForm.wing.generate.errors.title"),
        messages: [t("partitionForm.wing.generate.errors.failedToCreate", { count: failedCount })],
        severity: "error",
      };
    }
    return {
      title: t("partitionForm.wing.generate.errors.title"),
      messages: [t("partitionForm.wing.generate.errors.genericError")],
      severity: "error",
    };
  }
  
  // Parse all errors and deduplicate
  const parsedMessages = new Set<string>();
  let hasCriticalError = false;
  let hasDuplicateError = false;
  
  for (const error of errors) {
    const parsed = parseErrorMessage(error, t);
    parsedMessages.add(parsed.message);
    
    if (parsed.type === "critical") {
      hasCriticalError = true;
    } else if (parsed.type === "duplicate") {
      hasDuplicateError = true;
    }
  }
  
  // Determine title and severity based on error types
  const messageArray = Array.from(parsedMessages);
  
  let title: string;
  let severity: "error" | "warning";
  
  if (hasCriticalError) {
    title = t("partitionForm.wing.generate.errors.criticalErrorTitle");
    severity = "error";
  } else if (hasDuplicateError) {
    title = t("partitionForm.wing.generate.errors.duplicateErrorTitle");
    severity = "warning";
  } else {
    title = t("partitionForm.wing.generate.errors.title");
    severity = "error";
  }
  
  return {
    title,
    messages: messageArray,
    severity,
  };
}

/**
 * Format parsed errors for display in a toast or alert
 * 
 * @param parsed - Parsed bulk property error object
 * @returns Formatted string suitable for display
 */
export function formatBulkPropertyErrors(parsed: ParsedBulkPropertyError): string {
  if (parsed.messages.length === 1) {
    return parsed.messages[0];
  }
  return parsed.messages.map((msg, idx) => `${idx + 1}. ${msg}`).join("\n");
}
