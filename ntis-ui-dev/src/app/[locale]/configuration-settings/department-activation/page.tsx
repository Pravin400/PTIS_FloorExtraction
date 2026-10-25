import { departmentActivationService } from "@/lib/api/configuration-settings/department-activation/departmentActivation.service";
import { DepartmentActivationClient } from "@/components/modules/configuration-settings/department-activation/DepartmentActivationClient";

import { PageContainer } from "@/components/common/PageContainer";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DepartmentActivationPage({ params, searchParams }: PageProps) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const searchTerm = (resolvedSearchParams.search as string) || "";
    const departmentId = Number(resolvedSearchParams.departmentId) || 0;

    const t = await getTranslations({ locale, namespace: 'departmentActivation' });

    // Fetch initial departments and modules (if a department is selected for configuration)
    const [deptResponse, moduleResponse] = await Promise.all([
        departmentActivationService.getDepartments(1, 1000),
        departmentId ? departmentActivationService.getModulesByDepartment(departmentId) : Promise.resolve({ success: true, data: [] })
    ]);

    const departments = deptResponse.success ? (deptResponse.data || []) : [];
    const modules = moduleResponse.success ? (moduleResponse.data || []) : [];

    return (
        <PageContainer
            title={t('title')}
            subtitle={t('subtitle')}
            className="text-slate-900 dark:text-slate-900 [color-scheme:light] [&_h1]:text-slate-900 [&_h1]:dark:text-slate-900 [&_p]:text-slate-500 [&_p]:dark:text-slate-500"
        >
            <DepartmentActivationClient 
                initialDepartments={departments}
                initialModules={modules}
                initialSearchTerm={searchTerm}
            />
        </PageContainer>
    );
}
