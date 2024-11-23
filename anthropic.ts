import { Anthropic } from '@anthropic-ai/sdk';
import * as fs from 'fs';

// Initialize the Anthropic client
const anthropic = new Anthropic({
    apiKey:process.env.API_KEY,
});

async function sendImageToClaude(imagePath: string) {
    try {
        // Read the image file and convert it to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Create the message with the image
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
                                media_type: "image/jpeg", // or "image/png" depending on your image
                                data: base64Image,
                            }
                        },
                        {
                            type: "text",
                            text: "Give me all the wines in there, in the following format:\n" +
                                "If there is some information that is not able to correctly see it, do not add it.\n" +
                                "The response must be only JSON format or else, you die. Json format must be:\n" +
                                "\n" +
                                "name: The name of the wine.\n" +
                                "type: Specify if the wine is red, white, or green.\n" +
                                "year: The year of the wine, or N/A if not available.\n" +
                                "price: The price of the wine, or N/A if not available." +
                                "Example: [\n" +
                                "  {\n" +
                                "  {\n" +
                                "    \"name\": \"Comenda Grande\",\n" +
                                "    \"name\": \"Comenda Grande\",\n" +
                                "    \"type\": \"red\",\n" +
                                "    \"type\": \"Tinto (Red)\",\n" +
                                "    \"year\": \"2021\",\n" +
                                "    \"year\": \"N/A\",\n" +
                                "    \"price\": \"11.49\"\n" +
                                "    \"price\": \"11.99\"\n" +
                                "  },\n" +
                                "  },\n" +
                                "  {\n" +
                                "  {\n" +
                                "    \"name\": \"Aproveitei\",\n" +
                                "    \"name\": \"Conventual Reserva\",\n" +
                                "    \"type\": \"red\",\n" +
                                "    \"type\": \"N/A\",\n" +
                                "    \"year\": \"2020\",\n" +
                                "    \"year\": \"N/A\",\n" +
                                "    \"price\": \"11.99\"\n" +
                                "    \"price\": \"11.99\"\n" +
                                "  },\n" +
                                "  },"
                        }
                    ]
                }
            ],
        });
        //   console.log('Claude\'s response:', JSON.parse(msg.content[0].text).wines);
        return JSON.parse(msg.content[0].text).wines;
    } catch (error) {
        console.error('Error sending image to Claude:', error);
        throw error;
    }
}

// Example usage
async function example(imageName: string) {
    try {
        return  await sendImageToClaude('./'+imageName+'.jpg');
    } catch (error) {
        console.error('Failed to process image:', error);
    }
}

// If you want to send an image from a URL instead
async function sendImageFromUrl(imageUrl: string) {
    try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

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
                                media_type: "image/jpeg", // adjust based on image type
                                data: base64Image,
                            }
                        },
                        {
                            type: "text",
                            text: "Give me all the wines in there, in the following format:\n" +
                                "If there is some information that is not able to correctly see it, do not add it.\n" +
                                "------\n" +
                                "\n" +
                                " - name \n" +
                                "\n" +
                                "- red/white/green \n" +
                                "\n" +
                                "- year or N/A if you cant find it \n" +
                                "\n" +
                                "- price or N/A if you cant find it\n" +
                                "------\n" +
                                "\n" +
                                " - name \n" +
                                "\n" +
                                "- red/white/green \n" +
                                "\n" +
                                "- year or N/A if you cant find it \n" +
                                "\n" +
                                "- price or N/A if you cant find it"
                        }
                    ]
                }
            ],
        });

        return msg;
    } catch (error) {
        console.error('Error sending image from URL:', error);
        throw error;
    }
}

console.log(await example("bottles"));