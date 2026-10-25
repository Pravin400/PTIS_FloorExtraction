import MissingDetailsLayoutClient from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/MissingDetailsLayoutClient";

interface Props {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function Layout({ children }: Props) {

    return (
        <MissingDetailsLayoutClient
        >
            {children}
        </MissingDetailsLayoutClient>
    );
}