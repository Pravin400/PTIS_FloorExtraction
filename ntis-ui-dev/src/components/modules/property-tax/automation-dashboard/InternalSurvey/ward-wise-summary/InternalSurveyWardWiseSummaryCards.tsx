import { useTranslations } from 'next-intl';

export interface InternalSurveyWardWiseSummaryData {
    totalStructure: string | number;
    totalUnits: string | number;
    assessed: string | number;
    unassessed: string | number;
    photos: string | number;
    formattedStage: string
}

interface InternalSurveyWardWiseSummaryCardsProps {
    data?: InternalSurveyWardWiseSummaryData;
}

export function InternalSurveyWardWiseSummaryCards({ data }: InternalSurveyWardWiseSummaryCardsProps) {
    const t = useTranslations('automationDashboard');
    if (!data) return null;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 w-full mb-3">
            {/* Total Structure */}
            <div className="bg-[#e9f2ff] border border-blue-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[12px] font-bold text-black uppercase tracking-wide mb-1">{t('internalSurvey.cards.totalStructure')}</span>
                <span className="text-[22px] font-extrabold text-blue-800">{data.totalStructure}</span>
            </div>

            {/* Total Units */}
            <div className="bg-[#f4eaff] border border-purple-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[12px] font-bold text-black uppercase tracking-wide mb-1">{t('internalSurvey.cards.totalUnits')}</span>
                <span className="text-[22px] font-extrabold text-purple-800">{data.totalUnits}</span>
            </div>

            {/* Assessed */}
            <div className="bg-[#e6ffeb] border border-green-300 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[12px] font-bold text-black uppercase tracking-wide mb-1">{t('internalSurvey.cards.assessed')}</span>
                <span className="text-[22px] font-extrabold text-green-700">{data.assessed}</span>
            </div>

            {/* Unassessed */}
            <div className="bg-[#ffefe6] border border-orange-300 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[12px] font-bold text-black uppercase tracking-wide mb-1">{t('internalSurvey.cards.unassessed')}</span>
                <span className="text-[22px] font-extrabold text-[#a34700]">{data.unassessed}</span>
            </div>

            {/* Photos */}
            <div className="bg-[#e0e7ff] border border-indigo-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[12px] font-bold text-black uppercase tracking-wide mb-1">{t('internalSurvey.cards.photos')}</span>
                <span className="text-[22px] font-extrabold text-indigo-800">{data.photos}</span>
            </div>
            </div>
        
            <div className="w-full px-3 py-3 border-t border-b border-slate-200 bg-slate-50">
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    {data.formattedStage} - {t('internalSurvey.wardWiseTable')}
                </h3>
            </div>
        </>
    );
}
