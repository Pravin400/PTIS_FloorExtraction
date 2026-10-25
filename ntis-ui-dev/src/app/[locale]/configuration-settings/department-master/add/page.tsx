"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DepartmentMasterForm from "@/components/modules/configuration-settings/department-master/DepartmentMasterForm";

export default function AddDepartmentPage(): React.ReactElement {
  const router = useRouter();

  return (
    <DepartmentMasterForm 
      open={true} 
      onClose={() => router.back()} 
      onSuccess={() => {
        router.refresh();
        router.back();
      }}
      editingDepartment={null} 
    />
  );
}
