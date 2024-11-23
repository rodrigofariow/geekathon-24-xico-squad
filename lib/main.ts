import {
  getAllBottlesFromImage,
  type SonnetResponseWithGuesses,
} from "./anthropic";
import { getOtherImagesPresenceInOriginalImage } from "./compareBottle";
import type { VivinoImgMeta } from "./compareBottle";
import { searchVivinoWinesFromQuery } from "./vivino";

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
    baseUrl.searchParams.set("year", year);
  }
  return baseUrl.toString();
}

type VivinoSearchResult = Awaited<
  ReturnType<typeof searchVivinoWinesFromQuery>
>;

const redWineTypeEquivalentArray = ["tinto", "red"];
const whiteWineTypeEquivalentArray = ["branco", "white"];

// const mockWines: SonnetResponseWithGuesses = [
//   {
//     name: "Comenda Grande",
//     type: "red",
//     year: "21",
//     price: "11.99",
//   },
//   // {
//   //   name: "Conventual Reserva",
//   //   type: "red",
//   //   year: "2021",
//   //   price: "11.99",
//   // },
//   // {
//   //   name: "Vila Santa",
//   //   type: "red",
//   //   year: "N/A",
//   //   price: "N/A",
//   // },
//   // {
//   //   name: "Vinha Marines",
//   //   type: "red",
//   //   year: "N/A",
//   //   price: "14.99",
//   // },
//   // {
//   //   name: "Quinta do Carmo",
//   //   type: "red",
//   //   year: "2018",
//   //   price: "19.49",
//   // },
//   // {
//   //   name: "Esporao",
//   //   type: "red",
//   //   year: "N/A",
//   //   price: "N/A",
//   // },
// ];

const parseYearFromClaudeRawYear = (
  rawYear: string | null | undefined
): number | null => {
  const yearRegex = /(\d{2,4})/;
  if (!rawYear) {
    return null;
  }
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
  type: "red" | "white" | null;
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
  img: { base64: string; ext: "jpeg" | "png" };
}): Promise<{
  vivinoImgUrls: string[];
}> {
  const originalImage = img;
  // 1. Get wines list using sonnet, from the uploaded user image
  const guessedWines = await getAllBottlesFromImage({
    base64: img.base64,
    fileExtension: img.ext,
    name: "original",
  });
  // const guessedWines = [
  //   { name: "DAO", type: null, year: "2020", price: null },
  //   { name: "Dona Ermelinda", type: null, year: null, price: null },
  //   { name: "Dom Martinho", type: null, year: "2023", price: null },
  //   { name: "Piano", type: null, year: null, price: null },
  //   { name: "Cabriz", type: null, year: null, price: null },
  // ];

  console.log("------------------------------");
  console.log("guessedWines", guessedWines);
  console.log("------------------------------");
  const parsedGuessedWines = parseGuessedWines(guessedWines);

  const vivinoCalls = parsedGuessedWines.map((wine) =>
    searchVivinoWinesFromQuery({ query: wine.name })
  );

  // 2. Get results from vivino for each guessed wine
  const vivinoResults = await Promise.all(vivinoCalls);

  const mostLikelyHitsByGuessedWineName = new Map<
    // Wine name
    string,
    VivinoSearchResult["hits"]
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

  // for (const [winName, wineHits] of mostLikelyHitsByGuessedWineName) {
  //   console.log(`Wine: ${winName}`);
  //   console.log("mostLikelyHitsForEachWine");
  //   console.dir(wineHits, { depth: null });
  //   console.log("\n");
  // }

  const finalVivinoUrls: string[] = [];
  const { hitsThatNeedAnthropicCheckingByWineName, readyVivinoUrls } =
    partitionData(mostLikelyHitsByGuessedWineName);

  finalVivinoUrls.push(...readyVivinoUrls);

  console.log(
    "hitsThatNeedAnthropicCheckingByWineName",
    hitsThatNeedAnthropicCheckingByWineName
  );
  console.log("readyVivinoUrls", readyVivinoUrls);

  async function processWine(
    wineName: string,
    wineHits: VivinoSearchResult["hits"]
  ) {
    const imgsBase64 = await Promise.all(
      wineHits.map((hit) => {
        const imgUrl = ((): string => {
          if (hit.image.location.startsWith("//")) {
            return `https:${hit.image.location}`;
          }
          if (hit.image.location.startsWith("http")) {
            return hit.image.location;
          }
          return hit.image.location;
        })();

        return fetch(imgUrl)
          .then((res) => res.arrayBuffer())
          .then((buffer) => Buffer.from(buffer).toString("base64"));
      })
    );

    // console.log("imgsBase64", imgsBase64);

    // await Bun.write(`imgsBase64.json`, JSON.stringify(imgsBase64, null, 2));

    const otherImages: VivinoImgMeta[] = wineHits
      .map((hit, index): VivinoImgMeta | null => {
        const base64FromImgUrl = imgsBase64[index];

        const fileExtension = hit.image.location.split(".").pop();
        if (!fileExtension) {
          return null;
        }
        return {
          name: hit.name,
          base64: base64FromImgUrl,
          fileExtension:
            fileExtension === "jpg"
              ? "jpeg"
              : (fileExtension as "jpeg" | "png"),
        };
      })
      .filter((img): img is VivinoImgMeta => !!img);
    const otherImagesPresence = await getOtherImagesPresenceInOriginalImage({
      originalImage: {
        name: "original",
        base64: originalImage.base64,
        fileExtension: originalImage.ext,
      },
      otherImages,
    });

    console.log("------------------------------");
    console.log(`otherImagesPresence for ${wineName}`, otherImagesPresence);
    console.log("------------------------------");

    otherImagesPresence.forEach(({ fileName, isPresent }) => {
      if (!isPresent) {
        return;
      }
      const hit = wineHits.find((img) => img.name === fileName);
      if (!hit) {
        return;
      }
      finalVivinoUrls.push(
        buildVivinoUrl({
          seo_name: hit.seo_name,
          id: hit.id,
          year: hit.vintages[0].year,
        })
      );
    });
  }

  const promises: Promise<void>[] = [];
  for (const [wineName, wineHits] of hitsThatNeedAnthropicCheckingByWineName) {
    promises.push(processWine(wineName, wineHits));
  }

  await Promise.all(promises);

  // await Bun.write(`results_main.json`, JSON.stringify(vivinoResults, null, 2));

  return {
    vivinoImgUrls: finalVivinoUrls,
  };
}

function partitionData(
  mostLikelyHitsForEachWine: Map<
    // Wine name
    string,
    VivinoSearchResult["hits"]
  >
) {
  const hitsThatNeedAnthropicCheckingByWineName = new Map<
    string,
    VivinoSearchResult["hits"]
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
): VivinoSearchResult["hits"] {
  /* Logic to match the guessed wine with the vivino result with some heuristics:
      - name
      - year
      - type
    */
  const simplifiedMatchedHits: VivinoSearchResult["hits"] = [];
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
        case "red":
          return redWineTypeEquivalentArray.some((type) =>
            vintage.seo_name.includes(type)
          );
        case "white":
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
