import { describe, it, expect } from "vitest";
import en from "@/i18n/locales/en/chargeHeads.json";
import mr from "@/i18n/locales/mr/chargeHeads.json";
import hi from "@/i18n/locales/hi/chargeHeads.json";

function extractPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  let paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? prefix + "." + key : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      paths = paths.concat(extractPaths(value as Record<string, unknown>, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  return paths.sort();
}

describe("Charge Heads Translation Key Parity", () => {
  it("guarantees 100% key parity across all three languages (en, mr, hi)", () => {
    const enPaths = extractPaths(en as unknown as Record<string, unknown>);
    const mrPaths = extractPaths(mr as unknown as Record<string, unknown>);
    const hiPaths = extractPaths(hi as unknown as Record<string, unknown>);

    expect(mrPaths).toEqual(enPaths);
    expect(hiPaths).toEqual(enPaths);
  });
});
