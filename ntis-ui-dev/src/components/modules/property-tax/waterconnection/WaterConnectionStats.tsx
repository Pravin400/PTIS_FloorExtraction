
interface WaterConnectionStatsProps {
  stats: {
    totalConnections: number;
    activeConnections: number;
    stoppedConnections: number;
    yearlyRevenue: number;
  };
  labels: {
    total: string;
    active: string;
    stopped: string;
    revenue: string;
  };
}

interface StatCardProps {
  label: string;
  value: string | number;
  bgClass: string;
  textClass: string;
}

function StatCard({ label, value, bgClass, textClass }: StatCardProps) {
  return (
    <div className={`${bgClass} border rounded-lg px-3 py-2 flex flex-col gap-0.5`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className={`text-base font-bold ${textClass}`}>{value}</div>
    </div>
  );
}

export function WaterConnectionStats({ stats, labels }: WaterConnectionStatsProps) {
  const statItems = [
    {
      label: labels.total,
      value: stats.totalConnections,
      bgClass: "bg-blue-50 border-blue-100",
      textClass: "text-blue-700",
    },
    {
      label: labels.active,
      value: stats.activeConnections,
      bgClass: "bg-green-50 border-green-100",
      textClass: "text-green-700",
    },
    {
      label: labels.stopped,
      value: stats.stoppedConnections,
      bgClass: "bg-orange-50 border-orange-100",
      textClass: "text-orange-700",
    },
    {
      label: labels.revenue,
      value: `₹${stats.yearlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      bgClass: "bg-purple-50 border-purple-100",
      textClass: "text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {statItems.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}

