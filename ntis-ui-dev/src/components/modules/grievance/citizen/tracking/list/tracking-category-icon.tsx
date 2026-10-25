import {
  Construction,
  Trash2,
  Lightbulb,
  Droplets,
  Waves,
  Sparkles,
  Building2,
  type LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  categoryOrDept?: string;
  subject?: string;
}

/**
 * Resolves a semantic SVG category icon based on the grievance department or subject.
 * Matches the official Amravati AMC civic defect types shown in the Compact Tracker.
 */
export function TrackingCategoryIcon({
  categoryOrDept = '',
  subject = '',
  className = 'w-5 h-5 text-slate-700',
  ...props
}: CategoryIconProps) {
  const normalized = `${categoryOrDept} ${subject}`.toLowerCase();

  // 1. Streetlight & Electrical
  if (normalized.includes('street') || normalized.includes('light') || normalized.includes('electric') || normalized.includes('दिवा') || normalized.includes('विद्युत')) {
    return <Lightbulb className={className} {...props} />;
  }

  // 2. Sanitation & Garbage Overflow
  if (normalized.includes('overflow') || normalized.includes('dump') || normalized.includes('कचरा') || normalized.includes('कुंडी')) {
    return <Trash2 className={className} {...props} />;
  }

  // 3. Road Cleaning & Sweeping
  if (normalized.includes('cleaning') || normalized.includes('sweep') || normalized.includes('झाडलोट') || normalized.includes('स्वच्छता')) {
    return <Sparkles className={className} {...props} />;
  }

  // 4. Water Supply & Leakage
  if (normalized.includes('water') || normalized.includes('leak') || normalized.includes('पाणी') || normalized.includes('गळती') || normalized.includes('पाईप')) {
    return <Droplets className={className} {...props} />;
  }

  // 5. Drainage & Blocked Drain
  if (normalized.includes('drain') || normalized.includes('sewage') || normalized.includes('गटार') || normalized.includes('मलनिस्सारण')) {
    return <Waves className={className} {...props} />;
  }

  // 6. Roads & Public Works (Pothole)
  if (normalized.includes('pothole') || normalized.includes('road') || normalized.includes('खड्डा') || normalized.includes('रस्ता') || normalized.includes('public works') || normalized.includes('pwd')) {
    return <Construction className={className} {...props} />;
  }

  // Fallback
  return <Building2 className={className} {...props} />;
}
