"use client";

import { useState, useMemo, useEffect } from "react";
import {
    format,
    isToday,
    isTomorrow,
    isYesterday,
    startOfDay,
    addMonths,
    differenceInCalendarDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/shadcn/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Search, Calendar, Clock, MapPin, Users } from "lucide-react";
import type { Event, TargetRole } from "@/lib/planning/types";
import { getEventColor, ROLE_LABELS, ROLE_COLORS } from "@/lib/planning/types";
import { Badge } from "@/components/shadcn/badge";
import { getBatchEventParticipantCounts } from "@/lib/supabase/query/events";

interface AgendaViewProps {
    events: Event[];
    currentDate: Date;
    onEventClick: (event: Event) => void;
    onDateChange: (date: Date) => void;
}

type TimeFilter = "7d" | "30d" | "3m" | "all";

export function AgendaView({
    events,
    currentDate,
    onEventClick,
}: AgendaViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d");
    const [participantCounts, setParticipantCounts] = useState<
        Map<string, number>
    >(new Map());

    // Filtrer les événements par période
    const filteredByTime = useMemo(() => {
        const now = startOfDay(new Date());

        return events.filter((event) => {
            const eventDate = startOfDay(new Date(event.start_time));
            const daysDiff = differenceInCalendarDays(eventDate, now);

            switch (timeFilter) {
                case "7d":
                    return daysDiff >= 0 && daysDiff < 7;
                case "30d":
                    return daysDiff >= 0 && daysDiff < 30;
                case "3m":
                    const threeMonthsLater = addMonths(now, 3);
                    return eventDate >= now && eventDate < threeMonthsLater;
                case "all":
                    return eventDate >= now;
                default:
                    return true;
            }
        });
    }, [events, timeFilter]);

    // Filtrer par recherche
    const filteredEvents = useMemo(() => {
        if (!searchQuery.trim()) return filteredByTime;

        const query = searchQuery.toLowerCase();
        return filteredByTime.filter((event) => {
            return (
                event.title.toLowerCase().includes(query) ||
                event.description?.toLowerCase().includes(query) ||
                event.location?.toLowerCase().includes(query)
            );
        });
    }, [filteredByTime, searchQuery]);

    // Grouper par date
    const groupedEvents = useMemo(() => {
        const groups = new Map<string, Event[]>();

        filteredEvents.forEach((event) => {
            const dateKey = format(new Date(event.start_time), "yyyy-MM-dd");
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey)!.push(event);
        });

        // Trier les groupes par date
        const sortedGroups = Array.from(groups.entries()).sort(
            ([dateA], [dateB]) => {
                return dateA.localeCompare(dateB);
            }
        );

        // Trier les événements dans chaque groupe par heure
        sortedGroups.forEach(([, eventsList]) => {
            eventsList.sort((a, b) => {
                return (
                    new Date(a.start_time).getTime() -
                    new Date(b.start_time).getTime()
                );
            });
        });

        return sortedGroups;
    }, [filteredEvents]);

    // Charger les participants pour les événements visibles (optimisé avec batch query)
    useEffect(() => {
        async function loadParticipants() {
            if (filteredEvents.length === 0) {
                setParticipantCounts(new Map());
                return;
            }

            const eventIds = filteredEvents.map((event) => event.id);
            const counts = await getBatchEventParticipantCounts(eventIds);
            setParticipantCounts(counts);
        }

        loadParticipants();
    }, [filteredEvents]);

    // Formater l'en-tête de date
    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString);

        if (isToday(date)) return "Aujourd'hui";
        if (isTomorrow(date)) return "Demain";
        if (isYesterday(date)) return "Hier";

        return format(date, "EEEE d MMMM yyyy", { locale: fr });
    };

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

    return (
        <div className="flex flex-col h-full">
            {/* Barre de recherche et filtres */}
            <div className="border-b bg-background sticky top-0 z-10 p-4 space-y-4">
                {/* Recherche */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un événement..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Filtre temporel */}
                <Tabs
                    value={timeFilter}
                    onValueChange={(value) =>
                        setTimeFilter(value as TimeFilter)
                    }
                >
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="7d" className="text-xs sm:text-sm">
                            <span className="sm:hidden">7j</span>
                            <span className="hidden sm:inline">7 jours</span>
                        </TabsTrigger>
                        <TabsTrigger value="30d" className="text-xs sm:text-sm">
                            <span className="sm:hidden">30j</span>
                            <span className="hidden sm:inline">30 jours</span>
                        </TabsTrigger>
                        <TabsTrigger value="3m" className="text-xs sm:text-sm">
                            <span className="sm:hidden">3m</span>
                            <span className="hidden sm:inline">3 mois</span>
                        </TabsTrigger>
                        <TabsTrigger value="all" className="text-xs sm:text-sm">Tout</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Compteur de résultats */}
                <div className="text-sm text-muted-foreground">
                    {filteredEvents.length} événement
                    {filteredEvents.length > 1 ? "s" : ""} trouvé
                    {filteredEvents.length > 1 ? "s" : ""}
                </div>
            </div>

            {/* Liste des événements groupés par date */}
            <div className="flex-1 overflow-y-auto">
                {groupedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                            Aucun événement trouvé
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {searchQuery
                                ? "Essayez une autre recherche"
                                : "Créez votre premier événement"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 px-4 py-4">
                        {groupedEvents.map(([dateKey, dayEvents]) => (
                            <div key={dateKey} className="space-y-3">
                                {/* En-tête de date */}
                                <div className="sticky top-0 bg-background py-2 z-10 border-b -mx-4 px-4">
                                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                                        {formatDateHeader(dateKey)}
                                    </h3>
                                </div>

                                {/* Événements du jour */}
                                <div className="space-y-2">
                                    {dayEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={() => onEventClick(event)}
                                            className="group relative p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                                            style={{
                                                borderLeftColor: getEventColor(event.target_roles),
                                                borderLeftWidth: "4px",
                                            }}
                                        >
                                            {/* Titre et statut */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="font-medium text-foreground group-hover:text-accent-foreground line-clamp-1">
                                                    {event.title}
                                                </h4>
                                                {getStatusBadge(event.status)}
                                            </div>

                                            {/* Badges des rôles */}
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {event.target_roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
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

                                            {/* Heure */}
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {formatEventTime(event)}
                                                </span>
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

                                            {/* Participants */}
                                            {participantCounts.get(event.id) !==
                                                undefined &&
                                                participantCounts.get(
                                                    event.id
                                                )! > 0 && (
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
