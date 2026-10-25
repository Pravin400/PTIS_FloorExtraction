import {
    ClerkApplicationItem,
    ClerkMetricSummary,
    ClerkFilterParams,
} from "@/types/fire-audit/clerk.types";

export const CLERK_STATIC_APPLICATIONS: ClerkApplicationItem[] = [
    // 1. SLA Overdue (Appears at TOP with Soft Red Highlight)
    {
        id: "SMC-FA-2026-0182",
        appId: "FAS-2026-8812",
        buildingName: "Metro Tech Logistics Hub",
        occupancyGroup: "Group J",
        occupancyName: "Hazardous Logistics & Fuel Storage",
        applicantName: "Mr. Harish Chandra",
        councilCode: "AMC 1184",
        submissionDate: "24-Sep-2026",
        submissionTime: "10:30 AM",
        slaRemaining: "Breached (-04h 30m)",
        slaUrgency: "critical",
        status: "scrutiny_pending",
        statusLabel: "SLA Overdue",
        isToday: false,
        isOverdue: true,
        actionType: "view",
        appType: "renewal",
        node: "south",
        sector: "sec_1",
        wardNo: "ward_1",
        riskCategory: "high",
        modalDetail: {
            address: "Sector 18, Phase 2 Logistics Park, Vashi Corridor",
            complianceInfo: "Fee: Paid (₹65,000) • High Risk Category",
            assignedOfficer: "Unassigned (Breached Clerk SLA)",
            deficienciesStatus: "Critical — Escalated for Immediate Scrutiny",
            journeyStep: 2,
            journeySubtitle: "SLA Breached (Action Required Now)",
        },
    },

    // 2. Fresh Application (Normal white row, Emerald Green Start Scrutiny Button)
    {
        id: "SMC-FA-2026-0250",
        appId: "FAS-2026-9041",
        buildingName: "Shreeji Logistics Park",
        occupancyGroup: "Group G",
        occupancyName: "Industrial Storage Warehouse",
        applicantName: "Shreeji Warehousing Services",
        councilCode: "AMC 1250",
        submissionDate: "Today, 24-Sep-2026",
        submissionTime: "10:30 AM",
        slaRemaining: "24h 00m",
        slaUrgency: "normal",
        status: "scrutiny_pending",
        statusLabel: "Scrutiny Pending",
        isToday: true,
        actionType: "scrutinize",
        appType: "new",
        node: "north",
        sector: "sec_2",
        wardNo: "ward_2",
        riskCategory: "medium",
        modalDetail: {
            address: "Plot 120, MIDC Phase 2, Industrial Belt",
            complianceInfo: "Fee: Paid (₹40,000) • Standard SLA",
            assignedOfficer: "To be assigned upon Scrutiny",
            deficienciesStatus: "Pending Initial Verification",
            journeyStep: 2,
            journeySubtitle: "With Clerk",
        },
    },

    // 3. Processed by Clerk & Rejected (Rose/Red Outline Button)
    {
        id: "SMC-FA-2026-0195",
        appId: "FAS-2026-8920",
        buildingName: "The Regent 5-Star Hotel",
        occupancyGroup: "Group A/D",
        occupancyName: "Commercial Hotel & Assembly",
        applicantName: "Mr. Vikramaditya Oberoi",
        councilCode: "AMC 1195",
        submissionDate: "22-Sep-2026",
        submissionTime: "11:15 AM",
        slaRemaining: "Completed",
        slaUrgency: "normal",
        status: "rejected",
        statusLabel: "Scrutiny Rejected",
        isToday: false,
        actionType: "view",
        appType: "new",
        node: "central",
        sector: "sec_1",
        wardNo: "ward_1",
        riskCategory: "high",
        modalDetail: {
            address: "Plot 45, Marine Drive Promenade, Ward A",
            complianceInfo: "Fee: Paid (₹1,20,000) • Critical Deficiencies",
            assignedOfficer: "Scrutiny Officer: S. Pathare",
            deficienciesStatus: "Rejected: Staircase Pressurization System Missing",
            journeyStep: 3,
            journeySubtitle: "Rejected by Scrutiny Clerk",
        },
    },

    // 4. Scrutiny Passed -> Surveyor Assigned (Sky Blue Outline Button)
    {
        id: "SMC-FA-2026-0205",
        appId: "FAS-2026-8955",
        buildingName: "Silver Oak Commercial Complex",
        occupancyGroup: "Group F",
        occupancyName: "Mercantile Retail Hub",
        applicantName: "Mr. Ramesh Gupta",
        councilCode: "AMC 1205",
        submissionDate: "23-Sep-2026",
        submissionTime: "09:30 AM",
        slaRemaining: "03d 12h",
        slaUrgency: "normal",
        status: "survey_scheduled",
        statusLabel: "Surveyor Assigned",
        isToday: false,
        actionType: "view_survey",
        appType: "renewal",
        node: "south",
        sector: "sec_2",
        wardNo: "ward_3",
        riskCategory: "low",
        modalDetail: {
            address: "Sector 14, Main Arterial Road, Nerul",
            complianceInfo: "Fee: Paid (₹50,000) • Low Risk Category",
            assignedOfficer: "Lead Surveyor: Insp. Rajesh Shinde",
            deficienciesStatus: "Checklist Verified • Site Audit Scheduled: 28-Sep-2026",
            journeyStep: 3,
            journeySubtitle: "Survey Scheduled",
        },
    },

    // 5. Surveyor Sent Report -> Clerk Verify Pending (Purple/Indigo Button)
    {
        id: "SMC-FA-2026-0218",
        appId: "FAS-2026-8988",
        buildingName: "Horizon IT Tech Park Tower B",
        occupancyGroup: "Group E",
        occupancyName: "Business IT & Corporate Offices",
        applicantName: "Ms. Neha Singhania",
        councilCode: "AMC 1218",
        submissionDate: "24-Sep-2026",
        submissionTime: "02:15 PM",
        slaRemaining: "05h 45m",
        slaUrgency: "urgent",
        status: "review_forward",
        statusLabel: "Verify Report Pending",
        isToday: false,
        actionType: "review_report",
        appType: "reinspection",
        node: "east",
        sector: "sec_1",
        wardNo: "ward_2",
        riskCategory: "medium",
        modalDetail: {
            address: "Plot 7, IT SEZ Zone, Mindspace Airoli",
            complianceInfo: "Fee: Paid (₹95,000) • Survey Score: 92/100",
            assignedOfficer: "Surveyor: Insp. A. K. Deshmukh",
            deficienciesStatus: "Field Survey Uploaded — Awaiting Clerk Verification",
            journeyStep: 4,
            journeySubtitle: "Clerk Verification Pending",
        },
    },

    // 6. Application with 15-Day Scrutiny Compliance Notice Issued
    {
        id: "SMC-FA-2026-0238",
        appId: "FAS-2026-9012",
        buildingName: "Maple Residency Tower C",
        occupancyGroup: "Group A-4",
        occupancyName: "High-Rise Residential Complex",
        applicantName: "Mrs. Sunita Rao",
        councilCode: "AMC 1238",
        submissionDate: "25-Sep-2026",
        submissionTime: "10:15 AM",
        slaRemaining: "11 Days Left (Day 4 of 15)",
        slaUrgency: "normal",
        status: "compliance_pending",
        statusLabel: "15-Day Notice Issued",
        isToday: false,
        actionType: "view",
        appType: "new",
        node: "south",
        sector: "sec_2",
        wardNo: "ward_1",
        riskCategory: "low",
        modalDetail: {
            address: "Sector 21, Palm Beach Marg, Sanpada",
            complianceInfo: "Fee: Paid (₹35,000) • 15-Day Compliance Period Active",
            assignedOfficer: "Scrutiny Clerk: S. Pathare",
            deficienciesStatus: "15-Day Statutory Notice Issued: Scrutiny deficiencies flagged (fire layout drawings & staircase clearance certificates required). Awaiting applicant compliance within 15 days.",
            journeyStep: 2,
            journeySubtitle: "15-Day Notice Issued",
        },
    },
];

export const CLERK_STATIC_METRICS: ClerkMetricSummary = {
    allApplications: 6,
    scrutinyPending: 2,
    surveyScheduled: 1,
    reviewForward: 1,
    compliancePending: 1,
    reinspectionCases: 0,
    certifiedCleared: 0,
    rejectedApplications: 1,
};

/**
 * In-memory search & filter simulator for mock clerk applications.
 * Isolated here so it can be safely deleted with this file once real APIs go live.
 */
export function filterMockClerkApplications(
    filters: ClerkFilterParams = {}
): { items: ClerkApplicationItem[]; totalCount: number } {
    let fallbackItems = CLERK_STATIC_APPLICATIONS;
    if (filters.tab === "today") {
        fallbackItems = fallbackItems.filter((a) => a.isToday || a.submissionDate?.includes("Today"));
    }
    if (filters.statusFilter && filters.statusFilter !== "all") {
        fallbackItems = fallbackItems.filter((a) => a.status === filters.statusFilter);
    }
    if (filters.occupancy && filters.occupancy !== "all") {
        fallbackItems = fallbackItems.filter(
            (a) => a.occupancyGroup === filters.occupancy || a.occupancyName === filters.occupancy
        );
    }
    if (filters.appType && filters.appType !== "all") {
        fallbackItems = fallbackItems.filter((a) => a.appType === filters.appType);
    }
    if (filters.node && filters.node !== "all") {
        const nodeFilter = filters.node.toLowerCase();
        fallbackItems = fallbackItems.filter(
            (a) => a.node === filters.node || a.modalDetail?.address?.toLowerCase().includes(nodeFilter)
        );
    }
    if (filters.sector && filters.sector !== "all") {
        const secLabel = filters.sector.replace("sec_", "Sector ").toLowerCase();
        fallbackItems = fallbackItems.filter(
            (a) => a.sector === filters.sector || a.modalDetail?.address?.toLowerCase().includes(secLabel)
        );
    }
    if (filters.wardNo && filters.wardNo !== "all") {
        const wardLabel = filters.wardNo.replace("ward_", "Ward ").toLowerCase();
        fallbackItems = fallbackItems.filter(
            (a) => a.wardNo === filters.wardNo || a.modalDetail?.address?.toLowerCase().includes(wardLabel)
        );
    }
    if (filters.riskCategory && filters.riskCategory !== "all") {
        const riskFilter = filters.riskCategory.toLowerCase();
        fallbackItems = fallbackItems.filter(
            (a) => a.riskCategory === filters.riskCategory || a.modalDetail?.complianceInfo?.toLowerCase().includes(riskFilter)
        );
    }
    if (filters.appDate && filters.appDate !== "all") {
        const dateFilter = filters.appDate.toLowerCase();
        fallbackItems = fallbackItems.filter(
            (a) => a.appDate === filters.appDate || a.submissionDate?.toLowerCase().includes(dateFilter)
        );
    }
    if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        fallbackItems = fallbackItems.filter(
            (a) =>
                a.id.toLowerCase().includes(q) ||
                a.appId.toLowerCase().includes(q) ||
                a.buildingName.toLowerCase().includes(q) ||
                a.applicantName.toLowerCase().includes(q) ||
                a.councilCode.toLowerCase().includes(q) ||
                a.occupancyName.toLowerCase().includes(q)
        );
    }

    return {
        items: fallbackItems,
        totalCount: fallbackItems.length,
    };
}

