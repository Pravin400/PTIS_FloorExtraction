import { Mail, MapPin, Phone, User } from "lucide-react";
import type { PropertyInfo } from "@/types/water-connection.types";
import { Badge } from "@/components/common/Badge";

interface PropertyInfoCardProps {
  property: PropertyInfo;
  labels: {
    owner: string;
    contact: string;
    email: string;
    address: string;
    propertyNo: string;
    zone: string;
    ward: string;
    buildingType: string;
  };
}



export function PropertyInfoCard({ property, labels }: PropertyInfoCardProps) {
  return (
    <div className="bg-[#F2F6FC] rounded-xl border border-blue-100/70 p-2.5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch">

        {/* Owner Info Box */}
        <div className="flex gap-2.5 items-start bg-white p-2.5 rounded-lg border border-slate-100/80">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <User size={14} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
              {labels.owner}
            </div>
            <div className="text-xs font-bold text-slate-800 truncate" title={property.ownerName}>
              {property.ownerName}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-medium text-slate-500">{property.customerId}</span>
              {property.customerType && (
                <Badge className="inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded bg-blue-50 text-blue-600 border border-blue-100/60">
                  {property.customerType}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info Box */}
        <div className="flex flex-col gap-2 bg-white p-2.5 rounded-lg border border-slate-100/80 justify-center">
          <div className="flex items-center gap-2 min-w-0">
            <Phone size={13} className="text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none mb-0.5">{labels.contact}</span>
              <span className="text-xs font-semibold text-slate-700 truncate block">{property.contact || "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0 border-t border-slate-50 pt-1.5">
            <Mail size={13} className="text-blue-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none mb-0.5">{labels.email}</span>
              <span className="text-xs font-semibold text-slate-700 truncate block" title={property.email || ""}>
                {property.email || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Info Box */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 bg-white p-2.5 rounded-lg border border-slate-100/80">
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">
              {labels.buildingType}
            </div>
            <div
              className="text-[10px] font-bold text-slate-700 truncate"
              title={property.buildingType}
            >
              {property.buildingType}
            </div>
          </div>

          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">
              {labels.zone}
            </div>
            <div
              className="text-xs font-semibold text-slate-700 truncate"
              title={property.zone}
            >
              {property.zone}
            </div>
          </div>

          <div className="col-span-2 bg-purple-50/50 border border-purple-100/70 rounded-lg p-2 mt-1 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              {labels.propertyNo}
              <span className="sr-only">{labels.ward}</span>
            </span>
            <span
              className="text-xs font-bold text-purple-700 font-mono normal-case tracking-wide bg-white px-2.5 py-0.5 rounded-md border border-purple-200/60 shadow-sm"
              title={`${property.ward}${property.propertyNo}`}
            >
              {property.ward && (
                <>
                  <span>{property.ward}</span>
                  <span>-</span>
                </>
              )}
              <span>{property.propertyNo}</span>
            </span>
          </div>
        </div>

        {/* Address Box */}
        <div className="flex gap-2.5 items-start bg-white p-2.5 rounded-lg border border-slate-100/80">
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={14} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
              {labels.address}
            </div>
            <div className="text-[10px] font-medium text-slate-600 leading-normal line-clamp-2" title={property.address}>
              {property.address}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
