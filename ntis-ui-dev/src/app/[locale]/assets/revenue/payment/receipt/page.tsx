import { headers, cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { LeaseRentReceiptView } from '@/components/modules/assets/revenue/payment/receipt/LeaseRentReceiptView';
import { getUlbDataFromCookieStore } from '@/lib/utils/cookie';
import { getReceiptDataAction } from '@/app/[locale]/assets/revenue/payment/actions';
import type { LeaseRentReceiptDto } from '@/types/asset/revenue/payment/leaseRentPayment.types';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ receiptNo?: string; uuid?: string; id?: string }>;
}

export default async function ReceiptPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { receiptNo, uuid: rawUuid, id } = await searchParams;
  const targetUuid = rawUuid || id;

  const cookieStore = await cookies();
  const ulbData = getUlbDataFromCookieStore(cookieStore);

  let receiptData: LeaseRentReceiptDto | null = null;
  const identifier = targetUuid || receiptNo;

  if (identifier) {
    receiptData = await getReceiptDataAction(identifier);
  }

  if (!receiptData) {
    notFound();
  }

  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || 'http';
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="w-full">
      <LeaseRentReceiptView
        data={receiptData}
        locale={locale}
        baseUrl={baseUrl}
        ulbData={ulbData}
      />
    </div>
  );
}

