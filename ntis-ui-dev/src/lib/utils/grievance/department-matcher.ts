import type { MunicipalDepartment } from '@/types/grievance';

/**
 * Find a department by ID, SrNo, English/Marathi name, or category from live departments.
 * Operates purely on live backend departments (zero hardcoded seed data).
 */
export function findDepartment(
  identifier?: string,
  departments: MunicipalDepartment[] = []
): MunicipalDepartment | null {
  if (!identifier || departments.length === 0) return null;
  const term = identifier.trim().toLowerCase();

  // 1. Direct match on id, srNo, exact name (en/mr), or category
  const directMatch =
    departments.find((d) => d.id.toLowerCase() === term) ||
    departments.find((d) => d.srNo.toString() === term.replace(/^#/, '')) ||
    departments.find(
      (d) => d.nameEn.toLowerCase() === term || (d.nameMr && d.nameMr.toLowerCase() === term)
    ) ||
    departments.find((d) => d.category.toLowerCase() === term);

  if (directMatch) return directMatch;

  // 2. Handle common civic aliases (e.g. 'roads', 'road', 'pothole', 'street', 'lighting', 'water', 'drainage')
  if (term === 'roads' || term === 'road' || term === 'pothole' || term === 'potholes') {
    return (
      departments.find((d) => d.id === 'road-maintenance-department') ||
      departments.find((d) => d.id === 'public-works-department') ||
      departments.find((d) => d.nameEn.toLowerCase().includes('road')) ||
      null
    );
  }

  if (term === 'water' || term === 'tap' || term === 'pipeline') {
    return departments.find((d) => d.id === 'water-supply-department') || null;
  }

  if (term === 'sewerage' || term === 'drainage' || term === 'drain') {
    return departments.find((d) => d.id === 'sewerage-drainage-department') || null;
  }

  if (term === 'light' || term === 'lighting' || term === 'streetlight') {
    return departments.find((d) => d.id === 'street-lighting-department') || null;
  }

  if (term === 'solid-waste' || term === 'waste' || term === 'garbage' || term === 'kachra') {
    return departments.find((d) => d.id === 'solid-waste-management-department') || null;
  }

  // 3. Substring matching with singular/plural stem tolerance
  const stem = term.endsWith('s') && term.length > 3 ? term.slice(0, -1) : term;

  return (
    departments.find(
      (d) =>
        d.id.toLowerCase().includes(term) ||
        d.nameEn.toLowerCase().includes(term) ||
        (d.nameMr && d.nameMr.toLowerCase().includes(term)) ||
        d.category.toLowerCase().includes(term) ||
        d.grievanceTypes.some((g) => g.toLowerCase().includes(term))
    ) ||
    departments.find(
      (d) =>
        d.id.toLowerCase().includes(stem) ||
        d.nameEn.toLowerCase().includes(stem) ||
        (d.nameMr && d.nameMr.toLowerCase().includes(stem)) ||
        d.category.toLowerCase().includes(stem) ||
        d.grievanceTypes.some((g) => g.toLowerCase().includes(stem))
    ) ||
    null
  );
}

/**
 * matchDept deprecated stub - removed AI category keyword heuristics.
 */
export function matchDept(
  _term?: string,
  _departments: MunicipalDepartment[] = []
): MunicipalDepartment | null {
  return null;
}
