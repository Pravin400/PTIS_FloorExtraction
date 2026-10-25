import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyNumberOptions } from "@/hooks/PropertyMedia/uploadDownload/usePropertyNumberOptions";
import * as serverActions from "@/app/[locale]/property-tax/property-media/action";

vi.mock("@/app/[locale]/property-tax/property-media/action", () => ({
    fetchPropertyNumbersAction: vi.fn(),
}));

describe("usePropertyNumberOptions", () => {
    const stableWard = ["WardA"];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Fetching Property From Options", () => {
        it("clears propertyFromOptions if zone is undefined", async () => {
            const { result } = renderHook(() =>
                usePropertyNumberOptions({ zone: undefined, ward: stableWard })
            );

            expect(result.current.propertyFromOptions).toEqual([]);
            expect(result.current.isLoadingPropertyFrom).toBe(false);
        });

        it("fetches propertyFrom options when zone is provided", async () => {
            const mockNumbers = ["PROP-1", "PROP-2", "PROP-3"];
            const spyAction = vi.spyOn(serverActions, "fetchPropertyNumbersAction").mockResolvedValue(mockNumbers);

            const { result } = renderHook(() =>
                usePropertyNumberOptions({ zone: "Zone1", ward: stableWard })
            );

            await waitFor(() => {
                expect(result.current.propertyFromOptions).toEqual(mockNumbers);
            });

            expect(spyAction).toHaveBeenCalledWith({
                divisionId: "Zone1",
                wardIds: stableWard,
            });
            expect(result.current.isLoadingPropertyFrom).toBe(false);
        });

        it("handles error gracefully by clearing propertyFromOptions", async () => {
            vi.spyOn(serverActions, "fetchPropertyNumbersAction").mockRejectedValue(new Error("Fetch failed"));

            const { result } = renderHook(() =>
                usePropertyNumberOptions({ zone: "Zone1", ward: stableWard })
            );

            await waitFor(() => {
                expect(result.current.isLoadingPropertyFrom).toBe(false);
            });

            expect(result.current.propertyFromOptions).toEqual([]);
        });
    });

    describe("Fetching Property To Options", () => {
        it("fetches propertyTo options when propertyFrom is selected", async () => {
            const mockToNumbers = ["PROP-2", "PROP-3"];
            const spyAction = vi.spyOn(serverActions, "fetchPropertyNumbersAction").mockImplementation(
                async (params) => {
                    if (params?.fromPropertyNo) {
                        return mockToNumbers;
                    }
                    return ["PROP-1", "PROP-2", "PROP-3"];
                }
            );

            const { result } = renderHook(() =>
                usePropertyNumberOptions({
                    zone: "Zone1",
                    ward: stableWard,
                    propertyFrom: "PROP-1",
                })
            );

            await waitFor(() => {
                expect(result.current.propertyToOptions).toEqual(mockToNumbers);
            });

            expect(spyAction).toHaveBeenCalledWith({
                divisionId: "Zone1",
                wardIds: stableWard,
                fromPropertyNo: "PROP-1",
            });
            expect(result.current.isLoadingPropertyTo).toBe(false);
        });
    });

    describe("Reset Functions", () => {
        it("resets property options via resetAllPropertyOptions and resetPropertyToOptions", async () => {
            const { result } = renderHook(() => usePropertyNumberOptions({}));

            act(() => {
                result.current.setPropertyFromOptions(["P1"]);
                result.current.setPropertyToOptions(["P2"]);
            });

            expect(result.current.propertyFromOptions).toEqual(["P1"]);
            expect(result.current.propertyToOptions).toEqual(["P2"]);

            act(() => {
                result.current.resetPropertyToOptions();
            });
            expect(result.current.propertyToOptions).toEqual([]);

            act(() => {
                result.current.resetAllPropertyOptions();
            });
            expect(result.current.propertyFromOptions).toEqual([]);
            expect(result.current.propertyToOptions).toEqual([]);
        });
    });
});
