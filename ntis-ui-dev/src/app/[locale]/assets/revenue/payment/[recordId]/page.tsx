import { redirect } from 'next/navigation';
import { LeasePaymentCollectionScreen } from '@/components/modules/assets/revenue/payment/LeasePaymentCollectionScreen';
import { getMakePaymentRecordAction } from '@/app/[locale]/assets/revenue/payment/actions';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';

interface PageProps {
  params: Promise<{ recordId: string; locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MakePaymentV2Page({ params, searchParams }: PageProps) {
  const { recordId, locale } = await params;

  // Redirect legacy /0 URLs to the clean base route /assets/revenue/make-payment-v2
  if (recordId === '0') {
    const sp = searchParams ? await searchParams : {};
    const query = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (typeof v === 'string' && v) query.set(k, v);
      if (Array.isArray(v)) {
        v.forEach((val) => {
          if (val) query.append(k, val);
        });
      }
    });
    const qStr = query.toString();
    redirect(
      qStr
        ? `/${locale}/assets/revenue/payment?${qStr}`
        : `/${locale}/assets/revenue/payment`
    );
  }

  const record = await getMakePaymentRecordAction(recordId);
  const historyItems = record?.paymentHistory || [];

  const emptyRecord: LeaseRentPaymentDetail = {
    leaseRentRegistrationId: Number(recordId) || 0,
    grievanceNo: '',
    assetId: Number(recordId) || 0,
    assetNo: '',
    assetName: '',
    paymentFrequency: '',
    zone: '',
    wardNo: '',
    category: '',
    shopNo: '',
    shopName: '',
    tenantName: '',
    tenantMobile: '',
    tenantEmail: '',
    leaseType: '',
    monthlyRent: 0,
    pendingDue: 0,
    currentDemand: 0,
    currentPaid: 0,
    currentPenalty: 0,
    currentGst: 0,
    advanceBalance: 0,
    pendingDemand: 0,
    pendingPaid: 0,
    pendingPenalty: 0,
    pendingGst: 0,
    penalty: 0,
    gst: 0,
    totalPayable: 0,
    paymentStatus: null,
  };

  return (
    <div className="h-[calc(100vh-140px)] overflow-hidden">
      <LeasePaymentCollectionScreen
        record={record || emptyRecord}
        historyItems={historyItems || []}
        recordId={recordId}
        locale={locale}
        notFound={!record}
      />
    </div>
  );
}
