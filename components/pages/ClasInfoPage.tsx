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
    const directors = getMembersByRole("directeur");
    const animators = getMembersByRole("animator");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white">
                <LoadingSpinner size="lg" className="text-[#005E84]" />
            </div>
        );
    }

    if (error || !clas) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-4 bg-white">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-[#005E84]">
                        CLAS non trouvé
                    </h2>
                    <p className="text-muted-foreground">
                        Ce CLAS n'existe pas ou a été supprimé.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-[#005E84] text-[#005E84] hover:bg-[#F4F4F4]"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
        );
    }

    const allophoneNum = parseInt(clas.allophone_count || "0") || 0;

    return (
        <div className="flex flex-col items-center p-6 space-y-6 bg-white min-h-full">
            <div className="flex items-center gap-4 w-full max-w-4xl">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="hover:bg-[#F4F4F4] text-[#005E84]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold text-[#1E3231]">
                    Informations du CLAS
                </h1>
            </div>
            <Card className="w-full max-w-4xl border-[#E2E8F0] shadow-sm bg-white">
                <CardHeader>
                    <div className="flex items-start gap-4">
                        {clas.logo_url ? (
                            <Image
                                src={clas.logo_url}
                                alt={`Logo ${clas.name}`}
                                width={64}
                                height={64}
                                className="rounded-lg object-contain shrink-0 border border-[#F4F4F4]"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-lg bg-[#F4F4F4] flex items-center justify-center shrink-0">
                                <Building2 className="h-8 w-8 text-[#005E84]/40" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-2">
                            <CardTitle className="text-xl break-words text-[#005E84]">
                                {clas.name}
                            </CardTitle>
                            {clas.location && (
                                <CardDescription className="flex items-start gap-2 text-[#1E3231]/80">
                                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#DEAA00]" />
                                    <span className="break-words">
                                        {clas.location}
                                    </span>
                                </CardDescription>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[#005E84] hover:bg-[#004d6e] text-white">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {GRADE_LEVEL_LABELS[clas.grade_level]}
                        </Badge>
                        {allophoneNum > 0 && (
                            <Badge className="bg-[#E9B44C] hover:bg-[#d8a035] text-[#1E3231]">
                                <Globe className="h-3 w-3 mr-1" />
                                {allophoneNum} allophone
                                {allophoneNum > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                    {clas.public_description && (
                        <>
                            <Separator className="bg-[#F4F4F4]" />
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm text-[#005E84]">
                                    Description
                                </h3>
                                <p className="text-sm leading-relaxed text-[#1E3231]">
                                    {clas.public_description}
                                </p>
                            </div>
                        </>
                    )}
                    {clas.website_url && (
                        <>
                            <Separator className="bg-[#F4F4F4]" />
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm text-[#005E84] flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Site web
                                </h3>
                                <a
                                    href={clas.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#005E84] underline underline-offset-4 hover:text-[#DEAA00] break-all transition-colors"
                                >
                                    {clas.website_url}
                                </a>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2 w-full max-w-4xl">
                <Card className="bg-[#F4F4F4] border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-[#005E84]">
                            <Users className="h-5 w-5" />
                            Capacité
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#E2E8F0]">
                            <span className="text-sm text-muted-foreground">
                                Élèves
                            </span>
                            <span className="font-medium text-[#1E3231]">
                                {clas.capacity || "Non renseigné"}
                            </span>
                        </div>
                        {clas.volunteer_count !== null &&
                            clas.volunteer_count > 0 && (
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#E2E8F0]">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-[#DEAA00]" />
                                        Bénévoles
                                    </span>
                                    <span className="font-medium text-[#1E3231]">
                                        {clas.volunteer_count}
                                    </span>
                                </div>
                            )}
                    </CardContent>
                </Card>
                <Card className="bg-[#F4F4F4] border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-[#005E84]">
                            <Clock className="h-5 w-5" />
                            Horaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {clas.schedule ? (
                            <p className="text-sm bg-white p-3 rounded-md whitespace-pre-line break-words border border-[#E2E8F0] text-[#1E3231]">
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
            <Card className="w-full max-w-4xl border-[#E2E8F0] shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-[#005E84]">
                        <UserCheck className="h-5 w-5 text-[#DEAA00]" />
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
                            {coordinators.length > 0 && (
                                <Separator className="bg-[#F4F4F4]" />
                            )}
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
                                directors.length > 0) && (
                                <Separator className="bg-[#F4F4F4]" />
                            )}
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
                <Card className="w-full max-w-4xl border-[#E2E8F0] shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-[#005E84]">
                            <Phone className="h-5 w-5 text-[#DEAA00]" />
                            Contacts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {clas.raw_contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-start gap-3 p-3 bg-[#F4F4F4] rounded-lg border border-transparent hover:border-[#E9B44C] transition-colors"
                                >
                                    <Avatar className="h-10 w-10 border border-white">
                                        <AvatarFallback className="bg-[#005E84] text-white">
                                            {getInitials(contact.name || "")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        {contact.name && (
                                            <p className="font-medium text-sm text-[#1E3231]">
                                                {contact.name}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground min-w-0 w-full">
                                            {contact.email && (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="flex items-center gap-1 hover:text-[#005E84] min-w-0"
                                                >
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">
                                                        {contact.email}
                                                    </span>
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a
                                                    href={`tel:${contact.phone}`}
                                                    className="flex items-center gap-1 hover:text-[#005E84] shrink-0"
                                                >
                                                    <Phone className="h-3 w-3 shrink-0" />
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
            <h4 className="font-medium text-sm text-[#005E84]">{title}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
                {members.map((member) => {
                    const name = getMemberName(member);
                    const email = getMemberEmail(member);
                    const phone = getMemberPhone(member);
                    const avatar = getMemberAvatar(member);

                    return (
                        <div
                            key={member.id}
                            className="flex items-start gap-3 p-3 bg-[#F4F4F4] rounded-lg border border-transparent hover:border-[#E9B44C] transition-colors"
                        >
                            <Avatar className="h-10 w-10 border border-white">
                                {avatar && (
                                    <AvatarImage src={avatar} alt={name} />
                                )}
                                <AvatarFallback className="bg-[#005E84] text-white">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-medium text-sm truncate text-[#1E3231]">
                                    {name}
                                </p>
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    {email && (
                                        <a
                                            href={`mailto:${email}`}
                                            className="flex items-center gap-1 hover:text-[#005E84] min-w-0 max-w-full"
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
                                            className="flex items-center gap-1 hover:text-[#005E84]"
                                        >
                                            <Phone className="h-3 w-3 shrink-0" />
                                            {phone}
                                        </a>
                                    )}
                                </div>
                                {member.notes && (
                                    <p className="text-xs text-muted-foreground italic break-words">
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
