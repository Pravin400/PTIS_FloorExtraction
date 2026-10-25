import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { QuickDataEntryClientWrapper } from '@/components/modules/property-tax/ptis/QuickDataEntry/QuickDataEntryClientWrapper';
import { usePathname, useSearchParams, useParams } from 'next/navigation';
import { useQdeSaveContext } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        back: mockBack,
    }),
    usePathname: vi.fn(),
    useSearchParams: vi.fn(),
    useParams: vi.fn(),
}));

// Mock ConfirmProvider
const mockConfirm = vi.fn();
vi.mock('@/components/common/ConfirmProvider', () => ({
    useConfirm: () => ({
        confirm: mockConfirm,
    }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        if (key === 'roomSubmission.quickDataEntry') return 'Quick Data Entry';
        if (key === 'roomSubmission.info.ward') return 'Ward';
        if (key === 'roomSubmission.info.property') return 'Property';
        if (key === 'roomSubmission.info.partition') return 'Partition';
        if (key === 'floor.propertyCategory') return 'Property Category';
        if (key === 'property.propertyDescription') return 'Property Description';
        return key;
    },
}));

// Mock TabNavigation to simplify the test
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/TabNavigation', () => ({
    TabNavigation: () => <div data-testid="tab-navigation">Tab Navigation</div>,
}));

// Mock Drawer component
interface MockDrawerProps {
    children: React.ReactNode;
    onClose: () => void;
    title: React.ReactNode;
}

vi.mock('@/components/common/Drawer', () => ({
    Drawer: ({ children, onClose, title }: MockDrawerProps) => (
        <div data-testid="drawer">
            <div data-testid="drawer-title">{title}</div>
            <button data-testid="drawer-close-btn" onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));

describe('QuickDataEntryClientWrapper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the drawer with information from search parameters', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/123/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '123' });
        
        const searchParams = new URLSearchParams();
        searchParams.set('wardNo', 'W01');
        searchParams.set('propertyNo', 'P01');
        searchParams.set('partitionNo', '0');
        (useSearchParams as Mock).mockReturnValue(searchParams);

        render(
            <QuickDataEntryClientWrapper>
                <div data-testid="child-content">Content</div>
            </QuickDataEntryClientWrapper>
        );

        expect(screen.getByText('Quick Data Entry')).toBeInTheDocument();
        expect(screen.getByText(/Ward: W01/)).toBeInTheDocument();
        expect(screen.getByText(/Property: P01/)).toBeInTheDocument();
        expect(screen.getByText(/Partition: 0/)).toBeInTheDocument();
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('navigates back when logical close is triggered', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/123/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '123' });
        (useSearchParams as Mock).mockReturnValue(new URLSearchParams('wardNo=W01'));

        render(
            <QuickDataEntryClientWrapper>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        const closeBtn = screen.getByTestId('drawer-close-btn');
        fireEvent.click(closeBtn);

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis?'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('wardNo=W01'));
    });

    it('hides tab navigation on the Renter page', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/123/Renter');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '123' });
        (useSearchParams as Mock).mockReturnValue(new URLSearchParams());

        render(
            <QuickDataEntryClientWrapper>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        expect(screen.queryByTestId('tab-navigation')).not.toBeInTheDocument();
    });

    it('returns to olddetails tab when closing from OldDetails page without returnTab query', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/123/OldDetails/old-taxation');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '123' });

        const searchParams = new URLSearchParams();
        searchParams.set('wardNo', 'W01');
        (useSearchParams as Mock).mockReturnValue(searchParams);

        render(
            <QuickDataEntryClientWrapper>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        fireEvent.click(screen.getByTestId('drawer-close-btn'));

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('tab=olddetails'));
    });

    it('renders the categoryName and propertyDescription badges when provided', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/123/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '123' });
        (useSearchParams as Mock).mockReturnValue(new URLSearchParams());

        render(
            <QuickDataEntryClientWrapper categoryName="Individual" propertyDescription="Residential">
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        expect(screen.getByText('Property Category: Individual')).toBeInTheDocument();
        expect(screen.getByText('Property Description: Residential')).toBeInTheDocument();
    });

    it('preserves propertyId when closing to apartment screen without overwriting with societyDetailId', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/330762/Society');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '330762' });

        const searchParams = new URLSearchParams();
        searchParams.set('propertyId', '330762');
        searchParams.set('wardNo', 'MM8');
        searchParams.set('propertyNo', '132');
        searchParams.set('returnTab', 'apartment');
        searchParams.set('fromSocietyEdit', 'true');
        searchParams.set('societyDetailId', '7728');
        (useSearchParams as Mock).mockReturnValue(searchParams);

        render(
            <QuickDataEntryClientWrapper societyDetailId={7728}>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        fireEvent.click(screen.getByTestId('drawer-close-btn'));

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis/apartment?'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('propertyId=330762'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('societyId=7728'));
        expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('propertyId=7728'));
    });

    it('uses parentPropertyId when closing from unit edit to apartment screen', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/999/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '999' });

        const searchParams = new URLSearchParams();
        searchParams.set('propertyId', '999');
        searchParams.set('parentPropertyId', '330762');
        searchParams.set('wardNo', 'MM8');
        searchParams.set('propertyNo', '132');
        searchParams.set('returnTab', 'apartment');
        (useSearchParams as Mock).mockReturnValue(searchParams);

        render(
            <QuickDataEntryClientWrapper>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        fireEvent.click(screen.getByTestId('drawer-close-btn'));

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis/apartment?'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('propertyId=330762'));
    });

    it('navigates directly to individual screen when closing with categoryId=2', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/1488616/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '1488616' });

        const searchParams = new URLSearchParams();
        searchParams.set('propertyId', '1488616');
        searchParams.set('wardNo', 'MM1');
        searchParams.set('propertyNo', '85');
        searchParams.set('fromFooterEdit', 'true');
        (useSearchParams as Mock).mockReturnValue(searchParams);

        render(
            <QuickDataEntryClientWrapper categoryId={2}>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        fireEvent.click(screen.getByTestId('drawer-close-btn'));

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis/individual?'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('propertyId=1488616'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('wardNo=MM1'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('propertyNo=85'));
        expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis?'));
    });

    it('navigates directly to individual screen when returnTab=individual or from=individual', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/1488616/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '1488616' });

        const searchParams = new URLSearchParams();
        searchParams.set('propertyId', '1488616');
        searchParams.set('wardNo', 'MM1');
        searchParams.set('propertyNo', '85');
        searchParams.set('returnTab', 'individual');
        searchParams.set('from', 'individual');
        (useSearchParams as Mock).mockReturnValue(searchParams);

        render(
            <QuickDataEntryClientWrapper>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        fireEvent.click(screen.getByTestId('drawer-close-btn'));

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis/individual?'));
        expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis?'));
    });

    it('calls router.back() when closing without changes if history.length > 1', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/1488616/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '1488616' });
        (useSearchParams as Mock).mockReturnValue(new URLSearchParams('wardNo=MM1'));

        const originalLength = window.history.length;
        Object.defineProperty(window.history, 'length', { value: 3, configurable: true });

        render(
            <QuickDataEntryClientWrapper>
                <div>Content</div>
            </QuickDataEntryClientWrapper>
        );

        fireEvent.click(screen.getByTestId('drawer-close-btn'));

        expect(mockBack).toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();

        Object.defineProperty(window.history, 'length', { value: originalLength, configurable: true });
    });

    it('calls doClose() with router.push when closing after changes were saved', () => {
        (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/QuickDataEntry/1488616/Property');
        (useParams as Mock).mockReturnValue({ locale: 'en', propertyId: '1488616' });
        (useSearchParams as Mock).mockReturnValue(new URLSearchParams('wardNo=MM1&returnTab=individual'));

        const originalLength = window.history.length;
        Object.defineProperty(window.history, 'length', { value: 3, configurable: true });

        const SaveSimulator = () => {
            const saveTracker = useQdeSaveContext();
            return (
                <button
                    data-testid="simulate-save-btn"
                    onClick={() => saveTracker?.markChangesSaved()}
                >
                    Save
                </button>
            );
        };

        render(
            <QuickDataEntryClientWrapper>
                <SaveSimulator />
            </QuickDataEntryClientWrapper>
        );

        fireEvent.click(screen.getByTestId('simulate-save-btn'));
        fireEvent.click(screen.getByTestId('drawer-close-btn'));

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis/individual?'));
        expect(mockBack).not.toHaveBeenCalled();

        Object.defineProperty(window.history, 'length', { value: originalLength, configurable: true });
    });
});
