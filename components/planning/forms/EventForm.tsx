"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, type EventFormValues } from "@/lib/planning/schemas";
import { useAppSelector } from "@/lib/redux/hooks";
import { getAllClas, getUserClasWithRoles } from "@/lib/supabase/query/clas";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { Label } from "@/components/shadcn/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/shadcn/form";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Event } from "@/lib/planning/types";
import type { FilterContext } from "@/components/planning/sidebar/FilterSidebar";
import { useEffect, useState } from "react";

interface EventFormProps {
    mode: "create" | "edit";
    event?: Event;
    initialDate?: Date;
    filterContext?: FilterContext | null;
    onSubmit: (data: EventFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function EventForm({ mode, event, initialDate, filterContext, onSubmit, onCancel, isLoading }: EventFormProps) {
    const { profile, user } = useAppSelector((state) => state.user);
    const [userClasList, setUserClasList] = useState<{ id: string; name: string; role?: string }[]>([]);
    const [isLoadingClas, setIsLoadingClas] = useState(false);

    const isAdmin = profile?.account_type === "admin";
    const isCoordinator = profile?.account_type === "coordinator" || isAdmin;
    const userId = user?.id || profile?.id;

    // Vérifier que l'utilisateur est connecté
    if (!userId) {
        return (
            <div className="p-6 text-center">
                <p className="text-destructive font-semibold mb-2">
                    Erreur d'authentification
                </p>
                <p className="text-sm text-muted-foreground">
                    Vous devez être connecté pour créer un événement.
                </p>
                <Button onClick={onCancel} className="mt-4">
                    Fermer
                </Button>
            </div>
        );
    }

    // Valeurs par défaut
    const defaultValues: EventFormValues = mode === "edit" && event
        ? {
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: new Date(event.start_time),
            end_time: new Date(event.end_time),
            all_day: event.all_day,
            owner_type: event.owner_type,
            owner_id: event.owner_id,
            status: event.status,
            color: event.color,
            participant_ids: [],
        }
        : {
            title: "",
            description: null,
            location: null,
            start_time: initialDate || new Date(),
            end_time: initialDate ? new Date(initialDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
            all_day: false,
            // Pré-remplir selon le filtre sélectionné
            owner_type: filterContext?.type || "personal",
            owner_id: filterContext?.id || userId,
            status: "confirmed",
            color: null,
            participant_ids: [],
        };

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues,
    });

    const ownerType = form.watch("owner_type");
    const allDay = form.watch("all_day");

    // Charger les CLAS (admin = tous les CLAS, autres = leurs CLAS avec rôles)
    useEffect(() => {
        async function loadClas() {
            if (userId) {
                setIsLoadingClas(true);

                if (isAdmin) {
                    // Admin voit TOUS les CLAS du système (sans rôle spécifique)
                    const result = await getAllClas();
                    if (result.clas) {
                        setUserClasList(result.clas.map(c => ({ id: c.id, name: c.name })));
                    }
                } else {
                    // Coordinator/Animator voient leurs CLAS avec leurs rôles
                    const result = await getUserClasWithRoles(userId);
                    if (result.clas) {
                        setUserClasList(result.clas);
                    }
                }

                setIsLoadingClas(false);
            }
        }
        loadClas();
    }, [userId, isAdmin]);

    // Mettre à jour owner_id quand le type change
    useEffect(() => {
        if (ownerType === "personal") {
            form.setValue("owner_id", userId);
        } else if (ownerType === "clas" && !isCoordinator && userClasList.length > 0) {
            // Animator : auto-sélectionner son CLAS unique
            form.setValue("owner_id", userClasList[0].id);
        }
    }, [ownerType, userId, isCoordinator, userClasList, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Titre */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Titre *</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Réunion d'équipe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Décrivez l'événement..."
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Type d'événement */}
                <FormField
                    control={form.control}
                    name="owner_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type d'événement *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez un type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="personal">Personnel</SelectItem>
                                    <SelectItem value="clas">CLAS</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Sélection CLAS (si type = clas ET coordinateur) */}
                {ownerType === "clas" && isCoordinator && (
                    <FormField
                        control={form.control}
                        name="owner_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CLAS *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingClas ? "Chargement..." : "Sélectionnez un CLAS"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isLoadingClas ? (
                                            <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                        ) : userClasList.length > 0 ? (
                                            userClasList.map((clas) => (
                                                <SelectItem key={clas.id} value={clas.id}>
                                                    {clas.name}
                                                    {clas.role && (
                                                        <span className="text-muted-foreground ml-2">
                                                            ({clas.role === 'coordinator' ? 'Coordinateur' : 'Animateur'})
                                                        </span>
                                                    )}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-clas" disabled>
                                                {isAdmin ? "Aucun CLAS dans le système" : "Vous n'êtes coordinateur d'aucun CLAS"}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    {isAdmin
                                        ? "Tous les CLAS du système sont disponibles"
                                        : "Sélectionnez le CLAS concerné par cet événement"}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Info CLAS pour animator */}
                {ownerType === "clas" && !isCoordinator && (
                    <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                            {isLoadingClas ? (
                                "Chargement de votre CLAS..."
                            ) : userClasList.length > 0 ? (
                                <>
                                    CLAS : <span className="font-medium text-foreground">{userClasList[0].name}</span>
                                    {userClasList[0].role && (
                                        <span className="ml-2">
                                            ({userClasList[0].role === 'coordinator' ? 'Coordinateur' : 'Animateur'})
                                        </span>
                                    )}
                                </>
                            ) : (
                                "Aucun CLAS associé à votre compte"
                            )}
                        </p>
                    </div>
                )}

                {/* Lieu */}
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lieu</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Salle 101" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Toute la journée */}
                <FormField
                    control={form.control}
                    name="all_day"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Toute la journée</FormLabel>
                                <FormDescription>
                                    L'événement dure toute la journée
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Date et heure de début */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date de début *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="datetime-local"
                                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                        onChange={(e) => field.onChange(new Date(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="end_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date de fin *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="datetime-local"
                                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                        onChange={(e) => field.onChange(new Date(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Statut */}
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Statut</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez un statut" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="confirmed">Confirmé</SelectItem>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="cancelled">Annulé</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Enregistrement..." : mode === "create" ? "Créer" : "Mettre à jour"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
