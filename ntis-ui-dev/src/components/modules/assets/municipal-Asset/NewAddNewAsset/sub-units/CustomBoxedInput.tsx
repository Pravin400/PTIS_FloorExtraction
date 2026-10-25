'use client';

import type { CustomBoxedInputProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { CustomBoxedInputProps };
import React from "react";
import { cn } from "@/lib/utils/cn";



export function CustomBoxedInput({
  value = "",
  onChange,
  length,
  type = "numeric",
  groupSizes,
  showPrefix,
  className,
}: CustomBoxedInputProps) {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const charArray = value.split("").slice(0, length);
  while (charArray.length < length) {
    charArray.push("");
  }

  const handleCharChange = (index: number, val: string) => {
    let char = val;
    if (type === "numeric") {
      char = val.replace(/\D/g, "");
    } else {
      char = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }

    const newChars = [...charArray];
    newChars[index] = char.slice(-1);
    const newVal = newChars.join("").trim();
    if (newVal !== value) {
      onChange(newVal);
    }

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !charArray[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    let sanitized = type === "numeric" ? pastedData.replace(/\D/g, "") : pastedData.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    sanitized = sanitized.slice(0, length);
    if (sanitized !== value) {
      onChange(sanitized);
    }
    const focusIndex = Math.min(sanitized.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  const boxes: React.ReactNode[] = [];
  let currentGroupIndex = 0;
  let currentGroupCount = 0;

  for (let i = 0; i < length; i++) {
    if (groupSizes && currentGroupCount === groupSizes[currentGroupIndex] && i < length) {
      boxes.push(
        <span
          key={`sep-${i}`}
          className="text-slate-400 font-bold select-none flex items-center justify-center text-[9px] sm:text-[10px] shrink-0 w-1 sm:w-1.5 leading-none"
        >
          -
        </span>
      );
      currentGroupIndex++;
      currentGroupCount = 0;
    }

    boxes.push(
      <input
        key={i}
        ref={(el) => { inputsRef.current[i] = el; }}
        type="text"
        maxLength={1}
        value={charArray[i]}
        onChange={(e) => handleCharChange(i, e.target.value)}
        onKeyDown={(e) => handleKeyDown(i, e)}
        onPaste={handlePaste}
        className="boxed-digit-input flex-1 min-w-0 max-w-[20px] !h-[23px] !px-0 border border-slate-300 rounded text-center text-[10px] sm:text-[10.5px] font-black text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      />
    );
    currentGroupCount++;
  }

  return (
    <div
      ref={containerRef}
      onScroll={(e) => { e.currentTarget.scrollLeft = 0; }}
      className={cn(
        "flex items-center justify-between border border-slate-200 bg-slate-50/50 rounded-md py-0.5 px-1 w-full gap-[1.5px] sm:gap-0.5 overflow-hidden",
        className
      )}
    >
      {showPrefix && (
        <div className="w-5 sm:w-6 h-[22px] bg-slate-100 border border-slate-200 rounded text-center text-[8px] font-black text-slate-500 flex items-center justify-center select-none shrink-0 mr-0.5">
          {showPrefix}
        </div>
      )}
      {boxes}
    </div>
  );
}
