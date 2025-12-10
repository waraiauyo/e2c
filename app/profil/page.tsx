"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const ProfilePage = dynamic(
    () => import("@/components/pages/ProfilePage"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        ),
    }
);

export default function ProfilePageWrapper() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <ProfilePage />
        </Suspense>
    );
}
