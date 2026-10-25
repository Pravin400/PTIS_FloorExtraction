import { render, screen } from '@testing-library/react';
import { MasterSection } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/master/MasterSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('MasterSection', () => {
  const masterMock = {
    effectiveMstRuleId: '',
    handleMasterRuleChange: vi.fn(),
    mstYearId: 0,
    mstYearSelectOptions: [],
    onMstYearChange: vi.fn(),
    mstBulkMode: 'FIXED',
    setMstBulkMode: vi.fn(),
    mstBulkBase: 'NONE',
    setMstBulkBase: vi.fn(),
    mstBulk: '0',
    setMstBulk: vi.fn(),
    mstBusy: false,
    handleMstBulkApply: vi.fn(),
    mstPagedRows: [],
    mstFilteredLocalCount: 0,
    mstSeededLocally: false,
    mstPage: 1,
    mstPageSize: 10,
    mstTotalPages: 1,
    patchMstRow: vi.fn(),
    onMstPageChange: vi.fn(),
    onMstPageSizeChange: vi.fn(),
    handleMstSave: vi.fn(),
    handleSeedMaster: vi.fn(),
    loadFailed: false,
  };

  it('renders no master keys found when empty', () => {
    render(<MasterSection master={masterMock as unknown as Parameters<typeof MasterSection>[0]['master']} ruleOptions={[]} yearRangeOptions={[]} onRetryLoad={vi.fn()} />);
    expect(screen.getByText('master.noMasterKeysFound')).toBeInTheDocument();
  });

  it('renders load failed message and retry button when loadFailed is true', () => {
    render(<MasterSection master={{ ...masterMock, loadFailed: true } as unknown as Parameters<typeof MasterSection>[0]['master']} ruleOptions={[]} yearRangeOptions={[]} onRetryLoad={vi.fn()} />);
    expect(screen.getByText('master.loadFailed')).toBeInTheDocument();
  });
});
