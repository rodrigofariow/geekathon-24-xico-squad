import { Anthropic } from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.API_KEY,
});

async function sendImagesToClaude(
  originalImage: VivinoImgMeta,
  potentialImages: VivinoImgMeta[]
) {
  const fileExtension = path.extname(originalImagePath).slice(1).toLowerCase();

  try {
    // Read and encode the original image
    const originalImageBuffer = fs.readFileSync(originalImagePath);
    const originalBase64Image = originalImageBuffer.toString("base64");

    // Prepare the list of potential images
    const potentialImages = potentialImagePaths.map((imagePath, index) => {
      const buffer = fs.readFileSync(imagePath);
      return {
        data: buffer.toString("base64"),
        fileName: potentialImages[index],
      };
    });

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
                data: originalBase64Image,
              },
            },
            {
              type: "text",
              text:
                `The original image is "${originalImageName}". Below are potential images to compare. Their file names are:\n\n` +
                potentialImages
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
            ...potentialImages.map(({ data }) => ({
              type: "image",
              source: {
                type: "base64",
                media_type: `image/${fileExtension}`,
                data,
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

export async function compare(
  originalImage: VivinoImgMeta,
  otherImages: VivinoImgMeta[]
) {
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
