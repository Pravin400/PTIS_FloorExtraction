'use client';

import { useState, useMemo } from 'react';
import { AssetDocumentModal } from './AssetDocumentModal';
import type { AssetAnalysisPanelProps, AssetFieldValue } from '@/types/asset-gis.types';
import { AssetSubUnitsDrawer } from './asset/AssetSubUnitsDrawer';
import {
  AssetHeaderSection,
  AssetAdminCard,
  AssetMeasurementsSection,
  AssetFinancialsSection,
  AssetTenantsSection,
  AssetInventorySection,
  AssetActionsSection,
} from './asset/analysis';

export type { AssetAnalysisPanelProps, AssetFieldValue };

export function AssetAnalysisPanel({
  selectedProperty,
  propertyDetail,
  onClose,
  onOpenImageModal,
  getImageProxyUrl: _getImageProxyUrl,
  realPhotos,
  isLoadingRealPhotos,
  hasRealAssetData,
  documents,
  isLoadingDocuments,
  childAssets,
  isLoadingChildAssets: _isLoadingChildAssets,
  childAssetPhotoMap: _childAssetPhotoMap,
  onOpenChildImageModal: _onOpenChildImageModal,
  onSelectChildAsset
}: AssetAnalysisPanelProps) {
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [showUnitDrawer, setShowUnitDrawer] = useState(false);
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RENTED' | 'VACANT'>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTenants, setShowTenants] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const [prevSelectedProperty, setPrevSelectedProperty] = useState(selectedProperty);
  if (prevSelectedProperty !== selectedProperty) {
    setPrevSelectedProperty(selectedProperty);
    setShowTenants(false);
    setShowInventory(false);
  }

  const pDetail = propertyDetail as Record<string, unknown> | null | undefined;
  const sProp = selectedProperty as Record<string, unknown> | null | undefined;

  const rawDetail = useMemo(() => {
    return ((pDetail?.items ?? pDetail?.data ?? pDetail ?? {}) as Record<string, unknown>);
  }, [pDetail]);

  const prop: Record<string, AssetFieldValue> = useMemo(() => {
    if (!selectedProperty && !propertyDetail) return {};
    return {
      ...(sProp as Record<string, AssetFieldValue>),
      ...(rawDetail as Record<string, AssetFieldValue>),
    };
  }, [sProp, rawDetail, selectedProperty, propertyDetail]);

  const leaseDetails = (rawDetail.leaseDetails ?? sProp?.leaseDetails) as Record<string, unknown> | undefined;
  const rawChildShops = (rawDetail.childShops ?? sProp?.childShops) as Array<Record<string, unknown>> | undefined;
  const rawChildUnits = (rawDetail.childUnits ?? sProp?.childUnits) as Array<Record<string, unknown>> | undefined;
  const rawTenants = (rawDetail.Tenants ?? rawDetail.tenants ?? sProp?.Tenants ?? sProp?.tenants) as Array<Record<string, unknown>> | undefined;
  const rawInventoryItems = (rawDetail.inventoryItems ?? rawDetail.InventoryItems ?? sProp?.inventoryItems ?? sProp?.InventoryItems) as Array<Record<string, unknown>> | undefined;

  const parentAssetId = (prop.parentAssetId || prop.ParentAssetId) as string | number | undefined;
  const tenants: Array<Record<string, unknown>> = Array.isArray(rawTenants) ? rawTenants : [];

  const combinedChildAssets: Array<Record<string, unknown>> = useMemo(() => {
    if (rawChildShops && Array.isArray(rawChildShops) && rawChildShops.length > 0) return rawChildShops;
    if (rawChildUnits && Array.isArray(rawChildUnits) && rawChildUnits.length > 0) return rawChildUnits;
    if (childAssets && Array.isArray(childAssets) && childAssets.length > 0) return childAssets;
    const sChild = sProp?.childAssets || sProp?.childShops || sProp?.childUnits;
    if (sChild && Array.isArray(sChild) && sChild.length > 0) return sChild as Array<Record<string, unknown>>;
    return [];
  }, [rawChildShops, rawChildUnits, childAssets, sProp]);

  const inventoryItems: Array<Record<string, unknown>> = useMemo(() => {
    return Array.isArray(rawInventoryItems) ? rawInventoryItems : [];
  }, [rawInventoryItems]);

  const mpmsId = String(prop.assetNo || prop.AssetNo || prop.MPMS_ID || prop.mpmsId || prop.OwnerID || prop.ownerID || prop.Buil_ID || 'N/A');
  const owner = String(prop.assetName || prop.AssetName || prop.MarathiOwn || prop.marathiOwn || prop.MarathiOwnerPatta || prop.marathiOwnerPatta || prop.OwnerName || prop.ownerName || 'N/A');
  const occupier = String(prop.inCharge || prop.InCharge || prop.inChargeName || prop.InChargeName || prop.OccupierNameMarathi || prop.occupierNameMarathi || prop.MarathiOccupierName || prop.marathiOccupierName || prop.OccupierName || prop.occupierName || prop.Occupier || prop.occupier || 'N/A');
  const mobile = String(prop.mobileNo || prop.MobileNo || prop.InChargeMobile || prop.inChargeMobile || prop.Mobile || prop.mobile || prop.InchargeContact || 'N/A');
  const rawAssetTypeName = String(prop.assetType || prop.AssetType || prop.assetTypeName || prop.AssetTypeName || prop.TypeName || prop.typeName || prop.PropertyType || prop.propertyType || prop.PropertyDescription || 'Municipal Asset');
  const assetTypeName = rawAssetTypeName.replace(/\s*\(.*?\)\s*/g, '').trim() || 'Municipal Asset';
  const categoryName = String(prop.assetCategoryName || prop.AssetCategoryName || prop.categoryName || prop.Category || prop.category || '');
  const departmentName = String(prop.department || prop.Department || prop.departmentName || prop.DepartmentName || prop.OwningDepartment || prop.owningDepartment || 'General');

  const plotNo = String(prop.plotNo || prop.PlotNo || prop.NewPlotNo || prop.newPlotNo || prop.CTSNo || prop.ctsNo || prop.CitySurveyNo || prop.citySurveyNo || prop.SurveyNo || 'N/A');
  const citySurveyNo = String(prop.citySurveyNo || prop.CitySurveyNo || prop.CTSNo || prop.ctsNo || prop.csn || prop.CSN || 'N/A');
  const totalFloors = prop.floors || prop.Floors || prop.TotalFloors || prop.totalFloors || prop.FloorCount || prop.floorCount;
  const constYear = prop.constYear || prop.ConstYear || prop.constructionYear || prop.ConstructionYear || prop.YearOfConstruction || prop.yearOfConstruction;
  const encroachmentStatus = String(prop.encroachment || prop.Encroachment || prop.encroachmentStatus || prop.EncroachmentStatus || prop.IsEncroached || prop.isEncroached || 'Clean');

  const rawPlotArea = prop.formattedPlotArea || prop.plotArea || prop.PlotArea || prop.plotAreaSqFt || prop.PlotAreaSqFt || prop.totalAreaSqFeet || prop.TotalAreaSqFeet || prop.landAreaSqFeet || prop.LandAreaSqFeet || prop.AREA_SQ_FT || prop.areaSqFt;
  const plotArea = (rawPlotArea !== null && rawPlotArea !== undefined && rawPlotArea !== '' && rawPlotArea !== 'N/A' && rawPlotArea !== 0 && rawPlotArea !== '0')
    ? rawPlotArea
    : (prop.totalAreaSqMeter ? (Number(prop.totalAreaSqMeter) * 10.7639).toFixed(2) : (prop.landAreaSqMeter ? (Number(prop.landAreaSqMeter) * 10.7639).toFixed(2) : 'N/A'));

  const carpetAreaSqFt = prop.formattedCarpetArea || prop.carpetAreaSqFt || prop.CarpetAreaSqFt || prop.carpetAreaSqFeet || prop.CarpetAreaSqFeet || prop.totalAreaSqMeter || prop.TotalAreaSqMeter || prop.CarpetArea || prop.carpetArea || prop.AREA_SQ_MT;
  const rawBuiltUp = prop.formattedBuiltUpArea ?? prop.builtUpAreaSqFt ?? prop.BuiltUpAreaSqFt ?? prop.builtUpAreaSqFeet ?? prop.BuiltUpAreaSqFeet ?? prop.TotalBuiltupAreaSqFeet ?? prop.totalBuiltupAreaSqFeet ?? prop.BuiltUpArea ?? prop.builtUpArea ?? prop.Area ?? prop.area;
  const builtUpArea = (rawBuiltUp !== null && rawBuiltUp !== undefined && rawBuiltUp !== '' && rawBuiltUp !== 'N/A' && rawBuiltUp !== 0 && rawBuiltUp !== '0') ? rawBuiltUp : (carpetAreaSqFt || plotArea || 'N/A');

  const marathiOwnerPatta = String(prop.address || prop.Address || prop.MarathiOwnerPatta || prop.marathiOwnerPatta || prop.Location || prop.location || 'N/A');
  const lat = String(prop.Latitude || prop.lat || prop.latitude || prop.centroidY || prop.CentroidY || '');
  const lng = String(prop.Longitude || prop.long || prop.lng || prop.longitude || prop.centroidX || prop.CentroidX || '');
  const googleMapUrl = (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : '#';
  const link360Url = String(prop.StreetView360Url || prop.streetView360Url || prop.panoramaUrl || prop.PanoramaUrl || '');

  const isShoppingComplexType = useMemo(() => {
    const nameUpper = (assetTypeName + ' ' + (prop.parentAssetName || '')).toUpperCase();
    const catUpper = categoryName.toUpperCase();
    const typeId = Number(prop.assetTypeId || prop.AssetTypeId || prop.typeId || prop.TypeId || 0);
    return typeId === 36 || nameUpper.includes('SHOPPING') || nameUpper.includes('MARKET') || nameUpper.includes('COMPLEX') || nameUpper.includes('COMMERCIAL') || catUpper.includes('COMMERCIAL') || nameUpper.includes('व्यापारी संकुल') || nameUpper.includes('गाळा') || combinedChildAssets.length > 0;
  }, [assetTypeName, categoryName, prop, combinedChildAssets.length]);

  const unitLabelSingular = isShoppingComplexType ? 'Shop' : 'Unit';
  const unitLabelPlural = isShoppingComplexType ? 'Shops' : 'Units';

  const currentShopIdx = useMemo(() => {
    if (!combinedChildAssets || combinedChildAssets.length === 0) return 0;
    const currentId = String(prop.assetId || prop.id || prop.AssetId || prop.mpmsNo || prop.assetNo || '');
    const currentName = String(prop.assetName || prop.name || prop.subUnitName || prop.ShopName || prop.shopName || '').toLowerCase().trim();
    const currentNo = String(prop.ShopNo || prop.shopNo || prop.UnitNo || prop.unitNo || prop.mpmsNo || prop.assetNo || '').toLowerCase().trim();

    const idx = combinedChildAssets.findIndex(u => {
      const uId = String(u.assetId || u.id || u.AssetId || u.mpmsNo || u.assetNo || '');
      const uName = String(u.assetName || u.name || u.subUnitName || u.ShopName || u.shopName || '').toLowerCase().trim();
      const uNo = String(u.ShopNo || u.shopNo || u.UnitNo || u.unitNo || u.mpmsNo || u.assetNo || '').toLowerCase().trim();

      if (uId && currentId && uId === currentId) return true;
      if (uNo && currentNo && uNo === currentNo) return true;
      if (uName && currentName && uName === currentName) return true;
      return false;
    });
    return idx >= 0 ? idx : 0;
  }, [combinedChildAssets, prop]);

  const hasRealPhotos = Boolean(realPhotos && realPhotos.length > 0);
  const realPhotoCount = realPhotos?.length || 0;

  const displayThumbUrl = useMemo(() => {
    if (hasRealPhotos && realPhotos && realPhotos[0]?.url) {
      return realPhotos[0].url;
    }
    return String(prop.PhotoUrl || prop.photoUrl || prop.PrimaryPhotoUrl || prop.primaryPhotoUrl || prop.thumbnailUrl || prop.ThumbnailUrl || '');
  }, [hasRealPhotos, realPhotos, prop]);

  const tenantNameVal = (prop.tenantName || prop.TenantName || leaseDetails?.tenantName) as string | undefined;

  const resolvedParentName = String(prop.parentAssetName || prop.ParentAssetName || '');
  const resolvedChildUnitName = !parentAssetId ? undefined : owner;

  const capitalValueVal = useMemo(() => {
    const directVal = Number(prop.CapitalValue || prop.capitalValue || prop.CalculatedCapitalValue || prop.calculatedCapitalValue || 0);
    if (directVal > 0) return directVal;
    return combinedChildAssets.reduce((sum: number, u: Record<string, unknown>) => {
      const cv = Number(u.capitalValue ?? u.CapitalValue ?? u.calculatedCapitalValue ?? u.CalculatedCapitalValue ?? 0);
      return sum + (Number.isFinite(cv) && cv > 0 ? cv : 0);
    }, 0);
  }, [prop, combinedChildAssets]);

  const annualRevenueVal = useMemo(() => {
    const directVal = Number(prop.AnnualRevenue || prop.annualRevenue || leaseDetails?.annualRent || 0);
    if (directVal > 0) return directVal;
    return combinedChildAssets.reduce((sum: number, u: Record<string, unknown>) => {
      const lease = u.leaseDetails as Record<string, unknown> | undefined;
      const rent = Number(u.monthlyRent ?? u.MonthlyRent ?? lease?.rentAmount ?? 0);
      const rev = Number(u.annualRevenue ?? u.AnnualRevenue ?? (rent > 0 ? rent * 12 : 0));
      return sum + (Number.isFinite(rev) && rev > 0 ? rev : 0);
    }, 0);
  }, [prop, leaseDetails, combinedChildAssets]);

  const monthlyRentVal = (leaseDetails?.monthlyRent || prop.monthlyRent || prop.MonthlyRent) as string | number | undefined;

  const availableFloors = useMemo(() => {
    const floors = new Set<string>();
    combinedChildAssets.forEach(u => {
      const f = String(u.FloorNo || u.floorNo || u.Floor || u.floor || '').trim();
      if (f && f !== 'null' && f !== 'undefined') floors.add(f);
    });
    return Array.from(floors).sort();
  }, [combinedChildAssets]);

  const isUnitRented = (u: Record<string, unknown>) => {
    const tenant = (u.tenantName || u.TenantName || u.inChargeName || u.occupierName || u.OccupierName || u.occupier || u.Occupier) as string | undefined;
    const status = String(u.Status || u.status || u.occupancyStatus || u.OccupancyStatus || '').toUpperCase();
    if (status.includes('RENT') || status.includes('OCCUP')) return true;
    if (status.includes('VACANT')) return false;
    return Boolean(tenant && tenant.trim() !== '' && tenant.toUpperCase() !== 'N/A');
  };

  const filteredChildAssets = useMemo(() => {
    const query = (childSearchQuery || '').toLowerCase().trim();
    return combinedChildAssets.filter(u => {
      const uNum = String(u.ShopNo || u.shopNo || u.UnitNo || u.unitNo || u.AssetNo || u.assetNo || u.code || u.subUnitCode || '').toLowerCase();
      const uName = String(u.ShopName || u.shopName || u.name || u.subUnitName || u.AssetName || u.assetName || '').toLowerCase();
      const uTenant = String(u.tenantName || u.TenantName || u.occupierName || u.OccupierName || u.occupier || u.inChargeName || '').toLowerCase();
      const uFloor = String(u.FloorNo || u.floorNo || u.Floor || u.floor || '').trim();
      const isRented = isUnitRented(u);

      if (query && !uNum.includes(query) && !uName.includes(query) && !uTenant.includes(query)) return false;
      if (statusFilter === 'RENTED' && !isRented) return false;
      if (statusFilter === 'VACANT' && isRented) return false;
      if (floorFilter !== 'ALL' && uFloor !== floorFilter) return false;
      return true;
    });
  }, [combinedChildAssets, childSearchQuery, statusFilter, floorFilter]);

  const rentedCount = useMemo(() => combinedChildAssets.filter(isUnitRented).length, [combinedChildAssets]);
  const vacantCount = useMemo(() => combinedChildAssets.filter(u => !isUnitRented(u)).length, [combinedChildAssets]);

  const formatArea = (sqft: unknown) => {
    const num = Number(sqft);
    if (!sqft || isNaN(num) || num <= 0) return 'N/A';
    const sqmt = (num * 0.092903).toFixed(1);
    return `${num.toLocaleString('en-IN')} sq.ft (${sqmt} sq.m)`;
  };

  const cycleShop = (step: number) => {
    if (combinedChildAssets.length === 0 || !onSelectChildAsset) return;
    const targetIdx = (currentShopIdx + step + combinedChildAssets.length) % combinedChildAssets.length;
    const unit = combinedChildAssets[targetIdx];
    const uId = Number(unit.assetId ?? unit.AssetId ?? unit.id ?? unit.Id) || (unit.assetNo || unit.mpmsNo || unit.unitNo || unit.code) as string;
    onSelectChildAsset(uId);
  };

  return (
    <>
      <aside
        id="asset-analysis-panel"
        aria-label="Asset Analysis Panel"
        className={`bg-white shadow-2xl border border-slate-200/90 flex flex-col z-40 transition-all duration-300 ease-in-out shrink min-h-0 pointer-events-auto rounded-2xl overflow-hidden max-h-full relative ${
          isExpanded ? 'w-[600px] lg:w-[680px]' : 'w-[380px] lg:w-[410px]'
        }`}
      >
        {/* ── 1. HEADER & MULTI-UNIT TABS ── */}
        <AssetHeaderSection
          mpmsId={mpmsId}
          owner={owner}
          assetTypeName={assetTypeName}
          categoryName={categoryName}
          isShoppingComplexType={isShoppingComplexType}
          isMainView={!parentAssetId}
          currentShopIdx={currentShopIdx}
          combinedChildAssets={combinedChildAssets}
          unitLabelSingular={unitLabelSingular}
          unitLabelPlural={unitLabelPlural}
          totalUnitsCount={combinedChildAssets.length}
          isExpanded={isExpanded}
          link360={link360Url}
          googleMapLink={googleMapUrl}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          onClose={onClose}
          showUnitDrawer={showUnitDrawer}
          onToggleUnitDrawer={() => setShowUnitDrawer(!showUnitDrawer)}
          onSelectChildAsset={onSelectChildAsset}
          onPrevShop={() => cycleShop(-1)}
          onNextShop={() => cycleShop(1)}
          parentAssetId={parentAssetId}
        />

        {/* ── 2. MAIN DETAILS CARDS BODY ── */}
        <div className="p-2.5 space-y-2 min-h-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          <AssetAdminCard
            mpmsId={mpmsId}
            assetTypeName={assetTypeName}
            departmentName={departmentName}
            occupier={occupier}
            tenantNameVal={tenantNameVal}
            encroachmentStatus={encroachmentStatus}
            mobile={mobile}
            isExpanded={isExpanded}
            hasChildUnits={combinedChildAssets.length > 0}
            isMainView={!parentAssetId}
            isShoppingComplexType={isShoppingComplexType}
            combinedChildAssetsCount={combinedChildAssets.length}
            resolvedParentName={resolvedParentName}
            resolvedChildUnitName={resolvedChildUnitName}
            displayThumbUrl={displayThumbUrl}
            hasRealPhotos={hasRealPhotos}
            realPhotoCount={realPhotoCount}
            isLoadingRealPhotos={isLoadingRealPhotos}
            hasRealAssetData={hasRealAssetData}
            realPhotos={realPhotos}
            documents={documents}
            onOpenImageModal={onOpenImageModal}
            onOpenDocModal={() => setIsDocModalOpen(true)}
          />

          <AssetMeasurementsSection
            plotNo={plotNo}
            plotArea={plotArea}
            citySurveyNo={citySurveyNo}
            carpetAreaVal={prop.CarpetAreaSqFt || prop.carpetAreaSqFt}
            carpetAreaSqFt={carpetAreaSqFt}
            builtUpAreaVal={prop.BuiltUpAreaSqFt || prop.builtUpAreaSqFt}
            builtUpArea={builtUpArea}
            conYear={constYear ? String(constYear) : 'N/A'}
            floor={totalFloors ? String(totalFloors) : 'N/A'}
            parentAssetId={parentAssetId}
            noOfRoomsVal={Number(prop.NoOfRooms || prop.noOfRooms || 0)}
            combinedChildAssetsCount={combinedChildAssets.length}
            marathiOwnerPatta={marathiOwnerPatta}
            lat={lat}
            lng={lng}
            formatArea={formatArea}
          />

          {tenants.length > 0 && (
            <AssetTenantsSection tenants={tenants} showTenants={showTenants} onToggleShowTenants={() => setShowTenants(!showTenants)} />
          )}

          {inventoryItems.length > 0 && (
            <AssetInventorySection inventoryItems={inventoryItems} showInventory={showInventory} onToggleShowInventory={() => setShowInventory(!showInventory)} />
          )}

          <AssetFinancialsSection capitalValueVal={capitalValueVal} annualRevenueVal={annualRevenueVal} monthlyRentVal={monthlyRentVal} isMainView={!parentAssetId} />
        </div>

        {/* ── 3. BOTTOM INTERACTIVE ACTION BUTTONS ── */}
        <div className="px-2.5 py-2 border-t bg-white shrink-0 shadow-xs">
          <AssetActionsSection
            hasChildUnits={combinedChildAssets.length > 0}
            isShoppingComplexType={isShoppingComplexType}
            unitLabelPlural={unitLabelPlural}
            googleMapLink={googleMapUrl}
            lat={lat}
            lng={lng}
            link360={link360Url}
            onOpenDocModal={() => setIsDocModalOpen(true)}
            onOpenUnitDrawer={() => setShowUnitDrawer(true)}
          />
        </div>

        {/* ── 4. INSIDE-CARD UNIT SELECTOR DRAWER OVERLAY ── */}
        <AssetSubUnitsDrawer
          isOpen={Boolean(showUnitDrawer && combinedChildAssets.length > 0)}
          onClose={() => setShowUnitDrawer(false)}
          isShoppingComplexType={isShoppingComplexType}
          combinedChildAssets={combinedChildAssets}
          unitLabelPlural={unitLabelPlural}
          childSearchQuery={childSearchQuery}
          setChildSearchQuery={setChildSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          rentedCount={rentedCount}
          vacantCount={vacantCount}
          availableFloors={availableFloors}
          floorFilter={floorFilter}
          setFloorFilter={setFloorFilter}
          isMainView={!parentAssetId}
          parentAssetId={parentAssetId}
          departmentName={departmentName}
          owner={owner}
          filteredChildAssets={filteredChildAssets}
          prop={prop}
          onSelectChildAsset={onSelectChildAsset}
          formatArea={formatArea}
        />
      </aside>

      {/* ── 5. ASSET DOCUMENT MODAL ── */}
      <AssetDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        assetData={{
          Buil_ID: String(prop.Buil_ID || prop.buil_id || prop._id || ''),
          PropertyNo: String(prop.PropertyNo || prop.propertyNo || ''),
          OwnerName: owner,
          PropertyDe: String(prop.PropertyDe || prop.propertyDe || prop.PropertyDescription || ''),
          Ward_No: String(prop.Ward_No || prop.ward_no || ''),
          Zone_No: String(prop.Zone_No || prop.zone_no || ''),
          DocsUrl: String(prop.DocsUrl || prop.docsUrl || prop.DOCS || prop.docs || ''),
          docsUrl: String(prop.docsUrl || prop.DocsUrl || ''),
          DOCS: String(prop.DOCS || prop.docs || ''),
          docs: String(prop.docs || prop.DOCS || ''),
        }}
        documents={documents}
        isLoadingDocuments={isLoadingDocuments}
      />
    </>
  );
}
