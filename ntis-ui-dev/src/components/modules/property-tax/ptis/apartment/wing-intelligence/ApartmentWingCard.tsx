'use client';
import React from 'react';
import { ApartmentWingCardHeader } from './ApartmentWingCardHeader';
import { ApartmentWingTypeTable } from './ApartmentWingTypeTable';
import { ApartmentWingCardFooter } from './ApartmentWingCardFooter';
import { WingCardProps } from '@/types/property-tax/apartment';

export const ApartmentWingCard: React.FC<WingCardProps> = ({ data, isSelected, onClick, onDoubleClick, onAmcClick, onEdit }) => {

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group w-full bg-white rounded-xl flex flex-col h-full cursor-pointer select-none transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl active:scale-[0.985] active:translate-y-0 active:duration-75 ${
        isSelected
          ? 'border-2 border-blue-600 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-slate-50 shadow-lg shadow-blue-500/10'
          : 'border border-slate-300/90 shadow-sm hover:border-blue-400/80'
      } z-10`}
    >
      <ApartmentWingCardHeader
        letter={data.letter}
        name={data.name}
        rating={data.rating}
        blockName={data.blockName}
        stats={data.stats}
        areaUnit={data.areaUnit}
        colorClass={data.colorClass}
        isSelected={isSelected}
        isCommonAmenity={data.isCommonAmenity}
        onAmcClick={(e) => {
          e.stopPropagation();
          onAmcClick?.(e);
        }}
        onEdit={
          data.isCommonAmenity && !data.wingDetailId
            ? undefined
            : (e) => {
                e.stopPropagation();
                onEdit?.(e);
              }
        }
      />
      <div className="flex-grow">
        <ApartmentWingTypeTable types={data.types} areaUnit={data.areaUnit} />
      </div>
      <ApartmentWingCardFooter
        wingName={data.name}
        exemption={data.exemption}
        overallTax={data.overallTax}
        revenueImpact={data.revenueImpact}
      />
    </div>
  );
};

export default ApartmentWingCard;
