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
import { Trash2 } from "lucide-react";
import type { Event } from "@/lib/planning/types";
import type { EventFormValues } from "@/lib/planning/schemas";
import type { FilterContext } from "@/components/planning/sidebar/FilterSidebar";

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    event?: Event;
    initialDate?: Date;
    filterContext?: FilterContext | null;
    onSuccess?: () => void;
}

export function EventDialog({
    open,
    onOpenChange,
    mode,
    event,
    initialDate,
    filterContext,
    onSuccess,
}: EventDialogProps) {
    const { create, update, remove, isLoading, isDeleting } =
        useEventMutations();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const { profile, user } = useAppSelector((state) => state.user);

    const userId = user?.id || profile?.id;

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
                    owner_type: data.owner_type,
                    owner_id: data.owner_id,
                    status: data.status,
                    color: data.color ?? null,
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
                    owner_type: data.owner_type,
                    owner_id: data.owner_id,
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

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "create"
                                ? "Créer un événement"
                                : "Modifier l'événement"}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === "create"
                                ? "Remplissez les informations pour créer un nouvel événement"
                                : "Modifiez les informations de l'événement"}
                        </DialogDescription>
                    </DialogHeader>

                    <EventForm
                        mode={mode}
                        event={event}
                        initialDate={initialDate}
                        filterContext={filterContext}
                        onSubmit={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        isLoading={isLoading}
                    />

                    {/* Bouton de suppression (mode édition uniquement) */}
                    {mode === "edit" && event && (
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
