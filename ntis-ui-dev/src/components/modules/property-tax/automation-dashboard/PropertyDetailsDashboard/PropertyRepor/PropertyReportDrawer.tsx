
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Drawer } from '@/components/common/Drawer';
import { FileText, Download, ExternalLink, Maximize2, X, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { DocumentViewerModal } from '@/components/common/DocumentViewerModal';
import { Button } from '@/components/common';
import { KarakarniDocument } from './KarakarniDocument';
import { AdditionalDocument } from './AdditionalDocument';

interface ReportPropertyData {
    propertyNo: { new: string; old?: string; };
    wardNo: string;
    constructionYear: string;
    oldRecord: { use: string; area: string; rv: string; totalTax: string; };
    newRecord: { use: string; area: string; rv: string; totalTax: string; };
    owner: string;
    occupier: string;
    additionalRevenue: string;
    propertyType: string;
    assessmentStatus: string;
    address: string;
    category: string;
    categoryMarathi?: string;
    desc: { floors: number; units: number; };
}

export const PropertyReportDrawer = ({ isOpen: _isOpen, onClose: _onClose, propertyData: _propertyData }: { isOpen?: boolean, onClose?: () => void, propertyData?: ReportPropertyData | null }) => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('automationDashboard.propertyDetailsDashboard');

    const propertyId = params?.propertyId as string;
    const division = searchParams.get('division') || 'DI';
    const zoneId = searchParams.get('zoneId') || division;
    // const stage = searchParams.get('stage') || 'geoSequencing';
    // const workflowStageId = searchParams.get('workflowStageId');
    const locale = useLocale();

    // Find the property data dynamically
    const selectedProperty: ReportPropertyData | null = useMemo(() => {
        if (!propertyId) return null;
        return {} as ReportPropertyData;
    }, [propertyId]);

    const [activeDocTab, setActiveDocTab] = useState<'karakarni' | 'additional' | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerFileUrl, setViewerFileUrl] = useState('');
    const [viewerFileName, setViewerFileName] = useState('');
    
    const handleClose = () => {
        setActiveDocTab(null);
        setIsViewerOpen(false);
        const pathZoneId = params?.zoneId as string;
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        router.push(`/${locale}/property-tax/automation-dashboard/property-details-dashboard/${pathZoneId || zoneId}?${currentParams.toString()}`);
    };

    const openDocumentViewer = (tab: 'karakarni' | 'additional') => {
        const dummyPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        if (tab === 'karakarni') {
            setViewerFileUrl(dummyPdfUrl);
            setViewerFileName('Karakarni_Document.pdf');
        } else {
            setViewerFileUrl(dummyPdfUrl);
            setViewerFileName('Additional_Document.pdf');
        }
        setIsViewerOpen(true);
    };

    return (
        <>
            <Drawer
                open={true}
                onClose={handleClose}
                width="lg"
                hideHeader={true}
            >
                <div className="flex flex-col h-[calc(100vh-2px)] bg-white overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#1A56DB] px-6 py-4 flex items-center justify-between shadow-md select-none">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-white font-bold text-[15px] leading-tight">{t('report.propertyDetails')}</h3>
                                <span className="text-blue-100 text-xs mt-0.5 font-medium">
                                    {t('report.propertyDetails')} - {selectedProperty?.propertyNo?.new || 'MUMAJOR1-1-A'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {activeDocTab ? (
                                <a
                                    href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                                    download={activeDocTab === 'karakarni' ? 'Karakarni_Document.pdf' : 'Additional_Document.pdf'}
                                    className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 h-7 px-2.5 text-xs gap-1.5 whitespace-nowrap text-white hover:bg-white/10"
                                    aria-label={t('common.download')}
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{t('common.download')}</span>
                                </a>
                            ) : (
                                <Button
                                    disabled
                                    variant="ghost"
                                    size="xs"
                                    icon={Download}
                                    className="text-white hover:bg-white/10 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={t('common.download')}
                                >
                                    {t('common.download')}
                                </Button>
                            )}
                            {activeDocTab ? (
                                <Link
                                    href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                                    target="_blank"
                                    className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 h-7 px-2.5 text-xs gap-1.5 whitespace-nowrap text-white hover:bg-white/10"
                                    aria-label={t('common.newTab')}
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{t('common.newTab')}</span>
                                </Link>
                            ) : (
                                <Button
                                    disabled
                                    variant="ghost"
                                    size="xs"
                                    icon={ExternalLink}
                                    className="text-white hover:bg-white/10 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={t('common.newTab')}
                                >
                                    {t('common.newTab')}
                                </Button>
                            )}
                            <Button
                                disabled={!activeDocTab}
                                onClick={() => activeDocTab && openDocumentViewer(activeDocTab)}
                                variant="ghost"
                                size="xs"
                                icon={Maximize2}
                                className="border border-white/25 hover:bg-white/10 text-white"
                                aria-label={t('common.maximize')}
                            />
                            <Button
                                onClick={handleClose}
                                variant="ghost"
                                size="xs"
                                icon={X}
                                className="hover:bg-white/10 text-white"
                                aria-label={t('common.close')}
                            />
                        </div>
                    </div>

                    {/* Main Workspace Area */}
                    <div className="flex flex-1 overflow-hidden min-h-0">
                        {/* Document Viewer Area (Left Panel) */}
                        <div className="flex-grow bg-[#F8FAFC] flex flex-col items-center justify-center border-r border-slate-200 p-8 overflow-y-auto">
                            {activeDocTab === 'karakarni' ? (
                                <KarakarniDocument selectedProperty={selectedProperty} />
                            ) : activeDocTab === 'additional' ? (
                                <AdditionalDocument selectedProperty={selectedProperty} />
                            ) : (
                                <>
                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-5 animate-in zoom-in-75 duration-200">
                                        <ImageIcon className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h4 className="text-[14px] font-bold text-slate-600 animate-in fade-in duration-200">{t('report.noDocument')}</h4>
                                    <p className="text-[11px] text-slate-400 text-center leading-relaxed mt-2 max-w-[280px] animate-in fade-in duration-200">
                                        {t('report.noDocumentText')}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Document Views Sidebar (Right Panel) */}
                        <div className="w-[280px] bg-white flex flex-col p-5 justify-between border-l border-slate-100 select-none">
                            <div>
                                <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                                    {t('report.documentViews')}
                                </div>
                                <div className="w-8 h-[2.5px] bg-[#1A56DB] mb-6"></div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => setActiveDocTab(activeDocTab === 'karakarni' ? null : 'karakarni')}
                                        variant={activeDocTab === 'karakarni' ? 'primary' : 'secondary'}
                                        size="sm"
                                        className={cn(
                                            "w-full text-center transition-colors shadow-sm cursor-pointer",
                                            activeDocTab === 'karakarni'
                                                ? "bg-[#1A56DB] text-white border-transparent hover:bg-[#1E429F]"
                                                : "bg-[#EFF6FF] text-[#1A56DB] border-[#BFDBFE] hover:bg-[#DBEAFE]"
                                        )}
                                        aria-label={t('report.karakarni')}
                                    >
                                        {t('report.karakarni')}
                                    </Button>
                                    <Button
                                        onClick={() => setActiveDocTab(activeDocTab === 'additional' ? null : 'additional')}
                                        variant={activeDocTab === 'additional' ? 'primary' : 'secondary'}
                                        size="sm"
                                        className={cn(
                                            "w-full transition-colors shadow-sm flex items-center justify-between cursor-pointer",
                                            activeDocTab === 'additional'
                                                ? "bg-[#1A56DB] text-white border-transparent hover:bg-[#1E429F]"
                                                : "bg-[#EFF6FF] text-[#1A56DB] border-[#BFDBFE] hover:bg-[#DBEAFE]"
                                        )}
                                        aria-label={t('report.additionalDocument')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className={cn("h-4 w-4", activeDocTab === 'additional' ? "text-white" : "text-[#1A56DB]")} />
                                            <span>{t('report.additionalDocument')}</span>
                                            <ChevronRight className={cn("h-4 w-4", activeDocTab === 'additional' ? "text-white" : "text-[#1A56DB]")} />
                                        </div>
                                    </Button>
                                </div>
                            </div>

                            <div className="text-[10px] text-slate-400 font-medium italic text-right mt-auto">
                                {t('report.systemName')}
                            </div>
                        </div>
                    </div>
                </div>
            </Drawer>
            <DocumentViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                fileUrl={viewerFileUrl}
                fileName={viewerFileName}
                propertyNo={selectedProperty?.propertyNo?.new}
            />
        </>
    );
};