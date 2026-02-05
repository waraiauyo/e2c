"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapSidebar } from "@/components/map/MapSidebar";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";
import { Button } from "@/components/shadcn/button";
import { Menu, X } from "lucide-react";

const DynamicMapMayenne = dynamic(() => import("@/components/map/MapMayenne"), {
    ssr: false,
    loading: () => <LoadingSpinner size="lg" />,
});

export default function MapPage() {
    const [flyToPosition, setFlyToPosition] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    // État pour gérer l'affichage de la sidebar sur mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleClasSelect = useCallback(
        (_clasId: string, lat: number, lng: number) => {
            setFlyToPosition({ lat, lng });
            // Ferme le menu mobile pour afficher la carte après sélection
            setIsMobileMenuOpen(false);
        },
        []
    );

    const handleFlyComplete = useCallback(() => {
        setFlyToPosition(null);
    }, []);

    return (
        <div className="flex h-full overflow-hidden relative">
            {/* BOUTON TOGGLE (Burger / Croix) */}
            {/* Positionné en absolu par-dessus tout (z-index très élevé) */}
            <div className="md:hidden absolute top-4 right-4 z-[2000]">
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-white shadow-md border-gray-200 text-[#005E84]"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* SIDEBAR MOBILE (OVERLAY) */}
            {/* S'affiche par-dessus la carte uniquement si activé */}
            {/* z-[1500] pour être sûr de passer au-dessus des contrôles de la carte Leaflet (z-1000) */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute inset-0 z-[1500] bg-white">
                    <MapSidebar onClasSelect={handleClasSelect} />
                </div>
            )}

            {/* SIDEBAR DESKTOP (inchangée) */}
            <aside className="hidden md:block w-80 border-r bg-muted/10 shrink-0">
                <MapSidebar onClasSelect={handleClasSelect} />
            </aside>

            {/* CARTE */}
            <main className="flex-1 overflow-hidden relative">
                <DynamicMapMayenne
                    flyToPosition={flyToPosition}
                    onFlyComplete={handleFlyComplete}
                />
            </main>
        </div>
    );
}
