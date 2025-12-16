"use client";

import { useMemo, useEffect, useState } from "react";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Calendar, Clock, MapPin, Tag, Plus, Users } from "lucide-react";
import type { Event } from "@/lib/planning/types";
import { getBatchEventParticipantCounts } from "@/lib/supabase/query/events";

interface DayEventsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: Date;
    events: Event[];
    onEventClick: (event: Event) => void;
    onCreateEvent: (date: Date) => void;
}

export function DayEventsDialog({
    open,
    onOpenChange,
    date,
    events,
    onEventClick,
    onCreateEvent,
}: DayEventsDialogProps) {
    const [participantCounts, setParticipantCounts] = useState<
        Map<string, number>
    >(new Map());

    // Filtrer les événements du jour
    const dayEvents = useMemo(() => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const filtered = events.filter((event) => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);

            return (
                isWithinInterval(eventStart, {
                    start: dayStart,
                    end: dayEnd,
                }) ||
                isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
                (eventStart <= dayStart && eventEnd >= dayEnd)
            );
        });

        // Trier par heure de début
        return filtered.sort((a, b) => {
            return (
                new Date(a.start_time).getTime() -
                new Date(b.start_time).getTime()
            );
        });
    }, [date, events]);

    // Charger les participants pour les événements du jour (optimisé avec batch query)
    useEffect(() => {
        async function loadParticipants() {
            if (!open || dayEvents.length === 0) {
                setParticipantCounts(new Map());
                return;
            }

            const eventIds = dayEvents.map((event) => event.id);
            const counts = await getBatchEventParticipantCounts(eventIds);
            setParticipantCounts(counts);
        }

        loadParticipants();
    }, [open, dayEvents]);

    // Formater l'heure de l'événement
    const formatEventTime = (event: Event) => {
        if (event.all_day) return "Toute la journée";

        const start = format(new Date(event.start_time), "HH:mm");
        const end = format(new Date(event.end_time), "HH:mm");
        return `${start} - ${end}`;
    };

    // Badge de statut
    const getStatusBadge = (status: Event["status"]) => {
        const variants = {
            confirmed: "default" as const,
            pending: "secondary" as const,
            cancelled: "destructive" as const,
        };

        const labels = {
            confirmed: "Confirmé",
            pending: "En attente",
            cancelled: "Annulé",
        };

        return (
            <Badge variant={variants[status]} className="text-xs">
                {labels[status]}
            </Badge>
        );
    };

    const handleEventClick = (event: Event) => {
        onEventClick(event);
        onOpenChange(false);
    };

    const handleCreateClick = () => {
        onCreateEvent(date);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {format(date, "EEEE d MMMM yyyy", { locale: fr })}
                    </DialogTitle>
                </DialogHeader>

                {/* Bouton créer un événement */}
                <div className="pb-4 border-b flex-shrink-0">
                    <Button onClick={handleCreateClick} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un événement ce jour
                    </Button>
                </div>

                {/* Liste des événements */}
                <div className="flex-1 overflow-y-auto">
                    {dayEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">
                                Aucun événement
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Il n'y a pas d'événement prévu ce jour
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 py-4">
                            <div className="text-sm text-muted-foreground px-1 mb-4">
                                {dayEvents.length} événement
                                {dayEvents.length > 1 ? "s" : ""}
                            </div>

                            {dayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => handleEventClick(event)}
                                    className="group relative p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                                    style={{
                                        borderLeftColor:
                                            event.color || undefined,
                                        borderLeftWidth: event.color
                                            ? "4px"
                                            : undefined,
                                    }}
                                >
                                    {/* Titre et statut */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-medium text-foreground group-hover:text-accent-foreground line-clamp-1">
                                            {event.title}
                                        </h4>
                                        {getStatusBadge(event.status)}
                                    </div>

                                    {/* Heure */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{formatEventTime(event)}</span>
                                    </div>

                                    {/* Lieu */}
                                    {event.location && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <MapPin className="h-4 w-4" />
                                            <span className="line-clamp-1">
                                                {event.location}
                                            </span>
                                        </div>
                                    )}

                                    {/* Type (Personnel/CLAS) */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Tag className="h-4 w-4" />
                                        <span className="capitalize">
                                            {event.owner_type === "personal"
                                                ? "Personnel"
                                                : "CLAS"}
                                        </span>
                                    </div>

                                    {/* Participants */}
                                    {participantCounts.get(event.id) !==
                                        undefined &&
                                        participantCounts.get(event.id)! >
                                            0 && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>
                                                    {participantCounts.get(
                                                        event.id
                                                    )}{" "}
                                                    participant
                                                    {participantCounts.get(
                                                        event.id
                                                    )! > 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                            </div>
                                        )}

                                    {/* Description */}
                                    {event.description && (
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
