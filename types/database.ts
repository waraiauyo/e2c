/**
 * Database types for E2C application
 *
 * These types represent the database schema for CLAS-related tables
 */

export type AccountType = 'admin' | 'coordinator' | 'animator';
export type TeamRole = 'coordinator' | 'animator';

export interface Profile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    account_type: AccountType;
    created_at: string;
    updated_at: string | null;
}

export interface Clas {
    id: string;
    name: string;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    public_description: string | null;
    grade_levels: string | null;
    capacity: string | null;
    allophone_count: string | null;
    schedule: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClasTeamMember {
    id: string;
    clas_id: string;
    profile_id: string | null;
    role: TeamRole;
    name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClasRawContact {
    id: string;
    clas_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
}

// Database insert types (without generated fields)
export type ClasInsert = Omit<Clas, 'id' | 'created_at' | 'updated_at'>;
export type ClasTeamMemberInsert = Omit<ClasTeamMember, 'id' | 'created_at' | 'updated_at'>;
export type ClasRawContactInsert = Omit<ClasRawContact, 'id' | 'created_at' | 'updated_at'>;

// Database update types (all fields optional except id)
export type ClasUpdate = Partial<ClasInsert> & { id: string };
export type ClasTeamMemberUpdate = Partial<ClasTeamMemberInsert> & { id: string };
export type ClasRawContactUpdate = Partial<ClasRawContactInsert> & { id: string };

// Extended types with relations
export interface ClasWithTeam extends Clas {
    team_members: ClasTeamMember[];
    raw_contacts: ClasRawContact[];
}

export interface ClasTeamMemberWithProfile extends ClasTeamMember {
    profile?: Profile;
}
