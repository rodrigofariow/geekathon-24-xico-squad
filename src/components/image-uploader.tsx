'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { captureWines } from '@/lib/actions';
import type { UploadUserImageResponse } from 'lib/main';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onImageUpload: (
    imageDataUrl: string,
    preloadedResults?: UploadUserImageResponse,
  ) => void;
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (e.target && typeof e.target.result === 'string') {
        // Immediately show the image
        onImageUpload(e.target.result);

        // Silently make the API call
        try {
          const result = await captureWines(e.target.result);
          // Update parent with the results
          onImageUpload(e.target.result, result);
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to capture wines',
          });
          console.error('Error preloading analysis:', error);
        }
      }
    };

    reader.readAsDataURL(file);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <motion.div
      className={`p-6 border-2 border-dashed rounded-lg text-center ${
        dragActive ? 'border-red-400' : 'border-amber-300'
      } bg-amber-100/50`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      animate={{
        boxShadow: dragActive ? '0 0 0 6px rgba(220, 38, 38, 0.3)' : 'none',
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      <p className="text-red-900 mb-2 font-serif italic">
        Uncork your collection&apos;s potential
      </p>
      <Button
        onClick={onButtonClick}
        className="bg-gradient-to-r from-red-800 to-red-600 hover:from-red-900 hover:to-red-700 text-amber-100 transition-all duration-300 ease-in-out transform hover:scale-105"
      >
        <Camera className="mr-2" />
        Capture Your Wines
      </Button>
    </motion.div>
  );
}
