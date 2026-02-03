"use client";

import { useCookieConsent } from "@/components/providers/CookieConsentProvider";
import { Button } from "@/components/shadcn/button";
import { X, Cookie } from "lucide-react";
import Link from "next/link";

export function CookieBanner() {
    const { showBanner, accept, dismiss } = useCookieConsent();

    // Ne pas afficher si déjà accepté ou fermé temporairement
    if (!showBanner) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <Cookie className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Ce site utilise des cookies
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Nous utilisons des cookies essentiels pour
                            l&apos;authentification et le bon fonctionnement du
                            site. Sans ces cookies, vous ne pourrez pas vous
                            connecter à votre compte.{" "}
                            <Link
                                href="/privacy-policy"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                En savoir plus
                            </Link>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button onClick={accept} className="flex-1 sm:flex-none">
                        Accepter
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={dismiss}
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
