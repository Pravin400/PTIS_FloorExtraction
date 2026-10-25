'use client';

import { Button } from '@/components/common';
import { Printer } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

type RestoreFn = null | (() => void);

export default function PrintReceiptButton() {
  const restorePrintNodeRef = useRef<RestoreFn>(null);
  const restoreBodyChildrenRef = useRef<RestoreFn>(null);

  const clearPrintMode = useCallback(() => {
    if (restoreBodyChildrenRef.current) {
      restoreBodyChildrenRef.current();
      restoreBodyChildrenRef.current = null;
    }

    if (restorePrintNodeRef.current) {
      restorePrintNodeRef.current();
      restorePrintNodeRef.current = null;
    }

    document.documentElement.classList.remove('printing-payment-receipt');
    document.body.classList.remove('printing-payment-receipt');
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => clearPrintMode();
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      clearPrintMode();
    };
  }, [clearPrintMode]);

  const handlePrint = useCallback(() => {
    clearPrintMode();

    const printableReceipt = document.getElementById('printable-receipt');
    if (printableReceipt?.parentElement) {
      const originalParent = printableReceipt.parentElement;
      const originalNextSibling = printableReceipt.nextSibling;

      document.body.appendChild(printableReceipt);
      restorePrintNodeRef.current = () => {
        if (!originalParent.isConnected) return;
        if (originalNextSibling && originalParent.contains(originalNextSibling)) {
          originalParent.insertBefore(printableReceipt, originalNextSibling);
        } else {
          originalParent.appendChild(printableReceipt);
        }
      };

      const bodyChildren = Array.from(document.body.children).filter((child) => child !== printableReceipt);
      const previousBodyChildStyles = bodyChildren.map((child) => ({
        element: child as HTMLElement,
        style: (child as HTMLElement).getAttribute('style'),
      }));

      previousBodyChildStyles.forEach(({ element }) => {
        element.style.setProperty('display', 'none', 'important');
      });

      restoreBodyChildrenRef.current = () => {
        previousBodyChildStyles.forEach(({ element, style }) => {
          if (style === null) {
            element.removeAttribute('style');
          } else {
            element.setAttribute('style', style);
          }
        });
      };
    }

    document.documentElement.classList.add('printing-payment-receipt');
    document.body.classList.add('printing-payment-receipt');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, [clearPrintMode]);

  return (
    <Button
      type="button"
      variant="primary"
      icon={Printer}
      onClick={handlePrint}
      className="!h-auto !inline-flex !items-center !gap-[6px] !bg-[#1f4e9b] !text-white !rounded-[6px] !px-3 !py-[6px] !text-xs !font-semibold !cursor-pointer !border-none !transition-all !duration-200 hover:!bg-[#15366c] !shadow-[0_2px_4px_rgba(31,78,155,0.2)] [&_svg]:!w-4 [&_svg]:!h-4"
      aria-label="Print payment receipt"
    >
      {"Print Receipt"}
    </Button>
  );
}
