'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import english from '@/i18n/locales/en/reportDesigner.json';
import marathi from '@/i18n/locales/mr/reportDesigner.json';
import hindi from '@/i18n/locales/hi/reportDesigner.json';

const Language = createContext<(text: string) => string>(text => text);
type Dictionary = { [key: string]: string | Dictionary };

/** Reuse the designer dictionaries; report codes, property data and field paths keep their values. */
export function EditorLanguage({ locale, children }: { locale: string; children: ReactNode }) {
  const translate = useMemo(() => {
    const map = new Map<string, string>();
    const dictionary = locale === 'mr' ? marathi : locale === 'hi' ? hindi : english;
    const visit = (source: Dictionary, target: Dictionary) => {
      Object.entries(source).forEach(([key, value]) => {
        const translated = target[key];
        if (typeof value === 'string' && typeof translated === 'string') map.set(value, translated);
        else if (value && typeof value === 'object' && translated && typeof translated === 'object') visit(value, translated);
      });
    };
    visit(english, dictionary);
    return (text: string) => map.get(text.trim()) || text;
  }, [locale]);
  return <Language.Provider value={translate}>{children}</Language.Provider>;
}
export const useEditorText = () => useContext(Language);
