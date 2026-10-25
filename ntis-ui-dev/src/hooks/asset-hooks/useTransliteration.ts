 
import React from "react";
import { transliterateTextAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/transliteration/action";

export function useTransliteration(
  locale: string,
  targetValue: string,
  onUpdate: (converted: string) => void
) {
  const targetValueRef = React.useRef(targetValue);
  const onUpdateRef = React.useRef(onUpdate);
  const localeRef = React.useRef(locale);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    targetValueRef.current = targetValue;
    onUpdateRef.current = onUpdate;
    localeRef.current = locale;
  });

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
    if (!value || !value.trim()) {
      onUpdateRef.current("");
      return;
    }
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const converted = await transliterateTextAction(value, localeRef.current);
        if (converted != null && converted !== targetValueRef.current) {
          onUpdateRef.current(converted);
        }
      } catch (error) {
        console.error("Transliteration error:", error);
      }
    }, 400);
  };

  const handleBlurTransliterate = async (val: string) => {
    if (!val || !/[a-zA-Z]/.test(val)) return;
    try {
      const converted = await transliterateTextAction(val, locale);
      if (converted && converted !== targetValueRef.current) {
        onUpdateRef.current(converted);
      }
    } catch (error) {
      console.error("Transliteration error:", error);
    }
  };

  return { handleBlurTransliterate, scheduleAutoTransliterate };
}
