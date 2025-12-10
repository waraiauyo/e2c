import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { Feature, Polygon } from "geojson";
import { MAP_CONFIG } from "@/lib/constants";

export function MapController({ borderData }: { borderData: Feature<Polygon> | null }) {
  const map = useMap();

  useEffect(() => {
    if (!borderData) return;

    const geoJsonLayer = L.geoJSON(borderData);
    const bounds = geoJsonLayer.getBounds();

    map.fitBounds(bounds, { padding: MAP_CONFIG.FIT_PADDING });
    map.setMaxBounds(bounds.pad(MAP_CONFIG.PADDING));
    map.setMinZoom(map.getBoundsZoom(bounds) + MAP_CONFIG.MIN_ZOOM_OFFSET);
  }, [borderData, map]);

  return null;
}