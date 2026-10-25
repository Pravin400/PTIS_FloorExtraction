import { WelcomeLandingPage } from '@/components/modules';

export default async function PayrollRootPage() {
  return (
    <WelcomeLandingPage
      translationKey="app.payrollDepartmentName"
      iconName="Calculator"
    />
  );
}
