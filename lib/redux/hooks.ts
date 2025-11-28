import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, AppStore, RootState } from "./store";
import { useState, useEffect } from "react";
import { Feature, Polygon, Geometry } from "geojson";

// Utilise ces hooks au lieu des hooks classiques de React Redux
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

const createInvertedMask = (original: Feature<Polygon>): Feature | null => {
  const worldCoords = [[-180, 90], [-180, -90], [180, -90], [180, 90], [-180, 90]];
  const coords = original.geometry.coordinates;
  if (!coords?.length) return null;
  
  const maskGeometry: Geometry = { type: "Polygon", coordinates: [worldCoords, coords[0]] };
  return { type: "Feature", properties: {}, geometry: maskGeometry };
};

export const useGeoData = (url: string) => {
  const [border, setBorder] = useState<Feature<Polygon> | null>(null);
  const [mask, setMask] = useState<Feature | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(url)
      .then((res) => res.json())
      .then((data: Feature<Polygon>) => {
        if (mounted) {
          setBorder(data);
          setMask(createInvertedMask(data));
        }
      })
      .catch((err) => console.error("GeoJSON Error:", err));
      
    return () => { mounted = false; };
  }, [url]);

  return { border, mask };
};