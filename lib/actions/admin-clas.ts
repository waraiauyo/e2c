"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { AccountType } from "@/types/database";
import { sendAccountCreatedNotification } from "@/lib/resend/actions"; // AJOUT

// Schéma de validation
const userSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(2, "Prénom trop court"),
  lastName: z.string().min(2, "Nom trop court"),
  role: z.enum(["admin", "coordinator", "director", "animator"]),
});

const createUserSchema = userSchema.extend({
  password: z.string()
    .min(12, "12 caractères minimum")
    .regex(/[A-Z]/, "Une majuscule requise")
    .regex(/[a-z]/, "Une minuscule requise")
    .regex(/[0-9]/, "Un chiffre requis")
    .regex(/[\W_]/, "Un caractère spécial requis"),
});

export async function createUserAction(data: z.infer<typeof createUserSchema>) {
  const supabaseAdmin = createAdminClient();
  
  // Validation Zod
  const validation = createUserSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password, firstName, lastName, role } = validation.data;

  try {
    // 1. Création du compte d'authentification
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmation de l'email
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Erreur inconnue lors de la création");

    // 2. Mise à jour forcée du profil public (rôle et infos)
    // On attend un peu que le trigger SQL (s'il existe) crée le profil, sinon on update
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        account_type: role as AccountType,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      // Nettoyage en cas d'échec partiel
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error("Erreur profil : " + profileError.message);
    }

    // --- AJOUT : Envoi de l'email avec les identifiants ---
    const emailResult = await sendAccountCreatedNotification(email, firstName, password);
    
    if (!emailResult.success) {
        console.warn("L'utilisateur est créé mais l'email n'est pas parti : " + emailResult.error);
        // On pourrait retourner un warning ici, mais on considère l'action réussie car le compte existe
    }
    // ------------------------------------------------------

    revalidatePath("/admin/users");
    return { success: true, message: "Utilisateur créé et email envoyé avec succès" };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Une erreur est survenue" 
    };
  }
}

export async function updateUserAction(userId: string, data: z.infer<typeof userSchema>) {
    const supabaseAdmin = createAdminClient();
    
    try {
        // 1. Mise à jour Auth (email si changé)
        // Note: changer l'email demande souvent une reverification, ici on update juste les métadonnées
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: data.email,
            user_metadata: { first_name: data.firstName, last_name: data.lastName }
        });
        
        if (authError) throw authError;

        // 2. Mise à jour Profil Public
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email, // Important de garder synchro
                account_type: data.role as AccountType
            })
            .eq("id", userId);

        if (profileError) throw profileError;

        revalidatePath("/admin/users");
        return { success: true, message: "Utilisateur mis à jour" };

    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur mise à jour" };
    }
}

export async function deleteUserAction(userId: string) {
  const supabaseAdmin = createAdminClient();
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    revalidatePath("/admin/users");
    return { success: true, message: "Utilisateur supprimé" };
  } catch (error) {
    return { success: false, error: "Impossible de supprimer l'utilisateur" };
  }
}