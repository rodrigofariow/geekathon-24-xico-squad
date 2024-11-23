import { type SonnetResponseWithGuesses } from './anthropic';
import { searchVivinoWinesFromQuery } from './vivino';

type VivinoSearchResult = Awaited<
  ReturnType<typeof searchVivinoWinesFromQuery>
>;

const redWineTypeEquivalentArray = ['tinto', 'red'];
const whiteWineTypeEquivalentArray = ['branco', 'white'];

const mockWines: SonnetResponseWithGuesses = [
  {
    name: 'Comenda Grande',
    type: 'red',
    year: '21',
    price: '11.99',
  },
  {
    name: 'Conventual Reserva',
    type: 'red',
    year: '2021',
    price: '11.99',
  },
  {
    name: 'Vila Santa',
    type: 'red',
    year: 'N/A',
    price: 'N/A',
  },
  {
    name: 'Vinha Marines',
    type: 'red',
    year: 'N/A',
    price: '14.99',
  },
  {
    name: 'Quinta do Carmo',
    type: 'red',
    year: '2018',
    price: '19.49',
  },
  {
    name: 'Esporao',
    type: 'red',
    year: 'N/A',
    price: 'N/A',
  },
];

const parseYearFromClaudeRawYear = (rawYear: string): number | null => {
  const yearRegex = /(\d{2,4})/;
  const yearMatch = rawYear.match(yearRegex);
  if (yearMatch) {
    const year = yearMatch[0];
    if (year.length === 2) {
      const twoDigitYear = parseInt(year);
      return Number(twoDigitYear < 30 ? `20${year}` : `19${year}`);
    }
    return Number(year);
  }
  return null;
};

type ParsedGuessedWine = {
  name: string;
  type: 'red' | 'white' | null;
  year: number | null;
};

const parseGuessedWines = (
  guessedWines: SonnetResponseWithGuesses
): ParsedGuessedWine[] => {
  return guessedWines.map(
    (wine): ParsedGuessedWine => ({
      ...wine,
      year: parseYearFromClaudeRawYear(wine.year),
    })
  );
};

export async function uploadUserImage({
  img,
}: {
  img: { base64: string; ext: 'jpeg' | 'png' };
}) {
  const originalImage = img;
  // 1. Get wines list using sonnet, from the uploaded user image
  const guessedWines = mockWines;
  const parsedGuessedWines = parseGuessedWines(guessedWines);

  const vivinoCalls = parsedGuessedWines.map((wine) =>
    searchVivinoWinesFromQuery({ query: wine.name })
  );

  // 2. Get results from vivino for each guessed wine
  const vivinoResults = await Promise.all(vivinoCalls);

  const mostLikelyHitsByGuessedWineName = new Map<
    // Wine name
    string,
    VivinoSearchResult['hits']
  >();
  for (const [index, result] of vivinoResults.entries()) {
    // console.dir(result, { depth: null });
    const sonnetGuessedWine = parsedGuessedWines[index];

    const mostLikelyHitsForGuessedWineOrUndefined =
      mostLikelyHitsByGuessedWineName.get(sonnetGuessedWine.name);
    if (mostLikelyHitsForGuessedWineOrUndefined === undefined) {
      mostLikelyHitsByGuessedWineName.set(sonnetGuessedWine.name, []);
    }
    const mostLikelyHitsForGuessedWine = mostLikelyHitsByGuessedWineName.get(
      sonnetGuessedWine.name
    ) as Exclude<typeof mostLikelyHitsForGuessedWineOrUndefined, undefined>;

    const mostLikelyHits = getMostLikelyHitsForSonnetGuessedWine(result, {
      sonnetGuessedWine,
    });

    // console.log(
    //   `${mostLikelyHits.length} mostLikelyHits for ${sonnetGuessedWine.name} out of ${result.hits.length} total hits:`,
    //   mostLikelyHits
    // );

    if (mostLikelyHits.length === 0) {
      const defaultHit = result.hits[0];
      mostLikelyHitsForGuessedWine.push(defaultHit);
      continue;
    }

    if (
      mostLikelyHits.length === 1 &&
      mostLikelyHits[0].vintages.length === 1
    ) {
      mostLikelyHitsForGuessedWine.push(mostLikelyHits[0]);
      continue;
    }

    mostLikelyHitsForGuessedWine.push(...mostLikelyHits);

    // const a = result.hits.filter((hit) =>
    //   hit.vintages.filter((vintage) => Number(vintage.year) === parsedGuessedWines[0].year)
    // );
    // console.log(a);
  }

  for (const [winName, wineHits] of mostLikelyHitsByGuessedWineName) {
    console.log(`Wine: ${winName}`);
    console.log('mostLikelyHitsForEachWine');
    console.dir(wineHits, { depth: null });
    console.log('\n');
  }

  // const finalVivinoUrls: string[] = [];
  // const { hitsThatNeedAnthropicChecking, readyVivinoUrls } = partitionData(
  //   mostLikelyHitsByGuessedWineName
  // );
  // finalVivinoUrls.push(...readyVivinoUrls);

  // for (const [wineName, hit] of hitsThatNeedAnthropicChecking) {
  //   console.log(hit.name);
  //   const originalUserUploadedImageBase64 = [];

  //   const otherImagesPresence = await getOtherImagesPresenceInOriginalImage({
  //     originalImage: {
  //       name: "original",
  //       base64: originalImage.base64,
  //       fileExtension: originalImage.ext,
  //     },
  //     otherImages: hit.vintages,
  //   });
  //   otherImagesPresence.forEach(({ fileName, isPresent }) => {
  //     if (isPresent) {
  //       finalVivinoUrls.push(fileName);
  //     }
  //   });
  //   // TODO: Call compareBottle
  // }

  await Bun.write(`results_main.json`, JSON.stringify(vivinoResults, null, 2));
}

function buildVivinoUrl({
  seo_name,
  id,
  year,
}: {
  seo_name: string;
  id: number;
  year?: string;
}): string {
  const baseUrl = new URL(`https://www.vivino.com/${seo_name}/w/${id}`);
  if (year) {
    baseUrl.searchParams.set('year', year);
  }
  return baseUrl.toString();
}

function partitionData(
  mostLikelyHitsForEachWine: Map<
    // Wine name
    string,
    VivinoSearchResult['hits']
  >
) {
  const hitsThatNeedAnthropicCheckingByWineName = new Map<
    string,
    VivinoSearchResult['hits']
  >();
  const readyVivinoUrls: string[] = [];

  for (const [wineName, wineHits] of mostLikelyHitsForEachWine) {
    if (wineHits.length === 1 && wineHits[0].vintages.length === 1) {
      const hit = wineHits[0];
      // We only have one option. Nothing to send to sonnet.
      const vivinoUrl = buildVivinoUrl({
        seo_name: hit.seo_name,
        id: hit.id,
        year: hit.vintages[0].year,
      });
      readyVivinoUrls.push(vivinoUrl);
      continue;
    }

    hitsThatNeedAnthropicCheckingByWineName.set(wineName, wineHits);
  }

  return {
    hitsThatNeedAnthropicCheckingByWineName,
    readyVivinoUrls,
  };
}

function getMostLikelyHitsForSonnetGuessedWine(
  result: VivinoSearchResult,
  { sonnetGuessedWine }: { sonnetGuessedWine: ParsedGuessedWine }
): VivinoSearchResult['hits'] {
  /* Logic to match the guessed wine with the vivino result with some heuristics:
      - name
      - year
      - type
    */
  const simplifiedMatchedHits: VivinoSearchResult['hits'] = [];
  for (const hit of result.hits) {
    const matchedVintagesByYear = hit.vintages.filter((vintage) => {
      if (Number(vintage.year) === sonnetGuessedWine.year) {
        return true;
      }
      if (
        Number.isNaN(Number(vintage.year)) &&
        sonnetGuessedWine.year === null
      ) {
        return true;
      }
      return false;
    });

    if (matchedVintagesByYear.length === 0) {
      continue;
    }

    if (matchedVintagesByYear.length === 1) {
      simplifiedMatchedHits.push({ ...hit, vintages: matchedVintagesByYear });
      continue;
    }

    // More than one match

    const matchedVintagesByType = matchedVintagesByYear.filter((vintage) => {
      switch (sonnetGuessedWine.type) {
        case 'red':
          return redWineTypeEquivalentArray.some((type) =>
            vintage.seo_name.includes(type)
          );
        case 'white':
          return whiteWineTypeEquivalentArray.some((type) =>
            vintage.seo_name.includes(type)
          );
        default: {
          return false;
        }
      }
    });

    if (matchedVintagesByType.length === 0) {
      continue;
    }
    if (matchedVintagesByType.length === 1) {
      simplifiedMatchedHits.push({ ...hit, vintages: matchedVintagesByType });
      continue;
    }
    // More than one match

    simplifiedMatchedHits.push({ ...hit, vintages: matchedVintagesByType });
  }

  return simplifiedMatchedHits;
}
