import { AlertCircle } from "lucide-react";

interface MandatoryFieldsNoticeProps {
  message: string;
}

export function MandatoryFieldsNotice({ message }: MandatoryFieldsNoticeProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}
