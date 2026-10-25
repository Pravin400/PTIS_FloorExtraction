import React from "react";
import { BulkAssessmentScreen } from "@/components/modules/property-tax/extended-area-assessment/BulkAssessmentScreen";

/**
 * Section 129A bulk property update — CSV import/export and batch
 * assessment over an in-memory grid (see `useBulkAssessment` /
 * `section129a.ts`) until a real bulk-save API exists.
 */
export default function Page(): React.ReactElement {
  return <BulkAssessmentScreen />;
}
