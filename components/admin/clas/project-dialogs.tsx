"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FolderKanban, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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

import { getProjectsByClasId } from "@/lib/supabase/query/projects";
import {
    createClasProjectAction,
    updateClasProjectAction,
    deleteClasProjectAction,
} from "@/lib/actions/admin-projects";
import type { ClasProject } from "@/types/database";

// --- Schema de validation ---
const projectSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    year: z.string().min(4, "L'année est requise (ex: 2024-2025)"),
    // CORRECTION ICI : Suppression des options { required_error: ... } qui causaient l'erreur
    status: z.enum(["ongoing", "finished"]),
    description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

// --- Composant Principal : Gestionnaire de Projets ---
interface ProjectManagerDialogProps {
    clasId: string;
    clasName: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ProjectManagerDialog({
    clasId,
    clasName,
    trigger,
    open,
    onOpenChange,
}: ProjectManagerDialogProps) {
    const [projects, setProjects] = useState<ClasProject[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ClasProject | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<ClasProject | null>(null);

    // Charger les projets à l'ouverture
    const loadProjects = async () => {
        setLoading(true);
        const result = await getProjectsByClasId(clasId);
        if (result.projects) {
            setProjects(result.projects);
        } else {
            toast.error("Erreur lors du chargement des projets");
        }
        setLoading(false);
    };

    // Charger quand le dialogue s'ouvre
    useEffect(() => {
        if (open) {
            loadProjects();
        }
    }, [open, clasId]);

    const handleCreate = () => {
        setEditingProject(null);
        setIsFormOpen(true);
    };

    const handleEdit = (project: ClasProject) => {
        setEditingProject(project);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!projectToDelete) return;

        const result = await deleteClasProjectAction(projectToDelete.id);
        if (result.success) {
            toast.success("Projet supprimé");
            loadProjects(); // Recharger la liste
        } else {
            toast.error("Erreur : " + result.error);
        }
        setProjectToDelete(null);
    };

    const onFormSuccess = () => {
        setIsFormOpen(false);
        loadProjects(); // Recharger la liste
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#005E84]">
                        <FolderKanban className="w-5 h-5" />
                        Projets du CLAS : {clasName}
                    </DialogTitle>
                    <DialogDescription>
                        Gérez les projets, leur statut et leur historique.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end my-2">
                    <Button onClick={handleCreate} size="sm" className="bg-[#005E84] hover:bg-[#004d6e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un projet
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden min-h-[300px] relative rounded-md border">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                            <Loader2 className="w-8 h-8 animate-spin text-[#005E84]" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <FolderKanban className="w-10 h-10 mb-2 opacity-20" />
                            <p>Aucun projet pour ce CLAS.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="divide-y">
                                {projects.map((project) => (
                                    <div key={project.id} className="p-4 hover:bg-slate-50 flex items-start justify-between group transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[#1E3231]">
                                                    {project.name}
                                                </span>
                                                <Badge 
                                                    variant={project.status === 'ongoing' ? "default" : "secondary"}
                                                    className={project.status === 'ongoing' ? "bg-[#E9B44C] text-[#1E3231] hover:bg-[#d8a035]" : ""}
                                                >
                                                    {project.status === 'ongoing' ? 'En cours' : 'Terminé'}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {project.year}
                                                </Badge>
                                            </div>
                                            {project.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(project)}
                                                title="Modifier"
                                            >
                                                <Pencil className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setProjectToDelete(project)}
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* --- Dialogue Formulaire (Ajout/Edit) --- */}
                <ProjectFormDialog 
                    open={isFormOpen} 
                    onOpenChange={setIsFormOpen}
                    clasId={clasId}
                    projectToEdit={editingProject}
                    onSuccess={onFormSuccess}
                />

                {/* --- Alerte Suppression --- */}
                <AlertDialog open={!!projectToDelete} onOpenChange={(val) => !val && setProjectToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action supprimera définitivement le projet "{projectToDelete?.name}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}

// --- Sous-composant : Formulaire ---
interface ProjectFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clasId: string;
    projectToEdit: ClasProject | null;
    onSuccess: () => void;
}

function ProjectFormDialog({ open, onOpenChange, clasId, projectToEdit, onSuccess }: ProjectFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: "",
            year: "",
            status: "ongoing",
            description: "",
        },
    });

    // Reset du formulaire quand on ouvre/change de projet
    useEffect(() => {
        if (open) {
            form.reset({
                name: projectToEdit?.name || "",
                year: projectToEdit?.year || "2024-2025",
                status: projectToEdit?.status || "ongoing",
                description: projectToEdit?.description || "",
            });
        }
    }, [open, projectToEdit, form]);

    const onSubmit = async (values: ProjectFormValues) => {
        setIsSubmitting(true);
        try {
            // Conversion explicite pour Supabase
            const formattedValues = {
                name: values.name,
                year: values.year,
                status: values.status,
                description: values.description || null,
            };

            if (projectToEdit) {
                // UPDATE
                const result = await updateClasProjectAction({
                    id: projectToEdit.id,
                    ...formattedValues,
                });
                if (result.success) {
                    toast.success("Projet mis à jour");
                    onSuccess();
                } else {
                    toast.error("Erreur: " + result.error);
                }
            } else {
                // CREATE
                const result = await createClasProjectAction({
                    clas_id: clasId,
                    ...formattedValues,
                });
                if (result.success) {
                    toast.success("Projet créé");
                    onSuccess();
                } else {
                    toast.error("Erreur: " + result.error);
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
                    <DialogTitle>{projectToEdit ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom du projet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Fresque murale..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Année / Période</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 2024-2025" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Statut</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ongoing">En cours</SelectItem>
                                                <SelectItem value="finished">Terminé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Détails du projet..." 
                                            className="resize-none h-24"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-[#005E84] hover:bg-[#004d6e]">
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {projectToEdit ? "Enregistrer" : "Créer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}