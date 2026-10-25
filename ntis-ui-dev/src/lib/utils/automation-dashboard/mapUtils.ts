import { toast } from "sonner";
import { generateGisSsoUrl } from "@/components/modules/property-tax/ptis/media/actions/gisSso";

export const handleLocationClick = async (
  property: Record<string, unknown> | null,
  wardNoParam?: string,
  propertyIdParam?: string | number
) => {
  try {
    let loggedInName = "Unknown User";
    let loggedInUserId = "1263";

    try {
      if (typeof window !== "undefined") {
        const sessionRaw = sessionStorage.getItem("ptms_session_user");
        if (sessionRaw) {
          const sessionUser = JSON.parse(sessionRaw);
          if (sessionUser?.displayName || sessionUser?.username) {
            loggedInName = String(sessionUser.displayName || sessionUser.username);
          }
          if (sessionUser?.userId) {
            loggedInUserId = String(sessionUser.userId);
          }
        }
      }
    } catch (e) {
      console.warn("Could not read session user for GIS SSO", e);
    }

    const userId = loggedInUserId;
    const name = loggedInName;

    // Extract propertyOwnerId
    let propertyOwnerId = "";
    if (propertyIdParam) {
      propertyOwnerId = String(propertyIdParam);
    } else {
      const rawOwnerId = property?.propertyId;
      propertyOwnerId = rawOwnerId ? String(rawOwnerId) : (property?.id ? String(property.id).split('-')[0] : "");
    }

    // Extract propertyKey (wardNo-propertyNo)
    let wardNo = wardNoParam;
    let propertyNo = "";

    if (property) {
      if (!wardNo) {
        wardNo = property.wardNo as string | undefined;
      }
      if (typeof property.propertyNo === 'object' && property.propertyNo !== null) {
        const pNoObj = property.propertyNo as { new?: string; old?: string };
        propertyNo = pNoObj.new || pNoObj.old || "";
      } else {
        propertyNo = (property.newPropertyNo as string | undefined) || (property.propertyNo as string | undefined) || "";
      }
    }

    let propertyKey = "";
    const trimmedWard = wardNo?.trim();
    const trimmedProp = propertyNo?.trim();

    if (trimmedWard && trimmedProp) {
      // Avoid duplicating wardNo if propertyNo already starts with it
      if (trimmedProp.startsWith(trimmedWard)) {
        propertyKey = trimmedProp;
      } else {
        propertyKey = `${trimmedWard}-${trimmedProp}`;
      }
    } else if (trimmedProp) {
      propertyKey = trimmedProp;
    }

    const url = await generateGisSsoUrl(userId, name, propertyOwnerId, propertyKey || undefined);

    window.open(url, "_blank");
  } catch {
    toast.error("Failed to open map view");
  }
};