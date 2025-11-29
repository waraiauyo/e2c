"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllEvents, getFilteredEvents } from "@/lib/supabase/query/events";
import type { Event, EventFilters, UseEventsOptions } from "@/lib/planning/types";

/**
 * Hook pour récupérer et gérer les événements
 * Gère le chargement, les erreurs, et le rafraîchissement
 */
export function useEvents(options: UseEventsOptions = {}) {
    const { filters, enabled = true } = options;

    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchEvents = useCallback(async () => {
        if (!enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = filters
                ? await getFilteredEvents(filters)
                : await getAllEvents();

            setEvents(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Erreur lors de la récupération des événements"));
        } finally {
            setIsLoading(false);
        }
    }, [filters, enabled]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return {
        events,
        isLoading,
        error,
        refetch: fetchEvents,
    };
}
