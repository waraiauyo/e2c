"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, MapPin } from "lucide-react";

import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createClasAction, updateClasAction } from "@/lib/actions/admin-clas";
import { Clas } from "@/types/database";

const formSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  location: z.string().min(5, "Adresse requise"),
  grade_level: z.enum(["primary", "middle_school"]),
  capacity: z.string().optional(),
  current_project: z.string().optional(),
  public_description: z.string().optional(),
  schedule: z.string().optional(),
});

interface ClasDialogProps {
  mode: "create" | "edit";
  clas?: Clas;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClasDialog({ mode, clas, open, onOpenChange }: ClasDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const showDialog = isControlled ? open : internalOpen;
  const setShowDialog = isControlled ? onOpenChange! : setInternalOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: clas?.name || "",
      location: clas?.location || "",
      grade_level: clas?.grade_level || "primary",
      capacity: clas?.capacity || "",
      current_project: clas?.current_project || "",
      public_description: clas?.public_description || "",
      schedule: clas?.schedule || "",
    },
  });

  // Reset du formulaire quand la prop clas change
  useEffect(() => {
    if (clas && mode === "edit") {
      form.reset({
        name: clas.name,
        location: clas.location || "",
        grade_level: clas.grade_level,
        capacity: clas.capacity || "",
        current_project: clas.current_project || "",
        public_description: clas.public_description || "",
        schedule: clas.schedule || "",
      });
    }
  }, [clas, mode, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let result;
      
      if (mode === "create") {
        result = await createClasAction(values);
      } else {
        if (!clas) return;
        result = await updateClasAction(clas.id, values);
      }

      if (result.success) {
        toast.success(result.message);
        setShowDialog(false);
        if (mode === "create") form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error("Erreur inattendue");
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      {!isControlled && (
        <DialogTrigger asChild>
          {mode === "create" ? (
            <Button className="w-full sm:w-auto shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Ajouter un CLAS
            </Button>
          ) : (
            <div className="flex items-center w-full cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </div>
          )}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouveau Centre CLAS" : "Modifier le CLAS"}</DialogTitle>
          <DialogDescription>
            Remplissez les informations du centre. Les coordonnées GPS seront calculées automatiquement via l'adresse.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du centre</FormLabel>
                  <FormControl><Input placeholder="ex: CLAS Laval Centre" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau scolaire</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">Primaire</SelectItem>
                        <SelectItem value="middle_school">Collège</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacité (élèves)</FormLabel>
                    <FormControl><Input placeholder="ex: 15" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse complète</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="ex: 12 rue de la Paix, 53000 Laval" {...field} />
                    </div>
                  </FormControl>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Sert au calcul automatique de la position sur la carte.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projet en cours (Optionnel)</FormLabel>
                  <FormControl><Input placeholder="ex: Fresque murale" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horaires (Optionnel)</FormLabel>
                  <FormControl><Input placeholder="ex: Mar/Jeu 16h-18h" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="public_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description publique</FormLabel>
                  <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Créer le centre" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}