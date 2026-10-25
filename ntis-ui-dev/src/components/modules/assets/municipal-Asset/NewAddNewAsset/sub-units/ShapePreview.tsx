import type { ShapePreviewColor, ShapePreviewProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { ShapePreviewColor, ShapePreviewProps };



const COLOR_STYLES: Record<ShapePreviewColor, { fill: string; stroke: string; innerFill: string; innerStroke: string; innerText: string }> = {
  indigo: { fill: "rgba(79, 70, 229, 0.08)", stroke: "#4f46e5", innerFill: "#eef2ff", innerStroke: "#6366f1", innerText: "#3730a3" },
  violet: { fill: "rgba(124, 58, 237, 0.08)", stroke: "#7c3aed", innerFill: "#f5f3ff", innerStroke: "#8b5cf6", innerText: "#5b21b6" },
  emerald: { fill: "rgba(16, 185, 129, 0.08)", stroke: "#10b981", innerFill: "#ecfdf5", innerStroke: "#10b981", innerText: "#047857" },
  amber: { fill: "rgba(245, 158, 11, 0.08)", stroke: "#f59e0b", innerFill: "#fffbeb", innerStroke: "#f59e0b", innerText: "#b45309" },
  blue: { fill: "rgba(37, 99, 235, 0.08)", stroke: "#2563eb", innerFill: "#eff6ff", innerStroke: "#3b82f6", innerText: "#1d4ed8" },
};



function formatDim(val: number | string | undefined, prefix: string): string {
  if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val)) && Number(val) > 0) {
    const n = Number(val);
    const displayVal = n % 1 === 0 ? n.toString() : n.toFixed(2);
    return `${prefix}=${displayVal}`;
  }
  return prefix;
}

export function ShapePreview({
  shape,
  areaSqM,
  label,
  color = "indigo",
  length,
  width,
  height,
  base1,
  base2,
  radius,
}: ShapePreviewProps) {
  const { fill: f, stroke: s, innerFill, innerStroke, innerText } = COLOR_STYLES[color];
  const shapeLabel = label || "1";
  const areaLabel = `${areaSqM.toFixed(2)} sq.m`;

  const getLabels = (ry: number, ty: number) => {
    return (
      <>
        <text x="50" y={ty} fill="#1e1b4b" fontSize="8.5" fontWeight="bold" textAnchor="middle">
          {shapeLabel}
        </text>
        <rect x="24" y={ry} width="52" height="11.5" rx="2.5" ry="2.5" fill={innerFill} stroke={innerStroke} strokeWidth="0.8" />
        <text x="50" y={ry + 8.2} fill={innerText} fontSize="5.8" fontWeight="bold" textAnchor="middle">
          {areaLabel}
        </text>
      </>
    );
  };

  const sKey = (shape || "Rectangle").toLowerCase();
  switch (sKey) {
    case "square": {
      const lStr = formatDim(length, "L");
      return (
        <svg viewBox="-12 -8 124 116" className="w-full h-full">
          <text x="50" y="17" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">
            {lStr}
          </text>
          <rect x="25" y="24" width="50" height="50" rx="4" fill={f} stroke={s} strokeWidth={2.5} />
          {getLabels(49, 41)}
        </svg>
      );
    }
    case "triangle": {
      const bStr = formatDim(base1 || length, "b");
      const hStr = formatDim(height, "h");
      return (
        <svg viewBox="-12 -8 124 116" className="w-full h-full">
          <polygon points="50,20 84,76 16,76" fill={f} stroke={s} strokeWidth={2.5} strokeLinejoin="round" />
          <line x1="50" y1="20" x2="50" y2="76" stroke={s} strokeWidth="1.2" strokeDasharray="2 2" />
          <text x="46" y="50" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="end">
            {hStr}
          </text>
          <text x="50" y="88" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">
            {bStr}
          </text>
          {getLabels(52, 44)}
        </svg>
      );
    }
    case "trapezoid": {
      const b1Str = formatDim(base1, "b1");
      const b2Str = formatDim(base2, "b2");
      const hStr = formatDim(height, "h");
      return (
        <svg viewBox="-12 -8 124 116" className="w-full h-full">
          {/* Top Base b1 */}
          <text x="50" y="14" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">
            {b1Str}
          </text>
          {/* Main Trapezoid polygon */}
          <polygon points="32,22 68,22 86,76 14,76" fill={f} stroke={s} strokeWidth={2.2} strokeLinejoin="round" />
          {/* Height vertical dashed line */}
          <line x1="32" y1="22" x2="32" y2="76" stroke={s} strokeWidth="1.2" strokeDasharray="2 2" />
          <path d="M 32 71 L 37 71 L 37 76" fill="none" stroke={s} strokeWidth="0.8" />
          {/* Height label */}
          <text x="28" y="50" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="end">
            {hStr}
          </text>
          {/* Bottom Base b2 */}
          <text x="50" y="88" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">
            {b2Str}
          </text>
          {/* Center room label and area badge */}
          <text x="58" y="42" fill="#1e1b4b" fontSize="8" fontWeight="bold" textAnchor="middle">
            {shapeLabel}
          </text>
          <rect x="37" y="48" width="44" height="11" rx="2" ry="2" fill={innerFill} stroke={innerStroke} strokeWidth="0.8" />
          <text x="59" y="56" fill={innerText} fontSize="5.5" fontWeight="bold" textAnchor="middle">
            {areaLabel}
          </text>
        </svg>
      );
    }
    case "circle": {
      const rStr = formatDim(radius, "r");
      return (
        <svg viewBox="-12 -8 124 116" className="w-full h-full">
          <circle cx="50" cy="50" r="32" fill={f} stroke={s} strokeWidth={2.5} />
          <line x1="50" y1="50" x2="82" y2="50" stroke={s} strokeWidth="1.2" strokeDasharray="2 2" />
          <text x="66" y="44" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">
            {rStr}
          </text>
          {getLabels(48, 40)}
        </svg>
      );
    }
    case "semi circle":
    case "semicircle":
      return (
        <svg viewBox="-12 -8 124 116" className="w-full h-full">
          <path d="M 18 60 A 32 32 0 0 1 82 60 Z" fill={f} stroke={s} strokeWidth={2.5} strokeLinejoin="round" />
          {getLabels(48, 40)}
        </svg>
      );
    case "quarter":
      return (
        <svg viewBox="-12 -8 124 116" className="w-full h-full">
          <path d="M 40 60 L 72 60 A 32 32 0 0 0 40 28 Z" fill={f} stroke={s} strokeWidth={2.5} strokeLinejoin="round" />
          {getLabels(48, 40)}
        </svg>
      );
    default: { // Rectangle
      const lStr = formatDim(length, "L");
      const wStr = formatDim(width, "W");
      return (
        <svg viewBox="-12 -8 124 116" className="w-full h-full">
          <text x="50" y="19" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">
            {lStr}
          </text>
          <text x="14" y="52" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="end">
            {wStr}
          </text>
          <rect x="18" y="26" width="64" height="48" rx="4" fill={f} stroke={s} strokeWidth={2.5} />
          {getLabels(50, 42)}
        </svg>
      );
    }
  }
}
