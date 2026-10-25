import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import AgeFactorCvBuilding from "@/components/modules/property-tax/weightage-mastercv/ageFactorCv/AgeFactorCvBuilding";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => ({ get: vi.fn() }),
}));

vi.mock("next-intl", () => ({
    useLocale: () => "en",
    useTranslations: () => (key: string) => key,
}));

// Mock the child component to simplify testing the wrapper
vi.mock("@/components/modules/property-tax/weightage-mastercv/ageFactorCv/AgeFactorCvWeightageMaster", () => ({
    default: (props: { data: AgeFactorCVMaster[] }) => <div data-testid="age-factor-master">{JSON.stringify(props.data.length)}</div>
}));

describe("AgeFactorCvBuilding Wrapper", () => {
    const mockProps = {
        data: [{ id: 1 }] as AgeFactorCVMaster[],
        pageNumber: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        assessmentYearOptions: [],
        constructionTypeOptions: [],
        ageRangeOptions: [],
        allAgeFactors: []
    };

    it("renders AgeFactorCvWeightageMaster with provided props", () => {
        render(<AgeFactorCvBuilding {...mockProps} />);
        const child = screen.getByTestId("age-factor-master");
        expect(child).toBeInTheDocument();
        expect(child.textContent).toBe("1");
    });
});
