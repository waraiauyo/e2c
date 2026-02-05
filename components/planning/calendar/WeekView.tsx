"use client";

import { useMemo, useState, useEffect } from "react";
import { EventCard } from "./EventCard";
import {
    getWeekDays,
    getWeekdayName,
    isToday,
    isSameDay,
} from "@/lib/planning/utils/dateUtils";
import type { Event } from "@/lib/planning/types";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { cn } from "@/lib/utils";

// Hook pour détecter si on est sur mobile
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 640);
        checkIsMobile();
        window.addEventListener("resize", checkIsMobile);
        return () => window.removeEventListener("resize", checkIsMobile);
    }, []);

    return isMobile;
}

interface WeekViewProps {
    currentDate: Date;
    events: Event[];
    onEventClick?: (event: Event) => void;
    onTimeSlotClick?: (date: Date, hour: number) => void;
}

// Configuration de la grille
const HOUR_HEIGHT = 60; // Hauteur de chaque heure en pixels
const START_HOUR = 7;
const END_HOUR = 22;
const HOURS = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
);

// Interface pour un segment d'événement (portion d'un événement sur un jour donné)
interface EventSegment extends Event {
    originalEventId: string;
    segmentStart: Date;
    segmentEnd: Date;
    isFirstSegment: boolean;
    isLastSegment: boolean;
}

export function WeekView({
    currentDate,
    events,
    onEventClick,
    onTimeSlotClick,
}: WeekViewProps) {
    const isMobile = useIsMobile();
    const allWeekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    // Sur mobile, afficher 3 jours centrés sur le jour actuel
    const weekDays = useMemo(() => {
        if (!isMobile) return allWeekDays;

        // Trouver l'index du jour courant dans la semaine
        const todayIndex = allWeekDays.findIndex((d) =>
            isSameDay(d, currentDate)
        );
        const centerIndex = todayIndex >= 0 ? todayIndex : 3; // Par défaut milieu de semaine

        // Calculer les indices pour 3 jours (1 avant, courant, 1 après)
        let startIndex = Math.max(0, centerIndex - 1);
        let endIndex = Math.min(allWeekDays.length, startIndex + 3);

        // Ajuster si on est en fin de semaine
        if (endIndex - startIndex < 3) {
            startIndex = Math.max(0, endIndex - 3);
        }

        return allWeekDays.slice(startIndex, endIndex);
    }, [allWeekDays, currentDate, isMobile]);

    // Map des événements pour lookup O(1)
    const eventsMap = useMemo(() => {
        const map = new Map<string, Event>();
        events.forEach((event) => map.set(event.id, event));
        return map;
    }, [events]);

    // Diviser les événements multi-jours en segments (un par jour)
    const splitEventIntoSegments = useMemo(() => {
        const segments: EventSegment[] = [];

        events.forEach((event) => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);

            // Trouver tous les jours de la semaine que cet événement touche
            weekDays.forEach((day, dayIndex) => {
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);

                // Vérifier si l'événement touche ce jour
                if (eventStart <= dayEnd && eventEnd >= dayStart) {
                    // Calculer le début et la fin du segment pour ce jour
                    const segmentStart = new Date(
                        Math.max(eventStart.getTime(), dayStart.getTime())
                    );
                    const segmentEnd = new Date(
                        Math.min(eventEnd.getTime(), dayEnd.getTime())
                    );

                    // Créer le segment
                    segments.push({
                        ...event,
                        originalEventId: event.id,
                        id: `${event.id}-segment-${dayIndex}`, // ID unique pour le segment
                        segmentStart,
                        segmentEnd,
                        isFirstSegment: isSameDay(eventStart, day),
                        isLastSegment: isSameDay(eventEnd, day),
                    });
                }
            });
        });

        return segments;
    }, [events, weekDays]);

    // Grouper les segments par jour
    const eventsByDay = useMemo(() => {
        const grouped = new Map<string, EventSegment[]>();
        weekDays.forEach((day) => {
            const dayKey = day.toISOString().split("T")[0];
            const daySegments = splitEventIntoSegments.filter((segment) =>
                isSameDay(segment.segmentStart, day)
            );
            grouped.set(dayKey, daySegments);
        });
        return grouped;
    }, [weekDays, splitEventIntoSegments]);

    // Calculer la position et la hauteur d'un segment dans la grille
    const getEventPosition = (
        segment: EventSegment
    ): { top: number; height: number } | null => {
        // Utiliser les dates du segment (portion de l'événement pour ce jour)
        const start = segment.segmentStart;
        const end = segment.segmentEnd;

        let startHour = start.getHours() + start.getMinutes() / 60;
        let endHour = end.getHours() + end.getMinutes() / 60;

        // Si l'événement se termine avant le début de la grille (7h), ne pas l'afficher
        if (endHour < START_HOUR) {
            return null;
        }

        // Si l'événement commence après la fin de la grille (23h), ne pas l'afficher
        if (startHour > END_HOUR + 1) {
            return null;
        }

        // Ajuster pour la plage horaire visible (7h-23h)
        // Si l'événement commence avant 7h, l'afficher à partir de 7h
        if (startHour < START_HOUR) {
            startHour = START_HOUR;
        }

        // Si l'événement finit après 23h, l'afficher jusqu'à 23h (fin de la grille)
        if (endHour > END_HOUR + 1) {
            endHour = END_HOUR + 1;
        }

        const top = (startHour - START_HOUR) * HOUR_HEIGHT;
        const height = Math.max(20, (endHour - startHour) * HOUR_HEIGHT);

        return { top, height };
    };

    // Calculer le layout des segments qui se chevauchent (côte à côte)
    const calculateEventLayout = (daySegments: EventSegment[]) => {
        const sortedSegments = [...daySegments].sort(
            (a, b) => a.segmentStart.getTime() - b.segmentStart.getTime()
        );

        const columns: EventSegment[][] = [];

        sortedSegments.forEach((segment) => {
            let placed = false;

            // Essayer de placer dans une colonne existante
            for (const column of columns) {
                // Vérifier le chevauchement basé sur les heures du segment
                const overlaps = column.some((s) => {
                    const s1Start = s.segmentStart.getTime();
                    const s1End = s.segmentEnd.getTime();
                    const s2Start = segment.segmentStart.getTime();
                    const s2End = segment.segmentEnd.getTime();
                    return s1Start < s2End && s2Start < s1End;
                });
                if (!overlaps) {
                    column.push(segment);
                    placed = true;
                    break;
                }
            }

            // Créer une nouvelle colonne si nécessaire
            if (!placed) {
                columns.push([segment]);
            }
        });

        // Calculer les positions et largeurs
        const layout = new Map<string, { width: number; left: number }>();

        columns.forEach((column, columnIndex) => {
            column.forEach((segment) => {
                layout.set(segment.id, {
                    width: 100 / columns.length,
                    left: (100 / columns.length) * columnIndex,
                });
            });
        });

        return layout;
    };

    return (
        <div className="flex flex-col h-full">
            {/* En-tête avec les jours de la semaine */}
            <div className="flex border-b sticky top-0 bg-background z-10">
                {/* Colonne vide pour aligner avec les heures */}
                <div className="w-12 sm:w-20 flex-shrink-0 border-r" />

                {/* Jours de la semaine */}
                {weekDays.map((day) => {
                    const dayKey = day.toISOString().split("T")[0];
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={dayKey}
                            className={cn(
                                "flex-1 p-2 sm:p-3 text-center border-r min-w-0",
                                isCurrentDay && "bg-primary/5"
                            )}
                        >
                            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase truncate">
                                {getWeekdayName(day, true)}
                            </div>
                            <div
                                className={cn(
                                    "text-base sm:text-lg font-semibold mt-0.5 sm:mt-1",
                                    isCurrentDay && "text-primary"
                                )}
                            >
                                {day.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grille horaire */}
            <ScrollArea className="flex-1 h-full">
                <div
                    className="flex relative pb-20"
                    style={{
                        minHeight: `${(HOURS.length + 1) * HOUR_HEIGHT}px`,
                    }}
                >
                    {/* Colonne des heures */}
                    <div className="w-12 sm:w-20 flex-shrink-0 border-r">
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="h-[60px] border-b text-[10px] sm:text-xs text-muted-foreground p-1 sm:p-2 text-right"
                            >
                                {hour.toString().padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* Colonnes des jours */}
                    {weekDays.map((day) => {
                        const dayKey = day.toISOString().split("T")[0];
                        const daySegments = eventsByDay.get(dayKey) || [];
                        const eventLayout = calculateEventLayout(daySegments);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={dayKey}
                                className={cn(
                                    "flex-1 border-r relative",
                                    isCurrentDay && "bg-primary/5"
                                )}
                            >
                                {/* Lignes horaires */}
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        className="h-[60px] border-b hover:bg-accent/50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            if (onTimeSlotClick) {
                                                const clickedDate = new Date(
                                                    day
                                                );
                                                clickedDate.setHours(
                                                    hour,
                                                    0,
                                                    0,
                                                    0
                                                );
                                                onTimeSlotClick(
                                                    clickedDate,
                                                    hour
                                                );
                                            }
                                        }}
                                    />
                                ))}

                                {/* Segments d'événements */}
                                {daySegments.map((segment) => {
                                    const position = getEventPosition(segment);

                                    // Ne pas afficher si hors de la plage horaire visible
                                    if (!position) return null;

                                    const { top, height } = position;
                                    const layout = eventLayout.get(
                                        segment.id
                                    ) || { width: 100, left: 0 };

                                    // Retrouver l'événement original pour le clic (lookup O(1))
                                    const originalEvent = eventsMap.get(
                                        segment.originalEventId
                                    );

                                    return (
                                        <div
                                            key={segment.id}
                                            className="absolute px-1"
                                            style={{
                                                top: `${top}px`,
                                                height: `${height}px`,
                                                width: `${layout.width}%`,
                                                left: `${layout.left}%`,
                                            }}
                                        >
                                            <EventCard
                                                event={segment}
                                                onClick={() =>
                                                    originalEvent &&
                                                    onEventClick?.(
                                                        originalEvent
                                                    )
                                                }
                                                compact
                                                className="h-full"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
