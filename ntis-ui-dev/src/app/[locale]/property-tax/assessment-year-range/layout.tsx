import { Suspense } from "react";
import { AssessmentYearRangeLayoutContent } from "@/components/modules/property-tax/assessment-year-range/AssessmentYearRangeLayoutContent";
import { AssessmentYearRangeErrorProvider } from "@/components/modules/property-tax/assessment-year-range/AssessmentYearRangeErrorContext";

export default function AssessmentYearRangeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AssessmentYearRangeErrorProvider>
      <Suspense
        fallback={
          <div
            className="flex items-center justify-center p-6"
            aria-busy="true"
            aria-live="polite"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        }
      >
        <AssessmentYearRangeLayoutContent>
          {children}
        </AssessmentYearRangeLayoutContent>
      </Suspense>
    </AssessmentYearRangeErrorProvider>
  );
}
