"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchCurrentUser } from "@/lib/redux/features/userSlice";
import { isPublicRoute } from "@/lib/constants/routes";

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
    const isAuthPage = isPublicRoute(pathname);

    // Reset le ref quand on est sur une page d'auth (après logout)
    useEffect(() => {
        if (isAuthPage) {
            hasLoadedUser.current = false;
        }
    }, [isAuthPage]);

    // Charger l'utilisateur une seule fois au démarrage
    useEffect(() => {
        if (!isAuthPage && !hasLoadedUser.current && !user) {
            dispatch(fetchCurrentUser());
            hasLoadedUser.current = true;
        }
    }, [dispatch, isAuthPage, user]);

    return (
        <div className={`flex h-dvh flex-col ${className}`.trim()}>
            <main className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden">
                {children}
            </main>
            {!isAuthPage && <BottomNavigation />}
        </div>
    );
}
