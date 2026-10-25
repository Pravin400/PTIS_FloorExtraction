import { describe, expect, it } from "vitest";
import { buildPropertySearchPayload } from "@/lib/api/property-search/build-search-payload";
import { INITIAL_SEARCH_CRITERIA } from "@/components/modules/property-tax/search-property/constants";

describe("buildPropertySearchPayload", () => {
  it("maps property type to PropertyAssessmentStatusId", () => {
    const payload = buildPropertySearchPayload(
      null,
      { ...INITIAL_SEARCH_CRITERIA, propertyType: "1" },
      true,
      "quick-search"
    );

    expect(payload.propertyAssessmentStatusId).toBe(1);
    expect(payload.dashboardFilter).toBe(0);
    expect(payload.pageSize).toBe(-1);
  });

  it("does not send dashboard filter from type filter when assessment status is selected", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        propertyType: "1",
        typeFilter: "dataEntry",
      },
      true,
      "quick-search"
    );

    expect(payload.propertyAssessmentStatusId).toBe(1);
    expect(payload.dashboardFilter).toBe(0);
  });

  it("still maps type filter to dashboard filter when assessment status is not selected", () => {
    const payload = buildPropertySearchPayload(
      null,
      { ...INITIAL_SEARCH_CRITERIA, typeFilter: "dataEntry" },
      true,
      "quick-search"
    );

    expect(payload.propertyAssessmentStatusId).toBeUndefined();
    expect(payload.dashboardFilter).toBe(3);
  });

  it("maps values-dues top RV search to valuationMethod, filterType, and topCount", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "rv",
        rateableValueFilter: "top",
        rateableValueFrom: "5",
      },
      true,
      "values-dues"
    );

    expect(payload.valuationMethod).toBe("RV");
    expect(payload.filterType).toBe("top");
    expect(payload.topCount).toBe(5);
    expect(payload.amountValue).toBeUndefined();
    expect(payload.amountTo).toBeUndefined();
    expect(payload.pageSize).toBe(-1);
    expect(payload.pageNumber).toBe(1);
  });

  it("maps values-dues between search to amountValue and amountTo", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "cv",
        rateableValueFilter: "between",
        rateableValueFrom: "10,000",
        rateableValueTo: "50,000",
      },
      true,
      "values-dues"
    );

    expect(payload.valuationMethod).toBe("CV");
    expect(payload.filterType).toBe("between");
    expect(payload.amountValue).toBe(10000);
    expect(payload.amountTo).toBe(50000);
    expect(payload.topCount).toBeUndefined();
  });

  it("omits filterType and amounts when between search has missing/invalid inputs", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "cv",
        rateableValueFilter: "between",
        rateableValueFrom: "10,000",
        rateableValueTo: "", // missing
      },
      true,
      "values-dues"
    );

    expect(payload.valuationMethod).toBe("CV");
    expect(payload.filterType).toBeUndefined();
    expect(payload.amountValue).toBeUndefined();
    expect(payload.amountTo).toBeUndefined();
  });

  it("maps values-dues exact value search to amountValue", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "totalTax",
        rateableValueFilter: "exact",
        rateableValueFrom: "1,500.50",
      },
      true,
      "values-dues"
    );

    expect(payload.valuationMethod).toBe("Total Tax");
    expect(payload.filterType).toBe("exact value");
    expect(payload.amountValue).toBe(1500.50);
    expect(payload.amountTo).toBeUndefined();
  });

  it("omits filterType and amountValue when exact value search has missing/invalid input", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "totalTax",
        rateableValueFilter: "exact",
        rateableValueFrom: "", // missing
      },
      true,
      "values-dues"
    );

    expect(payload.valuationMethod).toBe("Total Tax");
    expect(payload.filterType).toBeUndefined();
    expect(payload.amountValue).toBeUndefined();
  });

  it("omits propertyNoFrom and propertyNoTo from payload when they are different (range search)", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        propertyNoFrom: "50",
        propertyNoTo: "100",
      },
      true,
      "quick-search"
    );

    expect(payload.propertyNoFrom).toBeUndefined();
    expect(payload.propertyNoTo).toBeUndefined();
  });

  it("keeps propertyNoFrom and propertyNoTo in payload when only propertyNoFrom is provided", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        propertyNoFrom: "100",
        propertyNoTo: "",
      },
      true,
      "quick-search"
    );

    expect(payload.propertyNoFrom).toBe("100");
    expect(payload.propertyNoTo).toBe("100");
  });

  it("keeps propertyNoFrom and propertyNoTo in payload when they are equal", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        propertyNoFrom: "100",
        propertyNoTo: "100",
      },
      true,
      "quick-search"
    );

    expect(payload.propertyNoFrom).toBe("100");
    expect(payload.propertyNoTo).toBe("100");
  });

  it("keeps base propertyNo in payload for numeric-only property with partition (e.g. 10-C)", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        propertyNoFrom: "10-C",
        propertyNoTo: "10-C",
      },
      true,
      "quick-search"
    );

    expect(payload.propertyNoFrom).toBe("10");
    expect(payload.propertyNoTo).toBe("10");
  });

  it("keeps full propertyNo in payload for alphanumeric prefix (e.g. NK-10)", () => {
    const payload = buildPropertySearchPayload(
      null,
      {
        ...INITIAL_SEARCH_CRITERIA,
        propertyNoFrom: "NK-10",
        propertyNoTo: "NK-10",
      },
      true,
      "quick-search"
    );

    expect(payload.propertyNoFrom).toBe("NK-10");
    expect(payload.propertyNoTo).toBe("NK-10");
  });


});
