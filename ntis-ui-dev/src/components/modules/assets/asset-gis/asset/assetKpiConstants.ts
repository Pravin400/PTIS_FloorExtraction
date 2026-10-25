import {
  Clock,
  MapPin,
  ClipboardCheck,
  Building,
  Folder,
  IndianRupee,
  AlertTriangle,
  Building2,
  Landmark,
  Layers,
  PieChart,
  FileText,
  Users,
  Boxes,
  Warehouse,
  Home,
  CheckCircle2,
  Coins,
  Truck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  'fa-cubes': Boxes,
  'fa-boxes': Boxes,
  'fa-building': Building,
  'fa-building-columns': Landmark,
  'fa-landmark': Landmark,
  'fa-city': Building2,
  'fa-warehouse': Warehouse,
  'fa-home': Home,
  'fa-house': Home,
  'fa-indian-rupee-sign': IndianRupee,
  'fa-money-bill-wave': Coins,
  'fa-coins': Coins,
  'fa-truck': Truck,
  'fa-truck-moving': Truck,
  'fa-chart-line': TrendingUp,
  'fa-trending-up': TrendingUp,
  'fa-triangle-exclamation': AlertTriangle,
  'fa-exclamation-triangle': AlertTriangle,
  'fa-clock': Clock,
  'fa-map-pin': MapPin,
  'fa-location-dot': MapPin,
  'fa-clipboard-check': ClipboardCheck,
  'fa-check-circle': CheckCircle2,
  'fa-layers': Layers,
  'fa-layer-group': Layers,
  'fa-chart-pie': PieChart,
  'fa-file-invoice': FileText,
  'fa-users': Users,
  'fa-folder': Folder,
};

export function resolveCardTitle(item: Record<string, unknown> | null | undefined, fallback = ''): string {
  if (!item) return fallback;
  return String(
    item.customTitle ||
    item.CustomTitle ||
    item.defaultTitle ||
    item.DefaultTitle ||
    item.title ||
    item.Title ||
    item.kpiName ||
    item.KpiName ||
    item.kpiTitle ||
    item.KpiTitle ||
    item.name ||
    item.Name ||
    item.cardTitle ||
    item.label ||
    fallback
  );
}

export function resolveCardIcon(item: Record<string, unknown> | null | undefined, fallback = 'fa-cubes'): string {
  if (!item) return fallback;
  return String(
    item.customIcon ||
    item.CustomIcon ||
    item.defaultIcon ||
    item.DefaultIcon ||
    item.icon ||
    item.Icon ||
    item.kpiIcon ||
    item.KpiIcon ||
    fallback
  );
}

const KPI_COLOR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export function resolveCardColor(item: Record<string, unknown> | null | undefined, fallback: string | number = '#3b82f6'): string {
  const fallbackColor = typeof fallback === 'number' ? KPI_COLOR_PALETTE[fallback % KPI_COLOR_PALETTE.length] : fallback;
  if (!item) return fallbackColor;
  return String(
    item.customColor ||
    item.CustomColor ||
    item.defaultColor ||
    item.DefaultColor ||
    item.color ||
    item.Color ||
    item.kpiColor ||
    item.KpiColor ||
    fallbackColor
  );
}

export function resolveCardUnit(item: Record<string, unknown> | null | undefined): string | null {
  if (!item) return null;
  const unit = item.customUnit ?? item.CustomUnit ?? item.defaultUnit ?? item.DefaultUnit ?? item.unit ?? item.Unit;
  return unit ? String(unit) : null;
}

export function resolveDisplayValue(
  val: unknown,
  unit: string | null | undefined
): { num: string; sub?: string } {
  if (val === null || val === undefined) return { num: '0' };
  const str = String(val).trim();
  if (!str || str === '0') return { num: '0' };

  if (str.startsWith('₹') || str.toLowerCase().includes('cr') || str.toLowerCase().includes('lakh')) {
    return { num: str };
  }

  const numVal = Number(str.replace(/,/g, ''));
  if (isNaN(numVal)) return { num: str };

  if (unit === '₹' || unit === 'INR' || unit === 'Rs') {
    if (numVal >= 10000000) {
      return { num: `₹${(numVal / 10000000).toFixed(2)}`, sub: 'Cr' };
    }
    if (numVal >= 100000) {
      return { num: `₹${(numVal / 100000).toFixed(2)}`, sub: 'Lakh' };
    }
    return { num: `₹${numVal.toLocaleString('en-IN')}` };
  }

  return { num: numVal.toLocaleString('en-IN'), sub: unit || undefined };
}
