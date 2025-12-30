"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, type EventFormValues } from "@/lib/planning/schemas";
import { useAppSelector } from "@/lib/redux/hooks";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/shadcn/popover";
import { Badge } from "@/components/shadcn/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/shadcn/command";
import { Check } from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/shadcn/form";
import { Users, X } from "lucide-react";
import { format } from "date-fns";
import {
    type Event,
    type TargetRole,
    ROLE_LABELS,
    ROLE_COLORS,
} from "@/lib/planning/types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EventFormProps {
    mode: "create" | "edit";
    event?: Event;
    initialDate?: Date;
    onSubmit: (data: EventFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ALL_ROLES: TargetRole[] = ["animator", "coordinator", "director"];

export function EventForm({
    mode,
    event,
    initialDate,
    onSubmit,
    onCancel,
    isLoading,
}: EventFormProps) {
    const { profile, user } = useAppSelector((state) => state.user);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [participantSearch, setParticipantSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<
        "all" | "admin" | "coordinator" | "director" | "animator"
    >("all");

    const isAdmin = profile?.account_type === "admin";
    const isCoordinator =
        profile?.account_type === "coordinator" ||
        profile?.account_type === "director" ||
        isAdmin;
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
                  target_roles: event.target_roles,
                  status: event.status,
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
                  // Animateurs ne peuvent créer que pour leur rôle
                  target_roles: isCoordinator ? ["animator"] : ["animator"],
                  status: "confirmed",
                  participant_ids: [],
              };

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues,
    });

    const allDay = form.watch("all_day");
    const targetRoles = form.watch("target_roles");

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

    // Pour les animateurs, forcer target_roles à ["animator"]
    useEffect(() => {
        if (!isCoordinator) {
            form.setValue("target_roles", ["animator"]);
        }
    }, [isCoordinator, form]);

    const handleRoleToggle = (role: TargetRole, checked: boolean) => {
        const current = form.getValues("target_roles") || [];
        if (checked) {
            form.setValue("target_roles", [...current, role]);
        } else {
            // Ne pas permettre de tout désélectionner
            const newRoles = current.filter((r) => r !== role);
            if (newRoles.length > 0) {
                form.setValue("target_roles", newRoles);
            }
        }
    };

    const selectAllRoles = () => {
        form.setValue("target_roles", [...ALL_ROLES]);
    };

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

                {/* Sélection des rôles cibles */}
                <FormField
                    control={form.control}
                    name="target_roles"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Destinataires *</FormLabel>
                            {isCoordinator ? (
                                <>
                                    <div className="space-y-3">
                                        {/* Bouton Tous */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={selectAllRoles}
                                            className={cn(
                                                "w-full",
                                                field.value?.length === 3 &&
                                                    "bg-muted"
                                            )}
                                        >
                                            {field.value?.length === 3
                                                ? "Tous sélectionnés"
                                                : "Sélectionner tous"}
                                        </Button>

                                        {/* Checkboxes pour chaque rôle */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {ALL_ROLES.map((role) => {
                                                const isChecked =
                                                    field.value?.includes(role);
                                                return (
                                                    <button
                                                        key={role}
                                                        type="button"
                                                        className={cn(
                                                            "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-left",
                                                            isChecked
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:bg-muted/50"
                                                        )}
                                                        onClick={() =>
                                                            handleRoleToggle(
                                                                role,
                                                                !isChecked
                                                            )
                                                        }
                                                    >
                                                        <div
                                                            className={cn(
                                                                "h-4 w-4 shrink-0 rounded-sm border transition-colors",
                                                                isChecked
                                                                    ? "bg-primary border-primary"
                                                                    : "border-input"
                                                            )}
                                                        >
                                                            {isChecked && (
                                                                <Check className="h-4 w-4 text-primary-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        ROLE_COLORS[
                                                                            role
                                                                        ],
                                                                }}
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {
                                                                    ROLE_LABELS[
                                                                        role
                                                                    ]
                                                                }
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <FormDescription>
                                        Sélectionnez les rôles qui verront cet
                                        événement. La couleur sera définie
                                        automatiquement.
                                    </FormDescription>
                                </>
                            ) : (
                                /* Animateur : rôle fixé automatiquement */
                                <div className="p-3 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    ROLE_COLORS.animator,
                                            }}
                                        />
                                        <span className="text-sm">
                                            Cet événement sera visible par les{" "}
                                            <strong>Animateurs</strong>
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        En tant qu'animateur, vous ne pouvez
                                        créer que des événements pour votre
                                        rôle.
                                    </p>
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Aperçu de la couleur */}
                {targetRoles && targetRoles.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: targetRoles.includes(
                                    "director"
                                )
                                    ? ROLE_COLORS.director
                                    : targetRoles.includes("coordinator")
                                      ? ROLE_COLORS.coordinator
                                      : ROLE_COLORS.animator,
                            }}
                        />
                        <span className="text-sm text-muted-foreground">
                            Couleur de l'événement :{" "}
                            {targetRoles.includes("director")
                                ? "Orange (Directeur)"
                                : targetRoles.includes("coordinator")
                                  ? "Vert (Coordinateur)"
                                  : "Bleu (Animateur)"}
                        </span>
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

                {/* Participants */}
                {(mode === "create" || mode === "edit") && (
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
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Rechercher un participant..."
                                                value={participantSearch}
                                                onValueChange={
                                                    setParticipantSearch
                                                }
                                            />

                                            {/* Filtres par rôle */}
                                            <div className="flex flex-wrap gap-1 px-3 py-2 border-b">
                                                {[
                                                    {
                                                        value: "all",
                                                        label: "Tous",
                                                    },
                                                    {
                                                        value: "coordinator",
                                                        label: "Coord.",
                                                    },
                                                    {
                                                        value: "director",
                                                        label: "Dir.",
                                                    },
                                                    {
                                                        value: "animator",
                                                        label: "Anim.",
                                                    },
                                                    {
                                                        value: "admin",
                                                        label: "Admin",
                                                    },
                                                ].map((role) => (
                                                    <button
                                                        key={role.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setRoleFilter(
                                                                role.value as typeof roleFilter
                                                            )
                                                        }
                                                        className={cn(
                                                            "px-2 py-1 text-xs rounded-md transition-colors",
                                                            roleFilter ===
                                                                role.value
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                                        )}
                                                    >
                                                        {role.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Badges des participants sélectionnés */}
                                            {field.value &&
                                                field.value.length > 0 && (
                                                    <div className="px-3 py-2 border-b bg-muted/30">
                                                        <div className="text-xs font-medium text-muted-foreground mb-2">
                                                            Sélectionnés (
                                                            {field.value.length}
                                                            )
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {field.value.map(
                                                                (
                                                                    participantId
                                                                ) => {
                                                                    const participant =
                                                                        allUsers.find(
                                                                            (
                                                                                u
                                                                            ) =>
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
                                                                            className="gap-1 text-xs"
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
                                                                                    e.stopPropagation();
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
                                                                                className="ml-1 hover:text-destructive rounded-full"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </Badge>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            <CommandList
                                                className="max-h-[240px] overscroll-contain"
                                                onWheel={(e) =>
                                                    e.stopPropagation()
                                                }
                                                onTouchMove={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <CommandEmpty>
                                                    <div className="py-4">
                                                        <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                                        <p className="text-sm text-muted-foreground">
                                                            {participantSearch.trim() ||
                                                            roleFilter !== "all"
                                                                ? "Aucun utilisateur trouvé"
                                                                : "Aucun utilisateur disponible"}
                                                        </p>
                                                        {roleFilter !==
                                                            "all" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setRoleFilter(
                                                                        "all"
                                                                    )
                                                                }
                                                                className="text-xs text-primary hover:underline mt-2"
                                                            >
                                                                Réinitialiser le
                                                                filtre
                                                            </button>
                                                        )}
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {allUsers
                                                        .filter(
                                                            (u) =>
                                                                u.id !== userId
                                                        )
                                                        .filter((user) => {
                                                            // Filtre par rôle
                                                            if (
                                                                roleFilter !==
                                                                    "all" &&
                                                                user.account_type !==
                                                                    roleFilter
                                                            ) {
                                                                return false;
                                                            }
                                                            // Filtre par recherche
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
                                                                <CommandItem
                                                                    key={
                                                                        user.id
                                                                    }
                                                                    value={
                                                                        user.id
                                                                    }
                                                                    onSelect={() => {
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
                                                                    className="cursor-pointer"
                                                                >
                                                                    <div
                                                                        className={cn(
                                                                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                            isSelected
                                                                                ? "bg-primary text-primary-foreground"
                                                                                : "opacity-50"
                                                                        )}
                                                                    >
                                                                        {isSelected && (
                                                                            <Check className="h-3 w-3" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 ml-2">
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
                                                                    </div>
                                                                    {user.account_type && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {user.account_type ===
                                                                            "admin"
                                                                                ? "Admin"
                                                                                : user.account_type ===
                                                                                    "coordinator"
                                                                                  ? "Coord."
                                                                                  : user.account_type ===
                                                                                      "director"
                                                                                    ? "Dir."
                                                                                    : "Anim."}
                                                                        </span>
                                                                    )}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
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
