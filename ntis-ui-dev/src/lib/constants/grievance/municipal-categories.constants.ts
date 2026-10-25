/**
 * Municipal Categories & Themes Constants
 * Architectural Layer: src/lib/constants/grievance/
 *
 * Defines the 12 municipal categories for Amravati Municipal Corporation (AMC),
 * bilingual labels (EN/MR), and visual themes.
 */

export interface MunicipalCategoryItem {
  id: string;
  nameEn: string;
  nameMr: string;
  icon: string;
}

export const MUNICIPAL_CATEGORIES: MunicipalCategoryItem[] = [
  { id: 'all', nameEn: 'All Departments', nameMr: 'सर्व विभाग', icon: '🏢' },
  { id: 'engineering', nameEn: 'Engineering & Works', nameMr: 'बांधकाम व अभियांत्रिकी', icon: '🏗️' },
  { id: 'health-sanitation', nameEn: 'Health & Sanitation', nameMr: 'आरोग्य व स्वच्छता', icon: '🧹' },
  { id: 'water-sewerage', nameEn: 'Water & Sewerage', nameMr: 'पाणीपुरवठा व मलनिस्सारण', icon: '💧' },
  { id: 'electrical', nameEn: 'Electrical & Lighting', nameMr: 'विद्युत व दिवाबत्ती', icon: '⚡' },
  { id: 'environment', nameEn: 'Environment & Parks', nameMr: 'पर्यावरण व उद्याने', icon: '🌳' },
  { id: 'revenue-tax', nameEn: 'Revenue & Property Tax', nameMr: 'कर व मालमत्ता', icon: '💰' },
  { id: 'town-planning', nameEn: 'Town Planning & Estates', nameMr: 'नगररचना व मालमत्ता', icon: '📐' },
  { id: 'social-welfare', nameEn: 'Social Welfare & Education', nameMr: 'समाजकल्याण व शिक्षण', icon: '🤝' },
  { id: 'administration', nameEn: 'General Administration', nameMr: 'सामान्य प्रशासन', icon: '🏛️' },
  { id: 'emergency', nameEn: 'Fire & Emergency', nameMr: 'अग्निशमन व आपत्ती', icon: '🚒' },
  { id: 'transport', nameEn: 'Transport & Traffic', nameMr: 'वाहतूक व पार्किंग', icon: '🚌' },
];

export const CATEGORY_THEMES: Record<string, { icon: string; bg: string }> = {
  engineering: { icon: '🏗️', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  'health-sanitation': { icon: '🧹', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  'water-sewerage': { icon: '💧', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
  electrical: { icon: '⚡', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  environment: { icon: '🌳', bg: 'bg-teal-50 text-teal-800 border-teal-200' },
  'revenue-tax': { icon: '💰', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  'town-planning': { icon: '📐', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  'social-welfare': { icon: '🤝', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  administration: { icon: '🏛️', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  emergency: { icon: '🚒', bg: 'bg-red-50 text-red-800 border-red-200' },
  transport: { icon: '🚌', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
};
