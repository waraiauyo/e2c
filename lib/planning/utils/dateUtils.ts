/**
 * Utilitaires pour la manipulation de dates
 */

// ============================================================================
// Formatage de dates
// ============================================================================

/**
 * Formate une date en format français lisible
 * @example "lundi 15 janvier 2024"
 */
export function formatDateLong(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/**
 * Formate une date en format court
 * @example "15/01/2024"
 */
export function formatDateShort(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR");
}

/**
 * Formate une heure
 * @example "14:30"
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Formate une date et heure
 * @example "15/01/2024 à 14:30"
 */
export function formatDateTime(date: Date | string): string {
    return `${formatDateShort(date)} à ${formatTime(date)}`;
}

/**
 * Formate une plage horaire
 * @example "14:30 - 16:00"
 */
export function formatTimeRange(
    start: Date | string,
    end: Date | string
): string {
    return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Formate une plage de dates
 * @example "15/01/2024 - 20/01/2024"
 */
export function formatDateRange(
    start: Date | string,
    end: Date | string
): string {
    const startDate = typeof start === "string" ? new Date(start) : start;
    const endDate = typeof end === "string" ? new Date(end) : end;

    // Si même jour
    if (isSameDay(startDate, endDate)) {
        return `${formatDateShort(startDate)}, ${formatTimeRange(start, end)}`;
    }

    // Si même mois
    if (
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getFullYear() === endDate.getFullYear()
    ) {
        return `${startDate.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
    }

    // Dates différentes
    return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
}

// ============================================================================
// Comparaisons de dates
// ============================================================================

/**
 * Vérifie si deux dates sont le même jour
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === "string" ? new Date(date1) : date1;
    const d2 = typeof date2 === "string" ? new Date(date2) : date2;

    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: Date | string): boolean {
    return isSameDay(date, new Date());
}

/**
 * Vérifie si une date est dans le passé
 */
export function isPast(date: Date | string): boolean {
    const d = typeof date === "string" ? new Date(date) : date;
    return d < new Date();
}

/**
 * Vérifie si une date est dans le futur
 */
export function isFuture(date: Date | string): boolean {
    const d = typeof date === "string" ? new Date(date) : date;
    return d > new Date();
}

/**
 * Vérifie si une date est un weekend
 */
export function isWeekend(date: Date | string): boolean {
    const d = typeof date === "string" ? new Date(date) : date;
    const day = d.getDay();
    return day === 0 || day === 6; // Dimanche ou Samedi
}

// ============================================================================
// Calculs de dates
// ============================================================================

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date | string, days: number): Date {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    d.setDate(d.getDate() + days);
    return d;
}

/**
 * Ajoute des semaines à une date
 */
export function addWeeks(date: Date | string, weeks: number): Date {
    return addDays(date, weeks * 7);
}

/**
 * Ajoute des mois à une date
 */
export function addMonths(date: Date | string, months: number): Date {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    d.setMonth(d.getMonth() + months);
    return d;
}

/**
 * Obtient le début de la journée (minuit)
 */
export function startOfDay(date: Date | string): Date {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Obtient la fin de la journée (23:59:59)
 */
export function endOfDay(date: Date | string): Date {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Obtient le début de la semaine (lundi)
 */
export function startOfWeek(date: Date | string): Date {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste si dimanche
    return new Date(d.setDate(diff));
}

/**
 * Obtient la fin de la semaine (dimanche)
 */
export function endOfWeek(date: Date | string): Date {
    const start = startOfWeek(date);
    return addDays(start, 6);
}

/**
 * Obtient le début du mois
 */
export function startOfMonth(date: Date | string): Date {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Obtient la fin du mois
 */
export function endOfMonth(date: Date | string): Date {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Obtient le nombre de jours dans un mois
 */
export function getDaysInMonth(date: Date | string): number {
    const d = new Date(typeof date === "string" ? date : date.getTime());
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Calcule la différence en jours entre deux dates
 */
export function daysBetween(
    date1: Date | string,
    date2: Date | string
): number {
    const d1 = typeof date1 === "string" ? new Date(date1) : date1;
    const d2 = typeof date2 === "string" ? new Date(date2) : date2;
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcule la différence en heures entre deux dates
 */
export function hoursBetween(
    date1: Date | string,
    date2: Date | string
): number {
    const d1 = typeof date1 === "string" ? new Date(date1) : date1;
    const d2 = typeof date2 === "string" ? new Date(date2) : date2;
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diff / (1000 * 60 * 60));
}

// ============================================================================
// Génération de plages de dates
// ============================================================================

/**
 * Génère un tableau de dates pour une semaine
 */
export function getWeekDays(date: Date | string): Date[] {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Génère un tableau de dates pour un mois (incluant les jours avant/après pour remplir les semaines)
 */
export function getMonthDays(date: Date | string): Date[] {
    const d = typeof date === "string" ? new Date(date) : date;
    const firstDay = startOfMonth(d);
    const lastDay = endOfMonth(d);

    // Début de la première semaine du mois
    const start = startOfWeek(firstDay);

    // Fin de la dernière semaine du mois
    const end = endOfWeek(lastDay);

    const days: Date[] = [];
    let current = new Date(start);

    while (current <= end) {
        days.push(new Date(current));
        current = addDays(current, 1);
    }

    return days;
}

// ============================================================================
// Noms de jours et mois en français
// ============================================================================

export const WEEKDAY_NAMES_SHORT = [
    "Lun",
    "Mar",
    "Mer",
    "Jeu",
    "Ven",
    "Sam",
    "Dim",
];
export const WEEKDAY_NAMES_LONG = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
];

export const MONTH_NAMES_SHORT = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
];
export const MONTH_NAMES_LONG = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
];

/**
 * Obtient le nom du mois en français
 */
export function getMonthName(date: Date | string, short = false): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const month = d.getMonth();
    return short ? MONTH_NAMES_SHORT[month] : MONTH_NAMES_LONG[month];
}

/**
 * Obtient le nom du jour en français
 */
export function getWeekdayName(date: Date | string, short = false): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const day = d.getDay();
    const adjustedDay = day === 0 ? 6 : day - 1; // Ajuster pour lundi = 0
    return short
        ? WEEKDAY_NAMES_SHORT[adjustedDay]
        : WEEKDAY_NAMES_LONG[adjustedDay];
}
