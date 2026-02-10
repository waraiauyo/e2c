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
import { updateEmail, updatePassword } from "@/lib/supabase/auth";
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
    Lock,
    UserCircle,
    Shield,
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
        .regex(/^[0-9\s\-\+\.]+$/, {
            message: "Numéro de téléphone invalide.",
        }),
});

const passwordFormSchema = z
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

type EmailFormValues = z.infer<typeof emailFormSchema>;
type PhoneFormValues = z.infer<typeof phoneFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

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
    const [updatingPassword, setUpdatingPassword] = useState(false);
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

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
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

    const onPasswordSubmit = async (values: PasswordFormValues) => {
        setUpdatingPassword(true);

        try {
            const result = await updatePassword(values.password);

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            passwordForm.reset();
        } catch {
            toast.error("Une erreur est survenue lors de la mise à jour.");
        } finally {
            setUpdatingPassword(false);
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
            director: "Directeur",
            animator: "Animateur",
            admin: "Administrateur",
        };
        return labels[accountType] || accountType;
    };

    return userLoading || !profile ? (
        <div className="flex items-center justify-center w-full h-full bg-white">
            <LoadingSpinner size="lg" className="text-[#005E84]" />
        </div>
    ) : (
        <div className="flex flex-col items-center p-6 space-y-6 bg-white min-h-full">
            {emailMessage && (
                <div
                    className={`w-full max-w-4xl rounded-lg border p-4 ${
                        emailMessage.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-blue-50 border-blue-200 text-blue-800"
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

            {/* Photo de profil */}
            <Card className="w-full max-w-4xl border border-[#E2E8F0] shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#005E84]">
                        <Camera className="h-5 w-5 text-[#DEAA00]" />
                        Photo de profil
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Modifiez votre photo de profil (5 Mo maximum)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-2 border-[#F4F4F4] shadow-sm">
                            <AvatarImage
                                src={profile.avatar_url || undefined}
                                alt="Avatar"
                            />
                            <AvatarFallback className="text-2xl bg-[#005E84] text-white font-bold">
                                {getInitials()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingAvatar}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                variant="outline"
                                className="border-[#E2E8F0] text-[#005E84] hover:bg-[#F4F4F4] hover:text-[#005E84]"
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
                            <p className="text-xs text-muted-foreground">
                                Formats acceptés : JPG, PNG, GIF, WEBP
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Informations du profil */}
            <Card className="w-full max-w-4xl border border-[#E2E8F0] shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#005E84]">
                        <UserCircle className="h-5 w-5 text-[#DEAA00]" />
                        Informations personnelles
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Vos informations de compte
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-1">
                        <Label className="text-[#1E3231]">Nom complet</Label>
                        <div className="text-sm font-medium text-[#1E3231]">
                            {profile.first_name && profile.last_name
                                ? `${profile.first_name} ${profile.last_name}`
                                : profile.first_name ||
                                  profile.last_name ||
                                  "Non renseigné"}
                        </div>
                    </div>

                    <Separator className="bg-[#F4F4F4]" />

                    <div className="grid gap-2">
                        <Label className="text-[#1E3231]">Type de compte</Label>
                        <div>
                            <Badge className="bg-[#E9B44C] hover:bg-[#d8a035] text-[#1E3231] border-none font-semibold">
                                {getAccountTypeLabel(profile.account_type)}
                            </Badge>
                        </div>
                    </div>

                    <Separator className="bg-[#F4F4F4]" />

                    <div className="grid gap-3">
                        <Label className="text-[#1E3231]">CLAS associés</Label>
                        <div className="space-y-2">
                            {loadingClas ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-[#005E84]" />
                                    <span className="text-sm text-muted-foreground">
                                        Chargement...
                                    </span>
                                </div>
                            ) : userClas.length > 0 ? (
                                userClas.map((clas) => (
                                    <div
                                        key={clas.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-[#F4F4F4] bg-[#FDFDFD]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4 text-[#005E84]" />
                                            <span className="text-sm font-medium text-[#1E3231]">
                                                {clas.name}
                                            </span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="text-xs border-[#DEAA00] text-[#DEAA00] bg-white"
                                        >
                                            {clas.role === "coordinator"
                                                ? "Coordinateur"
                                                : clas.role === "director"
                                                  ? "Directeur"
                                                  : "Animateur"}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Aucun CLAS associé
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Téléphone */}
            <Card className="w-full max-w-4xl border border-[#E2E8F0] shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#005E84]">
                        <Phone className="h-5 w-5 text-[#DEAA00]" />
                        Numéro de téléphone
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Modifiez votre numéro de téléphone
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="grid gap-1">
                            <Label className="text-[#1E3231]">
                                Téléphone actuel
                            </Label>
                            <div className="text-sm font-medium text-[#1E3231]">
                                {profile.phone || "Non renseigné"}
                            </div>
                        </div>

                        <Separator className="bg-[#F4F4F4]" />

                        <Form {...phoneForm}>
                            <form
                                onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={phoneForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#1E3231]">
                                                Nouveau numéro
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="tel"
                                                    placeholder="06 12 34 56 78"
                                                    disabled={updatingPhone}
                                                    className="bg-white border-[#E2E8F0] focus-visible:ring-[#DEAA00]"
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
                                    className="w-full bg-[#005E84] hover:bg-[#004d6e] text-white"
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

            {/* Email */}
            <Card className="w-full max-w-4xl border border-[#E2E8F0] shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#005E84]">
                        <Mail className="h-5 w-5 text-[#DEAA00]" />
                        Modifier l&apos;email
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Un email de confirmation sera envoyé à votre nouvelle
                        adresse
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="grid gap-1">
                            <Label className="text-[#1E3231]">
                                Email actuel
                            </Label>
                            <div className="text-sm font-medium text-[#1E3231]">
                                {user?.email}
                            </div>
                        </div>

                        <Separator className="bg-[#F4F4F4]" />

                        <Form {...emailForm}>
                            <form
                                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#1E3231]">
                                                Nouvel email
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="nouveau@email.com"
                                                    disabled={updatingEmail}
                                                    className="bg-white border-[#E2E8F0] focus-visible:ring-[#DEAA00]"
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
                                    className="w-full bg-[#005E84] hover:bg-[#004d6e] text-white"
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

            {/* Mot de passe */}
            <Card className="w-full max-w-4xl border border-[#E2E8F0] shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#005E84]">
                        <Lock className="h-5 w-5 text-[#DEAA00]" />
                        Modifier le mot de passe
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Changez votre mot de passe de connexion
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form
                            onSubmit={passwordForm.handleSubmit(
                                onPasswordSubmit
                            )}
                            className="space-y-4"
                        >
                            <FormField
                                control={passwordForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#1E3231]">
                                            Nouveau mot de passe
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={updatingPassword}
                                                className="bg-white border-[#E2E8F0] focus-visible:ring-[#DEAA00]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#1E3231]">
                                            Confirmer le mot de passe
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={updatingPassword}
                                                className="bg-white border-[#E2E8F0] focus-visible:ring-[#DEAA00]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                disabled={updatingPassword}
                                className="w-full bg-[#005E84] hover:bg-[#004d6e] text-white"
                            >
                                {updatingPassword ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Modification...
                                    </>
                                ) : (
                                    "Modifier le mot de passe"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Administration */}
            {profile.account_type === "admin" && (
                <div className="w-full max-w-4xl">
                    <Button
                        onClick={() => router.push("/admin")}
                        variant="outline"
                        className="w-full border-[#DEAA00] text-[#DEAA00] hover:bg-[#DEAA00]/10 hover:text-[#DEAA00]"
                    >
                        <Shield className="mr-2 h-4 w-4" />
                        Panneau d&apos;administration
                    </Button>
                </div>
            )}

            {/* Déconnexion */}
            <div className="w-full max-w-4xl">
                <Button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    variant="outline"
                    className="w-full border-[#E2E8F0] text-[#005E84] hover:bg-[#F4F4F4] hover:text-[#005E84]"
                >
                    {loggingOut ? (
                        <LoadingSpinner className="text-[#005E84]" />
                    ) : (
                        <>
                            <LogOut className="mr-2 h-4 w-4" />
                            Se déconnecter
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
