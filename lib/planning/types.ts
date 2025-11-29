/**
 * Types TypeScript pour le système de planning
 */

// ============================================================================
// Enums (doivent correspondre aux enums PostgreSQL)
// ============================================================================

export type EventStatus = "confirmed" | "pending" | "cancelled";
export type EventOwnerType = "personal" | "clas";

// ============================================================================
// Types de base (correspondant aux tables Supabase)
// ============================================================================

export interface Event {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    color: string | null;
    start_time: string; // ISO 8601 timestamp
    end_time: string; // ISO 8601 timestamp
    all_day: boolean;
    status: EventStatus;
    owner_type: EventOwnerType;
    owner_id: string; // profile_id si personal, clas_id si clas
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
    owner_details?: {
        id: string;
        name: string; // CLAS name ou user name
        type: EventOwnerType;
    };
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
    color: string | null;
    start_time: Date;
    end_time: Date;
    all_day: boolean;
    status: EventStatus;
    owner_type: EventOwnerType;
    owner_id: string;
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
    clasIds?: string[]; // Filtrer par CLAS
    ownerType?: EventOwnerType; // Personal ou CLAS
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
// Types pour les couleurs d'événements
// ============================================================================

export const EVENT_COLORS = {
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
    purple: "#a855f7",
    pink: "#ec4899",
    orange: "#f97316",
    teal: "#14b8a6",
    indigo: "#6366f1",
    gray: "#6b7280",
} as const;

export type EventColor = keyof typeof EVENT_COLORS;

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
