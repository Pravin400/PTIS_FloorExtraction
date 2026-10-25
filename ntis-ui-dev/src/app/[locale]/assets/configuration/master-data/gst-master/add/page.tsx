import React from "react";
import GstMasterForm from "@/components/modules/assets/configuration/master-data/gst-master/GstMasterForm";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  return <GstMasterForm id={null} initialData={null} />;
}

