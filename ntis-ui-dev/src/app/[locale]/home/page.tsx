import { Banner } from "@/components/layout/home/Banner";
import ServiceCards from "@/components/modules/home/ServiceCards";
import { Footer } from "@/components/layout/home/Footer";
import { Navbar } from "@/components/layout/home/Navbar";
import { listServices, getUserProfileSSR } from "./action";
import { cookies, headers } from 'next/headers';
import { decodeCookieValue } from '@/lib/utils/cookie';
import { getUlbConfigForLogin } from '@/lib/api/ulb-config.service';

function clientIpFromHeaders(h: Headers): string | undefined {
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return undefined;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    
    /**
     * LOOPHOLE MITIGATION: All promises inside this Promise.all must be self-catching 
     * (using try/catch or returning error objects) to prevent a single API failure 
     * from crashing the entire dashboard page.
     */
    const [
      { services, error: servicesError },
      { data: userProfile, error: profileError },
      ulbData
    ] = await Promise.all([
        listServices(locale),
        getUserProfileSSR(),
        getUlbConfigForLogin()
    ]);
    const cookieStore = await cookies();
    const headerList = await headers();
    const clientIp = clientIpFromHeaders(headerList);
    const userName = cookieStore.get('user_name')?.value;
    const sessionId = cookieStore.get('session_id')?.value;

    // Get ULB names from cookies with decoding support
    const ulbName = decodeCookieValue(cookieStore.get('ulb_name')?.value);
    const ulbNameLocal = decodeCookieValue(cookieStore.get('ulb_name_local')?.value);

    // Decide which name to show based on locale
    const displayUlbName = (locale === 'en' || !ulbNameLocal) ? ulbName : ulbNameLocal;

    const backgroundSrc = ulbData?.ulbBackground || '';

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
            <Banner ulbName={displayUlbName} backgroundSrc={backgroundSrc} />
            <Navbar 
                username={userName} 
                ulbName={displayUlbName} 
                userProfile={userProfile}
                profileError={profileError}
                sessionId={sessionId}
                clientIp={clientIp}
            />
            <ServiceCards services={services} error={servicesError} />
            <Footer ulbName={displayUlbName} />
        </div>
    );
}
