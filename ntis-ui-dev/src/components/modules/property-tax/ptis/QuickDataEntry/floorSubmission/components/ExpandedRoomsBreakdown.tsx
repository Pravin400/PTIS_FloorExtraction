'use client';

import React from 'react';
import { FloorData, RoomAPIResponse } from '@/types/room-details.types';

interface ExpandedRoomsBreakdownProps {
  floor: FloorData;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const ExpandedRoomsBreakdown: React.FC<ExpandedRoomsBreakdownProps> = ({ floor, t }) => {
  const rooms = (floor.roomWiseSubmissionDetails || []) as RoomAPIResponse[];
  
  if (rooms.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-500 bg-blue-50/50 rounded-lg border border-dashed border-blue-200">
        {t('floor.noRoomsFound', { defaultValue: 'No rooms added to this floor yet.' })}
      </div>
    );
  }

  return (
    <div className="p-3 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 rounded-xl border border-blue-100 shadow-inner">
      <h4 className="text-[11px] font-bold text-blue-900 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
        {t('floor.roomBreakdown', { count: rooms.length, defaultValue: `Room Details Breakdown (${rooms.length} Rooms)` })}
      </h4>
      <div className="overflow-hidden rounded-lg border border-blue-100 shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-blue-800 text-white font-bold uppercase tracking-wider">
              <th className="p-2 border-r border-blue-700/50 text-center w-16">{t('floor.roomNo', { defaultValue: 'Room No' })}</th>
              <th className="p-2 border-r border-blue-700/50">{t('floor.roomName', { defaultValue: 'Room Name' })}</th>
              <th className="p-2 border-r border-blue-700/50 w-28 text-center">{t('floor.roomShape', { defaultValue: 'Shape' })}</th>
              <th className="p-2 border-r border-blue-700/50 text-center w-40">{t('floor.dimensions', { defaultValue: 'Dimensions (L x B x H)' })}</th>
              <th className="p-2 text-right w-32">{t('floor.carpetArea', { defaultValue: 'Carpet Area' })}</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, idx) => {
              const dimStr = `${room.length || '-'} x ${room.breadth || '-'} x ${room.height || '-'}`;
              const formatArea = (val: unknown) => {
                if (val === undefined || val === null || val === '') return '0.00';
                const num = Number(val);
                return isNaN(num) ? '0.00' : num.toFixed(2);
              };
              const areaStr = `${formatArea(room.area)} Sq.Ft`;
              return (
                <tr
                  key={room.id ? `room-${room.id}-${idx}` : `room-idx-${idx}`}
                  className="bg-white border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                >
                  <td className="p-2 border-r border-gray-100 text-center font-semibold text-blue-900">
                    {room.roomNo || idx + 1}
                  </td>
                  <td className="p-2 border-r border-gray-100 font-semibold text-gray-700">
                    {room.roomName || 'N/A'}
                  </td>
                  <td className="p-2 border-r border-gray-100 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px] border border-slate-200">
                      {room.shape || 'Standard'}
                    </span>
                  </td>
                  <td className="p-2 border-r border-gray-100 text-center text-gray-600 font-medium">{dimStr}</td>
                  <td className="p-2 text-right font-bold text-blue-800">{areaStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
