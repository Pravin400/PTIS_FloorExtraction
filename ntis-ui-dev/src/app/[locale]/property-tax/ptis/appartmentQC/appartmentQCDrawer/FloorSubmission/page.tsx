import { 
  getFloorQCDetailsAction,
  fetchFloorsAction,
  fetchConstructionTypesAction,
  fetchUseTypesAction,
  fetchSubTypesAction 
} from './action';
import { getRoomWiseSubmissionsAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import { FloorSubmissionScreen } from '@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/FloorSubmissionScreen';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';
import type { Floor } from '@/types/floor.types';
import type { ConstructionType } from '@/types/construction.types';
import type { UseType, UseSubType } from '@/types/typeOfUse.types';

export default async function FloorSubmissionPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Await searchParams for Next.js 15+ compatibility
  const searchParams = await props.searchParams;

  // Extract query parameters, e.g., ?subTab=rateable&editPropertyId=1959256
  const subTab = typeof searchParams.subTab === 'string' ? searchParams.subTab : 'rateable';
  const editPropertyId = typeof searchParams.editPropertyId === 'string' ? searchParams.editPropertyId : '';
  // const pdnId = typeof searchParams.pdnId === 'string' ? searchParams.pdnId : '';

  const loadFloorParam = Array.isArray(searchParams.loadFloor) ? searchParams.loadFloor[0] : searchParams.loadFloor;
  const loadFloor = loadFloorParam === 'true';

  const loadConstructionParam = Array.isArray(searchParams.loadConstruction) ? searchParams.loadConstruction[0] : searchParams.loadConstruction;
  const loadConstruction = loadConstructionParam === 'true';

  const loadUsageParam = Array.isArray(searchParams.loadUsage) ? searchParams.loadUsage[0] : searchParams.loadUsage;
  const loadUsage = loadUsageParam === 'true';

  const loadSubTypeParam = Array.isArray(searchParams.loadSubType) ? searchParams.loadSubType[0] : searchParams.loadSubType;
  const loadSubType = loadSubTypeParam === 'true';

  const typeOfUseIdParam = Array.isArray(searchParams.typeOfUseId) ? searchParams.typeOfUseId[0] : searchParams.typeOfUseId;
  const typeOfUseId = typeOfUseIdParam ? Number(typeOfUseIdParam) : 0;

  const roomDrawerOpen = searchParams.roomDrawerOpen === 'true';
  const roomPdnId = typeof searchParams.roomPdnId === 'string' ? Number(searchParams.roomPdnId) : 0;
  const roomPropertyId = typeof searchParams.roomPropertyId === 'string' ? Number(searchParams.roomPropertyId) : 0;

  // Use editPropertyId if available, fallback to pdnId
  const idToFetch = editPropertyId;

  let floorData: ApartmentQCDetail[] = [];
  let floors: Floor[] = [];
  let constructionTypes: ConstructionType[] = [];
  let useTypes: UseType[] = [];
  let subTypes: UseSubType[] = [];
  let initialRoomData: unknown[] = [];

  const apiType = subTab === 'dual-method' ? 'dual' : subTab;

  const [
    floorDataRes,
    floorsRes,
    constructionTypesRes,
    useTypesRes,
    subTypesRes,
    roomDataRes
  ] = await Promise.all([
    idToFetch ? getFloorQCDetailsAction(idToFetch, apiType) : Promise.resolve({ success: true, data: [] }),
    loadFloor ? fetchFloorsAction() : Promise.resolve({ success: true, data: [] }),
    loadConstruction ? fetchConstructionTypesAction() : Promise.resolve({ success: true, data: [] }),
    loadUsage ? fetchUseTypesAction() : Promise.resolve({ success: true, data: [] }),
    (typeOfUseId > 0 && loadSubType) ? fetchSubTypesAction(typeOfUseId) : Promise.resolve({ success: true, data: [] }),
    (roomDrawerOpen && roomPdnId && roomPropertyId) ? getRoomWiseSubmissionsAction({ propertyId: roomPropertyId, propertyDetailsId: roomPdnId }) : Promise.resolve({ success: true, data: [] })
  ]);

  if (floorDataRes.success && floorDataRes.data) {
    floorData = floorDataRes.data;
  }
  
  if (roomDataRes.success && roomDataRes.data) {
    initialRoomData = Array.isArray(roomDataRes.data) ? roomDataRes.data : [];
  }
  
  floors = floorsRes.success ? (floorsRes.data || []) : [];
  constructionTypes = constructionTypesRes.success ? (constructionTypesRes.data || []) : [];
  useTypes = useTypesRes.success ? (useTypesRes.data || []) : [];
  subTypes = subTypesRes.success ? (subTypesRes.data || []) : [];

  return (
    <FloorSubmissionScreen
      initialFloorData={floorData}
      initialSubTab={subTab}
      floorOptions={floors}
      constructionTypeOptions={constructionTypes}
      useOptions={useTypes}
      subUseTypeOptions={subTypes}
      propertyId={idToFetch}
      initialRoomData={initialRoomData}
    />
  );
}