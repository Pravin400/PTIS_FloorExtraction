"use client";


import { useRouter } from "next/navigation";
import DepartmentMasterForm from "@/components/modules/configuration-settings/department-master/DepartmentMasterForm";
import { DepartmentMaster } from "@/types/departmentMaster.types";

interface EditDepartmentClientProps {
  departmentData: DepartmentMaster;
}

export default function EditDepartmentClient({
  departmentData,
}: EditDepartmentClientProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.refresh();
    router.back();
  };

  return (
    <DepartmentMasterForm
      open={true}
      onClose={handleClose}
      onSuccess={handleSuccess}
      editingDepartment={departmentData}
    />
  );
}
