import { Anthropic } from '@anthropic-ai/sdk';
import type { VivinoImgMeta } from './compareBottle';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.API_KEY,
});

async function sendImageToClaude(
  base64File: string,
  formatType: 'jpeg' | 'png'
) {
  try {
    // Read the image file and convert it to base64
    //const imageBuffer = fs.readFileSync(base64File);
    //const base64Image = imageBuffer.toString("base64");

    // Create the message with the image
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
                '  {\n' +
                '    "name": "Comenda Grande",\n' +
                '    "name": "Comenda Grande",\n' +
                '    "type": "red",\n' +
                '    "type": "Tinto (Red)",\n' +
                '    "year": "2021",\n' +
                '    "year": "null",\n' +
                '    "price": "11.49"\n' +
                '    "price": "11.99"\n' +
                '  },\n' +
                '  },\n' +
                '  {\n' +
                '  {\n' +
                '    "name": "Aproveitei",\n' +
                '    "name": "Conventual Reserva",\n' +
                '    "type": "red",\n' +
                '    "type": "null",\n' +
                '    "year": "2020",\n' +
                '    "year": "N/A",\n' +
                '    "price": "11.99"\n' +
                '    "price": "11.99"\n' +
                '  },\n' +
                '  },',
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

// Example usage
export async function getAllBottlesFromImage(originalImage: VivinoImgMeta) {
  try {
    const allowedTypes = ['jpeg', 'png'];

    if (
      !originalImage.fileExtension ||
      !allowedTypes.includes(originalImage.fileExtension)
    ) {
      throw new Error(
        `Invalid file type. Only ${allowedTypes.join(', ')} files are allowed.`
      );
    }

    return await sendImageToClaude(
      originalImage.base64,
      originalImage.fileExtension
    );
  } catch (error) {
    console.error('Failed to process image:', error);
  }
}

type Wine = {
  name: string;
  type: 'red' | 'white' | null;
  year: string;
  price: string;
};

export type SonnetResponseWithGuesses = Array<Wine>;

/*
 export const exampleResponse: SonnetResponseWithGuesses = await getAllBottlesFromImage(originalImage);
console.log(exampleResponse);
*/
