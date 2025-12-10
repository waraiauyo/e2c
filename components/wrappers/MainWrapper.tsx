"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchCurrentUser } from "@/lib/redux/features/userSlice";

const authRoutes = ["/login", "/forgot-password", "/reset-password"];

export default function MainWrapper({
    children,
    className = "",
}: Readonly<{
    children: React.ReactNode;
    className?: string;
}>) {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.user);
    const hasLoadedUser = useRef(false);
    const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));

    // Charger l'utilisateur une seule fois au démarrage
    useEffect(() => {
        if (!isAuthPage && !hasLoadedUser.current && !user) {
            dispatch(fetchCurrentUser());
            hasLoadedUser.current = true;
        }
    }, [dispatch, isAuthPage, user]);

    return (
        <div className={`flex h-dvh flex-col ${className}`.trim()}>
            <main className="flex flex-1 flex-col gap-2 overflow-auto">
                {children}
            </main>
            {!isAuthPage && <BottomNavigation />}
        </div>
    );
}
