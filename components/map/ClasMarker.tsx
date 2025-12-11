import { Marker, Popup } from "react-leaflet";
import { Badge } from "@/components/shadcn/badge";
import { Separator } from "@/components/shadcn/separator";
import { MapPin, Users, Clock } from "lucide-react";
import { LatLngExpression } from "leaflet";

//TODO : Rendre ce front plus "shadcn"

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
        <Popup className="clas-popup">
            <div className="min-w-[240px] p-1">
                <div className="mb-3">
                    <h3 className="font-bold text-base leading-tight mb-1 text-black">
                        {infos.name}
                    </h3>
                    <div className="flex items-center text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {infos.location}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="default" className="text-[10px] px-2 h-5">
                        {infos.gradeLevels}
                    </Badge>
                    {parseInt(infos.allophoneCount) > 0 && (
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-2 h-5"
                        >
                            Allophones
                        </Badge>
                    )}
                </div>

                <Separator className="my-2" />

                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center text-xs text-muted-foreground">
                            <Users className="w-3 h-3 mr-1" /> Capacité
                        </span>
                        <span className="font-medium text-xs">
                            {infos.capacity} élèves
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" /> Horaires
                        </span>
                        <p className="text-xs bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-line">
                            {infos.schedule}
                        </p>
                    </div>
                </div>
            </div>
        </Popup>
    </Marker>
);
