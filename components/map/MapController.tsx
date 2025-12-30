import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { Feature, Polygon } from "geojson";
import { MAP_CONFIG } from "@/lib/constants";

interface MapControllerProps {
    borderData: Feature<Polygon> | null;
    flyToPosition?: { lat: number; lng: number } | null;
    onFlyComplete?: () => void;
}

export function MapController({
    borderData,
    flyToPosition,
    onFlyComplete,
}: MapControllerProps) {
    const map = useMap();

    useEffect(() => {
        if (!borderData) return;

        const geoJsonLayer = L.geoJSON(borderData);
        const bounds = geoJsonLayer.getBounds();

        map.fitBounds(bounds, { padding: MAP_CONFIG.FIT_PADDING });
        map.setMaxBounds(bounds.pad(MAP_CONFIG.PADDING));
        map.setMinZoom(map.getBoundsZoom(bounds) + MAP_CONFIG.MIN_ZOOM_OFFSET);
    }, [borderData, map]);

    // Gérer le flyTo quand un CLAS est sélectionné
    useEffect(() => {
        if (!flyToPosition) return;

        map.flyTo([flyToPosition.lat, flyToPosition.lng], 14, {
            duration: 1,
        });

        // Appeler onFlyComplete après l'animation
        const timer = setTimeout(() => {
            onFlyComplete?.();
        }, 1000);

        return () => clearTimeout(timer);
    }, [flyToPosition, map, onFlyComplete]);

    return null;
}
