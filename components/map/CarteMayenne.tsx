"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchClasList } from "@/lib/redux/features/clas/actions";
import {
    selectClasForMap,
    selectClasStatus,
} from "@/lib/redux/features/clas/selectors";
import { useGeoData } from "@/lib/redux/hooks";
import { MAP_CONFIG, STYLES } from "@/lib/constants";
import { ClasMarker } from "./ClasMarker";
import { MapController } from "./MapController";

import iconUrl from "leaflet/dist/images/marker-icon.png?url";
import shadowUrl from "leaflet/dist/images/marker-shadow.png?url";

L.Marker.prototype.options.icon = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function CarteMayenne() {
    const dispatch = useAppDispatch();
    const mapMarkers = useAppSelector(selectClasForMap);
    const status = useAppSelector(selectClasStatus);

    const { border, mask } = useGeoData("/data/mayenne.geojson");

    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchClasList());
        }
    }, [status, dispatch]);

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={MAP_CONFIG.CENTER}
                zoom={MAP_CONFIG.DEFAULT_ZOOM}
                scrollWheelZoom
                className="w-full h-full absolute inset-0"
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mapMarkers.map((marker) => (
                    <ClasMarker
                        key={marker.id}
                        position={marker.position}
                        infos={marker.infos}
                    />
                ))}

                {mask && <GeoJSON data={mask} style={STYLES.MASK} />}
                {border && <GeoJSON data={border} style={STYLES.BORDER} />}

                <MapController borderData={border} />
            </MapContainer>
        </div>
    );
}
