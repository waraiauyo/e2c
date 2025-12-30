/**
 * Types TypeScript pour le système de planning
 */

// ============================================================================
// Enums (doivent correspondre aux enums PostgreSQL)
// ============================================================================

export type EventStatus = "confirmed" | "pending" | "cancelled";

export type TargetRole = "animator" | "coordinator" | "director";

// ============================================================================
// Constantes pour les couleurs par rôle
// ============================================================================

export const ROLE_COLORS: Record<TargetRole, string> = {
    animator: "#3b82f6",    // Bleu
    coordinator: "#22c55e", // Vert
    director: "#f97316",    // Orange
} as const;

export const ROLE_LABELS: Record<TargetRole, string> = {
    animator: "Animateur",
    coordinator: "Coordinateur",
    director: "Directeur",
} as const;

// ============================================================================
// Types de base (correspondant aux tables Supabase)
// ============================================================================

export interface Event {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start_time: string; // ISO 8601 timestamp
    end_time: string; // ISO 8601 timestamp
    all_day: boolean;
    status: EventStatus;
    target_roles: TargetRole[];
    recurrence_rule: RecurrenceRule | null;
    recurrence_parent_id: string | null;
    recurrence_exception: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface EventParticipant {
    id: string;
    event_id: string;
    profile_id: string;
    created_at: string;
}

export interface EventParticipantWithProfile extends EventParticipant {
    profile?: {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
    };
}

export interface EventReminder {
    id: string;
    event_id: string;
    profile_id: string;
    reminder_time: string; // ISO 8601 timestamp
    minutes_before: number | null;
    sent: boolean;
    sent_at: string | null;
    created_at: string;
}

// ============================================================================
// Types enrichis (avec jointures)
// ============================================================================

export interface EventWithParticipants extends Event {
    participants: Array<{
        id: string;
        profile_id: string;
        profile?: {
            id: string;
            email: string;
            first_name: string | null;
            last_name: string | null;
            avatar_url: string | null;
        };
    }>;
}

export interface EventWithDetails extends EventWithParticipants {
    reminders?: EventReminder[];
}

// ============================================================================
// Types pour la récurrence (basé sur iCal RRULE)
// ============================================================================

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export interface RecurrenceRule {
    freq: RecurrenceFrequency;
    interval?: number; // Ex: tous les 2 jours
    count?: number; // Nombre d'occurrences
    until?: string; // Date de fin (ISO 8601)
    byweekday?: Weekday[]; // Jours de la semaine (pour WEEKLY)
    bymonthday?: number[]; // Jours du mois (pour MONTHLY)
    bymonth?: number[]; // Mois (pour YEARLY)
}

// ============================================================================
// Types pour les formulaires
// ============================================================================

export interface EventFormData {
    title: string;
    description: string | null;
    location: string | null;
    start_time: Date;
    end_time: Date;
    all_day: boolean;
    status: EventStatus;
    target_roles: TargetRole[];
    recurrence_rule: RecurrenceRule | null;
    participant_ids: string[];
    reminder_minutes: number[]; // Ex: [15, 60] pour 15 min et 1h avant
}

export interface EventFormProps {
    mode: "create" | "edit";
    event?: Event;
    onSuccess?: (event: Event) => void;
    onCancel?: () => void;
}

// ============================================================================
// Types pour les filtres
// ============================================================================

export type EventViewMode = "day" | "week" | "month" | "agenda" | "list";

export interface EventFilters {
    targetRoles?: TargetRole[]; // Filtrer par rôles cibles
    status?: EventStatus[]; // Statuts
    startDate?: Date; // Date de début de la plage
    endDate?: Date; // Date de fin de la plage
    search?: string; // Recherche textuelle (titre, description)
}

export interface EventFiltersState extends EventFilters {
    viewMode: EventViewMode;
}

// ============================================================================
// Types pour les hooks
// ============================================================================

export interface UseEventsOptions {
    filters?: EventFilters;
    enabled?: boolean;
}

export interface UseEventsResult {
    events: Event[];
    eventsWithDetails: EventWithDetails[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export interface EventMutations {
    createEvent: (data: Omit<Event, "id" | "created_at" | "updated_at">) => Promise<Event>;
    updateEvent: (id: string, data: Partial<Event>) => Promise<Event>;
    deleteEvent: (id: string, deleteType?: "instance" | "series") => Promise<void>;
    duplicateEvent: (id: string) => Promise<Event>;
}

// ============================================================================
// Types pour les permissions
// ============================================================================

export interface EventPermissions {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAddParticipants: boolean;
}

// ============================================================================
// Types utilitaires
// ============================================================================

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    events: Event[];
}

export interface CalendarWeek {
    weekNumber: number;
    days: CalendarDay[];
}

export interface CalendarMonth {
    year: number;
    month: number; // 0-11
    weeks: CalendarWeek[];
}

// ============================================================================
// Fonctions utilitaires pour les couleurs
// ============================================================================

/**
 * Retourne la couleur d'un événement basée sur ses rôles cibles
 * Si plusieurs rôles, utilise la priorité: director > coordinator > animator
 */
export function getEventColor(targetRoles: TargetRole[]): string {
    if (targetRoles.includes("director")) return ROLE_COLORS.director;
    if (targetRoles.includes("coordinator")) return ROLE_COLORS.coordinator;
    return ROLE_COLORS.animator;
}

/**
 * Retourne le label d'un événement basé sur ses rôles cibles
 */
export function getEventRoleLabel(targetRoles: TargetRole[]): string {
    if (targetRoles.length === 3) return "Tous";
    return targetRoles.map(r => ROLE_LABELS[r]).join(", ");
}

// ============================================================================
// Fonctions utilitaires pour les permissions
// ============================================================================

type AccountType = "admin" | "coordinator" | "director" | "animator";

/**
 * Vérifie si un utilisateur peut modifier un événement
 * - Admins, coordinateurs et directeurs peuvent modifier tous les événements
 * - Les animateurs ne peuvent modifier que les événements destinés uniquement aux animateurs
 */
export function canEditEvent(event: Event, userAccountType: AccountType | undefined): boolean {
    if (!userAccountType) return false;

    // Admins, coordinateurs et directeurs peuvent tout modifier
    if (userAccountType === "admin" || userAccountType === "coordinator" || userAccountType === "director") {
        return true;
    }

    // Les animateurs ne peuvent modifier que les événements destinés uniquement aux animateurs
    if (userAccountType === "animator") {
        return event.target_roles.length === 1 && event.target_roles[0] === "animator";
    }

    return false;
}

/**
 * Vérifie si un utilisateur peut supprimer un événement
 * Mêmes règles que pour la modification
 */
export function canDeleteEvent(event: Event, userAccountType: AccountType | undefined): boolean {
    return canEditEvent(event, userAccountType);
}

/**
 * Retourne un message expliquant pourquoi l'utilisateur ne peut pas modifier l'événement
 */
export function getPermissionDeniedReason(event: Event, userAccountType: AccountType | undefined): string | null {
    if (canEditEvent(event, userAccountType)) return null;

    if (userAccountType === "animator") {
        const otherRoles = event.target_roles.filter(r => r !== "animator");
        if (otherRoles.length > 0) {
            const roleNames = otherRoles.map(r => ROLE_LABELS[r]).join(" et ");
            return `Cet événement est destiné aux ${roleNames}. Seuls les coordinateurs et directeurs peuvent le modifier.`;
        }
    }

    return "Vous n'avez pas les permissions nécessaires pour modifier cet événement.";
}

// ============================================================================
// Types pour l'export
// ============================================================================

export interface ExportOptions {
    format: "ics" | "pdf" | "csv";
    dateRange?: {
        start: Date;
        end: Date;
    };
    includeDetails?: boolean;
}
