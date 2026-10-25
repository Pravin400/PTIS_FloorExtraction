export interface Stat {
  label: string;
  value: string;
}

export interface Service {
  id: number;
  link: string;
  icon: string;
  title: string;
  subtext: string;
  stats?: Stat[];
}

export interface DashboardData {
  id: string;
  route: string;
  status: 'Active' | 'Delayed' | 'Completed';
  vehicles: number;
  lastUpdate: string;
  [key: string]: unknown;
}
