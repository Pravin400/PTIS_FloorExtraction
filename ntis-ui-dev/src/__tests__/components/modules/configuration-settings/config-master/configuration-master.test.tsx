import { describe, it, expect, vi, beforeEach } from 'vitest';
import './test-setup';
import { render, screen } from '@testing-library/react';
import { revalidatePath } from 'next/cache';

const mockPermissions = {
  canView: true,
  canEdit: true,
  canDelete: true,
  haveFullAccess: true,
  hasAccess: true,
};

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockPermissions,
}));

vi.mock('@/hooks/useActivePagePermissions', () => ({
  useActivePagePermissions: () => mockPermissions,
}));

vi.mock('@/components/modules/configuration-settings/config-master/ConfigModalsController', () => ({
  ConfigModalsController: () => null,
}));

import { createConfigCategoryAction } from '@/app/[locale]/configuration-settings/config-master/actions/category';
import { createConfigKeyAction } from '@/app/[locale]/configuration-settings/config-master/actions/key';
import { createConfigValueAction } from '@/app/[locale]/configuration-settings/config-master/actions/value';
import { ConfigurationMaster } from '@/components/modules/configuration-settings/config-master/ConfigurationMaster';
import { ConfigurationMasterHeader } from '@/components/modules/configuration-settings/config-master/ConfigurationMasterHeader';
import {
  CategoryEditDeleteActions,
  CategoryBulkActions,
} from '@/components/modules/configuration-settings/config-master/ConfigCategoryActions';
import { ConfigItemRow } from '@/components/modules/configuration-settings/config-master/ConfigItemRow';
import { ConfigItemActions } from '@/components/modules/configuration-settings/config-master/ConfigItemActions';
import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import { moduleMasterService } from '@/lib/api/moduleMaster.service';
import { departmentMasterService } from '@/lib/api/departmentMaster.service';
import { mockVerifySession } from './test-setup';
import type { ConfigCategory, ConfigItem } from '@/types/configMaster.types';

vi.mock('@/lib/api/configuration-settings/config-master/configMaster.service', () => ({
  configMasterService: {
    createConfigCategory: vi.fn(),
    createConfigKey: vi.fn(),
    createConfigValue: vi.fn(),
    getAllConfigValuesFull: vi.fn(),
    getAllCategories: vi.fn(async () => ({ success: true, data: [] })),
    getItemsByCategory: vi.fn(),
  },
}));

vi.mock('@/lib/api/moduleMaster.service', () => ({
  moduleMasterService: { getModuleMasters: vi.fn() },
}));

vi.mock('@/lib/api/departmentMaster.service', () => ({
  departmentMasterService: { getAllDepartmentMasters: vi.fn() },
}));

describe('Configuration Master PR Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissions.canView = true;
    mockPermissions.canEdit = true;
    mockPermissions.canDelete = true;
    mockPermissions.haveFullAccess = true;
    mockPermissions.hasAccess = true;
  });

  it('creates category action successfully', async () => {
    mockVerifySession.mockResolvedValue(1);
    vi.mocked(configMasterService.createConfigCategory).mockResolvedValue({ success: true });
    const fd = new FormData();
    fd.append('categoryCode', 'SYS');
    fd.append('categoryName', 'System');
    fd.append('displayOrder', '1');
    fd.append('isActive', 'true');

    const res = await createConfigCategoryAction(fd);
    expect(res.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalled();
  });

  it('creates config key action successfully', async () => {
    mockVerifySession.mockResolvedValue(1);
    vi.mocked(configMasterService.createConfigKey).mockResolvedValue({ success: true });
    const fd = new FormData();
    fd.append('categoryId', '1');
    fd.append('configCode', 'CFG_A');
    fd.append('configName', 'Config A');
    fd.append('description', 'Desc');
    fd.append('dataType', 'string');
    fd.append('controlType', 'text');
    fd.append('defaultValue', 'x');
    fd.append('isActive', 'true');

    const res = await createConfigKeyAction(fd);
    expect(res.success).toBe(true);
  });

  it('creates config value action successfully', async () => {
    mockVerifySession.mockResolvedValue(1);
    vi.mocked(configMasterService.createConfigValue).mockResolvedValue({ success: true });
    const fd = new FormData();
    fd.append('configKeyId', '1');
    fd.append('departmentId', '');
    fd.append('moduleId', '');
    fd.append('value', 'on');
    fd.append('isEnabled', 'true');

    const res = await createConfigValueAction(fd);
    expect(res.success).toBe(true);
  });

  it('renders ConfigurationMaster component', () => {
    const categories: ConfigCategory[] = [
      {
        id: '1',
        code: 'SYS',
        name: 'System',
        displayOrder: 1,
        isActive: true,
        color: 'rose',
        icon: 'Shield',
        count: 1,
        total: 1,
      },
    ];
    const items: ConfigItem[] = [
      {
        id: '1',
        configKeyId: 1,
        configValueId: 0,
        categoryId: 1,
        name: 'A',
        configCode: 'A',
        description: '',
        value: '',
        defaultValue: '',
        isEnabled: true,
        category: '1',
        type: 'text',
        controlType: 'text',
        dataType: 'string',
        stats: { deptOverrides: 0, userOverrides: 0, totalDepts: 0, totalUsers: 0 },
        hasTag: false,
      },
    ];

    render(
      <ConfigurationMaster
        categories={categories}
        initialItems={items}
        departmentData={null}
        categoryId="1"
        search=""
        locale="en"
      />
    );
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('service mocks are callable', async () => {
    vi.mocked(moduleMasterService.getModuleMasters).mockResolvedValue({ success: true, data: [] });
    vi.mocked(departmentMasterService.getAllDepartmentMasters).mockResolvedValue({
      success: true,
      data: [],
    });
    expect((await moduleMasterService.getModuleMasters()).success).toBe(true);
    expect((await departmentMasterService.getAllDepartmentMasters()).success).toBe(true);
  });

  describe('Permissions and Access Control', () => {
    const categories: ConfigCategory[] = [
      {
        id: '1',
        code: 'SYS',
        name: 'System',
        displayOrder: 1,
        isActive: true,
        color: 'rose',
        icon: 'Shield',
        count: 1,
        total: 1,
      },
    ];
    const items: ConfigItem[] = [
      {
        id: '1',
        configKeyId: 1,
        configValueId: 0,
        categoryId: 1,
        name: 'A',
        configCode: 'A',
        description: 'Test description',
        value: '',
        defaultValue: '',
        isEnabled: true,
        category: '1',
        type: 'text',
        controlType: 'text',
        dataType: 'string',
        stats: { deptOverrides: 0, userOverrides: 0, totalDepts: 0, totalUsers: 0 },
        hasTag: false,
      },
    ];


    it('renders unauthorized screen when statusCode is 401', () => {
      mockPermissions.canView = false;
      mockPermissions.haveFullAccess = false;

      render(
        <ConfigurationMaster
          categories={categories}
          initialItems={items}
          departmentData={null}
          categoryId="1"
          search=""
          locale="en"
          statusCode={401}
        />
      );

      expect(screen.getByText('errors.unauthorized')).toBeInTheDocument();
    });

    it('gates category and key creation actions in header based on full access', () => {
      mockPermissions.haveFullAccess = true;
      const { rerender } = render(
        <ConfigurationMasterHeader
          title="title"
          subtitle="subtitle"
          systemLevelLabel="systemLevel"
          addCategoryLabel="Add Category"
          addConfigKeyLabel="Add Key"
          activeCategoryId="1"
        />
      );
      expect(screen.getByText('Add Category')).toBeInTheDocument();
      expect(screen.getByText('Add Key')).toBeInTheDocument();

      mockPermissions.haveFullAccess = false;
      rerender(
        <ConfigurationMasterHeader
          title="title"
          subtitle="subtitle"
          systemLevelLabel="systemLevel"
          addCategoryLabel="Add Category"
          addConfigKeyLabel="Add Key"
          activeCategoryId="1"
        />
      );
      expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Key')).not.toBeInTheDocument();
    });

    it('gates category actions based on permissions', () => {
      // 1. Bulk Toggles (requires haveFullAccess)
      mockPermissions.haveFullAccess = true;
      const { rerender: rerenderBulk } = render(
        <CategoryBulkActions categoryId="1" categoryName="System" />
      );
      expect(screen.getByText('list.enableAll')).toBeInTheDocument();

      mockPermissions.haveFullAccess = false;
      rerenderBulk(<CategoryBulkActions categoryId="1" categoryName="System" />);
      expect(screen.queryByText('list.enableAll')).not.toBeInTheDocument();

      // 2. Edit & Delete Category Actions
      mockPermissions.haveFullAccess = true;
      mockPermissions.canEdit = false;
      mockPermissions.canDelete = false;
      const { container, rerender: rerenderEditDelete } = render(
        <CategoryEditDeleteActions categoryId="1" categoryName="System" />
      );
      expect(container.querySelectorAll('button').length).toBe(2);

      mockPermissions.haveFullAccess = false;
      mockPermissions.canEdit = true;
      mockPermissions.canDelete = false;
      rerenderEditDelete(<CategoryEditDeleteActions categoryId="1" categoryName="System" />);
      expect(container.querySelectorAll('button').length).toBe(1);

      mockPermissions.haveFullAccess = false;
      mockPermissions.canEdit = false;
      mockPermissions.canDelete = true;
      rerenderEditDelete(<CategoryEditDeleteActions categoryId="1" categoryName="System" />);
      expect(container.querySelectorAll('button').length).toBe(2);

      mockPermissions.haveFullAccess = false;
      mockPermissions.canEdit = false;
      mockPermissions.canDelete = false;
      rerenderEditDelete(<CategoryEditDeleteActions categoryId="1" categoryName="System" />);
      expect(container.querySelectorAll('button').length).toBe(0);
    });

    it('gates toggle switch visibility in row based on permissions', () => {
      const item: ConfigItem = {
        id: '1',
        configKeyId: 1,
        configValueId: 0,
        categoryId: 1,
        name: 'A',
        configCode: 'A',
        description: '',
        value: '',
        defaultValue: '',
        isEnabled: true,
        category: '1',
        type: 'text',
        controlType: 'text',
        dataType: 'string',
        stats: { deptOverrides: 0, userOverrides: 0, totalDepts: 0, totalUsers: 0 },
        hasTag: false,
      };

      mockPermissions.haveFullAccess = false;
      mockPermissions.canEdit = false;
      mockPermissions.canDelete = false;
      mockPermissions.canView = true;
      const { rerender } = render(<ConfigItemRow item={item} locale="en" />);
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();

      mockPermissions.canEdit = true;
      rerender(<ConfigItemRow item={item} locale="en" />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('gates key actions (edit, delete, config) based on permissions', () => {
      mockPermissions.haveFullAccess = true;
      mockPermissions.canEdit = false;
      mockPermissions.canDelete = false;

      const { container, rerender } = render(
        <ConfigItemActions id="1" configKeyId={1} isEnabled={true} />
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect((buttons[1] as HTMLButtonElement).disabled).toBe(false);

      mockPermissions.haveFullAccess = false;
      mockPermissions.canEdit = true;
      mockPermissions.canDelete = false;
      rerender(<ConfigItemActions id="1" configKeyId={1} isEnabled={true} />);
      const buttonsEdit = container.querySelectorAll('button');
      expect(buttonsEdit.length).toBe(2);
      expect((buttonsEdit[1] as HTMLButtonElement).disabled).toBe(true);

      mockPermissions.haveFullAccess = false;
      mockPermissions.canEdit = false;
      mockPermissions.canDelete = true;
      rerender(<ConfigItemActions id="1" configKeyId={1} isEnabled={true} />);
      const buttonsDelete = container.querySelectorAll('button');
      expect(buttonsDelete.length).toBe(1);
      expect((buttonsDelete[0] as HTMLButtonElement).disabled).toBe(true);

      mockPermissions.haveFullAccess = false;
      mockPermissions.canEdit = false;
      mockPermissions.canDelete = false;
      rerender(<ConfigItemActions id="1" configKeyId={1} isEnabled={true} />);
      const buttonsView = container.querySelectorAll('button');
      expect(buttonsView.length).toBe(1);
      expect((buttonsView[0] as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
