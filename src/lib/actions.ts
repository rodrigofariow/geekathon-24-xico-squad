export async function captureWines(imageData: FormData) {
  try {
    const response = await fetch('/api/wines/capture', {
      method: 'POST',
      body: imageData,
    });

    if (!response.ok) {
      throw new Error('Failed to capture wines');
    }

    return await response.json();
  } catch (error) {
    console.error('Error capturing wines:', error);
    throw error;
  }
}
