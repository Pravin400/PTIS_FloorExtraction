'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useEditorText } from './EditorLanguage';

export function EditorButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const translate = useEditorText();
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-[26px] shrink-0 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11.5px] font-medium leading-none text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 ${props.className || ''}`}
    >
      {typeof children === 'string' ? translate(children) : children}
    </button>
  );
}

export function EditorInput({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const translate = useEditorText();
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] font-medium text-slate-600">
      {translate(label)}
      <input
        {...props}
        className={`h-[30px] w-full rounded-md border border-slate-300 bg-white px-2 text-[11.5px] font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${props.className || ''}`}
      />
    </label>
  );
}

export function EditorSelect({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const translate = useEditorText();
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] font-medium text-slate-600">
      {translate(label)}
      <select
        {...props}
        className={`h-[30px] rounded-md border border-slate-300 bg-white px-2 text-[11.5px] font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${props.className || ''}`}
      >
        {children}
      </select>
    </label>
  );
}

export function EditorDialog({
  title,
  subtitle,
  icon,
  close,
  children,
  footer,
  panelClassName = 'max-w-[610px]',
  bodyClassName = 'overflow-auto px-5 py-3.5',
  blueHeader = false,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  close: () => void;
  children: ReactNode;
  footer?: ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
  blueHeader?: boolean;
}) {
  const translate = useEditorText();
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_60px_-12px_rgba(15,23,42,0.35)] ${panelClassName}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            close();
          }
        }}
      >
        <div
          className={`flex min-h-[58px] items-center gap-3 border-b px-5 py-3 ${
            blueHeader
              ? 'border-blue-700 bg-gradient-to-br from-blue-800 via-blue-600 to-sky-600 text-white'
              : 'border-slate-100 bg-white text-slate-800'
          }`}
        >
          {icon ? (
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border ${
                blueHeader
                  ? 'border-white/40 bg-white/15 text-white'
                  : 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600'
              }`}
            >
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold leading-tight">{translate(title)}</h2>
            {subtitle ? (
              <p
                className={`mt-0.5 text-[10.5px] ${blueHeader ? 'text-blue-100' : 'text-slate-500'}`}
              >
                {translate(subtitle)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close dialog"
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-sm font-semibold transition ${
              blueHeader
                ? 'border-transparent bg-black/15 text-white hover:bg-black/30'
                : 'border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            ×
          </button>
        </div>
        <div className={`${bodyClassName} text-xs`}>{children}</div>
        {footer ? (
          <div className="flex min-h-[58px] items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </section>
    </div>
  );
}
