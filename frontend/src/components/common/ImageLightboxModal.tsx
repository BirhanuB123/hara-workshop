import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, ExternalLink } from 'lucide-react';
import { getMediaUrl, downloadFile } from '../../utils/media';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Image Preview',
}) => {
  const [scale, setScale] = useState(1);
  const resolvedUrl = getMediaUrl(imageUrl);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(resolvedUrl, title);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-metal-950/80 border-b border-metal-800/80 z-10 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 truncate pr-4">
          <span className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
            {title}
          </span>
          <span className="text-xs text-gray-400">({Math.round(scale * 100)}%)</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 text-gray-400 hover:text-white bg-metal-900/80 hover:bg-metal-800 disabled:opacity-40 rounded-lg transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Zoom */}
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-gray-400 hover:text-white bg-metal-900/80 hover:bg-metal-800 rounded-lg transition-colors"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-1.5 text-gray-400 hover:text-white bg-metal-900/80 hover:bg-metal-800 disabled:opacity-40 rounded-lg transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-metal-800 mx-1" />

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 text-amber-400 hover:text-amber-300 bg-metal-900/80 hover:bg-metal-800 rounded-lg transition-colors"
            title="Download Image"
            aria-label="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Open in new tab */}
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-400 hover:text-white bg-metal-900/80 hover:bg-metal-800 rounded-lg transition-colors"
            title="Open Original in New Tab"
            aria-label="Open Original in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-metal-900/80 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors ml-1"
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div
          className="relative transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={resolvedUrl}
            alt={title}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl select-none"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = '';
            }}
          />
        </div>
      </div>
    </div>
  );
};
