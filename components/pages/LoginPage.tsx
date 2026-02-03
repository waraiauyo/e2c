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
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { loginUser } from "@/lib/redux/features/userSlice";
import { useCookieConsent } from "@/components/providers/CookieConsentProvider";
import { Cookie } from "lucide-react";

const loginFormSchema = z.object({
    email: z
        .string()
        .min(1, { message: "L'email est requis." })
        .email({ message: "Email invalide." }),
    password: z.string().min(1, { message: "Le mot de passe est requis." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.user);
    const { isAccepted, isLoaded } = useCookieConsent();

    const canLogin = isLoaded && isAccepted;

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            await dispatch(
                loginUser({ email: values.email, password: values.password })
            ).unwrap();
            router.push("/");
        } catch (error) {
            toast.error(
                typeof error === "string"
                    ? error
                    : "Une erreur est survenue lors de la connexion."
            );
        }
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
                            <CardFooter className="flex-col gap-4 px-0 pt-6">
                                {!canLogin && isLoaded && (
                                    <Alert variant="destructive">
                                        <Cookie className="h-4 w-4" />
                                        <AlertDescription>
                                            Vous devez accepter les cookies pour
                                            vous connecter.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <Button
                                    disabled={isLoading || !canLogin}
                                    type="submit"
                                    className="w-full"
                                >
                                    {isLoading ? "Connexion..." : "Se connecter"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
