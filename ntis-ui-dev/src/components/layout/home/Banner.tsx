import { useTranslations } from "next-intl";
import { LanguageDropdown } from "@/components/common";

interface BannerProps {
    ulbName?: string;
    backgroundSrc?: string;
}

export const Banner = ({ ulbName, backgroundSrc }: BannerProps) => {
    const t = useTranslations('common');
    const displayUlbName = ulbName || t('app.defaultUlbName');

    const bannerStyle = backgroundSrc
        ? {
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${backgroundSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : {};

    return (
        <header className="w-full" role="banner">
            {/* Banner image */}
            <div 
                className="relative w-full bg-gradient-to-r from-blue-900 via-blue-800 to-teal-800 h-[120px] sm:h-[165px] md:h-[200px] lg:h-[220px]"
                style={bannerStyle}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" aria-hidden="true"></div>

                {/* Language Dropdown at top right corner */}
                <div className="absolute top-4 right-4 z-50">
                    <LanguageDropdown />
                </div>

                {/* Banner heading */}
                <div className="relative z-10 flex items-center justify-center h-full">
                    <h1 className="text-white text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center drop-shadow-md">
                        {displayUlbName}
                    </h1>
                </div>
            </div>
        </header>
    );
};
