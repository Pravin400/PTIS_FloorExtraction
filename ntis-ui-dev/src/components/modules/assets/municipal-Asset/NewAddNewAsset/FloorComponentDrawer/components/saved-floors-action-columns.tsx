import type { FloorDetailsTableColumn } from '@/components/common';
import type { SavedFloorRow } from '@/types/asset/floor-details.types';
import { Pencil, Trash2 } from 'lucide-react';
import type { SavedFloorsActionColumnsArgs } from '@/types/asset/floor-details.types';

function plainHeader(label: React.ReactNode) {
  const HeaderComponent = () => (
    <span className="text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">{label}</span>
  );
  HeaderComponent.displayName = 'PlainHeaderAction';
  return HeaderComponent;
}

export function buildSavedFloorsActionColumns({
  t,
  isLoading,
  onEdit,
  onDelete,
}: SavedFloorsActionColumnsArgs): FloorDetailsTableColumn<SavedFloorRow>[] {
  return [
    {
      key: 'actions',
      label: t('floorDetails.actions') || 'Actions',
      headerRender: plainHeader(t('floorDetails.actions') || 'Actions'),
      headerClassName: 'py-2.5 px-4 text-center min-w-[120px]',
      cellClassName: 'py-2.5 px-4 text-center',
      render: (f) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(f)}
            className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(Number(f.id))}
            disabled={isLoading}
            className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];
}
