export function formatDateToDDMMYYYY(dateStr?: string | null): string {
    if (!dateStr || dateStr.trim() === "" || dateStr === "—") return "—";
    const cleanStr = dateStr.trim().split("T")[0];

    // Match YYYY-MM-DD
    const ymdMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
        const [, y, m, d] = ymdMatch;
        return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
    }

    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
    }

    return dateStr;
}
