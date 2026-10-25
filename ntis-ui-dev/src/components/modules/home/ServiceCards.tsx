
'use client';

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Service, ServiceCardProps } from "@/types/home/home.types";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/common/Badge";
import { resolveIcon } from "@/lib/utils/icon-mapping";
import { setDepartmentContextAction } from "@/app/[locale]/home/action";

/**
 * Gets the icon component for a department ID or name
 */
const getIcon = (iconKey: string) => {
    const IconComponent = resolveIcon(iconKey, iconKey);
    
    // Determine the dynamic class name based on icon keywords (themed coloring)
    let className = 'w-8 h-8 text-gray-700';
    const lowerKey = (iconKey || '').toLowerCase();
    
    if (lowerKey.includes('water') || lowerKey.includes('droplet') || lowerKey.includes('wt')) {
        className = 'w-8 h-8 text-blue-500 fill-blue-500';
    } else if (lowerKey.includes('trade') || lowerKey.includes('shop') || lowerKey.includes('license') || lowerKey.includes('tl') || lowerKey.includes('parwana')) {
        className = 'w-8 h-8 text-orange-600';
    } else if (lowerKey.includes('birth') || lowerKey.includes('death') || lowerKey.includes('file') || lowerKey.includes('bd') || lowerKey.includes('certificate')) {
        className = 'w-8 h-8 text-amber-700';
    } else if (lowerKey.includes('garbage') || lowerKey.includes('trash') || lowerKey.includes('waste') || lowerKey.includes('gc')) {
        className = 'w-8 h-8 text-green-700';
    } else if (lowerKey.includes('building') || lowerKey.includes('permission') || lowerKey.includes('bp') || lowerKey.includes('house')) {
        className = 'w-8 h-8 text-purple-700';
    } else if (lowerKey.includes('grievance') || lowerKey.includes('mega') || lowerKey.includes('complain') || lowerKey.includes('gr')) {
        className = 'w-8 h-8 text-red-600';
    } else if (lowerKey.includes('rts') || lowerKey.includes('timer') || lowerKey.includes('clock')) {
        className = 'w-8 h-8 text-indigo-600';
    } else if (lowerKey.includes('asset') || lowerKey.includes('land') || lowerKey.includes('am')) {
        className = 'w-8 h-8 text-teal-700';
    } else if (lowerKey.includes('fire') || lowerKey.includes('noc') || lowerKey.includes('flame')) {
        className = 'w-8 h-8 text-red-500 fill-red-500';
    }

    return <IconComponent className={className} aria-hidden="true" />;
};


const ServiceCard: React.FC<ServiceCardProps & { departmentId: number }> = ({
    departmentId,
    link,
    icon,
    title,
    subtext,
    stats,
    moduleId,
    moduleName
}) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    /**
     * SSR-safe navigation: Set cookies via server action FIRST, then navigate.
     *
     * Why not <Link> with onClick?
     * → <Link> navigates immediately, the server action may not complete
     *   before the destination page renders on the server (SSR).
     * → Using router.push() after await ensures cookies are set
     *   before the destination page's SSR reads them.
     */
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        startTransition(async () => {
            // 1. Maintain background cookie for ambient fallback
            await setDepartmentContextAction(departmentId, title, moduleId, moduleName);

            // 2. Append explicit department and module params to link for tab isolation
            const targetUrl = new URL(link, window.location.origin);
            targetUrl.searchParams.set('deptId', String(departmentId));
            if (moduleId) targetUrl.searchParams.set('modId', String(moduleId));

            router.push(targetUrl.pathname + targetUrl.search);
        });
    };

    return (
        <a
            href={link}
            className={cn(
                "block group decoration-0 no-underline h-full cursor-pointer",
                isPending && "opacity-70 pointer-events-none"
            )}
            aria-label={`Navigate to ${title}`}
            onClick={handleClick}
        >
            <article className={cn(
                "relative p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 min-h-[180px]",
                "flex flex-col justify-between border-l-[6px] border-solid border-[#004c8c] hover:scale-[1.02] h-full"
            )}>
                <div className="absolute top-2 right-3 flex flex-col items-end z-10 gap-1" aria-label="Statistics">
                    {stats?.map((stat: { label: string; value: string }, index: number) => (
                        <Badge 
                            key={index}
                            variant="secondary"
                            size="sm"
                            className="bg-blue-50/50 text-[#004c8c] border-blue-100 font-bold"
                        >
                            {stat.label}: {stat.value}
                        </Badge>
                    ))}
                </div>
                <div className="flex flex-col h-full pt-2">
                    <div className="mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">
                        {getIcon(icon)}
                    </div>
                    <div className="mt-auto">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#004c8c] transition-colors leading-tight">{title}</h3>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">{subtext}</p>
                    </div>
                </div>
            </article>
        </a>
    );
};

interface ServiceCardsProps {
    services?: Service[];
    error?: string;
}



/**
 * Empty state when user has no department access
 */
const NoDepartmentsMessage: React.FC = () => {
    const t = useTranslations('home');
    
    return (
        <section className="w-full p-4 sm:p-8 md:p-12 min-h-[300px]" aria-label="No Services">
            <div className="max-w-md mx-auto text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {t('services.noDepartmentsTitle')}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {t('services.noDepartmentsMessage')}
                    </p>
                </div>
            </div>
        </section>
    );
};

const ServiceCards: React.FC<ServiceCardsProps> = ({ services = [], error }) => {
    // Show empty state when no services or when an error occurs (hides red error banners on home screen)
    if (error || !services || services.length === 0) {
        return <NoDepartmentsMessage />;
    }

    return (
        <section className="w-full p-4 sm:p-6 md:p-8 min-h-[300px]" aria-label="Available Services">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
                {services.map(({ id, ...rest }) => (
                    <ServiceCard key={id} departmentId={id} {...rest} />
                ))}
            </div>
        </section>
    );
};

export default ServiceCards;
