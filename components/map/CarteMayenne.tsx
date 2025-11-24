"use client";

import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import { Feature, Geometry, Polygon } from "geojson";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png?url";
import shadowUrl from "leaflet/dist/images/marker-shadow.png?url";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ borderData }: { borderData: Feature<Polygon> | null }) {
  const map = useMap();

  useEffect(() => {
    if (!borderData) return;

    const geoJsonLayer = L.geoJSON(borderData);
    const bounds = geoJsonLayer.getBounds();


    map.fitBounds(bounds, { padding: [20, 20] });

    const paddedBounds = bounds.pad(0.1); 
    map.setMaxBounds(paddedBounds);

    const optimalZoom = map.getBoundsZoom(bounds);
    
    map.setMinZoom(optimalZoom);

  }, [borderData, map]);

  return null;
}
export default function CarteMayenne() {
  const [mayenneBorder, setMayenneBorder] = useState<Feature<Polygon> | null>(null);
  const [worldMask, setWorldMask] = useState<Feature | null>(null);

  useEffect(() => {
    fetch("/data/mayenne.geojson")
      .then((res) => res.json())
      .then((data: Feature<Polygon>) => {
        setMayenneBorder(data);
        const mask = createInvertedMask(data);
        setWorldMask(mask);
      })
      .catch((err) => console.error("Erreur GeoJSON:", err));
  }, []);

  const maskStyle = {
    color: "transparent",
    weight: 0,
    fillColor: "#000000",
    fillOpacity: 0.4,
  };

  const borderStyle = {
    color: "#ffc300",
    weight: 3,
    fillColor: "transparent",
    fillOpacity: 0,
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MapContainer
        center={[48.07, -0.77]}
        zoom={9}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", background: "#f0f0f0" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[48.0706, -0.7733]}>
          <Popup>
            <strong>Laval</strong><br />Préfecture
          </Popup>
        </Marker>

        {worldMask && <GeoJSON data={worldMask} style={maskStyle} />}
        {mayenneBorder && <GeoJSON data={mayenneBorder} style={borderStyle} />}
        
        <MapController borderData={mayenneBorder} />
        
      </MapContainer>
    </div>
  );
}

function createInvertedMask(originalFeature: Feature<Polygon>): Feature | null {
  const worldCoords = [
    [-180, 90],
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90]
  ];

  const coordinates = originalFeature.geometry.coordinates;
  
  if (!coordinates || coordinates.length === 0) return null;

  const mayenneRing = coordinates[0];

  const maskGeometry: Geometry = {
    type: "Polygon",
    coordinates: [worldCoords, mayenneRing],
  };

  return { type: "Feature", properties: {}, geometry: maskGeometry };
}