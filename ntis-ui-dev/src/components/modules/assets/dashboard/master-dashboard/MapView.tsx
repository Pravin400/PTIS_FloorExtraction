'use client';

import type { AssetMarkerProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Map as MapIcon, MapPin, Satellite } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Tabs } from '@/components/common';
import MarkerClusterGroup from 'react-leaflet-cluster';

import { useMapView, getAssetCoords, createCategoryIcon, getCategoryColor, getCategoryIcon, TILE_LAYERS, LABELS_LAYER, MapViewProps, ExtendedAsset } from '@/hooks/assets/dashboard/master-dashboard/useMapView';
import { cn } from '@/lib/utils/cn';

const sanitizeSVG = (svg: string) => svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/on\w+="[^"]*"/g, '');


export function AssetMarker({ asset, coords, icon, isSelected, handleMarkerClick, categoryColor, hideUI }: AssetMarkerProps<ExtendedAsset>) {
  const t = useTranslations('assetmasterdashboard');
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (!hideUI && isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected, hideUI]);

  return (
    <Marker ref={markerRef} position={[coords.lat, coords.lng]} icon={icon} eventHandlers={{ click: () => { if (!hideUI) handleMarkerClick(asset); } }}>
      {!hideUI && (
        <Popup autoPan={false}>
          <div className="min-w-[220px] p-1">
            <h3 className="mb-1.5 text-sm font-bold text-gray-900">{asset.name}</h3>
            <div className="mb-2 flex flex-wrap gap-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize text-white" style={{ backgroundColor: categoryColor.bg }}>{asset.category}</span>
              {asset.subCategory && (<span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">{asset.subCategory}</span>)}
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <p className="flex items-start gap-1"><MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" /><span className="line-clamp-2">{asset.location}</span></p>
              <p><strong>{t('zone')}:</strong> {asset.zone}</p>{asset.ward && <p><strong>{t('ward')}:</strong> {asset.ward}</p>}
            </div>
            <div className="mt-2 rounded-md bg-green-50 px-2 py-1.5 text-center">
              <p className="text-[10px] text-gray-500">{t('assetValue')}</p><p className="text-sm font-bold text-green-600">{`₹ ${(asset.valueLakhs || 0).toLocaleString('en-IN')} L`}</p>
            </div>
          </div>
        </Popup>
      )}
    </Marker>
  );
}

export interface MapControllerProps {
  selectedAsset?: ExtendedAsset | null;
  assets: ExtendedAsset[];
}

function MapController({ selectedAsset, assets }: MapControllerProps) {
  const map = useMap();
  useEffect(() => {
    const selectedCoords = selectedAsset ? getAssetCoords(selectedAsset) : null;
    if (selectedCoords) { map.flyTo([selectedCoords.lat, selectedCoords.lng], 17, { duration: 1.5 }); }
    else if (assets.length > 0) {
      const validAssets = assets.filter((a) => getAssetCoords(a) !== null);
      if (validAssets.length > 0) {
        const bounds = L.latLngBounds(validAssets.map((a) => { const coords = getAssetCoords(a)!; return [coords.lat, coords.lng] as [number, number]; }));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [selectedAsset, assets, map]);
  return null;
}

export function MapView(props: MapViewProps) {
  const t = useTranslations('assetmasterdashboard');
  const { mapType, setMapType, isClient, defaultZoom, categoryNames, filteredAssets, categoryCounts, handleMarkerClick, mapCenter } = useMapView(props);
  const { selectedAsset } = props;

  if (!isClient) return (<div className="absolute inset-0 flex items-center justify-center bg-gray-100"><div className="flex flex-col items-center gap-2"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><span className="text-sm text-gray-600">{t('loadingMap')}</span></div></div>);

  return (
    <div className="absolute inset-0">
      {!props.hideUI && (
        <div className="absolute left-0 right-0 top-0 z-[1000] flex items-center justify-between p-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 shadow-md border border-gray-100">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100"><MapPin className="h-3 w-3 text-blue-600" /></div>
              <span className="text-xs font-bold text-gray-800">{filteredAssets.length}</span><span className="text-[10px] text-gray-500">{t('assets')}</span>
            </div>
          </div>
          <div className="flex items-center rounded-lg bg-white p-0.5 shadow-md border border-gray-100 pointer-events-auto">
            <Tabs 
              variant="pills" 
              value={mapType} 
              onChange={(v) => setMapType(v as 'satellite'|'hybrid'|'street')}
              className="!flex-row"
              activeTabClassName="!bg-blue-600 !text-white !shadow-sm hover:!bg-blue-600 hover:!text-white"
            >
              <Tabs.TabList scrollable={false} className="!bg-transparent !p-0 gap-0">
                <Tabs.Tab value="satellite" icon={Satellite} className={cn("!rounded-md !px-2.5 !py-1.5 !text-[11px] !font-semibold !h-auto min-w-0 !gap-1.5", mapType !== 'satellite' && "!text-gray-600 hover:!bg-gray-50 hover:!text-gray-700 !bg-transparent")}>
                  {t('satelliteView')}
                </Tabs.Tab>
                <Tabs.Tab value="hybrid" icon={Layers} className={cn("!rounded-md !px-2.5 !py-1.5 !text-[11px] !font-semibold !h-auto min-w-0 !gap-1.5", mapType !== 'hybrid' && "!text-gray-600 hover:!bg-gray-50 hover:!text-gray-700 !bg-transparent")}>
                  {t('hybridView')}
                </Tabs.Tab>
                <Tabs.Tab value="street" icon={MapIcon} className={cn("!rounded-md !px-2.5 !py-1.5 !text-[11px] !font-semibold !h-auto min-w-0 !gap-1.5", mapType !== 'street' && "!text-gray-600 hover:!bg-gray-50 hover:!text-gray-700 !bg-transparent")}>
                  {t('streetView')}
                </Tabs.Tab>
              </Tabs.TabList>
            </Tabs>
          </div>
        </div>
      )}
      {mapCenter ? (
        <MapContainer center={mapCenter} zoom={selectedAsset ? 17 : defaultZoom} className="h-full w-full" zoomControl={!props.hideUI} attributionControl={!props.hideUI} scrollWheelZoom={true}>
          <TileLayer url={TILE_LAYERS[mapType].url} attribution={TILE_LAYERS[mapType].attribution} maxZoom={19} />
          {(mapType === 'satellite' || mapType === 'hybrid') && (<TileLayer url={LABELS_LAYER.url} attribution={LABELS_LAYER.attribution} maxZoom={19} />)}
          <MapController selectedAsset={selectedAsset} assets={filteredAssets} />

          <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
            {filteredAssets.map((asset, index) => {
              const coords = getAssetCoords(asset);
              if (!coords) return null;
              const markerKey = `${asset.id}-${coords.lat}-${coords.lng}-${index}`;
              const isSelected = selectedAsset?.id === asset.id;
              const icon = createCategoryIcon(asset.category, categoryNames, isSelected);
              const categoryColor = getCategoryColor(asset.category, categoryNames);
              return (
                <AssetMarker
                  key={markerKey}
                  asset={asset}
                  coords={coords}
                  icon={icon}
                  isSelected={isSelected}
                  handleMarkerClick={handleMarkerClick}
                  categoryColor={categoryColor}
                  hideUI={props.hideUI}
                />
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      ) : (
        <div className="flex h-full w-full bg-[#E5E3DF]" />
      )}
      {filteredAssets.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white px-6 py-4 text-center shadow-xl border border-gray-100">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" /><p className="text-sm font-medium text-gray-600">{t('noAssetsWithCoordinates') || 'No assets with location data'}</p>
          </div>
        </div>
      )}
      {!props.hideUI && Object.keys(categoryCounts).length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] pointer-events-none">
          <div className="inline-flex items-center gap-3 rounded-lg bg-white/95 px-3 py-2 shadow-md border border-gray-100 backdrop-blur-sm pointer-events-auto">
            <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t('assetCategory')}</span>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-[10px] font-bold text-blue-700">{filteredAssets.length}</span>
            </div>
            <div className="flex items-center gap-4">
              {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([category, count]) => {
                const style = getCategoryColor(category, categoryNames); const icon = getCategoryIcon(category);
                return (
                  <div key={category} className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: `linear-gradient(135deg, ${style.bg} 0%, ${style.border} 100%)` }} dangerouslySetInnerHTML={{ __html: sanitizeSVG(icon.replace('width="16" height="16"', 'width="10" height="10"')) }} />
                    <span className="text-[11px] font-semibold capitalize text-gray-700">{category}</span><span className="text-[10px] font-bold text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
