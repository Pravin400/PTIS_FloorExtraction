import RateSectionForm from '@/components/modules/property-tax/rate-section-master/ratesection/RateSectionForm';
import React from "react";

export default async function AddPage(): Promise<React.ReactElement> {
  return <RateSectionForm mode="add" existingRates={[]} initialData={undefined} />;
}
