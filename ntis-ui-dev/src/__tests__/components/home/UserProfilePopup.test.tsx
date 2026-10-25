import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfilePopup } from '@/components/layout/home/UserProfilePopup';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, options?: { default?: string }) => {
    const translations: Record<string, string> = {
      'buttons.close': 'Close',
      'userMenu.userId': 'User ID',
      'userMenu.role': 'Role',
      'userMenu.department': 'Department',
      'userMenu.publicIp': 'Public IP',
      'userMenu.sessionId': 'Session ID',
      'userMenu.loginTime': 'Login Time',
      'userMenu.notAvailable': 'N/A',
      'userMenu.defaultRole': 'User',
      'userMenu.defaultUser': 'User',
      'app.securityPurpose': 'For security purposes',
    };
    return translations[key] || options?.default || key;
  },
  useLocale: () => 'en',
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('UserProfilePopup Component', () => {
  const mockUserProfile = {
    fullName: 'Test User',
    email: 'test@example.com',
    roles: ['Admin'],
    departments: ['Property Tax'],
    modules: ['PTIS'],
    userId: 'USR-2025-1047',
    userCode: 'USR001',
    mobileNo: '9876543210',
    address: '123 Test Street',
    language: 'en',
    primaryRole: 'Admin',
    primaryDepartment: 'Property Tax',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    username: 'Test User',
    ulbName: 'Test Municipality',
    userProfile: mockUserProfile,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <UserProfilePopup {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders popup when isOpen is true', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays provided username', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays default username when not provided', () => {
    render(<UserProfilePopup {...defaultProps} username={undefined} userProfile={undefined} />);
    // Default username 'User' appears in the header; use getAllByText as 'User' may appear in multiple places
    const userElements = screen.getAllByText('User');
    expect(userElements.length).toBeGreaterThan(0);
  });

  it('displays N/A for email when userProfile not provided', () => {
    render(<UserProfilePopup {...defaultProps} userProfile={undefined} />);
    // Email should show N/A when not set
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('displays user ID from userProfile prop', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('User ID')).toBeInTheDocument();
    expect(screen.getByText(/USR-2025-1047/)).toBeInTheDocument();
  });

  it('displays role label', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('displays department from userProfile', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('Department')).toBeInTheDocument();
    // Department comes from userProfile.departments
    expect(screen.getByText('Property Tax')).toBeInTheDocument();
  });

  it('displays N/A for department when ulbName not provided', () => {
    render(<UserProfilePopup {...defaultProps} ulbName={undefined} />);
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('displays public IP label', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('Public IP')).toBeInTheDocument();
  });

  it('displays session ID label', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('Session ID')).toBeInTheDocument();
  });

  it('displays login time label', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('Login Time')).toBeInTheDocument();
  });
  
  it('does not display error warning message when profileError is provided', () => {
    const errorMsg = 'Failed to synchronize profile details';
    render(<UserProfilePopup {...defaultProps} profileError={errorMsg} />);
    expect(screen.queryByText(errorMsg)).not.toBeInTheDocument();
  });

  it('displays security message in footer', () => {
    render(<UserProfilePopup {...defaultProps} />);
    expect(screen.getByText('For security purposes')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<UserProfilePopup {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<UserProfilePopup {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays user profile data from props and session data from props', () => {
    render(
      <UserProfilePopup
        {...defaultProps}
        sessionId="session-12345678-abcd"
        clientIp="192.168.1.1"
      />
    );

    // User profile data from props
    expect(screen.getByText(/USR-2025-1047/)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Session data from props
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('truncates long session IDs', () => {
    render(<UserProfilePopup {...defaultProps} sessionId="very-long-session-id-that-should-be-truncated" />);
    expect(screen.getByText('very-lon...')).toBeInTheDocument();
  });
});
