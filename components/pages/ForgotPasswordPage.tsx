"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/shadcn/form";
import { useState } from "react";
import { sendPasswordResetEmail } from "@/lib/supabase/auth";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const forgotPasswordFormSchema = z.object({
    email: z
        .string()
        .min(1, { message: "L'email est requis." })
        .email({ message: "Email invalide." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordFormSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = (values: ForgotPasswordFormValues) => {
        setLoading(true);

        sendPasswordResetEmail(values.email)
            .then((res) => {
                if (res.success) {
                    setEmailSent(true);
                    toast.success(res.message);
                } else {
                    toast.error(res.message);
                }
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Mot de passe oublié</CardTitle>
                    <CardDescription>
                        {emailSent
                            ? "Vérifiez votre boîte email pour réinitialiser votre mot de passe."
                            : "Entrez votre email pour recevoir un lien de réinitialisation."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!emailSent ? (
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-6"
                            >
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="exemple@email.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full"
                                >
                                    {loading
                                        ? "Envoi en cours..."
                                        : "Envoyer le lien"}
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground">
                                Un email a été envoyé à{" "}
                                <strong>{form.getValues("email")}</strong>.
                                Cliquez sur le lien dans l&apos;email pour
                                réinitialiser votre mot de passe.
                            </p>
                        </div>
                    )}
                    <div className="pt-4 mt-4 border-t">
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour à la connexion
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
