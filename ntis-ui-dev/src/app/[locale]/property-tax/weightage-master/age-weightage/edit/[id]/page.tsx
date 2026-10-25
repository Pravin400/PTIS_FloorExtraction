import { getAgeFactorCVMasterById } from "@/lib/api/weightagemaster/ageOfBuildingCvFactor/ageFactorCv.service";
import { notFound } from "next/navigation";
import { getAssessmentYearsPagedServerCV } from "@/lib/api/floor-cv-weightageMaster.service";
import { fetchAllAgeFactorsAction } from "../../action";
import { AgeFactorEditForm } from "@/components/modules/property-tax/weightage-mastercv/ageFactorCv/AgeFactorEditForm";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";


export default async function EditAgeWeightagePage({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = await params;
    const factorId = parseInt(id, 10);

    if (isNaN(factorId)) {
        notFound();
    }

    const response = await getAgeFactorCVMasterById(factorId);

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

    const allAgeFactors: AgeFactorCVMaster[] = await fetchAllAgeFactorsAction();

    return (
        <AgeFactorEditForm
            initialData={response.data}
            locale={locale}
            assessmentYearOptions={assessmentYearOptions}
            allAgeFactors={allAgeFactors}
        />
    );





} 