'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RuleSchemaPreviewProps {
  ruleJsonString: string;
}

export default function RuleSchemaPreview({ ruleJsonString }: RuleSchemaPreviewProps) {
  const t = useTranslations('ruleEngine');
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!ruleJsonString) return;
    try {
      await navigator.clipboard.writeText(ruleJsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // fallback copy
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white p-5 border border-blue-100 rounded-xl shadow-sm h-fit">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <span>{t('simulation.jsonStructure')}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wide">
            {t('simulation.readOnly')}
          </span>
        </h3>
        <button
          onClick={handleCopy}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200
            ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 active:scale-95'
            }
          `}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('simulation.copied')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-gray-500" />
              <span>{t('simulation.copyJson')}</span>
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <pre className="text-xs bg-slate-900 text-slate-100 p-4.5 rounded-xl overflow-auto h-[480px] font-mono leading-relaxed select-text border border-slate-800 shadow-inner">
          {ruleJsonString}
        </pre>
      </div>
    </div>
  );
}
