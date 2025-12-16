import { Marker, Popup } from "react-leaflet";
import { Badge } from "@/components/shadcn/badge";
import { MapPin, Users, Clock, UserCheck, Globe } from "lucide-react";
import { LatLngExpression } from "leaflet";
import "./leaflet-popup.css";

interface ClasInfos {
    name: string;
    location: string;
    description: string | null;
    gradeLevels: string;
    allophoneCount: string;
    capacity: string;
    schedule: string;
    coordinators: string[];
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
                    <div>
                        <h3 className="font-semibold text-sm mb-1">{infos.name}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{infos.location}</span>
                        </div>
                    </div>

                    {infos.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {infos.description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="default" className="text-xs">
                            {infos.gradeLevels}
                        </Badge>
                        {allophoneNum > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {allophoneNum} allophone{allophoneNum > 1 ? "s" : ""}
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
                                    {infos.coordinators.join(", ")}
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
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};
