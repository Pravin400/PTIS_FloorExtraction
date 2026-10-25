import { ValueDisplay } from './components/ValueDisplay';
import { Building2, Mail, Phone, User, MessageCircle } from 'lucide-react';
import FieldShell from '@/components/common/FieldShell';
import type { SocietyDetailsData } from '@/types/ptis.types';
import { useTranslations } from 'next-intl';

export interface SocietyDetailsTabProps {
  data: SocietyDetailsData;
}

const SocietyDetailsTab = ({ data }: SocietyDetailsTabProps) => {
  const t = useTranslations('ptis');

  const formatMergedValue = (val1?: string, val2?: string) => {
    const v1 = val1?.trim();
    const v2 = val2?.trim();
    if (v1 && v2) return `${v1} , ${v2}`;
    return v1 || v2 || '';
  };

  return (
    <div className="p-0.5">
      <div className={'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-0.5'}>
        {/* Row 1: Land Owner, Builder Name, Society Name, Society Email, Secretary / Manager Name */}
        <FieldShell
          id="landOwner"
          label={t('fields.landOwner')}
          icon={User}
          className="col-span-1 sm:col-span-2 lg:col-span-2"
        >
          <ValueDisplay value={data.landOwner} />
        </FieldShell>

        <FieldShell
          id="builderName"
          icon={Building2}
          label={t('fields.builderName')}
          className="col-span-1 sm:col-span-2 lg:col-span-2"
        >
          <ValueDisplay value={data.builderName} />
        </FieldShell>

        <FieldShell
          id="buildingSocietyName"
          icon={Building2}
          label={t('fields.societyName')}
          className="col-span-1 sm:col-span-2 lg:col-span-3"
        >
          <ValueDisplay value={data.buildingSocietyName} />
        </FieldShell>

        <FieldShell
          id="societyEmailMain"
          icon={Mail}
          label={t('fields.societyEmail')}
          className="col-span-1 sm:col-span-2 lg:col-span-2"
        >
          <ValueDisplay value={data.societyEmailMain} />
        </FieldShell>

        <FieldShell
          id="secretaryManagerName"
          icon={User}
          label={t('fields.secretaryManagerName')}
          className="col-span-2 sm:col-span-4 lg:col-span-3"
        >
          <ValueDisplay value={formatMergedValue(data.secretaryName, data.managerName)} />
        </FieldShell>

        {/* Row 2: Secretary / Manager Mobile, Secretary / Manager Email, Society Address */}
        <FieldShell
          id="secretaryManagerMobile"
          icon={Phone}
          label={t('fields.secretaryManagerMobile')}
          className="col-span-2 sm:col-span-2 lg:col-span-3"
        >
          <ValueDisplay
            value={formatMergedValue(data.secretaryMobileNo, data.managerMobileNo)}
            prefixIcon={MessageCircle}
          />
        </FieldShell>

        <FieldShell
          id="secretaryManagerEmail"
          icon={Mail}
          label={t('fields.secretaryManagerEmail')}
          className="col-span-2 sm:col-span-2 lg:col-span-3"
        >
          <ValueDisplay value={formatMergedValue(data.secretaryEmail, data.managerEmail)} />
        </FieldShell>

        <FieldShell
          id="societyAddress"
          icon={Building2}
          className="col-span-2 sm:col-span-4 lg:col-span-6"
          label={t('fields.societyAddress')}
        >
          <ValueDisplay value={data.societyAddress} />
        </FieldShell>
      </div>
    </div>
  );
};

export default SocietyDetailsTab;
