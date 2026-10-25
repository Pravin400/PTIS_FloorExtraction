import { CommonRemarkForm } from "@/components/modules/configuration-settings/common-remark-master";
import { getCommonRemarkByIdAction, fetchRemarkCategoriesAction } from "../../actions";
import { notFound } from "next/navigation";
import React from "react";
import type { CommonRemark, RemarkCategory } from "@/types/common-remark-master/common-remark.types";
import { ApiError } from "@/lib/utils/api";

interface PageProps {
  params: Promise<{
    remarkId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { remarkId: remarkIdParam } = await params;

  const remarkId = Number(remarkIdParam);
  if (!Number.isFinite(remarkId) || remarkId <= 0) {
    notFound();
  }

  let remarkData: CommonRemark;
  let categories: RemarkCategory[];
  try {
    const [data, cats] = await Promise.all([
      getCommonRemarkByIdAction(remarkId),
      fetchRemarkCategoriesAction(),
    ]);
    remarkData = data;
    categories = cats;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <CommonRemarkForm
        id={remarkId}
        initialData={remarkData}
        categories={categories}
      />
    </>
  );
}
