'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CameraViewfinder } from './camera/CameraViewfinder';
import { CameraControlsBar } from './camera/CameraControlsBar';

export interface PwaCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, previewUrl: string) => void;
  onFallbackToFileUpload?: () => void;
}

export function PwaCameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackToFileUpload,
}: PwaCameraModalProps) {
  const t = useTranslations('grievance');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Stop all active video tracks cleanly
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Check if device has more than one camera
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      await Promise.resolve();
      setIsLoading(true);
      setError(null);
      stopTracks();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError(t('cameraNotSupported'));
        setIsLoading(false);
        return;
      }

      try {
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode },
            audio: false,
          });
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        console.warn('[PwaCamera] getUserMedia failed:', err);
        setError(t('cameraPermissionError'));
      } finally {
        setIsLoading(false);
      }
    },
    [t, stopTracks]
  );

  // Reset media state when isOpen changes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    setCapturedImage(null);
    setCapturedBlob(null);
    setError(null);
  }

  // Manage camera stream lifecycle on isOpen / facingMode changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startCamera(facingMode);
      }, 0);
      return () => {
        clearTimeout(timer);
        stopTracks();
      };
    }

    stopTracks();
    return () => {
      stopTracks();
    };
  }, [isOpen, facingMode, startCamera, stopTracks]);

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 150);

    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    ctx.restore();
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const timestampStr = new Date().toLocaleString();
    ctx.fillText(`AMC PWA Camera • ${timestampStr}`, 20, height - 25);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedImage(url);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleAcceptPhoto = () => {
    if (!capturedBlob || !capturedImage) return;

    const fileName = `pwa-evidence-${Date.now()}.jpg`;
    const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });

    stopTracks();
    onCapture(file, capturedImage);
    onClose();
  };

  const handleClose = () => {
    stopTracks();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    onClose();
  };

  const handleFallback = () => {
    handleClose();
    onFallbackToFileUpload?.();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[170] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-md h-[90vh] max-h-[700px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 flex flex-col font-sans select-none">
        {isFlashActive && (
          <div className="absolute inset-0 z-30 bg-white animate-in fade-in duration-75" />
        )}

        {/* Top Header Controls Bar */}
        <div className="absolute top-0 inset-x-0 z-20 p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2 text-white">
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{t('cameraPwa')}</span>
          </div>

          {hasMultipleCameras ? (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              disabled={!!capturedImage}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
              title={t('switchCamera')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>

        {/* Viewfinder Center Display */}
        <CameraViewfinder
          videoRef={videoRef}
          capturedImage={capturedImage}
          facingMode={facingMode}
          isLoading={isLoading}
          error={error}
          onFallback={handleFallback}
          onRetry={() => startCamera(facingMode)}
        />

        {/* Bottom Shutter Controls Bar */}
        <CameraControlsBar
          capturedImage={capturedImage}
          isLoading={isLoading}
          hasError={!!error}
          onFallback={handleFallback}
          onSnapPhoto={handleSnapPhoto}
          onRetake={handleRetake}
          onAcceptPhoto={handleAcceptPhoto}
        />
      </div>
    </div>
  );
}
