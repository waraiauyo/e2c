"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    ClasProject,
    ClasProjectInsert,
    ClasProjectUpdate,
} from "@/types/database";

// ============================================================================
// Project Queries
// ============================================================================

export interface GetAllProjectsResult {
    projects: ClasProject[] | null;
    error: string | null;
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<GetAllProjectsResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .select("*")
            .order("year", { ascending: false });

        if (error) {
            return {
                projects: null,
                error: error.message,
            };
        }

        return {
            projects: data,
            error: null,
        };
    } catch (err) {
        return {
            projects: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des projets.",
        };
    }
}

export interface GetProjectResult {
    project: ClasProject | null;
    error: string | null;
}

/**
 * Get a single project by ID
 */
export async function getProjectById(
    projectId: string
): Promise<GetProjectResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .select("*")
            .eq("id", projectId)
            .single();

        if (error) {
            return {
                project: null,
                error: error.message,
            };
        }

        return {
            project: data,
            error: null,
        };
    } catch (err) {
        return {
            project: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération du projet.",
        };
    }
}

/**
 * Get all projects for a specific CLAS
 */
export async function getProjectsByClasId(
    clasId: string
): Promise<GetAllProjectsResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .select("*")
            .eq("clas_id", clasId)
            .order("year", { ascending: false });

        if (error) {
            return {
                projects: null,
                error: error.message,
            };
        }

        return {
            projects: data,
            error: null,
        };
    } catch (err) {
        return {
            projects: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des projets du CLAS.",
        };
    }
}

/**
 * Get ongoing projects for a specific CLAS
 */
export async function getOngoingProjectsByClasId(
    clasId: string
): Promise<GetAllProjectsResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .select("*")
            .eq("clas_id", clasId)
            .eq("status", "ongoing")
            .order("year", { ascending: false });

        if (error) {
            return {
                projects: null,
                error: error.message,
            };
        }

        return {
            projects: data,
            error: null,
        };
    } catch (err) {
        return {
            projects: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des projets en cours.",
        };
    }
}

// ============================================================================
// Project Mutations (Admin, Coordinator, Director only via RLS)
// ============================================================================

export interface CreateProjectResult {
    project: ClasProject | null;
    error: string | null;
}

/**
 * Create a new project (Admin, Coordinator, Director only)
 */
export async function createProject(
    projectData: ClasProjectInsert
): Promise<CreateProjectResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .insert(projectData)
            .select()
            .single();

        if (error) {
            return {
                project: null,
                error: error.message,
            };
        }

        return {
            project: data,
            error: null,
        };
    } catch (err) {
        return {
            project: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la création du projet.",
        };
    }
}

/**
 * Update a project (Admin, Coordinator, Director only)
 */
export async function updateProject(
    projectUpdate: ClasProjectUpdate
): Promise<CreateProjectResult> {
    const supabase = await createClient();

    const { id, ...updateData } = projectUpdate;

    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return {
                project: null,
                error: error.message,
            };
        }

        return {
            project: data,
            error: null,
        };
    } catch (err) {
        return {
            project: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la mise à jour du projet.",
        };
    }
}

export interface DeleteProjectResult {
    success: boolean;
    error: string | null;
}

/**
 * Delete a project (Admin, Coordinator, Director only)
 */
export async function deleteProject(
    projectId: string
): Promise<DeleteProjectResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("clas_projects")
            .delete()
            .eq("id", projectId);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            error: null,
        };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la suppression du projet.",
        };
    }
}

/**
 * Mark a project as finished
 */
export async function finishProject(
    projectId: string
): Promise<CreateProjectResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_projects")
            .update({ status: "finished" })
            .eq("id", projectId)
            .select()
            .single();

        if (error) {
            return {
                project: null,
                error: error.message,
            };
        }

        return {
            project: data,
            error: null,
        };
    } catch (err) {
        return {
            project: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la finalisation du projet.",
        };
    }
}
