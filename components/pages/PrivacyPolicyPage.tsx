"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="-ml-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Politique de confidentialité
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-lg font-semibold">
                                1. Introduction
                            </h2>
                            <p className="text-muted-foreground">
                                E2C (Espace collaboratif du CLAS) s&apos;engage
                                à protéger la vie privée de ses utilisateurs.
                                Cette politique de confidentialité explique
                                comment nous collectons, utilisons et protégeons
                                vos données personnelles.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">
                                2. Données collectées
                            </h2>
                            <p className="text-muted-foreground">
                                Nous collectons les données suivantes :
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>
                                    Informations de compte (nom, prénom, email)
                                </li>
                                <li>
                                    Données d&apos;authentification (tokens de
                                    session)
                                </li>
                                <li>
                                    Informations liées à votre activité sur la
                                    plateforme
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">
                                3. Utilisation des cookies
                            </h2>
                            <p className="text-muted-foreground">
                                Nous utilisons des cookies essentiels pour :
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>
                                    Maintenir votre session de connexion active
                                </li>
                                <li>Assurer la sécurité de votre compte</li>
                                <li>
                                    Permettre le bon fonctionnement de
                                    l&apos;application
                                </li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                Sans ces cookies, vous ne pourrez pas vous
                                connecter à votre compte ni utiliser les
                                fonctionnalités de la plateforme.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">
                                4. Stockage des données
                            </h2>
                            <p className="text-muted-foreground">
                                Vos données sont stockées de manière sécurisée
                                sur des serveurs Supabase situés en Europe. Nous
                                appliquons des mesures de sécurité appropriées
                                pour protéger vos informations contre tout accès
                                non autorisé.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">
                                5. Vos droits
                            </h2>
                            <p className="text-muted-foreground">
                                Conformément au RGPD, vous disposez des droits
                                suivants :
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Droit d&apos;accès à vos données</li>
                                <li>Droit de rectification de vos données</li>
                                <li>
                                    Droit à l&apos;effacement de vos données
                                </li>
                                <li>Droit à la portabilité de vos données</li>
                                <li>
                                    Droit d&apos;opposition au traitement de vos
                                    données
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">
                                6. Contact
                            </h2>
                            <p className="text-muted-foreground">
                                Pour toute question concernant cette politique
                                de confidentialité ou pour exercer vos droits,
                                veuillez nous contacter à l&apos;adresse email
                                fournie par votre coordinateur CLAS.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">
                                7. Modifications
                            </h2>
                            <p className="text-muted-foreground">
                                Nous nous réservons le droit de modifier cette
                                politique de confidentialité à tout moment. Les
                                modifications seront publiées sur cette page.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
