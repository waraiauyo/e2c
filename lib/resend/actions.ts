"use server";

import { resend, FROM_EMAIL, isResendEnabled } from "./client";
import { eventCreatedTemplate, eventUpdatedTemplate, eventDeletedTemplate } from "./templates";
import { getEventParticipants } from "@/lib/supabase/query/events";
import { getUserProfile } from "@/lib/supabase/query/profiles";
import { getClasById } from "@/lib/supabase/query/clas";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EventEmailData {
    title: string;
    description: string | null;
    location: string | null;
    start_time: string;
    end_time: string;
    all_day: boolean;
    owner_type: "personal" | "clas";
    owner_id: string;
}

/**
 * Récupère le nom du CLAS si l'événement est de type CLAS
 */
async function getClasName(clasId: string): Promise<string | undefined> {
    try {
        const result = await getClasById(clasId);
        return result.clas?.name;
    } catch (error) {
        console.error("Erreur lors de la récupération du CLAS:", error);
        return undefined;
    }
}

/**
 * Envoie une notification email lors de la création d'un événement
 */
export async function sendEventCreatedNotification(
    eventId: string,
    eventData: EventEmailData,
    creatorId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Vérifier si Resend est configuré
        if (!isResendEnabled()) {
            return { success: true }; // Ne pas bloquer l'opération si emails désactivés
        }

        // Récupérer les participants
        const participants = await getEventParticipants(eventId);

        console.log(`📧 [sendEventCreatedNotification] ${participants.length} participant(s) trouvé(s) pour l'événement ${eventId}`);

        if (participants.length === 0) {
            return { success: true }; // Pas de participants, rien à envoyer
        }

        // Récupérer le créateur
        const creatorResult = await getUserProfile(creatorId);
        if (!creatorResult.profile) {
            throw new Error("Créateur introuvable");
        }
        const creator = creatorResult.profile;
        const creatorName = creator.first_name && creator.last_name
            ? `${creator.first_name} ${creator.last_name}`
            : creator.email;

        // Récupérer le nom du CLAS si nécessaire
        const clasName = eventData.owner_type === "clas"
            ? await getClasName(eventData.owner_id)
            : undefined;

        // Préparer les données de l'événement pour le template
        const eventForTemplate = {
            ...eventData,
            clasName,
        };

        // Envoyer les emails SÉQUENTIELLEMENT avec délai pour éviter le rate limiting
        const results = [];
        for (let index = 0; index < participants.length; index++) {
            const participant = participants[index];

            if (!participant.profile) {
                console.warn(`⚠️  Participant ${index + 1}/${participants.length} (ID: ${participant.profile_id}) n'a pas de profil`);
                results.push({ success: false, error: "Pas de profil" });
                continue;
            }

            const recipientName = participant.profile.first_name && participant.profile.last_name
                ? `${participant.profile.first_name} ${participant.profile.last_name}`
                : participant.profile.email;

            const html = eventCreatedTemplate(recipientName, eventForTemplate, creatorName);

            try {
                console.log(`📤 Envoi email ${index + 1}/${participants.length} à ${participant.profile.email}...`);
                const result = await resend!.emails.send({
                    from: FROM_EMAIL,
                    to: participant.profile.email,
                    subject: `Nouvel événement : ${eventData.title}`,
                    html,
                });

                // Vérifier si Resend a retourné une erreur
                if (result.error) {
                    console.error(`❌ Erreur Resend pour email ${index + 1}:`, result.error);

                    // Si rate limit, attendre et réessayer
                    if (result.error.name === 'rate_limit_exceeded') {
                        console.log(`⏳ Rate limit atteint, attente de 1 seconde et réessai...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Réessayer
                        const retryResult = await resend!.emails.send({
                            from: FROM_EMAIL,
                            to: participant.profile.email,
                            subject: `Nouvel événement : ${eventData.title}`,
                            html,
                        });

                        if (retryResult.error) {
                            console.error(`❌ Échec après retry pour email ${index + 1}`);
                            results.push({ success: false, error: retryResult.error.message });
                            continue;
                        }

                        console.log(`✅ Email ${index + 1}/${participants.length} envoyé après retry (ID: ${retryResult.data?.id})`);
                        results.push({ success: true, emailId: retryResult.data?.id });
                    } else {
                        results.push({ success: false, error: result.error.message });
                    }
                    continue;
                }

                const emailId = result.data?.id;
                console.log(`✅ Email ${index + 1}/${participants.length} envoyé (ID: ${emailId})`);
                results.push({ success: true, emailId });

                // Délai de 600ms entre chaque email pour respecter le rate limit (2/sec = 500ms min)
                if (index < participants.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
            } catch (error) {
                console.error(`❌ Exception lors de l'envoi email ${index + 1}:`, error);
                results.push({ success: false, error: error instanceof Error ? error.message : "Erreur inconnue" });
            }
        }

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`📊 Résultat envoi: ${succeeded}/${participants.length} réussi(s), ${failed} échec(s)`);

        if (failed > 0) {
            console.warn(`⚠️  ${failed} email(s) n'ont pas pu être envoyés`);
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de l'envoi des notifications de création:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}

/**
 * Envoie une notification email lors de la modification d'un événement
 */
export async function sendEventUpdatedNotification(
    eventId: string,
    eventData: EventEmailData,
    updaterId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Vérifier si Resend est configuré
        if (!isResendEnabled()) {
            return { success: true }; // Ne pas bloquer l'opération si emails désactivés
        }

        // Récupérer les participants
        const participants = await getEventParticipants(eventId);

        console.log(`📧 [sendEventUpdatedNotification] ${participants.length} participant(s) trouvé(s) pour l'événement ${eventId}`);

        if (participants.length === 0) {
            return { success: true }; // Pas de participants, rien à envoyer
        }

        // Récupérer l'utilisateur qui a modifié
        const updaterResult = await getUserProfile(updaterId);
        if (!updaterResult.profile) {
            throw new Error("Utilisateur introuvable");
        }
        const updater = updaterResult.profile;
        const updaterName = updater.first_name && updater.last_name
            ? `${updater.first_name} ${updater.last_name}`
            : updater.email;

        // Récupérer le nom du CLAS si nécessaire
        const clasName = eventData.owner_type === "clas"
            ? await getClasName(eventData.owner_id)
            : undefined;

        // Préparer les données de l'événement pour le template
        const eventForTemplate = {
            ...eventData,
            clasName,
        };

        // Envoyer les emails SÉQUENTIELLEMENT avec délai pour éviter le rate limiting
        const results = [];
        for (let index = 0; index < participants.length; index++) {
            const participant = participants[index];

            if (!participant.profile) {
                console.warn(`⚠️  Participant ${index + 1}/${participants.length} (ID: ${participant.profile_id}) n'a pas de profil`);
                results.push({ success: false, error: "Pas de profil" });
                continue;
            }

            const recipientName = participant.profile.first_name && participant.profile.last_name
                ? `${participant.profile.first_name} ${participant.profile.last_name}`
                : participant.profile.email;

            const html = eventUpdatedTemplate(recipientName, eventForTemplate, updaterName);

            try {
                console.log(`📤 Envoi email ${index + 1}/${participants.length} à ${participant.profile.email}...`);
                const result = await resend!.emails.send({
                    from: FROM_EMAIL,
                    to: participant.profile.email,
                    subject: `Événement modifié : ${eventData.title}`,
                    html,
                });

                // Vérifier si Resend a retourné une erreur
                if (result.error) {
                    console.error(`❌ Erreur Resend pour email ${index + 1}:`, result.error);

                    // Si rate limit, attendre et réessayer
                    if (result.error.name === 'rate_limit_exceeded') {
                        console.log(`⏳ Rate limit atteint, attente de 1 seconde et réessai...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Réessayer
                        const retryResult = await resend!.emails.send({
                            from: FROM_EMAIL,
                            to: participant.profile.email,
                            subject: `Événement modifié : ${eventData.title}`,
                            html,
                        });

                        if (retryResult.error) {
                            console.error(`❌ Échec après retry pour email ${index + 1}`);
                            results.push({ success: false, error: retryResult.error.message });
                            continue;
                        }

                        console.log(`✅ Email ${index + 1}/${participants.length} envoyé après retry (ID: ${retryResult.data?.id})`);
                        results.push({ success: true, emailId: retryResult.data?.id });
                    } else {
                        results.push({ success: false, error: result.error.message });
                    }
                    continue;
                }

                const emailId = result.data?.id;
                console.log(`✅ Email ${index + 1}/${participants.length} envoyé (ID: ${emailId})`);
                results.push({ success: true, emailId });

                // Délai de 600ms entre chaque email pour respecter le rate limit
                if (index < participants.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
            } catch (error) {
                console.error(`❌ Exception lors de l'envoi email ${index + 1}:`, error);
                results.push({ success: false, error: error instanceof Error ? error.message : "Erreur inconnue" });
            }
        }

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`📊 Résultat envoi: ${succeeded}/${participants.length} réussi(s), ${failed} échec(s)`);

        if (failed > 0) {
            console.warn(`⚠️  ${failed} email(s) n'ont pas pu être envoyés`);
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de l'envoi des notifications de modification:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}

/**
 * Envoie une notification email lors de la suppression d'un événement
 */
export async function sendEventDeletedNotification(
    eventTitle: string,
    eventStartTime: string,
    participantIds: string[],
    deleterId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Vérifier si Resend est configuré
        if (!isResendEnabled()) {
            return { success: true }; // Ne pas bloquer l'opération si emails désactivés
        }

        console.log(`📧 [sendEventDeletedNotification] ${participantIds.length} participant(s) à notifier pour l'événement supprimé`);

        if (participantIds.length === 0) {
            return { success: true }; // Pas de participants, rien à envoyer
        }

        // Récupérer l'utilisateur qui a supprimé
        const deleterResult = await getUserProfile(deleterId);
        if (!deleterResult.profile) {
            throw new Error("Utilisateur introuvable");
        }
        const deleter = deleterResult.profile;
        const deleterName = deleter.first_name && deleter.last_name
            ? `${deleter.first_name} ${deleter.last_name}`
            : deleter.email;

        // Formater la date
        const eventDate = format(new Date(eventStartTime), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });

        // Envoyer les emails SÉQUENTIELLEMENT avec délai pour éviter le rate limiting
        const results = [];
        for (let index = 0; index < participantIds.length; index++) {
            const participantId = participantIds[index];

            try {
                const participantResult = await getUserProfile(participantId);
                if (!participantResult.profile) {
                    console.warn(`⚠️  Participant ${index + 1}/${participantIds.length} (ID: ${participantId}) introuvable`);
                    results.push({ success: false, error: "Participant introuvable" });
                    continue;
                }
                const participant = participantResult.profile;

                const recipientName = participant.first_name && participant.last_name
                    ? `${participant.first_name} ${participant.last_name}`
                    : participant.email;

                const html = eventDeletedTemplate(recipientName, eventTitle, eventDate, deleterName);

                console.log(`📤 Envoi email ${index + 1}/${participantIds.length} à ${participant.email}...`);
                const result = await resend!.emails.send({
                    from: FROM_EMAIL,
                    to: participant.email,
                    subject: `Événement annulé : ${eventTitle}`,
                    html,
                });

                // Vérifier si Resend a retourné une erreur
                if (result.error) {
                    console.error(`❌ Erreur Resend pour email ${index + 1}:`, result.error);

                    // Si rate limit, attendre et réessayer
                    if (result.error.name === 'rate_limit_exceeded') {
                        console.log(`⏳ Rate limit atteint, attente de 1 seconde et réessai...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Réessayer
                        const retryResult = await resend!.emails.send({
                            from: FROM_EMAIL,
                            to: participant.email,
                            subject: `Événement annulé : ${eventTitle}`,
                            html,
                        });

                        if (retryResult.error) {
                            console.error(`❌ Échec après retry pour email ${index + 1}`);
                            results.push({ success: false, error: retryResult.error.message });
                            continue;
                        }

                        console.log(`✅ Email ${index + 1}/${participantIds.length} envoyé après retry (ID: ${retryResult.data?.id})`);
                        results.push({ success: true, emailId: retryResult.data?.id });
                    } else {
                        results.push({ success: false, error: result.error.message });
                    }
                    continue;
                }

                const emailId = result.data?.id;
                console.log(`✅ Email ${index + 1}/${participantIds.length} envoyé (ID: ${emailId})`);
                results.push({ success: true, emailId });

                // Délai de 600ms entre chaque email pour respecter le rate limit
                if (index < participantIds.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
            } catch (error) {
                console.error(`❌ Exception lors de l'envoi email ${index + 1}:`, error);
                results.push({ success: false, error: error instanceof Error ? error.message : "Erreur inconnue" });
            }
        }

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`📊 Résultat envoi: ${succeeded}/${participantIds.length} réussi(s), ${failed} échec(s)`);

        if (failed > 0) {
            console.warn(`⚠️  ${failed} email(s) n'ont pas pu être envoyés`);
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de l'envoi des notifications de suppression:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
