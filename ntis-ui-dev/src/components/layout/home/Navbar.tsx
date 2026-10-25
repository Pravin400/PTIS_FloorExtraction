'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useHeaderState } from '@/hooks/useHeaderState';

import { Settings, User, AlertCircle } from "lucide-react";

import { Button } from "@/components/common/ActionButton";
import type { UserProfileDisplayValues } from "@/types/home/user-profile.types";

interface NavbarProps {
    username?: string;
    ulbName?: string;
    userProfile?: UserProfileDisplayValues | null;
    profileError?: string;
    sessionId?: string;
    clientIp?: string;
}

export const Navbar = ({
    username,
    ulbName,
    userProfile,
    profileError: _profileError,
    sessionId: _sessionId,
    clientIp: _clientIp,
}: NavbarProps) => {
    const t = useTranslations('common');
    const tLogin = useTranslations('login');
    const displayUlbName = ulbName || t('app.defaultUlbName');
    const locale = useLocale();
    const {
        handleLogout,
        isLoggingOut
    } = useHeaderState();

    const [warningActive, setWarningActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [warningType, setWarningType] = useState<'session' | 'inactivity'>('session');
    const isCritical = secondsLeft <= 20;

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleTick = (e: Event) => {
            const customEvent = e as CustomEvent<{ secondsLeft: number; active: boolean; type?: 'session' | 'inactivity' }>;
            setWarningActive(customEvent.detail.active);
            setSecondsLeft(customEvent.detail.secondsLeft);
            if (customEvent.detail.type) {
                setWarningType(customEvent.detail.type);
            }
        };

        window.addEventListener('ntis:session-warning-tick', handleTick);
        return () => {
            window.removeEventListener('ntis:session-warning-tick', handleTick);
        };
    }, []);

    return (
        <div className="w-full">
            {/* Navigation Bar */}
            <nav className="bg-[#004c8c] text-white flex justify-end items-center px-4 py-2 sm:px-6 sm:py-1.5 shadow-md overflow-x-auto lg:overflow-x-visible">
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                    {/* Session Expiration Warning (Pulsing Highlight Pill) */}
                    {warningActive && secondsLeft > 0 && (
                        <div
                            className={`flex items-center gap-2 sm:gap-3 rounded-xl border px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-bold shadow-lg backdrop-blur-md self-center shrink-0 transition-all duration-300 ${
                                isCritical
                                    ? 'border-red-500 bg-red-950/80 text-white shadow-red-500/30 critical-flash-active'
                                    : 'border-amber-500/70 bg-amber-950/60 text-amber-100 shadow-amber-500/20 warning-flash-active'
                            } session-warn-active`}
                            role="status"
                            aria-live="polite"
                        >


                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span
                                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        isCritical ? 'animate-ping bg-red-400' : 'bg-amber-400 animate-pulse'
                                    }`}
                                />
                                <span
                                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                        isCritical ? 'bg-red-500' : 'bg-amber-500'
                                    }`}
                                />
                            </span>
                            <AlertCircle
                                className={`h-4 w-4 shrink-0 transition-transform ${
                                    isCritical ? 'text-red-400 animate-bounce timer-blink-sharp' : 'text-amber-400 timer-blink-smooth'
                                }`}
                                aria-hidden
                            />
                            <span
                                className={`font-mono text-xs sm:text-sm font-extrabold tracking-wide ${
                                    isCritical ? 'text-red-200 timer-blink-sharp' : 'text-amber-300 timer-blink-smooth'
                                }`}
                            >
                                {tLogin('sessionTimeout.countdown', { seconds: secondsLeft })}
                            </span>
                            <span
                                className={`hidden lg:inline font-semibold ${
                                    isCritical ? 'text-red-100' : 'text-amber-200/90'
                                }`}
                            >
                                {warningType === 'inactivity'
                                    ? tLogin('sessionTimeout.inactivitySaveWorkHint')
                                    : tLogin('sessionTimeout.saveWorkHint')}
                            </span>
                        </div>
                    )}

                    {userProfile?.hasSettingsAccess !== false && (
                        <Link
                            href={`/${locale}/configuration-settings`}
                            className="flex items-center gap-1.5 sm:gap-2 hover:text-blue-200 transition-colors shrink-0"
                            title={t('navigation.settings')}
                        >
                            <Settings className="w-4 h-4" />
                            <span className="hidden md:inline text-sm font-medium">{t('navigation.settings')}</span>
                        </Link>
                    )}

                    {/* User info */}
                    <div className="flex items-center gap-2 sm:gap-3 text-left border-l border-blue-400 pl-3 sm:pl-4 md:pl-6 shrink-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30 shrink-0">
                            <User className="w-4 sm:w-5 h-4 sm:h-5 text-blue-100" />
                        </div>
                        <div className="hidden sm:flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-1">
                            <span className="text-[10px] sm:text-xs text-blue-200 leading-none">{t('app.welcome')}</span>
                            <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[80px] md:max-w-[120px] lg:max-w-none">{username || t('app.defaultUser')}</span>
                        </div>
                    </div>

                    {/* Logout button */}
                    <Button
                        onClick={handleLogout}
                        variant="danger"
                        size="xs"
                        disabled={isLoggingOut}
                        className="rounded-full px-4 shadow-md hover:shadow-lg hover:scale-105"
                    >
                        {isLoggingOut ? '...' : t('actions.logout')}
                    </Button>
                </div>
            </nav>

            {/* Animated Welcome Message with prefers-reduced-motion check */}
            <div className="bg-[#d1ecf1] text-[#004c8c] font-bold py-1 text-sm sm:text-base text-center overflow-hidden">
                <div className="inline-block animate-marquee whitespace-nowrap px-4">
                    {t('app.welcomeTo', { name: displayUlbName })} – {t('app.smartGovernance')}
                </div>
            </div>


        </div>
    );
};
