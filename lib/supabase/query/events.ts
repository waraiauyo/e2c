"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    Event,
    EventParticipant,
    EventParticipantWithProfile,
    EventReminder,
    EventWithDetails,
    EventFilters,
    TargetRole,
} from "@/lib/planning/types";

/**
 * Queries Supabase pour la gestion des événements
 */

// ============================================================================
// Queries de récupération (READ)
// ============================================================================

/**
 * Récupère tous les événements accessibles par l'utilisateur courant
 */
export async function getAllEvents(): Promise<Event[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

    if (error) {
        throw new Error(
            `Erreur lors de la récupération des événements: ${error.message}`
        );
    }

    return data as Event[];
}

/**
 * Récupère les événements avec filtres
 */
export async function getFilteredEvents(
    filters: EventFilters
): Promise<Event[]> {
    const supabase = await createClient();

    let query = supabase.from("events").select("*");

    // Filtre par rôles cibles (utilise l'opérateur overlaps pour les tableaux)
    if (filters.targetRoles && filters.targetRoles.length > 0) {
        query = query.overlaps("target_roles", filters.targetRoles);
    }

    // Filtre par statut
    if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
    }

    // Filtre par plage de dates
    if (filters.startDate) {
        query = query.gte("start_time", filters.startDate.toISOString());
    }
    if (filters.endDate) {
        query = query.lte("start_time", filters.endDate.toISOString());
    }

    // Recherche textuelle
    if (filters.search) {
        query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
    }

    query = query.order("start_time", { ascending: true });

    const { data, error } = await query;

    if (error) {
        throw new Error(
            `Erreur lors de la récupération des événements: ${error.message}`
        );
    }

    return data as Event[];
}

/**
 * Récupère un événement par son ID avec tous les détails
 */
export async function getEventById(
    id: string
): Promise<EventWithDetails | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("events")
        .select(
            `
            *,
            participants:event_participants(
                id,
                profile_id,
                profile:profiles(
                    id,
                    email,
                    first_name,
                    last_name,
                    avatar_url
                )
            ),
            reminders:event_reminders(*)
        `
        )
        .eq("id", id)
        .single();

    if (error) {
        throw new Error(
            `Erreur lors de la récupération de l'événement: ${error.message}`
        );
    }

    return data as EventWithDetails;
}

/**
 * Récupère les événements par rôles cibles
 */
export async function getEventsByRoles(roles: TargetRole[]): Promise<Event[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("events")
        .select("*")
        .overlaps("target_roles", roles)
        .order("start_time", { ascending: true });

    if (error) {
        throw new Error(
            `Erreur lors de la récupération des événements: ${error.message}`
        );
    }

    return data as Event[];
}

/**
 * Récupère les événements d'une plage de dates
 */
export async function getEventsByDateRange(
    startDate: Date,
    endDate: Date
): Promise<Event[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true });

    if (error) {
        throw new Error(
            `Erreur lors de la récupération des événements: ${error.message}`
        );
    }

    return data as Event[];
}

// ============================================================================
// Mutations (CREATE, UPDATE, DELETE)
// ============================================================================

/**
 * Crée un nouvel événement
 */
export async function createEvent(
    eventData: Omit<Event, "id" | "created_at" | "updated_at">
): Promise<Event> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

    if (error) {
        throw new Error(
            `Erreur lors de la création de l'événement: ${error.message}`
        );
    }

    return data as Event;
}

/**
 * Met à jour un événement
 */
export async function updateEvent(
    id: string,
    updates: Partial<Omit<Event, "id" | "created_at" | "updated_at">>
): Promise<Event> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(
            `Erreur lors de la mise à jour de l'événement: ${error.message}`
        );
    }

    return data as Event;
}

/**
 * Supprime un événement
 * @param id - ID de l'événement
 * @param deleteType - "instance" pour supprimer une seule instance, "series" pour toute la série récurrente
 */
export async function deleteEvent(
    id: string,
    deleteType: "instance" | "series" = "instance"
): Promise<void> {
    const supabase = await createClient();

    if (deleteType === "series") {
        // Récupérer l'événement pour voir s'il a un parent ou s'il est le parent
        const { data: event } = await supabase
            .from("events")
            .select("recurrence_parent_id")
            .eq("id", id)
            .single();

        if (event) {
            const parentId = event.recurrence_parent_id || id;

            // Supprimer toutes les instances de la série
            const { error } = await supabase
                .from("events")
                .delete()
                .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`);

            if (error) {
                throw new Error(
                    `Erreur lors de la suppression de la série: ${error.message}`
                );
            }
        }
    } else {
        // Supprimer uniquement cette instance
        const { error } = await supabase.from("events").delete().eq("id", id);

        if (error) {
            throw new Error(
                `Erreur lors de la suppression de l'événement: ${error.message}`
            );
        }
    }
}

/**
 * Duplique un événement
 */
export async function duplicateEvent(id: string): Promise<Event> {
    const supabase = await createClient();

    // Récupérer l'événement original
    const { data: original, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError) {
        throw new Error(
            `Erreur lors de la récupération de l'événement: ${fetchError.message}`
        );
    }

    // Créer une copie sans l'ID et les timestamps
    const { id: _, created_at, updated_at, ...eventData } = original;

    const { data, error } = await supabase
        .from("events")
        .insert({
            ...eventData,
            title: `${eventData.title} (copie)`,
        })
        .select()
        .single();

    if (error) {
        throw new Error(
            `Erreur lors de la duplication de l'événement: ${error.message}`
        );
    }

    return data as Event;
}

// ============================================================================
// Queries pour les participants
// ============================================================================

/**
 * Récupère les participants d'un événement
 */
export async function getEventParticipants(
    eventId: string
): Promise<EventParticipantWithProfile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("event_participants")
        .select(
            `
            *,
            profile:profiles(
                id,
                email,
                first_name,
                last_name,
                avatar_url
            )
        `
        )
        .eq("event_id", eventId);

    if (error) {
        throw new Error(
            `Erreur lors de la récupération des participants: ${error.message}`
        );
    }

    return data as EventParticipantWithProfile[];
}

/**
 * Récupère le nombre de participants pour plusieurs événements en une seule requête
 * Optimisation pour éviter le problème N+1
 */
export async function getBatchEventParticipantCounts(
    eventIds: string[]
): Promise<Map<string, number>> {
    if (eventIds.length === 0) {
        return new Map();
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("event_participants")
        .select("event_id")
        .in("event_id", eventIds);

    if (error) {
        console.error("Erreur lors du comptage des participants:", error);
        return new Map();
    }

    // Grouper par event_id et compter
    const counts = new Map<string, number>();
    data.forEach((participant) => {
        const current = counts.get(participant.event_id) || 0;
        counts.set(participant.event_id, current + 1);
    });

    return counts;
}

/**
 * Ajoute un participant à un événement
 */
export async function addParticipant(
    eventId: string,
    profileId: string
): Promise<EventParticipant> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("event_participants")
        .insert({ event_id: eventId, profile_id: profileId })
        .select()
        .single();

    if (error) {
        throw new Error(
            `Erreur lors de l'ajout du participant: ${error.message}`
        );
    }

    return data as EventParticipant;
}

/**
 * Retire un participant d'un événement
 */
export async function removeParticipant(
    eventId: string,
    profileId: string
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", profileId);

    if (error) {
        throw new Error(
            `Erreur lors du retrait du participant: ${error.message}`
        );
    }
}

/**
 * Met à jour tous les participants d'un événement
 */
export async function updateEventParticipants(
    eventId: string,
    profileIds: string[]
): Promise<void> {
    const supabase = await createClient();

    // Supprimer tous les participants existants
    await supabase.from("event_participants").delete().eq("event_id", eventId);

    // Ajouter les nouveaux participants
    if (profileIds.length > 0) {
        const participants = profileIds.map((profileId) => ({
            event_id: eventId,
            profile_id: profileId,
        }));

        const { error } = await supabase
            .from("event_participants")
            .insert(participants);

        if (error) {
            throw new Error(
                `Erreur lors de la mise à jour des participants: ${error.message}`
            );
        }
    }
}

// ============================================================================
// Queries pour les rappels
// ============================================================================

/**
 * Crée un rappel pour un événement
 */
export async function createReminder(
    eventId: string,
    profileId: string,
    minutesBefore: number
): Promise<EventReminder> {
    const supabase = await createClient();

    // Récupérer la date de début de l'événement
    const { data: event } = await supabase
        .from("events")
        .select("start_time")
        .eq("id", eventId)
        .single();

    if (!event) {
        throw new Error("Événement introuvable");
    }

    // Calculer l'heure du rappel
    const reminderTime = new Date(event.start_time);
    reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

    const { data, error } = await supabase
        .from("event_reminders")
        .insert({
            event_id: eventId,
            profile_id: profileId,
            reminder_time: reminderTime.toISOString(),
            minutes_before: minutesBefore,
        })
        .select()
        .single();

    if (error) {
        throw new Error(
            `Erreur lors de la création du rappel: ${error.message}`
        );
    }

    return data as EventReminder;
}

/**
 * Supprime un rappel
 */
export async function deleteReminder(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("event_reminders")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(
            `Erreur lors de la suppression du rappel: ${error.message}`
        );
    }
}

/**
 * Récupère les rappels d'un événement pour l'utilisateur courant
 */
export async function getEventReminders(
    eventId: string
): Promise<EventReminder[]> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Utilisateur non authentifié");
    }

    const { data, error } = await supabase
        .from("event_reminders")
        .select("*")
        .eq("event_id", eventId)
        .eq("profile_id", user.id);

    if (error) {
        throw new Error(
            `Erreur lors de la récupération des rappels: ${error.message}`
        );
    }

    return data as EventReminder[];
}
