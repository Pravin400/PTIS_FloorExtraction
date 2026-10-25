'use client';

import { useTranslations } from 'next-intl';
import { Calculator } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { MasterTable } from '@/components/common';
import type { Column } from '@/components/common/MasterTable';
import { cn } from '@/lib/utils/cn';

interface Sec129Row extends Record<string, unknown> {
  year: string;
  applicablePct: string;
  generalTax: number | string;
  waterTax: number | string;
  educationTax: number | string;
  fireTax: number | string;
  totalTax: number;
  remark: string;
  bg?: string;
  isRegular?: boolean;
}

interface Section129ModalProps {
  open: boolean;
  onClose: () => void;
  data?: Sec129Row[];
}

// Default mock data
const defaultSec129Data: Sec129Row[] = [
    {
      year: '2016-17',
      applicablePct: 'As Per Gram Panchayat',
      generalTax: 500,
      waterTax: '-',
      educationTax: '-',
      fireTax: '-',
      totalTax: 500,
      remark: 'No Change'
    },
    {
      year: '2017-18',
      applicablePct: 'As Per Gram Panchayat',
      generalTax: 500,
      waterTax: '-',
      educationTax: '-',
      fireTax: '-',
      totalTax: 500,
      remark: 'No Change'
    },
    ...[
      { yr: '2018-19', pct: '20%', gen: 500, wat: 100, edu: 100, fire: 100, tot: 800, rem: '20% Municipal Tax Applied' },
      { yr: '2019-20', pct: '40%', gen: 500, wat: 200, edu: 200, fire: 200, tot: 1100, rem: '40% Municipal Tax Applied' },
      { yr: '2020-21', pct: '60%', gen: 500, wat: 300, edu: 300, fire: 300, tot: 1400, rem: '60% Municipal Tax Applied' },
      { yr: '2021-22', pct: '80%', gen: 500, wat: 400, edu: 400, fire: 400, tot: 1700, rem: '80% Municipal Tax Applied' },
      { yr: '2022-23', pct: '100%', gen: 500, wat: 500, edu: 500, fire: 500, tot: 2000, rem: 'Regular Municipal Tax', bg: 'bg-emerald-50/30', isRegular: true },
      { yr: '2023-24', pct: '100%', gen: 500, wat: 500, edu: 500, fire: 500, tot: 2000, rem: 'Regular Municipal Tax', bg: 'bg-emerald-50/30', isRegular: true }
    ].map((item) => ({
      year: item.yr,
      applicablePct: item.pct,
      generalTax: item.gen,
      waterTax: item.wat,
      educationTax: item.edu,
      fireTax: item.fire,
      totalTax: item.tot,
      remark: item.rem,
      bg: item.bg,
      isRegular: item.isRegular
    }))
];

export function Section129Modal({ 
  open, 
  onClose, 
  data = defaultSec129Data 
}: Section129ModalProps) {
  // Translations
  const t = useTranslations('reassessment');

  // Custom renderers for Section 129
  const remarkRender = (value: unknown, row: Sec129Row) => {
    if (row.remark === 'No Change') {
      return <span className="text-gray-500 font-medium">{t('section129Modal.remarks.noChange')}</span>;
    }
    if (row.remark === 'Regular Municipal Tax') {
      return <span className="text-emerald-700 font-medium">{t('section129Modal.remarks.regular')}</span>;
    }
    if (row.remark.includes('Municipal Tax Applied')) {
      const pct = row.remark.replace(' Municipal Tax Applied', '').replace('%', '');
      return <span className="text-amber-800 font-medium">{pct}{t('section129Modal.remarks.municipalTaxApplied')}</span>;
    }
    return <span className="text-amber-800 font-medium">{String(value)}</span>;
  };

  const applicablePctRender = (value: unknown, row: Sec129Row) => {
    if (row.applicablePct === 'As Per Gram Panchayat') {
      return <span className="text-sky-800 font-bold">{t('section129Modal.applicablePct.asPerGramPanchayat')}</span>;
    }
    return <span className="text-amber-700 font-bold">{String(value)}</span>;
  };

  const sec129Columns: Column<Sec129Row>[] = [
    { 
      key: 'year', 
      label: t('section129Modal.columns.year'), 
      width: '90px', 
      align: 'left', 
      cellClassName: 'font-bold text-slate-800' 
    },
    { 
      key: 'applicablePct', 
      label: t('section129Modal.columns.applicablePct'), 
      width: '140px', 
      align: 'left', 
      render: applicablePctRender 
    },
    { 
      key: 'generalTax', 
      label: t('section129Modal.columns.generalTax'), 
      width: '100px', 
      align: 'right', 
      cellClassName: 'font-mono' 
    },
    { 
      key: 'waterTax', 
      label: t('section129Modal.columns.waterTax'), 
      width: '100px', 
      align: 'right', 
      cellClassName: 'font-mono' 
    },
    { 
      key: 'educationTax', 
      label: t('section129Modal.columns.educationTax'), 
      width: '100px', 
      align: 'right', 
      cellClassName: 'font-mono' 
    },
    { 
      key: 'fireTax', 
      label: t('section129Modal.columns.fireTax'), 
      width: '100px', 
      align: 'right', 
      cellClassName: 'font-mono' 
    },
    { 
      key: 'totalTax', 
      label: t('section129Modal.columns.totalTax'), 
      width: '110px', 
      align: 'right', 
      cellClassName: 'font-extrabold text-blue-900 font-mono' 
    },
    { 
      key: 'remark', 
      label: t('section129Modal.columns.remark'), 
      width: '200px', 
      align: 'left', 
      cellClassName: 'pl-6', 
      render: remarkRender 
    }
  ];

  const modalFooter = (
    <button
      onClick={onClose}
      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
    >
      {t('buttons.close')}
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('section129Modal.title')}
      subtitle={t('section129Modal.subtitle')}
      maxWidth="2xl"
      footer={modalFooter}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-4 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold">{t('section129Modal.note')}</span>
        </div>
        <MasterTable
          columns={sec129Columns}
          data={data}
          paginationConfig={{ enabled: false }}
          tableClassName="w-full border-collapse text-xs text-left"
          theadClassName="bg-blue-50 text-blue-950 font-bold border-b border-blue-100 [&_th]:p-3"
          rowClassName={(row) => cn(
            "hover:bg-slate-50/50 [&_td]:p-3",
            row.bg
          )}
        />
      </div>
    </Modal>
  );
}