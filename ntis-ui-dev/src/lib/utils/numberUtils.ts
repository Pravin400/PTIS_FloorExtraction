export const formatIndianNumber = (value: unknown): string => {
    if (value === null || value === undefined) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
};
