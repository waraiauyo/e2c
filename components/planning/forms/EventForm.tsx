"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, type EventFormValues } from "@/lib/planning/schemas";
import { useAppSelector } from "@/lib/redux/hooks";
import { getAllClas, getUserClasWithRoles } from "@/lib/supabase/query/clas";
import { getAllUsers, type UserProfile } from "@/lib/supabase/query/profiles";
import { getEventParticipants } from "@/lib/supabase/query/events";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/shadcn/popover";
import { Badge } from "@/components/shadcn/badge";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/shadcn/form";
import {
    Calendar as CalendarIcon,
    Clock,
    Search,
    Users,
    X,
} from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/lib/planning/types";
import type { FilterContext } from "@/components/planning/sidebar/FilterSidebar";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EventFormProps {
    mode: "create" | "edit";
    event?: Event;
    initialDate?: Date;
    filterContext?: FilterContext | null;
    onSubmit: (data: EventFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function EventForm({
    mode,
    event,
    initialDate,
    filterContext,
    onSubmit,
    onCancel,
    isLoading,
}: EventFormProps) {
    const { profile, user } = useAppSelector((state) => state.user);
    const [userClasList, setUserClasList] = useState<
        { id: string; name: string; role?: string }[]
    >([]);
    const [isLoadingClas, setIsLoadingClas] = useState(false);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [participantSearch, setParticipantSearch] = useState("");

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
    const defaultValues: EventFormValues =
        mode === "edit" && event
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
                  end_time: initialDate
                      ? new Date(initialDate.getTime() + 60 * 60 * 1000)
                      : new Date(Date.now() + 60 * 60 * 1000),
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
                        setUserClasList(
                            result.clas.map((c) => ({ id: c.id, name: c.name }))
                        );
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

    // Charger tous les utilisateurs pour la sélection de participants
    useEffect(() => {
        async function loadUsers() {
            setIsLoadingUsers(true);
            try {
                const users = await getAllUsers();
                setAllUsers(users);
            } catch (error) {
                console.error(
                    "Erreur lors du chargement des utilisateurs:",
                    error
                );
            } finally {
                setIsLoadingUsers(false);
            }
        }
        loadUsers();
    }, []);

    // Charger les participants existants en mode édition
    useEffect(() => {
        async function loadParticipants() {
            if (mode === "edit" && event?.id) {
                try {
                    const participants = await getEventParticipants(event.id);
                    const participantIds = participants.map(
                        (p) => p.profile_id
                    );
                    form.setValue("participant_ids", participantIds);
                } catch (error) {
                    console.error(
                        "Erreur lors du chargement des participants:",
                        error
                    );
                }
            }
        }
        loadParticipants();
    }, [mode, event?.id, form]);

    // Mettre à jour owner_id quand le type change
    useEffect(() => {
        if (ownerType === "personal") {
            form.setValue("owner_id", userId);
        } else if (
            ownerType === "clas" &&
            !isCoordinator &&
            userClasList.length > 0
        ) {
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
                                <Input
                                    placeholder="Ex: Réunion d'équipe"
                                    {...field}
                                />
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
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez un type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="personal">
                                        Personnel
                                    </SelectItem>
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
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    isLoadingClas
                                                        ? "Chargement..."
                                                        : "Sélectionnez un CLAS"
                                                }
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isLoadingClas ? (
                                            <SelectItem
                                                value="loading"
                                                disabled
                                            >
                                                Chargement...
                                            </SelectItem>
                                        ) : userClasList.length > 0 ? (
                                            userClasList.map((clas) => (
                                                <SelectItem
                                                    key={clas.id}
                                                    value={clas.id}
                                                >
                                                    {clas.name}
                                                    {clas.role && (
                                                        <span className="text-muted-foreground ml-2">
                                                            (
                                                            {clas.role ===
                                                            "coordinator"
                                                                ? "Coordinateur"
                                                                : "Animateur"}
                                                            )
                                                        </span>
                                                    )}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem
                                                value="no-clas"
                                                disabled
                                            >
                                                {isAdmin
                                                    ? "Aucun CLAS dans le système"
                                                    : "Vous n'êtes coordinateur d'aucun CLAS"}
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
                                    CLAS :{" "}
                                    <span className="font-medium text-foreground">
                                        {userClasList[0].name}
                                    </span>
                                    {userClasList[0].role && (
                                        <span className="ml-2">
                                            (
                                            {userClasList[0].role ===
                                            "coordinator"
                                                ? "Coordinateur"
                                                : "Animateur"}
                                            )
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
                                <Input
                                    placeholder="Ex: Salle 101"
                                    {...field}
                                    value={field.value || ""}
                                />
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
                                <FormLabel className="text-base">
                                    Toute la journée
                                </FormLabel>
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
                                        value={
                                            field.value
                                                ? format(
                                                      field.value,
                                                      "yyyy-MM-dd'T'HH:mm"
                                                  )
                                                : ""
                                        }
                                        onChange={(e) =>
                                            field.onChange(
                                                new Date(e.target.value)
                                            )
                                        }
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
                                        value={
                                            field.value
                                                ? format(
                                                      field.value,
                                                      "yyyy-MM-dd'T'HH:mm"
                                                  )
                                                : ""
                                        }
                                        onChange={(e) =>
                                            field.onChange(
                                                new Date(e.target.value)
                                            )
                                        }
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
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez un statut" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="confirmed">
                                        Confirmé
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        En attente
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        Annulé
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Participants - Visible uniquement pour les coordinateurs et créateurs */}
                {(isCoordinator ||
                    mode === "create" ||
                    (mode === "edit" &&
                        event?.owner_type === "personal" &&
                        event?.owner_id === userId)) && (
                    <FormField
                        control={form.control}
                        name="participant_ids"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Participants</FormLabel>
                                <FormDescription>
                                    Invitez d'autres utilisateurs à participer à
                                    cet événement
                                </FormDescription>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between",
                                                    !field.value?.length &&
                                                        "text-muted-foreground"
                                                )}
                                                disabled={isLoadingUsers}
                                            >
                                                {isLoadingUsers ? (
                                                    "Chargement..."
                                                ) : field.value?.length ? (
                                                    <span className="flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        {field.value.length}{" "}
                                                        participant
                                                        {field.value.length > 1
                                                            ? "s"
                                                            : ""}{" "}
                                                        sélectionné
                                                        {field.value.length > 1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        Sélectionner des
                                                        participants
                                                    </span>
                                                )}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-[400px] p-0"
                                        align="start"
                                    >
                                        {/* Champ de recherche */}
                                        <div className="p-3 border-b">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Rechercher un participant..."
                                                    value={participantSearch}
                                                    onChange={(e) =>
                                                        setParticipantSearch(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-4">
                                            {/* Badges des participants sélectionnés */}
                                            {field.value &&
                                                field.value.length > 0 && (
                                                    <div className="mb-4 flex flex-wrap gap-2">
                                                        {field.value.map(
                                                            (participantId) => {
                                                                const participant =
                                                                    allUsers.find(
                                                                        (u) =>
                                                                            u.id ===
                                                                            participantId
                                                                    );
                                                                if (
                                                                    !participant
                                                                )
                                                                    return null;
                                                                return (
                                                                    <Badge
                                                                        key={
                                                                            participantId
                                                                        }
                                                                        variant="secondary"
                                                                        className="gap-1"
                                                                    >
                                                                        {participant.first_name &&
                                                                        participant.last_name
                                                                            ? `${participant.first_name} ${participant.last_name}`
                                                                            : participant.email}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.preventDefault();
                                                                                field.onChange(
                                                                                    field.value?.filter(
                                                                                        (
                                                                                            id
                                                                                        ) =>
                                                                                            id !==
                                                                                            participantId
                                                                                    ) ||
                                                                                        []
                                                                                );
                                                                            }}
                                                                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                                                                        >
                                                                            <X className="h-3 w-3 cursor-pointer" />
                                                                        </button>
                                                                    </Badge>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                )}

                                            {/* Liste des utilisateurs */}
                                            <div className="space-y-2">
                                                {allUsers
                                                    .filter(
                                                        (u) => u.id !== userId
                                                    ) // Ne pas afficher l'utilisateur actuel
                                                    .filter((user) => {
                                                        if (
                                                            !participantSearch.trim()
                                                        )
                                                            return true;
                                                        const searchLower =
                                                            participantSearch.toLowerCase();
                                                        const fullName =
                                                            `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
                                                        const email = (
                                                            user.email || ""
                                                        ).toLowerCase();
                                                        return (
                                                            fullName.includes(
                                                                searchLower
                                                            ) ||
                                                            email.includes(
                                                                searchLower
                                                            )
                                                        );
                                                    })
                                                    .map((user) => {
                                                        const isSelected =
                                                            field.value?.includes(
                                                                user.id
                                                            );
                                                        return (
                                                            <div
                                                                key={user.id}
                                                                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                                                onClick={() => {
                                                                    const currentValues =
                                                                        field.value ||
                                                                        [];
                                                                    if (
                                                                        isSelected
                                                                    ) {
                                                                        field.onChange(
                                                                            currentValues.filter(
                                                                                (
                                                                                    id
                                                                                ) =>
                                                                                    id !==
                                                                                    user.id
                                                                            )
                                                                        );
                                                                    } else {
                                                                        field.onChange(
                                                                            [
                                                                                ...currentValues,
                                                                                user.id,
                                                                            ]
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked
                                                                    ) => {
                                                                        const currentValues =
                                                                            field.value ||
                                                                            [];
                                                                        if (
                                                                            checked
                                                                        ) {
                                                                            field.onChange(
                                                                                [
                                                                                    ...currentValues,
                                                                                    user.id,
                                                                                ]
                                                                            );
                                                                        } else {
                                                                            field.onChange(
                                                                                currentValues.filter(
                                                                                    (
                                                                                        id
                                                                                    ) =>
                                                                                        id !==
                                                                                        user.id
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-sm">
                                                                        {user.first_name &&
                                                                        user.last_name
                                                                            ? `${user.first_name} ${user.last_name}`
                                                                            : user.email}
                                                                    </div>
                                                                    {user.first_name &&
                                                                        user.last_name && (
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {
                                                                                    user.email
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    {user.account_type && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {user.account_type ===
                                                                            "admin"
                                                                                ? "Administrateur"
                                                                                : user.account_type ===
                                                                                    "coordinator"
                                                                                  ? "Coordinateur"
                                                                                  : "Animateur"}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                {allUsers
                                                    .filter(
                                                        (u) => u.id !== userId
                                                    )
                                                    .filter((user) => {
                                                        if (
                                                            !participantSearch.trim()
                                                        )
                                                            return true;
                                                        const searchLower =
                                                            participantSearch.toLowerCase();
                                                        const fullName =
                                                            `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
                                                        const email = (
                                                            user.email || ""
                                                        ).toLowerCase();
                                                        return (
                                                            fullName.includes(
                                                                searchLower
                                                            ) ||
                                                            email.includes(
                                                                searchLower
                                                            )
                                                        );
                                                    }).length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                        {participantSearch.trim()
                                                            ? "Aucun utilisateur trouvé pour cette recherche"
                                                            : "Aucun autre utilisateur disponible"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

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
                        {isLoading
                            ? "Enregistrement..."
                            : mode === "create"
                              ? "Créer"
                              : "Mettre à jour"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
