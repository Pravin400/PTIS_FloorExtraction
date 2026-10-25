import React from "react";
import { transliterateTextAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/transliteration/action";
import { logger } from "@/lib/utils/logger";

export function useTransliteration(
  locale: string,
  targetValue: string,
  onUpdate: (converted: string) => void
) {
  const targetValueRef = React.useRef(targetValue);
  const onUpdateRef = React.useRef(onUpdate);
  const localeRef = React.useRef(locale);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    targetValueRef.current = targetValue;
    onUpdateRef.current = onUpdate;
    localeRef.current = locale;
  }, [targetValue, onUpdate, locale]);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Debounced auto-transliterate: triggered from the source field's onChange
  // handler rather than a useEffect watching sourceText — same 600ms debounce
  // latency, event-triggered rather than effect-triggered.
  const scheduleAutoTransliterate = (value: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const reqId = ++requestIdRef.current;
    if (!value || !value.trim()) {
      onUpdateRef.current("");
      return;
    }
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const converted = await transliterateTextAction(value, localeRef.current);
        if (reqId === requestIdRef.current && converted != null && converted !== targetValueRef.current) {
          onUpdateRef.current(converted);
        }
      } catch (error) {
        if (reqId === requestIdRef.current) {
          logger.error("Transliteration debounce error", { error: error instanceof Error ? error : undefined });
        }
      }
    }, 400);
  };

  const handleBlurTransliterate = async (val: string) => {
    if (!val || !/[a-zA-Z]/.test(val)) return;
    const reqId = ++requestIdRef.current;
    try {
      const converted = await transliterateTextAction(val, locale);
      if (reqId === requestIdRef.current && converted && converted !== targetValueRef.current) {
        onUpdateRef.current(converted);
      }
    } catch (error) {
      if (reqId === requestIdRef.current) {
        logger.error("Transliteration blur error", { error: error instanceof Error ? error : undefined });
      }
    }
  };

  return { handleBlurTransliterate, scheduleAutoTransliterate };
}
