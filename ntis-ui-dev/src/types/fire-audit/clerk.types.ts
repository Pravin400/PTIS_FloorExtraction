export type ClerkStageStatus =
    | "scrutiny_pending"
    | "survey_scheduled"
    | "review_forward"
    | "compliance_pending"
    | "reinspection"
    | "certified"
    | "rejected";

export type SlaUrgency = "critical" | "urgent" | "normal";

export interface ClerkMetricSummary {
    allApplications: number;
    scrutinyPending: number;
    surveyScheduled: number;
    reviewForward: number;
    compliancePending: number;
    reinspectionCases: number;
    certifiedCleared: number;
    rejectedApplications: number;
}

export interface ClerkApplicationItem extends Record<string, unknown> {
    id: string; // e.g. "SMC-FA-2026-0177"
    appId: string; // e.g. "FAS-2026-8943"
    buildingName: string; // e.g. "Market Arcade"
    occupancyGroup: string; // e.g. "Group F"
    occupancyName: string; // e.g. "Commercial Shopping Complex"
    applicantName: string; // e.g. "Mr. Sunil Narang"
    councilCode: string; // e.g. "AMC 1177"
    submissionDate: string; // e.g. "24-Sep-2026"
    submissionTime: string; // e.g. "10:30 AM"
    slaRemaining: string; // e.g. "01h 45m"
    slaUrgency: SlaUrgency;
    status: ClerkStageStatus;
    statusLabel: string;
    isToday: boolean;
    isOverdue?: boolean;
    actionType: "scrutinize" | "view_survey" | "review_report" | "view";
    modalDetail?: {
        address: string;
        complianceInfo: string;
        assignedOfficer: string;
        deficienciesStatus: string;
        journeyStep: number;
        journeySubtitle?: string;
    };
    appType?: "new" | "renewal" | "reinspection" | string;
    node?: string;
    sector?: string;
    wardNo?: string;
    riskCategory?: string;
    appDate?: string;
}

export type ClerkActivityCategory = "application" | "scrutiny" | "survey" | "general";
export type ClerkActivityTimePeriod = "today" | "week" | "earlier";

export interface ClerkRecentActivityItem {
    id: string;
    title: string;
    building: string;
    timestamp: string; // User-facing localized relative string (e.g. "10 mins ago")
    category?: ClerkActivityCategory; // Reliable enum for icon rendering (optional for safe fallback)
    timePeriod?: ClerkActivityTimePeriod; // Reliable enum for tab filtering (optional for safe fallback)
    type: "success" | "info" | "warning" | "danger" | "neutral";
}


export interface ClerkFilterParams {
    tab?: "all" | "today";
    search?: string;
    occupancy?: string;
    statusFilter?: string;
    appType?: string;
    node?: string;
    sector?: string;
    wardNo?: string;
    appDate?: string;
    riskCategory?: string;
    page?: number;
    pageSize?: number;
}


export interface ClerkDashboardData {
    metrics: ClerkMetricSummary;
    applications: ClerkApplicationItem[];
    totalApplications: number;
    recentActivity: ClerkRecentActivityItem[];
}
