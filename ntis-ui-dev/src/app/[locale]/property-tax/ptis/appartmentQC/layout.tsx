'use client';

import { PageContainer, Tabs } from '@/components/common';
import { Building, Home, Building2, Calculator, GitMerge, IndianRupee } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locale = useLocale();

    const base = `/${locale}/property-tax/ptis/appartmentQC`;

    // Determine active main tab from pathname
    const activeTab =
        pathname.includes('/amenities')
            ? 'amenities'
            : pathname.includes('/commercial')
                ? 'commercial'
                : pathname.includes('/residential')
                    ? 'residential'
                    : pathname.endsWith('/appartmentQC')
                        ? 'amenities'
                        : 'amenities';

    // Get active sub-tab from URL search params, default to 'rateable'
    const activeSubTab = searchParams.get('subTab') || 'rateable';

    const tabs = [
        { value: 'amenities', label: 'Amenities', icon: Building2, content: null },
        { value: 'commercial', label: 'Commercial Units', icon: Building, content: null },
        { value: 'residential', label: 'Residential Units', icon: Home, content: null },
    ];

    const subTabs = [
        { value: 'rateable', label: 'Rateable', icon: Calculator, content: null },
        { value: 'capital', label: 'Capital', icon: IndianRupee, content: null },
        { value: 'dual-method', label: 'Dual Method', icon: GitMerge, content: null },
    ];

    const handleMainTabChange = (v: string | number) => {
        // Navigate to main tab with default sub-tab (rateable)
        router.push(`${base}/${v}?subTab=rateable`);
    };

    const handleSubTabChange = (v: string | number) => {
        // Navigate to sub-tab within current main tab using search params
        router.push(`${base}/${activeTab}?subTab=${v}`);
    };

    return (
        <PageContainer>
            {/* Tabs Navigation - Main tabs and Sub-tabs in same row */}
            
                <div className="flex flex-row">
                    {/* Main Tabs */}
                    <Tabs
                        className='flex flex-row w-[125px]'
                        value={activeTab}
                        variant="pills"
                        items={tabs}
                        onChange={handleMainTabChange}
                    />


                    <Tabs
                        className='flex flex-row ml-4'
                        value={activeSubTab}
                        variant="pills"
                        items={subTabs}
                        onChange={handleSubTabChange}
                    />
                </div>

           

            {/* Content Area */}
            <div className="flex-1 overflow-auto text-gray-900 bg-gray-50">
                {children}
            </div>
        </PageContainer >
    );
};

export default Layout;
