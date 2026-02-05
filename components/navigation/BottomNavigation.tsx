"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Calendar, FolderOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/shadcn/avatar";
import { useAppSelector } from "@/lib/redux/hooks";

const navItems = [
    {
        href: "/map",
        label: "Carte",
        icon: Map,
    },
    {
        href: "/planning",
        label: "Planning",
        icon: Calendar,
    },
    {
        href: "/drive",
        label: "Ressources",
        icon: FolderOpen,
    },
];

export default function BottomNavigation() {
    const pathname = usePathname();
    const { profile } = useAppSelector((state) => state.user);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    const getInitials = () => {
        if (!profile) return "?";
        const first = profile.first_name?.charAt(0) || "";
        const last = profile.last_name?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    };

    return (
        <nav className="shrink-0 border-t border-[#E2E8F0] bg-white pb-safe">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200 group",
                                active
                                    ? "text-[#005E84]" // Bleu primaire
                                    : "text-[#1E3231]/60 hover:text-[#005E84]" // Gris foncé -> Bleu
                            )}
                        >
                            {/* Indicateur actif (Ligne jaune au dessus) */}
                            {active && (
                                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#DEAA00] rounded-b-full" />
                            )}

                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-transform group-active:scale-95",
                                    active && "fill-[#005E84]/10 stroke-[2.5px]"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-semibold tracking-wide",
                                    active ? "text-[#005E84]" : ""
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                <Link
                    href="/profile"
                    className={cn(
                        "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200 group",
                        isActive("/profile")
                            ? "text-[#005E84]"
                            : "text-[#1E3231]/60 hover:text-[#005E84]"
                    )}
                >
                    {isActive("/profile") && (
                        <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#DEAA00] rounded-b-full" />
                    )}

                    <Avatar
                        className={cn(
                            "h-6 w-6 border-2 transition-colors",
                            isActive("/profile")
                                ? "border-[#005E84]"
                                : "border-transparent"
                        )}
                    >
                        <AvatarImage
                            src={profile?.avatar_url || undefined}
                            alt="Avatar"
                        />
                        <AvatarFallback className="text-[10px] bg-[#F4F4F4] text-[#005E84] font-bold">
                            {profile ? (
                                getInitials()
                            ) : (
                                <User className="h-3 w-3" />
                            )}
                        </AvatarFallback>
                    </Avatar>
                    <span
                        className={cn(
                            "text-[10px] font-semibold tracking-wide",
                            isActive("/profile") ? "text-[#005E84]" : ""
                        )}
                    >
                        Profil
                    </span>
                </Link>
            </div>
        </nav>
    );
}
