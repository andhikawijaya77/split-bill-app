'use client';

import { useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onCapture(selectedFile);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Scan Receipt
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Take a photo or upload an image of your receipt
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="camera-input"
            />
            
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span className="text-2xl">📷</span>
                <span>Take Photo</span>
              </button>
              
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
                className="w-full bg-gray-600 text-white py-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span className="text-2xl">🖼️</span>
                <span>Choose from Gallery</span>
              </button>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full rounded-xl shadow-lg max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="flex-1 text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Tips for best results:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ensure good lighting</li>
                    <li>Keep receipt flat and straight</li>
                    <li>Capture the entire receipt</li>
                    <li>Avoid shadows and glare</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Process Receipt
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
