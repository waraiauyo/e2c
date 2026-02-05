"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server"; // Nécessaire pour mettre à jour le profil
import {
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
} from "@/lib/supabase/query/team";
import type {
    ClasTeamMemberInsert,
    ClasTeamMemberUpdate,
    AccountType,
} from "@/types/database";

/**
 * Fonction utilitaire interne pour synchroniser le rôle du profil
 * Empêche de modifier le rôle si l'utilisateur est un Admin
 */
async function syncProfileRole(profileId: string, newRole: string) {
    const supabase = await createClient();

    // 1. Récupérer le profil actuel pour vérifier s'il est admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", profileId)
        .single();

    // Sécurité : On ne touche pas au rôle si c'est un Admin
    if (profile?.account_type === "admin") {
        return;
    }

    // 2. Mettre à jour le rôle du profil pour correspondre au rôle dans le CLAS
    // On cast newRole car le rôle d'équipe correspond aux types de compte (sauf admin)
    await supabase
        .from("profiles")
        .update({ account_type: newRole as AccountType })
        .eq("id", profileId);
}

export async function createTeamMemberAction(data: ClasTeamMemberInsert) {
    // 1. Création du membre dans l'équipe du CLAS
    const result = await createTeamMember(data);

    if (result.error) {
        return { success: false, error: result.error };
    }

    // 2. SYNCHRONISATION : Si c'est un compte lié, on met à jour son rôle global
    if (result.data && result.data.profile_id && result.data.role) {
        await syncProfileRole(result.data.profile_id, result.data.role);
    }

    // 3. Revalidation des pages
    revalidatePath("/admin/clas");
    revalidatePath("/admin/users"); // On revalide aussi la liste des utilisateurs pour voir le changement de rôle
    revalidatePath(`/clas/${data.clas_id}`);

    return { success: true, data: result.data };
}

export async function updateTeamMemberAction(data: ClasTeamMemberUpdate) {
    // 1. Mise à jour du membre dans l'équipe
    const result = await updateTeamMember(data);

    if (result.error) {
        return { success: false, error: result.error };
    }

    // 2. SYNCHRONISATION : Si c'est un compte lié et que le rôle a changé
    if (result.data && result.data.profile_id && result.data.role) {
        await syncProfileRole(result.data.profile_id, result.data.role);
    }

    revalidatePath("/admin/clas");
    revalidatePath("/admin/users");

    return { success: true, data: result.data };
}

export async function deleteTeamMemberAction(id: string) {
    // Note: Lors de la suppression, on ne change généralement pas le rôle global
    // car la personne peut avoir un rôle dans un autre CLAS.
    const result = await deleteTeamMember(id);

    if (result.error) {
        return { success: false, error: result.error };
    }

    revalidatePath("/admin/clas");
    return { success: true };
}
