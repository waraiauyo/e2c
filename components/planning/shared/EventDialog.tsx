"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/shadcn/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { EventForm } from "@/components/planning/forms/EventForm";
import { useEventMutations } from "@/lib/planning/hooks/useEventMutations";
import { useAppSelector } from "@/lib/redux/hooks";
import { Button } from "@/components/shadcn/button";
import { Trash2, ShieldAlert, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import type { Event } from "@/lib/planning/types";
import {
    canEditEvent,
    canDeleteEvent,
    getPermissionDeniedReason,
    ROLE_LABELS,
    ROLE_COLORS,
    getEventColor,
} from "@/lib/planning/types";
import type { EventFormValues } from "@/lib/planning/schemas";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    event?: Event;
    initialDate?: Date;
    onSuccess?: () => void;
}

export function EventDialog({
    open,
    onOpenChange,
    mode,
    event,
    initialDate,
    onSuccess,
}: EventDialogProps) {
    const { create, update, remove, isLoading, isDeleting } =
        useEventMutations();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const { profile, user } = useAppSelector((state) => state.user);

    const userId = user?.id || profile?.id;
    const userAccountType = profile?.account_type;

    // Vérifier les permissions pour l'édition
    const userCanEdit =
        mode === "create" ||
        (event ? canEditEvent(event, userAccountType) : false);
    const userCanDelete = event
        ? canDeleteEvent(event, userAccountType)
        : false;
    const permissionDeniedReason =
        event && !userCanEdit
            ? getPermissionDeniedReason(event, userAccountType)
            : null;

    const handleSubmit = async (data: EventFormValues) => {
        if (!userId) {
            console.error("User ID is required to create an event");
            return;
        }

        if (mode === "create") {
            const result = await create(
                {
                    title: data.title,
                    description: data.description ?? null,
                    location: data.location ?? null,
                    start_time: data.start_time.toISOString(),
                    end_time: data.end_time.toISOString(),
                    all_day: data.all_day,
                    target_roles: data.target_roles,
                    status: data.status,
                    recurrence_rule: null,
                    recurrence_parent_id: null,
                    recurrence_exception: false,
                    created_by: userId,
                },
                data.participant_ids
            );

            if (result) {
                onOpenChange(false);
                onSuccess?.();
            }
        } else if (mode === "edit" && event) {
            const result = await update(
                event.id,
                {
                    title: data.title,
                    description: data.description ?? null,
                    location: data.location ?? null,
                    start_time: data.start_time.toISOString(),
                    end_time: data.end_time.toISOString(),
                    all_day: data.all_day,
                    target_roles: data.target_roles,
                    status: data.status,
                },
                data.participant_ids,
                userId
            );

            if (result) {
                onOpenChange(false);
                onSuccess?.();
            }
        }
    };

    const handleDelete = async () => {
        if (!event || !userId) return;

        const success = await remove(event.id, "instance", userId, {
            title: event.title,
            start_time: event.start_time,
        });

        if (success) {
            setShowDeleteAlert(false);
            onOpenChange(false);
            onSuccess?.();
        }
    };

    // Formater l'heure de l'événement
    const formatEventTime = (evt: Event) => {
        if (evt.all_day) return "Toute la journée";
        const start = format(new Date(evt.start_time), "HH:mm");
        const end = format(new Date(evt.end_time), "HH:mm");
        return `${start} - ${end}`;
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "create"
                                ? "Créer un événement"
                                : userCanEdit
                                  ? "Modifier l'événement"
                                  : "Détails de l'événement"}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === "create"
                                ? "Remplissez les informations pour créer un nouvel événement"
                                : userCanEdit
                                  ? "Modifiez les informations de l'événement"
                                  : "Consultez les détails de cet événement"}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Afficher le formulaire si l'utilisateur peut modifier */}
                    {userCanEdit ? (
                        <>
                            <EventForm
                                mode={mode}
                                event={event}
                                initialDate={initialDate}
                                onSubmit={handleSubmit}
                                onCancel={() => onOpenChange(false)}
                                isLoading={isLoading}
                            />

                            {/* Bouton de suppression (mode édition uniquement et si permission) */}
                            {mode === "edit" && event && userCanDelete && (
                                <div className="border-t pt-4 mt-4">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => setShowDeleteAlert(true)}
                                        disabled={isLoading || isDeleting}
                                        className="w-full"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer l'événement
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Affichage en lecture seule si l'utilisateur ne peut pas modifier */
                        event && (
                            <div className="space-y-6">
                                {/* Message d'avertissement */}
                                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                            Mode lecture seule
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                            {permissionDeniedReason}
                                        </p>
                                    </div>
                                </div>

                                {/* Détails de l'événement */}
                                <div
                                    className="p-4 rounded-lg border-l-4"
                                    style={{
                                        borderLeftColor: getEventColor(
                                            event.target_roles
                                        ),
                                        backgroundColor: `${getEventColor(event.target_roles)}10`,
                                    }}
                                >
                                    <h3 className="text-lg font-semibold mb-4">
                                        {event.title}
                                    </h3>

                                    {/* Rôles destinataires */}
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {event.target_roles.map((role) => (
                                            <span
                                                key={role}
                                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
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

                                    {/* Date et heure */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {format(
                                                    new Date(event.start_time),
                                                    "EEEE d MMMM yyyy",
                                                    { locale: fr }
                                                )}
                                                {" • "}
                                                {formatEventTime(event)}
                                            </span>
                                        </div>

                                        {event.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {event.description && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {event.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Statut */}
                                    <div className="mt-4">
                                        <Badge
                                            variant={
                                                event.status === "confirmed"
                                                    ? "default"
                                                    : event.status === "pending"
                                                      ? "secondary"
                                                      : "destructive"
                                            }
                                        >
                                            {event.status === "confirmed"
                                                ? "Confirmé"
                                                : event.status === "pending"
                                                  ? "En attente"
                                                  : "Annulé"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Bouton fermer */}
                                <div className="flex justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Fermer
                                    </Button>
                                </div>
                            </div>
                        )
                    )}
                </DialogContent>
            </Dialog>

            {/* Alert Dialog de confirmation de suppression */}
            <AlertDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. L'événement "
                            {event?.title}" sera définitivement supprimé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Suppression..." : "Supprimer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
