import { useTranslations } from 'next-intl';

interface KarakarniDocumentProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedProperty: any;
}

export const KarakarniDocument = ({ selectedProperty }: KarakarniDocumentProps) => {
    const t = useTranslations('automationDashboard.propertyDetailsDashboard');

    return (
        <div className="bg-white border border-slate-300 shadow-lg rounded-lg max-w-2xl w-full p-8 mx-auto text-slate-800 font-sans relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
            {/* Decorative header line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1A56DB]" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <span className="text-[20px] font-bold text-slate-700">MC</span>
                    </div>
                    <div>
                        <h2 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">{t('report.municipalCorporation')}</h2>
                        <p className="text-[10px] text-slate-500 font-semibold tracking-wider">{t('report.propertyAssessmentRecord')}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">{t('report.documentId')}</div>
                    <div className="text-xs font-mono font-bold text-slate-700">{'KK-2026-'}{(selectedProperty?.propertyNo?.new || 'MUMAJOR1').substring(0, 8)}</div>
                </div>
            </div>

            {/* Document Body */}
            <div className="space-y-6 text-xs">
                {/* Stamp/Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-12">
                    <span className="text-[80px] font-bold tracking-widest uppercase border-8 border-slate-900 p-4">{t('report.verified')}</span>
                </div>

                {/* Property Overview */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{t('report.newPropertyNumber')}</span>
                        <span className="font-bold text-slate-900 text-sm">{selectedProperty?.propertyNo?.new}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{t('report.oldPropertyNumber')}</span>
                        <span className="font-semibold text-slate-700 text-sm">{selectedProperty?.propertyNo?.old}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{t('report.wardNumber')}</span>
                        <span className="font-semibold text-slate-700">{selectedProperty?.wardNo}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{t('report.constructionYear')}</span>
                        <span className="font-semibold text-slate-700">{selectedProperty?.constructionYear}</span>
                    </div>
                </div>

                {/* Tax Details Table */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-2 border-l-2 border-[#1A56DB] pl-2 uppercase text-[11px] tracking-wider">{t('report.assessmentTaxSummary')}</h3>
                    <table className="w-full border-collapse border border-slate-200">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                                <th className="border border-slate-200 p-2 text-left">{t('report.recordType')}</th>
                                <th className="border border-slate-200 p-2 text-left">{t('report.usage')}</th>
                                <th className="border border-slate-200 p-2 text-right">{t('report.arv')}</th>
                                <th className="border border-slate-200 p-2 text-right">{t('report.totalTax')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-200 p-2 font-bold text-red-600">{t('report.oldRecord')}</td>
                                <td className="border border-slate-200 p-2 text-slate-600">{selectedProperty?.oldRecord?.use} {'('}{selectedProperty?.oldRecord?.area} {'sq.ft)'}</td>
                                <td className="border border-slate-200 p-2 text-right font-mono">{selectedProperty?.oldRecord?.rv}</td>
                                <td className="border border-slate-200 p-2 text-right font-mono font-bold">{selectedProperty?.oldRecord?.totalTax}</td>
                            </tr>
                            <tr className="bg-slate-50/30">
                                <td className="border border-slate-200 p-2 font-bold text-emerald-600">{t('report.newRecord')}</td>
                                <td className="border border-slate-200 p-2 text-slate-600">{selectedProperty?.newRecord?.use} {'('}{selectedProperty?.newRecord?.area} {'sq.ft)'}</td>
                                <td className="border border-slate-200 p-2 text-right font-mono">{selectedProperty?.newRecord?.rv}</td>
                                <td className="border border-slate-200 p-2 text-right font-mono font-bold">{selectedProperty?.newRecord?.totalTax}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Additional details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 border-l-2 border-[#1A56DB] pl-2 uppercase text-[11px] tracking-wider">{t('report.ownershipInfo')}</h3>
                        <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.primaryOwner')}</span>
                                <span className="font-bold text-slate-800">{selectedProperty?.owner}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.occupier')}</span>
                                <span className="font-medium text-slate-700">{selectedProperty?.occupier}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 border-l-2 border-[#1A56DB] pl-2 uppercase text-[11px] tracking-wider">{t('report.additionalRevenue')}</h3>
                        <div className="space-y-1.5 p-3 bg-emerald-50/30 rounded-lg border border-emerald-100">
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.netIncrease')}</span>
                                <span className="font-bold text-emerald-700 text-sm">{'₹'} {selectedProperty?.additionalRevenue}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.propertyTypeStatus')}</span>
                                <span className="font-semibold text-slate-700">{selectedProperty?.propertyType} {'('}{selectedProperty?.assessmentStatus}{')'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
