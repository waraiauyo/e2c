"use client";

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
    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar avec filtres */}
            <aside className="w-80 border-r bg-muted/10">
                <MapSidebar />
            </aside>

            {/* Map area */}
            <main className="flex-1 overflow-hidden">
                <DynamicMapMayenne />
            </main>
        </div>
    );
}
