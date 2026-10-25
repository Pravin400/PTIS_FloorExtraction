export interface Stat {
    label: string;
    value: string;
}

export interface Service {
    id: number;
    name?: string;
    link: string;
    icon: string;
    title: string;
    subtext: string;
    stats?: Stat[];
    description?: string;
    /** Module ID associated with this department (for cookie context) */
    moduleId?: number;
    /** Module name associated with this department (for cookie context) */
    moduleName?: string;
}

export interface DashboardStats {
    totalUsers: number;
    activeProperties: number;
    totalRevenue: number;
}

export type ServiceCardProps = Omit<Service, 'id'>;
