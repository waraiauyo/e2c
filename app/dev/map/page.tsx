"use client"; // Nécessaire car DynamicCarteMayenne est client-side interactif

import dynamic from "next/dynamic";
import Sidebar from "@/components/map/Sidebar"; // Import du nouveau composant

// Import dynamique de la carte (SSR false est crucial pour Leaflet)
const DynamicCarteMayenne = dynamic(
  () => import("@/components/map/CarteMayenne"),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <p>Chargement de la carte...</p>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    // LE CONTENEUR FLEXBOX PRINCIPAL
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      
      {/* ZONE GAUCHE : 25% */}
      <div style={{ width: "25%", height: "100%" }}>
        <Sidebar />
      </div>

      {/* ZONE DROITE : 75% */}
      <div style={{ width: "75%", height: "100%", position: "relative" }}>
        <DynamicCarteMayenne />
      </div>
      
    </div>
  );
}