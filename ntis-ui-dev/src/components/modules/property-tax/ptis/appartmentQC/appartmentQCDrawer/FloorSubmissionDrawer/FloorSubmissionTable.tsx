import { Tabs } from '@/components/common/Tabs';
import { MasterTable, type Column } from '@/components/common/MasterTable';
import type { FloorSubmissionRow } from '@/types/apartmentQC.types';

interface FloorQCTableProps {
  hook: {
    subTab: string;
    dualMethodTab: string;
    setDualMethodTab: (v: 'rateable' | 'capital') => void;
    floorData: FloorSubmissionRow[];
    isLoadingFloorQCData: boolean;
  };
  t: (key: string) => string;
  floorColumns: Column<FloorSubmissionRow>[];
  tableStyle: (col: Column<FloorSubmissionRow>) => Column<FloorSubmissionRow>;
  onRowClick?: (row: FloorSubmissionRow, index: number) => void;
  editRowId?: string | null;
}

export const FloorQCTable = ({
  hook,
  t,
  floorColumns,
  tableStyle,
  onRowClick,
  editRowId,
}: FloorQCTableProps) => {

  return (
    <div className="bg-white overflow-hidden">
      {hook.subTab === 'dual-method' ? (
        <Tabs
          value={hook.dualMethodTab}
          onChange={(v) => hook.setDualMethodTab(v as 'rateable' | 'capital')}
          variant="pills"
          size="sm"
          className="p-2"
        >
          <Tabs.TabList className="mb-0">
            <Tabs.Tab value="rateable">{t('drawer.tabs.rateable')}</Tabs.Tab>
            <Tabs.Tab value="capital">{t('drawer.tabs.capital')}</Tabs.Tab>
          </Tabs.TabList>
          <Tabs.TabPanel value="rateable">
            <MasterTable
              columns={floorColumns.map(tableStyle)}
              data={hook.floorData}
              loading={hook.isLoadingFloorQCData}
              tableClassName="w-max min-w-full border-collapse border border-blue-400/20 shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)] text-sm"
              theadClassName="bg-[#1e3a8a] text-white sticky top-0 z-0 shadow-md"
              rowClassName={(row) => {
                const isSelected = row.id === editRowId;
                return `h-[36px] border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-blue-100/90 font-medium border-l-4 !border-l-blue-600' : 'hover:bg-blue-100/60'
                }`;
              }}
              onRowClick={onRowClick}
              height="sm"
            />
          </Tabs.TabPanel>
          <Tabs.TabPanel value="capital">
            <MasterTable
              columns={floorColumns.map(tableStyle)}
              data={hook.floorData}
              loading={hook.isLoadingFloorQCData}
              tableClassName="w-max min-w-full border-collapse border border-blue-400/20 shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)] text-sm"
              theadClassName="bg-[#1e3a8a] text-white sticky top-0 z-0 shadow-md"
              rowClassName={(row) => {
                const isSelected = row.id === editRowId;
                return `h-[36px] border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-blue-100/90 font-medium border-l-4 !border-l-blue-600' : 'hover:bg-blue-100/60'
                }`;
              }}
              onRowClick={onRowClick}
              height="sm"
            />
          </Tabs.TabPanel>
        </Tabs>
      ) : (
        <MasterTable
          columns={floorColumns.map(tableStyle)}
          data={hook.floorData}
          loading={hook.isLoadingFloorQCData}
          tableClassName="w-max min-w-full border-collapse border border-blue-400/20 shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)] text-sm"
          theadClassName="bg-[#1e3a8a] text-white sticky top-0 z-0 shadow-md"
          rowClassName={(row) => {
            const isSelected = row.id === editRowId;
            return `h-[36px] border-b border-gray-100 transition-colors ${
              isSelected ? 'bg-blue-100/90 font-medium border-l-4 !border-l-blue-600' : 'hover:bg-blue-100/60'
            }`;
          }}
          onRowClick={onRowClick}
          height="sm"
        />
      )}
    </div>
  );
};
