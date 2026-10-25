import { notFound } from "next/navigation";
import { fetchFloorFactorCVMasterByIdServerAction } from "../../action";
import { FloorFactorEditForm } from "@/components/modules/property-tax/weightage-mastercv/floorFactorCv/FloorFactorEditForm";
import { getAssessmentYearsPagedServerCV } from "@/lib/api/floor-cv-weightageMaster.service";

export default async function EditFloorFactorPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = await params;
    const factorId = parseInt(id, 10);
    
    if (isNaN(factorId)) {
        notFound();
    }

    const response = await fetchFloorFactorCVMasterByIdServerAction(factorId);

    if (!response.success || !response.data) {
        notFound();
    }

    const assessmentYearData = await getAssessmentYearsPagedServerCV(1, -1);
    const assessmentYearOptions = assessmentYearData.items
        .filter((year) => year.isActive)
        .map((year) => ({
            label: `${year.fromYear}-${year.toYear}`,
            value: year.id.toString(),
        }));
    
    return (
        <FloorFactorEditForm 
            initialData={response.data} 
            locale={locale} 
            assessmentYearOptions={assessmentYearOptions} 
        />
    );
}
