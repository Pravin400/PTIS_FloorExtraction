import React from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import PrintReceiptButton from '@/components/modules/assets/revenue/payment/receipt/PrintReceiptButton';
import ReceiptBackButton from '@/components/modules/assets/revenue/payment/receipt/ReceiptBackButton';
import DynamicReceiptQRCode from '@/components/modules/assets/revenue/payment/receipt/DynamicReceiptQRCode';
import type { UlbMaster } from '@/types/master.types';
import type { LeaseRentReceiptDto, LeaseRentReceiptDemandDto } from '@/types/asset/revenue/payment/leaseRentPayment.types';

export interface LeaseRentReceiptViewProps {
  data: LeaseRentReceiptDto;
  locale: string;
  baseUrl: string;
  ulbData?: UlbMaster | Partial<UlbMaster>;
  /** Base path the printed QR code should point back to. Defaults to the staff
   * make-payment-v2 route; the citizen receipt page passes its own anonymous-accessible path. */
  receiptPath?: string;
}

export function LeaseRentReceiptView({
  data,
  locale,
  baseUrl,
  ulbData,
  receiptPath = '/assets/revenue/payment/receipt',
}: LeaseRentReceiptViewProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPeriod = (periodStr?: string) => {
    if (!periodStr || !periodStr.includes('/')) return periodStr || '—';
    const [m, y] = periodStr.split('/');
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (isNaN(month) || isNaN(year)) return periodStr;
    const lastDay = new Date(year, month, 0).getDate();
    return `01/${m}/${y} ते ${lastDay}/${m}/${y}`;
  };

  const formatDemandsPeriodRange = (demands?: LeaseRentReceiptDemandDto[]) => {
    if (!demands || demands.length === 0) return '—';
    
    const validDemands = demands.filter(d => d.period && d.period.includes('/'));
    if (validDemands.length === 0) return demands.map(d => d.period || '—').join(', ');
    if (validDemands.length === 1) return formatPeriod(validDemands[0].period);
    
    const parseSortKey = (p: string) => {
      const [m, y] = p.split('/');
      return parseInt(y, 10) * 100 + parseInt(m, 10);
    };
    
    const sorted = [...validDemands].sort((a, b) => parseSortKey(a.period!) - parseSortKey(b.period!));
    
    const first = sorted[0].period!;
    const last = sorted[sorted.length - 1].period!;
    
    const [fm, fy] = first.split('/');
    const [lm, ly] = last.split('/');
    const lastDay = new Date(parseInt(ly, 10), parseInt(lm, 10), 0).getDate();
    
    return `01/${fm}/${fy} ते ${lastDay}/${lm}/${ly}`;
  };

  // ULB branding must come only from the current tenant's cookies.
  // Never fall back to another ULB's name or logo.
  const ulbDisplayName = locale !== 'en'
    ? (ulbData?.ulbNameLocal || ulbData?.ulbName || '—')
    : (ulbData?.ulbName || '—');

  const logoSrc = ulbData?.ulbLogo?.trim() || '';
  const watermarkSrc = logoSrc;

  const paidAmountVal = Number(data.paidAmount ?? data.amountPaid ?? 0);

  const basicReceiptRows = [
    ['पावती क्र.:', data.receiptNo || '—'],
    ['पावती दिनांक:', formatDate(data.receiptDate || data.paymentDate)],
  ] as const;

  const detailRows: [string, string][] = [
    ['मालमत्ता कोड:', data.assetNo || '—'],
    ['करार क्र.:', data.agreementId ? String(data.agreementId) : '—'],
    ['मालमत्ता:', data.assetName || '—'],
    ['भाडेकरू:', data.tenantName || '—'],
    ['मोबाईल:', data.tenantMobile || '—'],
    ['करार कालावधी:', `${formatDate(data.leaseStartDate || undefined)} ते ${formatDate(data.leaseEndDate || undefined)}`],
    ['मासिक भाडे:', formatCurrency(data.monthlyRent || 0)],
    ['सुरक्षा ठेव:', formatCurrency(data.securityDeposit || 0)],
    ['भरणा प्रकार:', data.paymentMode || '—'],
    ['भरण्याचा प्रकार:', data.totalOutstandingBeforePayment === paidAmountVal ? 'पूर्ण भरणा' : 'अंशतः भरणा'],
  ];

  const normalizedMode = (data.paymentMode || '').toUpperCase().trim();

  if (normalizedMode === 'CHEQUE' || normalizedMode === 'DD') {
    const isDD = normalizedMode === 'DD';
    detailRows.push(['बँकेचे नाव:', data.bankName || '—']);
    detailRows.push([isDD ? 'डीडी क्र.:' : 'धनादेश क्र.:', data.chequeOrTransactionNo || '—']);
    detailRows.push([isDD ? 'डीडी दिनांक:' : 'धनादेश दिनांक:', formatDate(data.chequeDate)]);
    if (isDD && data.ddPayeeName) {
      detailRows.push(['प्राप्तकर्त्याचे नाव:', data.ddPayeeName]);
    }
    if (!isDD) {
      const chequeStatusLabels: Record<string, string> = {
        Received: 'प्राप्त', Deposited: 'जमा', Cleared: 'क्लिअर', Bounced: 'बाऊन्स',
      };
      detailRows.push(['धनादेश स्थिती:', chequeStatusLabels[data.paymentStatus || 'Received'] || data.paymentStatus || '—']);
    }
  } else if (normalizedMode === 'NEFT' || normalizedMode === 'RTGS' || normalizedMode === 'NEFT_RTGS') {
    detailRows.push(['बँकेचे नाव:', data.bankName || '—']);
    detailRows.push(['व्यवहार क्र. (UTR):', data.chequeOrTransactionNo || '—']);
  } else if (normalizedMode && normalizedMode !== 'CASH') {
    detailRows.push(['बँकेचे नाव / Gateway:', data.bankName || data.paymentGatewayName || '—']);
    detailRows.push(['व्यवहार क्र.:', data.onlineTransactionId || data.chequeOrTransactionNo || '—']);
  }

  if (data.remark) {
    detailRows.push(['विवरण (Remark):', data.remark]);
  }

  const remainingBal = data.remainingBalance || 0;
  const isAdvance = remainingBal < 0;
  const advanceAmount = isAdvance ? Math.abs(remainingBal) : 0;
  const displayRemainingBal = isAdvance ? 0 : remainingBal;

  const numberToMarathiWords = (n: number): string => {
    if (isNaN(n) || n === 0) return 'शून्य रुपये';

    const ones = [
      '', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
      'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणवीस', 'वीस',
      'एकवीस', 'बावीस', 'तेवीस', 'चोवीस', 'पंचवीस', 'सव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस',
      'एकतीस', 'बत्तीस', 'तेत्तीस', 'चौतीस', 'पस्तीस', 'छत्तीस', 'सदतीस', 'अडतीस', 'एकोणचाळीस', 'चाळीस',
      'एकचाळीस', 'बेचाळीस', 'त्रेचाळीस', 'चौचाळीस', 'पंचेचाळीस', 'सहेचाळीस', 'सत्ताचाळीस', 'अठ्ठेचाळीस', 'एकोणपन्नास', 'पन्नास',
      'एकपन्नास', 'बावन्न', 'तिरपन्न', 'चौपन्न', 'पंचावन्न', 'छप्पन्न', 'सत्तावन्न', 'अठ्ठावन्न', 'एकोणसाठ', 'साठ',
      'एकसाठ', 'बासाठ', 'त्रेसष्ट', 'चौसष्ट', 'पासष्ट', 'सहासाठ', 'सदसष्ट', 'अडसष्ट', 'एकोणसत्तर', 'सत्तर',
      'एकहत्तर', 'बाहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पंचहत्तर', 'शहात्तर', 'सतहत्तर', 'अठ्ठहत्तर', 'एकोणऐंशी', 'ऐंशी',
      'एक्याऐंशी', 'ब्याऐंशी', 'त्र्याऐंशी', 'चौऱ्याऐंशी', 'पंच्याऐंशी', 'शहाऐंशी', 'सत्याऐंशी', 'अठ्ठ्याऐंशी', 'एकोणनव्वद', 'नव्वद',
      'एक्यानव्वद', 'ब्यानव्वद', 'त्र्यानव्वद', 'चौऱ्यानव्वद', 'पंच्यानव्वद', 'शहानव्वद', 'सत्यानव्वद', 'अठ्ठ्यानव्वद', 'नव्याण्णव'
    ];

    const convertTwoDigits = (num: number): string => {
      if (num <= 0) return '';
      return ones[num] || '';
    };

    const convertInteger = (num: number): string => {
      if (num === 0) return '';
      const parts: string[] = [];

      if (num >= 10000000) {
        const crore = Math.floor(num / 10000000);
        parts.push(`${convertInteger(crore)} कोटी`);
        num %= 10000000;
      }

      if (num >= 100000) {
        const lakh = Math.floor(num / 100000);
        parts.push(`${convertTwoDigits(lakh)} लाख`);
        num %= 100000;
      }

      if (num >= 1000) {
        const thousand = Math.floor(num / 1000);
        parts.push(`${convertTwoDigits(thousand)} हजार`);
        num %= 1000;
      }

      if (num >= 100) {
        const hundred = Math.floor(num / 100);
        parts.push(`${convertTwoDigits(hundred)} शे`);
        num %= 100;
      }

      if (num > 0) {
        parts.push(convertTwoDigits(num));
      }

      return parts.join(' ').trim();
    };

    const rupees = Math.floor(Math.abs(n));
    const paise = Math.round((Math.abs(n) - rupees) * 100);

    let result = convertInteger(rupees);
    if (result) {
      result += ' रुपये';
    } else {
      result = 'शून्य रुपये';
    }

    if (paise > 0) {
      result += ` आणि ${convertTwoDigits(paise)} पैसे`;
    }

    return `${result} फक्त`;
  };

  const summaryRows: [string, React.ReactNode][] = [
    ['एकूण मागणी:', formatCurrency(data.totalDemandAmount || 0)],
    ['एकूण थकबाकी (भरण्यापूर्वी):', formatCurrency(data.totalOutstandingBeforePayment || 0)],
    [
      'एकूण प्राप्त रक्कम:',
      <span key="amount" className="text-emerald-600 font-bold">
        {formatCurrency(paidAmountVal)}
      </span>,
    ],
    ['शिल्लक थकबाकी:', formatCurrency(displayRemainingBal)],
    ...(isAdvance
      ? [
          [
            'अग्रिम रक्कम (Advance):',
            <span key="advance" className="text-emerald-500 font-bold">
              {formatCurrency(advanceAmount)}
            </span>,
          ] as [string, React.ReactNode],
        ]
      : []),
    [
      'भरणा स्थिती:',
      (() => {
        const status = data.paymentStatus || 'Success';
        const statusLower = status.toLowerCase();
        if (statusLower === 'success') {
          return (
            <span key="status" className="text-emerald-600 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} strokeWidth={2.5} className="shrink-0" />
              <span className="translate-y-[1px]">{"यशस्वी"}</span>
            </span>
          );
        }
        if (statusLower === 'pending') {
          return (
            <span key="status" className="text-amber-600 font-bold">
              {"लंबित (Pending)"}
            </span>
          );
        }
        if (statusLower === 'failed') {
          return (
            <span key="status" className="text-red-600 font-bold">
              {"अयशस्वी (Failed)"}
            </span>
          );
        }
        return status;
      })(),
    ],
  ];

  return (
    <div className="min-h-screen p-0 bg-[#f5f7fb] flex flex-col items-center justify-start relative print:bg-white print:min-h-0 print:p-0 print:m-0 w-full overflow-x-auto">
      <div className="w-full max-w-[210mm] flex justify-between items-center py-2 px-2 z-10 print:hidden shrink-0">
        <ReceiptBackButton />
        <PrintReceiptButton />
      </div>
      <div className="w-full flex justify-center max-[900px]:[zoom:calc((100vw-32px)/210mm)] max-[900px]:w-[210mm] shrink-0">
        <article
          id="printable-receipt"
          className="w-[210mm] min-h-[297mm] bg-white border-[1.2mm] border-[#1f4e9b] rounded-xl shadow-[0_10px_30px_rgba(7,30,71,0.12)] p-[3.4mm] text-[#132f5f] box-border print:w-[210mm] print:min-h-0 print:shadow-none print:m-0 print:rounded-none print:border-[1.2mm] shrink-0"
        >
        <div className="border-[0.45mm] border-[#1f4e9b] rounded-lg p-[2.8mm] min-h-[calc(297mm-9.2mm)] box-border relative z-10 flex flex-col print:min-h-[calc(297mm-9.2mm)]">
          <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] opacity-[0.07] pointer-events-none -z-10 flex items-center justify-center [print-color-adjust:exact]">
            {watermarkSrc ? (
              <Image
                src={watermarkSrc}
                alt="Watermark Logo"
                width={520}
                height={520}
                className="w-full h-full object-contain"
                priority
                unoptimized={watermarkSrc.startsWith('http') || watermarkSrc.startsWith('data:')}
              />
            ) : null}
          </div>
          <header className="grid grid-cols-[28mm_1fr_28mm] items-center gap-[2.8mm] mb-[2mm]">
            <div className="flex justify-center shrink-0">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={ulbDisplayName}
                  width={98}
                  height={98}
                  priority
                  unoptimized={logoSrc.startsWith('http') || logoSrc.startsWith('data:')}
                />
              ) : (
                <div className="w-[98px] h-[98px]" aria-hidden="true" />
              )}
            </div>

            <div className="text-center w-full">
              <h1 className="m-0 text-[#1f4e9b] text-[8.6mm] leading-[1.12] font-bold">{ulbDisplayName}</h1>
              <hr className="my-[1px] mx-auto w-[94%] border-0 border-t-[0.4mm] border-[#1f4e9b]" />
              <h2 className="mt-[2px] mb-0 text-[#1f4e9b] text-[5.7mm] font-bold">{"मालमत्ता भाडे / लीज भरणा पावती"}</h2>
              <h3 className="mt-[1.5px] mb-0 text-[#1f4e9b] text-[5mm] font-bold">
                {`आर्थिक वर्ष: ${data.financeYear ? `${data.financeYear}-${(Number(data.financeYear) + 1).toString().slice(2)}` : '—'}`}
              </h3>
              <h2 className="mt-[4px] mb-0 text-[#374151] text-[4.5mm] font-semibold">
                {"नमुना क्र. २ (नियम 12, 110(2), 114, 116(2) आणि 117(1), (2) व (3) पहा)"}
              </h2>
            </div>

            <div className="w-[24.5mm] h-[24.5mm] border-[0.45mm] border-[#1f4e9b] rounded-[2px] p-[1.2mm] ml-auto bg-white flex items-center justify-center shrink-0">
              <DynamicReceiptQRCode
                value={
                  data.uuid
                    ? `${baseUrl ? baseUrl : ''}/${locale}${receiptPath}?id=${data.uuid}`
                    : data.receiptNo || ''
                }
                size={92}
                className="block w-full h-full"
              />
            </div>
          </header>

          <table className="w-full border-collapse mt-[2.1mm]">
            <tbody>
              {basicReceiptRows.map(([label, value]) => (
                <tr key={label}>
                  <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] w-[25.5%] font-bold bg-[#f5f9ff]/70">{label}</td>
                  <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-collapse mt-[2.1mm]">
            <tbody>
              {detailRows.map(([label, value]) => (
                <tr key={label}>
                  <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] w-[25.5%] font-bold bg-[#f5f9ff]/70">{label}</td>
                  <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.paidDemands && data.paidDemands.length > 0 && (
            <>
              <h3 className="my-[2.5mm] mb-[1.5mm] text-center text-[#1f4e9b] text-[5.2mm] leading-[1.15] font-bold">{"देयक तपशील"}</h3>
              <table className="w-full border-collapse mt-[2.1mm]">
                <thead>
                  <tr>
                    <th className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] font-bold bg-[#f5f9ff]/70 text-center">{"कालावधी"}</th>
                    <th className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] font-bold bg-[#f5f9ff]/70 text-center">{"तपशील"}</th>
                    <th className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] font-bold bg-[#f5f9ff]/70 text-center">{"देय तारीख"}</th>
                    <th className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] font-bold bg-[#f5f9ff]/70 text-center">{"देय रक्कम"}</th>
                    <th className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] font-bold bg-[#f5f9ff]/70 text-center">{"प्राप्त रक्कम"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paidDemands.map((demand: LeaseRentReceiptDemandDto, idx: number) => (
                    <tr key={idx}>
                      <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] text-center">{formatPeriod(demand.period)}</td>
                      <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] text-center">{demand.description || '—'}</td>
                      <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] text-center">{formatDate(demand.dueDate)}</td>
                      <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] text-center">{formatCurrency(demand.dueAmount || 0)}</td>
                      <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] text-center">{formatCurrency(demand.paidAmount ?? demand.currentPaidAmount ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <table className="w-full border-collapse mt-[2.1mm]">
            <tbody>
              {summaryRows.map(([label, value]) => (
                <tr key={label}>
                  <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] w-[64%] font-bold bg-[#f5f9ff]/70">{label}</td>
                  <td className="border-[0.28mm] border-[#7ea0d4] px-[2mm] py-[0.9mm] text-[4.05mm] leading-[1.28] w-[36%] font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-[3mm] mb-[1.5mm] p-[2mm_3mm] bg-[#f8fafc] border-[0.28mm] border-[#7ea0d4] rounded text-[4mm] leading-[1.45] text-[#1e293b]">
            {"श्री / श्रीमती "}<strong>{data.tenantName || '—'}</strong>{" यांनी कालावधी / महिना "}
            <strong>
              {formatDemandsPeriodRange(data.paidDemands)}
            </strong>
            {" साठी एकूण रक्कम "}<strong>{formatCurrency(paidAmountVal)}</strong>{` (${numberToMarathiWords(paidAmountVal)}) `}{"जमा केली आहे."}
          </div>

          <div className="mt-[2.4mm] border-[0.28mm] border-[#7ea0d4] rounded-md grid grid-cols-2 overflow-hidden">
            <div className="min-h-[24mm] p-[2.8mm_3.2mm_2.2mm] relative text-center">
              <div className="mt-[10.8mm] border-t-[0.35mm] border-dashed border-[#8a97ac]" />
              <p className="mt-[1.6mm] mb-0 text-center text-[4.2mm] font-medium">{"प्राप्तकर्त्याची स्वाक्षरी"}</p>
            </div>
            <div className="min-h-[24mm] p-[2.8mm_3.2mm_2.2mm] relative border-l-[0.28mm] border-[#7ea0d4] text-center">
              <div className="mt-[10.8mm] border-t-[0.35mm] border-dashed border-[#8a97ac]" />
              <p className="mt-[1.6mm] mb-0 text-center text-[4.2mm] font-medium">{"अधिकृत स्वाक्षरी व शिक्का"}</p>
            </div>
          </div>

          <div className="mt-auto flex justify-between items-center px-3 py-1 bg-[#f8fafc] border-t border-[#1f4e9b] text-[3mm] font-semibold text-[#1e293b]">
            <span>
              {`Printed Date: ${new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}`}
            </span>
            <span>
              {`Printed By: ${data.createdBy && String(data.createdBy) !== '0' ? `User ${data.createdBy}` : 'CFC ऑपरेटर'}`}
            </span>
          </div>
        </div>
      </article>
    </div>
  </div>
);
}
