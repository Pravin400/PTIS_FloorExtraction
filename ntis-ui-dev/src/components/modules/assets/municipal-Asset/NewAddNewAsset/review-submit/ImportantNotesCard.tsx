import { useTranslations } from 'next-intl';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

export function ImportantNotesCard() {
  const t = useTranslations('newAddNewAsset.review');

  const notes = [
    t('note1'),
    t('note2'),
    t('note3'),
    t('note4'),
  ];

  return (
    <div className="bg-[#FFF9EE] p-5 rounded-xl border border-[#FBE5C4] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-orange-500" />
        <h3 className="text-[13px] font-black text-[#101b87]">{t('importantNotes')}</h3>
      </div>
      <div className="space-y-2.5">
        {notes.map((note, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#1c2aab] font-bold leading-relaxed">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
