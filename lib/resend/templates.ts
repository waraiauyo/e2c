import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Template de base pour les emails
 */
function baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification E2C</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                Espace Collaboratif E2C
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                Cet email a été envoyé automatiquement par la plateforme E2C CLAS Mayenne.
                            </p>
                            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
                                En partenariat avec la CAF de Mayenne
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Formate les détails de l'événement en HTML
 */
function formatEventDetails(event: {
    title: string;
    description: string | null;
    location: string | null;
    start_time: string;
    end_time: string;
    all_day: boolean;
    owner_type: "personal" | "clas";
    clasName?: string;
}): string {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    const dateStr = event.all_day
        ? format(startDate, "EEEE d MMMM yyyy", { locale: fr })
        : format(startDate, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });

    const timeStr = !event.all_day
        ? `${format(startDate, "HH'h'mm")} - ${format(endDate, "HH'h'mm")}`
        : "Toute la journée";

    return `
        <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                ${event.title}
            </h2>

            <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">📅 Date :</strong>
                <span style="color: #6b7280;">${dateStr}</span>
            </div>

            ${!event.all_day ? `
            <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">🕐 Horaire :</strong>
                <span style="color: #6b7280;">${timeStr}</span>
            </div>
            ` : ''}

            ${event.location ? `
            <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">📍 Lieu :</strong>
                <span style="color: #6b7280;">${event.location}</span>
            </div>
            ` : ''}

            ${event.owner_type === "clas" && event.clasName ? `
            <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">🏫 CLAS :</strong>
                <span style="color: #6b7280;">${event.clasName}</span>
            </div>
            ` : ''}

            ${event.description ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Description :</strong>
                <p style="margin: 8px 0 0 0; color: #6b7280; line-height: 1.6;">
                    ${event.description}
                </p>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Template : Nouvel événement créé
 */
export function eventCreatedTemplate(
    recipientName: string,
    event: {
        title: string;
        description: string | null;
        location: string | null;
        start_time: string;
        end_time: string;
        all_day: boolean;
        owner_type: "personal" | "clas";
        clasName?: string;
    },
    creatorName: string
): string {
    const content = `
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Bonjour ${recipientName},
        </p>

        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Vous avez été ajouté(e) en tant que participant(e) à un nouvel événement par <strong>${creatorName}</strong>.
        </p>

        ${formatEventDetails(event)}

        <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Connectez-vous à la plateforme E2C pour consulter tous les détails de cet événement.
        </p>
    `;

    return baseTemplate(content);
}

/**
 * Template : Événement modifié
 */
export function eventUpdatedTemplate(
    recipientName: string,
    event: {
        title: string;
        description: string | null;
        location: string | null;
        start_time: string;
        end_time: string;
        all_day: boolean;
        owner_type: "personal" | "clas";
        clasName?: string;
    },
    updaterName: string
): string {
    const content = `
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Bonjour ${recipientName},
        </p>

        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Un événement auquel vous participez a été modifié par <strong>${updaterName}</strong>.
        </p>

        ${formatEventDetails(event)}

        <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Veuillez prendre connaissance de ces modifications sur la plateforme E2C.
        </p>
    `;

    return baseTemplate(content);
}

/**
 * Template : Événement supprimé
 */
export function eventDeletedTemplate(
    recipientName: string,
    eventTitle: string,
    eventDate: string,
    deleterName: string
): string {
    const content = `
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Bonjour ${recipientName},
        </p>

        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
            L'événement suivant auquel vous participiez a été annulé par <strong>${deleterName}</strong> :
        </p>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 12px 0; color: #991b1b; font-size: 20px; font-weight: 600;">
                ${eventTitle}
            </h2>
            <div style="color: #7f1d1d;">
                <strong>📅 Date prévue :</strong> ${eventDate}
            </div>
        </div>

        <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Cet événement a été retiré de votre calendrier.
        </p>
    `;

    return baseTemplate(content);
}
