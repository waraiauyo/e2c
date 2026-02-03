"use server";

import { createClient } from "@/lib/supabase/server";
import type { ClasTeamMember, ClasTeamMemberInsert, ClasTeamMemberUpdate, Profile } from "@/types/database";

export interface GetTeamResult {
    members: (ClasTeamMember & { profile?: Profile | null })[] | null;
    error: string | null;
}

/**
 * Récupère les membres d'un CLAS avec les infos de profil jointes
 */
export async function getTeamByClasId(clasId: string): Promise<GetTeamResult> {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from("clas_team_members")
            .select(`
                *,
                profile:profiles(*)
            `)
            .eq("clas_id", clasId)
            // On trie : coordinateurs d'abord, puis par nom
            .order("role", { ascending: true }) 
            .order("name", { ascending: true });

        if (error) return { members: null, error: error.message };
        
        // Mappage pour assurer que profile est bien typé (Supabase retourne un tableau ou objet selon la config)
        const members = data.map((item: any) => ({
            ...item,
            profile: item.profile || null
        }));

        return { members, error: null };
    } catch (err) {
        return { members: null, error: "Erreur lors de la récupération de l'équipe." };
    }
}

/**
 * Récupère une liste simple de profils pour le sélecteur (pour lier un compte)
 */
export async function getPotentialMembers(): Promise<{ profiles: Profile[] | null; error: string | null }> {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("last_name", { ascending: true });

        if (error) return { profiles: null, error: error.message };
        return { profiles: data, error: null };
    } catch (err) {
        return { profiles: null, error: "Erreur lors du chargement des profils." };
    }
}

export async function createTeamMember(member: ClasTeamMemberInsert): Promise<{ data: ClasTeamMember | null; error: string | null }> {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from("clas_team_members")
            .insert(member)
            .select()
            .single();

        if (error) return { data: null, error: error.message };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: "Erreur lors de l'ajout du membre." };
    }
}

export async function updateTeamMember(member: ClasTeamMemberUpdate): Promise<{ data: ClasTeamMember | null; error: string | null }> {
    const supabase = await createClient();
    const { id, ...rest } = member;
    try {
        const { data, error } = await supabase
            .from("clas_team_members")
            .update(rest)
            .eq("id", id)
            .select()
            .single();

        if (error) return { data: null, error: error.message };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: "Erreur lors de la mise à jour du membre." };
    }
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();
    try {
        const { error } = await supabase
            .from("clas_team_members")
            .delete()
            .eq("id", id);

        if (error) return { success: false, error: error.message };
        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: "Erreur lors de la suppression du membre." };
    }
}