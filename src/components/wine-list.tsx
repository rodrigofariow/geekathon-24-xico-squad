import { motion } from "framer-motion";
import type { UploadUserImageResponse } from "lib/main";
import { Star } from "lucide-react";
import { Suspense } from "react";

interface WineListProps {
  wines: UploadUserImageResponse["winesArray"];
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
  const sortedWines = wines.sort((a, b) => {
    // First sort by rating in descending order
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    // If ratings are equal, sort by price in ascending order
    return (a.price ?? 0) - (b.price ?? 0);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mt-6"
    >
      <h2 className="text-xl sm:text-2xl font-serif italic mb-4 text-amber-100 drop-shadow-md">
        Curated Selection
      </h2>
      <ul className="space-y-2">
        {sortedWines.map((wine, index) => (
          <motion.li
            key={wine.hitId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex flex-col sm:flex-row items-start sm:items-center bg-amber-50/70 backdrop-blur-sm p-3 rounded-lg shadow-md border border-amber-200"
          >
            <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0">
              <Suspense
                fallback={
                  <div className="w-16 h-16 mr-4 bg-amber-200/50 animate-pulse rounded-md" />
                }
              >
                {wine.imgUrl && <WineImage url={wine.imgUrl} />}
              </Suspense>

              <div className="flex-1">
                <span className="font-serif text-lg sm:text-2xl text-red-900 line-clamp-2">
                  {wine.name}
                </span>
                <div className="text-base sm:text-xl text-red-700">
                  Price: €{wine.price}
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-amber-500 mr-1 flex">
                    {Array.from({ length: Math.round(wine.rating) }).map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="inline-block w-4 h-4 sm:w-6 sm:h-6 fill-current"
                        />
                      )
                    )}
                  </span>
                  <span className="text-base sm:text-xl text-red-700">
                    {wine.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
