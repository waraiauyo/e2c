import { Marker, Popup } from "react-leaflet";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { MapPin, Users, Clock, UserCheck, Globe } from "lucide-react";
import { LatLngExpression } from "leaflet";
import type { GradeLevel } from "@/types/database";
import "./leaflet-popup.css";

const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
    primary: "Primaire",
    middle_school: "Collège",
};

interface TeamMember {
    name: string;
    email: string | null;
}

interface ClasInfos {
    id: string;
    name: string;
    logoUrl: string | null;
    location: string;
    description: string | null;
    gradeLevel: GradeLevel;
    currentProject: string | null;
    websiteUrl: string | null;
    allophoneCount: string;
    capacity: string;
    schedule: string;
    coordinators: TeamMember[];
    directors: TeamMember[];
    animatorCount: number;
}

interface ClasMarkerProps {
    position: LatLngExpression;
    infos: ClasInfos;
}

export const ClasMarker = ({ position, infos }: ClasMarkerProps) => {
    const allophoneNum = parseInt(infos.allophoneCount) || 0;

    return (
        <Marker position={position}>
            <Popup>
                <div className="min-w-[280px] space-y-3 pr-3">
                    <div className="flex items-start gap-3">
                        {infos.logoUrl && (
                            <Image
                                src={infos.logoUrl}
                                alt={`Logo ${infos.name}`}
                                width={40}
                                height={40}
                                className="rounded object-contain shrink-0"
                            />
                        )}
                        <div>
                            <h3 className="font-semibold text-sm mb-1">
                                {infos.name}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>{infos.location}</span>
                            </div>
                        </div>
                    </div>

                    {infos.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {infos.description}
                        </p>
                    )}

                    {infos.currentProject && (
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                                Projet de l&apos;année
                            </span>
                            <p className="text-xs font-medium">
                                {infos.currentProject}
                            </p>
                        </div>
                    )}

                    {infos.websiteUrl && (
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                                Site web
                            </span>
                            <p className="text-xs font-medium">
                                <a
                                    href={infos.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    {infos.websiteUrl}
                                </a>
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="default" className="text-xs">
                            {GRADE_LEVEL_LABELS[infos.gradeLevel]}
                        </Badge>
                        {allophoneNum > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {allophoneNum} allophone
                                {allophoneNum > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>

                    <div className="pt-3 border-t space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                Capacité
                            </span>
                            <span className="font-medium text-xs">
                                {infos.capacity} élèves
                            </span>
                        </div>

                        {infos.coordinators.length > 0 && (
                            <div className="space-y-1">
                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UserCheck className="h-3 w-3" />
                                    Coordination
                                </span>
                                <p className="text-xs font-medium">
                                    {infos.coordinators.map((c, i) => (
                                        <span key={i}>
                                            {i > 0 && ", "}
                                            {c.email ? (
                                                <a
                                                    href={`mailto:${c.email}`}
                                                    className="underline"
                                                >
                                                    {c.name}
                                                </a>
                                            ) : (
                                                c.name
                                            )}
                                        </span>
                                    ))}
                                </p>
                            </div>
                        )}

                        {infos.directors.length > 0 && (
                            <div className="space-y-1">
                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UserCheck className="h-3 w-3" />
                                    Direction
                                </span>
                                <p className="text-xs font-medium">
                                    {infos.directors.map((d, i) => (
                                        <span key={i}>
                                            {i > 0 && ", "}
                                            {d.email ? (
                                                <a
                                                    href={`mailto:${d.email}`}
                                                    className="underline"
                                                >
                                                    {d.name}
                                                </a>
                                            ) : (
                                                d.name
                                            )}
                                        </span>
                                    ))}
                                </p>
                            </div>
                        )}

                        {infos.animatorCount > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    Animateurs
                                </span>
                                <span className="font-medium text-xs">
                                    {infos.animatorCount}
                                </span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Horaires
                            </span>
                            <p className="text-xs bg-muted text-muted-foreground p-2 rounded-md whitespace-pre-line">
                                {infos.schedule}
                            </p>
                        </div>

                        <Button asChild size="sm" className="w-full">
                            <Link href={`/clas/${infos.id}`}>Voir plus</Link>
                        </Button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};
