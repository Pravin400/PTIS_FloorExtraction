import { cn } from '@/lib/utils/cn';
import { TableColumn } from '@/types/common.types';

export interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Reusable Table component with generic type support
 * Handles loading states and empty data scenarios
 */
export function Table<T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  columns,
  className,
  isLoading = false,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center p-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={String(column.key) + index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => {
            // Use id field if available for better reconciliation, fallback to index
            const rowKey = (row.id as string) || rowIndex;
            return (
              <tr key={rowKey} className="hover:bg-gray-50 transition-colors">
                {columns.map((column, colIndex) => {
                  const value = row[column.key as keyof T];
                  return (
                    <td
                      key={String(column.key) + colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(value, row) : String(value || '-')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
