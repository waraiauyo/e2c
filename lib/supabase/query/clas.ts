"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    Clas,
    ClasTeamMember,
    ClasRawContact,
    ClasWithTeam,
    ClasTeamMemberWithProfile,
    ClasInsert,
    ClasUpdate,
    Profile,
} from "@/types/database";

// ============================================================================
// CLAS Queries
// ============================================================================

export interface GetAllClasResult {
    clas: Clas[] | null;
    error: string | null;
}

/**
 * Get all CLAS centers
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
 * Get a single CLAS by ID
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
    clas: ClasWithTeam | null;
    error: string | null;
}

/**
 * Get a CLAS with its team members and raw contacts
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

        // Get team members
        const { data: teamMembers, error: teamError } = await supabase
            .from("clas_team_members")
            .select("*")
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

        return {
            clas: {
                ...clas,
                team_members: teamMembers || [],
                raw_contacts: rawContacts || [],
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
 * Get all CLAS with their team members (with profile information)
 */
export async function getAllClasWithTeams(): Promise<{
    clas: (Clas & { team_members: ClasTeamMemberWithProfile[] })[] | null;
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
        const { data: allTeamMembers, error: teamError } = await supabase
            .from("clas_team_members")
            .select(`
                *,
                profile:profiles(*)
            `);

        if (teamError) {
            return {
                clas: null,
                error: teamError.message,
            };
        }

        // Map team members to their CLAS
        const result = clasList.map((clas) => ({
            ...clas,
            team_members: (allTeamMembers || [])
                .filter((tm: any) => tm.clas_id === clas.id)
                .map((tm: any) => ({
                    ...tm,
                    profile: tm.profile || undefined,
                })),
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
// CLAS Mutations (Coordinator only via RLS)
// ============================================================================

export interface CreateClasResult {
    clas: Clas | null;
    error: string | null;
}

/**
 * Create a new CLAS (Coordinator only)
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
 * Update a CLAS (Coordinator only)
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
 * Delete a CLAS (Coordinator only)
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
// Team Members Queries
// ============================================================================

export interface GetTeamMembersResult {
    teamMembers: ClasTeamMemberWithProfile[] | null;
    error: string | null;
}

/**
 * Get team members for a specific CLAS with their profile information
 */
export async function getClasTeamMembers(
    clasId: string
): Promise<GetTeamMembersResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("clas_team_members")
            .select(`
                *,
                profile:profiles(*)
            `)
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
 * Get CLAS where a specific user is a team member
 */
export async function getUserClas(
    userId: string
): Promise<GetAllClasResult> {
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
 * Get CLAS where a specific user is a team member, with their role in each CLAS
 */
export async function getUserClasWithRoles(
    userId: string
): Promise<GetUserClasWithRolesResult> {
    const supabase = await createClient();

    try {
        // Get CLAS with roles via join
        const { data, error } = await supabase
            .from("clas_team_members")
            .select(`
                role,
                clas:clas(id, name)
            `)
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
