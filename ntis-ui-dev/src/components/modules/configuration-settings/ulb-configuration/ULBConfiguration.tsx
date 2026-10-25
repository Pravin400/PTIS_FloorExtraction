import type { ULBConfigurationModuleProps } from '@/types/ulbconfig-master.types';
import ULBConfigurationClient from './ULBConfigurationClient';

/** Server Component wrapper for ULB Configuration. Forwards SSR data to the client orchestrator. */
export default function ULBConfiguration(props: ULBConfigurationModuleProps) {
  return <ULBConfigurationClient {...props} />;
}
