import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { ImageBlockParam } from '@anthropic-ai/sdk/src/resources/messages';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.API_KEY,
});

// Type definitions
type Wine = {
  name: string;
  type: 'red' | 'white' | null;
  year: string;
  price: string;
};

export type VivinoImgMeta = {
  name: string;
  base64: string;
  fileExtension: 'jpeg' | 'png';
};

export type SonnetResponseWithGuesses = Array<Wine>;

// Functions
async function sendImageToClaude(
  base64File: string,
  formatType: 'jpeg' | 'png',
) {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: `image/${formatType}`,
                data: base64File,
              },
            },
            {
              type: 'text',
              text:
                'Give me all the wines in there, in the following format:\n' +
                'If there is some information that is not able to correctly see it, do not add it.\n' +
                'The response must be only JSON format or else, you die. Json format must be:\n' +
                '\n' +
                'name: The name of the wine.\n' +
                "type: Specify if the wine is red, white, or green.Only specify is it's written on the label. Possible options: red or white, null if not available\n" +
                'year: The year of the wine, or null if not available.\n' +
                'price: The price of the wine, or null if not available.' +
                'Example: [\n' +
                '  {\n' +
                '    "name": "Comenda Grande",\n' +
                '    "type": "red",\n' +
                '    "year": "2021",\n' +
                '    "price": "11.49"\n' +
                '  },\n' +
                '  {\n' +
                '    "name": "Conventual Reserva",\n' +
                '    "type": "null",\n' +
                '    "year": "2020",\n' +
                '    "price": "11.99"\n' +
                '  }\n' +
                ']',
            },
          ],
        },
      ],
    });
    const result = JSON.parse((msg.content[0] as any).text);
    return result.wines == undefined ? result : result.wines;
  } catch (error) {
    console.error('Error sending image to Claude:', error);
    throw error;
  }
}

export async function getAllBottlesFromImage(originalImage: VivinoImgMeta) {
  try {
    const allowedTypes = ['jpeg', 'png'];

    if (
      !originalImage.fileExtension ||
      !allowedTypes.includes(originalImage.fileExtension)
    ) {
      throw new Error(
        `Invalid file type. Only ${allowedTypes.join(', ')} files are allowed.`,
      );
    }

    return await sendImageToClaude(
      originalImage.base64,
      originalImage.fileExtension,
    );
  } catch (error) {
    console.error('Failed to process image:', error);
  }
}

async function sendImagesToClaude(
  originalImage: VivinoImgMeta,
  potentialImages: VivinoImgMeta[],
) {
  const fileExtension = originalImage.fileExtension.toLowerCase() as
    | 'jpeg'
    | 'png';

  try {
    const potentialImagesAfterMap = potentialImages.map((element) => ({
      data: element.base64 as string,
      fileName: element.name as string,
      extension: element.fileExtension as 'jpeg' | 'png',
    }));

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: `image/${fileExtension}`,
                data: originalImage.base64,
              },
            },
            {
              type: 'text',
              text:
                `Below are potential images to compare.\n` +
                `Only give matches if the image is present if you are 100% sure.\n` +
                `Their file names are:\n\n` +
                potentialImagesAfterMap
                  .map(({ fileName }, index) => `${index + 1}. ${fileName}`)
                  .join('\n') +
                `\n\nFor each image, return JSON in the following format:\n` +
                `{\n` +
                `  "name": "name of the wine (extracted from the label)",\n` +
                `  "fileName": "fileName of the image",\n` +
                `  "isPresent": true/false\n` +
                `}\n` +
                `Respond strictly in JSON format without explanations or extra text.`,
            },
            ...potentialImages.map(
              ({ base64, fileExtension }) =>
                ({
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: `image/${fileExtension}`,
                    data: base64,
                  },
                }) satisfies ImageBlockParam,
            ),
          ],
        },
      ],
    });
    const result = JSON.parse((msg.content[0] as any).text);
    return result.wines == undefined ? result : result.wines;
  } catch (error) {
    console.error('Error during image comparison:', error);
    throw error;
  }
}

export async function getOtherImagesPresenceInOriginalImage({
  originalImage,
  otherImages,
}: {
  originalImage: VivinoImgMeta;
  otherImages: VivinoImgMeta[];
}): Promise<
  Array<{
    name: string;
    fileName: string;
    isPresent: boolean;
  }>
> {
  const singleResultSchema = z.object({
    name: z.string(),
    fileName: z.string(),
    isPresent: z.boolean(),
  });
  const schema = z.array(singleResultSchema).or(singleResultSchema);

  const claudeResult = await sendImagesToClaude(originalImage, otherImages);
  const parseResult = schema.safeParse(claudeResult);

  if (!parseResult.success) {
    return [];
  }
  return Array.isArray(parseResult.data)
    ? parseResult.data
    : [parseResult.data];
}
