import { MainCardsData, WorkflowCardData } from "@/types/automation-dashboard/automation-maincard/automation-maincart.type";

export interface TabData {
    structure: string;
    unit: string;
}

export interface DashboardServerData {
    registered: { structure: string; unit: string; demand: string };
    approved: {
        assessed: { structure: string; units: string; demand: string };
        unassessed: { structure: string; units: string; demand: string };
    };
    revenue: { structure: string; unit: string; demand: string };
}

export interface Props {
    children: React.ReactNode;
    serverData?: MainCardsData | null;
    workflowCardsData?: WorkflowCardData[] | null;
}
