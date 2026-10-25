import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import React from 'react';
import { Service, Stat } from '@/types/service.types';
import { getServices } from '@/lib/api/services';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  home: Icons.Home,
  droplet: Icons.Droplet,
  'shopping-bag': Icons.ShoppingBag,
  'file-text': Icons.FileText,
  'trash-2': Icons.Trash2,
  'building-2': Icons.Building2,
  megaphone: Icons.Megaphone,
  clock: Icons.Clock,
  landmark: Icons.Landmark,
};

interface ServiceCardProps {
  link: string;
  icon: string;
  title: string;
  subtext: string;
  stats?: Stat[];
}

const ServiceCard = ({ link, icon, title, subtext, stats }: ServiceCardProps) => {
  const IconComponent = iconMap[icon] || Icons.HelpCircle;

  return (
    <Link href={link} className="block group">
      <div className="relative pt-[20px] pr-5 pb-[15px] pl-[15px] bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 min-h-[130px] flex flex-col justify-end border-l-[8px] border-solid border-[#004c8c]">
        <div className="absolute top-[1px] right-[5px] flex flex-col items-end z-10">
          {stats?.map((stat) => (
            <div
              key={stat.label}
              className="py-1 px-[5px] rounded-xl text-[12px] text-[#004c8c] whitespace-nowrap font-bold"
            >
              {stat.label}: <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <div className="text-[#004c8c] mb-2">
            {React.createElement(IconComponent, { size: 36 })}
          </div>
          <div className="text-lg font-semibold text-gray-800">{title}</div>
          <p className="text-xs text-gray-500">{subtext}</p>
        </div>
      </div>
    </Link>
  );
};

/**
 * ServiceCards - Server Component
 * Renders a grid of service cards with SSR support
 */
const ServiceCards = async () => {
  const services: Service[] = await getServices();
  const t = await getTranslations('common');

  // Show empty state if no services - defensive check
  if (!services || !Array.isArray(services) || services.length === 0) {
    return (
      <section className="p-4 sm:p-6 max-w-7xl mx-auto min-h-[250px]">
        <div className="text-center text-gray-500 py-12">{t('app.noServicesAvailable')}</div>
      </section>
    );
  }

  return (
    <section className="p-4 sm:p-6 max-w-7xl mx-auto min-h-[250px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4">
        {services.map((service) => (
          <ServiceCard key={service.id} {...service} />
        ))}
      </div>
    </section>
  );
};

export default ServiceCards;
