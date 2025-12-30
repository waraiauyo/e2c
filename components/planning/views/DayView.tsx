"use client";

import { useMemo } from "react";
import {
    format,
    startOfDay,
    endOfDay,
    isWithinInterval,
    isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Clock } from "lucide-react";
import type { Event, TargetRole } from "@/lib/planning/types";
import { getEventColor, ROLE_LABELS, ROLE_COLORS } from "@/lib/planning/types";
import { cn } from "@/lib/utils";

interface DayViewProps {
    currentDate: Date;
    events: Event[];
    onEventClick: (event: Event) => void;
    onTimeSlotClick: (date: Date, hour: number) => void;
}

export function DayView({
    currentDate,
    events,
    onEventClick,
    onTimeSlotClick,
}: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Filtrer les événements du jour sélectionné
    const dayEvents = useMemo(() => {
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);

        return events.filter((event) => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);

            // Inclure si l'événement intersecte avec le jour
            return (
                isWithinInterval(eventStart, {
                    start: dayStart,
                    end: dayEnd,
                }) ||
                isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
                (eventStart <= dayStart && eventEnd >= dayEnd)
            );
        });
    }, [events, currentDate]);

    // Calculer la position et la taille d'un événement
    const getEventStyle = (event: Event) => {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);

        // Limiter l'événement au jour affiché
        const displayStart = eventStart < dayStart ? dayStart : eventStart;
        const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

        // Calculer la position en pourcentage (0-100% sur 24h)
        const startMinutes =
            displayStart.getHours() * 60 + displayStart.getMinutes();
        const endMinutes = displayEnd.getHours() * 60 + displayEnd.getMinutes();

        const top = (startMinutes / (24 * 60)) * 100;
        const height = ((endMinutes - startMinutes) / (24 * 60)) * 100;

        return {
            top: `${top}%`,
            height: `${Math.max(height, 2)}%`, // Minimum 2% pour la visibilité
        };
    };

    // Formater l'heure de l'événement
    const formatEventTime = (event: Event) => {
        if (event.all_day) return "Toute la journée";

        const start = new Date(event.start_time);
        const end = new Date(event.end_time);

        // Si multi-jours, afficher uniquement l'heure pour ce jour
        const isSameStart = isSameDay(start, currentDate);
        const isSameEnd = isSameDay(end, currentDate);

        if (isSameStart && isSameEnd) {
            return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        } else if (isSameStart) {
            return `Depuis ${format(start, "HH:mm")}`;
        } else if (isSameEnd) {
            return `Jusqu'à ${format(end, "HH:mm")}`;
        } else {
            return "Toute la journée";
        }
    };

    // Badge de statut
    const getStatusColor = (status: Event["status"]) => {
        switch (status) {
            case "confirmed":
                return "bg-green-500/10 text-green-700 dark:text-green-400";
            case "pending":
                return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
            case "cancelled":
                return "bg-red-500/10 text-red-700 dark:text-red-400";
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header avec la date */}
            <div className="border-b bg-background sticky top-0 z-10 p-4">
                <h2 className="text-xl font-semibold">
                    {format(currentDate, "EEEE d MMMM yyyy", { locale: fr })}
                </h2>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto">
                <div className="relative min-h-[1440px]">
                    {/* Grille horaire */}
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="absolute w-full border-b border-border/50"
                            style={{
                                top: `${(hour / 24) * 100}%`,
                                height: `${100 / 24}%`,
                            }}
                        >
                            <div className="flex h-full">
                                {/* Colonne heure */}
                                <div className="w-20 flex-shrink-0 p-2 text-right">
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {hour.toString().padStart(2, "0")}:00
                                    </span>
                                </div>

                                {/* Zone cliquable pour créer un événement */}
                                <div
                                    className="flex-1 hover:bg-accent/30 cursor-pointer transition-colors border-l border-border/50"
                                    onClick={() =>
                                        onTimeSlotClick(currentDate, hour)
                                    }
                                />
                            </div>
                        </div>
                    ))}

                    {/* Événements */}
                    <div className="absolute inset-0 left-20 pointer-events-none">
                        <div className="relative h-full pl-4 pr-4">
                            {dayEvents.map((event) => {
                                const style = getEventStyle(event);
                                return (
                                    <div
                                        key={event.id}
                                        className="absolute left-4 right-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer pointer-events-auto overflow-hidden"
                                        style={{
                                            ...style,
                                            borderLeftColor: getEventColor(event.target_roles),
                                            backgroundColor: `${getEventColor(event.target_roles)}15`,
                                        }}
                                        onClick={() => onEventClick(event)}
                                    >
                                        <div className="h-full p-2 bg-card/95 backdrop-blur-sm">
                                            {/* Titre */}
                                            <div className="font-medium text-sm line-clamp-1 mb-1">
                                                {event.title}
                                            </div>

                                            {/* Badges des rôles (compact) */}
                                            <div className="flex flex-wrap gap-0.5 mb-1">
                                                {event.target_roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium"
                                                        style={{
                                                            backgroundColor: `${ROLE_COLORS[role]}25`,
                                                            color: ROLE_COLORS[role],
                                                        }}
                                                    >
                                                        {ROLE_LABELS[role]}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Heure */}
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {formatEventTime(event)}
                                                </span>
                                            </div>

                                            {/* Statut */}
                                            {event.status !== "confirmed" && (
                                                <div
                                                    className={cn(
                                                        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                                                        getStatusColor(
                                                            event.status
                                                        )
                                                    )}
                                                >
                                                    {event.status === "pending"
                                                        ? "En attente"
                                                        : "Annulé"}
                                                </div>
                                            )}

                                            {/* Description (si espace disponible) */}
                                            {event.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Ligne actuelle (heure actuelle si c'est aujourd'hui) */}
                    {isSameDay(currentDate, new Date()) && (
                        <div
                            className="absolute left-0 right-0 z-20 pointer-events-none"
                            style={{
                                top: `${((new Date().getHours() * 60 + new Date().getMinutes()) / (24 * 60)) * 100}%`,
                            }}
                        >
                            <div className="flex items-center">
                                <div className="w-20 flex-shrink-0 pr-2 text-right">
                                    <div className="inline-flex items-center justify-center w-12 h-5 bg-red-500 text-white text-xs font-medium rounded">
                                        {format(new Date(), "HH:mm")}
                                    </div>
                                </div>
                                <div className="flex-1 h-0.5 bg-red-500" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
