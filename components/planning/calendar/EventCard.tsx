"use client";

import { formatTime, formatTimeRange } from "@/lib/planning/utils/dateUtils";
import {
    getEventColorBgLightClass,
    getEventColorBorderClass,
    getEventColorTextClass,
} from "@/lib/planning/utils/eventUtils";
import type { Event, TargetRole } from "@/lib/planning/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/planning/types";
import { Badge } from "@/components/shadcn/badge";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { MapPin, Clock, Users } from "lucide-react";

interface EventCardProps {
    event: Event;
    onClick?: () => void;
    className?: string;
    compact?: boolean; // Mode compact pour affichage dans grille horaire
}

export function EventCard({
    event,
    onClick,
    className = "",
    compact = false,
}: EventCardProps) {
    const bgClass = getEventColorBgLightClass(event);
    const borderClass = getEventColorBorderClass(event);
    const textClass = getEventColorTextClass(event);

    // Badge de statut
    const statusBadge = () => {
        if (event.status === "pending") {
            return (
                <Badge
                    variant="secondary"
                    className="text-xs bg-yellow-100 text-yellow-900 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100"
                >
                    En attente
                </Badge>
            );
        }
        if (event.status === "cancelled") {
            return (
                <Badge variant="destructive" className="text-xs">
                    Annulé
                </Badge>
            );
        }
        return null;
    };

    // Badges des rôles cibles
    const roleBadges = (size: "sm" | "default" = "default") => (
        <div className={`flex flex-wrap gap-1 ${size === "sm" ? "gap-0.5" : ""}`}>
            {event.target_roles.map((role) => (
                <span
                    key={role}
                    className={`inline-flex items-center rounded-full font-medium ${
                        size === "sm"
                            ? "px-1.5 py-0.5 text-[10px]"
                            : "px-2 py-0.5 text-xs"
                    }`}
                    style={{
                        backgroundColor: `${ROLE_COLORS[role]}20`,
                        color: ROLE_COLORS[role],
                        border: `1px solid ${ROLE_COLORS[role]}40`,
                    }}
                >
                    {ROLE_LABELS[role]}
                </span>
            ))}
        </div>
    );

    // Mode compact (pour grille horaire)
    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            onClick={onClick}
                            className={`
                                ${bgClass} ${borderClass} ${textClass}
                                border-l-4 p-2 rounded cursor-pointer
                                hover:shadow-md transition-shadow
                                overflow-hidden
                                ${className}
                            `}
                        >
                            <div className="flex items-start justify-between gap-1">
                                <p className="font-medium text-xs truncate flex-1">
                                    {event.title}
                                </p>
                                {statusBadge()}
                            </div>
                            {!event.all_day && (
                                <p className="text-xs opacity-75 mt-1">
                                    {formatTime(event.start_time)}
                                </p>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                            <p className="font-semibold">{event.title}</p>
                            {roleBadges("sm")}
                            {event.description && (
                                <p className="text-sm text-muted-foreground">
                                    {event.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-3 w-3" />
                                {event.all_day ? (
                                    <span>Toute la journée</span>
                                ) : (
                                    <span>
                                        {formatTimeRange(
                                            event.start_time,
                                            event.end_time
                                        )}
                                    </span>
                                )}
                            </div>
                            {event.location && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-3 w-3" />
                                    <span>{event.location}</span>
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Mode normal (pour liste)
    return (
        <div
            onClick={onClick}
            className={`
                ${bgClass} ${borderClass}
                border-l-4 p-4 rounded-lg cursor-pointer
                hover:shadow-lg transition-all
                ${className}
            `}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h3
                            className={`font-semibold text-base truncate ${textClass}`}
                        >
                            {event.title}
                        </h3>
                        {statusBadge()}
                    </div>

                    {/* Badges des rôles */}
                    <div className="mb-3">
                        {roleBadges()}
                    </div>

                    {event.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {event.description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 opacity-70" />
                            {event.all_day ? (
                                <span>Toute la journée</span>
                            ) : (
                                <span>
                                    {formatTimeRange(
                                        event.start_time,
                                        event.end_time
                                    )}
                                </span>
                            )}
                        </div>

                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 opacity-70" />
                                <span className="truncate">
                                    {event.location}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Avatar group pour participants (placeholder pour l'instant) */}
                <div className="flex items-center gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 opacity-70" />
                                    <span className="text-xs">0</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm">Aucun participant</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}
