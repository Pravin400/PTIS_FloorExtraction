import { notFound } from "next/navigation";
import { fetchUseFactorCVMasterByIdServerAction } from "../../action";
import { UseCategoryFactorEditForm } from "@/components/modules/property-tax/weightage-mastercv/useCategoryCv/UseCategoryFactorEditForm";
import { getAssessmentYearsPagedServerCV } from "@/lib/api/floor-cv-weightageMaster.service";
import { UseFactorCVMaster } from "@/types/useCategoryCvFactor.types";

export default async function EditUseCategoryFactorPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id, locale } = await params;
    const factorId = parseInt(id, 10);

    if (isNaN(factorId)) {
        notFound();
    }

    const response = await fetchUseFactorCVMasterByIdServerAction(factorId);

    if (!response.success || !response.data) {
        notFound();
    }

    const assessmentYearData = await getAssessmentYearsPagedServerCV(1, -1);
    const assessmentYearOptions = assessmentYearData.items
        .filter((year) => year.isActive)
        .map((year) => ({
            label: `${year.fromYear}-${year.toYear}`,
            value: year.id?.toString() || year.yearId?.toString() || "",
        }));

    return (
        <UseCategoryFactorEditForm
            initialData={response.data as UseFactorCVMaster}
            locale={locale}
            assessmentYearOptions={assessmentYearOptions}
        />
    );
}