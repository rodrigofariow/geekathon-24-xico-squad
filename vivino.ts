import { z } from "zod";

const resSchema = z.object({
  hits: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      seo_name: z.string(),
      // e.g "A fresh, fruity wine with a lovely attack, bringing a reminder of red-berried fruit mingling with the coconut and vanilla aromas from the oak. Full and supple with a long finish. A wine with character which showcases the quality of the grapes used to make it.",
      description: z.string(),
      image: z.object({
        location: z.string(),
        variations: z.object({
          label: z.string().optional(),
          bottle_large: z.string().optional(),
          large: z.string(),
        }),
      }),
      region: z.object({
        country: z.string(),
      }),
      vintages: z
        .array(
          z.object({
            year: z.string(),
            name: z.string(),
            seo_name: z.string(),
            statistics: z.object({
              // "status": "Normal",
              ratings_count: z.number(),
              ratings_average: z.number(),
              labels_count: z.number(),
              reviews_count: z.number(),
            }),
          })
        )
        .transform((arr) =>
          arr.sort((a, b) => Number(b.year) - Number(a.year)).slice(0, 5)
        ),
    })
  ),
});

interface SearchParams {
  query: string;
  hitsPerPage?: number;
  filters?: string;
  attributesToRetrieve?: Array<"name">;
}

export async function searchVivinoWinesFromQuery({ query }: { query: string }) {
  const url =
    "https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.14.2)%3B%20Browser";

  // Default values for optional parameters
  const defaultParams: SearchParams = {
    hitsPerPage: 3,
    filters: "region.country:pt",
    query,
  };

  const response = await fetch(url, {
    headers: {
      accept: "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,pt;q=0.7",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "x-algolia-api-key": "60c11b2f1068885161d95ca068d3a6ae",
      "x-algolia-application-id": "9TAKGWJUXL",
    },
    referrer: "https://www.vivino.com/",
    referrerPolicy: "origin-when-cross-origin",
    body: JSON.stringify(defaultParams),
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });

  try {
    const result = await response.json();
    const parsedResult = resSchema.parse(result);
    // const parsedResult = JSON.stringify(result, null, 2);

    // await Bun.write(
    //   `results_${searchParams.attributesToRetrieve ?? "all"}.json`,
    //   JSON.stringify(parsedResult, null, 2)
    // );
    return parsedResult;
  } catch (error) {
    console.error("Error performing search:", error.message);
    throw error;
  }
}

// Example Usage
// const searchExample = async () => {
//   try {
//     // Basic search
//     // await searchWines({
//     //   query: 'vintage port',
//     // });

//     // Advanced search with filters
//     await searchVivinoWinesFromQuery({
//       // query: ' Dona ERMELINDA (Palmela) 2021',
//       query: "touriga",
//       hitsPerPage: 3,
//       // attributesToRetrieve: ['name'],
//       filters: "region.country:pt",
//       // filters: `name.:"Monte Velho Tinto"`,
//     });
//   } catch (error) {
//     console.error("Search failed:", error);
//   }
// };

// searchExample();

const processUserUploadedImage = async (request: Request) => {
  const schema = z.object({
    // base64 encoded image
    image: z.string().min(1),
  });

  const { image } = schema.parse(await request.json());

  const imageBuffer = Buffer.from(image, "base64");
};
