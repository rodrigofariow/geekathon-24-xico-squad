import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Wine {
  name: string;
  price: number;
  value: number;
}

interface WineListProps {
  wines: Wine[];
}

export function WineList({ wines }: WineListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mt-6"
    >
      <h2 className="text-2xl font-serif italic mb-4 text-amber-100 drop-shadow-md">
        Curated Selection
      </h2>
      <ul className="space-y-2">
        {wines.map((wine, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex justify-between items-center bg-amber-50/70 backdrop-blur-sm p-3 rounded-lg shadow-md border border-amber-200"
          >
            <div>
              <span className="font-serif text-red-900">{wine.name}</span>
              <div className="text-sm text-red-700">Price: ${wine.price}</div>
            </div>
            <div className="flex items-center">
              <span className="text-amber-500 mr-1">
                {Array.from({ length: Math.round(wine.value) }).map((_, i) => (
                  <Star key={i} className="inline-block w-4 h-4 fill-current" />
                ))}
              </span>
              <span className="text-sm text-red-700">
                {wine.value.toFixed(1)}/10
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
