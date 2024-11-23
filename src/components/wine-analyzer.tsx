'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from './image-uploader';
import { WineList } from './wine-list';
import { Wine } from 'lucide-react';

export function WineAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [wines, setWines] = useState<
    Array<{ name: string; price: number; value: number }>
  >([]);
  const [preloadedResults, setPreloadedResults] = useState<any>(null);

  const handleImageUpload = (imageDataUrl: string, results?: any) => {
    setImage(imageDataUrl);
    setWines([]);
    setPreloadedResults(results || null);
  };

  console.log({ analyzing });

  // Watch for preloaded results
  useEffect(() => {
    if (preloadedResults) {
      setAnalyzing(false);
    }
  }, [preloadedResults]);

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      // If we have preloaded results, just wait for minimum time
      if (preloadedResults) {
        setTimeout(() => {
          setWines(preloadedResults.wines);
          setAnalyzing(false);
        }, 1_000);
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
                className="mt-4"
              >
                <img
                  src={image}
                  alt="Uploaded wine collection"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            onClick={analyzeImage}
            disabled={!image || analyzing}
            className="mt-4 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-900 hover:to-red-700 text-amber-100 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            {analyzing ? (
              <span className="flex items-center">
                <Wine className="animate-spin mr-2" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center">
                <Wine className="mr-2" />
                Analyze Wines
              </span>
            )}
          </Button>
          <AnimatePresence>
            {wines?.length > 0 && <WineList wines={wines} />}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
