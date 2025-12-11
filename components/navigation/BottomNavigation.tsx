"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Calendar, FolderOpen, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/shadcn/avatar";
import { useAppSelector } from "@/lib/redux/hooks";

const navItems = [
    {
        href: "/maps",
        label: "Maps",
        icon: Map,
    },
    {
        href: "/planning",
        label: "Planning",
        icon: Calendar,
    },
    {
        href: "/resources",
        label: "Ressources",
        icon: FolderOpen,
    },
    {
        href: "/community",
        label: "Communauté",
        icon: Users,
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
        <nav className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-around px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                                active
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5",
                                    active && "fill-primary/20"
                                )}
                            />
                            <span className="text-xs font-medium">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                <Link
                    href="/profile"
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                        isActive("/profile")
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Avatar className="h-6 w-6">
                        <AvatarImage
                            src={profile?.avatar_url || undefined}
                            alt="Avatar"
                        />
                        <AvatarFallback className="text-[10px]">
                            {profile ? (
                                getInitials()
                            ) : (
                                <User className="h-4 w-4" />
                            )}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">Profil</span>
                </Link>
            </div>
        </nav>
    );
}
