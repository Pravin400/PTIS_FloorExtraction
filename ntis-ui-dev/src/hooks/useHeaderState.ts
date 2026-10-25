// useHeaderState.ts
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { logoutAction } from '@/app/[locale]/login/actions';
import { clearAllAuthClientStorage } from '@/lib/utils/legacy-auth-storage';

export type LanguageType = 'English' | 'हिन्दी (Hindi)' | 'मराठी (Marathi)';

export function useHeaderState(initialIp = '') {
    const [language, setLanguage] = useState<LanguageType>('English');
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showSessionInfo, setShowSessionInfo] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [loginTime] = useState(new Date());
    const [ipAddress] = useState(initialIp);

    const toggleLanguage = () => {
        setShowLanguageDropdown((prev) => !prev);
    };

    const selectLanguage = (lang: LanguageType) => {
        setLanguage(lang);
        setShowLanguageDropdown(false);
        toast.success(`Language changed to ${lang}`);
    };

    const getLoginDuration = () => {
        const now = new Date();
        const diff = now.getTime() - loginTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { locale } = useParams();
    const handleLogout = async () => {
        if (isLoggingOut) return;
        
        setIsLoggingOut(true);
        toast.info('Logging out...');

        clearAllAuthClientStorage();

        try {
            // Call Server Action to clear cookies
            await logoutAction(typeof locale === 'string' ? locale : 'en');
        } catch (error) {
            // Only handle real errors, not NEXT_REDIRECT
            if (typeof error === 'object' && error && 'digest' in error && String(error.digest).startsWith('NEXT_REDIRECT')) {
                throw error;
            }
            // Optionally log to a monitoring service here if needed
            toast.error("Logout failed. Please try again.");
            setIsLoggingOut(false);
        }
    };

    const handleProfile = () => {
        setShowProfileDropdown(false);
        toast.info('Opening profile page...');
    };

    const handleSettings = () => {
        setShowProfileDropdown(false);
        toast.info('Opening settings...');
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showLanguageDropdown && !target.closest('.language-dropdown-container')) {
                setShowLanguageDropdown(false);
            }
            if (showProfileDropdown && !target.closest('.profile-dropdown-container')) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showLanguageDropdown, showProfileDropdown]);

    return {
        // state
        language,
        showLanguageDropdown,
        showSessionInfo,
        showProfileDropdown,
        isLoggingOut,
        loginTime,
        ipAddress,

        // setters you need in JSX
        setShowSessionInfo,
        setShowProfileDropdown,

        // actions
        toggleLanguage,
        selectLanguage,
        getLoginDuration,
        handleLogout,
        handleProfile,
        handleSettings,
    };
}
