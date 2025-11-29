/**
 * Utilitaires pour la manipulation d'événements
 */

import type { Event, EventWithDetails, CalendarDay, CalendarWeek, CalendarMonth, EventColor } from "@/lib/planning/types";
import { isSameDay, startOfMonth, endOfMonth, getMonthDays, isToday, isWeekend } from "./dateUtils";

// ============================================================================
// Tri et filtrage
// ============================================================================

/**
 * Trie les événements par date de début
 */
export function sortEventsByStartTime(events: Event[], ascending = true): Event[] {
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
    return events.filter((event) => isSameDay(new Date(event.start_time), date));
}

/**
 * Filtre les événements d'une plage de dates
 */
export function getEventsInRange(events: Event[], startDate: Date, endDate: Date): Event[] {
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
export function generateCalendarMonth(date: Date, events: Event[]): CalendarMonth {
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
// Génération de couleurs
// ============================================================================

/**
 * Obtient la classe Tailwind pour une couleur d'événement
 */
export function getEventColorClass(color: string | null): string {
    if (!color) return "bg-blue-500";

    const colorMap: Record<string, string> = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        red: "bg-red-500",
        purple: "bg-purple-500",
        pink: "bg-pink-500",
        orange: "bg-orange-500",
        teal: "bg-teal-500",
        indigo: "bg-indigo-500",
        gray: "bg-gray-500",
    };

    return colorMap[color] || "bg-blue-500";
}

/**
 * Obtient la classe Tailwind pour le texte d'une couleur
 */
export function getEventColorTextClass(color: string | null): string {
    if (!color) return "text-blue-700";

    const colorMap: Record<string, string> = {
        blue: "text-blue-700",
        green: "text-green-700",
        yellow: "text-yellow-700",
        red: "text-red-700",
        purple: "text-purple-700",
        pink: "text-pink-700",
        orange: "text-orange-700",
        teal: "text-teal-700",
        indigo: "text-indigo-700",
        gray: "text-gray-700",
    };

    return colorMap[color] || "text-blue-700";
}

/**
 * Obtient la classe Tailwind pour le fond léger d'une couleur
 */
export function getEventColorBgLightClass(color: string | null): string {
    if (!color) return "bg-blue-50";

    const colorMap: Record<string, string> = {
        blue: "bg-blue-50",
        green: "bg-green-50",
        yellow: "bg-yellow-50",
        red: "bg-red-50",
        purple: "bg-purple-50",
        pink: "bg-pink-50",
        orange: "bg-orange-50",
        teal: "bg-teal-50",
        indigo: "bg-indigo-50",
        gray: "bg-gray-50",
    };

    return colorMap[color] || "bg-blue-50";
}

/**
 * Obtient la classe Tailwind pour la bordure d'une couleur
 */
export function getEventColorBorderClass(color: string | null): string {
    if (!color) return "border-blue-200";

    const colorMap: Record<string, string> = {
        blue: "border-blue-200",
        green: "border-green-200",
        yellow: "border-yellow-200",
        red: "border-red-200",
        purple: "border-purple-200",
        pink: "border-pink-200",
        orange: "border-orange-200",
        teal: "border-teal-200",
        indigo: "border-indigo-200",
        gray: "border-gray-200",
    };

    return colorMap[color] || "border-blue-200";
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
        const descriptionMatch = event.description?.toLowerCase().includes(lowerQuery);
        const locationMatch = event.location?.toLowerCase().includes(lowerQuery);

        return titleMatch || descriptionMatch || locationMatch;
    });
}

/**
 * Suggère une couleur basée sur le titre de l'événement
 */
export function suggestEventColor(title: string): EventColor {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("réunion") || lowerTitle.includes("meeting")) return "blue";
    if (lowerTitle.includes("cours") || lowerTitle.includes("formation")) return "green";
    if (lowerTitle.includes("urgent") || lowerTitle.includes("important")) return "red";
    if (lowerTitle.includes("anniversaire") || lowerTitle.includes("fête")) return "pink";
    if (lowerTitle.includes("pause") || lowerTitle.includes("repos")) return "gray";
    if (lowerTitle.includes("atelier")) return "purple";
    if (lowerTitle.includes("sport") || lowerTitle.includes("activité")) return "orange";

    return "blue"; // Couleur par défaut
}

// ============================================================================
// Statistiques
// ============================================================================

/**
 * Compte le nombre d'événements par statut
 */
export function countEventsByStatus(events: Event[]): Record<string, number> {
    return events.reduce((acc, event) => {
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Compte le nombre d'événements par type de propriétaire
 */
export function countEventsByOwnerType(events: Event[]): Record<string, number> {
    return events.reduce((acc, event) => {
        acc[event.owner_type] = (acc[event.owner_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Calcule le temps total d'événements en heures
 */
export function getTotalEventDuration(events: Event[]): number {
    return events.reduce((total, event) => {
        return total + getEventDuration(event);
    }, 0) / 60; // Convertir en heures
}
