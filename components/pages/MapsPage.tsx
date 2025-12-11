"use client";

import dynamic from "next/dynamic";
import { MapsSidebar } from "@/components/map/MapsSidebar";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";

const DynamicCarteMayenne = dynamic(
    () => import("@/components/map/CarteMayenne"),
    {
        ssr: false,
        loading: () => <LoadingSpinner size="lg" />,
    }
);

export default function MapsPage() {
    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar avec filtres */}
            <aside className="w-80 border-r bg-muted/10">
                <MapsSidebar />
            </aside>

            {/* Map area */}
            <main className="flex-1 overflow-hidden">
                <DynamicCarteMayenne />
            </main>
        </div>
    );
}
