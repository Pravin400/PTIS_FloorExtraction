import { getTranslations } from 'next-intl/server';

/**
 * Property Tax Module
 * Handles property details, tax calculation, and payment
 */

/**
 * PropertyDetails Component
 * Display property tax details and payment options
 */
const PropertyDetails = async () => {
  const t = await getTranslations('modules');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{t('propertyTax.detailsTitle')}</h2>
      {/* Add your property details implementation here */}
    </div>
  );
};

export default PropertyDetails;
