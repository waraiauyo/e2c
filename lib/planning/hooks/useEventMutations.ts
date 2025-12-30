"use client";

import { useState } from "react";
import {
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    updateEventParticipants,
    getEventParticipants
} from "@/lib/supabase/query/events";
import {
    sendEventCreatedNotification,
    sendEventUpdatedNotification,
    sendEventDeletedNotification
} from "@/lib/resend/actions";
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

                // Envoyer les notifications email aux participants
                if (eventData.created_by) {
                    const notificationResult = await sendEventCreatedNotification(
                        newEvent.id,
                        {
                            title: newEvent.title,
                            description: newEvent.description,
                            location: newEvent.location,
                            start_time: newEvent.start_time,
                            end_time: newEvent.end_time,
                            all_day: newEvent.all_day,
                            target_roles: newEvent.target_roles,
                        },
                        eventData.created_by
                    );

                    if (!notificationResult.success) {
                        console.warn("Échec de l'envoi des notifications:", notificationResult.error);
                    }
                }
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
        participantIds?: string[],
        updaterId?: string
    ): Promise<Event | null> => {
        setIsUpdating(true);
        setError(null);

        try {
            // IMPORTANT : Récupérer les participants AVANT de les mettre à jour
            // pour envoyer les notifications aux anciens participants, pas aux nouveaux
            const existingParticipants = await getEventParticipants(id);

            const updatedEvent = await updateEvent(id, updates);

            // Mettre à jour les participants si spécifiés
            if (participantIds !== undefined) {
                await updateEventParticipants(id, participantIds);
            }

            // Envoyer les notifications aux ANCIENS participants uniquement
            if (existingParticipants.length > 0 && updaterId) {
                const notificationResult = await sendEventUpdatedNotification(
                    id,
                    {
                        title: updatedEvent.title,
                        description: updatedEvent.description,
                        location: updatedEvent.location,
                        start_time: updatedEvent.start_time,
                        end_time: updatedEvent.end_time,
                        all_day: updatedEvent.all_day,
                        target_roles: updatedEvent.target_roles,
                    },
                    updaterId
                );

                if (!notificationResult.success) {
                    console.warn("Échec de l'envoi des notifications:", notificationResult.error);
                }
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
        deleteType: "instance" | "series" = "instance",
        deleterId?: string,
        eventData?: { title: string; start_time: string }
    ): Promise<boolean> => {
        setIsDeleting(true);
        setError(null);

        try {
            // Récupérer les participants avant suppression
            const participants = await getEventParticipants(id);
            const participantIds = participants.map(p => p.profile_id);

            // Supprimer l'événement
            await deleteEvent(id, deleteType);

            // Envoyer les notifications si des participants existent et qu'on a les infos
            if (participantIds.length > 0 && deleterId && eventData) {
                const notificationResult = await sendEventDeletedNotification(
                    eventData.title,
                    eventData.start_time,
                    participantIds,
                    deleterId
                );

                if (!notificationResult.success) {
                    console.warn("Échec de l'envoi des notifications:", notificationResult.error);
                }
            }

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
