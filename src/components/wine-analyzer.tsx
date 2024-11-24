'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from './image-uploader';
import { WineList } from './wine-list';
import { Wine } from 'lucide-react';
import type { UploadUserImageResponse } from 'lib/main';

export function WineAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [wines, setWines] = useState<
    UploadUserImageResponse['winesArray'] | undefined
  >(undefined);

  const handleImageUpload = (
    imageDataUrl: string,
    results?: UploadUserImageResponse,
  ) => {
    setImage(imageDataUrl);
    setWines(undefined);

    if (results) {
      setWines(results?.winesArray || []);
      setAnalyzing(false);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      // If we have preloaded results, just wait for minimum time
      if (wines) {
        setTimeout(() => {
          setAnalyzing(false);
        }, 3_000);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="backdrop-blur-md bg-amber-50/30 border-amber-200">
        <CardContent className="p-6">
          <ImageUploader onImageUpload={handleImageUpload} />
          <AnimatePresence>
            {image && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex justify-center"
              >
                <img
                  src={image}
                  alt="Uploaded wine collection"
                  className="w-full sm:w-3/4 xl:w-1/2 rounded-lg shadow-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex justify-center mt-8 mb-4">
            <Button
              onClick={analyzeImage}
              disabled={!image || analyzing}
              className={`
                px-8 py-6 text-lg font-semibold
                bg-gradient-to-r from-red-800 to-red-600 
                hover:from-red-900 hover:to-red-700 
                text-amber-100 
                transition-all duration-300 ease-in-out 
                transform hover:scale-105 hover:shadow-lg
                disabled:from-red-800/50 disabled:to-red-600/50
                disabled:cursor-not-allowed
                rounded-xl
                ${analyzing ? 'animate-pulse' : ''}
              `}
            >
              {analyzing ? (
                <span className="flex items-center space-x-3">
                  <Wine className="animate-spin h-6 w-6" />
                  <span>Analyzing your collection...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-3">
                  <Wine className="h-6 w-6" />
                  <span>Analyze Wines</span>
                </span>
              )}
            </Button>
          </div>
          <AnimatePresence>
            {wines && Number(wines?.length) > 0 && <WineList wines={wines} />}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
