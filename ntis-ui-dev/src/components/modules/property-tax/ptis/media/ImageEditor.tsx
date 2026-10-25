'use client';

import { useState, useEffect, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import { getCroppedImg, getTransformedImg, getInitialCrop, FlipState } from './canvasUtils';
import { ImageEditorControls, type AspectType } from './ImageEditorControls';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  imageSrc: string;
  imageTitle: string;
  onSave: (file: File) => Promise<boolean>;
  onCancel: () => void;
}

export function ImageEditor({ imageSrc, imageTitle, onSave, onCancel }: ImageEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  const [currentImageSrc, setCurrentImageSrc] = useState<string>(imageSrc);
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState<FlipState>({ horizontal: false, vertical: false });
  const [originalAspect, setOriginalAspect] = useState<number | undefined>(undefined);
  const [aspectType, setAspectType] = useState<AspectType>('free');
  const [isSaving, setIsSaving] = useState(false);

  // Update physical transformed image on rotation/flip changes
  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const updateImage = async () => {
      if (rotation === 0 && !flip.horizontal && !flip.vertical) {
        if (active) setCurrentImageSrc(imageSrc);
        return;
      }
      try {
        const blob = await getTransformedImg(imageSrc, rotation, flip);
        if (blob && active) {
          objectUrl = URL.createObjectURL(blob);
          setCurrentImageSrc(objectUrl);
        }
      } catch (err) {
        console.error('Error transforming image', err);
      }
    };

    updateImage();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageSrc, rotation, flip]);

  const aspectRatio = aspectType === 'original' ? originalAspect : aspectType === '1:1' ? 1 : aspectType === '4:3' ? 4 / 3 : aspectType === '16:9' ? 16 / 9 : undefined;

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const aspect = naturalWidth / naturalHeight;
    setOriginalAspect(aspect);
    setCrop(getInitialCrop(naturalWidth, naturalHeight, aspectRatio));
  };

  // Center crop when aspect ratio changes
  useEffect(() => {
    if (imgRef.current && imgRef.current.naturalWidth && imgRef.current.naturalHeight) {
      setCrop(getInitialCrop(imgRef.current.naturalWidth, imgRef.current.naturalHeight, aspectRatio));
    }
  }, [aspectRatio]);

  const handleSave = async () => {
    if (!crop.width || !crop.height || isSaving) return;
    setIsSaving(true);
    try {
      const croppedBlob = await getCroppedImg(currentImageSrc, crop);
      if (croppedBlob) {
        const extension = croppedBlob.type.split('/')[1] || 'jpeg';
        const fileName = `${imageTitle.replace(/\s+/g, '_')}_edited.${extension}`;
        const file = new File([croppedBlob], fileName, { type: croppedBlob.type });
        const success = await onSave(file);
        if (success) onCancel();
      }
    } catch (error) {
      console.error('Failed to crop image', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-slate-50 text-slate-800 select-none image-editor-drawer-content">
      {/* Viewport area for Cropper */}
      <div className="relative flex-1 bg-slate-100 min-h-[300px] flex items-center justify-center overflow-auto p-4 sm:p-8">
        <div className="max-w-full max-h-full flex items-center justify-center bg-white shadow-sm border border-slate-200 rounded-lg p-2">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            aspect={aspectRatio}
            className="max-w-full max-h-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={currentImageSrc}
              alt={imageTitle}
              onLoad={onImageLoad}
              style={{
                maxHeight: '52vh',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          </ReactCrop>
        </div>
      </div>

      <ImageEditorControls
        setRotation={setRotation}
        flip={flip}
        setFlip={setFlip}
        aspectType={aspectType}
        setAspectType={setAspectType}
        isSaving={isSaving}
        onCancel={onCancel}
        handleSave={handleSave}
      />
    </div>
  );
}
