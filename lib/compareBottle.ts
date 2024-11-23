import { Anthropic } from "@anthropic-ai/sdk";

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.API_KEY,
});

async function sendImagesToClaude(
  originalImage: VivinoImgMeta,
  potentialImages: VivinoImgMeta[]
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
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: `image/${fileExtension}`,
                data: originalImage.base64,
              },
            },
            {
              type: "text",
              text:
                `Below are potential images to compare. Their file names are:\n\n` +
                potentialImagesAfterMap
                  .map(({ fileName }, index) => `${index + 1}. ${fileName}`)
                  .join("\n") +
                `\n\nFor each potential image, return JSON in the following format:\n` +
                `{\n` +
                `  "name": "name of the wine (extracted from the label)",\n` +
                `  "fileName": "fileName of the image",\n` +
                `  "isPresent": true/false // Whether the wine is in the original image\n` +
                `}\n` +
                `Respond strictly in JSON format without explanations or extra text.`,
            },
            ...potentialImages.map(({ base64, fileExtension }) => ({
              type: "image",
              source: {
                type: "base64",
                media_type: `image/${fileExtension}`,
                data: base64,
              },
            })),
          ],
        },
      ],
    });

    // Parse and return response
    return JSON.parse(msg.content[0].text);
  } catch (error) {
    console.error("Error during image comparison:", error);
    throw error;
  }
}

export type VivinoImgMeta = {
  name: string;
  base64: string;
  fileExtension: "jpeg" | "png";
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
  // Use the sendImagesToClaude function
  return await sendImagesToClaude(originalImage, otherImages);
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
