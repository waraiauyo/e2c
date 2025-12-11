import { Marker, Popup } from "react-leaflet";
import { Badge } from "@/components/shadcn/badge";
import { MapPin, Users, Clock } from "lucide-react";
import { LatLngExpression } from "leaflet";
import "./leaflet-popup.css";

interface ClasInfos {
    name: string;
    location: string;
    gradeLevels: string;
    allophoneCount: string;
    capacity: string;
    schedule: string;
}

interface ClasMarkerProps {
    position: LatLngExpression;
    infos: ClasInfos;
}

export const ClasMarker = ({ position, infos }: ClasMarkerProps) => (
    <Marker position={position}>
        <Popup>
            <div className="min-w-[240px] space-y-3">
                <div>
                    <h3 className="font-semibold text-sm mb-1">{infos.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>{infos.location}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="default" className="text-xs">
                        {infos.gradeLevels}
                    </Badge>
                    {parseInt(infos.allophoneCount) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            Allophones
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
