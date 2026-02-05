/**
 * Utilitaires pour la gestion de la récurrence d'événements (RRULE)
 * Basé sur la RFC 5545 (iCalendar)
 */

import type {
    RecurrenceRule,
    RecurrenceFrequency,
    Weekday,
    Event,
} from "@/lib/planning/types";
import { addDays, addWeeks, addMonths } from "./dateUtils";

// ============================================================================
// Génération d'occurrences
// ============================================================================

/**
 * Génère les dates d'occurrence pour une règle de récurrence
 */
export function generateRecurrenceOccurrences(
    startDate: Date,
    rule: RecurrenceRule,
    maxOccurrences: number = 365
): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);
    const interval = rule.interval || 1;

    // Date limite
    const until = rule.until ? new Date(rule.until) : null;
    const count = rule.count || maxOccurrences;

    while (occurrences.length < count) {
        // Vérifier si on a dépassé la date limite
        if (until && currentDate > until) {
            break;
        }

        // Ajouter l'occurrence si elle correspond aux critères
        if (matchesRecurrenceRule(currentDate, rule)) {
            occurrences.push(new Date(currentDate));
        }

        // Incrémenter selon la fréquence
        switch (rule.freq) {
            case "DAILY":
                currentDate = addDays(currentDate, interval);
                break;
            case "WEEKLY":
                currentDate = addWeeks(currentDate, interval);
                break;
            case "MONTHLY":
                currentDate = addMonths(currentDate, interval);
                break;
            case "YEARLY":
                currentDate = addMonths(currentDate, interval * 12);
                break;
        }

        // Sécurité : éviter les boucles infinies
        if (occurrences.length >= maxOccurrences) {
            break;
        }
    }

    return occurrences;
}

/**
 * Vérifie si une date correspond aux critères d'une règle de récurrence
 */
function matchesRecurrenceRule(date: Date, rule: RecurrenceRule): boolean {
    // Vérifier le jour de la semaine (pour WEEKLY)
    if (rule.byweekday && rule.byweekday.length > 0) {
        const dayOfWeek = getDayOfWeekCode(date);
        if (!rule.byweekday.includes(dayOfWeek)) {
            return false;
        }
    }

    // Vérifier le jour du mois (pour MONTHLY)
    if (rule.bymonthday && rule.bymonthday.length > 0) {
        const dayOfMonth = date.getDate();
        if (!rule.bymonthday.includes(dayOfMonth)) {
            return false;
        }
    }

    // Vérifier le mois (pour YEARLY)
    if (rule.bymonth && rule.bymonth.length > 0) {
        const month = date.getMonth() + 1; // getMonth() retourne 0-11
        if (!rule.bymonth.includes(month)) {
            return false;
        }
    }

    return true;
}

/**
 * Obtient le code du jour de la semaine (format RRULE)
 */
function getDayOfWeekCode(date: Date): Weekday {
    const dayMap: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    return dayMap[date.getDay()];
}

// ============================================================================
// Conversion RRULE string ↔ RecurrenceRule
// ============================================================================

/**
 * Convertit un objet RecurrenceRule en string RRULE
 * @example "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR"
 */
export function recurrenceRuleToString(rule: RecurrenceRule): string {
    const parts: string[] = [`FREQ=${rule.freq}`];

    if (rule.interval && rule.interval > 1) {
        parts.push(`INTERVAL=${rule.interval}`);
    }

    if (rule.count) {
        parts.push(`COUNT=${rule.count}`);
    }

    if (rule.until) {
        // Format iCal : YYYYMMDDTHHMMSSZ
        const until = new Date(rule.until);
        const formatted = until
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}/, "");
        parts.push(`UNTIL=${formatted}`);
    }

    if (rule.byweekday && rule.byweekday.length > 0) {
        parts.push(`BYDAY=${rule.byweekday.join(",")}`);
    }

    if (rule.bymonthday && rule.bymonthday.length > 0) {
        parts.push(`BYMONTHDAY=${rule.bymonthday.join(",")}`);
    }

    if (rule.bymonth && rule.bymonth.length > 0) {
        parts.push(`BYMONTH=${rule.bymonth.join(",")}`);
    }

    return parts.join(";");
}

/**
 * Parse une string RRULE en objet RecurrenceRule
 */
export function parseRecurrenceRule(
    rruleString: string
): RecurrenceRule | null {
    try {
        const parts = rruleString.split(";");
        const rule: Partial<RecurrenceRule> = {};

        parts.forEach((part) => {
            const [key, value] = part.split("=");

            switch (key) {
                case "FREQ":
                    rule.freq = value as RecurrenceFrequency;
                    break;
                case "INTERVAL":
                    rule.interval = parseInt(value, 10);
                    break;
                case "COUNT":
                    rule.count = parseInt(value, 10);
                    break;
                case "UNTIL":
                    // Parse format iCal
                    rule.until = parseICalDate(value);
                    break;
                case "BYDAY":
                    rule.byweekday = value.split(",") as Weekday[];
                    break;
                case "BYMONTHDAY":
                    rule.bymonthday = value
                        .split(",")
                        .map((d) => parseInt(d, 10));
                    break;
                case "BYMONTH":
                    rule.bymonth = value.split(",").map((m) => parseInt(m, 10));
                    break;
            }
        });

        if (!rule.freq) {
            return null;
        }

        return rule as RecurrenceRule;
    } catch (error) {
        console.error("Erreur lors du parsing de la RRULE:", error);
        return null;
    }
}

/**
 * Parse une date au format iCal (YYYYMMDDTHHMMSSZ)
 */
function parseICalDate(dateString: string): string {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(9, 11);
    const minute = dateString.substring(11, 13);
    const second = dateString.substring(13, 15);

    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

// ============================================================================
// Description lisible de la récurrence
// ============================================================================

/**
 * Convertit une RecurrenceRule en description lisible en français
 * @example "Tous les lundis et mercredis"
 */
export function recurrenceRuleToText(rule: RecurrenceRule): string {
    const interval = rule.interval || 1;
    const parts: string[] = [];

    // Fréquence de base
    switch (rule.freq) {
        case "DAILY":
            parts.push(
                interval === 1 ? "Tous les jours" : `Tous les ${interval} jours`
            );
            break;
        case "WEEKLY":
            if (rule.byweekday && rule.byweekday.length > 0) {
                const days = rule.byweekday.map(weekdayToFrench).join(", ");
                parts.push(
                    interval === 1
                        ? `Toutes les semaines le ${days}`
                        : `Toutes les ${interval} semaines le ${days}`
                );
            } else {
                parts.push(
                    interval === 1
                        ? "Toutes les semaines"
                        : `Toutes les ${interval} semaines`
                );
            }
            break;
        case "MONTHLY":
            if (rule.bymonthday && rule.bymonthday.length > 0) {
                const days = rule.bymonthday.join(", ");
                parts.push(
                    interval === 1
                        ? `Tous les mois le ${days}`
                        : `Tous les ${interval} mois le ${days}`
                );
            } else {
                parts.push(
                    interval === 1
                        ? "Tous les mois"
                        : `Tous les ${interval} mois`
                );
            }
            break;
        case "YEARLY":
            parts.push(
                interval === 1 ? "Tous les ans" : `Tous les ${interval} ans`
            );
            break;
    }

    // Fin de récurrence
    if (rule.count) {
        parts.push(`(${rule.count} fois)`);
    } else if (rule.until) {
        const until = new Date(rule.until);
        parts.push(`jusqu'au ${until.toLocaleDateString("fr-FR")}`);
    }

    return parts.join(" ");
}

/**
 * Convertit un code de jour RRULE en français
 */
function weekdayToFrench(day: Weekday): string {
    const map: Record<Weekday, string> = {
        MO: "lundi",
        TU: "mardi",
        WE: "mercredi",
        TH: "jeudi",
        FR: "vendredi",
        SA: "samedi",
        SU: "dimanche",
    };
    return map[day];
}

// ============================================================================
// Helpers pour créer des règles courantes
// ============================================================================

/**
 * Crée une règle de récurrence quotidienne
 */
export function createDailyRule(
    interval = 1,
    count?: number,
    until?: string
): RecurrenceRule {
    return {
        freq: "DAILY",
        interval,
        count,
        until,
    };
}

/**
 * Crée une règle de récurrence hebdomadaire
 */
export function createWeeklyRule(
    weekdays: Weekday[],
    interval = 1,
    count?: number,
    until?: string
): RecurrenceRule {
    return {
        freq: "WEEKLY",
        interval,
        byweekday: weekdays,
        count,
        until,
    };
}

/**
 * Crée une règle de récurrence mensuelle
 */
export function createMonthlyRule(
    monthdays: number[],
    interval = 1,
    count?: number,
    until?: string
): RecurrenceRule {
    return {
        freq: "MONTHLY",
        interval,
        bymonthday: monthdays,
        count,
        until,
    };
}

/**
 * Crée une règle de récurrence annuelle
 */
export function createYearlyRule(
    interval = 1,
    count?: number,
    until?: string
): RecurrenceRule {
    return {
        freq: "YEARLY",
        interval,
        count,
        until,
    };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Valide une règle de récurrence
 */
export function validateRecurrenceRule(rule: RecurrenceRule): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!rule.freq) {
        errors.push("La fréquence est requise");
    }

    if (rule.interval && rule.interval < 1) {
        errors.push("L'intervalle doit être supérieur à 0");
    }

    if (rule.count && rule.count < 1) {
        errors.push("Le nombre d'occurrences doit être supérieur à 0");
    }

    if (rule.count && rule.until) {
        errors.push("Vous ne pouvez pas spécifier à la fois COUNT et UNTIL");
    }

    if (rule.byweekday && rule.byweekday.length === 0) {
        errors.push("Au moins un jour de la semaine doit être sélectionné");
    }

    if (rule.bymonthday) {
        rule.bymonthday.forEach((day) => {
            if (day < 1 || day > 31) {
                errors.push("Les jours du mois doivent être entre 1 et 31");
            }
        });
    }

    if (rule.bymonth) {
        rule.bymonth.forEach((month) => {
            if (month < 1 || month > 12) {
                errors.push("Les mois doivent être entre 1 et 12");
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ============================================================================
// Utilitaires pour événements récurrents
// ============================================================================

/**
 * Vérifie si un événement est récurrent
 */
export function isRecurringEvent(event: Event): boolean {
    return event.recurrence_rule !== null;
}

/**
 * Vérifie si un événement est une instance d'une série récurrente
 */
export function isRecurringInstance(event: Event): boolean {
    return event.recurrence_parent_id !== null;
}

/**
 * Vérifie si un événement est une exception (modification d'une instance)
 */
export function isRecurringException(event: Event): boolean {
    return event.recurrence_exception === true;
}
