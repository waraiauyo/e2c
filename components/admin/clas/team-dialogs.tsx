"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Users,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    UserCheck,
    User,
    Mail,
    Phone,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/shadcn/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/shadcn/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/shadcn/form";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Badge } from "@/components/shadcn/badge";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/shadcn/avatar";

import {
    getTeamByClasId,
    getPotentialMembers,
} from "@/lib/supabase/query/team";
import {
    createTeamMemberAction,
    updateTeamMemberAction,
    deleteTeamMemberAction,
} from "@/lib/actions/admin-team";
import type { ClasTeamMember, Profile } from "@/types/database";

// --- Schema de validation ---
const teamMemberSchema = z
    .object({
        role: z.enum(["coordinator", "director", "animator"]),
        profile_id: z.string().nullable().optional(),
        name: z.string().optional(),
        contact_email: z
            .string()
            .email("Email invalide")
            .optional()
            .or(z.literal("")),
        contact_phone: z.string().optional().or(z.literal("")),
        notes: z.string().optional(),
        is_manual: z.boolean(),
    })
    .refine(
        (data) => {
            if (data.is_manual && (!data.name || data.name.length < 2)) {
                return false;
            }
            if (!data.is_manual && !data.profile_id) {
                return false;
            }
            return true;
        },
        {
            message:
                "Veuillez sélectionner un utilisateur ou saisir un nom pour une entrée manuelle",
            path: ["name"],
        }
    );

type TeamFormValues = z.infer<typeof teamMemberSchema>;

interface MemberWithProfile extends ClasTeamMember {
    profile?: Profile | null;
}

// --- Composant Principal ---
interface TeamManagerDialogProps {
    clasId: string;
    clasName: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TeamManagerDialog({
    clasId,
    clasName,
    trigger,
    open,
    onOpenChange,
}: TeamManagerDialogProps) {
    const [members, setMembers] = useState<MemberWithProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMember, setEditingMember] =
        useState<MemberWithProfile | null>(null);
    const [memberToDelete, setMemberToDelete] =
        useState<MemberWithProfile | null>(null);

    const loadTeam = async () => {
        setLoading(true);
        const result = await getTeamByClasId(clasId);
        if (result.members) {
            setMembers(result.members);
        } else {
            toast.error("Erreur chargement équipe");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (open) loadTeam();
    }, [open, clasId]);

    const handleCreate = () => {
        setEditingMember(null);
        setIsFormOpen(true);
    };

    const handleEdit = (member: MemberWithProfile) => {
        setEditingMember(member);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!memberToDelete) return;
        const result = await deleteTeamMemberAction(memberToDelete.id);
        if (result.success) {
            toast.success("Membre retiré");
            loadTeam();
        } else {
            toast.error("Erreur: " + result.error);
        }
        setMemberToDelete(null);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "coordinator":
                return (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
                        Coordinateur
                    </Badge>
                );
            case "director":
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                        Directeur
                    </Badge>
                );
            case "animator":
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                        Animateur
                    </Badge>
                );
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#005E84]">
                        <Users className="w-5 h-5" />
                        Équipe du CLAS : {clasName}
                    </DialogTitle>
                    <DialogDescription>
                        Gérez les coordinateurs, directeurs et animateurs.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end my-2">
                    <Button
                        onClick={handleCreate}
                        size="sm"
                        className="bg-[#005E84] hover:bg-[#004d6e]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un membre
                    </Button>
                </div>

                {/* MODIFICATION ICI : Conteneur avec hauteur max fixe pour le scroll */}
                <div className="rounded-md border relative bg-white">
                    {loading ? (
                        <div className="h-[200px] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#005E84]" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground p-8">
                            <Users className="w-10 h-10 mb-2 opacity-20" />
                            <p>Aucun membre assigné.</p>
                        </div>
                    ) : (
                        // ScrollArea gère maintenant le défilement jusqu'à une hauteur max
                        <ScrollArea className="h-[calc(60vh-100px)] min-h-[300px]">
                            <div className="divide-y">
                                {members.map((member) => {
                                    const displayName = member.profile
                                        ? `${member.profile.first_name} ${member.profile.last_name}`
                                        : member.name;
                                    const displayEmail =
                                        member.profile?.email ||
                                        member.contact_email;
                                    const avatarUrl =
                                        member.profile?.avatar_url;

                                    return (
                                        <div
                                            key={member.id}
                                            className="p-4 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-slate-200">
                                                    <AvatarImage
                                                        src={
                                                            avatarUrl ||
                                                            undefined
                                                        }
                                                    />
                                                    <AvatarFallback className="bg-[#005E84] text-white text-xs">
                                                        {getInitials(
                                                            displayName || "M"
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-[#1E3231]">
                                                            {displayName}
                                                        </span>
                                                        {getRoleBadge(
                                                            member.role
                                                        )}
                                                        {member.profile ? (
                                                            <div
                                                                title="Compte lié"
                                                                className="flex items-center"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                title="Entrée manuelle"
                                                                className="flex items-center"
                                                            >
                                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        {displayEmail && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />{" "}
                                                                {displayEmail}
                                                            </span>
                                                        )}
                                                        {member.contact_phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />{" "}
                                                                {
                                                                    member.contact_phone
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                    {member.notes && (
                                                        <p className="text-xs text-slate-500 italic mt-1">
                                                            "{member.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleEdit(member)
                                                    }
                                                >
                                                    <Pencil className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setMemberToDelete(
                                                            member
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Form Dialog */}
                <TeamFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    clasId={clasId}
                    memberToEdit={editingMember}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        loadTeam();
                    }}
                />

                {/* Delete Alert */}
                <AlertDialog
                    open={!!memberToDelete}
                    onOpenChange={(v) => !v && setMemberToDelete(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Retirer ce membre ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action retirera cette personne de l'équipe
                                du CLAS.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Retirer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}

// --- Sous-composant Formulaire ---
interface TeamFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clasId: string;
    memberToEdit: MemberWithProfile | null;
    onSuccess: () => void;
}

function TeamFormDialog({
    open,
    onOpenChange,
    clasId,
    memberToEdit,
    onSuccess,
}: TeamFormDialogProps) {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamMemberSchema),
        defaultValues: {
            role: "animator",
            is_manual: false,
            name: "",
            contact_email: "",
            contact_phone: "",
            notes: "",
            profile_id: null,
        },
    });

    const isManual = form.watch("is_manual");

    useEffect(() => {
        getPotentialMembers().then((res) => {
            if (res.profiles) setProfiles(res.profiles);
        });
    }, []);

    useEffect(() => {
        if (open) {
            if (memberToEdit) {
                // Mode Edition
                const isManualEdit = !memberToEdit.profile_id;
                form.reset({
                    role: memberToEdit.role as any,
                    is_manual: isManualEdit,
                    name: memberToEdit.name || "",
                    contact_email: memberToEdit.contact_email || "",
                    contact_phone: memberToEdit.contact_phone || "",
                    notes: memberToEdit.notes || "",
                    profile_id: memberToEdit.profile_id || null,
                });
            } else {
                // Mode Création (reset)
                form.reset({
                    role: "animator",
                    is_manual: false,
                    name: "",
                    contact_email: "",
                    contact_phone: "",
                    notes: "",
                    profile_id: null,
                });
            }
        }
    }, [open, memberToEdit, form]);

    const onSubmit = async (values: TeamFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                role: values.role,
                notes: values.notes || null,
                profile_id: values.is_manual
                    ? null
                    : (values.profile_id ?? null),
                name: values.is_manual ? (values.name ?? null) : null,
                contact_email: values.is_manual
                    ? values.contact_email || null
                    : null,
                contact_phone: values.is_manual
                    ? values.contact_phone || null
                    : null,
            };

            if (memberToEdit) {
                const res = await updateTeamMemberAction({
                    id: memberToEdit.id,
                    ...payload,
                });
                if (res.success) {
                    toast.success("Membre mis à jour");
                    onSuccess();
                } else {
                    toast.error("Erreur: " + res.error);
                }
            } else {
                const res = await createTeamMemberAction({
                    clas_id: clasId,
                    ...payload,
                });
                if (res.success) {
                    toast.success("Membre ajouté");
                    onSuccess();
                } else {
                    toast.error("Erreur: " + res.error);
                }
            }
        } catch (e) {
            toast.error("Une erreur est survenue");
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {memberToEdit
                            ? "Modifier le membre"
                            : "Ajouter un membre"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* Toggle Mode (Uniquement en création) */}
                        {!memberToEdit && (
                            <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-slate-50">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Mode manuel
                                    </FormLabel>
                                    <FormDescription>
                                        Activer si la personne n'a pas de compte
                                        sur l'application.
                                    </FormDescription>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="is_manual"
                                    render={({ field }) => (
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    )}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rôle</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="coordinator">
                                                    Coordinateur
                                                </SelectItem>
                                                <SelectItem value="director">
                                                    Directeur
                                                </SelectItem>
                                                <SelectItem value="animator">
                                                    Animateur
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {isManual ? (
                            <>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom complet *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Jean Dupont"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contact_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Email (optionnel)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="jean@example.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contact_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Téléphone (optionnel)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="06..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        ) : (
                            <FormField
                                control={form.control}
                                name="profile_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Utilisateur lié *</FormLabel>
                                        <Select
                                            // On modifie ici pour intercepter le changement
                                            onValueChange={(value) => {
                                                field.onChange(value); // On garde le comportement normal

                                                // --- LOGIQUE D'AUTO-COMPLETION DU ROLE ---
                                                const selectedProfile =
                                                    profiles.find(
                                                        (p) => p.id === value
                                                    );
                                                if (selectedProfile) {
                                                    // On vérifie si le type de compte correspond à un rôle d'équipe valide
                                                    if (
                                                        [
                                                            "coordinator",
                                                            "director",
                                                            "animator",
                                                        ].includes(
                                                            selectedProfile.account_type
                                                        )
                                                    ) {
                                                        // On force le changement du champ rôle
                                                        form.setValue(
                                                            "role",
                                                            selectedProfile.account_type as
                                                                | "coordinator"
                                                                | "director"
                                                                | "animator"
                                                        );

                                                        // Petit feedback visuel sympa
                                                        toast.info(
                                                            `Rôle défini sur "${selectedProfile.account_type}" selon le profil utilisateur`
                                                        );
                                                    }
                                                }
                                            }}
                                            value={field.value || undefined}
                                            disabled={
                                                !!memberToEdit &&
                                                !memberToEdit.profile_id
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Rechercher un utilisateur..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {profiles.map((p) => (
                                                    <SelectItem
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {/* On affiche le rôle actuel entre parenthèses pour aider */}
                                                        {p.first_name}{" "}
                                                        {p.last_name} (
                                                        {p.account_type})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Info complémentaire (ex: bénévole du mardi)"
                                            className="resize-none h-20"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#005E84] hover:bg-[#004d6e]"
                            >
                                {isSubmitting && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                {memberToEdit ? "Enregistrer" : "Ajouter"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
