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
import { updatePassword } from "@/lib/supabase/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const resetPasswordFormSchema = z
    .object({
        password: z.string().min(8, {
            message: "Le mot de passe doit contenir au moins 8 caractères.",
        }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Les mots de passe ne correspondent pas.",
        path: ["confirmPassword"],
    });

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordFormSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = (values: ResetPasswordFormValues) => {
        setLoading(true);

        updatePassword(values.password)
            .then((res) => {
                if (res.success) {
                    toast.success(res.message);
                    router.push("/login");
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
                    <CardTitle>Réinitialiser le mot de passe</CardTitle>
                    <CardDescription>
                        Entrez votre nouveau mot de passe ci-dessous.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex flex-col gap-6"
                        >
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Nouveau mot de passe
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Confirmer le mot de passe
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
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
                                    ? "Réinitialisation..."
                                    : "Réinitialiser le mot de passe"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
