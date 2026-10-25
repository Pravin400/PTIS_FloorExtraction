'use client';

import { QRCodeSVG } from 'qrcode.react';

type DynamicReceiptQRCodeProps = {
  value: string;
  size?: number;
  className?: string;
};

export default function DynamicReceiptQRCode({ value, size = 92, className }: DynamicReceiptQRCodeProps) {
  if (!value) {
    return <div className={className} style={{ width: size, height: size, background: '#f3f4f6' }} aria-hidden="true" />;
  }

  return <QRCodeSVG value={value} size={size} level="M" includeMargin={false} className={className} />;
}
