import type { UploadUserImageResponse } from 'lib/main';

let currentController: AbortController | null = null;

export async function captureWines(
  imageBase64: string,
): Promise<UploadUserImageResponse> {
  // Abort any ongoing request
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();

  try {
    const response = await fetch('/api/wines/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
      signal: currentController.signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message);
    }

    const result = await response.json();
    currentController = null;
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
    } else {
      throw error;
    }
  }
}
