import { Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import ReassesmentScreen from '@/components/modules/property-tax/ptis/reassement-screen/ReassesmentScreen';
import {
  getMappedReassessmentDataAction,
  getMappedRetrospectiveTaxDataAction,
} from './action';

interface ReassessmentPageProps {
  params: Promise<{ locale: string }>;
  wardId?: number;
  propertyNo?: string;
  partitionNo?: string;
}

export default async function ReassessmentPage({
  params,
  wardId: propWardId,
  propertyNo: propPropertyNo,
  partitionNo: propPartitionNo,
}: ReassessmentPageProps) {
  // Get params and locale
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  
  // Get translations
  const t = await getTranslations({ locale, namespace: 'reassessment' });
  
  // Get params from props
  const wardId = propWardId || 0;
  const propertyNo = propPropertyNo || '';
  const partitionNo = propPartitionNo || '';

  // Don't render anything if required params are missing (ptis/page.tsx handles this)
  if (!wardId || !propertyNo) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Empty State Icon */}
                <div className="rounded-full bg-blue-50 p-3">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                {/* Title */}
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('emptyState.title')}
                </h2>
                {/* Description */}
                <p className="text-gray-600 text-sm">
                  {t('emptyState.description')}
                </p>
              </div>
        </div>
      </div>
    );
  }

  // Fetch data on server
  const [reassessmentResult, retrospectiveResult] = await Promise.all([
    getMappedReassessmentDataAction(wardId, propertyNo, partitionNo),
    getMappedRetrospectiveTaxDataAction(wardId, propertyNo, partitionNo),
  ]);

  // Throw errors for Next.js error boundary to handle
  if (!reassessmentResult.success) {
    throw new Error(reassessmentResult.error || 'Failed to load reassessment data');
  }

  const data = reassessmentResult.data;
  const retrospectiveData = retrospectiveResult.success ? retrospectiveResult.data : null;

  return (
    <div className="p-4">
      <ReassesmentScreen
        wardId={wardId}
        propertyNo={propertyNo}
        partitionNo={partitionNo}
        oldFloorDetails={data?.oldFloorDetails}
        newFloorDetails={data?.newFloorDetails}
        taxColumns={data?.taxColumns}
        taxRows={data?.taxRows}
        retrospectiveTaxColumns={retrospectiveData?.columns}
        retrospectiveTaxRows={retrospectiveData?.rows}
        retrospectiveError={retrospectiveResult.success ? undefined : retrospectiveResult.error}
        photos={data?.photos}
      />
    </div>
  );
}
