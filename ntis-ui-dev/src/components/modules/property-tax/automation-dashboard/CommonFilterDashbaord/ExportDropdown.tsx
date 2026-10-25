import { FileSpreadsheet, FileText } from 'lucide-react';
import { ExportButton } from '@/components/common';
import { useTranslations } from 'next-intl';
import { exportToExcel, exportToPdf } from '@/lib/utils/automation-dashboard/export';
import { ExportConfig } from '@/types/automation-dashboard/export.type';

interface ExportDropdownProps<T> {
    config: ExportConfig<T>;
}

export function ExportDropdown<T>({
    config
}: ExportDropdownProps<T>) {

    const t = useTranslations('automationDashboard');

    return (
        <div className="relative group">
            <ExportButton className="h-9 px-4 text-[13px] font-semibold flex items-center gap-1.5 transition-all duration-200 rounded-md border border-slate-300 shadow-sm bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                {t('geoSequencing.buttons.export')}
            </ExportButton>
            <div className="absolute right-0 pt-1 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white border border-slate-200 rounded-md shadow-lg flex flex-col p-1">
                    <button onClick={() => exportToExcel(config)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{t('geoSequencing.buttons.exportExcel')}</span>
                    </button>
                    <button onClick={() => exportToPdf(config)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{t('geoSequencing.buttons.exportPdf')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
