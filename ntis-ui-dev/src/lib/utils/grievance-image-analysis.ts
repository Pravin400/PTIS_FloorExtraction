/**
 * Client-side AI diagnostic vision analysis simulation for citizen uploads.
 * Detects category and generates structured civic defect summary.
 */

export async function analyzeGrievanceImage(fileOrBlob: File | Blob): Promise<{
  category?: string;
  description?: string;
  suggestedDepartment?: string;
  confidence?: number;
}> {
  const fileName = (fileOrBlob as File)?.name?.toLowerCase() || '';
  if (fileName.includes('water') || fileName.includes('pipe') || fileName.includes('leak')) {
    return {
      category: 'water',
      description: 'Potable water supply pipeline burst causing high pressure leakage on public road.',
      suggestedDepartment: 'Water Supply Department',
      confidence: 0.96,
    };
  }
  if (fileName.includes('garbage') || fileName.includes('waste') || fileName.includes('dump')) {
    return {
      category: 'garbage',
      description: 'Municipal garbage dump overflow requiring solid waste clearing container truck.',
      suggestedDepartment: 'Solid Waste Management',
      confidence: 0.94,
    };
  }
  if (fileName.includes('light') || fileName.includes('pole')) {
    return {
      category: 'streetlight',
      description: 'Streetlight pole electrical fault and blackout on main street.',
      suggestedDepartment: 'Electrical & Streetlight Dept',
      confidence: 0.97,
    };
  }
  return {
    category: 'road',
    description: 'Severe road pothole and surface crack detected affecting vehicular traffic.',
    suggestedDepartment: 'Public Works Department',
    confidence: 0.95,
  };
}
