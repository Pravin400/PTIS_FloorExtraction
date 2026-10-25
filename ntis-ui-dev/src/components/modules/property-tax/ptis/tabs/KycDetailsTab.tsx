import { ValueDisplay } from './components/ValueDisplay';
import { User, UserCheck, FileText, Phone, Mail, Building2, MapPin } from 'lucide-react';
import FieldShell from '@/components/common/FieldShell';
import type { KYCDetailsData } from '@/types/ptis.types';
import { useTranslations } from 'next-intl';

export interface KycDetailsTabProps {
  data: KYCDetailsData;
}

const KycDetailsTab = ({ data }: KycDetailsTabProps) => {
  const t = useTranslations('ptis');

  return (
    <div className="p-0.5">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-0.5">
        {/* Row 1: Owner Category, Title, Property Holder Name (Locale), Property Holder Name, Occupier Name (Locale), Occupier Name */}
        <FieldShell
          id="ownerType"
          label={t('fields.ownerType')}
          icon={User}
          className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1"
        >
          <ValueDisplay value={data.ownerType} />
        </FieldShell>

        <FieldShell
          id="title"
          label={t('fields.title')}
          icon={User}
          className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1"
        >
          <ValueDisplay value={data.title} />
        </FieldShell>

        <FieldShell
          id="propertyHolderName"
          icon={UserCheck}
          className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-3 xl:col-span-2"
          label={`${t('fields.propertyHolderName')}${t('fields.localeSuffix')}`}
        >
          <ValueDisplay value={data.propertyHolderName} />
        </FieldShell>

        <FieldShell
          id="propertyHolderNameEnglish"
          icon={UserCheck}
          className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-3 xl:col-span-2"
          label={t('fields.propertyHolderName')}
        >
          <ValueDisplay value={data.propertyHolderNameEnglish} />
        </FieldShell>

        <FieldShell
          id="occupierName"
          icon={UserCheck}
          className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-2"
          label={`${t('fields.occupierName')}${t('fields.localeSuffix')}`}
        >
          <ValueDisplay value={data.occupierName} />
        </FieldShell>

        <FieldShell
          id="occupierNameEnglish"
          icon={UserCheck}
          className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-1"
          label={t('fields.occupierName')}
        >
          <ValueDisplay value={data.occupierNameEnglish} />
        </FieldShell>

        {/* Row 2: Shop Name (Locale), Shop Name, Aadhar No, Mobile No, Alternate Mobile No */}
        <FieldShell
          id="shopName"
          label={`${t('fields.shopName')}${t('fields.localeSuffix')}`}
          className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-2"
        >
          <ValueDisplay value={data.shopName} />
        </FieldShell>

        <FieldShell
          id="shopNameEnglish"
          label={t('fields.shopName')}
          className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-1"
        >
          <ValueDisplay value={data.shopNameEnglish} />
        </FieldShell>

        <FieldShell
          id="aadharCardNo"
          label={t('fields.aadharCardNo')}
          icon={FileText}
          className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-1"
        >
          <ValueDisplay value={data.aadharCardNo} />
        </FieldShell>

        <FieldShell
          id="mobileNumber"
          label={t('fields.mobileNumber')}
          icon={Phone}
          className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-1"
        >
          <ValueDisplay value={data.mobileNumber} />
        </FieldShell>

        <FieldShell
          id="alternateMobileNo"
          label={t('fields.alternateMobileNo')}
          icon={Phone}
          className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-1"
        >
          <ValueDisplay value={data.alternateMobileNo} />
        </FieldShell>

        {/* Row 3: Email ID, Address (Locale), Address, Pincode */}
        <FieldShell
          id="emailId"
          label={t('fields.emailId')}
          icon={Mail}
          className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-2"
        >
          <ValueDisplay value={data.email} />
        </FieldShell>

        <FieldShell
          id="address"
          label={`${t('fields.address')}${t('fields.localeSuffix')}`}
          icon={Building2}
          className="col-span-2 sm:col-span-4 md:col-span-6 lg:col-span-5 xl:col-span-3"
        >
          <ValueDisplay value={data.address} />
        </FieldShell>

        <FieldShell
          id="addressEnglish"
          label={t('fields.address')}
          icon={Building2}
          className="col-span-2 sm:col-span-4 md:col-span-6 lg:col-span-5 xl:col-span-3"
        >
          <ValueDisplay value={data.addressEnglish} />
        </FieldShell>

        <FieldShell
          id="pinCode"
          label={t('fields.pinCode')}
          icon={MapPin}
          className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-1"
        >
          <ValueDisplay value={data.pinCode} />
        </FieldShell>
      </div>
    </div>
  );
};

export default KycDetailsTab;
