"use server";

import { revalidatePath } from "next/cache";

export * from "@/lib/actions/fire-audit";

export async function revalidateFireAuditHome(): Promise<void> {
  revalidatePath("/[locale]/fire-audit", "page");
}
