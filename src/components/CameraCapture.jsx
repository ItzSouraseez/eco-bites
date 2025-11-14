'use client';

import { useRef, useState, useEffect } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob && onCapture) {
        const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
        onCapture(file);
      }
      stopCamera();
      // Don't close immediately - let user see the preview
      if (onClose) onClose();
    }, 'image/jpeg', 0.9);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Close button */}
        <button
          onClick={() => {
            stopCamera();
            if (onClose) onClose();
          }}
          className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 z-20 transition-all"
          aria-label="Close camera"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Capture button - Fixed at bottom */}
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-6 flex flex-col items-center gap-3 relative z-20">
        <button
          onClick={capturePhoto}
          disabled={!stream}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-200 hover:border-gray-100 active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative"
          aria-label="Capture photo"
        >
          <div className="w-full h-full rounded-full bg-white"></div>
        </button>
        <p className="text-white text-sm font-medium drop-shadow-lg">
          {stream ? 'Tap to capture' : 'Loading camera...'}
        </p>
      </div>
    </div>
  );
}

