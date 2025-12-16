"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { setProfile, logoutUser } from "@/lib/redux/features/userSlice";
import {
    getUserClasWithRoles,
    type ClasWithRole,
} from "@/lib/supabase/query/clas";
import { uploadAvatar } from "@/lib/supabase/actions/storage";
import { updateAvatarUrl, updatePhone } from "@/lib/supabase/actions/profiles";
import { updateEmail } from "@/lib/supabase/auth";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/shadcn/card";
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Badge } from "@/components/shadcn/badge";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/shadcn/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Loader2,
    Camera,
    Mail,
    User,
    Building2,
    X,
    LogOut,
    Phone,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";

const emailFormSchema = z.object({
    email: z
        .string()
        .min(1, { message: "L'email est requis." })
        .email({ message: "Email invalide." }),
});

const phoneFormSchema = z.object({
    phone: z
        .string()
        .min(1, { message: "Le numéro de téléphone est requis." })
        .regex(/^[0-9\s\-\+\.]+$/, { message: "Numéro de téléphone invalide." }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type PhoneFormValues = z.infer<typeof phoneFormSchema>;

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        user,
        profile,
        isLoading: userLoading,
    } = useAppSelector((state) => state.user);

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [updatingEmail, setUpdatingEmail] = useState(false);
    const [updatingPhone, setUpdatingPhone] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [userClas, setUserClas] = useState<ClasWithRole[]>([]);
    const [loadingClas, setLoadingClas] = useState(true);
    const [emailMessage, setEmailMessage] = useState<{
        type: "info" | "success";
        text: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailFormSchema),
        defaultValues: { email: "" },
    });

    const phoneForm = useForm<PhoneFormValues>({
        resolver: zodResolver(phoneFormSchema),
        defaultValues: { phone: profile?.phone || "" },
    });

    // Handle URL messages from email verification
    useEffect(() => {
        const queryMessage = searchParams.get("message");
        const hashMessage =
            typeof window !== "undefined"
                ? new URLSearchParams(window.location.hash.substring(1)).get(
                      "message"
                  )
                : null;

        const message = queryMessage || hashMessage;

        if (message) {
            if (
                message.includes("Confirmation link accepted") ||
                message.includes("confirm link sent to the other email")
            ) {
                setEmailMessage({
                    type: "info",
                    text: "Lien de confirmation accepté. Veuillez également confirmer le lien envoyé à votre ancienne adresse email.",
                });
            } else if (message.includes("Email updated")) {
                setEmailMessage({
                    type: "success",
                    text: "Email mis à jour avec succès !",
                });
            }

            router.replace("/profil");
        }
    }, [searchParams, router]);

    // Load user CLAS on mount
    useEffect(() => {
        if (profile?.id) {
            getUserClasWithRoles(profile.id).then((result) => {
                if (result.clas) {
                    setUserClas(result.clas);
                }
                setLoadingClas(false);
            });
        }
    }, [profile?.id]);

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La taille du fichier ne doit pas dépasser 5 Mo.");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Le fichier doit être une image.");
            return;
        }

        setUploadingAvatar(true);

        try {
            const uploadResult = await uploadAvatar(user.id, file);

            if (!uploadResult.success) {
                toast.error(uploadResult.error || "Erreur lors de l'upload.");
                return;
            }

            const updateResult = await updateAvatarUrl(
                user.id,
                uploadResult.avatarUrl!
            );

            if (!updateResult.success) {
                toast.error(updateResult.message);
                return;
            }

            dispatch(
                setProfile({
                    ...profile!,
                    avatar_url: uploadResult.avatarUrl!,
                })
            );

            toast.success("Avatar mis à jour avec succès.");
        } catch {
            toast.error("Une erreur est survenue lors de l'upload.");
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const onEmailSubmit = async (values: EmailFormValues) => {
        if (values.email === user?.email) {
            toast.error("Veuillez entrer une nouvelle adresse email.");
            return;
        }

        setUpdatingEmail(true);

        try {
            const result = await updateEmail(values.email);

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            setEmailMessage({
                type: "info",
                text: result.message,
            });
            emailForm.reset({ email: "" });
        } catch {
            toast.error("Une erreur est survenue lors de la mise à jour.");
        } finally {
            setUpdatingEmail(false);
        }
    };

    const onPhoneSubmit = async (values: PhoneFormValues) => {
        if (!user) return;

        if (values.phone === profile?.phone) {
            toast.error("Veuillez entrer un nouveau numéro de téléphone.");
            return;
        }

        setUpdatingPhone(true);

        try {
            const result = await updatePhone(user.id, values.phone);

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            dispatch(
                setProfile({
                    ...profile!,
                    phone: values.phone,
                })
            );

            toast.success(result.message);
        } catch {
            toast.error("Une erreur est survenue lors de la mise à jour.");
        } finally {
            setUpdatingPhone(false);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);

        try {
            await dispatch(logoutUser()).unwrap();
            toast.success("Déconnexion réussie.");
            router.push("/login");
        } catch {
            toast.error("Une erreur est survenue lors de la déconnexion.");
            setLoggingOut(false);
        }
    };

    const getInitials = () => {
        if (!profile) return "?";
        const first = profile.first_name?.charAt(0) || "";
        const last = profile.last_name?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    };

    const getAccountTypeLabel = (accountType: string) => {
        const labels: Record<string, string> = {
            coordinator: "Coordinateur",
            animator: "Animateur",
            admin: "Administrateur",
        };
        return labels[accountType] || accountType;
    };

    return userLoading || !profile ? (
        <div className="flex items-center justify-center w-full h-full">
            <LoadingSpinner size="lg" />
        </div>
    ) : (
        <div className="flex flex-col items-center p-6 space-y-6">
            {emailMessage && (
                        <div
                            className={`w-full max-w-4xl rounded-lg border p-4 ${
                                emailMessage.type === "success"
                                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200"
                                    : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 mt-1 shrink-0" />
                                    <p className="text-sm font-medium">
                                        {emailMessage.text}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => setEmailMessage(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <Card className="w-full max-w-4xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                Photo de profil
                            </CardTitle>
                            <CardDescription>
                                Modifiez votre photo de profil (5 Mo maximum)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage
                                        src={profile.avatar_url || undefined}
                                        alt="Avatar"
                                    />
                                    <AvatarFallback className="text-2xl">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingAvatar}
                                    />
                                    <Button
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={uploadingAvatar}
                                        variant="outline"
                                    >
                                        {uploadingAvatar ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Téléchargement...
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="mr-2 h-4 w-4" />
                                                Modifier l&apos;avatar
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-sm text-muted-foreground">
                                        Formats acceptés : JPG, PNG, GIF, WEBP
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="w-full max-w-4xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informations du profil
                            </CardTitle>
                            <CardDescription>
                                Vos informations personnelles
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Nom complet</Label>
                                <div className="mt-2 text-sm">
                                    {profile.first_name && profile.last_name
                                        ? `${profile.first_name} ${profile.last_name}`
                                        : profile.first_name ||
                                          profile.last_name ||
                                          "Non renseigné"}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label>Type de compte</Label>
                                <div className="mt-2">
                                    <Badge
                                        variant="secondary"
                                        className="text-sm"
                                    >
                                        {getAccountTypeLabel(
                                            profile.account_type
                                        )}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label>CLAS associés</Label>
                                <div className="mt-2 space-y-2">
                                    {loadingClas ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">
                                                Chargement...
                                            </span>
                                        </div>
                                    ) : userClas.length > 0 ? (
                                        userClas.map((clas) => (
                                            <div
                                                key={clas.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {clas.name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {clas.role === "coordinator"
                                                        ? "Coordinateur"
                                                        : "Animateur"}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Aucun CLAS associé
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="w-full max-w-4xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Numéro de téléphone
                            </CardTitle>
                            <CardDescription>
                                Modifiez votre numéro de téléphone
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label>Téléphone actuel</Label>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        {profile.phone || "Non renseigné"}
                                    </div>
                                </div>

                                <Separator />

                                <Form {...phoneForm}>
                                    <form
                                        onSubmit={phoneForm.handleSubmit(
                                            onPhoneSubmit
                                        )}
                                        className="space-y-4"
                                    >
                                        <FormField
                                            control={phoneForm.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Nouveau numéro
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="tel"
                                                            placeholder="06 12 34 56 78"
                                                            disabled={
                                                                updatingPhone
                                                            }
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={updatingPhone}
                                            className="w-full"
                                        >
                                            {updatingPhone ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Modification...
                                                </>
                                            ) : (
                                                "Modifier le téléphone"
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="w-full max-w-4xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Modifier l&apos;email
                            </CardTitle>
                            <CardDescription>
                                Un email de confirmation sera envoyé à votre
                                nouvelle adresse
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label>Email actuel</Label>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        {user?.email}
                                    </div>
                                </div>

                                <Separator />

                                <Form {...emailForm}>
                                    <form
                                        onSubmit={emailForm.handleSubmit(
                                            onEmailSubmit
                                        )}
                                        className="space-y-4"
                                    >
                                        <FormField
                                            control={emailForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Nouvel email
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="nouveau@email.com"
                                                            disabled={
                                                                updatingEmail
                                                            }
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={updatingEmail}
                                            className="w-full"
                                        >
                                            {updatingEmail ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Modification...
                                                </>
                                            ) : (
                                                "Modifier l'email"
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="w-full max-w-4xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LogOut className="h-5 w-5" />
                                Déconnexion
                            </CardTitle>
                            <CardDescription>
                                Déconnectez-vous de votre compte
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                variant="outline"
                                className="w-full"
                            >
                                {loggingOut ? (
                                    <LoadingSpinner />
                                ) : (
                                    <>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Se déconnecter
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
    );
}
