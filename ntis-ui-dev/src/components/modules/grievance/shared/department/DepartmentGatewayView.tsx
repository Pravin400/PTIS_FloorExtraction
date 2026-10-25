import { GrievanceHomeView, type GrievanceHomeViewProps } from '../../home';

export type DepartmentGatewayViewProps = GrievanceHomeViewProps;

/**
 * DepartmentGatewayView
 * Facade bridging to official GrievanceHomeView located in src/components/modules/grievance/home/
 * Strictly under 200 lines.
 */
export function DepartmentGatewayView(props: DepartmentGatewayViewProps) {
  return <GrievanceHomeView {...props} />;
}
