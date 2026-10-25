import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { BulkPropertyItem } from "@/types/zone-master/properties/property-bulk.types";
import { SocietyWingDetailItem } from "@/types/zone-master/properties/society-wing-details.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";
import { generateBuildingStructureAction, createBulkBuildingPropertiesAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { parseBulkPropertyErrors } from "@/lib/utils/bulk-property-errors";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface UsePartitionSubmitProps {
  form: PartitionFormState;
  setForm: React.Dispatch<React.SetStateAction<PartitionFormState>>;
  selectedWard: WardItem | null;
  selectedProperty: ZonePropertyItem | null;
  wings: WingItem[];
  wingDetails: SocietyWingDetailItem[];
  wingDetailsMast: WingDetailsMastItem[];
  setWingDetailsMast?: React.Dispatch<React.SetStateAction<WingDetailsMastItem[]>>;
  societyDetails?: SocietyDetailItem[];
  setSocietyDetails?: React.Dispatch<React.SetStateAction<SocietyDetailItem[]>>;
  selectedPropertyId: number | null;
  floors: Floor[];
  validate: (data: PartitionFormState) => { valid: boolean; errors: PartitionFormErrors };
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess?: () => void;
  onClose: () => void;
  showAddWingForm: boolean;
  newWingId: number | null;
  newWingName: string;
  handleSaveWing: (errors: PartitionFormErrors, setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>) => Promise<void>;
  refetchWingDetails?: () => Promise<void>;
  setAllProperties?: React.Dispatch<React.SetStateAction<ZonePropertyItem[]>>;
}

export function usePartitionSubmit({
  form,
  setForm,
  selectedWard,
  selectedProperty,
  wings,
  wingDetailsMast,
  selectedPropertyId,
  floors,
  validate,
  setLoading,
  onSuccess,
  onClose,
  showAddWingForm,
  newWingId,
  newWingName,
  handleSaveWing,
  refetchWingDetails,
  setAllProperties,
}: UsePartitionSubmitProps) {
  const t = useTranslations("zoneMaster");
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));

  const handleSubmit = useCallback(async (errors: PartitionFormErrors, setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>) => {
    // If Add Wing form is open, use that logic instead
    if (showAddWingForm) {
      if (!newWingId || !newWingName) {
        toast.warning(t("partitionForm.wing.placeholders.wingLetter", { wing: wingAlias }));
        return;
      }
      await handleSaveWing(errors, setErrors);
      return;
    }

    const validationResult = validate(form);
    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      toast.error(t("error.fixValidation"));
      return;
    }

    setLoading(true);
    try {
      // Handle wing partition creation
      if (form.partitionType === "wing") {
        if (!selectedWard?.id || !selectedProperty?.propertyNo) {
          toast.error("Ward ID and Property No are required");
          setLoading(false);
          return;
        }

        const selectedWing = wings.find(w => w.wingNo === form.wingLetter);
        if (!selectedWing) {
          toast.error("Invalid wing selection");
          setLoading(false);
          return;
        }

        // Convert floor IDs to floor codes for API submission
        const fromFloorId = parseInt(form.fromFloor, 10);
        const toFloorId = parseInt(form.toFloor, 10);
        
        if (isNaN(fromFloorId) || isNaN(toFloorId)) {
          toast.error("Invalid floor selection");
          setLoading(false);
          return;
        }
        
        const fromFloorData = floors.find(f => f.id === fromFloorId);
        const toFloorData = floors.find(f => f.id === toFloorId);
        
        if (!fromFloorData || !toFloorData) {
          toast.error("Invalid floor selection");
          setLoading(false);
          return;
        }

        const noOfFlatOnOneFloor = parseInt(form.noOfFlatOnOneFloor, 10);
        const flatStart = parseInt(form.flatStart, 10);
        const incrementedBy = parseInt(form.incrementedBy, 10);

        if (isNaN(noOfFlatOnOneFloor) || isNaN(flatStart) || isNaN(incrementedBy)) {
          toast.error("Invalid numeric values in form fields");
          setLoading(false);
          return;
        }

        const payload = {
          wardId: selectedWard.id,
          propertyNo: selectedProperty.propertyNo,
          wingId: selectedWing.id,
          fromFloor: fromFloorData.floorCode,
          toFloor: toFloorData.floorCode,
          noOfFlatOnOneFloor,
          flatStart,
          incrementedBy,
          prifix: form.prefix?.trim() || undefined,
          generationType: form.generationType.trim(),
        };

        const result = await generateBuildingStructureAction(payload);
        
        if (result.success) {
          toast.success(result.message || t("partitionMessages.createSuccess"));
          onSuccess?.();
          onClose();
        } else {
          toast.error(result.error || t("partitionMessages.createError"));
        }
      } else if (form.partitionType === "amenity") {
        // Handle bulk amenity creation for Apartment Categories
        if (!selectedWard?.id || !selectedProperty) {
          toast.error("Ward and Property are required");
          setLoading(false);
          return;
        }

        if (!selectedProperty.taxZoneId || !selectedProperty.propertyTypeId || !selectedProperty.categoryId) {
          toast.error("Missing required property configuration: taxZoneId, propertyTypeId, or categoryId");
          setLoading(false);
          return;
        }

        const fromAmenity = parseInt(form.fromAmenity, 10);
        const toAmenity = parseInt(form.toAmenity, 10);

        if (isNaN(fromAmenity) || isNaN(toAmenity)) {
          toast.error("Invalid amenity range");
          setLoading(false);
          return;
        }

        if (!selectedPropertyId) {
          toast.error("Property is required");
          setLoading(false);
          return;
        }

        // Determine the prefix and wingDetailId based on selected wing.
        // "Main Society" (no wing selected) amenities are created the same
        // way as BuildingPreviewModal's "Generate Properties" bulk call -
        // just without a wingDetailId, using plain "AM" prefix.
        let amenityPrefix = "AM";
        let wingDetailId: number | undefined;

        if (form.selectedWingForAmenity) {
          amenityPrefix = `${form.selectedWingForAmenity}-AM`;
          const wingMaster = wings.find(w => w.wingNo === form.selectedWingForAmenity);
          wingDetailId = wingMaster
            ? wingDetailsMast.find(w => w.wingMasterId === wingMaster.id && !w.markedForDeletion)?.id
            : undefined;
        }

        const currentDate = new Date().toISOString();
        const bulkPayload: BulkPropertyItem[] = [];

        for (let i = fromAmenity; i <= toAmenity; i++) {
          bulkPayload.push({
            taxZoneId: selectedProperty.taxZoneId,
            wardId: selectedWard.id,
            propertyNo: selectedProperty.propertyNo,
            propertyTypeId: selectedProperty.propertyTypeId,
            categoryId: selectedProperty.categoryId,
            partitionNo: `${amenityPrefix}${i}`,
            flatOrShopNo: "",
            flatOrShopNoEnglish: "",
            address: selectedProperty.address || "",
            addressEnglish: selectedProperty.addressEnglish || "",
            location: selectedProperty.location || "",
            locationEnglish: selectedProperty.locationEnglish || "",
            wingDetailId,
            createdBy: 0, // Will be set by server action from authenticated user
            createdDate: currentDate,
          });
        }

        const result = await createBulkBuildingPropertiesAction(bulkPayload);

        if (result.data) {
          if (result.data.allSucceeded) {
            toast.success(t("partitionMessages.amenityCreateSuccess", { count: result.data.successCount }));
            
            // Add newly created amenities to allProperties so calculateMaxAmenity returns correct value
            if (setAllProperties && selectedProperty) {
              const newAmenities: ZonePropertyItem[] = bulkPayload.map((item, index) => ({
                id: -(index + 1), // Temporary negative ID
                taxZoneId: item.taxZoneId,
                wardId: item.wardId,
                propertyNo: item.propertyNo,
                partitionNo: item.partitionNo,
                propertyTypeId: item.propertyTypeId,
                categoryId: item.categoryId,
                upicId: "",
                openPlot: false,
                csn: null,
                subZoneNo: null,
                plotNo: null,
                type: null,
                ownerTitle: null,
                ownerName: null,
                ownerTitleEnglish: null,
                ownerNameEnglish: null,
                occupierTitle: null,
                occupierName: null,
                occupierTitleEnglish: null,
                occupierNameEnglish: null,
                flatOrShopNo: item.flatOrShopNo,
                flatOrShopName: null,
                flatOrShopNoEnglish: item.flatOrShopNoEnglish,
                flatOrShopNameEnglish: null,
                address: item.address,
                location: item.location,
                addressEnglish: item.addressEnglish,
                locationEnglish: item.locationEnglish,
                mobileNo: null,
                emailId: null,
                societyDetailId: null,
                markedForDeletion: false,
                propertySeqNo: null,
                displayProperty: null,
                isActive: true,
                createdDate: item.createdDate,
                updatedDate: null,
              }));
              setAllProperties(prev => [...prev, ...newAmenities]);
            }
            
            // Reset amenity form fields and switch to wing tab, but don't close drawer
            setForm(prev => ({ 
              ...prev, 
              selectedWingForAmenity: "", 
              fromAmenity: "",
              toAmenity: "", 
              partitionType: "wing" 
            }));
            // Refresh wing details to get updated amenity counts
            await refetchWingDetails?.();
            onSuccess?.();
          } else {
            // Parse and display errors as toast alert
            const errorMessages = result.data.errors || [];
            const parsedErrors = parseBulkPropertyErrors(errorMessages, t, result.data.failedCount);
            const toastFn = parsedErrors.severity === "warning" ? toast.warning : toast.error;
            toastFn(parsedErrors.title, {
              description: parsedErrors.messages.join("\n"),
              duration: 8000,
            });
            // Refresh data and reset amenity form to get latest amenity count
            setForm(prev => ({ 
              ...prev, 
              selectedWingForAmenity: "", 
              fromAmenity: "",
              toAmenity: "" 
            }));
            // Refresh wing details to get updated amenity counts
            await refetchWingDetails?.();
            onSuccess?.();
          }
        } else {
          toast.error(result.error || t("partitionMessages.amenityCreateError"));
        }
      } else {
        // Handle bulk partition creation for Non-Apartment Categories
        if (!selectedWard?.id || !selectedProperty) {
          toast.error("Ward and Property are required");
          setLoading(false);
          return;
        }

        if (!selectedProperty.taxZoneId || !selectedProperty.propertyTypeId || !selectedProperty.categoryId) {
          toast.error("Missing required property configuration: taxZoneId, propertyTypeId, or categoryId");
          setLoading(false);
          return;
        }

        const fromPartition = parseInt(form.fromPartition, 10);
        const toPartition = parseInt(form.toPartition, 10);

        if (isNaN(fromPartition) || isNaN(toPartition)) {
          toast.error("Invalid partition range");
          setLoading(false);
          return;
        }

        const currentDate = new Date().toISOString();
        const bulkPayload: BulkPropertyItem[] = [];

        for (let i = fromPartition; i <= toPartition; i++) {
          bulkPayload.push({
            taxZoneId: selectedProperty.taxZoneId,
            wardId: selectedWard.id,
            propertyNo: selectedProperty.propertyNo,
            propertyTypeId: selectedProperty.propertyTypeId,
            categoryId: selectedProperty.categoryId,
            partitionNo: String(i),
            flatOrShopNo: "",
            flatOrShopNoEnglish: "",
            address: selectedProperty.address || "",
            addressEnglish: selectedProperty.addressEnglish || "",
            location: selectedProperty.location || "",
            locationEnglish: selectedProperty.locationEnglish || "",
            createdBy: 0, // Will be set by server action from authenticated user
            createdDate: currentDate,
          });
        }

        const result = await createBulkBuildingPropertiesAction(bulkPayload);
        
        if (result.data) {
          if (result.data.allSucceeded) {
            toast.success(t("partitionMessages.bulkCreateSuccess", { count: result.data.successCount }));
            onSuccess?.();
            onClose();
          } else {
            // Parse and display errors as toast alert
            const errorMessages = result.data.errors || [];
            const parsedErrors = parseBulkPropertyErrors(errorMessages, t, result.data.failedCount);
            const toastFn = parsedErrors.severity === "warning" ? toast.warning : toast.error;
            toastFn(parsedErrors.title, {
              description: parsedErrors.messages.join("\n"),
              duration: 8000,
            });
          }
        } else {
          toast.error(result.error || t("partitionMessages.createError"));
        }
      }
    } catch (_error) {
      toast.error(t("partitionMessages.createError"));
    } finally {
      setLoading(false);
    }
  }, [form, setForm, selectedWard, selectedProperty, selectedPropertyId, wings, wingDetailsMast, floors, validate, setLoading, onSuccess, onClose, showAddWingForm, newWingId, newWingName, handleSaveWing, refetchWingDetails, setAllProperties, t, wingAlias]);

  return {
    handleSubmit,
  };
}
