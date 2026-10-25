import { useTranslations } from 'next-intl';
import type { TrackingTicket } from '@/types/grievance';
import { OfficerCard } from './OfficerCard';

interface TimelineOfficersTabProps {
  ticket: TrackingTicket;
}

export function TimelineOfficersTab({ ticket }: TimelineOfficersTabProps) {
  const t = useTranslations('grievance');

  const officerSteps = ticket.steps.filter((s) => s.officer);

  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200/80 pb-2">
        <h4 className="text-sm font-extrabold text-slate-900">
          {t('officialsResponsible')}
        </h4>
        <p className="text-[11px] text-slate-500 font-medium">
          {t('officialsResponsibleHint')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {officerSteps.map((s) => (
          <OfficerCard key={s.officer!.id} officer={s.officer!} />
        ))}
      </div>
    </div>
  );
}
