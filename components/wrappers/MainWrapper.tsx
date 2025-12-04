"use client";

import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";

const authRoutes = ["/login", "/forgot-password", "/reset-password"];

export default function MainWrapper({
    children,
    className = "",
}: Readonly<{
    children: React.ReactNode;
    className?: string;
}>) {
    const pathname = usePathname();
    const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));

    return (
        <div className={`flex h-dvh flex-col ${className}`.trim()}>
            <main className="flex flex-1 flex-col gap-2 overflow-auto">
                {children}
            </main>
            {!isAuthPage && <BottomNavigation />}
        </div>
    );
}
