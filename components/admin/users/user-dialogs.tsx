"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Wand2, RefreshCw, Info } from "lucide-react"; // AJOUT de Info

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { createUserAction, updateUserAction } from "@/lib/actions/admin-users";
import { Profile } from "@/types/database";

// --- UTILITAIRE DE GÉNÉRATION DE MDP ---
const generateSecurePassword = () => {
  const length = 16; // On vise 16 caractères pour être large au-dessus des 12 requis
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
  
  // On force au moins un de chaque type pour satisfaire le validateur Zod
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+-=";

  let password = "";
  // 1. On insère les obligatoires
  password += uppers.charAt(Math.floor(Math.random() * uppers.length));
  password += lowers.charAt(Math.floor(Math.random() * lowers.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));

  // 2. On complète avec de l'aléatoire
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // 3. On mélange le tout pour ne pas avoir toujours Maj+Min+Chiffre+Special au début
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const formSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(2, "Requis"),
  lastName: z.string().min(2, "Requis"),
  role: z.enum(["admin", "coordinator", "director", "animator"]),
  password: z.string().optional(),
});

interface UserDialogProps {
  mode: "create" | "edit";
  user?: Profile;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserDialog({ mode, user, open, onOpenChange }: UserDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const showDialog = isControlled ? open : internalOpen;
  const setShowDialog = isControlled ? onOpenChange! : setInternalOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      role: (user?.account_type as any) || "animator",
      password: "",
    },
  });

  // Fonction pour générer et insérer le mot de passe
  const handleGeneratePassword = (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche le submit du formulaire
    const newPassword = generateSecurePassword();
    form.setValue("password", newPassword, { 
      shouldValidate: true, // Lance la validation Zod immédiatement
      shouldDirty: true 
    });
    toast.info("Mot de passe généré et inséré");
  };

  useEffect(() => {
    if (user && mode === "edit") {
      form.reset({
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        role: (user.account_type as any) || "animator",
        password: "",
      });
    }
  }, [user, mode, form]);

  // Reset aussi quand on ferme/ouvre le dialogue en mode création
  useEffect(() => {
    if (!showDialog && mode === "create") {
       form.reset({
        email: "",
        firstName: "",
        lastName: "",
        role: "animator",
        password: ""
       });
    }
  }, [showDialog, mode, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let result;
      
      if (mode === "create") {
        if (!values.password) {
            form.setError("password", { message: "Le mot de passe est requis" });
            return;
        }
        if (values.password.length < 12) {
             form.setError("password", { message: "12 caractères minimum" });
             return;
        }
        
        result = await createUserAction(values as any);
      } else {
        if (!user) return;
        result = await updateUserAction(user.id, values);
      }

      if (result.success) {
        toast.success(result.message);
        setShowDialog(false);
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
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
                </Button>
            ) : (
                <div className="flex items-center w-full cursor-pointer">
                   <Pencil className="mr-2 h-4 w-4" /> Modifier
                </div>
            )}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvel Utilisateur" : "Modifier l'utilisateur"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
             ? "Créez un nouveau compte."
             : "Modifiez les informations personnelles ou le rôle."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="animator">Animateur</SelectItem>
                      <SelectItem value="director">Directeur</SelectItem>
                      <SelectItem value="coordinator">Coordinateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <div className="flex gap-2">
                        <FormControl>
                            <Input 
                                type="text" // On met 'text' temporairement pour voir le mot de passe généré
                                placeholder="Mot de passe..." 
                                {...field} 
                            />
                        </FormControl>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={handleGeneratePassword}
                            title="Générer un mot de passe sécurisé"
                            className="shrink-0"
                        >
                            <Wand2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Min. 12 car., Maj, Min, Chiffre, Spécial.
                    </p>

                    {/* --- AJOUT : Annotation informative --- */}
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            Un email contenant les identifiants de connexion (mot de passe inclus) sera automatiquement envoyé à l&apos;utilisateur lors de la création.
                        </p>
                    </div>
                    {/* -------------------------------------- */}

                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Créer" : "Enregistrer"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}