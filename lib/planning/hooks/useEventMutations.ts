"use client";

import { useState } from "react";
import {
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    updateEventParticipants
} from "@/lib/supabase/query/events";
import type { Event } from "@/lib/planning/types";
import { toast } from "sonner";

/**
 * Hook pour gérer les mutations d'événements (CREATE, UPDATE, DELETE)
 * Gère les états de chargement, erreurs, et affiche des toasts
 */
export function useEventMutations() {
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Crée un nouvel événement
     */
    const create = async (
        eventData: Omit<Event, "id" | "created_at" | "updated_at">,
        participantIds?: string[]
    ): Promise<Event | null> => {
        setIsCreating(true);
        setError(null);

        try {
            const newEvent = await createEvent(eventData);

            // Ajouter les participants si spécifiés
            if (participantIds && participantIds.length > 0) {
                await updateEventParticipants(newEvent.id, participantIds);
            }

            toast.success("Événement créé avec succès");
            return newEvent;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de la création");
            setError(error);
            toast.error(error.message);
            return null;
        } finally {
            setIsCreating(false);
        }
    };

    /**
     * Met à jour un événement existant
     */
    const update = async (
        id: string,
        updates: Partial<Omit<Event, "id" | "created_at" | "updated_at">>,
        participantIds?: string[]
    ): Promise<Event | null> => {
        setIsUpdating(true);
        setError(null);

        try {
            const updatedEvent = await updateEvent(id, updates);

            // Mettre à jour les participants si spécifiés
            if (participantIds !== undefined) {
                await updateEventParticipants(id, participantIds);
            }

            toast.success("Événement mis à jour avec succès");
            return updatedEvent;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de la mise à jour");
            setError(error);
            toast.error(error.message);
            return null;
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Supprime un événement
     */
    const remove = async (
        id: string,
        deleteType: "instance" | "series" = "instance"
    ): Promise<boolean> => {
        setIsDeleting(true);
        setError(null);

        try {
            await deleteEvent(id, deleteType);
            toast.success(
                deleteType === "series"
                    ? "Série d'événements supprimée avec succès"
                    : "Événement supprimé avec succès"
            );
            return true;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de la suppression");
            setError(error);
            toast.error(error.message);
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    /**
     * Duplique un événement
     */
    const duplicate = async (id: string): Promise<Event | null> => {
        setIsCreating(true);
        setError(null);

        try {
            const duplicatedEvent = await duplicateEvent(id);
            toast.success("Événement dupliqué avec succès");
            return duplicatedEvent;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de la duplication");
            setError(error);
            toast.error(error.message);
            return null;
        } finally {
            setIsCreating(false);
        }
    };

    return {
        create,
        update,
        remove,
        duplicate,
        isCreating,
        isUpdating,
        isDeleting,
        isLoading: isCreating || isUpdating || isDeleting,
        error,
    };
}
