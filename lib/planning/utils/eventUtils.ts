/**
 * Utilitaires pour la manipulation d'événements
 */

import type {
    Event,
    CalendarDay,
    CalendarWeek,
    CalendarMonth,
} from "@/lib/planning/types";
import { getEventColor, ROLE_COLORS } from "@/lib/planning/types";
import {
    isSameDay,
    startOfMonth,
    endOfMonth,
    getMonthDays,
    isToday,
    isWeekend,
} from "./dateUtils";

// ============================================================================
// Tri et filtrage
// ============================================================================

/**
 * Trie les événements par date de début
 */
export function sortEventsByStartTime(
    events: Event[],
    ascending = true
): Event[] {
    return [...events].sort((a, b) => {
        const dateA = new Date(a.start_time).getTime();
        const dateB = new Date(b.start_time).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

/**
 * Groupe les événements par jour
 */
export function groupEventsByDay(events: Event[]): Map<string, Event[]> {
    const grouped = new Map<string, Event[]>();

    events.forEach((event) => {
        const dateKey = new Date(event.start_time).toISOString().split("T")[0];
        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(event);
    });

    return grouped;
}

/**
 * Filtre les événements d'un jour spécifique
 */
export function getEventsForDay(events: Event[], date: Date | string): Event[] {
    return events.filter((event) =>
        isSameDay(new Date(event.start_time), date)
    );
}

/**
 * Filtre les événements d'une plage de dates
 */
export function getEventsInRange(
    events: Event[],
    startDate: Date,
    endDate: Date
): Event[] {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return events.filter((event) => {
        const eventStart = new Date(event.start_time).getTime();
        return eventStart >= start && eventStart <= end;
    });
}

// ============================================================================
// Génération de structure calendrier
// ============================================================================

/**
 * Génère la structure d'un mois de calendrier avec événements
 */
export function generateCalendarMonth(
    date: Date,
    events: Event[]
): CalendarMonth {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();

    const days = getMonthDays(d);
    const eventsByDay = groupEventsByDay(events);

    const weeks: CalendarWeek[] = [];
    let currentWeek: CalendarDay[] = [];
    let weekNumber = 1;

    days.forEach((day, index) => {
        const dateKey = day.toISOString().split("T")[0];
        const dayEvents = eventsByDay.get(dateKey) || [];

        const calendarDay: CalendarDay = {
            date: day,
            isCurrentMonth: day.getMonth() === month,
            isToday: isToday(day),
            isWeekend: isWeekend(day),
            events: sortEventsByStartTime(dayEvents),
        };

        currentWeek.push(calendarDay);

        // Si fin de semaine ou dernier jour
        if (currentWeek.length === 7) {
            weeks.push({
                weekNumber,
                days: currentWeek,
            });
            currentWeek = [];
            weekNumber++;
        }
    });

    return {
        year,
        month,
        weeks,
    };
}

// ============================================================================
// Calculs de durée
// ============================================================================

/**
 * Calcule la durée d'un événement en minutes
 */
export function getEventDuration(event: Event): number {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Formate la durée d'un événement
 * @example "2h 30min"
 */
export function formatEventDuration(event: Event): string {
    const minutes = getEventDuration(event);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins} min`;
    }
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
}

// ============================================================================
// Vérifications d'événements
// ============================================================================

/**
 * Vérifie si un événement est en cours
 */
export function isEventOngoing(event: Event): boolean {
    const now = new Date();
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    return now >= start && now <= end;
}

/**
 * Vérifie si un événement est passé
 */
export function isEventPast(event: Event): boolean {
    return new Date(event.end_time) < new Date();
}

/**
 * Vérifie si un événement est à venir
 */
export function isEventUpcoming(event: Event): boolean {
    return new Date(event.start_time) > new Date();
}

/**
 * Vérifie si deux événements se chevauchent
 */
export function eventsOverlap(event1: Event, event2: Event): boolean {
    const start1 = new Date(event1.start_time);
    const end1 = new Date(event1.end_time);
    const start2 = new Date(event2.start_time);
    const end2 = new Date(event2.end_time);

    return start1 < end2 && start2 < end1;
}

// ============================================================================
// Génération de couleurs basées sur les rôles
// ============================================================================

/**
 * Mapping des couleurs de rôle vers les classes Tailwind
 */
const ROLE_COLOR_CLASSES = {
    [ROLE_COLORS.animator]: {
        bg: "bg-blue-500",
        text: "text-blue-700 dark:text-blue-300",
        bgLight: "bg-blue-50 dark:bg-blue-950",
        border: "border-blue-200 dark:border-blue-800",
    },
    [ROLE_COLORS.coordinator]: {
        bg: "bg-green-500",
        text: "text-green-700 dark:text-green-300",
        bgLight: "bg-green-50 dark:bg-green-950",
        border: "border-green-200 dark:border-green-800",
    },
    [ROLE_COLORS.director]: {
        bg: "bg-orange-500",
        text: "text-orange-700 dark:text-orange-300",
        bgLight: "bg-orange-50 dark:bg-orange-950",
        border: "border-orange-200 dark:border-orange-800",
    },
} as const;

/**
 * Obtient les classes de couleur pour un événement basées sur ses rôles cibles
 */
function getEventColorClasses(event: Event) {
    const color = getEventColor(event.target_roles);
    return (
        ROLE_COLOR_CLASSES[color] || ROLE_COLOR_CLASSES[ROLE_COLORS.animator]
    );
}

/**
 * Obtient la classe Tailwind pour une couleur d'événement
 */
export function getEventColorClass(event: Event): string {
    return getEventColorClasses(event).bg;
}

/**
 * Obtient la classe Tailwind pour le texte d'une couleur
 */
export function getEventColorTextClass(event: Event): string {
    return getEventColorClasses(event).text;
}

/**
 * Obtient la classe Tailwind pour le fond léger d'une couleur
 */
export function getEventColorBgLightClass(event: Event): string {
    return getEventColorClasses(event).bgLight;
}

/**
 * Obtient la classe Tailwind pour la bordure d'une couleur
 */
export function getEventColorBorderClass(event: Event): string {
    return getEventColorClasses(event).border;
}

// ============================================================================
// Recherche et suggestions
// ============================================================================

/**
 * Recherche d'événements par texte
 */
export function searchEvents(events: Event[], query: string): Event[] {
    const lowerQuery = query.toLowerCase();

    return events.filter((event) => {
        const titleMatch = event.title.toLowerCase().includes(lowerQuery);
        const descriptionMatch = event.description
            ?.toLowerCase()
            .includes(lowerQuery);
        const locationMatch = event.location
            ?.toLowerCase()
            .includes(lowerQuery);

        return titleMatch || descriptionMatch || locationMatch;
    });
}

// ============================================================================
// Statistiques
// ============================================================================

/**
 * Compte le nombre d'événements par statut
 */
export function countEventsByStatus(events: Event[]): Record<string, number> {
    return events.reduce(
        (acc, event) => {
            acc[event.status] = (acc[event.status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );
}

/**
 * Calcule le temps total d'événements en heures
 */
export function getTotalEventDuration(events: Event[]): number {
    return (
        events.reduce((total, event) => {
            return total + getEventDuration(event);
        }, 0) / 60
    ); // Convertir en heures
}
