"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common";
import { Download, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

interface AgreementDocumentViewerProps {
    open: boolean;
    onClose: () => void;
    documentUrl?: string;
    fileName?: string;
}

export const AgreementDocumentViewer = ({ open, onClose, documentUrl, fileName }: AgreementDocumentViewerProps) => {
    const t = useTranslations('quickDataEntry');
    
    return (
        <Modal 
            open={open} 
            onClose={onClose} 
            title={t('floor.renterSection.agreementPreview')}
            subtitle={fileName || "agreement_document.pdf"}
            maxWidth="lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    <Button variant="ghost" onClick={onClose} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800">
                        {t('floor.renterSection.cancel')}
                    </Button>
                    <Button 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                        onClick={() => {
                            if (documentUrl) {
                                const link = document.createElement("a");
                                link.href = documentUrl;
                                link.download = fileName || "agreement_document";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }}
                    >
                        <Download className="w-3.5 h-3.5" /> {t('floor.renterSection.download')}
                    </Button>
                </div>
            }
        >
            <div className="relative aspect-[1/1.4] w-full bg-slate-200 flex items-center justify-center overflow-hidden rounded-lg">
                {documentUrl ? (
                    <iframe 
                        src={documentUrl} 
                        className="w-full h-full border-none"
                        title="Agreement Preview"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                        <FileText className="w-12 h-12 opacity-20" />
                        <p className="text-[10px] uppercase tracking-widest mt-1">{t('floor.renterSection.pleaseUploadAgreement')}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
