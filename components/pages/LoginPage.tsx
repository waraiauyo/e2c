"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { login } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const loginFormSchema = z.object({
    email: z
        .string()
        .min(1, { message: "L'email est requis." })
        .email({ message: "Email invalide." }),
    password: z.string().min(1, { message: "Le mot de passe est requis." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: LoginFormValues) => {
        setLoading(true);

        login(values.email, values.password)
            .then((res) => {
                if (res.success) {
                    router.push("/");
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
                    <CardTitle>Connexion à votre compte E2C</CardTitle>
                    <CardDescription>
                        Entrez votre email ci-dessous pour vous connecter.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-6">
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
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center">
                                                <FormLabel>
                                                    Mot de passe
                                                </FormLabel>
                                                <Link
                                                    href="/forgot-password"
                                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                                >
                                                    Mot de passe oublié ?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <CardFooter className="flex-col gap-2 px-0 pt-6">
                                <Button
                                    loading={loading}
                                    type="submit"
                                    className="w-full"
                                >
                                    Se connecter
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
