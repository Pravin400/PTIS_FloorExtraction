
import { getTranslations } from "next-intl/server";

interface FooterProps {
    ulbName?: string;
}

export const Footer = async ({ ulbName }: FooterProps) => {
    const t = await getTranslations('common');
    const displayUlbName = ulbName || t('app.defaultUlbName');
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#004c8c] text-white text-center py-3 text-xs sm:text-sm mt-auto">
            &copy; {currentYear} {displayUlbName}. {t('footer.allRightsReserved', { default: 'All rights reserved' })}
        </footer>
    );
};
