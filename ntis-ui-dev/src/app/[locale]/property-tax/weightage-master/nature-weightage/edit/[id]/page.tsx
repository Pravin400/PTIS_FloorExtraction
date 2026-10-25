import { notFound } from "next/navigation";
import { fetchNatureFactorCVMasterByIdServerAction } from "../../actions";
import { NatureFactorEditForm } from "@/components/modules/property-tax/weightage-mastercv/natureFactorCv/NatureFactorEditForm";
import { getAssessmentYearsPagedServerCV } from "@/lib/api/natureofbuilding-cv-weightageMaster.service";
import { NatureFactorCVMaster } from "@/types/natureofbuilding-cv-weightageMaster.types";

export default async function EditNatureFactorPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = await params;
    const factorId = parseInt(id, 10);
    
    if (isNaN(factorId)) {
        notFound();
    }

    const response = await fetchNatureFactorCVMasterByIdServerAction(factorId);

    if (!response.success || !response.data) {
        notFound();
    }

    const assessmentYearData = await getAssessmentYearsPagedServerCV(1, -1);
    const assessmentYearOptions = assessmentYearData.items
        .filter((year) => year.isActive)
        .map((year) => ({
            label: `${year.fromYear}-${year.toYear}`,
            value: year.yearId?.toString() || year.id?.toString() || "",
        }));
    
    return (
        <NatureFactorEditForm 
            initialData={response.data as NatureFactorCVMaster} 
            locale={locale} 
            assessmentYearOptions={assessmentYearOptions} 
        />
    );
}
