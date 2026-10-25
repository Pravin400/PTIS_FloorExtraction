import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';

interface AdditionalDocumentProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedProperty: any;
}

export const AdditionalDocument = ({ selectedProperty }: AdditionalDocumentProps) => {
    const t = useTranslations('automationDashboard.propertyDetailsDashboard');

    return (
        <div className="bg-white border border-slate-300 shadow-lg rounded-lg max-w-2xl w-full p-8 mx-auto text-slate-800 font-sans relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
            {/* Decorative header line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#059669]" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                        <FileText className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">{t('report.revenueSurveyOffice')}</h2>
                        <p className="text-[10px] text-slate-500 font-semibold tracking-wider">{t('report.additionalCertificate')}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">{t('report.certificateNo')}</div>
                    <div className="text-xs font-mono font-bold text-slate-700">{'CERT-2026-'}{(selectedProperty?.propertyNo?.new || 'ADDITIONAL').substring(0, 8)}</div>
                </div>
            </div>

            {/* Document Body */}
            <div className="space-y-6 text-xs">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-12">
                    <span className="text-[70px] font-bold tracking-widest uppercase border-8 border-emerald-900 p-4">{t('report.official')}</span>
                </div>

                <p className="leading-relaxed text-slate-600 text-justify">
                    {t('report.verificationText')} <strong>{selectedProperty?.address}</strong>. {t('report.verificationSubtext')}
                </p>

                {/* Technical Specifications */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-2 border-l-2 border-emerald-600 pl-2 uppercase text-[11px] tracking-wider">{t('report.technicalSpecifications')}</h3>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                        <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.structuralCategory')}</span>
                            <span className="font-bold text-slate-900">{selectedProperty?.category}</span>
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.regionalCategory')}</span>
                            <span className="font-semibold text-slate-700">{selectedProperty?.categoryMarathi || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.totalFloorsListed')}</span>
                            <span className="font-semibold text-slate-700">{selectedProperty?.desc?.floors || 'N/A'} {t('report.floors')}</span>
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('report.totalUnitsEvaluated')}</span>
                            <span className="font-semibold text-slate-700">{selectedProperty?.desc?.units || 'N/A'} {t('report.units')}</span>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                    <strong className="block mb-1">{t('report.noticeDeclaration')}</strong>
                    {t('report.noticeText')}
                </div>
            </div>

            {/* Footer info */}
            <div className="border-t border-slate-200 mt-8 pt-4 flex justify-between items-center text-[10px] text-slate-400">
                <div>{t('report.authorizedSignature')}</div>
                <div className="flex items-center gap-2 font-mono">
                    <span>{t('report.digitalStampId')}</span>
                    <span className="font-bold text-slate-700">{'92A-K28-11P'}</span>
                </div>
            </div>
        </div>
    );
};
