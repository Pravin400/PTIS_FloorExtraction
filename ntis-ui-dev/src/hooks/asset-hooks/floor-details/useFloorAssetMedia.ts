/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, ChangeEvent } from "react";

export function useFloorAssetMedia(updateFormData: (data: any) => void) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [planUrl, setPlanUrl] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const planInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handlePlanUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPlanUrl(URL.createObjectURL(file));
    }
  };

  const handleMapSelect = (lat: string, lng: string) => {
    updateFormData({ latitude: lat, longitude: lng });
    setIsMapOpen(false);
  };

  return {
    isMapOpen,
    photoFile,
    photoUrl,
    planUrl,
    photoInputRef,
    planInputRef,
    setIsMapOpen,
    handlePhotoUpload,
    handlePlanUpload,
    handleMapSelect,
  };
}
