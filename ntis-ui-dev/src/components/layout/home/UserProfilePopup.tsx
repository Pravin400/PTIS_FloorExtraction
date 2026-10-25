'use client';

import React, { useEffect, useMemo } from 'react';
import { User, Shield, Building, Globe, Hash, Clock, X, Phone, MapPin, Briefcase, Mail } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/common/Badge';
import { Label } from '@/components/common/label';
import { useTranslations } from 'next-intl';
import type { UserProfileDisplayValues } from '@/types/home/user-profile.types';

interface UserProfilePopupProps {
    isOpen: boolean;
    onClose: () => void;
    username?: string;
    ulbName?: string;
    userProfile?: UserProfileDisplayValues | null;
    profileError?: string;
    sessionId?: string;
    /** From server headers (SSR); preferred over any legacy client storage. */
    clientIp?: string;
}

export const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ 
    isOpen, 
    onClose, 
    username, 
    ulbName,
    userProfile,
    profileError: _profileError,
    sessionId,
    clientIp,
}) => {
    const t = useTranslations('common');

    // Format values with SSR data and fallbacks
    const displayValues = useMemo(() => ({
        // User profile data from SSR
        fullName: userProfile?.fullName || username || t('userMenu.defaultUser', { default: 'User' }),
        email: userProfile?.email || t('userMenu.notAvailable', { default: 'N/A' }),
        userId: userProfile?.userId || t('userMenu.notAvailable', { default: 'N/A' }),
        userCode: userProfile?.userCode || t('userMenu.notAvailable', { default: 'N/A' }),
        mobileNo: userProfile?.mobileNo || t('userMenu.notAvailable', { default: 'N/A' }),
        address: userProfile?.address || t('userMenu.notAvailable', { default: 'N/A' }),
        primaryRole: userProfile?.primaryRole || t('userMenu.defaultRole', { default: 'User' }),
        roles: userProfile?.roles || [],
        departments: userProfile?.departments || [],
        modules: userProfile?.modules || [],
        primaryDepartment: userProfile?.primaryDepartment || ulbName || t('userMenu.notAvailable', { default: 'N/A' }),
        
        // Session data
        sessionId: sessionId 
            ? `${sessionId.slice(0, 8)}...` 
            : t('userMenu.notAvailable', { default: 'N/A' }),
        loginTime: t('userMenu.notAvailable', { default: 'N/A' }),
        ipAddress: (clientIp ?? '').trim() || t('userMenu.notAvailable', { default: 'N/A' }),
    }), [userProfile, username, t, ulbName, sessionId, clientIp]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={cn(
            "absolute top-12 right-0 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-lg shadow-xl border border-gray-200 z-50",
            "profile-dropdown-container animate-in fade-in zoom-in-95 duration-200"
        )}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">{displayValues.fullName}</h3>
                        <p className="text-xs text-gray-500">{displayValues.email}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    title={t('buttons.close')}
                    aria-label={t('buttons.close')}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">

                {/* User ID & Code */}
                <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <Label className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">{t('userMenu.userId')}</Label>
                        <p className="text-sm font-medium text-gray-900">
                            {displayValues.userId} 
                            {displayValues.userCode && displayValues.userCode !== t('userMenu.notAvailable', { default: 'N/A' }) && (
                                <span className="text-gray-500 ml-1">({displayValues.userCode})</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <Label className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">{t('userMenu.phone', { default: 'Phone' })}</Label>
                        <p className="text-sm font-medium text-gray-900">{displayValues.mobileNo}</p>
                    </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <Label className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">{t('userMenu.address', { default: 'Address' })}</Label>
                        <p className="text-sm font-medium text-gray-900">{displayValues.address}</p>
                    </div>
                </div>

                {/* Roles */}
                <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <Label className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t('userMenu.role')}</Label>
                        <div className="flex flex-wrap gap-1">
                            {displayValues.roles.length > 0 ? (
                                displayValues.roles.map((role, idx) => (
                                    <Badge key={idx} variant="default" size="sm" className="bg-blue-50 text-blue-700 border-blue-100">
                                        {role}
                                    </Badge>
                                ))
                            ) : (
                                <Badge variant="default" size="sm" className="bg-blue-50 text-blue-700 border-blue-100">
                                    {displayValues.primaryRole}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Departments */}
                <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <Label className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t('userMenu.department')}</Label>
                        <div className="flex flex-wrap gap-1">
                            {displayValues.departments.length > 0 ? (
                                displayValues.departments.map((dept, idx) => (
                                    <Badge key={idx} variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200">
                                        {dept}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm font-medium text-gray-900">{displayValues.primaryDepartment}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modules */}
                {displayValues.modules.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                            <Label className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t('userMenu.modules', { default: 'Modules' })}</Label>
                            <div className="flex flex-wrap gap-1">
                                {displayValues.modules.map((module, idx) => (
                                    <Badge key={idx} variant="outline" size="sm" className="bg-purple-50 text-purple-700 border-purple-200">
                                        {module}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-100 my-2"></div>

                {/* Session Info */}
                <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('userMenu.publicIp')}</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">{displayValues.ipAddress}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('userMenu.sessionId')}</p>
                        <p className="text-sm font-medium text-gray-900 font-mono truncate w-48">{displayValues.sessionId}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('userMenu.loginTime')}</p>
                        <p className="text-sm font-medium text-gray-900">{displayValues.loginTime}</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-blue-50/50 rounded-b-lg border-t border-blue-100">
                <div className="flex gap-2 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>{t('app.securityPurpose')}</p>
                </div>
            </div>
        </div>
    );
};

