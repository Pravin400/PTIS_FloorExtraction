/* eslint-disable i18next/no-literal-string */
export const money = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN");

export const formatArea = (v: number | string | undefined | null) => {
  if (v === undefined || v === null || v === "") return "0";
  const num = Number(v);
  if (isNaN(num)) return "0";
  return parseFloat(num.toFixed(3)).toLocaleString("en-IN");
};

export const percentText = (v: number) => (v > 0 ? "+" : "") + v.toFixed(2) + "%";

export const getDifferenceColorClass = (v: number) => {
  if (Math.abs(v) < 0.01) return "text-amber-500 font-bold";
  return v > 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold";
};

export const getBadgeForPercent = (p: number) => {
  if (Math.abs(p) < 0.01) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Equal
      </span>
    );
  }
  if (p > 0) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Old is Less (+{p.toFixed(1)}%)
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      Old is More ({p.toFixed(1)}%)
    </span>
  );
};

export function isCandidateMatchingPropNo(
  cand: { propNo?: string; partitionNo?: string | null; id?: string },
  mappedNo: string
): boolean {
  if (!mappedNo || !cand.propNo) return false;
  const cleanMapped = mappedNo.trim().toLowerCase();
  const cleanCandProp = cand.propNo.trim().toLowerCase();
  const cleanCandPart = (cand.partitionNo || "").trim().toLowerCase();

  // If candidate.propNo itself already contains slash or dash e.g. "2324010150 / 00041"
  if (cleanCandProp.includes("/") || cleanCandProp.includes("-")) {
    const normMapped = cleanMapped.replace(/\s+/g, "");
    const normCandProp = cleanCandProp.replace(/\s+/g, "");
    if (normMapped === normCandProp) return true;
  }

  if (cleanCandPart) {
    const normMapped = cleanMapped.replace(/\s+/g, "");
    const normSlash = `${cleanCandProp}/${cleanCandPart}`.replace(/\s+/g, "");
    const normDash = `${cleanCandProp}-${cleanCandPart}`.replace(/\s+/g, "");

    if (normMapped === normSlash || normMapped === normDash) {
      return true;
    }

    if (normMapped.includes(cleanCandProp) && normMapped.includes(cleanCandPart)) {
      return true;
    }

    // Partitioned candidate cannot match an unpartitioned bare propNo
    return false;
  }

  // Candidate has NO partition
  const normMapped = cleanMapped.replace(/\s+/g, "");
  const normCandProp = cleanCandProp.replace(/\s+/g, "");
  return normMapped === normCandProp;
}

export function isCandidateMatchingAny(
  cand: { propNo?: string; partitionNo?: string | null; id?: string },
  mappedList: string[]
): boolean {
  if (!mappedList || mappedList.length === 0 || !cand.propNo) return false;
  return mappedList.some((m) => isCandidateMatchingPropNo(cand, m));
}

