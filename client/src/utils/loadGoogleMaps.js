let googleMapsPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(
        new Error(
          "VITE_GOOGLE_MAPS_API_KEY is missing from client/.env"
        )
      );
      return;
    }

    const existingScript = document.querySelector(
      'script[data-google-maps="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) {
          resolve(window.google);
        } else {
          reject(new Error("Google Maps loaded but is unavailable."));
        }
      });

      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Google Maps."));
      });

      return;
    }

    const script = document.createElement("script");

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey
      )}&libraries=places`;

    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps loaded but is unavailable."));
      }
    };

    script.onerror = () => {
      reject(
        new Error(
          "Failed to load Google Maps. Check your API key, billing, API restrictions, and Maps JavaScript API."
        )
      );
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
