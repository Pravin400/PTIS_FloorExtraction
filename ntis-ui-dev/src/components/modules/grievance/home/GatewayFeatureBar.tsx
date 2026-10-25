import { EyeOff, BellRing, Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * GatewayFeatureBar
 * Full-width vibrant blue highlight strip matching the reference design:
 * 1. Direct Department Routing
 * 2. Real-time tracking & SMS
 * 3. Free & SLA Guaranteed
 */
export function GatewayFeatureBar() {
  const t = useTranslations('grievance');

  const features = [
    {
      icon: EyeOff,
      title: t('featureRoutingTitle'),
      desc: t('featureRoutingDesc'),
    },
    {
      icon: BellRing,
      title: t('featureTrackingTitle'),
      desc: t('featureTrackingDesc'),
    },
    {
      icon: Gift,
      title: t('featureSlaTitle'),
      desc: t('featureSlaDesc'),
    },
  ];

  return (
    <div className="w-full bg-[#2563EB] text-white py-4 sm:py-5 px-4 sm:px-6 md:px-12 z-20 shrink-0 shadow-lg">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-center">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center justify-start md:justify-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] text-blue-100 font-medium leading-snug mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
