import type {
  UseGroup,
  UseType,
} from "@/types/typeOfUse.types";

// Re-export icon mapping functions from centralized config
export { getIconKey, getIconComponent } from "@/config/typeofuse-icons.config";

export function getTypeApiId(t: UseType) {
  return String(t.typeOfUseId);
}

export function clsx(...a: Array<string | false | undefined | null>) {
  return a.filter(Boolean).join(" ");
}

export function getGroupApiId(g: UseGroup): string {
  return String(g.typeOfUseGroupId);
}

