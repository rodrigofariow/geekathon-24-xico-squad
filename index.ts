import { z } from "zod";

const resSchema = z.object({
  hits: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      image: z.object({
        location: z.string(),
        variations: z.object({
          label: z.string(),
          bottle_large: z.string(),
        }),
      }),
    })
  ),
});

type ResSchema = z.infer<typeof resSchema>;

interface SearchParams {
  query: string;
  hitsPerPage?: number;
  filters?: string;
  attributesToRetrieve?: Array<"name">;
}

async function searchWines(searchParams: SearchParams) {
  const url =
    "https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.14.2)%3B%20Browser";

  // Default values for optional parameters
  const defaultParams: SearchParams = {
    hitsPerPage: 6,
    filters: "",
    ...searchParams,
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

    await Bun.write(
      `results_${searchParams.attributesToRetrieve ?? "all"}.json`,
      JSON.stringify(parsedResult, null, 2)
    );
    return result;
  } catch (error) {
    console.error("Error performing search:", error.message);
    throw error;
  }
}

// Example Usage
const searchExample = async () => {
  try {
    // Basic search
    // await searchWines({
    //   query: 'vintage port',
    // });

    // Advanced search with filters
    await searchWines({
      // query: ' Dona ERMELINDA (Palmela) 2021',
      query: "ERMELINDA",
      hitsPerPage: 2,
      // attributesToRetrieve: ['name'],
      // filters: 'country:Portugal',
    });
  } catch (error) {
    console.error("Search failed:", error);
  }
};

searchExample();
