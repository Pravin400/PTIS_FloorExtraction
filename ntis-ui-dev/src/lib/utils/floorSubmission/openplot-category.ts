import { TypeOfUseApiItem } from '@/types/floor-details.types';

export interface OpenPlotCategoryItem {
  id: number;
  typeOfUseId: number;
  typeOfUseCode: string;
  description: string;
  type: string;
  typeOfUseGroupId: number;
  typeOfUseCategoryId: number;
  isActive: boolean;
}

/**
 * Filter TypeOfUse master records for Open Plot Category dropdown (TypeOfUseCategoryId = 4).
 */
export function filterOpenPlotCategories(
  useData?: Array<Partial<TypeOfUseApiItem> & Record<string, unknown>> | null
): OpenPlotCategoryItem[] {
  if (!useData || useData.length === 0) {
    return [];
  }

  const filtered = useData.filter((item) => {
    const categoryId = Number(
      item.typeOfUseCategoryId ?? item.TypeOfUseCategoryId ?? item.categoryId ?? item.CategoryId ?? 0
    );
    const rawActive = item.isActive ?? item.IsActive;
    const isActive =
      rawActive === true ||
      rawActive === 1 ||
      String(rawActive) === 'true' ||
      rawActive === undefined;

    // Filter strictly by TypeOfUseCategoryId = 4
    const isCategoryMatch = categoryId === 4;

    return isCategoryMatch && isActive;
  });

  const seenIds = new Set<number>();
  const result: OpenPlotCategoryItem[] = [];

  for (const item of filtered) {
    const id = Number(item.typeOfUseId ?? item.id ?? item.ID ?? 0);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const catId = Number(item.typeOfUseCategoryId ?? item.TypeOfUseCategoryId ?? item.categoryId ?? item.CategoryId ?? 4);
    result.push({
      id,
      typeOfUseId: id,
      typeOfUseCode: String(item.typeOfUseCode ?? item.code ?? item.Code ?? ''),
      description: String(item.description ?? item.Description ?? ''),
      type: String(item.type ?? item.Type ?? 'C'),
      typeOfUseGroupId: Number(item.typeOfUseGroupId ?? item.TypeOfUseGroupId ?? 10031),
      typeOfUseCategoryId: catId,
      isActive: true,
    });
  }

  return result;
}

const NON_TAXABLE_OPEN_PLOT_CODES = new Set(['OPF', 'OPN']);

/**
 * Determine Taxable status (true = Taxable/1, false = Non-Taxable/0) based on Open Plot TypeOfUseCode.
 * OP (Residential / निवासी) -> 1 (Taxable)
 * OPC (Commercial / अनिवासी) -> 1 (Taxable)
 * OPI (Industrial / औद्योगिक) -> 1 (Taxable)
 * OPF (Agricultural / शेती) -> 0 (Non-Taxable)
 * OPN (Non Taxable / करमुक्त) -> 0 (Non-Taxable)
 */
export function isOpenPlotCodeTaxable(typeOfUseCode?: string | null): boolean {
  if (!typeOfUseCode) return true;
  const code = String(typeOfUseCode).toUpperCase().trim();
  return !NON_TAXABLE_OPEN_PLOT_CODES.has(code);
}
