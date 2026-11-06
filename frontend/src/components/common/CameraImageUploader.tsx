import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Star, RefreshCw, Check, AlertCircle, SwitchCamera, Image as ImageIcon } from 'lucide-react';

export interface UploadedImageItem {
  id?: string;
  file?: File;
  preview: string;
  isPrimary?: boolean;
  caption?: string;
}

interface CameraImageUploaderProps {
  images: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  multiple?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
}

export const CameraImageUploader: React.FC<CameraImageUploaderProps> = ({
  images,
  onChange,
  multiple = true,
  maxImages = 10,
  maxSizeMB = 10,
  label = 'Workshop Photos & Documentation',
  helperText = 'Upload from device or take real-time photos using your device camera (Mobile & Desktop). Supported: JPG, PNG, WEBP.',
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera streams on unmount or modal close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Check if device has multiple cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setErrorMsg(null);
    setCameraError(null);
    setCapturedPreview(null);
    setCapturedBlob(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback to native capture input on unsupported browsers
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      } else {
        setCameraError('Direct camera access is not supported by your browser. Please use device file upload.');
      }
      return;
    }

    try {
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('Camera getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Use "Upload from device" instead.');
      } else {
        // Attempt fallback without exact constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setCameraStream(fallbackStream);
          setIsCameraOpen(true);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
          return;
        } catch {
          setCameraError('Unable to open camera stream. Try using device file upload.');
        }
      }
      setIsCameraOpen(true);
    }
  };

  const switchCameraFacing = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Create compressed JPEG blob
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        const previewUrl = URL.createObjectURL(blob);
        setCapturedPreview(previewUrl);
      }
    }, 'image/jpeg', 0.90);
  };

  const retakePhoto = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview(null);
    setCapturedBlob(null);
  };

  const acceptPhoto = () => {
    if (!capturedBlob) return;

    const filename = `workshop-camera-${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: 'image/jpeg' });
    const previewUrl = capturedPreview || URL.createObjectURL(capturedBlob);

    const isFirst = images.length === 0;
    const newItem: UploadedImageItem = {
      file,
      preview: previewUrl,
      isPrimary: isFirst,
      caption: `Captured Photo ${images.length + 1}`
    };

    if (multiple) {
      onChange([...images, newItem]);
    } else {
      onChange([newItem]);
    }

    closeCameraModal();
  };

  const closeCameraModal = () => {
    stopCamera();
    if (capturedPreview && !images.some(img => img.preview === capturedPreview)) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview(null);
    setCapturedBlob(null);
    setCameraError(null);
    setIsCameraOpen(false);
  };

  // Process files from device upload or native camera input
  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    setIsCompressing(true);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const newItems: UploadedImageItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (!allowedTypes.includes(file.type)) {
        setErrorMsg(`Invalid file type "${file.name}". Please upload JPG, PNG, or WEBP images.`);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds maximum allowed size of ${maxSizeMB}MB.`);
        continue;
      }

      // If file is large (> 1.5MB), compress slightly client-side before upload
      let finalFile = file;
      if (file.size > 1.5 * 1024 * 1024) {
        try {
          finalFile = await compressImageFile(file);
        } catch (e) {
          console.warn('Compression skipped, using original file:', e);
        }
      }

      const previewUrl = URL.createObjectURL(finalFile);
      const isFirst = images.length === 0 && newItems.length === 0;
      newItems.push({
        file: finalFile,
        preview: previewUrl,
        isPrimary: isFirst,
        caption: file.name.replace(/\.[^/.]+$/, '')
      });

      if (!multiple) break;
      if (images.length + newItems.length >= maxImages) break;
    }

    setIsCompressing(false);
    if (newItems.length > 0) {
      if (multiple) {
        onChange([...images, ...newItems]);
      } else {
        onChange(newItems);
      }
    }
  };

  const compressImageFile = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const maxDimension = 2048;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressed);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.88);
      };
      img.onerror = () => resolve(file);
    });
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((item, idx) => ({
      ...item,
      isPrimary: idx === index
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const itemToRemove = images[index];
    if (itemToRemove.file && itemToRemove.preview) {
      URL.revokeObjectURL(itemToRemove.preview);
    }
    const updated = images.filter((_, idx) => idx !== index);
    // If the primary image was removed, designate the first remaining image as primary
    if (itemToRemove.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => processFiles(e.target.files)}
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={(e) => processFiles(e.target.files)}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Label and Helper Text */}
      <div>
        <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">
          {label}
        </label>
        {helperText && (
          <p className="text-[11px] text-gray-400">{helperText}</p>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons: Upload & Camera */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="inline-flex items-center space-x-2 bg-metal-800 hover:bg-metal-700 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3.5 rounded-lg border border-metal-700 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4 text-brand-red" />
          <span>Upload from Device</span>
        </button>

        <button
          type="button"
          onClick={() => startCamera()}
          disabled={images.length >= maxImages}
          className="inline-flex items-center space-x-2 bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-3.5 rounded-lg transition-colors shadow-sm"
        >
          <Camera className="w-4 h-4" />
          <span>📷 Take Photo / Use Camera</span>
        </button>

        {isCompressing && (
          <div className="flex items-center space-x-2 text-xs text-metal-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Optimizing image...</span>
          </div>
        )}
      </div>

      {/* Drag & Drop Zone if no images yet */}
      {images.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            processFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragOver ? 'border-brand-red bg-metal-900' : 'border-metal-800 bg-metal-950 hover:border-metal-700'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-metal-900 flex items-center justify-center text-metal-400">
              <ImageIcon className="w-6 h-6 text-brand-red" />
            </div>
            <p className="text-xs font-medium text-gray-300">
              Drag & drop photos here, or select an option above
            </p>
            <p className="text-[10px] text-gray-500">
              Take photos directly on the workshop floor to document fabrication & installation.
            </p>
          </div>
        </div>
      )}

      {/* Multi-Image Gallery & Primary Selector */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {images.map((item, index) => (
            <div
              key={index}
              className={`group relative rounded-lg overflow-hidden border bg-metal-900 aspect-square flex flex-col justify-between transition-all ${
                item.isPrimary ? 'border-brand-red ring-2 ring-brand-red/30' : 'border-metal-800'
              }`}
            >
              <img
                src={item.preview}
                alt={item.caption || `Image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary Badge */}
              {item.isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-brand-red text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow flex items-center space-x-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>Cover</span>
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1.5 right-1.5 bg-metal-950/80 hover:bg-red-600 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Bottom Actions Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between text-[10px]">
                {!item.isPrimary ? (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="text-gray-300 hover:text-white font-medium hover:underline text-[10px]"
                  >
                    Set as Cover
                  </button>
                ) : (
                  <span className="text-brand-red font-bold text-[10px]">Primary Cover</span>
                )}
                <span className="text-gray-400 font-mono text-[9px]">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive In-App Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-metal-950 border border-metal-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-metal-800 flex items-center justify-between bg-metal-900/60">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-brand-red" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Workshop Camera Capture
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-metal-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder Content */}
            <div className="relative bg-black flex items-center justify-center min-h-[300px] sm:min-h-[380px] overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-brand-red mx-auto" />
                  <p className="text-xs text-red-300 max-w-sm">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="inline-flex items-center space-x-2 bg-metal-800 hover:bg-metal-700 text-white text-xs font-semibold py-2 px-4 rounded-lg"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Try Native Device Camera</span>
                  </button>
                </div>
              ) : capturedPreview ? (
                // Captured Preview Mode
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={capturedPreview}
                    alt="Captured preview"
                    className="max-h-[380px] w-auto object-contain rounded"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    Photo Captured
                  </div>
                </div>
              ) : (
                // Live Video Stream Mode
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[380px] object-cover"
                  />

                  {/* Camera Controls Overlay */}
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={switchCameraFacing}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-metal-700 backdrop-blur-sm transition-colors"
                      title="Switch Camera (Front/Rear)"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  )}

                  <div className="absolute bottom-3 inset-x-0 flex justify-center">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full border-4 border-white bg-brand-red hover:bg-red-700 shadow-xl flex items-center justify-center transition-transform active:scale-95"
                      title="Capture Photo"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-white/50" />
                    </button>
                  </div>
                </div>
              )}

              {/* Offscreen Canvas for Snapshot Capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-metal-800 bg-metal-900/60 flex items-center justify-between">
              {capturedPreview ? (
                <>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="inline-flex items-center space-x-1.5 bg-metal-800 hover:bg-metal-700 text-gray-200 text-xs font-semibold py-2 px-3.5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={acceptPhoto}
                    className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept & Use Photo</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between w-full text-xs text-gray-400">
                  <span>Frame your workshop piece and press the shutter button.</span>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
