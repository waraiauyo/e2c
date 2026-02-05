export interface Coordinates {
    latitude: number;
    longitude: number;
}

export async function getCoordinatesFromAddress(
    address: string
): Promise<Coordinates | null> {
    try {
        // Utilisation de l'API Nominatim (OpenStreetMap)
        // C'est gratuit, mais nécessite un User-Agent pour respecter leurs conditions d'utilisation
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
                headers: {
                    "User-Agent": "E2C-App-Admin/1.0",
                },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
        }

        return null;
    } catch (error) {
        console.error("Erreur de géocoding:", error);
        return null;
    }
}
