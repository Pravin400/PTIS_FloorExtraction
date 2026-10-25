import { ViewButton, ExecuteTestButton, EditButton, DeleteButton } from '@/components/common/ActionButtons';
import { RuleItemRecord } from '@/hooks/rule-engine/useRuleLibraryColumns';

interface RuleLibraryActionsProps {
  row: RuleItemRecord;
  locale: string;
  loadingRuleId: number | null;
  handleOpenViewDrawer: (row: RuleItemRecord) => void;
  handleOpenTestDrawer: (row: RuleItemRecord) => void;
  handleDelete: (id: number) => void;
  router: { push: (href: string) => void };
}

export default function RuleLibraryActions({
  row,
  locale,
  loadingRuleId,
  handleOpenViewDrawer,
  handleOpenTestDrawer,
  handleDelete,
  router,
}: RuleLibraryActionsProps) {
  const isCurrentLoading = loadingRuleId === row.id;
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <ViewButton 
        onClick={() => handleOpenViewDrawer(row)} 
        disabled={loadingRuleId !== null}
        className={isCurrentLoading ? 'animate-pulse opacity-60' : ''}
      />
      <ExecuteTestButton 
        onClick={() => handleOpenTestDrawer(row)} 
        disabled={loadingRuleId !== null}
        className={isCurrentLoading ? 'animate-pulse opacity-60' : ''}
      />
      <EditButton 
        onClick={() => router.push(`/${locale}/property-tax/rule-engine/${row.id}`)} 
        disabled={loadingRuleId !== null}
      />
      <DeleteButton 
        onClick={() => row.id !== undefined && handleDelete(row.id)} 
        disabled={loadingRuleId !== null}
      />
    </div>
  );
}
