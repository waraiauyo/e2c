"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapSidebar } from "@/components/map/MapSidebar";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";

const DynamicMapMayenne = dynamic(
    () => import("@/components/map/MapMayenne"),
    {
        ssr: false,
        loading: () => <LoadingSpinner size="lg" />,
    }
);

export default function MapPage() {
    const [flyToPosition, setFlyToPosition] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    const handleClasSelect = useCallback(
        (_clasId: string, lat: number, lng: number) => {
            setFlyToPosition({ lat, lng });
        },
        []
    );

    const handleFlyComplete = useCallback(() => {
        setFlyToPosition(null);
    }, []);

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar avec filtres */}
            <aside className="w-80 border-r bg-muted/10">
                <MapSidebar onClasSelect={handleClasSelect} />
            </aside>

            {/* Map area */}
            <main className="flex-1 overflow-hidden">
                <DynamicMapMayenne
                    flyToPosition={flyToPosition}
                    onFlyComplete={handleFlyComplete}
                />
            </main>
        </div>
    );
}
