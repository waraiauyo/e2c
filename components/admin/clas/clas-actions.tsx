"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, Pencil, Eye, FolderKanban, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
import { deleteClasAction } from "@/lib/actions/admin-clas";
import { Clas } from "@/types/database";
import { ClasDialog } from "./clas-dialogs";
import { ProjectManagerDialog } from "./project-dialogs";
import { TeamManagerDialog } from "./team-dialogs"; // Import nouveau

interface ClasActionsProps {
  clas: Clas;
}

export function ClasActions({ clas }: ClasActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false); // État nouveau
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteClasAction(clas.id);
      if (result.success) {
        toast.success("CLAS supprimé avec succès");
        setShowDeleteDialog(false);
      } else {
        toast.error("Erreur : " + result.error);
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ClasDialog 
        mode="edit" 
        clas={clas} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />

      <ProjectManagerDialog
        open={showProjectsDialog}
        onOpenChange={setShowProjectsDialog}
        clasId={clas.id}
        clasName={clas.name}
      />

      {/* Nouveau Dialog Team */}
      <TeamManagerDialog
        open={showTeamDialog}
        onOpenChange={setShowTeamDialog}
        clasId={clas.id}
        clasName={clas.name}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => window.location.href = `/clas/${clas.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Voir la page
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowProjectsDialog(true)}>
            <FolderKanban className="mr-2 h-4 w-4" />
            Gérer les projets
          </DropdownMenuItem>
          
          {/* Nouvelle option */}
          <DropdownMenuItem onClick={() => setShowTeamDialog(true)}>
            <Users className="mr-2 h-4 w-4" />
            Gérer l'équipe
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier le CLAS
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce CLAS ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cela supprimera définitivement le centre <strong>{clas.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}