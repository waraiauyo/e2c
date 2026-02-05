"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    Clas,
    ClasTeamMember,
    ClasRawContact,
    ClasWithTeam,
    ClasWithTeamAndProfiles,
    ClasTeamMemberWithProfile,
    ClasInsert,
    ClasUpdate,
    Profile,
    ClasProject,
} from "@/types/database";

// ============================================================================
// Requêtes CLAS
// ============================================================================

export interface GetAllClasResult {
    clas: Clas[] | null;
    error: string | null;
}

/**
 * Récupère tous les centres CLAS
 */
export async function getAllClas(): Promise<GetAllClasResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas")
            .select("*")
            .order("name");

        if (error) {
            return {
                clas: null,
                error: error.message,
            };
        }

        return {
            clas: data,
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des CLAS.",
        };
    }
}

export interface GetClasResult {
    clas: Clas | null;
    error: string | null;
}

/**
 * Récupère un CLAS par son ID
 */
export async function getClasById(clasId: string): Promise<GetClasResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas")
            .select("*")
            .eq("id", clasId)
            .single();

        if (error) {
            return {
                clas: null,
                error: error.message,
            };
        }

        return {
            clas: data,
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération du CLAS.",
        };
    }
}

export interface GetClasWithTeamResult {
    clas: ClasWithTeamAndProfiles | null;
    error: string | null;
}

/**
 * Récupère un CLAS avec ses membres d'équipe (incluant les profils), contacts bruts et projets
 */
export async function getClasWithTeam(
    clasId: string
): Promise<GetClasWithTeamResult> {
    const supabase = await createClient();

    try {
        // Get CLAS
        const { data: clas, error: clasError } = await supabase
            .from("clas")
            .select("*")
            .eq("id", clasId)
            .single();

        if (clasError || !clas) {
            return {
                clas: null,
                error: clasError?.message || "CLAS non trouvé.",
            };
        }

        // Get team members with their profiles
        const { data: teamMembers, error: teamError } = await supabase
            .from("clas_team_members")
            .select(
                `
                *,
                profile:profiles(*)
            `
            )
            .eq("clas_id", clasId);

        if (teamError) {
            return {
                clas: null,
                error: teamError.message,
            };
        }

        // Get raw contacts
        const { data: rawContacts, error: contactsError } = await supabase
            .from("clas_raw_contacts")
            .select("*")
            .eq("clas_id", clasId);

        if (contactsError) {
            return {
                clas: null,
                error: contactsError.message,
            };
        }

        // Get projects
        const { data: projects, error: projectsError } = await supabase
            .from("clas_projects")
            .select("*")
            .eq("clas_id", clasId)
            .order("year", { ascending: false });

        if (projectsError) {
            return {
                clas: null,
                error: projectsError.message,
            };
        }

        // Map team members to include profile data
        const teamMembersWithProfiles: ClasTeamMemberWithProfile[] = (
            teamMembers || []
        ).map((tm: any) => ({
            ...tm,
            profile: tm.profile || undefined,
        }));

        return {
            clas: {
                ...clas,
                team_members: teamMembersWithProfiles,
                raw_contacts: rawContacts || [],
                projects: projects || [],
            },
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération du CLAS.",
        };
    }
}

/**
 * Récupère tous les CLAS avec leurs membres d'équipe (incluant les profils) et projets
 */
export async function getAllClasWithTeams(): Promise<{
    clas:
        | (Clas & {
              team_members: ClasTeamMemberWithProfile[];
              projects: ClasProject[];
          })[]
        | null;
    error: string | null;
}> {
    const supabase = await createClient();

    try {
        // Get all CLAS
        const { data: clasList, error: clasError } = await supabase
            .from("clas")
            .select("*")
            .order("name");

        if (clasError) {
            return {
                clas: null,
                error: clasError.message,
            };
        }

        // Get all team members with their profiles
        const { data: allTeamMembers, error: teamError } = await supabase.from(
            "clas_team_members"
        ).select(`
                *,
                profile:profiles(*)
            `);

        if (teamError) {
            return {
                clas: null,
                error: teamError.message,
            };
        }

        // Get all projects
        const { data: allProjects, error: projectsError } = await supabase
            .from("clas_projects")
            .select("*");

        if (projectsError) {
            return {
                clas: null,
                error: projectsError.message,
            };
        }

        // Map team members and projects to their CLAS
        const result = clasList.map((clas) => ({
            ...clas,
            team_members: (allTeamMembers || [])
                .filter((tm: any) => tm.clas_id === clas.id)
                .map((tm: any) => ({
                    ...tm,
                    profile: tm.profile || undefined,
                })),
            projects: (allProjects || []).filter(
                (p: any) => p.clas_id === clas.id
            ),
        }));

        return {
            clas: result,
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des CLAS.",
        };
    }
}

// ============================================================================
// Mutations CLAS (Coordinateur uniquement via RLS)
// ============================================================================

export interface CreateClasResult {
    clas: Clas | null;
    error: string | null;
}

/**
 * Crée un nouveau CLAS (Coordinateur uniquement)
 */
export async function createClas(
    clasData: ClasInsert
): Promise<CreateClasResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas")
            .insert(clasData)
            .select()
            .single();

        if (error) {
            return {
                clas: null,
                error: error.message,
            };
        }

        return {
            clas: data,
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la création du CLAS.",
        };
    }
}

/**
 * Met à jour un CLAS (Coordinateur uniquement)
 */
export async function updateClas(
    clasUpdate: ClasUpdate
): Promise<CreateClasResult> {
    const supabase = await createClient();

    const { id, ...updateData } = clasUpdate;

    try {
        const { data, error } = await supabase
            .from("clas")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return {
                clas: null,
                error: error.message,
            };
        }

        return {
            clas: data,
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la mise à jour du CLAS.",
        };
    }
}

export interface DeleteClasResult {
    success: boolean;
    error: string | null;
}

/**
 * Supprime un CLAS (Coordinateur uniquement)
 */
export async function deleteClas(clasId: string): Promise<DeleteClasResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from("clas").delete().eq("id", clasId);

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
                    : "Une erreur est survenue lors de la suppression du CLAS.",
        };
    }
}

// ============================================================================
// Requêtes Membres d'équipe
// ============================================================================

export interface GetTeamMembersResult {
    teamMembers: ClasTeamMemberWithProfile[] | null;
    error: string | null;
}

/**
 * Récupère les membres d'équipe d'un CLAS avec leurs informations de profil
 */
export async function getClasTeamMembers(
    clasId: string
): Promise<GetTeamMembersResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_team_members")
            .select(
                `
                *,
                profile:profiles(*)
            `
            )
            .eq("clas_id", clasId);

        if (error) {
            return {
                teamMembers: null,
                error: error.message,
            };
        }

        return {
            teamMembers: data.map((tm: any) => ({
                ...tm,
                profile: tm.profile || undefined,
            })),
            error: null,
        };
    } catch (err) {
        return {
            teamMembers: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des membres de l'équipe.",
        };
    }
}

/**
 * Récupère les CLAS où un utilisateur est membre de l'équipe
 */
export async function getUserClas(userId: string): Promise<GetAllClasResult> {
    const supabase = await createClient();

    try {
        // Get CLAS IDs where user is a team member
        const { data: teamMemberships, error: memberError } = await supabase
            .from("clas_team_members")
            .select("clas_id")
            .eq("profile_id", userId);

        if (memberError) {
            return {
                clas: null,
                error: memberError.message,
            };
        }

        if (!teamMemberships || teamMemberships.length === 0) {
            return {
                clas: [],
                error: null,
            };
        }

        const clasIds = teamMemberships.map((tm) => tm.clas_id);

        // Get CLAS details
        const { data, error } = await supabase
            .from("clas")
            .select("*")
            .in("id", clasIds)
            .order("name");

        if (error) {
            return {
                clas: null,
                error: error.message,
            };
        }

        return {
            clas: data,
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des CLAS de l'utilisateur.",
        };
    }
}

export interface ClasWithRole {
    id: string;
    name: string;
    role: string;
}

export interface GetUserClasWithRolesResult {
    clas: ClasWithRole[] | null;
    error: string | null;
}

/**
 * Récupère les CLAS où un utilisateur est membre, avec son rôle dans chaque CLAS
 */
export async function getUserClasWithRoles(
    userId: string
): Promise<GetUserClasWithRolesResult> {
    const supabase = await createClient();

    try {
        // Get CLAS with roles via join
        const { data, error } = await supabase
            .from("clas_team_members")
            .select(
                `
                role,
                clas:clas(id, name)
            `
            )
            .eq("profile_id", userId)
            .order("clas(name)");

        if (error) {
            return {
                clas: null,
                error: error.message,
            };
        }

        if (!data || data.length === 0) {
            return {
                clas: [],
                error: null,
            };
        }

        // Transform data to ClasWithRole format
        const clasWithRoles = data
            .filter((item: any) => item.clas !== null)
            .map((item: any) => ({
                id: item.clas.id,
                name: item.clas.name,
                role: item.role,
            }));

        return {
            clas: clasWithRoles,
            error: null,
        };
    } catch (err) {
        return {
            clas: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération des CLAS de l'utilisateur.",
        };
    }
}
