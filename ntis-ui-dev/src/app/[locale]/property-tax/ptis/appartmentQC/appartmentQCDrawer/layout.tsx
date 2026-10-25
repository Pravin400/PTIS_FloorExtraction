import { ApartmentQCClientWrapper } from "@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/apartmentQCClientWrapper";

interface Props {
    children: React.ReactNode;
}

export default async function Layout({ children }: Props) {
    return (
        <ApartmentQCClientWrapper>
            {children}
        </ApartmentQCClientWrapper>
    );
}