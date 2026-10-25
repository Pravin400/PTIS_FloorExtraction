import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// DOM shims for jsdom
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true,
  });
  if (typeof HTMLElement !== 'undefined') {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: vi.fn(),
      writable: true,
    });
  }

  // Mock window.Image to simulate image onload/onerror events in JSDOM tests
  class MockImage {
    onload: () => void = () => {};
    onerror: () => void = () => {};
    private _src = '';
    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      if (value.includes('invalid') || value.includes('corrupted') || value.includes('corrupt')) {
        if (this.onerror) this.onerror();
      } else {
        if (this.onload) this.onload();
      }
    }
  }
  Object.defineProperty(window, 'Image', {
    value: MockImage,
    writable: true,
    configurable: true,
  });
}

// Mock server-only for tests
vi.mock('server-only', () => ({}));

// Mock next/cache for tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
  unstable_noStore: vi.fn(),
}));

// Mock next/headers for tests
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(() => []),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    toString: vi.fn(() => ''),
  }),
  usePathname: () => '/',
}));

// Mock lucide-react with all icons used in the project
// Using importOriginal for better stability in CI
vi.mock('lucide-react', async (importOriginal) => {
  const React = await import('react');
  const original = await importOriginal<typeof import('lucide-react')>();

  // Create a mock icon component factory  
  const createIcon = (name: string) => {
    const lucideClassName = `lucide-${name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`;
    const IconComponent = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
      function IconComponent(props, ref) {
        const { className, ...rest } = props;
        return React.createElement('svg', {
          ref,
          'data-testid': `${name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}-icon`,
          'data-icon': name,
          className: className ? `${lucideClassName} ${className}` : lucideClassName,
          ...rest,
        });
      }
    );
    IconComponent.displayName = name;
    return IconComponent;
  };

  // Spread original module to get any exports we didn't explicitly mock
  return {
    ...original,
    // Common icons
    Layers: createIcon('Layers'),
    Layers3: createIcon('Layers3'),
    FileText: createIcon('FileText'),
    Users: createIcon('Users'),
    Settings: createIcon('Settings'),
    Home: createIcon('Home'),
    Database: createIcon('Database'),
    Building: createIcon('Building'),
    Building2: createIcon('Building2'),
    BuildingIcon: createIcon('BuildingIcon'),
    Calculator: createIcon('Calculator'),
    GitMerge: createIcon('GitMerge'),
    IndianRupee: createIcon('IndianRupee'),
    Search: createIcon('Search'),
    ChevronLeft: createIcon('ChevronLeft'),
    ChevronRight: createIcon('ChevronRight'),
    ChevronsLeft: createIcon('ChevronsLeft'),
    ChevronsRight: createIcon('ChevronsRight'),
    ChevronDown: createIcon('ChevronDown'),
    ChevronUp: createIcon('ChevronUp'),
    ChevronDownIcon: createIcon('ChevronDownIcon'),
    Play: createIcon('Play'),
    Pause: createIcon('Pause'),
    X: createIcon('X'),
    Trash: createIcon('Trash'),
    Trash2: createIcon('Trash2'),
    Edit: createIcon('Edit'),
    Eye: createIcon('Eye'),
    EyeOff: createIcon('EyeOff'),
    Plus: createIcon('Plus'),
    Check: createIcon('Check'),
    AlertCircle: createIcon('AlertCircle'),
    AlertTriangle: createIcon('AlertTriangle'),
    Info: createIcon('Info'),
    ArrowUpDown: createIcon('ArrowUpDown'),
    User: createIcon('User'),
    UserCheck: createIcon('UserCheck'),
    UserCircle: createIcon('UserCircle'),
    UserCog: createIcon('UserCog'),
    MapPin: createIcon('MapPin'),
    Activity: createIcon('Activity'),
    Briefcase: createIcon('Briefcase'),
    Clock: createIcon('Clock'),
    ArrowRight: createIcon('ArrowRight'),
    Type: createIcon('Type'),
    Image: createIcon('Image'),
    ImageIcon: createIcon('ImageIcon'),
    Map: createIcon('Map'),
    Maximize: createIcon('Maximize'),
    Minimize: createIcon('Minimize'),
    RefreshCw: createIcon('RefreshCw'),
    RefreshCcw: createIcon('RefreshCcw'),
    PenTool: createIcon('PenTool'),
    Pencil: createIcon('Pencil'),
    LayoutGrid: createIcon('LayoutGrid'),
    LayoutDashboard: createIcon('LayoutDashboard'),
    CheckCircle: createIcon('CheckCircle'),
    CheckCircle2: createIcon('CheckCircle2'),
    Calendar: createIcon('Calendar'),
    CalendarRange: createIcon('CalendarRange'),
    Download: createIcon('Download'),
    Upload: createIcon('Upload'),
    Filter: createIcon('Filter'),
    MoreHorizontal: createIcon('MoreHorizontal'),
    MoreVertical: createIcon('MoreVertical'),
    File: createIcon('File'),
    Folder: createIcon('Folder'),
    Menu: createIcon('Menu'),
    LogOut: createIcon('LogOut'),
    Bell: createIcon('Bell'),
    HelpCircle: createIcon('HelpCircle'),
    ExternalLink: createIcon('ExternalLink'),
    Copy: createIcon('Copy'),
    History: createIcon('History'),
    Save: createIcon('Save'),
    Printer: createIcon('Printer'),
    Mail: createIcon('Mail'),
    Phone: createIcon('Phone'),
    Globe: createIcon('Globe'),
    Globe2: createIcon('Globe2'),
    MessageSquare: createIcon('MessageSquare'),
    MessageCircle: createIcon('MessageCircle'),

    // Additional icons from codebase
    Loader2: createIcon('Loader2'),
    Lock: createIcon('Lock'),
    Landmark: createIcon('Landmark'),
    Tag: createIcon('Tag'),
    HardHat: createIcon('HardHat'),
    Hammer: createIcon('Hammer'),
    Factory: createIcon('Factory'),
    GraduationCap: createIcon('GraduationCap'),
    Wheat: createIcon('Wheat'),
    Circle: createIcon('Circle'),
    Router: createIcon('Router'),
    Wifi: createIcon('Wifi'),
    ListTree: createIcon('ListTree'),
    List: createIcon('List'),

    // Dashboard/Menu icons
    BarChart3: createIcon('BarChart3'),
    ClipboardCheck: createIcon('ClipboardCheck'),
    ClipboardList: createIcon('ClipboardList'),
    Cog: createIcon('Cog'),
    Receipt: createIcon('Receipt'),
    Wrench: createIcon('Wrench'),
    Shield: createIcon('Shield'),
    ShieldCheck: createIcon('ShieldCheck'),
    FileBarChart: createIcon('FileBarChart'),
    HardDrive: createIcon('HardDrive'),
    Box: createIcon('Box'),
    Boxes: createIcon('Boxes'),
    FileSearch: createIcon('FileSearch'),
    FileSpreadsheet: createIcon('FileSpreadsheet'),
    LandPlot: createIcon('LandPlot'),
    SquareParking: createIcon('SquareParking'),

    // Arrow icons
    ArrowUp: createIcon('ArrowUp'),
    ArrowDown: createIcon('ArrowDown'),
    ArrowLeft: createIcon('ArrowLeft'),
    CircleArrowLeft: createIcon('CircleArrowLeft'),

    // Other action icons
    Share: createIcon('Share'),
    Eraser: createIcon('Eraser'),
    CheckSquare: createIcon('CheckSquare'),
    Droplet: createIcon('Droplet'),
    Hash: createIcon('Hash'),
    ShoppingCart: createIcon('ShoppingCart'),
    Megaphone: createIcon('Megaphone'),
    Timer: createIcon('Timer'),
    Unlock: createIcon('Unlock'),
    Monitor: createIcon('Monitor'),
    FolderTree: createIcon('FolderTree'),
    XCircle: createIcon('XCircle'),
    Edit2: createIcon('Edit2'),
    Layout: createIcon('Layout'),
    LucideIcon: createIcon('LucideIcon'),
    CalendarDays: createIcon('CalendarDays'),
    TrendingUp: createIcon('TrendingUp'),
    Grid2X2: createIcon('Grid2X2'),
    ClipboardCopy: createIcon('ClipboardCopy'),
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});