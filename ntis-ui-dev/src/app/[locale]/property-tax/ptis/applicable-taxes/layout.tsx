import ApplicableTaxesClientWrapper from "@/components/modules/property-tax/ptis/applicable-taxes/ApplicableTaxesClientWrapper";

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <ApplicableTaxesClientWrapper>
      {children}
    </ApplicableTaxesClientWrapper>
  );
}
