"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getClasWithTeam } from "@/lib/supabase/query/clas";
import type {
    ClasWithTeamAndProfiles,
    ClasTeamMemberWithProfile,
    GradeLevel,
} from "@/types/database";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/shadcn/card";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Separator } from "@/components/shadcn/separator";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";
import {
    ArrowLeft,
    MapPin,
    Users,
    Clock,
    UserCheck,
    Globe,
    GraduationCap,
    Target,
    Mail,
    Phone,
    ExternalLink,
    Building2,
    Heart,
} from "lucide-react";

const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
    primary: "Primaire",
    middle_school: "Collège",
};

interface ClasInfoPageProps {
    clasId: string;
}

export function ClasInfoPage({ clasId }: ClasInfoPageProps) {
    const router = useRouter();
    const [clas, setClas] = useState<ClasWithTeamAndProfiles | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchClas() {
            const result = await getClasWithTeam(clasId);
            if (result.error) {
                setError(result.error);
            } else {
                setClas(result.clas);
            }
            setLoading(false);
        }
        fetchClas();
    }, [clasId]);

    const getMemberName = (member: ClasTeamMemberWithProfile): string => {
        if (member.profile) {
            const fullName =
                `${member.profile.first_name || ""} ${member.profile.last_name || ""}`.trim();
            if (fullName) return fullName;
        }
        return member.name || "Sans nom";
    };

    const getMemberEmail = (
        member: ClasTeamMemberWithProfile
    ): string | null => {
        return member.contact_email || member.profile?.email || null;
    };

    const getMemberPhone = (
        member: ClasTeamMemberWithProfile
    ): string | null => {
        return member.contact_phone || member.profile?.phone || null;
    };

    const getMemberAvatar = (
        member: ClasTeamMemberWithProfile
    ): string | null => {
        return member.profile?.avatar_url || null;
    };

    const getInitials = (name: string): string => {
        if (!name || name === "Sans nom") return "?";
        return name
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getMembersByRole = (role: string) => {
        return clas?.team_members.filter((m) => m.role === role) || [];
    };

    const coordinators = getMembersByRole("coordinator");
    const directors = getMembersByRole("director");
    const animators = getMembersByRole("animator");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !clas) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold">CLAS non trouvé</h2>
                    <p className="text-muted-foreground">
                        {error || "Ce CLAS n'existe pas ou a été supprimé."}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
        );
    }

    const allophoneNum = parseInt(clas.allophone_count || "0") || 0;

    return (
        <div className="flex flex-col p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Informations du CLAS</h1>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        {clas.logo_url ? (
                            <Image
                                src={clas.logo_url}
                                alt={`Logo ${clas.name}`}
                                width={64}
                                height={64}
                                className="rounded-lg object-contain shrink-0"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Building2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1 space-y-2">
                            <CardTitle className="text-xl">
                                {clas.name}
                            </CardTitle>
                            {clas.location && (
                                <CardDescription className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    {clas.location}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="default">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {GRADE_LEVEL_LABELS[clas.grade_level]}
                        </Badge>
                        {allophoneNum > 0 && (
                            <Badge variant="secondary">
                                <Globe className="h-3 w-3 mr-1" />
                                {allophoneNum} allophone
                                {allophoneNum > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                    {clas.public_description && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm text-muted-foreground">
                                    Description
                                </h3>
                                <p className="text-sm leading-relaxed">
                                    {clas.public_description}
                                </p>
                            </div>
                        </>
                    )}
                    {clas.current_project && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Projet de l&apos;année
                                </h3>
                                <p className="text-sm">
                                    {clas.current_project}
                                </p>
                            </div>
                        </>
                    )}
                    {clas.website_url && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Site web
                                </h3>
                                <a
                                    href={clas.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                                >
                                    {clas.website_url}
                                </a>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-5 w-5" />
                            Capacité
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Élèves
                            </span>
                            <span className="font-medium">
                                {clas.capacity || "Non renseigné"}
                            </span>
                        </div>
                        {clas.volunteer_count !== null &&
                            clas.volunteer_count > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Heart className="h-4 w-4" />
                                        Bénévoles
                                    </span>
                                    <span className="font-medium">
                                        {clas.volunteer_count}
                                    </span>
                                </div>
                            )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-5 w-5" />
                            Horaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {clas.schedule ? (
                            <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                                {clas.schedule}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Non renseigné
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <UserCheck className="h-5 w-5" />
                        Équipe
                    </CardTitle>
                    <CardDescription>
                        {clas.team_members.length} membre
                        {clas.team_members.length > 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {coordinators.length > 0 && (
                        <TeamSection
                            title="Coordination"
                            members={coordinators}
                            getMemberName={getMemberName}
                            getMemberEmail={getMemberEmail}
                            getMemberPhone={getMemberPhone}
                            getMemberAvatar={getMemberAvatar}
                            getInitials={getInitials}
                        />
                    )}
                    {directors.length > 0 && (
                        <>
                            {coordinators.length > 0 && <Separator />}
                            <TeamSection
                                title="Direction"
                                members={directors}
                                getMemberName={getMemberName}
                                getMemberEmail={getMemberEmail}
                                getMemberPhone={getMemberPhone}
                                getMemberAvatar={getMemberAvatar}
                                getInitials={getInitials}
                            />
                        </>
                    )}
                    {animators.length > 0 && (
                        <>
                            {(coordinators.length > 0 ||
                                directors.length > 0) && <Separator />}
                            <TeamSection
                                title="Animation"
                                members={animators}
                                getMemberName={getMemberName}
                                getMemberEmail={getMemberEmail}
                                getMemberPhone={getMemberPhone}
                                getMemberAvatar={getMemberAvatar}
                                getInitials={getInitials}
                            />
                        </>
                    )}

                    {clas.team_members.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Aucun membre dans l&apos;équipe
                        </p>
                    )}
                </CardContent>
            </Card>
            {clas.raw_contacts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Phone className="h-5 w-5" />
                            Contacts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {clas.raw_contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>
                                            {getInitials(contact.name || "")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        {contact.name && (
                                            <p className="font-medium text-sm">
                                                {contact.name}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            {contact.email && (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="flex items-center gap-1 hover:text-primary"
                                                >
                                                    <Mail className="h-3 w-3" />
                                                    {contact.email}
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a
                                                    href={`tel:${contact.phone}`}
                                                    className="flex items-center gap-1 hover:text-primary"
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    {contact.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

interface TeamSectionProps {
    title: string;
    members: ClasTeamMemberWithProfile[];
    getMemberName: (member: ClasTeamMemberWithProfile) => string;
    getMemberEmail: (member: ClasTeamMemberWithProfile) => string | null;
    getMemberPhone: (member: ClasTeamMemberWithProfile) => string | null;
    getMemberAvatar: (member: ClasTeamMemberWithProfile) => string | null;
    getInitials: (name: string) => string;
}

function TeamSection({
    title,
    members,
    getMemberName,
    getMemberEmail,
    getMemberPhone,
    getMemberAvatar,
    getInitials,
}: TeamSectionProps) {
    return (
        <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
                {title}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
                {members.map((member) => {
                    const name = getMemberName(member);
                    const email = getMemberEmail(member);
                    const phone = getMemberPhone(member);
                    const avatar = getMemberAvatar(member);

                    return (
                        <div
                            key={member.id}
                            className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                        >
                            <Avatar className="h-10 w-10">
                                {avatar && (
                                    <AvatarImage src={avatar} alt={name} />
                                )}
                                <AvatarFallback>
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-medium text-sm truncate">
                                    {name}
                                </p>
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    {email && (
                                        <a
                                            href={`mailto:${email}`}
                                            className="flex items-center gap-1 hover:text-primary truncate w-fit"
                                        >
                                            <Mail className="h-3 w-3 shrink-0" />
                                            <span className="truncate">
                                                {email}
                                            </span>
                                        </a>
                                    )}
                                    {phone && (
                                        <a
                                            href={`tel:${phone}`}
                                            className="flex items-center gap-1 hover:text-primary w-fit"
                                        >
                                            <Phone className="h-3 w-3 shrink-0" />
                                            {phone}
                                        </a>
                                    )}
                                </div>
                                {member.notes && (
                                    <p className="text-xs text-muted-foreground italic">
                                        {member.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
