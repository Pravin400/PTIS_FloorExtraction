import { UserConfigurationClient } from './UserConfigurationClient';
import { UserManagementClient } from './UserManagementClient';
import { RoleDesignationMasterClient } from './RoleDesignationMasterClient';
import { UserConfigurationProps } from '@/types/user-management';

export function UserConfiguration({
  translations,
  initialData,
  fetchError,
  statusCode,
}: UserConfigurationProps) {
  return (
    <UserConfigurationClient
      translations={translations}
      fetchError={fetchError}
      statusCode={statusCode}
      userManagement={
        <UserManagementClient
          initialUsers={initialData.users}
          initialTotalCount={initialData.totalCount}
        />
      }
      roleDesignationMaster={
        <RoleDesignationMasterClient
          initialRoles={initialData.roles}
          initialDesignations={initialData.designations}
          departments={initialData.departments}
        />
      }
    />
  );
}
