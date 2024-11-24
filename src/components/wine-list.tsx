import { motion } from 'framer-motion';
import type { UploadUserImageResponse } from 'lib/main';
import { Star } from 'lucide-react';
import { Suspense, useCallback, useState, useMemo } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface WineListProps {
  wines: UploadUserImageResponse['winesArray'];
}

function WineImage({ url }: { url: string }) {
  return (
    <div className="relative w-24 h-24 sm:w-44 sm:h-44 mr-2 sm:mr-4 flex-shrink-0">
      <img
        src={url}
        alt="Wine bottle"
        className="object-cover rounded-md max-h-full"
      />
    </div>
  );
}

export function WineList({ wines }: WineListProps) {
  const onElementMountRef = useCallback((element: HTMLDivElement) => {
    element?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const { minPrice, maxPrice } = useMemo(() => {
    const prices = wines.map((wine) => wine.price ?? 0);
    return {
      minPrice: Math.floor(Math.min(...prices) * 10) / 10,
      maxPrice: Math.ceil(Math.max(...prices) * 10) / 10,
    };
  }, [wines]);

  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);

  const sortedAndFilteredWines = useMemo(() => {
    return wines
      .filter((wine) => {
        const price = wine.price ?? 0;
        return price >= priceRange[0] && price <= priceRange[1];
      })
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return (a.price ?? 0) - (b.price ?? 0);
      });
  }, [wines, priceRange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mt-6"
      ref={onElementMountRef}
    >
      <h2 className="text-xl sm:text-2xl font-serif italic mb-4 text-amber-100 drop-shadow-md">
        Curated Selection
      </h2>

      <div className="mb-6 bg-amber-50/70 backdrop-blur-sm p-4 rounded-lg">
        <div className="mb-2 text-red-900 text-center">
          Price Range: €{priceRange[0].toFixed(1)} - €{priceRange[1].toFixed(1)}
        </div>
        <Slider
          range
          step={0.1}
          allowCross={false}
          value={priceRange}
          onChange={(value) => setPriceRange(value as number[])}
          min={minPrice}
          max={maxPrice}
          railStyle={{ backgroundColor: '#fef3c7' }}
          trackStyle={[{ backgroundColor: '#991b1b' }]}
          handleStyle={[
            {
              backgroundColor: '#991b1b',
              borderColor: '#991b1b',
              opacity: 1,
              boxShadow: 'none',
            },
            {
              backgroundColor: '#991b1b',
              borderColor: '#991b1b',
              opacity: 1,
              boxShadow: 'none',
            },
          ]}
        />
      </div>

      <ul className="space-y-4">
        {sortedAndFilteredWines.map((wine, index) => (
          <motion.li
            key={wine.hitId + '-' + index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex flex-col sm:flex-row bg-amber-50/70 backdrop-blur-sm p-4 rounded-lg shadow-md border border-amber-200"
          >
            <div className="flex items-start">
              <Suspense
                fallback={
                  <div className="w-16 h-16 mr-4 bg-amber-200/50 animate-pulse rounded-md" />
                }
              >
                {wine.imgUrl && <WineImage url={wine.imgUrl} />}
              </Suspense>

              <div className="flex-1 min-w-0">
                <span className="font-serif text-lg sm:text-xl text-red-900 block mb-1">
                  {wine.name}
                </span>

                <div className="flex items-center space-x-4 mb-2">
                  <div className="text-base text-red-700">
                    Price: €{wine.price || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <span className="text-amber-500 mr-1 flex">
                      {Array.from({ length: Math.round(wine.rating) }).map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="inline-block w-4 h-4 fill-current"
                          />
                        ),
                      )}
                    </span>
                    <span className="text-sm text-red-700">
                      {wine.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {wine.description && (
                  <p className="text-red-800/80 text-sm sm:text-base line-clamp-3 sm:line-clamp-none mt-2">
                    {wine.description}
                  </p>
                )}
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
