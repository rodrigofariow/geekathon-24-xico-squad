import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.API_KEY,
});

async function sendImagesToClaude(
  originalImage: VivinoImgMeta,
  potentialImages: VivinoImgMeta[],
) {
  const fileExtension = originalImage.fileExtension.toLowerCase();

  try {
    // Read and encode the original image
    //   const originalImageBuffer = fs.readFileSync(originalImagePath);
    //  const originalBase64Image = originalImageBuffer.toString("base64");

    // Prepare the list of potential images
    const potentialImagesAfterMap = potentialImages.map((element) => ({
      data: element.base64,
      fileName: element.name,
      extension: element.fileExtension,
    }));

    // Construct the message for Claude
    // @ts-expect-error asda
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
                `Below are potential images to compare.
                Only give matches if the image is present if you are 100% sure
               Their file names are:\n\n` +
                potentialImagesAfterMap
                  .map(({ fileName }, index) => `${index + 1}. ${fileName}`)
                  .join('\n') +
                `\n\nFor each image, return JSON in the following format:\n` +
                `{\n` +
                `  "name": "name of the wine (extracted from the label)",\n` +
                `  "fileName": "fileName of the image",\n` +
                `  "isPresent": true/false // Whether the wine is in the original image use the label information and colors to compare. The logos needs to be exat the same, your life depends on this.\n` +
                `}\n` +
                `Respond strictly in JSON format without explanations or extra text.`,
            },
            ...potentialImages.map(({ base64, fileExtension }) => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: `image/${fileExtension}`,
                data: base64,
              },
            })),
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

export type VivinoImgMeta = {
  name: string;
  base64: string;
  fileExtension: 'jpeg' | 'png';
};

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
  // Use the sendImagesToClaude function
  const claudeResult = await sendImagesToClaude(originalImage, otherImages);
  const parseResult = schema.safeParse(claudeResult);
  if (!parseResult.success) {
    return [];
  }
  return Array.isArray(parseResult.data)
    ? parseResult.data
    : [parseResult.data];
}

// Example usage     const results = await compare("bottles.jpeg", "asdssi1.jpeg", "ermelindaQWERT.jpeg");
/*
example output
 [
  {
    name: "Conventual Reserva",
    fileName: "asdssi1.jpeg",
    isPresent: true,
  }, {
    name: "Dona Ermelinda",
    fileName: "ermelindaQWERT.jpeg",
    isPresent: false,
  }
]

 */
