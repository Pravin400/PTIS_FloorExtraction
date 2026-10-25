import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/common/Badge";

export interface MandatoryFieldsNoticeProps {
  message: string;
}

export function MandatoryFieldsNotice({ message }: MandatoryFieldsNoticeProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
      <AlertCircle size={16} className="shrink-0" />
      <Badge
        variant="warning"
        className="border-0 bg-transparent p-0 text-sm font-normal text-orange-700 shadow-none inline-flex"
      >
        {message}
      </Badge>
    </div>
  );
}
