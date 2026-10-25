import { LeasePaymentCollectionScreen } from '@/components/modules/assets/revenue/payment/LeasePaymentCollectionScreen';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function BaseMakePaymentV2Page({ params }: PageProps) {
  const { locale } = await params;

  const emptyRecord: LeaseRentPaymentDetail = {
    leaseRentRegistrationId: 0,
    grievanceNo: '',
    assetId: 0,
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
        record={emptyRecord}
        historyItems={[]}
        recordId="0"
        locale={locale}
      />
    </div>
  );
}
