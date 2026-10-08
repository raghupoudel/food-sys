export function computeDistanceKm(google, origin, destination) {
  return new Promise((resolve, reject) => {
    if (!google?.maps?.DistanceMatrixService) {
      reject(new Error("Google Maps Distance Matrix service unavailable."));
      return;
    }

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (
          status !== "OK" ||
          !response?.rows?.[0]?.elements?.[0]
        ) {
          reject(new Error("Unable to calculate delivery distance."));
          return;
        }

        const element = response.rows[0].elements[0];

        if (element.status !== "OK") {
          reject(new Error("Unable to calculate delivery distance."));
          return;
        }

        resolve(element.distance.value / 1000);
      }
    );
  });
}
