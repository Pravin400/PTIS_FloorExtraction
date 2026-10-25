import { Search, MapPin, CheckCircle2 } from 'lucide-react';
import { Drawer, MasterTable, Checkbox, Badge, ClearButton, ApplyButton, Input } from '@/components/common';
import type { Column } from '@/components/common';
import type { PropertySelectionDrawerProps } from '@/types/report.types';



type PropRow = { propertyId: number; property: string; ownerName: string; description: string };

export function PropertySelectionDrawer({
  isOpen,
  onClose,
  properties,
  propLoading,
  selectionMode,
  fromProperty,
  toProperty,
  selectedProperties,
  setSelectedProperties,
  zoneLabel,
  wardLabel,
  propertyTypeMap,
  isPending,
  onGenerate,
  propSearchQuery,
  setPropSearchQuery,
}: PropertySelectionDrawerProps) {
  let filtered = properties;

  if (selectionMode === 'range' && fromProperty && toProperty) {
    const fromStr = String(fromProperty).trim().toLowerCase();
    const toStr = String(toProperty).trim().toLowerCase();
    
    filtered = filtered.filter(p => {
      const pNo = String(p.propertyNo).trim().toLowerCase();
      return pNo.localeCompare(fromStr, undefined, { numeric: true, sensitivity: 'base' }) >= 0 &&
             pNo.localeCompare(toStr, undefined, { numeric: true, sensitivity: 'base' }) <= 0;
    });
  }

  filtered = filtered.filter(p =>
    p.propertyNo.toLowerCase().includes(propSearchQuery.toLowerCase()) ||
    (p.partitionNo || '').toLowerCase().includes(propSearchQuery.toLowerCase()) ||
    (p.ownerName || '').toLowerCase().includes(propSearchQuery.toLowerCase())
  );
  
  const filteredIds = filtered.map(p => String(p.propertyId));
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProperties.includes(id));
  const someSelected = filteredIds.some(id => selectedProperties.includes(id)) && !allSelected;

  const tableData: PropRow[] = filtered.map(p => {
    const parts = [wardLabel, p.propertyNo, p.partitionNo].filter(Boolean);
    return {
      propertyId: p.propertyId,
      property: parts.join('-'),
      ownerName: p.ownerName || '—',
      description: (p.propertyTypeId != null ? propertyTypeMap.get(p.propertyTypeId) : undefined) || '—',
    };
  });

  const columns: Column<PropRow>[] = [
    {
      key: 'propertyId',
      label: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedProperties(prev => Array.from(new Set([...prev, ...filteredIds])));
            } else {
              setSelectedProperties(prev => prev.filter(id => !filteredIds.includes(id)));
            }
          }}
        />
      ),
      width: '40px',
      align: 'center',
      render: (_, row) => {
        const isChecked = selectedProperties.includes(String(row.propertyId));
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => {
                setSelectedProperties(prev =>
                  checked
                    ? [...prev, String(row.propertyId)]
                    : prev.filter(id => id !== String(row.propertyId))
                );
              }}
            />
          </div>
        );
      },
    },
    {
      key: 'property',
      label: 'Property',
      width: '150px',
      render: (val) => (
        <Badge variant="default" className="font-mono tracking-wide whitespace-nowrap">
          {String(val ?? '')}
        </Badge>
      ),
    },
    {
      key: 'ownerName',
      label: 'Owner Name',
      render: (val) => (
        <Badge variant="secondary" className="max-w-[180px] truncate" title={String(val ?? '')}>
          {String(val ?? '—')}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <Badge variant="secondary" className="max-w-[180px] truncate" title={String(val ?? '')}>
          {String(val ?? '—')}
        </Badge>
      ),
    },
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={<Badge variant="secondary" className="font-semibold text-gray-800">Select Properties</Badge>}
      width="lg"
      bodyClassName="overflow-y-auto"
      footer={
        <div className="flex items-center justify-between w-full">
          <Badge variant="default" size="md" icon={CheckCircle2}>
            {selectedProperties.length} selected
          </Badge>
          <div className="flex gap-3">
            <ClearButton type="button" label="Cancel" onClick={onClose} />
            <ApplyButton 
              type="button" 
              label="Generate Report" 
              onClick={onGenerate} 
              disabled={isPending || selectedProperties.length === 0} 
            />
          </div>
        </div>
      }
    >
      {/* Info pills */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-2">
        <Badge variant="default" size="md" icon={MapPin}>
          Zone: {zoneLabel}
        </Badge>
        <Badge variant="success" size="md" icon={MapPin}>
          Ward: {wardLabel}
        </Badge>
        {fromProperty && toProperty && (
          <Badge variant="warning" size="md" className="ml-auto">
            Range: {fromProperty} – {toProperty}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            naked
            type="text"
            placeholder="Search by Property, Partition..."
            value={propSearchQuery}
            onChange={e => setPropSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl shadow-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            disabled={propLoading || properties.length === 0}
          />
        </div>
      </div>

      {/* MasterTable */}
      <div className="px-4 pb-4">
        <MasterTable<PropRow>
          columns={columns}
          data={tableData}
          loading={propLoading}
          loadingText="Loading properties..."
          emptyText="No properties found."
          height="lg"
          paginationConfig={{ enabled: false }}
          getRowKey={(row) => String(row.propertyId)}
          onRowClick={(row) => {
            const id = String(row.propertyId);
            setSelectedProperties(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
          }}
          rowClassName={(row) =>
            selectedProperties.includes(String(row.propertyId))
              ? 'bg-blue-50 cursor-pointer'
              : 'cursor-pointer hover:bg-gray-50'
          }
        />
      </div>
    </Drawer>
  );
}
