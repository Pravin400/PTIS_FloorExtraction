import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/utils/api";
import { resolveSearchErrorMessage } from "@/lib/api/property-search/resolve-search-error-message";

describe("resolveSearchErrorMessage", () => {
  it("maps generic ApiError payloads to a friendly message", () => {
    const error = new ApiError(500, "Something went wrong", "Property search failed");

    expect(resolveSearchErrorMessage(error)).toBe(
      "Unable to load search data. Please check your connection and try again."
    );
  });

  it("returns specific validation errors from ApiError.error", () => {
    const error = new ApiError(
      400,
      "Please select a zone before searching.",
      "Property search failed"
    );

    expect(resolveSearchErrorMessage(error)).toBe(
      "Please select a zone before searching."
    );
  });

  it("extracts detail after a context prefix in ApiError.message", () => {
    const error = new ApiError(
      500,
      "An error occurred",
      "Property search failed"
    );

    expect(resolveSearchErrorMessage(error)).toBe(
      "Unable to load search data. Please check your connection and try again."
    );
  });

  it("parses JSON error bodies", () => {
    const error = new Error(
      '{"errors":{"General":"Invalid UPIC ID format."},"message":"Something went wrong"}'
    );

    expect(resolveSearchErrorMessage(error)).toBe("Invalid UPIC ID format.");
  });

  it("returns permission message for 403 ApiError when no detail exists", () => {
    const error = new ApiError(403, "Forbidden", "Property search failed");

    expect(resolveSearchErrorMessage(error)).toBe(
      "You do not have permission to search properties."
    );
  });
});
