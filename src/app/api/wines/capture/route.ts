import { uploadUserImage } from "lib/main";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    // The base64 string will be in the format "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    // We need to extract just the base64 data after the comma
    const base64Data = image.split(",")[1];

    // Get the file extension from the data URL and handle svg+xml case
    const mimeType = image.split(";")[0].split("/")[1];
    const fileExt = mimeType === "svg+xml" ? "svg" : mimeType;

    // Now you can use the uploadUserImage function
    const response = await uploadUserImage({
      img: {
        base64: base64Data,
        ext: fileExt,
      },
    });

    console.log("Captured wines:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Wine capture error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
