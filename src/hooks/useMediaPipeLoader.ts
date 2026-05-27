import { useState, useEffect } from 'react';

// Simple lightweight hook to asynchronously download MediaPipe CDN resources
export function useMediaPipeLoader() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadScript = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Prevent duplicate loads
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = (err) => reject(new Error(`Failed to load script: ${url}`));
        document.body.appendChild(script);
      });
    };

    const init = async () => {
      try {
        // MediaPipe requires camera utils first, then hands SDK
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        
        if (active) {
          // Double check if globals are loaded successfully
          if ((window as any).Hands && (window as any).Camera) {
            setLoaded(true);
          } else {
            throw new Error('MediaPipe script tags loaded but globals not defined');
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Error loading hand tracking SDK');
        }
      }
    };

    init();

    return () => {
      active = false;
    };
  }, []);

  return { loaded, error };
}
