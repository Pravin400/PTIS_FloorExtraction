import { WelcomeLandingPage } from '@/components/modules';

export default async function ConfigurationSettingsRootPage() {
  return (
    <WelcomeLandingPage 
      translationKey="navigation.settings" 
      iconName="Cog" 
    />
  );
}
