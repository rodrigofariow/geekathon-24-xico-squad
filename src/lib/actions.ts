export async function captureWines(imageBase64: string): Promise<{
  vivinoImgUrls: string[];
}> {
  try {
    const response = await fetch("/api/wines/capture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error capturing wines:", error);
    throw error;
  }
}
