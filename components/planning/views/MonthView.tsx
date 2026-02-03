"use client";

import { useMemo, useState } from "react";
import {
    format,
    isSameMonth,
    isToday,
    startOfDay,
    endOfDay,
    isWithinInterval,
} from "date-fns";
import { getMonthDays, getMonthName } from "@/lib/planning/utils/dateUtils";
import type { Event } from "@/lib/planning/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/shadcn/badge";
import { DayEventsDialog } from "@/components/planning/shared/DayEventsDialog";

interface MonthViewProps {
    currentDate: Date;
    events: Event[];
    onEventClick: (event: Event) => void;
    onDayClick: (date: Date) => void;
}

export function MonthView({
    currentDate,
    events,
    onEventClick,
    onDayClick,
}: MonthViewProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Obtenir tous les jours du mois (incluant les jours avant/après pour remplir les semaines)
    const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

    // Grouper les événements par jour
    const eventsByDay = useMemo(() => {
        const groups = new Map<string, Event[]>();

        events.forEach((event) => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);

            // Pour chaque jour du mois, vérifier si l'événement intersecte
            monthDays.forEach((day) => {
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);

                const eventIntersects =
                    isWithinInterval(eventStart, {
                        start: dayStart,
                        end: dayEnd,
                    }) ||
                    isWithinInterval(eventEnd, {
                        start: dayStart,
                        end: dayEnd,
                    }) ||
                    (eventStart <= dayStart && eventEnd >= dayEnd);

                if (eventIntersects) {
                    const dateKey = format(day, "yyyy-MM-dd");
                    if (!groups.has(dateKey)) {
                        groups.set(dateKey, []);
                    }
                    groups.get(dateKey)!.push(event);
                }
            });
        });

        return groups;
    }, [events, monthDays]);

    // Obtenir le nombre d'événements pour un jour
    const getEventCount = (date: Date): number => {
        const dateKey = format(date, "yyyy-MM-dd");
        return eventsByDay.get(dateKey)?.length || 0;
    };

    // Badge couleur selon le nombre d'événements
    const getCountBadgeVariant = (count: number) => {
        if (count === 0) return null;
        if (count === 1) return "secondary" as const;
        if (count <= 3) return "default" as const;
        return "destructive" as const;
    };

    // Handler pour le clic sur un jour
    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setDialogOpen(true);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header avec le mois */}
            <div className="border-b bg-background sticky top-0 z-10 p-4">
                <h2 className="text-xl font-semibold">
                    {getMonthName(currentDate)} {currentDate.getFullYear()}
                </h2>
            </div>

            {/* Grille du calendrier */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* En-têtes des jours de la semaine */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                    {[
                        { short: "L", full: "Lun" },
                        { short: "M", full: "Mar" },
                        { short: "M", full: "Mer" },
                        { short: "J", full: "Jeu" },
                        { short: "V", full: "Ven" },
                        { short: "S", full: "Sam" },
                        { short: "D", full: "Dim" },
                    ].map((day, i) => (
                        <div
                            key={i}
                            className="text-center py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-muted-foreground border-r last:border-r-0"
                        >
                            <span className="sm:hidden">{day.short}</span>
                            <span className="hidden sm:inline">{day.full}</span>
                        </div>
                    ))}
                </div>

                {/* Grille des jours */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 auto-rows-fr min-h-full">
                        {monthDays.map((day, index) => {
                            const isCurrentMonth = isSameMonth(
                                day,
                                currentDate
                            );
                            const isTodayDate = isToday(day);
                            const eventCount = getEventCount(day);
                            const badgeVariant =
                                getCountBadgeVariant(eventCount);

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "border-r border-b last:border-r-0 p-1 sm:p-2 min-h-[60px] sm:min-h-[100px] cursor-pointer hover:bg-accent/50 transition-colors",
                                        !isCurrentMonth &&
                                            "bg-muted/20 text-muted-foreground",
                                        isTodayDate &&
                                            "bg-primary/5 ring-2 ring-primary/20 ring-inset"
                                    )}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {/* Numéro du jour */}
                                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                                        <div
                                            className={cn(
                                                "flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-medium",
                                                isTodayDate &&
                                                    "bg-primary text-primary-foreground"
                                            )}
                                        >
                                            {format(day, "d")}
                                        </div>

                                        {/* Badge du nombre d'événements */}
                                        {eventCount > 0 && badgeVariant && (
                                            <Badge
                                                variant={badgeVariant}
                                                className="text-[10px] sm:text-xs px-1.5 sm:px-2 h-5"
                                            >
                                                {eventCount}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Indicateurs visuels supplémentaires (cachés sur mobile) */}
                                    {eventCount > 0 && (
                                        <div className="hidden sm:block space-y-1">
                                            {eventCount === 1 && (
                                                <div className="text-xs text-muted-foreground">
                                                    1 événement
                                                </div>
                                            )}
                                            {eventCount > 1 && (
                                                <div className="text-xs text-muted-foreground">
                                                    {eventCount} événements
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Dialog pour afficher les événements du jour */}
            {selectedDate && (
                <DayEventsDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    date={selectedDate}
                    events={events}
                    onEventClick={onEventClick}
                    onCreateEvent={onDayClick}
                />
            )}
        </div>
    );
}
