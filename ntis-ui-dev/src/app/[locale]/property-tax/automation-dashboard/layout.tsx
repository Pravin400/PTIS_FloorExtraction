import { ClientWrapper } from "@/components/modules/property-tax/automation-dashboard/AutomationDashboardClient";
import { getAutomationMainCardsAction, getAutomationWorkflowCardsAction } from "./action";

interface Props {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function Layout({ children }: Props) {
    const [
        mainCardResult,
        workflowCardsResult
    ] = await Promise.all([
        getAutomationMainCardsAction(),
        getAutomationWorkflowCardsAction()
    ])

    return (
        <ClientWrapper
            serverData={mainCardResult?.data}
            workflowCardsData={workflowCardsResult?.data}
        >
            {children}
        </ClientWrapper>
    );
}