import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Graceful degradation : ne pas crasher l'app si la clé n'est pas configurée
export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const FROM_EMAIL = "notifications@valentinrnld.com";

/**
 * Vérifie si Resend est configuré et prêt à envoyer des emails
 */
export function isResendEnabled(): boolean {
    if (!resend) {
        console.warn("⚠️  Resend n'est pas configuré. Ajoutez RESEND_API_KEY dans .env pour activer les notifications email.");
        return false;
    }
    return true;
}
