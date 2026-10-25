import { Input } from '@/components/common/Input';
import { SearchSelect } from '@/components/common';

interface RuleLibraryFilterProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  categoryFilterOptions: { label: string; value: string }[];
  searchPlaceholder: string;
}

export default function RuleLibraryFilter({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  categoryFilterOptions,
  searchPlaceholder,
}: RuleLibraryFilterProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 bg-white p-4 border border-blue-200 rounded-xl shadow-sm">
      <Input
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => {
          const val = e.target.value;
          if (val.trim() === '') {
            setSearchTerm('');
            return;
          }
          // Remove leading spaces and collapse consecutive spaces
          const sanitized = val.replace(/^\s+/, '').replace(/\s+/g, ' ');
          setSearchTerm(sanitized);
        }}
      />
      <SearchSelect
        options={categoryFilterOptions}
        value={filterCategory}
        onChange={(_e, val) => setFilterCategory(val || 'ALL')}
      />
    </div>
  );
}
