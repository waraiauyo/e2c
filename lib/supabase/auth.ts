"use server";

import { createClient } from "@/lib/supabase/server";

export interface LoginResult {
    success: boolean;
    message: string;
}

export interface LogoutResult {
    success: boolean;
    message: string;
}

export async function login(
    email: string,
    password: string
): Promise<LoginResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                message:
                    error.message === "Invalid login credentials"
                        ? "Identifiants de connexion invalides."
                        : error.message,
            };
        }

        if (!data.user) {
            return {
                success: false,
                message: "Erreur lors de la connexion.",
            };
        }

        return {
            success: true,
            message: "Connexion réussie.",
        };
    } catch (err) {
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la connexion.",
        };
    }
}

export async function logout(): Promise<LogoutResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: "Déconnexion réussie.",
        };
    } catch (err) {
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la déconnexion.",
        };
    }
}

export async function getUser() {
    const supabase = await createClient();

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            return {
                user: null,
                error: error.message,
            };
        }

        return {
            user,
            error: null,
        };
    } catch (err) {
        return {
            user: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération de l'utilisateur.",
        };
    }
}

export interface ForgotPasswordResult {
    success: boolean;
    message: string;
}

export async function sendPasswordResetEmail(
    email: string
): Promise<ForgotPasswordResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
        });

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: "Un email de réinitialisation a été envoyé à votre adresse.",
        };
    } catch (err) {
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de l'envoi de l'email.",
        };
    }
}

export interface ResetPasswordResult {
    success: boolean;
    message: string;
}

export async function updatePassword(
    newPassword: string
): Promise<ResetPasswordResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: "Mot de passe mis à jour avec succès.",
        };
    } catch (err) {
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la mise à jour du mot de passe.",
        };
    }
}
