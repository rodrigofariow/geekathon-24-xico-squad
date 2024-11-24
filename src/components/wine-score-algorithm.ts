import type { UploadUserImageResponse } from 'lib/main';

type Wine = UploadUserImageResponse['winesArray'][number];

type RankedWine = Wine & { score: number }; // Add the score property

/**
 * Ranks an array of wines based on price and rating.
 * @param wines - Array of wine objects with price and rating.
 * @param ratingWeight - Weight for rating (0.0 to 1.0).
 * @param priceWeight - Weight for price (0.0 to 1.0).
 * @returns An array of wines with scores, ranked from highest to lowest.
 */
export function rankWines(
  wines: Wine[],
  ratingWeight: number = 0.6, // Default weight: ratings more important
  priceWeight: number = 0.4, // Default weight: price less important
): RankedWine[] {
  if (ratingWeight + priceWeight !== 1) {
    throw new Error('The sum of ratingWeight and priceWeight must be 1.');
  }

  // Step 1: Find min and max prices for normalization
  //@ts-expect-error asda
  const minPrice = Math.min(...wines.map((wine) => wine.price));
  //@ts-expect-error asda
  const maxPrice = Math.max(...wines.map((wine) => wine.price));

  // Step 2: Normalize rating and price, then calculate scores
  const rankedWines: RankedWine[] = wines.map((wine) => {
    // Normalize rating (0–5 to 0–10)
    const normalizedRating = (wine.rating / 5) * 10;

    // Normalize price (higher price -> lower score, scaled to 0–10)
    const normalizedPrice =
      //@ts-expect-error asda
      (10 * (maxPrice - wine.price)) / (maxPrice - minPrice);

    // Weighted score combining price and rating
    const score =
      ratingWeight * normalizedRating + priceWeight * normalizedPrice;

    return { ...wine, score: parseFloat(score.toFixed(2)) }; // Include score in result
  });

  // Step 3: Sort wines by score in descending order
  return rankedWines.sort((a, b) => b.score - a.score);
}
