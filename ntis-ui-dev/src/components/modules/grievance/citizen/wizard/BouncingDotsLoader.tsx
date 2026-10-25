import { useTranslations } from 'next-intl';

interface BouncingDotsLoaderProps {
  title?: string;
  subtitle?: string;
}

export function BouncingDotsLoader({
  title,
  subtitle,
}: BouncingDotsLoaderProps) {
  const t = useTranslations('grievance');

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full h-full min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300"
    >
      <style>{`
        @keyframes bounceDot {
          0% {
            transform: translateY(0);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-16px);
            opacity: 1;
          }
          80% {
            transform: translateY(0);
            opacity: 0.6;
          }
          100% {
            transform: translateY(0);
            opacity: 0.6;
          }
        }

        .dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding-top: 16px;
        }

        .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          animation: bounceDot 1s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .dot-1 {
          background-color: #25a85f;
          animation-delay: 0s;
        }

        .dot-2 {
          background-color: #1a8f4d;
          animation-delay: 0.15s;
        }

        .dot-3 {
          background-color: #14753f;
          animation-delay: 0.3s;
        }
      `}</style>

      {/* Bouncing dots container */}
      <div className="dots">
        <span className="dot dot-1" aria-hidden="true" />
        <span className="dot dot-2" aria-hidden="true" />
        <span className="dot dot-3" aria-hidden="true" />
      </div>

      {/* Message below dots */}
      <div className="msg mt-6 space-y-1.5 max-w-sm">
        <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {title || t('submittingGrievanceNow')}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          {subtitle || t('uploadingEvidence')}
        </p>
      </div>
    </div>
  );
}
