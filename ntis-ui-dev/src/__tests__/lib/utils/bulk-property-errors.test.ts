import { describe, it, expect } from "vitest";
import { 
  parseBulkPropertyErrors, 
  formatBulkPropertyErrors,
  ParsedBulkPropertyError 
} from "@/lib/utils/bulk-property-errors";

// Mock translation function
const createMockTranslation = () => {
  const translations: Record<string, string> = {
    "partitionForm.wing.generate.errors.title": "Property Generation Failed",
    "partitionForm.wing.generate.errors.criticalErrorTitle": "Critical Error",
    "partitionForm.wing.generate.errors.duplicateErrorTitle": "Duplicate Records Found",
    "partitionForm.wing.generate.errors.genericError": "An error occurred while generating properties.",
    "partitionForm.wing.generate.errors.failedToCreate": "{count} properties failed to create.",
    "partitionForm.wing.generate.errors.buildingNotFound": "Building details could not be found. Please verify the selected building and try again.",
    "partitionForm.wing.generate.errors.invalidCategory": "Selected property category is invalid. Please select a valid category.",
    "partitionForm.wing.generate.errors.societyWingMissing": "Society wing details are required for apartment properties.",
    "partitionForm.wing.generate.errors.duplicatePartitionSingle": "Partition {partition} already exists in the selected wing.",
    "partitionForm.wing.generate.errors.duplicatePartitionMultiple": "The following partitions already exist in this wing: {partitions}.",
    "partitionForm.wing.generate.errors.duplicateFlatSingle": "Flat number {flat} already exists in the selected wing.",
    "partitionForm.wing.generate.errors.duplicateFlatNumbers": "Flat numbers {flats} already exist in the selected wing.",
    "partitionForm.wing.generate.errors.repositoryError": "Row {row}: {message}.",
    "partitionForm.wing.generate.errors.unknownErrorAtRow": "An unexpected error occurred while creating property at row {row}.",
    "partitionForm.wing.generate.errors.transactionFailure": "Property creation failed due to a system error. Please try again later.",
  };

  return (key: string, params?: Record<string, string | number>) => {
    let result = translations[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        result = result.replace(`{${paramKey}}`, String(value));
      });
    }
    return result;
  };
};

describe("parseBulkPropertyErrors", () => {
  const t = createMockTranslation();

  it("should return generic error for empty errors array", () => {
    const result = parseBulkPropertyErrors([], t);
    
    expect(result.title).toBe("Property Generation Failed");
    expect(result.messages).toContain("An error occurred while generating properties.");
    expect(result.severity).toBe("error");
  });

  it("should return failed count message when no errors but failedCount provided", () => {
    const result = parseBulkPropertyErrors([], t, 4);
    
    expect(result.title).toBe("Property Generation Failed");
    expect(result.messages).toContain("4 properties failed to create.");
    expect(result.severity).toBe("error");
  });

  it("should parse Building Not Found error", () => {
    const errors = ["Building Not Found"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Building details could not be found. Please verify the selected building and try again.");
    expect(result.title).toBe("Critical Error");
    expect(result.severity).toBe("error");
  });

  it("should parse Invalid CategoryId error", () => {
    const errors = ["Invalid CategoryId - category not found."];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Selected property category is invalid. Please select a valid category.");
    expect(result.severity).toBe("error");
  });

  it("should parse Society Wing Details Missing error", () => {
    const errors = ["Society Wing Details is not Found"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Society wing details are required for apartment properties.");
  });

  it("should parse single duplicate partition error", () => {
    const errors = ["123-A1 this property Partition already exits in this wing"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Partition A1 already exists in the selected wing.");
    expect(result.title).toBe("Duplicate Records Found");
    expect(result.severity).toBe("warning");
  });

  it("should parse single duplicate partition error with exists spelling", () => {
    const errors = ["123-A1 this property Partition already exists in this wing"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Partition A1 already exists in the selected wing.");
  });

  it("should parse multiple duplicate partitions error", () => {
    const errors = ["123-A1,A2,A3 this property Partition already exits in this wing"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("The following partitions already exist in this wing: A1, A2, A3.");
    expect(result.severity).toBe("warning");
  });

  it("should parse single flat number error - swagger format", () => {
    // This is the exact format from swagger: "101 this property flat already exits in this wing"
    const errors = ["101 this property flat already exits in this wing"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Flat number 101 already exists in the selected wing.");
    expect(result.title).toBe("Duplicate Records Found");
    expect(result.severity).toBe("warning");
  });

  it("should parse multiple duplicate flat numbers error", () => {
    const errors = ["101,102 this property flat already exits in this wing"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Flat numbers 101, 102 already exist in the selected wing.");
    expect(result.severity).toBe("warning");
  });

  it("should parse duplicate flat numbers error with exists spelling", () => {
    const errors = ["101,102 this property flat already exists in this wing"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Flat numbers 101, 102 already exist in the selected wing.");
  });

  it("should parse repository error with row number", () => {
    const errors = ["5: Invalid floor configuration"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Row 5: Invalid floor configuration.");
  });

  it("should parse unknown error with row number", () => {
    const errors = ["3: Unknown error"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("An unexpected error occurred while creating property at row 3.");
  });

  it("should parse transaction failure error", () => {
    const errors = ["Transaction failed: Database timeout"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Property creation failed due to a system error. Please try again later.");
    expect(result.severity).toBe("error");
  });

  it("should deduplicate repeated error messages", () => {
    const errors = [
      "Building Not Found",
      "Building Not Found",
      "Building Not Found"
    ];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages.length).toBe(1);
  });

  it("should handle multiple different errors", () => {
    const errors = [
      "Building Not Found",
      "101,102 this property flat already exits in this wing",
      "5: Invalid floor configuration"
    ];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages.length).toBe(3);
    expect(result.severity).toBe("error"); // Critical error takes precedence
  });

  it("should return original error if no pattern matches", () => {
    const errors = ["Some unknown error format"];
    const result = parseBulkPropertyErrors(errors, t);
    
    expect(result.messages).toContain("Some unknown error format");
  });
});

describe("formatBulkPropertyErrors", () => {
  it("should return single message as-is", () => {
    const parsed: ParsedBulkPropertyError = {
      title: "Error",
      messages: ["Single error message"],
      severity: "error"
    };
    
    const result = formatBulkPropertyErrors(parsed);
    expect(result).toBe("Single error message");
  });

  it("should format multiple messages with numbering", () => {
    const parsed: ParsedBulkPropertyError = {
      title: "Error",
      messages: ["First error", "Second error", "Third error"],
      severity: "error"
    };
    
    const result = formatBulkPropertyErrors(parsed);
    expect(result).toBe("1. First error\n2. Second error\n3. Third error");
  });
});
