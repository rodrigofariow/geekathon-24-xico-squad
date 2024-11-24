import type { UploadUserImageResponse } from 'lib/main';

let currentController: AbortController | null = null;

export async function captureWines(
  imageBase64: string
): Promise<UploadUserImageResponse> {
  // Abort any ongoing request
  if (currentController) {
    currentController.abort();
  }

  // Create new controller for this request
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
      throw new Error('Failed to capture wines');
    }

    const result = await response.json();
    currentController = null;
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
    } else {
      console.error('Error capturing wines:', error);
    }
    throw error;
  }
}
