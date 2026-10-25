'use client';

import { motion } from 'motion/react';
import { Map as MapIcon, Layers, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleSwitch as Switch } from '@/components/common/ToggleSwitch';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { useGisLayerMasters } from '@/hooks/asset-gis-api/useAssetGisQueries';

export function AssetGisLayerList() {
  const t = useTranslations('assetGis');
  // Use Selectors
  const baseLayer = useCouncilBoundaryStore(state => state.baseLayer);
  const setBaseLayer = useCouncilBoundaryStore(state => state.setBaseLayer);
  const layerVisibility = useCouncilBoundaryStore(state => state.layerVisibility);
  const setLayerVisibility = useCouncilBoundaryStore(state => state.setLayerVisibility);
  const ensureGeoJsonLayerLoaded = useCouncilBoundaryStore(state => state.ensureGeoJsonLayerLoaded);

  const { data: masterLayers = [] } = useGisLayerMasters();

  const baseLayerOptions = [
    { id: 'street', label: 'Street', icon: Layers, image: 'url("https://a.tile.openstreetmap.org/13/5824/3662.png")', color: '#10b981' },
    { id: 'google_street', label: 'Google Map', icon: MapIcon, image: 'url("https://mt1.google.com/vt/lyrs=m&x=5824&y=3662&z=13")', color: '#3b82f6' },
    { id: 'google_satellite', label: 'Satellite', icon: MapIcon, image: 'url("https://mt1.google.com/vt/lyrs=y&x=5824&y=3662&z=13")', color: '#f59e0b' },
    { id: 'none', label: 'None', icon: Zap, image: 'none', color: '#94a3b8' }
  ] as const;

  // Purely database-driven overlay layers from GET /api/GisLayerMaster (GIS.GisLayerMaster)
  const overlayLayers = masterLayers.map((m) => {
    const cleanK = String(m.layerKey || m.layerName || m.id).toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      id: String(m.id),
      numericId: m.id,
      layerKey: m.layerKey || String(m.id),
      cleanKey: cleanK,
      label: m.layerName,
      color: m.color || '#3b82f6',
    };
  });

  const isLayerActive = (layer: { id: string; cleanKey: string; layerKey: string }) => {
    if (layer.cleanKey === '1' || layer.cleanKey === 'zone' || layer.cleanKey.includes('zone')) {
      return !!(layerVisibility['zone'] || layerVisibility['1'] || layerVisibility['Zone'] || layerVisibility[layer.id]);
    }
    if (layer.cleanKey === '2' || layer.cleanKey === 'ward' || layer.cleanKey.includes('ward')) {
      return !!(layerVisibility['ward'] || layerVisibility['2'] || layerVisibility['Ward'] || layerVisibility[layer.id]);
    }
    if (layer.cleanKey === '3' || layer.cleanKey === 'citysurvey' || layer.cleanKey.includes('survey') || layer.cleanKey.includes('city')) {
      return !!(layerVisibility['citysurvey'] || layerVisibility['3'] || layerVisibility['CitySurvey'] || layerVisibility[layer.id]);
    }
    if (layer.cleanKey === '4' || layer.cleanKey === 'nazulsheet' || layer.cleanKey.includes('nazul') || layer.cleanKey.includes('sheet')) {
      return !!(layerVisibility['nazulsheet'] || layerVisibility['4'] || layerVisibility['NazulSheet'] || layerVisibility[layer.id]);
    }
    return !!(layerVisibility[layer.id] || (layer.layerKey && layerVisibility[layer.layerKey]) || layerVisibility[layer.cleanKey]);
  };

  return (
    <div className="space-y-6">
      {/* BASE MAP SELECTION */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-4">
          <MapIcon className="w-3.5 h-3.5" />
          {t('map.basemap')}
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          {baseLayerOptions.map((layer) => (
            <motion.button
              key={layer.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setBaseLayer(layer.id as 'none' | 'street' | 'google_street' | 'google_satellite')}
              className={`relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 h-28 rounded-2xl border transition-all duration-300 ${baseLayer === layer.id ? 'border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500 ring-offset-1' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
            >
              {/* Background Image Wrapper */}
              <div 
                className="absolute inset-0 z-0 transition-all duration-500 ease-in-out" 
                style={{
                   backgroundImage: layer.id === 'none' ? 'none' : layer.image,
                   backgroundColor: layer.id === 'none' ? '#ffffff' : 'transparent',
                   backgroundPosition: 'center',
                   backgroundSize: 'cover',
                   filter: baseLayer === layer.id ? 'brightness(1) contrast(1.1)' : 'brightness(1.05) contrast(1.05)',
                   opacity: baseLayer === layer.id ? 1 : 1
                }}
              />
              
              {/* Premium Gradient Overlay */}
              {layer.id !== 'none' && (
                <div className={`absolute inset-0 z-0 transition-all duration-500 ${baseLayer === layer.id ? 'bg-gradient-to-t from-blue-900/90 via-blue-700/30 to-transparent' : 'bg-gradient-to-t from-black/70 via-black/10 to-transparent group-hover:from-black/80'}`} />
              )}

              {/* Icon & Label */}
              <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all duration-500 ${baseLayer === layer.id ? 'bg-white/20 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110 mb-1' : layer.id === 'none' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white/10 border-white/20 text-white shadow-sm'}`}>
                <layer.icon className="w-5 h-5" />
              </div>
              <span 
                className={`relative z-10 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${baseLayer === layer.id ? 'text-white drop-shadow-lg' : layer.id === 'none' ? 'text-slate-500' : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}
              >
                {layer.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* OVERLAY LAYERS */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-4">
          <Layers className="w-3.5 h-3.5" />
          {t('map.layers')}
        </label>
        
        <div className="space-y-2">
          {overlayLayers.map((layer) => {
            const isVisible = isLayerActive(layer);
            const toggleLayer = (val: boolean) => {
              if (val) {
                ensureGeoJsonLayerLoaded(String(layer.numericId || layer.id));
              }
              setLayerVisibility(layer.id, val);
            };

            return (
              <motion.div 
                key={layer.id} 
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleLayer(!isVisible)}
                className={`flex items-center justify-between p-3.5 rounded-2xl bg-white border cursor-pointer transition-all duration-300 ${
                  isVisible 
                    ? 'shadow-md border-opacity-100 ring-1' 
                    : 'border-slate-100 shadow-sm opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  borderColor: isVisible ? layer.color : '#f1f5f9',
                  boxShadow: isVisible ? `0 4px 12px ${layer.color}15` : 'none',
                  ringColor: `${layer.color}40`
                } as React.CSSProperties}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isVisible ? 'scale-110 shadow-lg' : 'scale-75'}`} 
                       style={{ 
                         background: layer.color,
                         boxShadow: isVisible ? `0 0 10px ${layer.color}` : 'none'
                       }} />
                  <span className={`text-sm font-black transition-colors ${isVisible ? 'text-slate-900' : 'text-slate-400'}`}>
                    {layer.label}
                  </span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={isVisible}
                    onChange={(val: boolean) => toggleLayer(val)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* OPTIMIZATION — Performance Mode locked always ON */}
      <div className="pt-4 border-t border-slate-50">
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">{t('map.performanceMode')}</p>
              <p className="text-[8px] font-bold text-blue-700/60 uppercase">{t('map.optimizeMapRendering')}</p>
            </div>
          </div>
          {/* Locked ON — cannot be toggled off */}
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            {t('map.alwaysActive')}
          </span>
        </div>
      </div>
    </div>
  );
}

