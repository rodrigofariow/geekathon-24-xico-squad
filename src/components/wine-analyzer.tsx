'use client';

import { useState } from 'react';
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

  const handleImageUpload = (imageDataUrl: string) => {
    console.log('Image uploaded:', imageDataUrl);
    setImage(imageDataUrl);
    setWines([]);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      // This is where you'd call your AI service API
      // For now, we'll use a placeholder response
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setWines([
        { name: 'Chateau Margaux 2015', price: 650, value: 9.5 },
        { name: 'Caymus Cabernet Sauvignon 2018', price: 90, value: 8.7 },
        { name: 'La Crema Pinot Noir 2019', price: 25, value: 7.8 },
      ]);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setAnalyzing(false);
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
            {wines.length > 0 && <WineList wines={wines} />}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
