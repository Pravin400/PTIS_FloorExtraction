import { Activity, IndianRupee, Droplets, StopCircle } from "lucide-react";
import { Card } from "@/components/common/Card";

interface StatsData {
  totalConnections: number;
  activeConnections: number;
  stoppedConnections: number;
  yearlyRevenue: number;
}

interface PropertyStatsCardsProps {
  stats: StatsData;
  labels: {
    totalConnections: string;
    activeConnections: string;
    stoppedConnections: string;
    yearlyRevenue: string;
    currency?: string;
  };
}

export function PropertyStatsCards({ stats, labels }: PropertyStatsCardsProps) {
  const currency = labels.currency ?? '₹';
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{labels.totalConnections}</div>
          <div className="text-3xl font-bold text-blue-700">{stats.totalConnections}</div>
        </div>
        <div className="h-10 w-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full">
          <Droplets size={28} />
        </div>
      </Card>
      <Card className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{labels.activeConnections}</div>
          <div className="text-3xl font-bold text-green-700">{stats.activeConnections}</div>
        </div>
        <div className="h-10 w-10 flex items-center justify-center bg-green-100 text-green-700 rounded-full">
          <Activity size={28} />
        </div>
      </Card>
      <Card className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{labels.stoppedConnections}</div>
          <div className="text-3xl font-bold text-orange-700">{stats.stoppedConnections}</div>
        </div>
        <div className="h-10 w-10 flex items-center justify-center bg-orange-100 text-orange-700 rounded-full">
          <StopCircle size={28} />
        </div>
      </Card>
      <Card className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{labels.yearlyRevenue}</div>
          <div className="text-3xl font-bold text-purple-700">{currency}{stats.yearlyRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full">
          <IndianRupee size={28} />
        </div>
      </Card>
    </div>
  );
}
