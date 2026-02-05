"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    ClasProject,
    ClasProjectInsert,
    ClasProjectUpdate,
} from "@/types/database";

export interface GetProjectsResult {
    projects: ClasProject[] | null;
    error: string | null;
}

export async function getProjectsByClasId(
    clasId: string
): Promise<GetProjectsResult> {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .select("*")
            .eq("clas_id", clasId)
            .order("year", { ascending: false });

        if (error) return { projects: null, error: error.message };
        return { projects: data, error: null };
    } catch (err) {
        return {
            projects: null,
            error: "Erreur lors de la récupération des projets.",
        };
    }
}

export async function createProject(
    project: ClasProjectInsert
): Promise<{ data: ClasProject | null; error: string | null }> {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .insert(project)
            .select()
            .single();

        if (error) return { data: null, error: error.message };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: "Erreur lors de la création du projet." };
    }
}

export async function updateProject(
    project: ClasProjectUpdate
): Promise<{ data: ClasProject | null; error: string | null }> {
    const supabase = await createClient();
    const { id, ...rest } = project;
    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .update(rest)
            .eq("id", id)
            .select()
            .single();

        if (error) return { data: null, error: error.message };
        return { data, error: null };
    } catch (err) {
        return {
            data: null,
            error: "Erreur lors de la mise à jour du projet.",
        };
    }
}

export async function deleteProject(
    id: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();
    try {
        const { error } = await supabase
            .from("clas_projects")
            .delete()
            .eq("id", id);

        if (error) return { success: false, error: error.message };
        return { success: true, error: null };
    } catch (err) {
        return {
            success: false,
            error: "Erreur lors de la suppression du projet.",
        };
    }
}
